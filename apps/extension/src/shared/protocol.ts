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
  TabInfo,
} from "./types";

export type EmptyPayload = Record<never, never>;

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

export interface PageActionMap {
  PING: { payload: EmptyPayload; result: { ready: true } };
  INSPECT_PAGE: { payload: { maxElements?: number | undefined }; result: PageInspectionResult };
  CLICK_ELEMENT: { payload: { ref: string }; result: PageInteractionResult };
  TYPE_ELEMENT: {
    payload: { ref: string; text: string; submit?: boolean | undefined };
    result: PageInteractionResult;
  };
  EXTRACT_CONTENT: {
    payload: { format?: "text" | "links" | undefined; maxChars?: number | undefined; maxItems?: number | undefined };
    result: PageExtractionResult;
  };
}

export type PageAction = keyof PageActionMap;

export type ExtensionRequest = z.infer<typeof extensionRequestSchema>;
export type PageRequest = {
  [Action in PageAction]: { id: string; action: Action; payload: PageActionMap[Action]["payload"] };
}[PageAction];

export type ResponseEnvelope<T = unknown> =
  | { id: string; success: true; data: T }
  | { id: string; success: false; error: string };
