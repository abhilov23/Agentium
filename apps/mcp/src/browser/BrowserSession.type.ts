import type { BrowserContext, Page } from "playwright";

export interface BrowserSession {
  sessionId: string;
  context: BrowserContext;
  page: Page;

  createdAt: Date;
  lastAccessedAt: Date;
}
