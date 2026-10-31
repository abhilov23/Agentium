# Agentium MCP Server

[![npm version](https://img.shields.io/npm/v/agentium-mcp.svg?style=flat-square&color=14b8a6)](https://www.npmjs.com/package/agentium-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Protocol: Model Context Protocol](https://img.shields.io/badge/Protocol-Model%20Context%20Protocol-teal.svg?style=flat-square)](https://modelcontextprotocol.io)
[![Node.js: >=22.13](https://img.shields.io/badge/Node.js-%3E%3D22.13-green.svg?style=flat-square)](https://nodejs.org)

> **Local-first Chrome browser automation bridge for AI assistants over Model Context Protocol (MCP).**

Agentium bridges your AI clients (**Claude Desktop**, **Cursor**, **Antigravity**, **Windsurf**, or custom LLM agents) directly to your real, active Chrome browser. It exposes **30 typed browser tools** over standard input/output (`stdio`) and forwards actions through a loopback WebSocket bridge (`ws://127.0.0.1:3777`) to the Agentium Chrome Extension.

* **Zero cloud relays or hosted browsers:** Runs 100% on your local machine.
* **Real authenticated sessions:** Interacts with tabs you are already signed into.
* **Ephemeral element refs (`@e1`, `@e2`):** Eliminates brittle CSS/XPath selectors.
* **Trusted input events:** Dispatches clicks via Chrome Debugger Protocol (CDP) so modern reactive apps (React, Angular, Vue) register real hardware interactions.
* **Strict security boundaries:** Operates only on tabs you explicitly authorize.

---

## Quickstart

### 1. Instant Execution via `npx`

No installation required. Run directly in your terminal:

```bash
npx -y agentium-mcp
```

Or install globally:

```bash
npm install -g agentium-mcp
agentium-mcp
```

*(The server binds a loopback listener to `ws://127.0.0.1:3777` and waits for your Agentium Chrome Extension to connect).*

---

## Client Integration

Add Agentium to your favorite MCP client configuration:

### Claude Desktop

Edit your `claude_desktop_config.json`:
* **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "agentium": {
      "command": "npx",
      "args": ["-y", "agentium-mcp"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your workspace root (or in Cursor Settings → Features → MCP):

```json
{
  "mcpServers": {
    "agentium": {
      "command": "npx",
      "args": ["-y", "agentium-mcp"]
    }
  }
}
```

### Antigravity / Gemini CLI

Add to your global `~/.gemini/config/mcp_config.json`:

```json
{
  "mcpServers": {
    "agentium": {
      "command": "npx",
      "args": ["-y", "agentium-mcp"]
    }
  }
}
```

### Claude Code CLI

```bash
claude mcp add agentium -- npx -y agentium-mcp
```

### Smithery CLI

```bash
npx -y @smithery/cli install agentium-mcp --client claude
```

---

## Setting Up the Companion Chrome Extension

Agentium requires the companion Manifest V3 Chrome extension to communicate with tabs:

1. Clone the repository and build the extension:
   ```bash
   git clone https://github.com/abhilov23/agentium.git
   cd Agentium/apps/extension
   pnpm install && pnpm build
   ```
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the upper-right corner).
4. Click **Load unpacked** and select the `apps/extension/dist` directory.
5. Pin **Agentium** in your Chrome toolbar.
6. Open any tab you wish to automate (e.g. `https://github.com`) and click the Agentium extension icon to authorize site access.

---

## System Architecture

```
┌─────────────────────────────────┐
│           MCP Client            │ (Claude, Cursor, Antigravity)
└───────────────┬─────────────────┘
                │ stdio (JSON-RPC 2.0)
┌───────────────▼─────────────────┐
│       agentium-mcp Server       │ (Validates tools via Zod schemas)
└───────────────┬─────────────────┘
                │ ws://127.0.0.1:3777 (Loopback WebSocket)
┌───────────────▼─────────────────┐
│     Agentium Chrome Extension   │ (Manifest V3 Service Worker)
└───────┬─────────────────┬───────┘
        │ CDP             │ chrome.tabs.sendMessage
┌───────▼───────┐ ┌───────▼───────┐
│ Hardware Click│ │ Content Script│ (Computes bounds & assigns @e1, @e2 refs)
└───────┬───────┘ └───────┬───────┘
        │                 │
┌───────▼─────────────────▼───────┐
│       Authorized Web Tab        │
└─────────────────────────────────┘
```

---

## 30 Typed Browser Tools

Every tool call is validated at runtime with Zod:

### Tabs & Windows
* `browser_tabs()` — List open tabs with `tabId`, title, URL, active state, and authorization status.
* `browser_open_tab({ url?, active? })` — Open a new browser tab.
* `browser_switch_tab({ tabId })` — Focus an open tab.
* `browser_close_tab({ tabId })` — Close a tab safely.

### Navigation & Page State
* `browser_navigate({ tabId, url })` — Navigate targeted tab to a URL.
* `browser_go_back({ tabId })` — Navigate back in history.
* `browser_go_forward({ tabId })` — Navigate forward in history.
* `browser_reload_tab({ tabId, bypassCache? })` — Reload tab with optional cache bypass.
* `browser_stop_loading({ tabId })` — Stop page load.
* `browser_get_navigation_state({ tabId })` — Get URL, loading state, canGoBack/Forward.

### Inspection & Interaction (Ephemeral Refs)
* `browser_inspect({ tabId, selector? })` — Crawl interactive elements and generate short-lived `@e1`, `@e2` refs.
* `browser_click({ tabId, ref, button? })` — Dispatch a trusted click via Chrome Debugger Protocol.
* `browser_type({ tabId, ref, text, pressEnter? })` — Type text into an input element.
* `browser_fill_form({ tabId, fields })` — Batch fill multiple inputs by ref.
* `browser_hover_element({ tabId, ref })` — Hover over an element by ref.
* `browser_upload_file({ tabId, ref, filePaths })` — Set file inputs for upload from absolute paths.
* `browser_handle_dialog({ tabId, accept, promptText? })` — Handle javascript alerts/confirms.

### Extraction & Search
* `browser_extract_content({ tabId, format? })` — Extract clean Markdown, plain text, or stripped HTML.
* `browser_evaluate_js({ tabId, script })` — Evaluate isolated JavaScript inside page context.
* `browser_find_text({ tabId, query })` — Find text occurrences across document.

### Screen & Waiting
* `browser_capture_screenshot({ tabId, fullPage?, format? })` — Full-page or viewport screenshot as base64.
* `browser_scroll_page({ tabId, deltaY, deltaX? })` — Scroll page by pixel delta.
* `browser_wait_for_selector({ tabId, selector, timeoutMs? })` — Wait for selector visibility.
* `browser_wait_for_url({ tabId, pattern, timeoutMs? })` — Wait for URL pattern match.
* `browser_wait_for_network_idle({ tabId, idleTimeMs?, timeoutMs? })` — Wait for network settle.
* `browser_get_page_state({ tabId })` — Get readyState, dimensions, scroll position.

### Downloads & Cookies
* `browser_download_file({ url, filename? })` — Download file via Chrome download manager.
* `browser_downloads_list({ limit? })` — List recent downloads.
* `browser_get_cookies({ url, name? })` — Get cookies for authorized origin.
* `browser_set_cookie({ url, name, value, domain? })` — Set cookie on authorized domain.

---

## Security & Privacy Principles

1. **Loopback Only:** The WebSocket bridge binds to `127.0.0.1:3777` strictly. No public interfaces or external ports are exposed.
2. **Explicit Authorization:** The extension blocks actions on tabs unless you explicitly grant site access via the extension popup or Chrome permissions.
3. **On-Demand Injection:** Content scripts are only injected when an inspection or interaction tool is invoked on an authorized tab.
4. **Pristine Stdio:** MCP protocol communication uses standard I/O; all diagnostic logs are routed to `stderr` to keep protocol traffic uncorrupted.

---

## Development

```bash
# Clone monorepo
git clone https://github.com/abhilov23/agentium.git
cd Agentium

# Install dependencies
pnpm install

# Run MCP server in development watch mode
cd apps/mcp
pnpm dev

# Build for distribution
pnpm build
```

---

## Publishing to npm

This package is published on npm as `agentium-mcp` (v0.1.0):

https://www.npmjs.com/package/agentium-mcp

To install and run:

```bash
npx -y agentium-mcp
```

Or install globally:

```bash
npm install -g agentium-mcp
agentium-mcp
```

To publish updates, log in to npm, bump the version, and publish:

```bash
npm login
npm version patch   # or minor/major
pnpm build
npm publish --access public
```

Previously published versions are immutable; use `npm version` to release changes.

---

## License

[MIT License](LICENSE) © 2026 Agentium Authors.
