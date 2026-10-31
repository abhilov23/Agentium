"use client";

import { useState } from "react";
import Link from "next/link";

type TabKey = "config" | "toolcalls" | "sdk";

interface CodeLineToken {
  text: string;
  type?: "keyword" | "string" | "comment" | "function" | "plain" | "property" | "punctuation";
}

const CONFIG_CODE: CodeLineToken[][] = [
  [{ text: "// Add to claude_desktop_config.json or .cursor/mcp.json", type: "comment" }],
  [{ text: "{", type: "punctuation" }],
  [
    { text: '  "mcpServers"', type: "property" },
    { text: ": {", type: "punctuation" },
  ],
  [
    { text: '    "agentium"', type: "property" },
    { text: ": {", type: "punctuation" },
  ],
  [
    { text: '      "command"', type: "property" },
    { text: ": ", type: "punctuation" },
    { text: '"npx"', type: "string" },
    { text: ",", type: "punctuation" },
  ],
  [
    { text: '      "args"', type: "property" },
    { text: ": [", type: "punctuation" },
    { text: '"-y"', type: "string" },
    { text: ", ", type: "punctuation" },
    { text: '"agentium-mcp"', type: "string" },
    { text: "]", type: "punctuation" },
  ],
  [{ text: "    }", type: "punctuation" }],
  [{ text: "  }", type: "punctuation" }],
  [{ text: "}", type: "punctuation" }],
];

const TOOLCALLS_CODE: CodeLineToken[][] = [
  [{ text: '// 1. AI lists user\'s open Chrome tabs via MCP', type: "comment" }],
  [
    { text: "tools/call: ", type: "keyword" },
    { text: "browser_tabs", type: "function" },
    { text: "()", type: "punctuation" },
  ],
  [
    { text: "→ ", type: "punctuation" },
    { text: '[{ tabId: 1042, title: "PR #12: Fix Auth · abhilov23/agentium", active: true }]', type: "string" },
  ],
  [],
  [{ text: '// 2. AI inspects active tab — gets ephemeral refs (@e1, @e2)', type: "comment" }],
  [
    { text: "tools/call: ", type: "keyword" },
    { text: "browser_inspect", type: "function" },
    { text: '({ tabId: 1042 })', type: "punctuation" },
  ],
  [
    { text: "→ ", type: "punctuation" },
    { text: '{ elements: ["@e1 button:Approve", "@e2 button:Merge", "@e3 textarea:Comment"] }', type: "string" },
  ],
  [],
  [{ text: '// 3. AI dispatches trusted hardware click via Chrome Debugger Protocol (CDP)', type: "comment" }],
  [
    { text: "tools/call: ", type: "keyword" },
    { text: "browser_click", type: "function" },
    { text: '({ ref: "e1" })', type: "punctuation" },
  ],
  [
    { text: "→ ", type: "punctuation" },
    { text: '{ success: true, method: "CDP_MOUSE_EVENT", verified: true }', type: "string" },
  ],
];

const SDK_CODE: CodeLineToken[][] = [
  [
    { text: "import ", type: "keyword" },
    { text: "{ Client } ", type: "plain" },
    { text: "from ", type: "keyword" },
    { text: '"@modelcontextprotocol/sdk/client/index.js"', type: "string" },
    { text: ";", type: "punctuation" },
  ],
  [
    { text: "import ", type: "keyword" },
    { text: "{ StdioClientTransport } ", type: "plain" },
    { text: "from ", type: "keyword" },
    { text: '"@modelcontextprotocol/sdk/client/stdio.js"', type: "string" },
    { text: ";", type: "punctuation" },
  ],
  [],
  [{ text: "// Connect your agent directly to local agentium-mcp", type: "comment" }],
  [
    { text: "const ", type: "keyword" },
    { text: "transport = ", type: "plain" },
    { text: "new ", type: "keyword" },
    { text: "StdioClientTransport", type: "function" },
    { text: '({ command: "npx", args: ["-y", "agentium-mcp"] });', type: "punctuation" },
  ],
  [
    { text: "const ", type: "keyword" },
    { text: "client = ", type: "plain" },
    { text: "new ", type: "keyword" },
    { text: "Client", type: "function" },
    { text: '({ name: "my-agent", version: "1.0.0" });', type: "punctuation" },
  ],
  [
    { text: "await ", type: "keyword" },
    { text: "client.connect(transport);", type: "plain" },
  ],
  [],
  [{ text: "// Call browser tools with full typed schema validation", type: "comment" }],
  [
    { text: "const ", type: "keyword" },
    { text: "page = ", type: "plain" },
    { text: "await ", type: "keyword" },
    { text: "client.callTool({ name: ", type: "plain" },
    { text: '"browser_inspect"', type: "string" },
    { text: ", arguments: { tabId: 1042 } });", type: "punctuation" },
  ],
  [
    { text: "await ", type: "keyword" },
    { text: "client.callTool({ name: ", type: "plain" },
    { text: '"browser_click"', type: "string" },
    { text: ', arguments: { ref: "e1" } });', type: "punctuation" },
  ],
];

const RAW_CODE: Record<TabKey, string> = {
  config: `{
  "mcpServers": {
    "agentium": {
      "command": "npx",
      "args": ["-y", "agentium-mcp"]
    }
  }
}`,
  toolcalls: `// 1. AI lists user's open Chrome tabs via MCP
tools/call: browser_tabs()
→ [{ tabId: 1042, title: "PR #12: Fix Auth · abhilov23/agentium", active: true }]

// 2. AI inspects active tab — gets ephemeral refs (@e1, @e2)
tools/call: browser_inspect({ tabId: 1042 })
→ { elements: ["@e1 button:Approve", "@e2 button:Merge", "@e3 textarea:Comment"] }

// 3. AI dispatches trusted hardware click via Chrome Debugger Protocol (CDP)
tools/call: browser_click({ ref: "e1" })
→ { success: true, method: "CDP_MOUSE_EVENT", verified: true }`,
  sdk: `import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "agentium-mcp"],
});
const client = new Client({ name: "my-agent", version: "1.0.0" });
await client.connect(transport);

const page = await client.callTool({
  name: "browser_inspect",
  arguments: { tabId: 1042 },
});

await client.callTool({
  name: "browser_click",
  arguments: { ref: "e1" },
});`,
};

export default function Hero() {
  const [activeTab, setActiveTab] = useState<TabKey>("config");
  const [copied, setCopied] = useState(false);

  const lines =
    activeTab === "config"
      ? CONFIG_CODE
      : activeTab === "toolcalls"
        ? TOOLCALLS_CODE
        : SDK_CODE;

  const fileName =
    activeTab === "config"
      ? "claude_desktop_config.json"
      : activeTab === "toolcalls"
        ? "stdio-mcp-session.json"
        : "agent-mcp-client.ts";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(RAW_CODE[activeTab]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const getTokenColor = (type?: string) => {
    switch (type) {
      case "keyword":
        return "text-[#93c5fd]";
      case "function":
        return "text-[#14b8a6]";
      case "string":
        return "text-[#86efac]";
      case "comment":
        return "text-[#6b7280] italic";
      case "property":
        return "text-[#c084fc]";
      case "punctuation":
        return "text-[#9ca3af]";
      default:
        return "text-[#ededed]";
    }
  };

  return (
    <section className="pt-20 pb-20 px-6">
      <div className="max-w-5xl mx-auto text-center">
        {/* Release badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#1f1f1f] bg-[#111111] mb-8 text-xs font-mono text-[#888]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6] inline-block animate-pulse" />
          <span>npm: agentium-mcp v0.1.1</span>
          <span className="text-[#444]">|</span>
          <a
            href="https://github.com/abhilov23/agentium"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#14b8a6] hover:underline"
          >
            abhilov23/agentium
          </a>
        </div>

        {/* Large Centered Headline */}
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#ededed] mb-6 max-w-4xl mx-auto leading-[1.08]">
          Local Chrome automation for AI assistants over MCP.
        </h1>

        {/* Subtext */}
        <p className="text-base sm:text-lg text-[#888] max-w-2xl mx-auto mb-10 leading-relaxed">
          Agentium is an open-source Model Context Protocol server published on npm as{" "}
          <code className="text-[#ededed] bg-[#1a1a1a] px-1.5 py-0.5 rounded font-mono text-sm">
            agentium-mcp
          </code>
          . Connect Claude Desktop, Cursor, or any agent directly to your active, authenticated Chrome tabs. Zero cloud relays, zero credential leaks.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <Link
            href="#setup-extension"
            className="inline-flex items-center gap-2 bg-[#14b8a6] text-black font-semibold px-6 py-2.5 rounded-md text-sm hover:bg-[#0d9488] transition-colors"
          >
            <span>Setup Chrome Extension</span>
            <span>&rarr;</span>
          </Link>

          <a
            href="https://www.npmjs.com/package/agentium-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-[#1f1f1f] bg-[#111111] text-[#ededed] font-medium px-5 py-2.5 rounded-md text-sm hover:border-[#2a2a2a] hover:bg-[#161616] transition-colors font-mono"
          >
            <span>npm i agentium-mcp</span>
          </a>

          <a
            href="https://github.com/abhilov23/agentium"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-[#1f1f1f] bg-[#111111] text-[#888] hover:text-[#ededed] font-medium px-5 py-2.5 rounded-md text-sm hover:border-[#2a2a2a] hover:bg-[#161616] transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            <span>GitHub</span>
          </a>
        </div>

        {/* Code Tabs Switcher */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setActiveTab("config")}
            className={`text-xs font-mono px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "config"
                ? "bg-[#1f1f1f] text-[#ededed] border border-[#2a2a2a]"
                : "text-[#888] hover:text-[#ededed]"
            }`}
          >
            MCP Config (Claude/Cursor)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("toolcalls")}
            className={`text-xs font-mono px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "toolcalls"
                ? "bg-[#1f1f1f] text-[#ededed] border border-[#2a2a2a]"
                : "text-[#888] hover:text-[#ededed]"
            }`}
          >
            AI Tool Calls (stdio)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sdk")}
            className={`text-xs font-mono px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "sdk"
                ? "bg-[#1f1f1f] text-[#ededed] border border-[#2a2a2a]"
                : "text-[#888] hover:text-[#ededed]"
            }`}
          >
            Agent SDK (@modelcontextprotocol/sdk)
          </button>
        </div>

        {/* Main Code Block Window */}
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl overflow-hidden shadow-none text-left">
          {/* Window Chrome Header */}
          <div className="h-10 px-4 border-b border-[#1f1f1f] bg-[#0c0c0c] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/80 inline-block" />
            </div>

            <span className="text-xs font-mono text-[#888]">{fileName}</span>

            <button
              type="button"
              onClick={handleCopy}
              className="text-xs font-mono text-[#888] hover:text-[#ededed] transition-colors"
            >
              {copied ? "copied" : "copy"}
            </button>
          </div>

          {/* Code Text Area */}
          <div className="p-4 sm:p-6 overflow-x-auto font-mono text-xs sm:text-sm leading-relaxed">
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((lineTokens, lineIdx) => (
                  <tr key={lineIdx} className="hover:bg-[#111111]/40">
                    <td className="w-8 pr-4 text-right text-[#444] select-none align-top font-mono text-xs">
                      {lineIdx + 1}
                    </td>
                    <td className="whitespace-pre font-mono">
                      {lineTokens.length === 0 ? (
                        <span>&nbsp;</span>
                      ) : (
                        lineTokens.map((token, tokenIdx) => (
                          <span
                            key={tokenIdx}
                            className={getTokenColor(token.type)}
                          >
                            {token.text}
                          </span>
                        ))
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
