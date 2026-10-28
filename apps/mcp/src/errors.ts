export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}

export class SessionNotFoundError extends ToolError {
  constructor(message: string) {
    super(message);
    this.name = "SessionNotFoundError";
  }
}

export function sessionNotFoundMessage(sessionId: string): string {
  return `Browser session "${sessionId}" was not found. Call browser_session_list to see active sessions, or browser_session_create to create a new one.`;
}

export function toAgentMessage(error: unknown): string {
  if (error instanceof ToolError) {
    return error.message;
  }

  const message = error instanceof Error ? error.message : String(error);
  const detail = message.length > 500 ? `${message.slice(0, 497)}...` : message;

  if ((error instanceof Error && error.name === "TimeoutError") || /timeout .* exceeded/i.test(message)) {
    return "The browser operation timed out. The page may still be loading; inspect the page again before retrying.";
  }

  if (/strict mode violation/i.test(message)) {
    return "The target matched more than one element. Pass a ref from browser_inspect or use a more specific selector.";
  }

  if (/not visible|intercepts pointer events|element is not stable/i.test(message)) {
    return "The target is not currently interactable. Inspect the page again and choose a visible element.";
  }

  if (/execution context was destroyed|target closed|target page, context or browser has been closed|frame was detached/i.test(message)) {
    return "The page changed or closed while the action was running. Inspect the current page before retrying.";
  }

  const networkError = /net::ERR_[A-Z_]+/.exec(message)?.[0];
  if (networkError) {
    return `The page could not be reached (${networkError}). Check the URL and try again.`;
  }

  return `The browser operation failed: ${detail}`;
}
