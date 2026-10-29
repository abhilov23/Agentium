// Popup helpers for reading bridge status and requesting a reconnect.
import {
  BRIDGE_RECONNECT_REQUEST,
  BRIDGE_STATUS_REQUEST,
  isBridgeStatus,
  type BridgeControlRequest,
  type BridgeStatus,
} from "../shared/bridge-status";
import { errorMessage } from "../shared/errors";

// Send a bridge control message to the service worker.
async function sendBridgeControl(request: BridgeControlRequest): Promise<BridgeStatus> {
  let raw: unknown;
  try {
    raw = await chrome.runtime.sendMessage(request);
  } catch (error) {
    throw new Error(`Could not reach the extension service worker: ${errorMessage(error)}`);
  }

  if (!isBridgeStatus(raw)) {
    throw new Error("The extension service worker returned an invalid bridge status.");
  }
  return raw;
}

// Read the current bridge connection status.
export function fetchBridgeStatus(): Promise<BridgeStatus> {
  return sendBridgeControl({ type: BRIDGE_STATUS_REQUEST });
}

// Ask the service worker to reconnect to the MCP bridge.
export function requestBridgeReconnect(): Promise<BridgeStatus> {
  return sendBridgeControl({ type: BRIDGE_RECONNECT_REQUEST });
}
