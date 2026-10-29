// Injects and communicates with the content script running in a tab.
import { ExtensionError, errorMessage } from "../shared/errors";
import type { PageAction, PageActionMap, PageRequest } from "../shared/protocol";
import { responseEnvelopeSchema } from "../shared/schemas";

// Check whether the content script is already running in a tab.
async function ping(tabId: number): Promise<boolean> {
  const request: PageRequest = { id: crypto.randomUUID(), action: "PING", payload: {} };
  try {
    const raw: unknown = await chrome.tabs.sendMessage(tabId, request);
    const parsed = responseEnvelopeSchema.safeParse(raw);
    return parsed.success && parsed.data.success;
  } catch {
    return false;
  }
}

// Inject the content script when it is missing.
export async function ensureContentScript(tabId: number): Promise<void> {
  if (await ping(tabId)) return;

  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content/index.js"] });
  } catch (error) {
    throw new ExtensionError(
      `FoundryLens cannot inject its page helper into this tab. Chrome blocks extensions on internal pages: ${errorMessage(error)}`,
    );
  }

  if (!(await ping(tabId))) {
    throw new ExtensionError("FoundryLens loaded its page helper but the page did not respond. Reload the page and try again.");
  }
}

// Send an action to the content script and return its result.
export async function sendPageRequest<Action extends PageAction>(
  tabId: number,
  action: Action,
  payload: PageActionMap[Action]["payload"],
): Promise<PageActionMap[Action]["result"]> {
  await ensureContentScript(tabId);

  const request = { id: crypto.randomUUID(), action, payload } as PageRequest;

  let raw: unknown;
  try {
    raw = await chrome.tabs.sendMessage(tabId, request);
  } catch (error) {
    throw new ExtensionError(`The page did not respond: ${errorMessage(error)}`);
  }

  const parsed = responseEnvelopeSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ExtensionError("The page returned an invalid response.");
  }
  if (!parsed.data.success) {
    throw new ExtensionError(parsed.data.error ?? "The page operation failed.");
  }
  return parsed.data.data as PageActionMap[Action]["result"];
}
