// MCP server: registers browser tools and forwards them to the extension bridge.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { ExtensionBridge } from "./bridge/extension-bridge.js";
import { toAgentMessage } from "./errors.js";

const extensionBridge = new ExtensionBridge();

// Create the MCP server and describe its browser tools to the agent.
export const server = new McpServer(
  {
    name: "Agentium-web-intelligence",
    version: "0.1.0",
  },
  {
    instructions:
      "Agentium controls the user's real Chrome browser through the FoundryLens extension. Call browser_tabs first to see open tabs, then pass a tabId to the other tools; when tabId is omitted, the active tab is used. Use browser_open_tab to create a new tab, browser_switch_tab to focus an existing tab, and browser_close_tab to close one. Call browser_inspect before browser_click or browser_type to obtain element refs, which are valid only for the current page state. The extension can access normal http and https websites; Chrome-internal pages cannot be controlled. Use browser_extract to read text or links instead of requesting raw HTML.",
  },
);

// Wrap a tool result as MCP text content.
function textResult(value: unknown): CallToolResult {
  const text = typeof value === "string" ? value : (JSON.stringify(value) ?? String(value));
  return { content: [{ type: "text", text }] };
}

// Run a bridge request and turn any failure into an MCP error result.
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

// Tab management tools.
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

// Page inspection and interaction tools.
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
  "browser_upload_file",
  {
    description:
      "Upload a file into a file-input element by sending the file as base64 content. Use a ref returned by browser_inspect on an <input type=file> element.",
    inputSchema: {
      tabId,
      ref,
      fileName: z.string().min(1).max(255).describe("Filename to set on the uploaded file."),
      contentBase64: z
        .string()
        .min(1)
        .max(5_000_000)
        .describe("Base64-encoded file content to upload into the file input."),
      mimeType: z.string().max(128).optional().describe("Optional MIME type, such as image/png."),
    },
  },
  async ({ tabId: selectedTabId, ref: elementRef, fileName, contentBase64, mimeType }) =>
    runTool(() =>
      extensionBridge.request("UPLOAD_FILE", {
        tabId: selectedTabId,
        ref: elementRef,
        fileName,
        contentBase64,
        mimeType,
      }),
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
  "browser_back",
  {
    description: "Go backward in the current tab history.",
    inputSchema: { tabId },
  },
  async ({ tabId: selectedTabId }) => runTool(() => extensionBridge.request("GO_BACK", { tabId: selectedTabId })),
);

server.registerTool(
  "browser_forward",
  {
    description: "Go forward in the current tab history.",
    inputSchema: { tabId },
  },
  async ({ tabId: selectedTabId }) => runTool(() => extensionBridge.request("GO_FORWARD", { tabId: selectedTabId })),
);

server.registerTool(
  "browser_reload",
  {
    description: "Reload the page in the selected tab.",
    inputSchema: { tabId },
  },
  async ({ tabId: selectedTabId }) => runTool(() => extensionBridge.request("RELOAD_TAB", { tabId: selectedTabId })),
);

server.registerTool(
  "browser_stop_loading",
  {
    description: "Stop the current page from loading further.",
    inputSchema: { tabId },
  },
  async ({ tabId: selectedTabId }) => runTool(() => extensionBridge.request("STOP_LOADING", { tabId: selectedTabId })),
);

server.registerTool(
  "browser_navigation_state",
  {
    description: "Get the current URL, pending URL, title, and loading status for a tab.",
    inputSchema: { tabId },
  },
  async ({ tabId: selectedTabId }) =>
    runTool(() => extensionBridge.request("GET_NAVIGATION_STATE", { tabId: selectedTabId })),
);

server.registerTool(
  "browser_scroll",
  {
    description: "Scroll the current page by a coordinate or in a direction.",
    inputSchema: {
      tabId,
      x: z.number().int().optional().describe("Horizontal pixel offset to scroll to."),
      y: z.number().int().optional().describe("Vertical pixel offset to scroll to."),
      direction: z.enum(["top", "bottom", "up", "down", "left", "right"]).optional(),
      behavior: z.enum(["auto", "smooth"]).optional(),
    },
  },
  async ({ tabId: selectedTabId, x, y, direction, behavior }) =>
    runTool(() => extensionBridge.request("SCROLL_PAGE", { tabId: selectedTabId, x, y, direction, behavior })),
);

server.registerTool(
  "browser_hover",
  {
    description: "Hover the pointer over an element ref from browser_inspect.",
    inputSchema: { tabId, ref },
  },
  async ({ tabId: selectedTabId, ref: elementRef }) =>
    runTool(() => extensionBridge.request("HOVER_ELEMENT", { tabId: selectedTabId, ref: elementRef })),
);

server.registerTool(
  "browser_screenshot",
  {
    description: "Capture the visible area of a tab as a PNG/JPEG data URL",
    inputSchema: { tabId, fullPage: z.boolean().optional() },
  },
  async ({ tabId: selectedTabId, fullPage }) =>
    runTool(() => extensionBridge.request("CAPTURE_SCREENSHOT", { tabId: selectedTabId, fullPage })),
);

server.registerTool(
  "browser_download_file",
  {
    description: "Start a file download from an absolute http or https URL and return the Chrome download ID.",
    inputSchema: {
      tabId,
      url: z.string().url().max(2048).describe("Absolute http or https URL to download."),
      filename: z.string().min(1).max(255).optional().describe("Optional file name to save as."),
      saveAs: z.boolean().optional().describe("Prompt the user to choose a save location."),
    },
  },
  async ({ tabId: selectedTabId, url, filename, saveAs }) =>
    runTool(() => extensionBridge.request("DOWNLOAD_FILE", { tabId: selectedTabId, url, filename, saveAs })),
);

server.registerTool(
  "browser_get_cookies",
  {
    description: "List cookies for the selected tab's site.",
    inputSchema: { tabId, url: z.string().url().max(2048).optional() },
  },
  async ({ tabId: selectedTabId, url }) =>
    runTool(() => extensionBridge.request("GET_COOKIES", { tabId: selectedTabId, url })),
);

server.registerTool(
  "browser_wait_for_selector",
  {
    description: "Wait until a CSS selector appears or becomes visible in the page before continuing.",
    inputSchema: {
      tabId,
      selector: z.string().min(1).max(2048).describe("CSS selector to wait for."),
      timeoutMs: z.number().int().min(100).max(60_000).optional().describe("Timeout in milliseconds."),
      visibleOnly: z.boolean().optional().describe("Require the element to be visible before succeeding."),
    },
  },
  async ({ tabId: selectedTabId, selector, timeoutMs, visibleOnly }) =>
    runTool(() =>
      extensionBridge.request("WAIT_FOR_SELECTOR", { tabId: selectedTabId, selector, timeoutMs, visibleOnly }),
    ),
);

server.registerTool(
  "browser_get_page_state",
  {
    description: "Get the page URL, title, readiness state, and viewport details for the active or selected tab.",
    inputSchema: { tabId },
  },
  async ({ tabId: selectedTabId }) =>
    runTool(() => extensionBridge.request("GET_PAGE_STATE", { tabId: selectedTabId })),
);

server.registerTool(
  "browser_wait_for_url",
  {
    description: "Wait until a tab URL contains a specific pattern before continuing.",
    inputSchema: {
      tabId,
      pattern: z.string().min(1).max(2048).describe("Sub-string to match in the tab URL."),
      timeoutMs: z.number().int().min(100).max(60_000).optional().describe("Timeout in milliseconds."),
    },
  },
  async ({ tabId: selectedTabId, pattern, timeoutMs }) =>
    runTool(() => extensionBridge.request("WAIT_FOR_URL", { tabId: selectedTabId, pattern, timeoutMs })),
);

server.registerTool(
  "browser_wait_for_network_idle",
  {
    description: "Wait until the page has been mostly stable for a short idle window before continuing.",
    inputSchema: {
      tabId,
      timeoutMs: z.number().int().min(100).max(60_000).optional().describe("Total time to wait before giving up."),
      idleMs: z.number().int().min(100).max(10_000).optional().describe("How long the page should stay quiet before success."),
    },
  },
  async ({ tabId: selectedTabId, timeoutMs, idleMs }) =>
    runTool(() => extensionBridge.request("WAIT_FOR_NETWORK_IDLE", { tabId: selectedTabId, timeoutMs, idleMs })),
);

server.registerTool(
  "browser_find_by_text",
  {
    description: "Search the current page for visible text and return the closest matches with selectors.",
    inputSchema: {
      tabId,
      query: z.string().min(1).max(2048).describe("Text to find on the page."),
      exact: z.boolean().optional().describe("Match only exact text instead of a substring."),
      maxMatches: z.number().int().min(1).max(50).optional().describe("Maximum number of matches to return."),
    },
  },
  async ({ tabId: selectedTabId, query, exact, maxMatches }) =>
    runTool(() => extensionBridge.request("FIND_TEXT", { tabId: selectedTabId, query, exact, maxMatches })),
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

// Open the local WebSocket bridge used by the Chrome extension.
export async function startServer(): Promise<void> {
  await extensionBridge.start();
}

// Close the WebSocket bridge during shutdown.
export async function stopServer(): Promise<void> {
  await extensionBridge.stop();
}
