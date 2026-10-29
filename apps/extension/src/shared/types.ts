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

export interface PageInspectionResult {
  url: string;
  title: string;
  total: number;
  returned: number;
  truncated: boolean;
  elements: InspectedElement[];
}

export interface InspectionResult extends PageInspectionResult {
  tabId: number;
}

export interface PageInteractionResult {
  url: string;
  title: string;
}

export interface InteractionResult extends PageInteractionResult {
  tabId: number;
  ref: string;
  action: "click" | "type";
}

export interface ExtractedLink {
  text: string;
  href: string;
}

export interface PageExtractionResult {
  url: string;
  title: string;
  format: "text" | "links";
  text?: string;
  links?: ExtractedLink[];
  truncated: boolean;
}

export interface ExtractionResult extends PageExtractionResult {
  tabId: number;
}
