import { ExtensionError, errorMessage } from "../shared/errors";
import type { ClosedTabResult, TabInfo } from "../shared/types";
import { assertSiteAuthorized } from "./permissions";

export function toTabInfo(tab: chrome.tabs.Tab): TabInfo {
  if (tab.id === undefined) {
    throw new ExtensionError("This tab cannot be accessed by FoundryLens.");
  }
  return {
    id: tab.id,
    title: tab.title ?? "",
    url: tab.url ?? tab.pendingUrl ?? "",
    active: tab.active,
    windowId: tab.windowId,
  };
}

export async function listTabs(): Promise<TabInfo[]> {
  const tabs = await chrome.tabs.query({});
  return tabs
    .filter((tab) => tab.id !== undefined)
    .sort((left, right) => left.windowId - right.windowId || left.index - right.index)
    .map(toTabInfo);
}

export async function getActiveTabInfo(): Promise<TabInfo | null> {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const tab = tabs[0];
  return tab ? toTabInfo(tab) : null;
}

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

export async function navigateTab(tab: chrome.tabs.Tab, url: string): Promise<TabInfo> {
  const info = toTabInfo(tab);
  const target = new URL(url).href;
  await assertSiteAuthorized(target);
  await chrome.tabs.update(info.id, { url: target });
  await waitForTabComplete(info.id, target);
  return toTabInfo(await chrome.tabs.get(info.id));
}

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

export async function closeTab(tabId: number): Promise<ClosedTabResult> {
  try {
    await chrome.tabs.remove(tabId);
  } catch (error) {
    throw new ExtensionError(`Browser tab ${tabId} was not found or could not be closed: ${errorMessage(error)}`);
  }

  return { tabId, closed: true };
}

function waitForTabComplete(tabId: number, targetUrl: string, timeoutMs = 15_000): Promise<void> {
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
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        cleanup();
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);

    void chrome.tabs
      .get(tabId)
      .then((tab) => {
        if (tab.status === "complete" && tab.url === targetUrl) {
          cleanup();
          resolve();
        }
      })
      .catch(() => undefined);
  });
}
