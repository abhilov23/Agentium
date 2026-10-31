"use client";

import { useState } from "react";

type SetupClient = "claude" | "cursor" | "antigravity" | "claudecode";

interface SetupTabConfig {
  label: string;
  filename: string;
  pathHint: string;
  code: string;
}

const SETUP_CONFIGS: Record<SetupClient, SetupTabConfig> = {
  claude: {
    label: "Claude Desktop",
    filename: "claude_desktop_config.json",
    pathHint:
      "macOS: ~/Library/Application Support/Claude/claude_desktop_config.json | Windows: %APPDATA%/Claude/claude_desktop_config.json",
    code: `{
  "mcpServers": {
    "agentium": {
      "command": "npx",
      "args": ["-y", "agentium-mcp"]
    }
  }
}`,
  },
  cursor: {
    label: "Cursor",
    filename: "mcp.json",
    pathHint: "In workspace: .cursor/mcp.json (or Cursor Settings → Features → MCP)",
    code: `{
  "mcpServers": {
    "agentium": {
      "command": "npx",
      "args": ["-y", "agentium-mcp"]
    }
  }
}`,
  },
  antigravity: {
    label: "Antigravity",
    filename: "mcp_config.json",
    pathHint: "~/.gemini/config/mcp_config.json",
    code: `{
  "mcpServers": {
    "agentium": {
      "command": "npx",
      "args": ["-y", "agentium-mcp"]
    }
  }
}`,
  },
  claudecode: {
    label: "Claude Code CLI",
    filename: "terminal",
    pathHint: "Run in your terminal to register Agentium with Claude Code",
    code: `claude mcp add agentium -- npx -y agentium-mcp`,
  },
};

export default function SetupSection() {
  const [activeClient, setActiveClient] = useState<SetupClient>("claude");
  const [copied, setCopied] = useState(false);
  const [copiedExtensionCmd, setCopiedExtensionCmd] = useState(false);

  const active = SETUP_CONFIGS[activeClient];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(active.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyExtensionCmd = async () => {
    try {
      await navigator.clipboard.writeText(
        "git clone https://github.com/abhilov23/agentium.git && cd Agentium && pnpm install && pnpm --filter @Agentium/extension build"
      );
      setCopiedExtensionCmd(true);
      setTimeout(() => setCopiedExtensionCmd(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <section id="setup" className="border-t border-[#1f1f1f] py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="mb-14 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#1f1f1f] bg-[#111111] mb-4 text-xs font-mono text-[#14b8a6]">
            <span>Complete Setup Guide</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#ededed] mb-3">
            Two-minute setup: Extension + MCP
          </h2>
          <p className="text-sm text-[#888] max-w-2xl">
            Agentium consists of two lightweight pieces: the Chrome extension bridge that interacts with your active browser tabs, and the npm-distributed MCP server daemon.
          </p>
        </div>

        {/* Step 1: Chrome Extension Setup */}
        <div id="setup-extension" className="mb-14 border border-[#1f1f1f] rounded-xl p-8 bg-[#111111]">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <span className="text-xs font-mono text-[#14b8a6] uppercase tracking-wider block mb-1">
                Step 1 of 2
              </span>
              <h3 className="text-xl font-bold text-[#ededed]">
                Install the Agentium Chrome Extension
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/agentium-extension.zip"
                download="agentium-extension.zip"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#14b8a6] text-black text-xs font-semibold hover:bg-[#0d9488] transition-colors"
              >
                <span>Download Extension ZIP</span>
                <span>↓</span>
              </a>
              <a
                href="https://github.com/abhilov23/agentium"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#1f1f1f] text-xs font-mono text-[#888] hover:text-[#ededed] hover:border-[#2a2a2a] transition-colors bg-[#0c0c0c]"
              >
                <span>GitHub Source</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="border border-[#1f1f1f] rounded-lg p-5 bg-[#0c0c0c]">
              <div className="w-6 h-6 rounded-full bg-[#1a1a1a] text-[#ededed] text-xs font-mono flex items-center justify-center mb-3">
                1
              </div>
              <h4 className="font-semibold text-[#ededed] mb-1.5">Open Extension Manager</h4>
              <p className="text-xs text-[#888] leading-relaxed">
                Navigate to <code className="text-[#14b8a6] bg-[#1a1a1a] px-1 py-0.5 rounded">chrome://extensions</code> in Chrome and toggle on <strong className="text-[#ededed]">Developer mode</strong> in the top-right corner.
              </p>
            </div>

            <div className="border border-[#1f1f1f] rounded-lg p-5 bg-[#0c0c0c]">
              <div className="w-6 h-6 rounded-full bg-[#1a1a1a] text-[#ededed] text-xs font-mono flex items-center justify-center mb-3">
                2
              </div>
              <h4 className="font-semibold text-[#ededed] mb-1.5">Load Unpacked Extension</h4>
              <p className="text-xs text-[#888] leading-relaxed">
                Extract <code className="text-[#ededed] bg-[#1a1a1a] px-1 py-0.5 rounded">agentium-extension.zip</code> and click <strong className="text-[#ededed]">Load unpacked</strong>, selecting the extracted directory.
              </p>
            </div>

            <div className="border border-[#1f1f1f] rounded-lg p-5 bg-[#0c0c0c]">
              <div className="w-6 h-6 rounded-full bg-[#1a1a1a] text-[#ededed] text-xs font-mono flex items-center justify-center mb-3">
                3
              </div>
              <h4 className="font-semibold text-[#ededed] mb-1.5">Authorize Desired Tabs</h4>
              <p className="text-xs text-[#888] leading-relaxed">
                Pin the Agentium <strong className="text-[#14b8a6]">A</strong> icon to your toolbar. Click it on any tab you wish to let your AI assistant inspect or interact with.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1f1f1f] flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-[#666] font-mono">
              Build from repository source:
            </span>
            <button
              onClick={handleCopyExtensionCmd}
              className="text-xs font-mono text-[#888] hover:text-[#14b8a6] transition-colors"
            >
              {copiedExtensionCmd ? "✓ Command copied to clipboard" : "Copy build command"}
            </button>
          </div>
        </div>

        {/* Step 2: MCP Client Integration */}
        <div className="text-left mb-6">
          <span className="text-xs font-mono text-[#14b8a6] uppercase tracking-wider block mb-1">
            Step 2 of 2
          </span>
          <h3 className="text-xl font-bold text-[#ededed] mb-2">
            Configure Your MCP Client
          </h3>
          <p className="text-sm text-[#888]">
            Add Agentium to your client configuration. No local npm build needed — it executes automatically via <code className="text-[#ededed] bg-[#1a1a1a] px-1 py-0.5 rounded font-mono">npx -y agentium-mcp</code>.
          </p>
        </div>

        {/* Client selection tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-[#1f1f1f] pb-3">
          {(
            ["claude", "cursor", "antigravity", "claudecode"] as SetupClient[]
          ).map((key) => {
            const isSelected = activeClient === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveClient(key)}
                className={`text-xs font-mono px-3 py-1.5 rounded-md transition-colors ${
                  isSelected
                    ? "bg-[#1f1f1f] text-[#ededed] border border-[#2a2a2a]"
                    : "text-[#888] hover:text-[#ededed]"
                }`}
              >
                {SETUP_CONFIGS[key].label}
              </button>
            );
          })}
        </div>

        {/* Config Code Box */}
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl overflow-hidden mb-6">
          <div className="h-10 px-4 border-b border-[#1f1f1f] bg-[#0c0c0c] flex items-center justify-between">
            <span className="text-xs font-mono text-[#888]">
              {active.filename}
            </span>

            <button
              type="button"
              onClick={handleCopy}
              className="text-xs font-mono text-[#888] hover:text-[#ededed] transition-colors"
            >
              {copied ? "copied" : "copy configuration"}
            </button>
          </div>

          <div className="p-4 sm:p-6 overflow-x-auto font-mono text-xs sm:text-sm text-[#ededed] leading-relaxed">
            <pre className="whitespace-pre">{active.code}</pre>
          </div>
        </div>

        <p className="text-xs font-mono text-[#666]">
          Config location: <span className="text-[#888]">{active.pathHint}</span>
        </p>
      </div>
    </section>
  );
}
