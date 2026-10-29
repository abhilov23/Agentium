import {
  BRIDGE_RECONNECT_REQUEST,
  BRIDGE_STATUS_REQUEST,
  isBridgeStatus,
  type BridgeControlRequest,
  type BridgeStatus,
} from "../shared/bridge-status";
import { errorMessage } from "../shared/errors";

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

export function fetchBridgeStatus(): Promise<BridgeStatus> {
  return sendBridgeControl({ type: BRIDGE_STATUS_REQUEST });
}

export function requestBridgeReconnect(): Promise<BridgeStatus> {
  return sendBridgeControl({ type: BRIDGE_RECONNECT_REQUEST });
}
