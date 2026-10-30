// Message contracts shared between the MCP server and the Chrome extension.
export type ElementKind =
  | "link"
  | "button"
  | "input"
  | "textarea"
  | "select"
  | "form"
  | "heading"
  | "editable"
  | "interactive";

// Basic details about a browser tab.
export interface TabInfo {
  id: number;
  title: string;
  url: string;
  active: boolean;
  windowId: number;
}

// Result returned after closing a tab.
export interface ClosedTabResult {
  tabId: number;
  closed: true;
}

// One interactive element found by browser_inspect.
export interface InspectedElement {
  ref: string;
  kind: ElementKind;
  tag: string;
  name: string;
  role?: string;
  href?: string;
  inputType?: string;
  level?: number;
  value?: string;
  placeholder?: string;
  checked?: boolean;
  disabled?: boolean;
}

// Full result returned by browser_inspect.
export interface InspectionResult {
  tabId: number;
  url: string;
  title: string;
  total: number;
  returned: number;
  truncated: boolean;
  elements: InspectedElement[];
}

// Result returned after a click or type action.
export interface InteractionResult {
  tabId: number;
  ref: string;
  action: "click" | "type";
  url: string;
  title: string;
}

// A link returned by browser_extract.
export interface ExtractedLink {
  text: string;
  href: string;
}

// Text or links returned by browser_extract.
export interface ExtractionResult {
  tabId: number;
  url: string;
  title: string;
  format: "text" | "links";
  text?: string;
  links?: ExtractedLink[];
  truncated: boolean;
}

export type EmptyPayload = Record<never, never>;

// Every action the MCP server can send to the extension.
export interface BridgeActionMap {
  LIST_TABS: { payload: EmptyPayload; result: TabInfo[] };
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
  WAIT_FOR_SELECTOR: {
    payload: { tabId?: number | undefined; selector: string; timeoutMs?: number | undefined; visibleOnly?: boolean | undefined };
    result: { tabId: number; selector: string; found: boolean; visible: boolean; url: string; title: string };
  };
  GET_PAGE_STATE: {
    payload: { tabId?: number | undefined };
    result: { tabId: number; url: string; title: string; readyState: DocumentReadyState; viewport: { width: number; height: number }; isInteractive: boolean };
  };
  WAIT_FOR_URL: {
    payload: { tabId?: number | undefined; pattern: string; timeoutMs?: number | undefined };
    result: { tabId: number; matched: boolean; url: string | null; pattern: string; elapsedMs: number };
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

export type BridgeAction = keyof BridgeActionMap;

// Request sent over the WebSocket bridge.
export type BridgeRequest = {
  [Action in BridgeAction]: { id: string; action: Action; payload: BridgeActionMap[Action]["payload"] };
}[BridgeAction];

// Response returned by the extension for a bridge request.
export type BridgeResponse =
  | { id: string; success: true; data?: unknown }
  | { id: string; success: false; error: string };
