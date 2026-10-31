export default function Features() {
  const features = [
    {
      title: "Works with your logged-in browser",
      description:
        "Agentium connects to Chrome tabs you already have open. Automate any site you're signed into — no separate browser profile or credential re-entry.",
    },
    {
      title: "Ephemeral element refs",
      description:
        "Every inspect() call generates short-lived @ref handles mapped to live DOM nodes. No fragile CSS selectors that break on site updates.",
    },
    {
      title: "Local. Fast. Private.",
      description:
        "The MCP server runs on 127.0.0.1. Zero traffic leaves your machine. Clicks dispatched via CDP are indistinguishable from real user input.",
    },
  ];

  return (
    <section id="features" className="border-t border-[#1f1f1f] py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="border border-[#1f1f1f] rounded-xl p-8 hover:border-[#2a2a2a] transition-colors bg-[#111111]"
            >
              <h3 className="text-lg font-semibold text-[#ededed] mb-3 leading-snug">
                {feature.title}
              </h3>
              <p className="text-sm text-[#888] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
