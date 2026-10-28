import type { Page } from "playwright";

import { ELEMENT_REF_ATTRIBUTE, INTERACTIVE_SELECTOR } from "../browser/selectors.js";

export interface FindOptions {
  selector?: string | undefined;
  maxResults?: number | undefined;
}

export interface FindMatch {
  ref: string;
  kind: string;
  tag: string;
  text: string;
}

export interface FindResult {
  url: string;
  title: string;
  query: string;
  total: number;
  returned: number;
  truncated: boolean;
  matches: FindMatch[];
}

export async function findOnPage(
  page: Page,
  query: string,
  options: FindOptions = {},
): Promise<FindResult> {
  const maxResults = Math.min(Math.max(options.maxResults ?? 20, 1), 100);

  const result = await page.evaluate(
    ({ scopeSelector, elementSelector, refAttribute, search, limit }) => {
      type Match = { ref: string; kind: string; tag: string; text: string };

      let root: Document | Element = document;
      if (scopeSelector) {
        const scoped = document.querySelector(scopeSelector);
        if (!scoped) {
          throw new Error(`No element matches the selector "${scopeSelector}".`);
        }
        root = scoped;
      }

      const clean = (value: string | null | undefined): string =>
        (value ?? "").replace(/\s+/g, " ").trim();

      const isVisible = (element: Element): boolean => {
        if (!(element instanceof HTMLElement)) {
          return false;
        }
        const style = window.getComputedStyle(element);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.visibility === "collapse" ||
          Number(style.opacity) === 0
        ) {
          return false;
        }
        const rect = element.getBoundingClientRect();
        return rect.width > 0 || rect.height > 0;
      };

      const kindOf = (element: Element): string => {
        const tag = element.tagName.toLowerCase();
        const role = clean(element.getAttribute("role")).toLowerCase();

        if (tag === "a") {
          return "link";
        }
        if (
          tag === "button" ||
          role === "button" ||
          (element instanceof HTMLInputElement &&
            ["button", "submit", "reset", "image"].includes(element.type))
        ) {
          return "button";
        }
        if (tag === "input") {
          return "input";
        }
        if (/^h[1-6]$/.test(tag)) {
          return "heading";
        }
        return role || tag;
      };

      let maxRef = 0;
      for (const existing of document.querySelectorAll(`[${refAttribute}]`)) {
        const value = existing.getAttribute(refAttribute) ?? "";
        const match = /^e(\d+)$/.exec(value);
        if (match) {
          maxRef = Math.max(maxRef, Number(match[1]));
        }
      }

      let nextRef = maxRef + 1;
      const refFor = (element: Element): string => {
        const existing = element.getAttribute(refAttribute);
        if (existing) {
          return existing;
        }
        const ref = `e${nextRef}`;
        nextRef += 1;
        element.setAttribute(refAttribute, ref);
        return ref;
      };

      const excerpt = (text: string, index: number): string => {
        const start = Math.max(0, index - 60);
        const end = Math.min(text.length, index + search.length + 60);
        return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
      };

      const normalizedQuery = search.toLowerCase();
      const matches: Match[] = [];
      const seen = new Set<Element>();
      let total = 0;

      const addMatch = (element: Element, text: string): void => {
        if (seen.has(element)) {
          return;
        }
        const value = clean(text);
        if (!value) {
          return;
        }

        seen.add(element);
        total += 1;

        if (matches.length >= limit) {
          return;
        }

        matches.push({
          ref: refFor(element),
          kind: kindOf(element),
          tag: element.tagName.toLowerCase(),
          text: value.length > 180 ? `${value.slice(0, 179)}…` : value,
        });
      };

      for (const element of root.querySelectorAll(elementSelector)) {
        if (element instanceof HTMLFormElement) {
          continue;
        }
        if (element instanceof HTMLInputElement && element.type === "hidden") {
          continue;
        }
        if (!isVisible(element)) {
          continue;
        }

        const label = clean(
          element.getAttribute("aria-label") ||
            element.getAttribute("placeholder") ||
            element.getAttribute("title"),
        );
        const value = label || clean(element instanceof HTMLElement ? element.innerText : element.textContent);

        if (value.toLowerCase().includes(normalizedQuery)) {
          addMatch(element, value);
        }
      }

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();

      while (node) {
        const text = clean(node.textContent);
        const index = text.toLowerCase().indexOf(normalizedQuery);

        if (index >= 0) {
          const parent = node.parentElement;
          if (parent && isVisible(parent) && !parent.closest("script, style, noscript")) {
            const ancestor = parent.closest(elementSelector);
            const target = ancestor && !(ancestor instanceof HTMLFormElement) ? ancestor : parent;
            addMatch(target, excerpt(text, index));
          }
        }

        node = walker.nextNode();
      }

      return { total, matches };
    },
    {
      scopeSelector: options.selector ?? null,
      elementSelector: INTERACTIVE_SELECTOR,
      refAttribute: ELEMENT_REF_ATTRIBUTE,
      search: query,
      limit: maxResults,
    },
  );

  return {
    url: page.url(),
    title: await page.title(),
    query,
    total: result.total,
    returned: result.matches.length,
    truncated: result.total > result.matches.length,
    matches: result.matches,
  };
}
