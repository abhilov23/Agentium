import { z } from "zod";

const requestId = z.string().min(1);
const emptyPayload = z.object({}).strict();
const boundedInteger = (min: number, max: number) => z.number().int().min(min).max(max);
const requiredTabId = z.number().int().positive();
const tabId = requiredTabId.optional();

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

export const responseEnvelopeSchema = z.object({
  id: z.string(),
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});
