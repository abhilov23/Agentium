import type { Page } from "playwright";

export type ExtractFormat = "text" | "links";

export interface ExtractOptions {
  format?: ExtractFormat | undefined;
  selector?: string | undefined;
  maxChars?: number | undefined;
  maxItems?: number | undefined;
}

export interface ExtractedLink {
  text: string;
  href: string;
}

export interface ExtractResult {
  url: string;
  title: string;
  format: ExtractFormat;
  text?: string;
  links?: ExtractedLink[];
  truncated: boolean;
}

export async function extractContent(
  page: Page,
  options: ExtractOptions = {},
): Promise<ExtractResult> {
  const format = options.format ?? "text";
  const maxChars = Math.min(Math.max(options.maxChars ?? 8000, 100), 50000);
  const maxItems = Math.min(Math.max(options.maxItems ?? 100, 1), 500);

  const [url, title] = await Promise.all([Promise.resolve(page.url()), page.title()]);

  if (format === "links") {
    const result = await page.evaluate(
      ({ scopeSelector, limit }) => {
        let root: Element | null = null;
        if (scopeSelector) {
          root = document.querySelector(scopeSelector);
          if (!root) {
            throw new Error(`No element matches the selector "${scopeSelector}".`);
          }
        } else {
          root = document.body;
        }

        const links: { text: string; href: string }[] = [];
        const seen = new Set<string>();

        for (const anchor of root.querySelectorAll("a[href]")) {
          if (links.length > limit) {
            break;
          }
          if (!(anchor instanceof HTMLAnchorElement)) {
            continue;
          }

          const style = window.getComputedStyle(anchor);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            Number(style.opacity) === 0
          ) {
            continue;
          }

          const rect = anchor.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) {
            continue;
          }

          const href = anchor.href;
          if (!href || href.startsWith("javascript:")) {
            continue;
          }

          const text = (
            anchor.innerText ||
            anchor.getAttribute("aria-label") ||
            anchor.querySelector("img[alt]")?.getAttribute("alt") ||
            ""
          )
            .replace(/\s+/g, " ")
            .trim();

          const key = `${href}\n${text}`;
          if (seen.has(key)) {
            continue;
          }
          seen.add(key);

          links.push({ text: text.slice(0, 160), href });
        }

        return {
          links: links.slice(0, limit),
          truncated: links.length > limit,
        };
      },
      { scopeSelector: options.selector ?? null, limit: maxItems },
    );

    return { url, title, format, links: result.links, truncated: result.truncated };
  }

  const result = await page.evaluate(
    ({ scopeSelector, limit }) => {
      let root: Element;
      if (scopeSelector) {
        const scoped = document.querySelector(scopeSelector);
        if (!scoped) {
          throw new Error(`No element matches the selector "${scopeSelector}".`);
        }
        root = scoped;
      } else {
        root = document.querySelector("main, article") ?? document.body;
      }

      const raw = root instanceof HTMLElement ? root.innerText : (root.textContent ?? "");
      const normalized = raw.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

      return {
        text: normalized.slice(0, limit),
        truncated: normalized.length > limit,
      };
    },
    { scopeSelector: options.selector ?? null, limit: maxChars },
  );

  return { url, title, format, text: result.text, truncated: result.truncated };
}
