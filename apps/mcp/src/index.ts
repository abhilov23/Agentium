#!/usr/bin/env node
// Process entry point: starts the MCP server over stdio.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { server, startServer, stopServer } from "./server.js";

let shuttingDown = false;

// Stop the WebSocket bridge and exit the process once.
async function shutdown(exitCode = 0): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  await stopServer().catch((error: unknown) => {
    console.error(error);
  });
  process.exit(exitCode);
}

// Start the extension bridge, then connect the MCP server to stdin/stdout.
async function main(): Promise<void> {
  await startServer();

  const transport = new StdioServerTransport();

  await server.connect(transport);
}

// Shut down cleanly when the host closes the process or its stdin.
process.once("SIGINT", () => void shutdown(0));
process.once("SIGTERM", () => void shutdown(0));
process.stdin.once("end", () => void shutdown(0));

main().catch(async (error) => {
  console.error(error);
  await stopServer().catch(() => undefined);
  process.exit(1);
});
