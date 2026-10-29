import { errorMessage } from "../shared/errors";
import type { ExtensionAction, ExtensionActionMap, ResponseEnvelope } from "../shared/protocol";

function parseResponse(raw: unknown): ResponseEnvelope | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as { id?: unknown; success?: unknown; data?: unknown; error?: unknown };
  if (typeof record.id !== "string" || typeof record.success !== "boolean") return null;
  if (record.success) {
    return { id: record.id, success: true, data: record.data };
  }
  return {
    id: record.id,
    success: false,
    error: typeof record.error === "string" ? record.error : "The request failed.",
  };
}

export async function sendRequest<Action extends ExtensionAction>(
  action: Action,
  payload: ExtensionActionMap[Action]["payload"],
): Promise<ExtensionActionMap[Action]["result"]> {
  const request = { id: crypto.randomUUID(), action, payload };

  let raw: unknown;
  try {
    raw = await chrome.runtime.sendMessage(request);
  } catch (error) {
    throw new Error(`Could not reach the extension service worker: ${errorMessage(error)}`);
  }

  const response = parseResponse(raw);
  if (!response) {
    throw new Error("The extension service worker returned an invalid response.");
  }
  if (!response.success) {
    throw new Error(response.error);
  }
  return response.data as ExtensionActionMap[Action]["result"];
}
