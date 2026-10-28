import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { ExtensionBridge } from "./bridge/extension-bridge.js";
import { toAgentMessage } from "./errors.js";

const extensionBridge = new ExtensionBridge();

export const server = new McpServer(
  {
    name: "foundrylens-web-intelligence",
    version: "0.1.0",
  },
  {
    instructions:
      "FoundryLens controls the user's real Chrome browser through the FoundryLens extension. Call browser_tabs first to see open tabs, then pass a tabId to the other tools; when tabId is omitted, the active tab is used. Use browser_open_tab to create a new tab, browser_switch_tab to focus an existing tab, and browser_close_tab to close one. Call browser_inspect before browser_click or browser_type to obtain element refs, which are valid only for the current page state. The extension can access normal http and https websites; Chrome-internal pages cannot be controlled. Use browser_extract to read text or links instead of requesting raw HTML.",
  },
);

function textResult(value: unknown): CallToolResult {
  const text = typeof value === "string" ? value : (JSON.stringify(value) ?? String(value));
  return { content: [{ type: "text", text }] };
}

async function runTool(action: () => Promise<unknown>): Promise<CallToolResult> {
  try {
    return textResult(await action());
  } catch (error) {
    return { content: [{ type: "text", text: toAgentMessage(error) }], isError: true };
  }
}

const tabId = z
  .number()
  .int()
  .positive()
  .optional()
  .describe("Tab ID from browser_tabs. Omit to use the active tab.");

const requiredTabId = z.number().int().positive().describe("Tab ID from browser_tabs.");

const ref = z.string().regex(/^e\d+$/).describe("Element ref from browser_inspect, for example 'e12'.");

const maxElements = z
  .number()
  .int()
  .min(1)
  .max(300)
  .optional()
  .describe("Maximum number of elements to return (default 120).");

const format = z.enum(["text", "links"]).optional().describe("What to extract. Defaults to text.");

const maxChars = z
  .number()
  .int()
  .min(100)
  .max(50_000)
  .optional()
  .describe("Maximum text characters to return (default 8000).");

const maxItems = z
  .number()
  .int()
  .min(1)
  .max(500)
  .optional()
  .describe("Maximum links to return (default 100).");

server.registerTool(
  "browser_tabs",
  {
    description:
      "List the user's open browser tabs with IDs, titles, URLs, and which tab is active. Call this first when the user refers to a specific tab; then pass its ID to the other browser tools.",
  },
  async () => runTool(() => extensionBridge.request("LIST_TABS", {})),
);

server.registerTool(
  "browser_open_tab",
  {
    description:
      "Open a new browser tab at an absolute http or https URL and wait for it to load. Use browser_navigate instead when reusing an existing tab.",
    inputSchema: {
      url: z.string().url().max(2048).describe("Absolute http or https URL to open in the new tab."),
      active: z
        .boolean()
        .optional()
        .describe("Open in the foreground and focus it. Defaults to true; set false to open in the background."),
    },
  },
  async ({ url, active }) =>
    runTool(() => extensionBridge.request("OPEN_TAB", { url, active: active ?? true })),
);

server.registerTool(
  "browser_switch_tab",
  {
    description:
      "Bring an open browser tab to the foreground and focus its window. Get the tabId from browser_tabs.",
    inputSchema: { tabId: requiredTabId },
  },
  async ({ tabId: selectedTabId }) =>
    runTool(() => extensionBridge.request("SWITCH_TAB", { tabId: selectedTabId })),
);

server.registerTool(
  "browser_close_tab",
  {
    description:
      "Close an open browser tab. Get the tabId from browser_tabs. Closing the last tab may close its browser window.",
    inputSchema: { tabId: requiredTabId },
  },
  async ({ tabId: selectedTabId }) =>
    runTool(() => extensionBridge.request("CLOSE_TAB", { tabId: selectedTabId })),
);

server.registerTool(
  "browser_inspect",
  {
    description:
      "Get a compact list of interactive elements, headings, and forms on a page. Each element has a ref that browser_click and browser_type accept. Refs are valid only for the current page state; inspect again after the page changes.",
    inputSchema: { tabId, maxElements },
  },
  async ({ tabId: selectedTabId, maxElements: limit }) =>
    runTool(() => extensionBridge.request("INSPECT_PAGE", { tabId: selectedTabId, maxElements: limit })),
);

server.registerTool(
  "browser_click",
  {
    description:
      "Click an element on a page. Use a ref returned by browser_inspect. Only normal http and https pages can be controlled.",
    inputSchema: { tabId, ref },
  },
  async ({ tabId: selectedTabId, ref: elementRef }) =>
    runTool(() => extensionBridge.request("CLICK_ELEMENT", { tabId: selectedTabId, ref: elementRef })),
);

server.registerTool(
  "browser_type",
  {
    description:
      "Fill a text field, textarea, or editable element on a page. Use a ref returned by browser_inspect. Set submit to press Enter afterwards.",
    inputSchema: {
      tabId,
      ref,
      text: z.string().max(20_000).describe("Text to enter into the target element."),
      submit: z.boolean().optional().describe("Press Enter after filling the element."),
    },
  },
  async ({ tabId: selectedTabId, ref: elementRef, text, submit }) =>
    runTool(() =>
      extensionBridge.request("TYPE_ELEMENT", { tabId: selectedTabId, ref: elementRef, text, submit }),
    ),
);

server.registerTool(
  "browser_navigate",
  {
    description:
      "Navigate a tab to an absolute URL and wait for the page to load. Only normal http and https pages are supported.",
    inputSchema: {
      tabId,
      url: z.string().url().max(2048).describe("Absolute URL to open."),
    },
  },
  async ({ tabId: selectedTabId, url }) =>
    runTool(() => extensionBridge.request("NAVIGATE", { tabId: selectedTabId, url })),
);

server.registerTool(
  "browser_extract",
  {
    description:
      "Extract readable text or links from a page without dumping raw HTML. Use browser_inspect when you need element refs for interaction.",
    inputSchema: { tabId, format, maxChars, maxItems },
  },
  async ({ tabId: selectedTabId, format: selectedFormat, maxChars: characterLimit, maxItems: itemLimit }) =>
    runTool(() =>
      extensionBridge.request("EXTRACT_CONTENT", {
        tabId: selectedTabId,
        format: selectedFormat,
        maxChars: characterLimit,
        maxItems: itemLimit,
      }),
    ),
);

export async function startServer(): Promise<void> {
  await extensionBridge.start();
}

export async function stopServer(): Promise<void> {
  await extensionBridge.stop();
}
