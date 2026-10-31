"use client";

import { useState } from "react";

type CodeLang = "typescript" | "python";

interface DemoLineToken {
  text: string;
  type?: "keyword" | "string" | "comment" | "function" | "plain" | "property" | "punctuation";
}

const TS_DEMO: DemoLineToken[][] = [
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
  [{ text: "// Initialize connection to local Agentium MCP server via stdio", type: "comment" }],
  [
    { text: "const ", type: "keyword" },
    { text: "transport = ", type: "plain" },
    { text: "new ", type: "keyword" },
    { text: "StdioClientTransport", type: "function" },
    { text: "({", type: "punctuation" },
  ],
  [
    { text: '  command: ', type: "property" },
    { text: '"npx"', type: "string" },
    { text: ",", type: "punctuation" },
  ],
  [
    { text: '  args: ', type: "property" },
    { text: '["-y", "agentium-mcp"]', type: "string" },
    { text: ",", type: "punctuation" },
  ],
  [{ text: "});", type: "punctuation" }],
  [
    { text: "const ", type: "keyword" },
    { text: "client = ", type: "plain" },
    { text: "new ", type: "keyword" },
    { text: "Client", type: "function" },
    { text: '({ name: ', type: "punctuation" },
    { text: '"browser-agent"', type: "string" },
    { text: ', version: ', type: "punctuation" },
    { text: '"1.0.0"', type: "string" },
    { text: " });", type: "punctuation" },
  ],
  [
    { text: "await ", type: "keyword" },
    { text: "client.", type: "plain" },
    { text: "connect", type: "function" },
    { text: "(transport);", type: "punctuation" },
  ],
  [],
  [{ text: "// 1. Discover open tabs in your real Chrome profile", type: "comment" }],
  [
    { text: "const ", type: "keyword" },
    { text: "tabsResult = ", type: "plain" },
    { text: "await ", type: "keyword" },
    { text: "client.", type: "plain" },
    { text: "callTool", type: "function" },
    { text: "({", type: "punctuation" },
  ],
  [
    { text: '  name: ', type: "property" },
    { text: '"browser_tabs"', type: "string" },
    { text: ", arguments: {}", type: "punctuation" },
  ],
  [{ text: "});", type: "punctuation" }],
  [],
  [{ text: "// 2. Navigate tab to URL and inspect interactive DOM", type: "comment" }],
  [
    { text: "await ", type: "keyword" },
    { text: "client.", type: "plain" },
    { text: "callTool", type: "function" },
    { text: "({", type: "punctuation" },
  ],
  [
    { text: '  name: ', type: "property" },
    { text: '"browser_navigate"', type: "string" },
    { text: ", arguments: { url: ", type: "punctuation" },
    { text: '"https://github.com/abhilov23/agentium"', type: "string" },
    { text: " }", type: "punctuation" },
  ],
  [{ text: "});", type: "punctuation" }],
  [],
  [
    { text: "const ", type: "keyword" },
    { text: "dom = ", type: "plain" },
    { text: "await ", type: "keyword" },
    { text: "client.", type: "plain" },
    { text: "callTool", type: "function" },
    { text: "({", type: "punctuation" },
  ],
  [
    { text: '  name: ', type: "property" },
    { text: '"browser_inspect"', type: "string" },
    { text: ", arguments: {}", type: "punctuation" },
  ],
  [{ text: "});", type: "punctuation" }],
  [],
  [{ text: "// 3. Perform trusted CDP click on ephemeral reference handle", type: "comment" }],
  [
    { text: "await ", type: "keyword" },
    { text: "client.", type: "plain" },
    { text: "callTool", type: "function" },
    { text: "({", type: "punctuation" },
  ],
  [
    { text: '  name: ', type: "property" },
    { text: '"browser_click"', type: "string" },
    { text: ", arguments: { ref: ", type: "punctuation" },
    { text: '"e1"', type: "string" },
    { text: " }", type: "punctuation" },
  ],
  [{ text: "});", type: "punctuation" }],
];

const PYTHON_DEMO: DemoLineToken[][] = [
  [
    { text: "import ", type: "keyword" },
    { text: "asyncio", type: "plain" },
  ],
  [
    { text: "from ", type: "keyword" },
    { text: "mcp ", type: "plain" },
    { text: "import ", type: "keyword" },
    { text: "ClientSession, StdioServerParameters", type: "plain" },
  ],
  [
    { text: "from ", type: "keyword" },
    { text: "mcp.client.stdio ", type: "plain" },
    { text: "import ", type: "keyword" },
    { text: "stdio_client", type: "plain" },
  ],
  [],
  [
    { text: "server_params = ", type: "plain" },
    { text: "StdioServerParameters", type: "function" },
    { text: "(command=", type: "punctuation" },
    { text: '"npx"', type: "string" },
    { text: ", args=[", type: "punctuation" },
    { text: '"-y"', type: "string" },
    { text: ", ", type: "punctuation" },
    { text: '"agentium-mcp"', type: "string" },
    { text: "])", type: "punctuation" },
  ],
  [],
  [
    { text: "async def ", type: "keyword" },
    { text: "run_agent", type: "function" },
    { text: "():", type: "punctuation" },
  ],
  [
    { text: "    async with ", type: "keyword" },
    { text: "stdio_client(server_params) ", type: "plain" },
    { text: "as ", type: "keyword" },
    { text: "(read, write):", type: "punctuation" },
  ],
  [
    { text: "        async with ", type: "keyword" },
    { text: "ClientSession(read, write) ", type: "plain" },
    { text: "as ", type: "keyword" },
    { text: "session:", type: "punctuation" },
  ],
  [
    { text: "            ", type: "plain" },
    { text: "await ", type: "keyword" },
    { text: "session.", type: "plain" },
    { text: "initialize", type: "function" },
    { text: "()", type: "punctuation" },
  ],
  [],
  [{ text: "            # List active Chrome tabs", type: "comment" }],
  [
    { text: "            tabs = ", type: "plain" },
    { text: "await ", type: "keyword" },
    { text: "session.", type: "plain" },
    { text: "call_tool", type: "function" },
    { text: "(", type: "punctuation" },
    { text: '"browser_tabs"', type: "string" },
    { text: ", arguments={})", type: "punctuation" },
  ],
  [],
  [{ text: "            # Inspect active tab elements", type: "comment" }],
  [
    { text: "            tree = ", type: "plain" },
    { text: "await ", type: "keyword" },
    { text: "session.", type: "plain" },
    { text: "call_tool", type: "function" },
    { text: "(", type: "punctuation" },
    { text: '"browser_inspect"', type: "string" },
    { text: ", arguments={})", type: "punctuation" },
  ],
  [],
  [{ text: "            # Dispatch CDP trusted click", type: "comment" }],
  [
    { text: "            ", type: "plain" },
    { text: "await ", type: "keyword" },
    { text: "session.", type: "plain" },
    { text: "call_tool", type: "function" },
    { text: "(", type: "punctuation" },
    { text: '"browser_click"', type: "string" },
    { text: ", arguments={", type: "punctuation" },
    { text: '"ref"', type: "string" },
    { text: ': "e1"})', type: "punctuation" },
  ],
  [],
  [
    { text: "asyncio.", type: "plain" },
    { text: "run", type: "function" },
    { text: "(run_agent())", type: "plain" },
  ],
];

const RAW_DEMO_CODE: Record<CodeLang, string> = {
  typescript: `import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Initialize connection to local Agentium MCP server via stdio
const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "agentium-mcp"],
});
const client = new Client({ name: "browser-agent", version: "1.0.0" });
await client.connect(transport);

// 1. Discover open tabs in your real Chrome profile
const tabsResult = await client.callTool({
  name: "browser_tabs",
  arguments: {},
});

// 2. Navigate tab to URL and inspect interactive DOM
await client.callTool({
  name: "browser_navigate",
  arguments: { url: "https://github.com/abhilov23/agentium" },
});

const dom = await client.callTool({
  name: "browser_inspect",
  arguments: {},
});

// 3. Perform trusted CDP click on ephemeral reference handle
await client.callTool({
  name: "browser_click",
  arguments: { ref: "e1" },
});`,

  python: `import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

server_params = StdioServerParameters(command="npx", args=["-y", "agentium-mcp"])

async def run_agent():
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # List active Chrome tabs
            tabs = await session.call_tool("browser_tabs", arguments={})

            # Inspect active tab elements
            tree = await session.call_tool("browser_inspect", arguments={})

            # Dispatch CDP trusted click
            await session.call_tool("browser_click", arguments={"ref": "e1"})

asyncio.run(run_agent())`,
};

export default function CodeDemo() {
  const [lang, setLang] = useState<CodeLang>("typescript");
  const [copied, setCopied] = useState(false);

  const lines = lang === "typescript" ? TS_DEMO : PYTHON_DEMO;
  const fileName = lang === "typescript" ? "agentium-mcp-client.ts" : "agentium_mcp_client.py";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(RAW_DEMO_CODE[lang]);
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
    <section id="demo" className="border-t border-[#1f1f1f] py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Left-aligned headline */}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#ededed] mb-3">
          Standard Model Context Protocol primitives
        </h2>
        <p className="text-sm text-[#888] mb-6 max-w-2xl">
          Because Agentium implements standard MCP, you can plug it into Claude Desktop, Cursor, or build custom autonomous browser agents in TypeScript or Python.
        </p>

        {/* Switcher tabs */}
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setLang("typescript")}
            className={`text-xs font-mono px-3 py-1.5 rounded-md transition-colors ${
              lang === "typescript"
                ? "bg-[#1f1f1f] text-[#ededed] border border-[#2a2a2a]"
                : "text-[#888] hover:text-[#ededed]"
            }`}
          >
            TypeScript SDK
          </button>
          <button
            type="button"
            onClick={() => setLang("python")}
            className={`text-xs font-mono px-3 py-1.5 rounded-md transition-colors ${
              lang === "python"
                ? "bg-[#1f1f1f] text-[#ededed] border border-[#2a2a2a]"
                : "text-[#888] hover:text-[#ededed]"
            }`}
          >
            Python MCP
          </button>
        </div>

        {/* Code Block */}
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl overflow-hidden mb-12 shadow-none">
          {/* Chrome header */}
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

          {/* Code text */}
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

        {/* Stat boxes below code */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-[#1f1f1f] rounded-xl p-6 bg-[#111111]">
            <div className="text-xl font-bold text-[#ededed] mb-1">
              30 typed MCP tools
            </div>
            <p className="text-xs text-[#888] leading-relaxed">
              Complete browser API: tabs, navigation, DOM inspection, CDP trusted clicks, form typing, cookies, and screenshots.
            </p>
          </div>

          <div className="border border-[#1f1f1f] rounded-xl p-6 bg-[#111111]">
            <div className="text-xl font-bold text-[#ededed] mb-1">
              Zero cloud latency
            </div>
            <p className="text-xs text-[#888] leading-relaxed">
              Runs over stdio and loopback WebSocket (127.0.0.1:3777). No remote browser spin-up time or data exfiltration.
            </p>
          </div>

          <div className="border border-[#1f1f1f] rounded-xl p-6 bg-[#111111]">
            <div className="text-xl font-bold text-[#ededed] mb-1">
              Real session auth
            </div>
            <p className="text-xs text-[#888] leading-relaxed">
              Operates in tabs you are already signed into. Bypass Cloudflare and bot checks naturally via your own human profile.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
