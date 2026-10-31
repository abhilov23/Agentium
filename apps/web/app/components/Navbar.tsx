"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoWordmark } from "@repo/ui/logo";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [copiedNpm, setCopiedNpm] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const copyNpm = async () => {
    try {
      await navigator.clipboard.writeText("npx -y agentium-mcp");
      setCopiedNpm(true);
      setTimeout(() => setCopiedNpm(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 ${
        scrolled
          ? "bg-[#0c0c0c]/90 backdrop-blur border-b border-[#1f1f1f]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <LogoWordmark size={28} />
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm text-[#888]">
          <Link
            href="#features"
            className="hover:text-[#ededed] transition-colors whitespace-nowrap"
          >
            Features
          </Link>
          <Link
            href="#demo"
            className="hover:text-[#ededed] transition-colors whitespace-nowrap"
          >
            MCP Tools
          </Link>
          <Link
            href="#compare"
            className="hover:text-[#ededed] transition-colors whitespace-nowrap"
          >
            Comparison
          </Link>
          <Link
            href="#setup"
            className="hover:text-[#ededed] transition-colors whitespace-nowrap"
          >
            Docs
          </Link>
          <a
            href="https://www.npmjs.com/package/agentium-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#ededed] transition-colors whitespace-nowrap"
          >
            npm
          </a>
          <a
            href="https://github.com/abhilov23/agentium"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#ededed] transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            GitHub
            <span className="text-[#ededed] font-medium text-xs bg-[#1f1f1f] px-1.5 py-0.5 rounded">
              ★
            </span>
          </a>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={copyNpm}
            type="button"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#1f1f1f] text-xs font-mono text-[#888] hover:text-[#ededed] hover:border-[#2a2a2a] transition-colors bg-[#111111] whitespace-nowrap"
            title="Click to copy npx command"
          >
            <span>{copiedNpm ? "copied!" : "npx -y agentium-mcp"}</span>
          </button>

          <Link
            href="#setup-extension"
            className="inline-flex items-center gap-1.5 bg-[#14b8a6] text-black font-semibold px-4 py-2 rounded-md text-sm hover:bg-[#0d9488] transition-colors whitespace-nowrap"
          >
            <span>Setup Extension</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
