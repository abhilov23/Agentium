# Agentium Chrome Extension

Browser-side adapter for Agentium — a local Chrome automation bridge for AI assistants over MCP.

A Manifest V3 extension that executes browser actions on pages you explicitly authorize. Connects outbound to the local MCP server's WebSocket bridge (`ws://127.0.0.1:3777`) and performs tab navigation, inspection, clicks, fills, extractions, screenshots, downloads, and cookie management.

## Install the extension

1. Build the extension:
   ```bash
   cd apps/extension
   pnpm build
   ```
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the `apps/extension/dist` folder.
5. Open the extension popup and click **Retry** to connect to the MCP bridge.

## Start the MCP server

The extension needs the MCP server running first:

```bash
cd apps/mcp
pnpm start
```

The server binds `ws://127.0.0.1:3777`. The extension connects to it automatically.

## Usage

From your MCP client, call `browser_tabs` to list open tabs, then `browser_inspect` to see interactive elements, then `browser_click` / `browser_type` with element refs to act on the page.

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension manifest (MV3) |
| `src/service-worker/index.ts` | Background service worker — bridges MCP requests to Chrome APIs |
| `src/content/index.ts` | Content script — DOM inspection and page interaction |
| `src/popup/index.tsx` | Popup UI — bridge status, tabs, inspect, extract, navigate |
| `src/shared/` | Shared types, schemas, protocol, messaging |
| `build.mjs` | esbuild bundler + static file copy |

## Security

- Only `http` and `https` pages can be controlled.
- Page actions require explicit site authorization via Chrome permissions (`chrome.permissions.request`).
- Trusted clicks are dispatched through Chrome's debugger protocol.
- The bridge is loopback-only; no external ports are exposed.

## Develop

```bash
pnpm check-types   # TypeScript type check
pnpm build         # esbuild → dist/
pnpm dev           # watch and rebuild
```
