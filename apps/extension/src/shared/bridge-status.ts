export const BRIDGE_WEBSOCKET_URL = "ws://127.0.0.1:3777";
export const BRIDGE_STATUS_REQUEST = "BRIDGE_STATUS";
export const BRIDGE_RECONNECT_REQUEST = "BRIDGE_RECONNECT";
export const BRIDGE_RECONNECT_ALARM = "foundrylens-bridge-reconnect";

export type BridgeConnectionState = "connected" | "connecting" | "disconnected";

export interface BridgeStatus {
  state: BridgeConnectionState;
  url: string;
  lastError: string | null;
  lastConnectedAt: number | null;
  nextRetryAt: number | null;
}

export type BridgeControlRequest =
  | { type: typeof BRIDGE_STATUS_REQUEST }
  | { type: typeof BRIDGE_RECONNECT_REQUEST };

export function isBridgeControlRequest(value: unknown): value is BridgeControlRequest {
  if (typeof value !== "object" || value === null) return false;
  const type = (value as { type?: unknown }).type;
  return type === BRIDGE_STATUS_REQUEST || type === BRIDGE_RECONNECT_REQUEST;
}

export function isBridgeStatus(value: unknown): value is BridgeStatus {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  if (record.state !== "connected" && record.state !== "connecting" && record.state !== "disconnected") {
    return false;
  }
  return (
    typeof record.url === "string" &&
    (record.lastError === null || typeof record.lastError === "string") &&
    (record.lastConnectedAt === null || typeof record.lastConnectedAt === "number") &&
    (record.nextRetryAt === null || typeof record.nextRetryAt === "number")
  );
}
