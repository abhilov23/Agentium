// Validation schemas for messages entering the service worker.
import { z } from "zod";

const requestId = z.string().min(1);
const emptyPayload = z.object({}).strict();
const boundedInteger = (min: number, max: number) => z.number().int().min(min).max(max);
const requiredTabId = z.number().int().positive();
const tabId = requiredTabId.optional();

// All requests accepted by the service worker.
export const extensionRequestSchema = z.discriminatedUnion("action", [
  z.object({ id: requestId, action: z.literal("LIST_TABS"), payload: emptyPayload }),
  z.object({ id: requestId, action: z.literal("GET_ACTIVE_TAB"), payload: emptyPayload }),
  z.object({
    id: requestId,
    action: z.literal("OPEN_TAB"),
    payload: z.object({ url: z.string().url().max(2048), active: z.boolean().optional() }).strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("SWITCH_TAB"),
    payload: z.object({ tabId: requiredTabId }).strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("CLOSE_TAB"),
    payload: z.object({ tabId: requiredTabId }).strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("INSPECT_PAGE"),
    payload: z.object({ tabId, maxElements: boundedInteger(1, 300).optional() }).strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("CLICK_ELEMENT"),
    payload: z.object({ tabId, ref: z.string().regex(/^e\d+$/) }).strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("TYPE_ELEMENT"),
    payload: z
      .object({ tabId, ref: z.string().regex(/^e\d+$/), text: z.string().max(20_000), submit: z.boolean().optional() })
      .strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("NAVIGATE"),
    payload: z.object({ tabId, url: z.string().url().max(2048) }).strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("GO_BACK"),
    payload: z.object({ tabId }).strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("GO_FORWARD"),
    payload: z.object({ tabId }).strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("RELOAD_TAB"),
    payload: z.object({ tabId }).strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("STOP_LOADING"),
    payload: z.object({ tabId }).strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("GET_NAVIGATION_STATE"),
    payload: z.object({ tabId }).strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("SCROLL_PAGE"),
    payload: z
      .object({
        tabId,
        x: z.number().int().optional(),
        y: z.number().int().optional(),
        direction: z.enum(["top", "bottom", "up", "down", "left", "right"]).optional(),
        behavior: z.enum(["auto", "smooth"]).optional(),
      })
      .strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("HOVER_ELEMENT"),
    payload: z.object({ tabId, ref: z.string().regex(/^e\d+$/) }).strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("CAPTURE_SCREENSHOT"),
    payload: z.object({ tabId, fullPage: z.boolean().optional() }).strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("GET_COOKIES"),
    payload: z.object({ tabId, url: z.string().url().max(2048).optional() }).strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("WAIT_FOR_SELECTOR"),
    payload: z
      .object({
        tabId,
        selector: z.string().min(1).max(2048),
        timeoutMs: boundedInteger(100, 60_000).optional(),
        visibleOnly: z.boolean().optional(),
      })
      .strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("GET_PAGE_STATE"),
    payload: z.object({ tabId }).strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("WAIT_FOR_URL"),
    payload: z
      .object({
        tabId,
        pattern: z.string().min(1).max(2048),
        timeoutMs: boundedInteger(100, 60_000).optional(),
      })
      .strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("FIND_TEXT"),
    payload: z
      .object({
        tabId,
        query: z.string().min(1).max(2048),
        exact: z.boolean().optional(),
        maxMatches: boundedInteger(1, 50).optional(),
      })
      .strict(),
  }),
  z.object({
    id: requestId,
    action: z.literal("EXTRACT_CONTENT"),
    payload: z
      .object({
        tabId,
        format: z.enum(["text", "links"]).optional(),
        maxChars: boundedInteger(100, 50_000).optional(),
        maxItems: boundedInteger(1, 500).optional(),
      })
      .strict(),
  }),
]);

// Shape used to validate replies from content scripts.
export const responseEnvelopeSchema = z.object({
  id: z.string(),
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});
