// Expected failure with a message that can be shown directly to the agent.
export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}

// Convert any thrown value into a short message for the MCP client.
export function toAgentMessage(error: unknown): string {
  if (error instanceof ToolError) {
    return error.message;
  }

  const message = error instanceof Error ? error.message : String(error);
  const detail = message.length > 500 ? `${message.slice(0, 497)}...` : message;
  return `The browser operation failed: ${detail}`;
}
