import Link from "next/link";
import { LogoWordmark } from "@repo/ui/logo";

export default function Footer() {
  return (
    <footer className="border-t border-[#1f1f1f] py-16 px-6 bg-[#0c0c0c] text-sm text-[#888]">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-10 mb-16">
          {/* Logo & Info column */}
          <div className="col-span-2 sm:col-span-4 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <LogoWordmark size={24} />
            </Link>
            <p className="text-xs text-[#666] leading-relaxed">
              Open source MCP server giving AI agents real browser control.
            </p>
          </div>

          {/* Product */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#ededed] mb-4">
              Product
            </div>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="#features" className="hover:text-[#ededed] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#demo" className="hover:text-[#ededed] transition-colors">
                  API &amp; Tools
                </Link>
              </li>
              <li>
                <Link href="#compare" className="hover:text-[#ededed] transition-colors">
                  Comparison
                </Link>
              </li>
              <li>
                <Link href="#setup-extension" className="hover:text-[#ededed] transition-colors">
                  Extension Setup
                </Link>
              </li>
            </ul>
          </div>

          {/* Developers */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#ededed] mb-4">
              Developers
            </div>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="https://modelcontextprotocol.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ededed] transition-colors"
                >
                  MCP Spec
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abhilov23/agentium"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ededed] transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://www.npmjs.com/package/agentium-mcp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ededed] transition-colors"
                >
                  npm: agentium-mcp
                </a>
              </li>
              <li>
                <Link href="#setup" className="hover:text-[#ededed] transition-colors">
                  Client Config
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#ededed] mb-4">
              Project
            </div>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="https://github.com/abhilov23/agentium#readme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ededed] transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abhilov23/agentium/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ededed] transition-colors"
                >
                  License (MIT)
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abhilov23/agentium/blob/main/SECURITY.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ededed] transition-colors"
                >
                  Security Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#ededed] mb-4">
              Community
            </div>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="https://github.com/abhilov23/agentium/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ededed] transition-colors"
                >
                  Discussions
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abhilov23/agentium/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ededed] transition-colors"
                >
                  Issue Tracker
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abhilov23/agentium/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ededed] transition-colors"
                >
                  Releases
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-[#1f1f1f] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#666]">
          <div>
            &copy; {new Date().getFullYear()} Agentium. Open source software under the MIT license.
          </div>
          <div className="flex items-center gap-6">
            <span>Runs locally on 127.0.0.1</span>
            <span className="text-[#14b8a6]">•</span>
            <span>Zero cloud telemetry</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
