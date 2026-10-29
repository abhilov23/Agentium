// Finds interactive elements and returns a compact page summary.
import type { InspectedElement, PageInspectionResult } from "../shared/types";
import { accessibleName, clean, elementKind, INTERACTIVE_SELECTOR, isVisible, shorten } from "./dom";
import type { ElementRegistry } from "./refs";

// Do not expose passwords, files, or payment details.
function hasSensitiveValue(element: HTMLInputElement): boolean {
  if (element.type === "password" || element.type === "file") return true;
  return /(?:password|one-time-code|cc-)/i.test(element.autocomplete);
}

// Scan the page and register refs for each visible interactive element.
export function inspectPage(registry: ElementRegistry, maxElements = 120): PageInspectionResult {
  const limit = Math.min(Math.max(maxElements, 1), 300);
  const candidates = Array.from(document.querySelectorAll(INTERACTIVE_SELECTOR)).filter((element) => isVisible(element));
  const elements: InspectedElement[] = [];

  for (const element of candidates) {
    if (elements.length >= limit) break;

    const ref = registry.register(element);
    const kind = elementKind(element);
    const info: InspectedElement = {
      ref,
      kind,
      tag: element.tagName.toLowerCase(),
      name: accessibleName(element),
    };

    const role = clean(element.getAttribute("role"));
    if (role) info.role = role;

    if (element instanceof HTMLAnchorElement && element.href) {
      info.href = shorten(element.href, 300);
    }

    if (element instanceof HTMLInputElement) {
      if (kind === "input") {
        info.inputType = element.type;
        if (!hasSensitiveValue(element) && element.value) info.value = shorten(element.value, 200);
      }
      if (element.placeholder) info.placeholder = shorten(clean(element.placeholder));
      if (element.checked) info.checked = true;
      if (element.disabled) info.disabled = true;
    }

    if (element instanceof HTMLTextAreaElement) {
      if (element.placeholder) info.placeholder = shorten(clean(element.placeholder));
      if (element.disabled) info.disabled = true;
    }

    if (element instanceof HTMLSelectElement) {
      if (element.value) info.value = shorten(element.value, 200);
      if (element.disabled) info.disabled = true;
    }

    if (element instanceof HTMLHeadingElement) {
      info.level = Number(element.tagName.slice(1));
    }

    elements.push(info);
  }

  return {
    url: location.href,
    title: document.title,
    total: candidates.length,
    returned: elements.length,
    truncated: elements.length < candidates.length,
    elements,
  };
}
