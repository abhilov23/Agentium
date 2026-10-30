// Result types shared by the extension and the MCP server.
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

export interface NavigationState {
  tabId: number;
  url: string | null;
  pendingUrl: string | null;
  title: string | null;
  status: string | null;
}

// One interactive element found during page inspection.
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

// Page data returned by the content script.
export interface PageInspectionResult {
  url: string;
  title: string;
  total: number;
  returned: number;
  truncated: boolean;
  elements: InspectedElement[];
}

// Inspection result with the tab id added by the service worker.
export interface InspectionResult extends PageInspectionResult {
  tabId: number;
}

// Page state returned after a click or type action.
export interface PageInteractionResult {
  url: string;
  title: string;
}

// Interaction result with the tab id and action details added.
export interface InteractionResult extends PageInteractionResult {
  tabId: number;
  ref: string;
  action: "click" | "type";
}

// A link returned during page extraction.
export interface ExtractedLink {
  text: string;
  href: string;
}

// Text or links returned by the content script.
export interface PageExtractionResult {
  url: string;
  title: string;
  format: "text" | "links";
  text?: string;
  links?: ExtractedLink[];
  truncated: boolean;
}

export interface SelectorWaitResult {
  tabId: number;
  selector: string;
  found: boolean;
  visible: boolean;
  url: string;
  title: string;
}

export interface PageState {
  tabId: number;
  url: string;
  title: string;
  readyState: DocumentReadyState;
  viewport: { width: number; height: number };
  isInteractive: boolean;
}

export interface TextMatch {
  text: string;
  tag: string;
  selector: string;
  href?: string;
  role?: string;
}

export interface TextSearchResult {
  query: string;
  matches: TextMatch[];
  total: number;
  truncated: boolean;
  url: string;
  title: string;
}

export interface NetworkIdleResult {
  url: string;
  title: string;
  idle: boolean;
  elapsedMs: number;
  waitedMs: number;
}

// Extraction result with the tab id added by the service worker.
export interface ExtractionResult extends PageExtractionResult {
  tabId: number;
}
