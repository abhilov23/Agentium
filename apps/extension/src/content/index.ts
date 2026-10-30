// Content script entry point: runs page actions inside the current tab.
import { errorMessage } from "../shared/errors";
import type { PageRequest, ResponseEnvelope } from "../shared/protocol";
import { requestIdOf } from "../shared/request-id";
import { extractContent } from "./extraction";
import { inspectPage } from "./inspection";
import { clickElement, findText, getPageState, hoverElement, scrollPage, typeElement, waitForSelector } from "./interaction";
import { ElementRegistry } from "./refs";
import { parsePageRequest } from "./validation";

declare global {
  interface Window {
    __foundryLensContentLoaded?: boolean;
  }
}

const registry = new ElementRegistry();

// Run the requested page action.
function handleRequest(request: PageRequest): unknown {
  switch (request.action) {
    case "PING":
      return { ready: true };
    case "INSPECT_PAGE":
      return inspectPage(registry, request.payload.maxElements);
    case "CLICK_ELEMENT":
      return clickElement(registry, request.payload.ref);
    case "TYPE_ELEMENT":
      return typeElement(registry, request.payload.ref, request.payload.text, request.payload.submit);
    case "SCROLL_PAGE":
      return scrollPage(request.payload);
    case "HOVER_ELEMENT":
      return hoverElement(registry, request.payload.ref);
    case "WAIT_FOR_SELECTOR":
      return waitForSelector(request.payload.selector, request.payload.timeoutMs, request.payload.visibleOnly);
    case "GET_PAGE_STATE":
      return getPageState();
    case "FIND_TEXT":
      return findText(request.payload.query, request.payload.exact, request.payload.maxMatches);
    case "EXTRACT_CONTENT":
      return extractContent(request.payload);
  }
}

// Inject the listeners only once per page.
if (!window.__foundryLensContentLoaded) {
  window.__foundryLensContentLoaded = true;

  chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    const request = parsePageRequest(message);
    if (!request) {
      sendResponse({ id: requestIdOf(message), success: false, error: "Invalid page request." } satisfies ResponseEnvelope);
      return false;
    }

    void Promise.resolve()
      .then(() => handleRequest(request))
      .then((data) => sendResponse({ id: request.id, success: true, data } satisfies ResponseEnvelope))
      .catch((error: unknown) =>
        sendResponse({ id: request.id, success: false, error: errorMessage(error) } satisfies ResponseEnvelope),
      );
    return true;
  });
}
