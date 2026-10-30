// Message shapes shared by the popup, service worker, and page helper.
import type { z } from "zod";
import type { extensionRequestSchema } from "./schemas";
import type {
  ClosedTabResult,
  ExtractionResult,
  InspectionResult,
  InteractionResult,
  PageExtractionResult,
  PageInspectionResult,
  PageInteractionResult,
  PageState,
  SelectorWaitResult,
  TabInfo,
} from "./types";

export type EmptyPayload = Record<never, never>;

// Actions the popup or MCP server can send to the service worker.
export interface ExtensionActionMap {
  LIST_TABS: { payload: EmptyPayload; result: TabInfo[] };
  GET_ACTIVE_TAB: { payload: EmptyPayload; result: TabInfo | null };
  OPEN_TAB: {
    payload: { url: string; active?: boolean | undefined };
    result: TabInfo;
  };
  SWITCH_TAB: {
    payload: { tabId: number };
    result: TabInfo;
  };
  CLOSE_TAB: {
    payload: { tabId: number };
    result: ClosedTabResult;
  };
  GO_BACK: {
    payload: { tabId?: number | undefined };
    result: TabInfo;
  };
  GO_FORWARD: {
    payload: { tabId?: number | undefined };
    result: TabInfo;
  };
  RELOAD_TAB: {
    payload: { tabId?: number | undefined };
    result: TabInfo;
  };
  STOP_LOADING: {
    payload: { tabId?: number | undefined };
    result: TabInfo;
  };
  GET_NAVIGATION_STATE: {
    payload: { tabId?: number | undefined };
    result: {
      tabId: number;
      url: string | null;
      pendingUrl: string | null;
      title: string | null;
      status: string | null;
    };
  };
  SCROLL_PAGE: {
    payload: { tabId?: number | undefined; x?: number | undefined; y?: number | undefined; direction?: string | undefined; behavior?: "auto" | "smooth" | undefined };
    result: { tabId: number; url: string; title: string; x: number; y: number };
  };
  HOVER_ELEMENT: {
    payload: { tabId?: number | undefined; ref: string };
    result: { tabId: number; ref: string; url: string; title: string; x: number; y: number };
  };
  CAPTURE_SCREENSHOT: {
    payload: { tabId?: number | undefined; fullPage?: boolean | undefined };
    result: { tabId: number; dataUrl: string; width: number; height: number };
  };
  GET_COOKIES: {
    payload: { tabId?: number | undefined; url?: string | undefined };
    result: { tabId: number; url: string; cookies: Array<{ name: string; value: string; domain: string; path: string; expires: number | null; secure: boolean; httpOnly: boolean; sameSite?: string | null }> };
  };
  WAIT_FOR_URL: {
    payload: { tabId?: number | undefined; pattern: string; timeoutMs?: number | undefined };
    result: { tabId: number; matched: boolean; url: string | null; pattern: string; elapsedMs: number };
  };
  WAIT_FOR_SELECTOR: {
    payload: { tabId?: number | undefined; selector: string; timeoutMs?: number | undefined; visibleOnly?: boolean | undefined };
    result: SelectorWaitResult;
  };
  GET_PAGE_STATE: {
    payload: { tabId?: number | undefined };
    result: PageState;
  };
  WAIT_FOR_NETWORK_IDLE: {
    payload: { tabId?: number | undefined; timeoutMs?: number | undefined; idleMs?: number | undefined };
    result: { tabId: number; url: string; title: string; idle: boolean; elapsedMs: number; waitedMs: number };
  };
  FIND_TEXT: {
    payload: { tabId?: number | undefined; query: string; exact?: boolean | undefined; maxMatches?: number | undefined };
    result: { tabId: number; query: string; matches: Array<{ text: string; tag: string; selector: string; href?: string; role?: string }>; total: number; truncated: boolean; url: string; title: string };
  };
  INSPECT_PAGE: {
    payload: { tabId?: number | undefined; maxElements?: number | undefined };
    result: InspectionResult;
  };
  CLICK_ELEMENT: {
    payload: { tabId?: number | undefined; ref: string };
    result: InteractionResult;
  };
  TYPE_ELEMENT: {
    payload: { tabId?: number | undefined; ref: string; text: string; submit?: boolean | undefined };
    result: InteractionResult;
  };
  NAVIGATE: {
    payload: { tabId?: number | undefined; url: string };
    result: TabInfo;
  };
  EXTRACT_CONTENT: {
    payload: {
      tabId?: number | undefined;
      format?: "text" | "links" | undefined;
      maxChars?: number | undefined;
      maxItems?: number | undefined;
    };
    result: ExtractionResult;
  };
}

export type ExtensionAction = keyof ExtensionActionMap;

// Actions the service worker can send to the content script on a page.
export interface PageActionMap {
  PING: { payload: EmptyPayload; result: { ready: true } };
  INSPECT_PAGE: { payload: { maxElements?: number | undefined }; result: PageInspectionResult };
  CLICK_ELEMENT: { payload: { ref: string }; result: PageInteractionResult };
  TYPE_ELEMENT: {
    payload: { ref: string; text: string; submit?: boolean | undefined };
    result: PageInteractionResult;
  };
  SCROLL_PAGE: {
    payload: { x?: number | undefined; y?: number | undefined; direction?: string | undefined; behavior?: "auto" | "smooth" | undefined };
    result: { x: number; y: number };
  };
  HOVER_ELEMENT: {
    payload: { ref: string };
    result: { x: number; y: number };
  };
  WAIT_FOR_SELECTOR: {
    payload: { selector: string; timeoutMs?: number | undefined; visibleOnly?: boolean | undefined };
    result: { selector: string; found: boolean; visible: boolean; url: string; title: string };
  };
  GET_PAGE_STATE: {
    payload: EmptyPayload;
    result: { url: string; title: string; readyState: DocumentReadyState; viewport: { width: number; height: number }; isInteractive: boolean };
  };
  WAIT_FOR_NETWORK_IDLE: {
    payload: { timeoutMs?: number | undefined; idleMs?: number | undefined };
    result: { url: string; title: string; idle: boolean; elapsedMs: number; waitedMs: number };
  };
  FIND_TEXT: {
    payload: { query: string; exact?: boolean | undefined; maxMatches?: number | undefined };
    result: { query: string; matches: Array<{ text: string; tag: string; selector: string; href?: string; role?: string }>; total: number; truncated: boolean; url: string; title: string };
  };
  EXTRACT_CONTENT: {
    payload: { format?: "text" | "links" | undefined; maxChars?: number | undefined; maxItems?: number | undefined };
    result: PageExtractionResult;
  };
}

export type PageAction = keyof PageActionMap;

// Validated request sent to the service worker.
export type ExtensionRequest = z.infer<typeof extensionRequestSchema>;
// Request sent to the content script on a page.
export type PageRequest = {
  [Action in PageAction]: { id: string; action: Action; payload: PageActionMap[Action]["payload"] };
}[PageAction];

// Standard success or error reply for an extension request.
export type ResponseEnvelope<T = unknown> =
  | { id: string; success: true; data: T }
  | { id: string; success: false; error: string };
