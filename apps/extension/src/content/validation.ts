// Validates messages sent from the service worker to the page helper.
import type { PageRequest } from "../shared/protocol";

const REF_PATTERN = /^e\d+$/;

// Validate an incoming page request and narrow its payload.
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

    case "WAIT_FOR_SELECTOR": {
      const selector = payload.selector;
      const timeoutMs = payload.timeoutMs;
      const visibleOnly = payload.visibleOnly;
      if (typeof selector !== "string" || selector.length === 0 || selector.length > 2048) return null;
      if (timeoutMs !== undefined && !isBoundedInteger(timeoutMs, 100, 60_000)) return null;
      if (visibleOnly !== undefined && typeof visibleOnly !== "boolean") return null;

      const parsedPayload: { selector: string; timeoutMs?: number; visibleOnly?: boolean } = { selector };
      if (timeoutMs !== undefined) parsedPayload.timeoutMs = timeoutMs;
      if (visibleOnly !== undefined) parsedPayload.visibleOnly = visibleOnly;
      return { id, action, payload: parsedPayload };
    }

    case "GET_PAGE_STATE":
      return { id, action, payload: {} };

    case "FIND_TEXT": {
      const query = payload.query;
      const exact = payload.exact;
      const maxMatches = payload.maxMatches;
      if (typeof query !== "string" || query.length === 0 || query.length > 2048) return null;
      if (exact !== undefined && typeof exact !== "boolean") return null;
      if (maxMatches !== undefined && !isBoundedInteger(maxMatches, 1, 50)) return null;
      const parsedPayload: { query: string; exact?: boolean; maxMatches?: number } = { query };
      if (exact !== undefined) parsedPayload.exact = exact;
      if (maxMatches !== undefined) parsedPayload.maxMatches = maxMatches;
      return { id, action, payload: parsedPayload };
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

// Check for a plain object.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Check for an integer within the allowed range.
function isBoundedInteger(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}
