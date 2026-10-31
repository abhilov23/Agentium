"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "What is Agentium?",
    answer:
      "Agentium is an open source Model Context Protocol (MCP) server that connects AI coding assistants and agents directly to your running Chrome browser tabs. It exposes structured tools for inspecting the DOM, clicking, typing, navigating, and taking screenshots via the Chrome DevTools Protocol.",
  },
  {
    question: "Is Agentium free and open source?",
    answer:
      "Yes. Agentium is 100% free and open source under the MIT license. You can inspect the source code, run it locally, and contribute without any subscriptions or fees.",
  },
  {
    question: "How is Agentium different from Playwright/Puppeteer?",
    answer:
      "Playwright and Puppeteer spin up dedicated, headless browser instances that start from empty profiles with no saved logins, cookies, or history. Agentium attaches directly to your existing, everyday Chrome browser via a lightweight companion extension, letting your AI agent automate workflows across your already authenticated sessions.",
  },
  {
    question: "Can I use Agentium without a cloud account?",
    answer:
      "Yes. Agentium runs entirely on your local machine (`127.0.0.1`). There is no cloud account required, no remote proxy, and no telemetry. All browser automation traffic remains on your machine.",
  },
  {
    question: "Which MCP clients are supported?",
    answer:
      "Agentium adheres strictly to the official Model Context Protocol specification. It works out-of-the-box with Claude Desktop, Cursor, Google Antigravity, Windsurf, Continue, and any custom agent built with the MCP SDK.",
  },
  {
    question: "Does Agentium work with authenticated websites?",
    answer:
      "Yes. Because Agentium hooks into your existing Chrome session, any site you are currently logged into — GitHub, Jira, AWS Console, Gmail, Linear, or internal company dashboards — is instantly accessible to your agent without re-entering credentials.",
  },
  {
    question: "What is the MCP protocol?",
    answer:
      "The Model Context Protocol (MCP) is an open standard developed to allow Large Language Models to securely interact with local and remote data sources, tools, and developer environments through standardized JSON-RPC messaging.",
  },
  {
    question: "How does Agentium avoid bot detection?",
    answer:
      "Agentium uses native Chrome DevTools Protocol (CDP) input dispatch (`Input.dispatchMouseEvent` and `Input.dispatchKeyEvent`), which creates trusted browser events indistinguishable from physical hardware input. Combined with running in your genuine user Chrome profile, it avoids the typical bot fingerprints of automated headless drivers.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="border-t border-[#1f1f1f] py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12 text-left">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#ededed] mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-[#888]">
            Everything you need to know about Agentium, local MCP automation, and security.
          </p>
        </div>

        <div className="border border-[#1f1f1f] rounded-xl divide-y divide-[#1f1f1f] bg-[#111111] overflow-hidden">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="transition-colors">
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full py-5 px-6 flex items-center justify-between text-left hover:bg-[#161616]/60 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-medium text-[#ededed] pr-4">
                    {faq.question}
                  </span>
                  <span className="text-[#888] font-mono text-base flex-shrink-0">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-[#888] leading-relaxed border-t border-[#1a1a1a]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
