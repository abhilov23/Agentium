# Agentium MCP Server

Local Chrome automation for AI assistants over the Model Context Protocol.

The MCP server exposes ~30 typed browser tools over stdio and forwards them to the Agentium Chrome extension through a local loopback WebSocket bridge (`ws://127.0.0.1:3777`). Nothing leaves your machine — no hosted browser, cloud relay, or remote session.

## Install

```bash
pnpm install
```

## Run

Start the server (binds the WebSocket bridge):

```bash
cd apps/mcp
pnpm start
```

Or in dev mode:

```bash
pnpm dev
```

The server binds `ws://127.0.0.1:3777` and waits for the Agentium extension to connect.

## Tools

Registers ~30 browser tools:

- **Tabs**: `browser_tabs`, `browser_open_tab`, `browser_switch_tab`, `browser_close_tab`
- **Navigation**: `browser_navigate`, `browser_go_back`, `browser_go_forward`, `browser_reload_tab`, `browser_stop_loading`, `browser_get_navigation_state`
- **Inspection & interaction**: `browser_inspect`, `browser_click`, `browser_type`, `browser_handle_dialog`, `browser_fill_form`, `browser_hover_element`, `browser_upload_file`
- **Extraction**: `browser_extract_content`, `browser_evaluate_js`, `browser_find_text`
- **Screen & scroll**: `browser_capture_screenshot`, `browser_scroll_page`, `browser_wait_for_selector`, `browser_wait_for_url`, `browser_wait_for_network_idle`, `browser_get_page_state`
- **Downloads & cookies**: `browser_download_file`, `browser_downloads_list`, `browser_get_cookies`, `browser_set_cookie`

Element refs returned by `browser_inspect` are ephemeral and valid only for the current page state.

## Architecture

MCP client → MCP server (stdio) → ExtensionBridge (WebSocket `127.0.0.1:3777`) → Chrome extension service worker → content script → page.

All diagnostics write to stderr so stdout stays clean for MCP protocol traffic.

## Security

- The bridge binds to loopback only.
- Page actions require explicit site authorization via Chrome permissions.
- Only `http` and `https` pages can be controlled; Chrome-internal pages cannot.

## Develop

```bash
pnpm check-types   # TypeScript type check
pnpm build         # tsc → dist/
```
