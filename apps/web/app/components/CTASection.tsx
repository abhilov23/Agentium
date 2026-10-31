import Link from "next/link";

export default function CTASection() {
  return (
    <section className="border-t border-[#1f1f1f] py-24 px-6 text-center">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#ededed] mb-4">
          What will you automate?
        </h2>
        <p className="text-sm sm:text-base text-[#888] max-w-md mx-auto mb-10 leading-relaxed">
          Connect your AI coding agent to your live Chrome tabs in minutes. Zero cloud infrastructure required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="#setup-extension"
            className="w-full sm:w-auto px-6 py-3 rounded-md bg-[#14b8a6] text-black font-semibold text-sm hover:bg-[#0d9488] transition-colors"
          >
            Setup Chrome Extension
          </Link>
          <a
            href="https://www.npmjs.com/package/agentium-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 rounded-md border border-[#1f1f1f] text-[#ededed] font-medium text-sm hover:border-[#333333] hover:bg-[#111111] transition-colors font-mono"
          >
            npm: agentium-mcp
          </a>
          <a
            href="https://github.com/abhilov23/agentium#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 rounded-md border border-[#1f1f1f] text-[#888] hover:text-[#ededed] font-medium text-sm hover:border-[#333333] hover:bg-[#111111] transition-colors"
          >
            Read GitHub Docs
          </a>
        </div>
      </div>
    </section>
  );
}
