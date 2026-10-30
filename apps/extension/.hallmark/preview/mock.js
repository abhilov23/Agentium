(() => {
  if (typeof crypto.randomUUID !== "function") {
    crypto.randomUUID = () => "00000000-0000-4000-8000-" + String(Date.now()).padStart(12, "0");
  }

  const params = new URLSearchParams(location.search);
  const offline = params.get("bridge") === "offline";
  const connected = () =>
    offline
      ? {
          state: "disconnected",
          url: "ws://127.0.0.1:3777",
          lastError: "Start the Agentium Web MCP server, then retry.",
          lastConnectedAt: null,
          nextRetryAt: Date.now() + 12000,
        }
      : {
          state: "connected",
          url: "ws://127.0.0.1:3777",
          lastError: null,
          lastConnectedAt: Date.now(),
          nextRetryAt: null,
        };

  const activeTab = {
    id: 148,
    title: "Acme design system — Components",
    url: "https://acme.example/design/components",
    active: true,
    windowId: 1,
  };

  const elements = [
    {
      ref: "e1",
      kind: "input",
      tag: "input",
      name: "Email address",
      inputType: "email",
      placeholder: "you@company.com",
    },
    {
      ref: "e2",
      kind: "button",
      tag: "button",
      name: "Start a project",
    },
    {
      ref: "e3",
      kind: "link",
      tag: "a",
      name: "Read the documentation",
      href: "https://acme.example/docs",
    },
    {
      ref: "e4",
      kind: "textarea",
      tag: "textarea",
      name: "Tell us about your team",
      placeholder: "A few lines about the work",
    },
  ];

  const inspection = {
    tabId: activeTab.id,
    url: activeTab.url,
    title: activeTab.title,
    elements,
    returned: elements.length,
    total: 52,
    truncated: true,
  };

  window.chrome = {
    runtime: {
      getManifest: () => ({ version: "0.1.0" }),
      sendMessage: async (message) => {
        if (message && message.type === "BRIDGE_STATUS") return connected();
        if (message && message.type === "BRIDGE_RECONNECT") return connected();
        if (!message || !message.action) throw new Error("Unknown message");
        let data = null;
        if (message.action === "GET_ACTIVE_TAB") data = activeTab;
        if (message.action === "INSPECT_PAGE") data = inspection;
        if (message.action === "EXTRACT_CONTENT") {
          data = {
            url: activeTab.url,
            title: activeTab.title,
            format: "text",
            text: "A design system is the shared language a product team uses to build consistent interfaces. It covers colour, type, spacing, components, and the rules that keep them together.",
            truncated: false,
          };
        }
        return { id: message.id, success: true, data };
      },
    },
    permissions: {
      contains: async () => true,
      request: async () => true,
    },
  };

  const empty = params.has("empty");
  const showResult = params.has("result");
  let clicked = false;
  let extracted = false;
  const inspect = () => {
    if (empty) return;
    const button = [...document.querySelectorAll("button")].find(
      (item) => item.textContent.trim().startsWith("Inspect") && !item.disabled,
    );
    if (button) {
      clicked = true;
      button.click();
      if (showResult) window.setTimeout(extract, 120);
    }
  };
  const extract = () => {
    if (extracted) return;
    const button = [...document.querySelectorAll("button")].find(
      (item) => item.textContent.trim() === "Text" && !item.disabled,
    );
    if (button) {
      extracted = true;
      button.click();
    }
  };

  new MutationObserver(() => {
    if (!clicked && document.querySelector(".quick-actions")) window.setTimeout(inspect, 40);
  }).observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(inspect, 300);
})();
