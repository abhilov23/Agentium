export default function CompareTable() {
  const rows = [
    {
      feature: "Runs locally",
      agentium: "yes",
      cloud: "no",
    },
    {
      feature: "Access logged-in sessions",
      agentium: "yes",
      cloud: "no",
    },
    {
      feature: "Zero monthly cost",
      agentium: "yes",
      cloud: "no",
    },
    {
      feature: "CDP trusted input",
      agentium: "yes",
      cloud: "partial",
    },
    {
      feature: "Works with MCP clients",
      agentium: "yes",
      cloud: "varies",
    },
    {
      feature: "Data stays on your machine",
      agentium: "yes",
      cloud: "no",
    },
    {
      feature: "No API key required",
      agentium: "yes",
      cloud: "no",
    },
  ];

  const renderStatus = (status: string) => {
    if (status === "yes") {
      return (
        <span className="text-[#14b8a6] font-bold text-base" aria-label="Yes">
          ✓
        </span>
      );
    }
    if (status === "no") {
      return (
        <span className="text-[#ef4444] font-bold text-base" aria-label="No">
          ✗
        </span>
      );
    }
    if (status === "partial") {
      return <span className="text-[#888] text-xs font-mono">Partial</span>;
    }
    if (status === "varies") {
      return <span className="text-[#888] text-xs font-mono">Varies</span>;
    }
    return <span className="text-[#888] text-xs">{status}</span>;
  };

  return (
    <section id="compare" className="border-t border-[#1f1f1f] py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 text-left">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#ededed] mb-3">
            Agentium vs cloud solutions
          </h2>
          <p className="text-sm text-[#888]">
            Automate directly in your existing browser session without sending session tokens or credentials to third-party clouds.
          </p>
        </div>

        <div className="border border-[#1f1f1f] rounded-xl overflow-hidden bg-[#111111]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#1f1f1f] bg-[#0c0c0c] text-xs font-mono text-[#888]">
                  <th className="py-4 px-6 font-medium">Feature</th>
                  <th className="py-4 px-6 font-medium text-center w-40 text-[#ededed]">
                    Agentium
                  </th>
                  <th className="py-4 px-6 font-medium text-center w-48">
                    Cloud Automation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f1f]">
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-[#161616]/60 transition-colors"
                  >
                    <td className="py-4 px-6 text-[#ededed] font-medium text-sm">
                      {row.feature}
                    </td>
                    <td className="py-4 px-6 text-center bg-[#14b8a6]/5">
                      {renderStatus(row.agentium)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {renderStatus(row.cloud)}
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
