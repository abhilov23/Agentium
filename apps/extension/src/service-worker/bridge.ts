// Maintains the WebSocket connection from the extension to the MCP server.
import { executeMessage } from "./execute";
import {
  BRIDGE_RECONNECT_ALARM,
  BRIDGE_WEBSOCKET_URL,
  type BridgeConnectionState,
  type BridgeStatus,
} from "../shared/bridge-status";

const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 5000;

let socket: WebSocket | null = null;
let reconnectTimer: number | undefined;
let reconnectDelay = RECONNECT_MIN_MS;
let state: BridgeConnectionState = "disconnected";
let lastError: string | null = null;
let lastConnectedAt: number | null = null;
let nextRetryAt: number | null = null;

// Return the current connection state for the popup.
export function getBridgeStatus(): BridgeStatus {
  return {
    state,
    url: BRIDGE_WEBSOCKET_URL,
    lastError,
    lastConnectedAt,
    nextRetryAt,
  };
}

// Open the WebSocket bridge connection and set up reconnect handling.
export function connectBridge(): void {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  state = "connecting";
  lastError = null;
  nextRetryAt = null;
  updateActionStatus();

  let next: WebSocket;
  try {
    next = new WebSocket(BRIDGE_WEBSOCKET_URL);
  } catch (error) {
    state = "disconnected";
    lastError = `Could not open ${BRIDGE_WEBSOCKET_URL}: ${error instanceof Error ? error.message : String(error)}`;
    updateActionStatus();
    scheduleReconnect();
    return;
  }

  socket = next;

  next.addEventListener("open", () => {
    if (socket !== next) return;

    state = "connected";
    lastError = null;
    lastConnectedAt = Date.now();
    nextRetryAt = null;
    clearReconnectTimer();
    void chrome.alarms.clear(BRIDGE_RECONNECT_ALARM).catch(() => undefined);
    updateActionStatus();
    console.log("[Agentium] connected to MCP bridge");
  });

  next.addEventListener("message", (event) => {
    void handleBridgeMessage(event.data, next);
  });

  next.addEventListener("close", (event) => {
    if (socket !== next) return;

    socket = null;
    state = "disconnected";
    lastError = closeMessage(event, lastError);
    nextRetryAt = null;
    updateActionStatus();
    console.warn(`[Agentium] disconnected from MCP bridge: ${lastError}`);
    scheduleReconnect();
  });

  next.addEventListener("error", () => {
    lastError = `Could not reach ${BRIDGE_WEBSOCKET_URL}. Start the Agentium MCP server, then click Retry.`;
    updateActionStatus();
    next.close();
  });
}

// Force a fresh bridge connection, usually from the popup Retry button.
export function reconnectBridge(): BridgeStatus {
  clearReconnectTimer();
  reconnectDelay = RECONNECT_MIN_MS;

  const current = socket;
  socket = null;
  if (current) {
    current.close(1000, "Manual reconnect");
  }

  state = "disconnected";
  lastError = null;
  nextRetryAt = null;
  void chrome.alarms.clear(BRIDGE_RECONNECT_ALARM).catch(() => undefined);
  updateActionStatus();
  connectBridge();
  return getBridgeStatus();
}

// Retry with backoff and keep an alarm alive for service worker restarts.
function scheduleReconnect(): void {
  if (reconnectTimer !== undefined) return;

  nextRetryAt = Date.now() + reconnectDelay;
  updateActionStatus();
  void chrome.alarms.create(BRIDGE_RECONNECT_ALARM, { periodInMinutes: 0.5 }).catch(() => undefined);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined;
    connectBridge();
  }, reconnectDelay);

  reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
}

// Cancel the pending reconnect timer.
function clearReconnectTimer(): void {
  if (reconnectTimer === undefined) return;
  clearTimeout(reconnectTimer);
  reconnectTimer = undefined;
}

// Handle a bridge message: answer pings or run the requested action.
async function handleBridgeMessage(data: unknown, source: WebSocket): Promise<void> {
  if (typeof data !== "string") return;

  let message: unknown;
  try {
    message = JSON.parse(data);
  } catch {
    return;
  }

  if (isPing(message)) {
    sendOn(source, { type: "pong" });
    return;
  }

  sendOn(source, await executeMessage(message));
}

// Send JSON only when the WebSocket is open.
function sendOn(target: WebSocket, message: unknown): void {
  if (target.readyState === WebSocket.OPEN) {
    target.send(JSON.stringify(message));
  }
}

// Check whether a message is the bridge heartbeat.
function isPing(value: unknown): boolean {
  return typeof value === "object" && value !== null && (value as { type?: unknown }).type === "ping";
}

// Build a readable reason for a closed bridge connection.
function closeMessage(event: CloseEvent, fallback: string | null): string {
  if (event.reason) return event.reason;
  if (fallback) return fallback;
  if (event.code === 1006) {
    return `Could not reach ${BRIDGE_WEBSOCKET_URL}. Start the Agentium MCP server, then click Retry.`;
  }
  return `The MCP bridge closed the connection (code ${event.code}). Retrying automatically.`;
}

// Update the toolbar badge and tooltip to show bridge status.
function updateActionStatus(): void {
  const badge = state === "connected" ? "ON" : state === "connecting" ? "..." : "";
  const title =
    state === "connected"
      ? "Agentium - connected to MCP"
      : state === "connecting"
        ? "Agentium - connecting to MCP"
        : "Agentium - MCP not connected. Click for details.";

  void chrome.action.setBadgeText({ text: badge });
  void chrome.action.setBadgeBackgroundColor({ color: state === "connected" ? "#176b53" : "#b7791f" });
  void chrome.action.setTitle({ title });
}
