// Validates and dispatches actions received from the popup or MCP bridge.
import { errorMessage } from "../shared/errors";
import type { ExtensionActionMap, ExtensionRequest, ResponseEnvelope } from "../shared/protocol";
import { requestIdOf } from "../shared/request-id";
import { extensionRequestSchema } from "../shared/schemas";
import type { TabInfo } from "../shared/types";
import { sendPageRequest } from "./page-bridge";
import { assertSiteAuthorized } from "./permissions";
import {
  captureScreenshot,
  closeTab,
  getActiveTabInfo,
  getCookies,
  getNavigationState,
  goBack,
  goForward,
  listTabs,
  navigateTab,
  openTab,
  reloadTab,
  resolveTab,
  stopLoading,
  switchTab,
  toTabInfo,
} from "./tabs";

// Resolve a tab and make sure the extension has permission to use it.
async function requireAuthorizedTab(tabId?: number): Promise<TabInfo> {
  const tab = toTabInfo(await resolveTab(tabId));
  await assertSiteAuthorized(tab.url);
  return tab;
}

// Route a validated action to the matching tab or page operation.
async function dispatch(request: ExtensionRequest): Promise<unknown> {
  switch (request.action) {
    case "LIST_TABS":
      return listTabs();

    case "GET_ACTIVE_TAB":
      return getActiveTabInfo();

    case "OPEN_TAB":
      return openTab(request.payload.url, request.payload.active);

    case "SWITCH_TAB":
      return switchTab(request.payload.tabId);

    case "CLOSE_TAB":
      return closeTab(request.payload.tabId);

    case "INSPECT_PAGE": {
      const tab = await requireAuthorizedTab(request.payload.tabId);
      const result = await sendPageRequest(tab.id, "INSPECT_PAGE", { maxElements: request.payload.maxElements });
      const response: ExtensionActionMap["INSPECT_PAGE"]["result"] = { tabId: tab.id, ...result };
      return response;
    }

    case "CLICK_ELEMENT": {
      const tab = await requireAuthorizedTab(request.payload.tabId);
      const result = await sendPageRequest(tab.id, "CLICK_ELEMENT", { ref: request.payload.ref });
      const response: ExtensionActionMap["CLICK_ELEMENT"]["result"] = {
        tabId: tab.id,
        ref: request.payload.ref,
        action: "click",
        ...result,
      };
      return response;
    }

    case "TYPE_ELEMENT": {
      const tab = await requireAuthorizedTab(request.payload.tabId);
      const result = await sendPageRequest(tab.id, "TYPE_ELEMENT", {
        ref: request.payload.ref,
        text: request.payload.text,
        submit: request.payload.submit,
      });
      const response: ExtensionActionMap["TYPE_ELEMENT"]["result"] = {
        tabId: tab.id,
        ref: request.payload.ref,
        action: "type",
        ...result,
      };
      return response;
    }

    case "NAVIGATE": {
      const tab = await resolveTab(request.payload.tabId);
      return navigateTab(tab, request.payload.url);
    }

    case "GO_BACK": {
      return goBack(request.payload.tabId);
    }

    case "GO_FORWARD": {
      return goForward(request.payload.tabId);
    }

    case "RELOAD_TAB": {
      return reloadTab(request.payload.tabId);
    }

    case "STOP_LOADING": {
      return stopLoading(request.payload.tabId);
    }

    case "GET_NAVIGATION_STATE": {
      return getNavigationState(request.payload.tabId);
    }

    case "SCROLL_PAGE": {
      const tab = await requireAuthorizedTab(request.payload.tabId);
      const result = await sendPageRequest(tab.id, "SCROLL_PAGE", {
        x: request.payload.x,
        y: request.payload.y,
        direction: request.payload.direction,
        behavior: request.payload.behavior,
      });
      return { tabId: tab.id, url: tab.url, title: tab.title, ...result };
    }

    case "HOVER_ELEMENT": {
      const tab = await requireAuthorizedTab(request.payload.tabId);
      const result = await sendPageRequest(tab.id, "HOVER_ELEMENT", { ref: request.payload.ref });
      return { tabId: tab.id, ref: request.payload.ref, url: tab.url, title: tab.title, ...result };
    }

    case "CAPTURE_SCREENSHOT": {
      const tab = await requireAuthorizedTab(request.payload.tabId);
      return captureScreenshot(tab.id, request.payload.fullPage);
    }

    case "GET_COOKIES": {
      const tab = await requireAuthorizedTab(request.payload.tabId);
      return getCookies(tab.id, request.payload.url ?? tab.url);
    }

    case "WAIT_FOR_SELECTOR": {
      const tab = await requireAuthorizedTab(request.payload.tabId);
      const result = await sendPageRequest(tab.id, "WAIT_FOR_SELECTOR", {
        selector: request.payload.selector,
        timeoutMs: request.payload.timeoutMs,
        visibleOnly: request.payload.visibleOnly,
      });
      return { tabId: tab.id, ...result };
    }

    case "GET_PAGE_STATE": {
      const tab = await requireAuthorizedTab(request.payload.tabId);
      const result = await sendPageRequest(tab.id, "GET_PAGE_STATE", {});
      return { tabId: tab.id, ...result };
    }

    case "EXTRACT_CONTENT": {
      const tab = await requireAuthorizedTab(request.payload.tabId);
      const result = await sendPageRequest(tab.id, "EXTRACT_CONTENT", {
        format: request.payload.format,
        maxChars: request.payload.maxChars,
        maxItems: request.payload.maxItems,
      });
      const response: ExtensionActionMap["EXTRACT_CONTENT"]["result"] = { tabId: tab.id, ...result };
      return response;
    }
  }
}

// Validate a message, run it, and always return a response envelope.
export async function executeMessage(message: unknown): Promise<ResponseEnvelope> {
  const parsed = extensionRequestSchema.safeParse(message);
  if (!parsed.success) {
    return {
      id: requestIdOf(message),
      success: false,
      error: "Invalid request. The extension accepts only known actions with valid payloads.",
    };
  }

  try {
    const data = await dispatch(parsed.data);
    return { id: parsed.data.id, success: true, data };
  } catch (error) {
    return { id: parsed.data.id, success: false, error: errorMessage(error) };
  }
}
