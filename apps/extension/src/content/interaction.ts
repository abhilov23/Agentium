// Clicks, fills, scrolls, and hovers elements in the current page.
import type { PageInteractionResult } from "../shared/types";
import { isVisible } from "./dom";
import type { ElementRegistry } from "./refs";

// Input types that cannot accept typed text.
const UNSUPPORTED_INPUT_TYPES = ["button", "checkbox", "file", "hidden", "image", "radio", "reset", "submit"];

// Check native and aria disabled states.
function isDisabled(element: Element): boolean {
  return element.matches(":disabled, [aria-disabled='true']");
}

// Click an element by its inspected ref.
export function clickElement(registry: ElementRegistry, ref: string): PageInteractionResult {
  const element = registry.resolve(ref);
  if (!isVisible(element)) {
    throw new Error(`Element ${ref} is not visible. Inspect the page again for visible elements.`);
  }
  if (isDisabled(element)) {
    throw new Error(`Element ${ref} is disabled and cannot be clicked.`);
  }

  element.scrollIntoView({ block: "center", inline: "center" });
  if (element instanceof HTMLElement) {
    element.click();
  } else {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  }

  return { url: location.href, title: document.title };
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
