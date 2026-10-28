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

export interface TabInfo {
  id: number;
  title: string;
  url: string;
  active: boolean;
  windowId: number;
}

export interface ClosedTabResult {
  tabId: number;
  closed: true;
}

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

export interface InspectionResult {
  tabId: number;
  url: string;
  title: string;
  total: number;
  returned: number;
  truncated: boolean;
  elements: InspectedElement[];
}

export interface InteractionResult {
  tabId: number;
  ref: string;
  action: "click" | "type";
  url: string;
  title: string;
}

export interface ExtractedLink {
  text: string;
  href: string;
}

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

export type BridgeAction = keyof BridgeActionMap;

export type BridgeRequest = {
  [Action in BridgeAction]: { id: string; action: Action; payload: BridgeActionMap[Action]["payload"] };
}[BridgeAction];

export type BridgeResponse =
  | { id: string; success: true; data?: unknown }
  | { id: string; success: false; error: string };
