import { errorMessage } from "../shared/errors";
import type { ExtensionActionMap, ExtensionRequest, ResponseEnvelope } from "../shared/protocol";
import { requestIdOf } from "../shared/request-id";
import { extensionRequestSchema } from "../shared/schemas";
import type { TabInfo } from "../shared/types";
import { sendPageRequest } from "./page-bridge";
import { assertSiteAuthorized } from "./permissions";
import {
  closeTab,
  getActiveTabInfo,
  listTabs,
  navigateTab,
  openTab,
  resolveTab,
  switchTab,
  toTabInfo,
} from "./tabs";

async function requireAuthorizedTab(tabId?: number): Promise<TabInfo> {
  const tab = toTabInfo(await resolveTab(tabId));
  await assertSiteAuthorized(tab.url);
  return tab;
}

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
