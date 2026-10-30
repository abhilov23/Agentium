// Clicks, fills, scrolls, and hovers elements in the current page.
import type { PageClickTarget, PageInteractionResult } from "../shared/types";
import { isVisible } from "./dom";
import type { ElementRegistry } from "./refs";

// Input types that cannot accept typed text.
const UNSUPPORTED_INPUT_TYPES = ["button", "checkbox", "file", "hidden", "image", "radio", "reset", "submit"];

// Check native and aria disabled states.
function isDisabled(element: Element): boolean {
  return element.matches(":disabled, [aria-disabled='true']");
}

// Click an element by its inspected ref.
export function prepareElementClick(registry: ElementRegistry, ref: string): PageClickTarget {
  const element = registry.resolve(ref);
  if (!isVisible(element)) {
    throw new Error(`Element ${ref} is not visible. Inspect the page again for visible elements.`);
  }
  if (isDisabled(element)) {
    throw new Error(`Element ${ref} is disabled and cannot be clicked.`);
  }

  element.scrollIntoView({ block: "center", inline: "center" });
  const rect = element.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    url: location.href,
    title: document.title,
  };
}

export function scrollPage(payload: {
  x?: number | undefined;
  y?: number | undefined;
  direction?: string | undefined;
  behavior?: "auto" | "smooth" | undefined;
}): { x: number; y: number } {
  const behavior = payload.behavior ?? "auto";

  if (payload.direction) {
    const step = Math.max(window.innerHeight * 0.6, 200);
    switch (payload.direction) {
      case "top":
        window.scrollTo({ top: 0, left: 0, behavior });
        return { x: window.scrollX, y: window.scrollY };
      case "bottom":
        window.scrollTo({ top: document.body.scrollHeight, left: document.body.scrollWidth, behavior });
        return { x: window.scrollX, y: window.scrollY };
      case "up":
        window.scrollBy({ top: -step, left: 0, behavior });
        return { x: window.scrollX, y: window.scrollY };
      case "down":
        window.scrollBy({ top: step, left: 0, behavior });
        return { x: window.scrollX, y: window.scrollY };
      case "left":
        window.scrollBy({ top: 0, left: -step, behavior });
        return { x: window.scrollX, y: window.scrollY };
      case "right":
        window.scrollBy({ top: 0, left: step, behavior });
        return { x: window.scrollX, y: window.scrollY };
      default:
        break;
    }
  }

  const nextX = payload.x ?? window.scrollX;
  const nextY = payload.y ?? window.scrollY;
  window.scrollTo({ left: nextX, top: nextY, behavior });
  return { x: window.scrollX, y: window.scrollY };
}

export function hoverElement(registry: ElementRegistry, ref: string): { x: number; y: number } {
  const element = registry.resolve(ref);
  if (!isVisible(element)) {
    throw new Error(`Element ${ref} is not visible. Inspect the page again for visible elements.`);
  }

  element.scrollIntoView({ block: "center", inline: "center" });
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  element.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true, clientX: x, clientY: y }));
  element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: x, clientY: y }));
  element.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: x, clientY: y }));

  return { x: Math.round(window.scrollX + x), y: Math.round(window.scrollY + y) };
}

export function waitForSelector(
  selector: string,
  timeoutMs = 10_000,
  visibleOnly = false,
): Promise<{ selector: string; found: boolean; visible: boolean; url: string; title: string }> {
  return new Promise((resolve) => {
    const startedAt = Date.now();

    const tick = () => {
      const match = document.querySelector(selector);
      if (match) {
        const visible = !visibleOnly || isVisible(match);
        if (visible) {
          resolve({ selector, found: true, visible: true, url: location.href, title: document.title });
          return;
        }
      }

      if (Date.now() - startedAt >= timeoutMs) {
        resolve({ selector, found: false, visible: false, url: location.href, title: document.title });
        return;
      }

      setTimeout(tick, 100);
    };

    tick();
  });
}

export function getPageState(): {
  url: string;
  title: string;
  readyState: DocumentReadyState;
  viewport: { width: number; height: number };
  isInteractive: boolean;
} {
  return {
    url: location.href,
    title: document.title,
    readyState: document.readyState,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    isInteractive: document.readyState === "interactive" || document.readyState === "complete",
  };
}

export function waitForNetworkIdle(
  timeoutMs = 15_000,
  idleMs = 500,
): Promise<{ url: string; title: string; idle: boolean; elapsedMs: number; waitedMs: number }> {
  const startedAt = Date.now();
  let lastMutationAt = Date.now();
  const observer = new MutationObserver(() => {
    lastMutationAt = Date.now();
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });

  return new Promise((resolve) => {
    const check = (): void => {
      const elapsedMs = Date.now() - startedAt;
      const sinceMutation = Date.now() - lastMutationAt;
      const idle = sinceMutation >= idleMs;
      if (idle || elapsedMs >= timeoutMs) {
        observer.disconnect();
        const waitedMs = Date.now() - startedAt;
        resolve({
          url: location.href,
          title: document.title,
          idle,
          elapsedMs,
          waitedMs,
        });
        return;
      }
      setTimeout(check, 100);
    };

    check();
  });
}

export function findText(
  query: string,
  exact = false,
  maxMatches = 10,
): { query: string; matches: Array<{ text: string; tag: string; selector: string; href?: string; role?: string }>; total: number; truncated: boolean; url: string; title: string } {
  const normalizedQuery = query.trim();
  const limit = Math.max(1, Math.min(maxMatches, 50));
  const matches: Array<{ text: string; tag: string; selector: string; href?: string; role?: string }> = [];

  const walk = (node: Node, callback: (element: Element) => void): void => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as Element;
    callback(element);
    element.childNodes.forEach((child) => walk(child, callback));
  };

  const matcher = (text: string): boolean => {
    const value = text.trim();
    if (!value) return false;
    if (exact) return value.toLowerCase() === normalizedQuery.toLowerCase();
    return value.toLowerCase().includes(normalizedQuery.toLowerCase());
  };

  const visited = new Set<Element>();
  walk(document.body, (element) => {
    if (visited.has(element)) return;
    visited.add(element);
    if (!(element instanceof HTMLElement)) return;

    const textContent = element.textContent ?? "";
    const directText = textContent.trim();
    if (!directText || !matcher(directText)) return;

    if (matches.length >= limit) return;
    const selector = element.tagName.toLowerCase();
    const match: { text: string; tag: string; selector: string; href?: string; role?: string } = {
      text: directText,
      tag: element.tagName.toLowerCase(),
      selector,
    };
    if (element instanceof HTMLAnchorElement && element.href) match.href = element.href;
    const role = element.getAttribute("role");
    if (role) match.role = role;
    matches.push(match);
  });

  return {
    query: normalizedQuery,
    matches,
    total: matches.length,
    truncated: matches.length >= limit,
    url: location.href,
    title: document.title,
  };
}

// Fill an input, textarea, or editable element by ref.
export function typeElement(
  registry: ElementRegistry,
  ref: string,
  text: string,
  submit = false,
): PageInteractionResult {
  const element = registry.resolve(ref);
  if (!isVisible(element)) {
    throw new Error(`Element ${ref} is not visible. Inspect the page again for visible elements.`);
  }
  if (isDisabled(element)) {
    throw new Error(`Element ${ref} is disabled and cannot receive typed text.`);
  }

  if (element instanceof HTMLInputElement) {
    if (UNSUPPORTED_INPUT_TYPES.includes(element.type)) {
      throw new Error(`Element ${ref} is a ${element.type} input and does not accept typed text.`);
    }
    element.focus();
    setNativeValue(element, text);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    if (submit) submitFrom(element);
  } else if (element instanceof HTMLTextAreaElement) {
    element.focus();
    setNativeValue(element, text);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    if (submit) submitFrom(element);
  } else if (element instanceof HTMLElement && element.isContentEditable) {
    element.focus();
    element.textContent = text;
    element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    if (submit) {
      const form = element.closest("form");
      if (form instanceof HTMLFormElement) form.requestSubmit();
      else pressEnter(element);
    }
  } else {
    throw new Error(`Element ${ref} cannot accept typed text. Inspect the page to find an input, textarea, or editable region.`);
  }

  return { url: location.href, title: document.title };
}

export function handleDialog(
  type: "alert" | "confirm" | "prompt",
  accept = true,
  promptText?: string,
): { type: "alert" | "confirm" | "prompt"; accepted: boolean; value: string | null; url: string; title: string } {
  window.alert = (() => undefined) as typeof window.alert;
  window.confirm = ((() => accept) as unknown) as typeof window.confirm;
  window.prompt = ((() => (accept ? promptText ?? "" : null)) as unknown) as typeof window.prompt;

  return {
    type,
    accepted: accept,
    value: type === "prompt" ? (accept ? promptText ?? null : null) : null,
    url: location.href,
    title: document.title,
  };
}

export function fillForm(
  fields: Array<{ selector: string; value: string; clear?: boolean | undefined; submit?: boolean | undefined }>,
): { url: string; title: string; submitted: boolean; fieldCount: number } {
  let submitted = false;
  const processed = fields.map((field) => {
    const node = document.querySelector(field.selector);
    if (!node) {
      throw new Error(`Selector not found: ${field.selector}`);
    }
    const element = node as HTMLElement;

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      const value = field.clear ? "" : field.value;
      if (element instanceof HTMLSelectElement) {
        const option = Array.from(element.options).find((option) => option.value === value || option.text === value);
        if (option) {
          element.value = option.value;
          element.dispatchEvent(new Event("change", { bubbles: true }));
        }
      } else {
        const prototype = element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
        if (setter) setter.call(element, value);
        else element.value = value;
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      }
    } else if (element.isContentEditable) {
      element.textContent = field.value;
      element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: field.value }));
    } else {
      throw new Error(`Selector ${field.selector} is not a supported form field.`);
    }

    if (field.submit) {
      const form = element.closest("form");
      if (form instanceof HTMLFormElement) {
        form.requestSubmit();
        submitted = true;
      } else {
        element.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true }));
        submitted = true;
      }
    }

    return field;
  });

  return {
    url: location.href,
    title: document.title,
    submitted,
    fieldCount: processed.length,
  };
}

export async function evaluateJs(script: string): Promise<{ url: string; title: string; result: unknown }> {
  try {
    // eslint-disable-next-line no-new-func
    const value = await Function(`"use strict"; return (${script});`)();
    const result =
      typeof value === "string"
        ? value
        : typeof value === "undefined"
          ? null
          : (() => {
              try {
                return JSON.parse(JSON.stringify(value, (_key, item) => (typeof item === "bigint" ? item.toString() : item)));
              } catch {
                return String(value);
              }
            })();
    return { url: location.href, title: document.title, result };
  } catch (error) {
    throw new Error(`Could not evaluate script: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function uploadFile(
  registry: ElementRegistry,
  ref: string,
  fileName: string,
  contentBase64: string,
  mimeType?: string,
): { url: string; title: string; filename?: string; mimeType?: string } {
  const element = registry.resolve(ref);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Element ${ref} is not a file input.`);
  }

  if (element.type !== "file") {
    throw new Error(`Element ${ref} is not a file input element.`);
  }

  if (!isVisible(element)) {
    throw new Error(`Element ${ref} is not visible. Inspect the page again for visible elements.`);
  }

  const binary = Uint8Array.from(atob(contentBase64), (char) => char.charCodeAt(0));
  const blob = new Blob([binary], { type: mimeType ?? "application/octet-stream" });
  const resolvedType = mimeType ?? blob.type;
  const file = new File([blob], fileName, { type: resolvedType || "application/octet-stream" });
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  element.files = dataTransfer.files;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));

  return { url: location.href, title: document.title, filename: file.name, mimeType: file.type };
}

// Submit the field's form when requested.
function submitFrom(element: HTMLInputElement | HTMLTextAreaElement): void {
  if (element.form) {
    element.form.requestSubmit();
    return;
  }
  pressEnter(element);
}

// Send Enter key events to an element.
function pressEnter(element: HTMLElement): void {
  for (const type of ["keydown", "keypress", "keyup"] as const) {
    element.dispatchEvent(new KeyboardEvent(type, { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
  }
}

// Set the value through the native setter so frameworks notice the change.
function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const prototype = element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  if (setter) setter.call(element, value);
  else element.value = value;
}
