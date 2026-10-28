import { randomUUID } from "node:crypto";

import { chromium, type Browser } from "playwright";

import { SessionNotFoundError, ToolError, sessionNotFoundMessage } from "../errors.js";
import type { BrowserSession } from "./BrowserSession.type.js";

export interface SessionSummary {
  sessionId: string;
  url: string;
  createdAt: string;
  lastAccessedAt: string;
}

export class BrowserManager {
  private browser: Browser | null = null;

  private sessions = new Map<string, BrowserSession>();

  async start(): Promise<void> {
    if (this.browser) {
      return;
    }

    this.browser = await chromium.launch({ headless: true });
  }

  async createSession(): Promise<string> {
    if (!this.browser) {
      throw new ToolError("The browser is not running. Restart the FoundryLens web-intelligence server.");
    }

    const context = await this.browser.newContext();
    const page = await context.newPage();
    const now = new Date();
    const sessionId = randomUUID();

    this.sessions.set(sessionId, {
      sessionId,
      context,
      page,
      createdAt: now,
      lastAccessedAt: now,
    });

    return sessionId;
  }

  getSession(sessionId: string): BrowserSession {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new SessionNotFoundError(sessionNotFoundMessage(sessionId));
    }

    if (session.page.isClosed()) {
      this.sessions.delete(sessionId);
      throw new SessionNotFoundError(
        `Browser session "${sessionId}" is no longer usable because its page was closed. Create a new session and navigate again.`,
      );
    }

    session.lastAccessedAt = new Date();
    return session;
  }

  getSessionOrDefault(sessionId?: string): BrowserSession {
    if (sessionId) {
      return this.getSession(sessionId);
    }

    const latest = this.latestSession();
    if (!latest) {
      throw new ToolError(
        "No browser session exists yet. Call browser_navigate with a URL first, or call browser_session_create.",
      );
    }

    return this.getSession(latest.sessionId);
  }

  async getSessionOrCreate(sessionId?: string): Promise<BrowserSession> {
    if (sessionId) {
      return this.getSession(sessionId);
    }

    const latest = this.latestSession();
    if (latest) {
      return this.getSession(latest.sessionId);
    }

    const created = await this.createSession();
    return this.getSession(created);
  }

  listSessions(): SessionSummary[] {
    return Array.from(this.sessions.values()).map((session) => ({
      sessionId: session.sessionId,
      url: session.page.isClosed() ? "" : session.page.url(),
      createdAt: session.createdAt.toISOString(),
      lastAccessedAt: session.lastAccessedAt.toISOString(),
    }));
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new SessionNotFoundError(sessionNotFoundMessage(sessionId));
    }

    this.sessions.delete(sessionId);
    await session.context.close().catch(() => undefined);
  }

  async close(): Promise<void> {
    const sessions = Array.from(this.sessions.values());
    this.sessions.clear();

    for (const session of sessions) {
      await session.context.close().catch(() => undefined);
    }

    if (this.browser) {
      const browser = this.browser;
      this.browser = null;
      await browser.close().catch(() => undefined);
    }
  }

  private latestSession(): BrowserSession | undefined {
    let latest: BrowserSession | undefined;

    for (const session of this.sessions.values()) {
      if (session.page.isClosed()) {
        continue;
      }
      if (!latest || session.lastAccessedAt > latest.lastAccessedAt) {
        latest = session;
      }
    }

    return latest;
  }
}
