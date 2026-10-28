import { randomUUID } from "node:crypto";

import { WebSocket, WebSocketServer, type RawData } from "ws";
import { z } from "zod";

import { ToolError } from "../errors.js";
import type { BridgeAction, BridgeActionMap, BridgeRequest } from "./types.js";

const BRIDGE_HOST = "127.0.0.1";
const BRIDGE_PORT = 3777;
const REQUEST_TIMEOUT_MS = 30_000;
const HEARTBEAT_INTERVAL_MS = 20_000;

const bridgeResponseSchema = z.discriminatedUnion("success", [
  z.object({ id: z.string(), success: z.literal(true), data: z.unknown().optional() }),
  z.object({ id: z.string(), success: z.literal(false), error: z.string() }),
]);

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}

export class ExtensionBridge {
  private server: WebSocketServer | null = null;

  private socket: WebSocket | null = null;

  private pending = new Map<string, PendingRequest>();

  private heartbeat: NodeJS.Timeout | null = null;

  async start(): Promise<void> {
    if (this.server) return;

    await new Promise<void>((resolve, reject) => {
      const server = new WebSocketServer({ host: BRIDGE_HOST, port: BRIDGE_PORT });
      let listening = false;

      server.on("error", (error) => {
        if (!listening) {
          reject(
            new ToolError(
              `The FoundryLens extension bridge could not start on ws://${BRIDGE_HOST}:${BRIDGE_PORT}. Stop any other FoundryLens MCP instance and restart this server. ${error.message}`,
            ),
          );
          return;
        }
        this.log(`bridge server error: ${error.message}`);
      });

      server.once("listening", () => {
        listening = true;
        this.server = server;
        this.log(`extension bridge listening on ws://${BRIDGE_HOST}:${BRIDGE_PORT}`);
        resolve();
      });

      server.on("connection", (socket, request) => this.handleConnection(socket, request.headers.origin));
    });
  }

  async stop(): Promise<void> {
    this.stopHeartbeat();
    this.rejectPending("The FoundryLens MCP server is shutting down.");

    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.terminate();
    }

    const server = this.server;
    this.server = null;
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }

  async request<Action extends BridgeAction>(
    action: Action,
    payload: BridgeActionMap[Action]["payload"],
  ): Promise<BridgeActionMap[Action]["result"]> {
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new ToolError(
        "The FoundryLens browser extension is not connected. Open Chrome, reload apps/extension/dist from chrome://extensions, open the extension popup, and click Retry. Also make sure only one FoundryLens MCP server is running.",
      );
    }

    const id = randomUUID();
    const request = { id, action, payload } as BridgeRequest;

    return await new Promise<BridgeActionMap[Action]["result"]>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(
          new ToolError(
            "The browser extension did not respond in time. Make sure Chrome is open, the extension is connected, and the page is responsive. Inspect the page again before retrying.",
          ),
        );
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(id, {
        resolve: (data) => resolve(data as BridgeActionMap[Action]["result"]),
        reject,
        timer,
      });

      try {
        socket.send(JSON.stringify(request));
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(
          new ToolError(
            `The request could not be sent to the browser extension: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
      }
    });
  }

  private handleConnection(socket: WebSocket, origin: string | undefined): void {
    if (origin !== undefined && !origin.startsWith("chrome-extension://")) {
      socket.close(1008, "Only FoundryLens extension connections are accepted.");
      return;
    }

    if (this.socket) {
      this.rejectPending("The browser extension reconnected before the operation completed. Inspect the page and try again.");
      this.socket.terminate();
    }

    this.socket = socket;
    this.log(`extension connected (${origin ?? "no origin"})`);
    this.startHeartbeat();

    socket.on("message", (data) => this.handleMessage(data));
    socket.on("close", () => {
      if (this.socket !== socket) return;
      this.socket = null;
      this.stopHeartbeat();
      this.rejectPending("The browser extension disconnected before the operation completed. Check that Chrome and the extension are still running.");
      this.log("extension disconnected");
    });
    socket.on("error", (error) => this.log(`extension socket error: ${error.message}`));
  }

  private handleMessage(data: RawData): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data.toString());
    } catch {
      this.log("ignored a malformed extension message");
      return;
    }

    if (isPong(parsed)) return;

    const response = bridgeResponseSchema.safeParse(parsed);
    if (!response.success) {
      this.log("ignored an invalid extension response");
      return;
    }

    const pending = this.pending.get(response.data.id);
    if (!pending) return;

    this.pending.delete(response.data.id);
    clearTimeout(pending.timer);

    if (response.data.success) {
      pending.resolve(response.data.data);
    } else {
      pending.reject(new ToolError(response.data.error));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeat = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: "ping" }));
      }
    }, HEARTBEAT_INTERVAL_MS);
    this.heartbeat.unref();
  }

  private stopHeartbeat(): void {
    if (!this.heartbeat) return;
    clearInterval(this.heartbeat);
    this.heartbeat = null;
  }

  private rejectPending(message: string): void {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(new ToolError(message));
      this.pending.delete(id);
    }
  }

  private log(message: string): void {
    process.stderr.write(`[foundrylens bridge] ${message}\n`);
  }
}

function isPong(value: unknown): boolean {
  return typeof value === "object" && value !== null && (value as { type?: unknown }).type === "pong";
}
