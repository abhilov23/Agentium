import type { ExtractedLink, PageExtractionResult } from "../shared/types";

export interface ExtractionOptions {
  format?: "text" | "links" | undefined;
  maxChars?: number | undefined;
  maxItems?: number | undefined;
}

export function extractContent(options: ExtractionOptions): PageExtractionResult {
  return options.format === "links" ? extractLinks(options.maxItems ?? 100) : extractText(options.maxChars ?? 8000);
}

function extractText(maxChars: number): PageExtractionResult {
  const root = document.querySelector("main, article") ?? document.body;
  if (!root) {
    return { url: location.href, title: document.title, format: "text", text: "", truncated: false };
  }
  const raw = root instanceof HTMLElement ? root.innerText : (root.textContent ?? "");
  const text = raw
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    url: location.href,
    title: document.title,
    format: "text",
    text: text.slice(0, maxChars),
    truncated: text.length > maxChars,
  };
}

function extractLinks(maxItems: number): PageExtractionResult {
  const seen = new Set<string>();
  const links: ExtractedLink[] = [];
  let found = 0;

  for (const anchor of Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))) {
    if (!anchor.href) continue;
    if (!anchor.href.startsWith("http://") && !anchor.href.startsWith("https://")) continue;
    if (seen.has(anchor.href)) continue;

    seen.add(anchor.href);
    found += 1;

    if (links.length < maxItems) {
      const text = (anchor.innerText || anchor.textContent || anchor.getAttribute("aria-label") || "")
        .replace(/\s+/g, " ")
        .trim();
      links.push({ text, href: anchor.href });
    }
  }

  return {
    url: location.href,
    title: document.title,
    format: "links",
    links,
    truncated: found > links.length,
  };
}
