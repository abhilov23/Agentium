import { ExtensionError, errorMessage } from "../shared/errors";

export async function dispatchTrustedClick(tabId: number, x: number, y: number): Promise<void> {
  const target: chrome.debugger.Debuggee = { tabId };
  let attached = false;

  try {
    await chrome.debugger.attach(target, "1.3");
    attached = true;

    await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x,
      y,
    });
    await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
      type: "mousePressed",
      x,
      y,
      button: "left",
      clickCount: 1,
    });
    await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x,
      y,
      button: "left",
      clickCount: 1,
    });
  } catch (error) {
    throw new ExtensionError(`Could not click the page element: ${errorMessage(error)}`);
  } finally {
    if (attached) {
      await chrome.debugger.detach(target).catch(() => undefined);
    }
  }
}