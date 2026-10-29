import type { PageInteractionResult } from "../shared/types";
import { isVisible } from "./dom";
import type { ElementRegistry } from "./refs";

const UNSUPPORTED_INPUT_TYPES = ["button", "checkbox", "file", "hidden", "image", "radio", "reset", "submit"];

function isDisabled(element: Element): boolean {
  return element.matches(":disabled, [aria-disabled='true']");
}

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

function submitFrom(element: HTMLInputElement | HTMLTextAreaElement): void {
  if (element.form) {
    element.form.requestSubmit();
    return;
  }
  pressEnter(element);
}

function pressEnter(element: HTMLElement): void {
  for (const type of ["keydown", "keypress", "keyup"] as const) {
    element.dispatchEvent(new KeyboardEvent(type, { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
  }
}

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const prototype = element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  if (setter) setter.call(element, value);
  else element.value = value;
}
