// Popup UI: shows bridge status, tabs, page actions, and recent activity.
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createRoot } from "react-dom/client";
import { fetchBridgeStatus, requestBridgeReconnect } from "../messaging/bridge";
import { sendRequest } from "../messaging/client";
import {
  BRIDGE_WEBSOCKET_URL,
  type BridgeConnectionState,
  type BridgeStatus,
} from "../shared/bridge-status";
import { errorMessage } from "../shared/errors";
import type { InspectedElement, TabInfo } from "../shared/types";
import { isSupportedPageUrl, originPattern } from "../shared/urls";

type ActivityTone = "info" | "success" | "error";
type SiteState = "unknown" | "allowed" | "missing" | "unsupported";

// Counts shown above the inspected element list.
interface ElementMeta {
  returned: number;
  total: number;
  truncated: boolean;
}

// Text currently shown in the result card.
interface ResultState {
  title: string;
  body: string;
}

// Use a readable fallback when a tab has no title.
function titleOf(tab: TabInfo): string {
  return tab.title || "(untitled)";
}

// Use a readable fallback when a tab has no URL.
function urlOf(tab: TabInfo): string {
  return tab.url || "(no URL)";
}

// Add https:// when needed and reject non-web URLs.
function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Enter a URL to navigate to.");

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("Enter a valid URL, for example https://example.com.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Agentium only supports http and https pages.");
  }
  return url.href;
}

// Short status text for the bridge pill.
function bridgeLabel(state: BridgeConnectionState | null): string {
  if (state === "connected") return "Connected";
  if (state === "connecting") return "Connecting";
  if (state === "disconnected") return "Offline";
  return "Checking";
}

// Detailed bridge message including the next retry time.
function bridgeDetail(status: BridgeStatus): string {
  if (status.state === "connecting") {
    return "Waiting for the local MCP bridge to accept the connection.";
  }
  const retrySeconds =
    status.nextRetryAt === null
      ? null
      : Math.max(0, Math.ceil((status.nextRetryAt - Date.now()) / 1000));
  const base =
    status.lastError ?? "Start the Agentium Web MCP server, then retry.";
  return retrySeconds !== null && retrySeconds > 0
    ? `${base} Retrying in ${retrySeconds}s.`
    : base;
}

// Inline SVG icons used by the popup.
function IconInspect() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="8.75" cy="8.75" r="5.25" />
      <path d="m12.6 12.6 3.65 3.65" />
      <path d="M6.7 8.75h4.1M8.75 6.7v4.1" />
    </svg>
  );
}

function IconText() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 5.5h12M4 10h9M4 14.5h11" />
    </svg>
  );
}

function IconLinks() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M8.2 11.8 11.8 8.2" />
      <path d="M7.1 13.9 5.4 15.6a2.8 2.8 0 0 1-4-4l2.7-2.7a2.8 2.8 0 0 1 4 0" />
      <path d="m12.9 6.1 1.7-1.7a2.8 2.8 0 0 1 4 4l-2.7 2.7a2.8 2.8 0 0 1-4 0" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M11 6l4 4-4 4" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="6.5" y="6.5" width="9" height="10" rx="2" />
      <path d="M4.5 13.5h-1a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m6 6 8 8M14 6l-8 8" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="2" />
      <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3.2 15.5 5v4.3c0 3.3-2.1 5.7-5.5 7.1-3.4-1.4-5.5-3.8-5.5-7.1V5L10 3.2Z" />
      <path d="m7.6 9.8 1.6 1.6 3.2-3.3" />
    </svg>
  );
}

function LogoMark() {
  return (
    <img
      src="../icons/agentium-32.png"
      alt="Agentium"
      style={{ width: 30, height: 30, display: "block" }}
      aria-hidden="true"
    />
  );
}

// Brand header with the current bridge status.
function Header({ bridge }: { bridge: BridgeStatus | null }) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark">
          <LogoMark />
        </span>
        <div className="brand-copy">
          <h1>Agentium</h1>
          <p>Local browser automation</p>
        </div>
      </div>
      <span
        className="bridge-pill"
        data-state={bridge?.state ?? "checking"}
        title={bridge?.url ?? BRIDGE_WEBSOCKET_URL}
        role="status"
        aria-live="polite"
      >
        <span className="status-dot" aria-hidden="true" />
        {bridgeLabel(bridge?.state ?? null)}
      </span>
    </header>
  );
}

// Warning banner shown when the MCP bridge is offline or connecting.
function BridgeBanner({
  status,
  reconnecting,
  onRetry,
}: {
  status: BridgeStatus;
  reconnecting: boolean;
  onRetry: () => void;
}) {
  return (
    <section className="bridge-banner" aria-live="polite">
      <span className="banner-icon" aria-hidden="true">
        <IconShield />
      </span>
      <div className="banner-copy">
        <strong>
          {status.state === "connecting"
            ? "Connecting to MCP bridge"
            : "MCP bridge is offline"}
        </strong>
        <p>{bridgeDetail(status)}</p>
        <code>{status.url || BRIDGE_WEBSOCKET_URL}</code>
      </div>
      <button
        type="button"
        className="button button-compact"
        onClick={onRetry}
        disabled={reconnecting || status.state === "connecting"}
      >
        {reconnecting ? "Retrying" : "Retry"}
      </button>
    </section>
  );
}

// Summary of the active tab with quick inspect and extract actions.
function ActiveCard({
  activeTab,
  loading,
  siteState,
  allSitesAllowed,
  canOperate,
  busy,
  inspecting,
  extracting,
  onAllow,
  onInspect,
  onExtract,
}: {
  activeTab: TabInfo | null;
  loading: boolean;
  siteState: SiteState;
  allSitesAllowed: boolean;
  canOperate: boolean;
  busy: boolean;
  inspecting: boolean;
  extracting: "text" | "links" | null;
  onAllow: () => void;
  onInspect: () => void;
  onExtract: (mode: "text" | "links") => void;
}) {
  const siteLabel = loading
    ? "Checking"
    : !activeTab
      ? "No tab"
      : siteState === "allowed"
        ? allSitesAllowed
          ? "All sites"
          : "Allowed"
        : siteState === "missing"
          ? "No access"
          : "Unsupported";

  return (
    <section className="workspace" aria-label="Active tab">
      <div className="section-head">
        <div className="section-title">
          <h2>
            {loading
              ? "Reading current tab…"
              : activeTab
                ? titleOf(activeTab)
                : "No active tab"}
          </h2>
        </div>
        <span className="chip" data-state={loading ? "unknown" : siteState}>
          {siteLabel}
        </span>
      </div>

      <p className="url-line">
        {loading
          ? "Waiting for an active tab…"
          : activeTab
            ? urlOf(activeTab)
            : "Focus a normal browser tab and reopen Agentium."}
      </p>

      <div className="meta-row">
        {activeTab ? <span className="tab-id">Tab #{activeTab.id}</span> : null}
        {activeTab &&
        canOperate &&
        !allSitesAllowed &&
        siteState !== "allowed" ? (
          <button type="button" className="text-button" onClick={onAllow}>
            <IconLock />
            Grant site access
          </button>
        ) : null}
        {activeTab && siteState === "allowed" ? (
          <span className="meta-note">
            <IconLock />
            Page actions enabled
          </span>
        ) : null}
      </div>

      <div className="quick-actions">
        <button
          type="button"
          className="button button-primary"
          onClick={onInspect}
          disabled={!canOperate || busy}
          aria-busy={inspecting}
        >
          <IconInspect />
          {inspecting ? "Inspecting…" : "Inspect"}
        </button>
        <button
          type="button"
          className="button"
          onClick={() => onExtract("text")}
          disabled={!canOperate || busy}
          aria-busy={extracting === "text"}
        >
          <IconText />
          {extracting === "text" ? "Reading…" : "Text"}
        </button>
        <button
          type="button"
          className="button"
          onClick={() => onExtract("links")}
          disabled={!canOperate || busy}
          aria-busy={extracting === "links"}
        >
          <IconLinks />
          {extracting === "links" ? "Reading…" : "Links"}
        </button>
      </div>
    </section>
  );
}

// URL form for navigating the active tab.
function NavigateCard({
  value,
  disabled,
  onChange,
  onSubmit,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="navigate-strip" aria-label="Navigate this tab">
      <form onSubmit={onSubmit}>
        <div className="command-head">
          <label htmlFor="navigate-url" className="field-label">
            Navigate this tab
          </label>
          <span className="command-hint">Enter to open</span>
        </div>
        <div className="input-row">
          <IconArrow />
          <input
            id="navigate-url"
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="https://example.com"
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
          />
          <button type="submit" className="button" disabled={disabled}>
            Open
          </button>
        </div>
      </form>
    </section>
  );
}

// Card for copied or extracted text.
function ResultCard({
  result,
  onCopy,
  onClose,
}: {
  result: ResultState;
  onCopy: () => void;
  onClose: () => void;
}) {
  return (
    <section className="result-panel" aria-label="Result">
      <div className="section-head">
        <div className="section-title">
          <h2>{result.title}</h2>
        </div>
        <div className="head-actions">
          <button
            type="button"
            className="icon-button"
            onClick={onCopy}
            title="Copy result"
            aria-label="Copy result"
          >
            <IconCopy />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            title="Close result"
            aria-label="Close result"
          >
            <IconClose />
          </button>
        </div>
      </div>
      <pre className="result-body">{result.body}</pre>
    </section>
  );
}

// One inspected element with click and fill controls.
function ElementRow({
  element,
  onClick,
  onFill,
}: {
  element: InspectedElement;
  onClick: (element: InspectedElement) => void;
  onFill: (element: InspectedElement, text: string) => void;
}) {
  const [value, setValue] = useState("");
  const disabled = element.disabled === true;
  const canFill =
    element.kind === "input" ||
    element.kind === "textarea" ||
    element.kind === "editable";
  const name = element.name || element.placeholder || "(no accessible name)";
  const hint = element.placeholder
    ? `Placeholder: ${element.placeholder}`
    : element.href
      ? element.href
      : element.inputType
        ? `Input type: ${element.inputType}`
        : "";

  return (
    <li className="element-row">
      <div className="element-copy">
        <div className="element-line">
          <span className="ref-badge">{element.ref}</span>
          <span className="kind-badge">{element.kind}</span>
          <span className="element-name">{name}</span>
        </div>
        {hint ? <p className="element-hint">{hint}</p> : null}
      </div>
      <div className="element-actions">
        <button
          type="button"
          className="button button-compact"
          onClick={() => onClick(element)}
          disabled={disabled}
        >
          Click
        </button>
        {canFill ? (
          <div className="fill-row">
            <input
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onFill(element, value);
                }
              }}
              placeholder="Text to enter"
              disabled={disabled}
              aria-label={`Text to enter into ${name}`}
            />
            <button
              type="button"
              className="button button-compact"
              onClick={() => onFill(element, value)}
              disabled={disabled}
            >
              Fill
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

// List of elements found by the last page inspection.
function ElementsCard({
  elements,
  meta,
  inspecting,
  onClick,
  onFill,
}: {
  elements: InspectedElement[];
  meta: ElementMeta | null;
  inspecting: boolean;
  onClick: (element: InspectedElement) => void;
  onFill: (element: InspectedElement, text: string) => void;
}) {
  const summary = inspecting
    ? "Scanning page…"
    : meta
      ? `${meta.returned} of ${meta.total}${meta.truncated ? "+" : ""} shown`
      : "Not inspected";

  return (
    <section className="ledger" aria-label="Interactive elements">
      <div className="section-head">
        <div className="section-title">
          <h2>Interactive elements</h2>
        </div>
        <span className="muted">{summary}</span>
      </div>

      {elements.length > 0 ? (
        <ul className="element-list">
          {elements.map((element) => (
            <ElementRow
              key={element.ref}
              element={element}
              onClick={onClick}
              onFill={onFill}
            />
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">
            <IconInspect />
          </span>
          <p>
            {inspecting
              ? "Looking for buttons, inputs, and links…"
              : "Inspect the page to see what you can interact with."}
          </p>
        </div>
      )}
    </section>
  );
}

// Footer with privacy note and extension version.
function Footer({ version }: { version: string }) {
  return (
    <footer className="footer">
      <span className="footer-item">
        <IconLock />
        Local bridge only
      </span>
      <span className="footer-separator" aria-hidden="true" />
      <span className="footer-item">v{version}</span>
    </footer>
  );
}

// Main popup screen and shared application state.
function App() {
  // Bridge, tab, inspection, extraction, and activity state.
  const [bridge, setBridge] = useState<BridgeStatus | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabInfo | null>(null);
  const [activeLoading, setActiveLoading] = useState(true);
  const [activeSiteAllowed, setActiveSiteAllowed] = useState(false);
  const [allSitesAllowed, setAllSitesAllowed] = useState(false);
  const [siteState, setSiteState] = useState<SiteState>("unknown");
  const [elements, setElements] = useState<InspectedElement[]>([]);
  const [elementMeta, setElementMeta] = useState<ElementMeta | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [extracting, setExtracting] = useState<"text" | "links" | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [navigateUrl, setNavigateUrl] = useState("");
  const previousBridgeState = useRef<BridgeConnectionState | null>(null);

  // Keep action feedback in the console rather than in a noisy popup queue.
  const logActivity = useCallback(
    (message: string, tone: ActivityTone = "info") => {
      if (tone === "error") {
        console.error(message);
        return;
      }
      if (tone === "success") {
        console.info(message);
        return;
      }
      console.log(message);
    },
    [],
  );

  // Update bridge state and log meaningful connection changes.
  const applyBridgeStatus = useCallback(
    (status: BridgeStatus) => {
      setBridge(status);

      const previous = previousBridgeState.current;
      previousBridgeState.current = status.state;

      if (previous === null) {
        if (status.state === "connected") {
          logActivity("MCP bridge connected.", "success");
        } else if (status.state === "disconnected") {
          logActivity(
            "MCP bridge offline. Start the MCP server, then click Retry.",
            "error",
          );
        }
        return;
      }

      if (previous === status.state) return;
      if (status.state === "connected") {
        logActivity("MCP bridge connected.", "success");
      } else if (previous === "connected" && status.state === "disconnected") {
        logActivity(
          "MCP bridge disconnected. Retrying automatically.",
          "error",
        );
      }
    },
    [logActivity],
  );

  // Reload the active tab and check whether its site is allowed.
  const refreshActiveTab = useCallback(async (): Promise<TabInfo | null> => {
    try {
      const tab = await sendRequest("GET_ACTIVE_TAB", {});
      setActiveTab(tab);

      if (!tab) {
        setActiveSiteAllowed(false);
        setSiteState("unsupported");
        return null;
      }

      if (!tab.url || !isSupportedPageUrl(tab.url)) {
        setActiveSiteAllowed(false);
        setSiteState("unsupported");
        return tab;
      }

      let allowed = false;
      try {
        allowed = await chrome.permissions.contains({
          origins: [originPattern(tab.url)],
        });
      } catch {
        allowed = false;
      }

      setActiveSiteAllowed(allowed);
      setSiteState(allowed ? "allowed" : "missing");
      return tab;
    } finally {
      setActiveLoading(false);
    }
  }, []);

  // Run an async action and log any failure.
  const run = useCallback(
    (task: () => Promise<void>) => {
      void task().catch((error: unknown) =>
        logActivity(errorMessage(error), "error"),
      );
    },
    [logActivity],
  );

  // Ask Chrome for permission before operating on a site.
  const ensureSiteAccess = useCallback(
    async (url: string) => {
      if (!isSupportedPageUrl(url)) {
        throw new Error("Agentium only supports http and https pages.");
      }

      if (allSitesAllowed) return;

      const origin = new URL(url).origin;
      const currentUrl = activeTab?.url ?? "";
      const sameOrigin =
        isSupportedPageUrl(currentUrl) && new URL(currentUrl).origin === origin;

      if (sameOrigin && activeSiteAllowed) return;

      const granted = await chrome.permissions.request({
        origins: [originPattern(url)],
      });
      if (!granted) {
        throw new Error(
          `Access to ${origin} was not granted. Allow this site before running page actions.`,
        );
      }

      if (sameOrigin) {
        setActiveSiteAllowed(true);
        setSiteState("allowed");
      }
    },
    [activeSiteAllowed, activeTab, allSitesAllowed],
  );

  // Inspect the page and store its interactive elements.
  const inspectActivePage = useCallback(
    async (tabOverride?: TabInfo, accessChecked = false) => {
      const tab = tabOverride ?? activeTab;
      if (!tab?.url) {
        throw new Error(
          "No active tab is available. Focus a normal tab and reopen the popup.",
        );
      }

      if (!accessChecked) await ensureSiteAccess(tab.url);

      setInspecting(true);
      try {
        const inspection = await sendRequest("INSPECT_PAGE", {
          tabId: tab.id,
          maxElements: 120,
        });
        setElements(inspection.elements);
        setElementMeta({
          returned: inspection.returned,
          total: inspection.total,
          truncated: inspection.truncated,
        });
        logActivity(
          `Inspected ${inspection.returned} elements on ${inspection.title || inspection.url}.`,
          "success",
        );
      } finally {
        setInspecting(false);
      }
    },
    [activeTab, ensureSiteAccess, logActivity],
  );

  // Extract page text or links and show the result.
  const extract = useCallback(
    async (mode: "text" | "links") => {
      const tab = activeTab;
      if (!tab?.url) {
        throw new Error(
          "No active tab is available. Focus a normal tab and reopen the popup.",
        );
      }

      await ensureSiteAccess(tab.url);
      setExtracting(mode);

      try {
        if (mode === "text") {
          const extraction = await sendRequest("EXTRACT_CONTENT", {
            tabId: tab.id,
            format: "text",
            maxChars: 4000,
          });
          setResult({ title: "Page text", body: extraction.text ?? "" });
          logActivity(
            `Extracted page text${extraction.truncated ? " (truncated to 4000 characters)" : ""}.`,
            "success",
          );
          return;
        }

        const extraction = await sendRequest("EXTRACT_CONTENT", {
          tabId: tab.id,
          format: "links",
          maxItems: 100,
        });
        const links = extraction.links ?? [];
        const body = links
          .map((link) => `${link.text || "(no text)"}\n${link.href}`)
          .join("\n\n");
        setResult({
          title: `Links (${links.length}${extraction.truncated ? "+" : ""})`,
          body: body || "(No links found.)",
        });
        logActivity(
          `Extracted ${links.length}${extraction.truncated ? "+" : ""} links.`,
          "success",
        );
      } finally {
        setExtracting(null);
      }
    },
    [activeTab, ensureSiteAccess, logActivity],
  );

  // Poll the bridge status while the popup is open.
  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const status = await fetchBridgeStatus();
        if (!cancelled) applyBridgeStatus(status);
      } catch (error) {
        if (cancelled) return;
        applyBridgeStatus({
          state: "disconnected",
          url: BRIDGE_WEBSOCKET_URL,
          lastError: errorMessage(error),
          lastConnectedAt: null,
          nextRetryAt: null,
        });
      }
    };

    void refresh();
    const poll = window.setInterval(() => {
      void refresh();
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [applyBridgeStatus]);

  // Load permissions, the active tab, and the tab list on first render.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const all = await chrome.permissions.contains({
          origins: ["http://*/*", "https://*/*"],
        });
        if (!cancelled) setAllSitesAllowed(all);
      } catch {
        if (!cancelled) setAllSitesAllowed(false);
      }

      try {
        await refreshActiveTab();
      } catch (error) {
        if (!cancelled) logActivity(errorMessage(error), "error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [logActivity, refreshActiveTab]);

  // Keep the URL field in sync unless the user is editing it.
  useEffect(() => {
    if (document.activeElement?.id !== "navigate-url" && activeTab?.url) {
      setNavigateUrl(activeTab.url);
    }
  }, [activeTab]);

  const canOperate = Boolean(
    activeTab?.url && isSupportedPageUrl(activeTab.url),
  );
  const busy = inspecting || extracting !== null;

  // Grant access to the active tab's site.
  const handleAllow = () => {
    run(async () => {
      const tab = activeTab;
      if (!tab?.url) {
        throw new Error(
          "No active tab is available. Focus a normal tab and reopen the popup.",
        );
      }
      if (activeSiteAllowed) {
        logActivity("Site access is already allowed.");
        return;
      }
      await ensureSiteAccess(tab.url);
      await refreshActiveTab();
      logActivity(`Access granted for ${new URL(tab.url).origin}.`, "success");
    });
  };

  // Ask the service worker to reconnect to the MCP bridge.
  const handleRetry = () => {
    setReconnecting(true);
    logActivity("Reconnecting to the MCP bridge…");
    run(async () => {
      try {
        const status = await requestBridgeReconnect();
        applyBridgeStatus(status);
        if (status.state !== "connected" && status.lastError) {
          logActivity(status.lastError, "error");
        }
      } finally {
        setReconnecting(false);
      }
    });
  };

  // Navigate the active tab to the URL in the form.
  const handleNavigate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const tab = activeTab;
    if (!tab) {
      logActivity("No active tab is available.", "error");
      return;
    }

    let targetUrl: string;
    try {
      targetUrl = normalizeUrl(navigateUrl);
    } catch (error) {
      logActivity(errorMessage(error), "error");
      return;
    }

    run(async () => {
      await ensureSiteAccess(targetUrl);
      const target = await sendRequest("NAVIGATE", {
        tabId: tab.id,
        url: targetUrl,
      });
      setActiveTab(target);
      setNavigateUrl(target.url);
      await refreshActiveTab();
      logActivity(`Navigated to ${target.url}.`, "success");

      try {
        await inspectActivePage(target, true);
      } catch (error) {
        logActivity(
          `Navigated, but inspection failed: ${errorMessage(error)}`,
          "error",
        );
      }
    });
  };

  // Click an inspected element in the active tab.
  const handleElementClick = (element: InspectedElement) => {
    const tab = activeTab;
    if (!tab?.url) {
      logActivity("No active tab is available.", "error");
      return;
    }
    run(async () => {
      await ensureSiteAccess(tab.url);
      const interaction = await sendRequest("CLICK_ELEMENT", {
        tabId: tab.id,
        ref: element.ref,
      });
      logActivity(
        `Clicked ${element.ref}. Page: ${interaction.title || interaction.url}`,
        "success",
      );
    });
  };

  // Fill an inspected field in the active tab.
  const handleElementFill = (element: InspectedElement, text: string) => {
    const tab = activeTab;
    if (!tab?.url) {
      logActivity("No active tab is available.", "error");
      return;
    }
    run(async () => {
      await ensureSiteAccess(tab.url);
      const interaction = await sendRequest("TYPE_ELEMENT", {
        tabId: tab.id,
        ref: element.ref,
        text,
      });
      logActivity(
        `Filled ${element.ref}. Page: ${interaction.title || interaction.url}`,
        "success",
      );
    });
  };

  return (
    <main className="popup">
      <Header bridge={bridge} />

      {bridge && bridge.state !== "connected" ? (
        <BridgeBanner
          status={bridge}
          reconnecting={reconnecting}
          onRetry={handleRetry}
        />
      ) : null}

      <ActiveCard
        activeTab={activeTab}
        loading={activeLoading}
        siteState={siteState}
        allSitesAllowed={allSitesAllowed}
        canOperate={canOperate}
        busy={busy}
        inspecting={inspecting}
        extracting={extracting}
        onAllow={handleAllow}
        onInspect={() => run(() => inspectActivePage())}
        onExtract={(mode) => run(() => extract(mode))}
      />

      <NavigateCard
        value={navigateUrl}
        disabled={!activeTab}
        onChange={setNavigateUrl}
        onSubmit={handleNavigate}
      />

      {result ? (
        <ResultCard
          result={result}
          onCopy={() =>
            run(async () => {
              await navigator.clipboard.writeText(result.body);
              logActivity("Copied the result to the clipboard.", "success");
            })
          }
          onClose={() => setResult(null)}
        />
      ) : null}

      <ElementsCard
        elements={elements}
        meta={elementMeta}
        inspecting={inspecting}
        onClick={handleElementClick}
        onFill={handleElementFill}
      />

      <Footer version={chrome.runtime.getManifest().version} />
    </main>
  );
}

// Mount the popup into its HTML root element.
const rootElement = document.getElementById("root");
if (!rootElement)
  throw new Error("The extension popup is missing its root element.");

createRoot(rootElement).render(<App />);
