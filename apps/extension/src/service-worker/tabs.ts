// Chrome tab operations used by the popup and MCP tools.
import { ExtensionError, errorMessage } from "../shared/errors";
import type { ClosedTabResult, NavigationState, TabInfo } from "../shared/types";
import { assertSiteAuthorized } from "./permissions";

// Convert Chrome's tab object into the shared TabInfo shape.
export function toTabInfo(tab: chrome.tabs.Tab): TabInfo {
  if (tab.id === undefined) {
    throw new ExtensionError("This tab cannot be accessed by Agentium.");
  }
  return {
    id: tab.id,
    title: tab.title ?? "",
    url: tab.url ?? tab.pendingUrl ?? "",
    active: tab.active,
    windowId: tab.windowId,
  };
}

// List all open tabs in a stable window/position order.
export async function listTabs(): Promise<TabInfo[]> {
  const tabs = await chrome.tabs.query({});
  return tabs
    .filter((tab) => tab.id !== undefined)
    .sort((left, right) => left.windowId - right.windowId || left.index - right.index)
    .map(toTabInfo);
}

// Return the active tab in the last focused window.
export async function getActiveTabInfo(): Promise<TabInfo | null> {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const tab = tabs[0];
  return tab ? toTabInfo(tab) : null;
}

// Find a tab by id, or fall back to the active tab.
export async function resolveTab(tabId?: number): Promise<chrome.tabs.Tab> {
  if (tabId !== undefined) {
    try {
      return await chrome.tabs.get(tabId);
    } catch {
      throw new ExtensionError(`Browser tab ${tabId} was not found.`);
    }
  }

  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const tab = tabs[0];
  if (!tab) {
    throw new ExtensionError("No active browser tab was found.");
  }
  return tab;
}

// Navigate a tab and wait until the new page finishes loading.
export async function navigateTab(tab: chrome.tabs.Tab, url: string): Promise<TabInfo> {
  const info = toTabInfo(tab);
  const target = new URL(url).href;
  await assertSiteAuthorized(target);
  await chrome.tabs.update(info.id, { url: target });
  await waitForTabComplete(info.id, target);
  return toTabInfo(await chrome.tabs.get(info.id));
}

// Open a new tab and wait for its page to load.
export async function openTab(url: string, active = true): Promise<TabInfo> {
  const target = new URL(url).href;
  await assertSiteAuthorized(target);

  let created: chrome.tabs.Tab;
  try {
    created = await chrome.tabs.create({ url: target, active });
  } catch (error) {
    throw new ExtensionError(`Could not open a new tab: ${errorMessage(error)}`);
  }

  const tabId = created.id;
  if (tabId === undefined) {
    throw new ExtensionError("Chrome created the tab but did not return a tab ID.");
  }

  await waitForTabComplete(tabId, target);
  return toTabInfo(await chrome.tabs.get(tabId));
}

// Focus a tab and bring its window to the front.
export async function switchTab(tabId: number): Promise<TabInfo> {
  let tab: chrome.tabs.Tab;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch {
    throw new ExtensionError(`Browser tab ${tabId} was not found.`);
  }

  try {
    await chrome.tabs.update(tabId, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  } catch (error) {
    throw new ExtensionError(`Could not switch to browser tab ${tabId}: ${errorMessage(error)}`);
  }

  return toTabInfo(await chrome.tabs.get(tabId));
}

// Close a tab by id.
export async function closeTab(tabId: number): Promise<ClosedTabResult> {
  try {
    await chrome.tabs.remove(tabId);
  } catch (error) {
    throw new ExtensionError(`Browser tab ${tabId} was not found or could not be closed: ${errorMessage(error)}`);
  }

  return { tabId, closed: true };
}

// Wait for a tab to finish loading, with a timeout.
function waitForTabComplete(tabId: number, targetUrl?: string, timeoutMs = 15_000): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = (): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(listener);
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new ExtensionError("Timed out waiting for the page to load. The page may still be loading."));
    }, timeoutMs);

    const listener = (updatedTabId: number, changeInfo: chrome.tabs.OnUpdatedInfo): void => {
      if (updatedTabId !== tabId || changeInfo.status !== "complete") return;

      if (targetUrl && changeInfo.url && changeInfo.url !== targetUrl) {
        return;
      }

      cleanup();
      resolve();
    };

    chrome.tabs.onUpdated.addListener(listener);

    void chrome.tabs
      .get(tabId)
      .then((tab) => {
        if (tab.status === "complete") {
          cleanup();
          resolve();
        }
      })
      .catch(() => undefined);
  });
}

export async function goBack(tabId?: number): Promise<TabInfo> {
  const tab = toTabInfo(await resolveTab(tabId));

  try {
    await chrome.tabs.goBack(tab.id);
  } catch (error) {
    throw new ExtensionError(`Could not go back: ${errorMessage(error)}`);
  }

  return toTabInfo(await chrome.tabs.get(tab.id));
}

export async function goForward(tabId?: number): Promise<TabInfo> {
  const tab = toTabInfo(await resolveTab(tabId));

  try {
    await chrome.tabs.goForward(tab.id);
  } catch (error) {
    throw new ExtensionError(`Could not go forward: ${errorMessage(error)}`);
  }

  return toTabInfo(await chrome.tabs.get(tab.id));
}

export async function reloadTab(tabId?: number): Promise<TabInfo> {
  const tab = toTabInfo(await resolveTab(tabId));

  try {
    await chrome.tabs.reload(tab.id);
  } catch (error) {
    throw new ExtensionError(`Could not reload tab ${tab.id}: ${errorMessage(error)}`);
  }

  await waitForTabComplete(tab.id);
  return toTabInfo(await chrome.tabs.get(tab.id));
}

export async function stopLoading(tabId?: number): Promise<TabInfo> {
  const tab = toTabInfo(await resolveTab(tabId));

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      injectImmediately: true,
      func: () => {
        window.stop();
      },
    });
  } catch (error) {
    throw new ExtensionError(`Could not stop loading tab ${tab.id}: ${errorMessage(error)}`);
  }

  return toTabInfo(await chrome.tabs.get(tab.id));
}

export async function getNavigationState(tabId?: number): Promise<NavigationState> {
  const tab = toTabInfo(await resolveTab(tabId));

  try {
    const currentTab = await chrome.tabs.get(tab.id);

    return {
      tabId: currentTab.id ?? tab.id,
      url: currentTab.url ?? null,
      pendingUrl: currentTab.pendingUrl ?? null,
      title: currentTab.title ?? null,
      status: currentTab.status ?? null,
    };
  } catch (error) {
    throw new ExtensionError(`Could not get navigation state for tab ${tab.id}: ${errorMessage(error)}`);
  }
}

export async function waitForUrl(
  tabId: number,
  pattern: string,
  timeoutMs = 15_000,
): Promise<{ tabId: number; matched: boolean; url: string | null; pattern: string; elapsedMs: number }> {
  const tab = toTabInfo(await chrome.tabs.get(tabId));
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const currentTab = await chrome.tabs.get(tab.id);
    const currentUrl = currentTab.url ?? null;
    if (currentUrl && currentUrl.includes(pattern)) {
      return { tabId: tab.id, matched: true, url: currentUrl, pattern, elapsedMs: Date.now() - startedAt };
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  const finalTab = await chrome.tabs.get(tab.id).catch(() => null);
  return {
    tabId: tab.id,
    matched: false,
    url: finalTab?.url ?? null,
    pattern,
    elapsedMs: Date.now() - startedAt,
  };
}

export async function captureScreenshot(
  tabId?: number,
  _fullPage = false,
): Promise<{ tabId: number; dataUrl: string; width: number; height: number }> {
  const tab = toTabInfo(await resolveTab(tabId));

  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.id, { format: "jpeg", quality: 80 });
    return { tabId: tab.id, dataUrl, width: 0, height: 0 };
  } catch (error) {
    throw new ExtensionError(`Could not capture screenshot for tab ${tab.id}: ${errorMessage(error)}`);
  }
}

export async function getCookies(
  tabId?: number,
  url?: string,
): Promise<{ tabId: number; url: string; cookies: Array<{ name: string; value: string; domain: string; path: string; expires: number | null; secure: boolean; httpOnly: boolean; sameSite?: string | null }> }> {
  const tab = toTabInfo(await resolveTab(tabId));
  const targetUrl = url ?? tab.url;

  try {
    const cookies = await chrome.cookies.getAll({ url: targetUrl });
    return {
      tabId: tab.id,
      url: targetUrl,
      cookies: cookies.map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        expires: typeof cookie.expirationDate === "number" ? cookie.expirationDate : null,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite ?? null,
      })),
    };
  } catch (error) {
    throw new ExtensionError(`Could not read cookies for tab ${tab.id}: ${errorMessage(error)}`);
  }
}