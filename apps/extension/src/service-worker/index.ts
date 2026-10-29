import type { ResponseEnvelope } from "../shared/protocol";
import {
  BRIDGE_RECONNECT_ALARM,
  BRIDGE_RECONNECT_REQUEST,
  isBridgeControlRequest,
} from "../shared/bridge-status";
import { connectBridge, getBridgeStatus, reconnectBridge } from "./bridge";
import { executeMessage } from "./execute";

function handleMessage(
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
  if (sender.id !== chrome.runtime.id) return false;

  if (isBridgeControlRequest(message)) {
    const status = message.type === BRIDGE_RECONNECT_REQUEST ? reconnectBridge() : getBridgeStatus();
    sendResponse(status);
    return false;
  }

  void executeMessage(message).then((response: ResponseEnvelope) => sendResponse(response));
  return true;
}

chrome.runtime.onMessage.addListener(handleMessage);
chrome.runtime.onStartup.addListener(connectBridge);
chrome.runtime.onInstalled.addListener(connectBridge);
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === BRIDGE_RECONNECT_ALARM) {
    connectBridge();
  }
});
connectBridge();
