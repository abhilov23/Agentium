import type { PageRequest } from "../shared/protocol";

const REF_PATTERN = /^e\d+$/;

export function parsePageRequest(value: unknown): PageRequest | null {
  if (!isRecord(value)) return null;

  const { id, action, payload } = value;
  if (typeof id !== "string" || id.length === 0) return null;
  if (!isRecord(payload)) return null;

  switch (action) {
    case "PING":
      return { id, action, payload: {} };

    case "INSPECT_PAGE": {
      const maxElements = payload.maxElements;
      if (maxElements !== undefined && !isBoundedInteger(maxElements, 1, 300)) return null;
      return maxElements === undefined ? { id, action, payload: {} } : { id, action, payload: { maxElements } };
    }

    case "CLICK_ELEMENT": {
      const ref = payload.ref;
      if (typeof ref !== "string" || !REF_PATTERN.test(ref)) return null;
      return { id, action, payload: { ref } };
    }

    case "TYPE_ELEMENT": {
      const ref = payload.ref;
      const text = payload.text;
      const submit = payload.submit;
      if (typeof ref !== "string" || !REF_PATTERN.test(ref)) return null;
      if (typeof text !== "string" || text.length > 20_000) return null;
      if (submit !== undefined && typeof submit !== "boolean") return null;
      return submit === undefined
        ? { id, action, payload: { ref, text } }
        : { id, action, payload: { ref, text, submit } };
    }

    case "EXTRACT_CONTENT": {
      const format = payload.format;
      const maxChars = payload.maxChars;
      const maxItems = payload.maxItems;
      if (format !== undefined && format !== "text" && format !== "links") return null;
      if (maxChars !== undefined && !isBoundedInteger(maxChars, 100, 50_000)) return null;
      if (maxItems !== undefined && !isBoundedInteger(maxItems, 1, 500)) return null;

      const parsedPayload: { format?: "text" | "links"; maxChars?: number; maxItems?: number } = {};
      if (format !== undefined) parsedPayload.format = format;
      if (maxChars !== undefined) parsedPayload.maxChars = maxChars;
      if (maxItems !== undefined) parsedPayload.maxItems = maxItems;
      return { id, action, payload: parsedPayload };
    }

    default:
      return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBoundedInteger(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}
