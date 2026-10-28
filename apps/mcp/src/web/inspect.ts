import type { Page } from "playwright";

import { ELEMENT_REF_ATTRIBUTE, INTERACTIVE_SELECTOR } from "../browser/selectors.js";

export interface InspectOptions {
  selector?: string | undefined;
  maxElements?: number | undefined;
}

export interface InspectedElement {
  ref: string;
  kind: string;
  tag: string;
  name: string;
  role?: string;
  href?: string;
  inputType?: string;
  level?: number;
  value?: string;
  placeholder?: string;
  checked?: boolean;
  disabled?: boolean;
}

export interface InspectionResult {
  url: string;
  title: string;
  total: number;
  returned: number;
  truncated: boolean;
  elements: InspectedElement[];
}

export async function inspectPage(
  page: Page,
  options: InspectOptions = {},
): Promise<InspectionResult> {
  const maxElements = Math.min(Math.max(options.maxElements ?? 120, 1), 300);

  const result = await page.evaluate(
    ({ scopeSelector, elementSelector, refAttribute, limit }) => {
      type ElementInfo = {
        ref: string;
        kind: string;
        tag: string;
        name: string;
        role?: string;
        href?: string;
        inputType?: string;
        level?: number;
        value?: string;
        placeholder?: string;
        checked?: boolean;
        disabled?: boolean;
      };

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

      const shorten = (value: string, max = 120): string =>
        value.length > max ? `${value.slice(0, max - 1)}…` : value;

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
        return rect.width > 0 && rect.height > 0;
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
        if (tag === "textarea" || role === "textbox") {
          return "textarea";
        }
        if (tag === "select" || role === "combobox") {
          return "select";
        }
        if (tag === "form") {
          return "form";
        }
        if (/^h[1-6]$/.test(tag)) {
          return "heading";
        }
        if (
          element.getAttribute("contenteditable") === "" ||
          element.getAttribute("contenteditable") === "true"
        ) {
          return "editable";
        }
        return role || "interactive";
      };

      const nameOf = (element: Element): string => {
        const labelledBy = element.getAttribute("aria-labelledby");
        if (labelledBy) {
          const labelledText = labelledBy
            .split(/\s+/)
            .map((id) => document.getElementById(id))
            .filter((node): node is HTMLElement => node !== null)
            .map((node) => clean(node.innerText))
            .join(" ");
          if (labelledText) {
            return labelledText;
          }
        }

        const ariaLabel = clean(element.getAttribute("aria-label"));
        if (ariaLabel) {
          return ariaLabel;
        }

        if (element instanceof HTMLFormElement) {
          const formName =
            clean(element.getAttribute("name")) ||
            clean(element.getAttribute("id")) ||
            clean(element.getAttribute("title"));
          if (formName) {
            return formName;
          }
        }

        if (
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement
        ) {
          const label = element.labels?.[0] ? clean(element.labels[0].innerText) : "";
          if (label) {
            return label;
          }
        }

        if (element instanceof HTMLInputElement) {
          if (element.type === "password" || element.type === "file") {
            return "";
          }
          if (element.value && ["button", "submit", "reset"].includes(element.type)) {
            return clean(element.value);
          }
        }

        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          const placeholder = clean(element.placeholder);
          if (placeholder) {
            return placeholder;
          }
        }

        const title = clean(element.getAttribute("title"));
        if (title) {
          return title;
        }

        const imageAlt = clean(element.querySelector("img[alt]")?.getAttribute("alt"));
        if (imageAlt) {
          return imageAlt;
        }

        return clean(element instanceof HTMLElement ? element.innerText : element.textContent);
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

      const candidates = Array.from(root.querySelectorAll(elementSelector)).filter(
        (element) =>
          !(element instanceof HTMLInputElement && element.type === "hidden") &&
          isVisible(element),
      );

      const elements: ElementInfo[] = [];

      for (const element of candidates) {
        if (elements.length >= limit) {
          break;
        }

        const tag = element.tagName.toLowerCase();
        const info: ElementInfo = {
          ref: refFor(element),
          kind: kindOf(element),
          tag,
          name: shorten(nameOf(element)),
        };

        const role = clean(element.getAttribute("role"));
        if (role) {
          info.role = role;
        }

        if (element instanceof HTMLAnchorElement) {
          info.href = element.href;
        }

        if (element instanceof HTMLInputElement) {
          info.inputType = element.type;
          if (element.placeholder) {
            info.placeholder = clean(element.placeholder);
          }
          if (element.type !== "password" && element.type !== "file" && element.value) {
            info.value = shorten(element.value);
          }
          if (element.type === "checkbox" || element.type === "radio") {
            info.checked = element.checked;
          }
        } else if (element instanceof HTMLTextAreaElement) {
          if (element.placeholder) {
            info.placeholder = clean(element.placeholder);
          }
          if (element.value) {
            info.value = shorten(element.value);
          }
        } else if (element instanceof HTMLSelectElement) {
          if (element.value) {
            info.value = shorten(element.value);
          }
        }

        const ariaChecked = element.getAttribute("aria-checked");
        if (ariaChecked === "true" || ariaChecked === "false") {
          info.checked = ariaChecked === "true";
        }

        if (element.matches(":disabled") || element.getAttribute("aria-disabled") === "true") {
          info.disabled = true;
        }

        if (/^h[1-6]$/.test(tag)) {
          info.level = Number(tag[1]);
        }

        elements.push(info);
      }

      return {
        total: candidates.length,
        elements,
      };
    },
    {
      scopeSelector: options.selector ?? null,
      elementSelector: INTERACTIVE_SELECTOR,
      refAttribute: ELEMENT_REF_ATTRIBUTE,
      limit: maxElements,
    },
  );

  return {
    url: page.url(),
    title: await page.title(),
    total: result.total,
    returned: result.elements.length,
    truncated: result.total > result.elements.length,
    elements: result.elements,
  };
}
