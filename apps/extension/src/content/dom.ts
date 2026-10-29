import type { ElementKind } from "../shared/types";

export const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input:not([type='hidden'])",
  "textarea",
  "select",
  "form",
  "h1",
  "h2",
  "h3",
  "[role='button']",
  "[role='link']",
  "[role='textbox']",
  "[contenteditable='']",
  "[contenteditable='true']",
].join(", ");

export function clean(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function shorten(value: string, maxLength = 120): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}

export function isVisible(element: Element): boolean {
  if (element.closest("[hidden], [aria-hidden='true']")) return false;
  const style = getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export function elementKind(element: Element): ElementKind {
  if (element instanceof HTMLAnchorElement) return "link";
  if (element instanceof HTMLButtonElement) return "button";
  if (element instanceof HTMLTextAreaElement) return "textarea";
  if (element instanceof HTMLSelectElement) return "select";
  if (element instanceof HTMLFormElement) return "form";
  if (element instanceof HTMLHeadingElement) return "heading";
  if (element instanceof HTMLInputElement) {
    return element.type === "submit" || element.type === "button" || element.type === "reset" ? "button" : "input";
  }
  if (element instanceof HTMLElement && element.isContentEditable) return "editable";
  return "interactive";
}

export function accessibleName(element: Element): string {
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const label = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" ");
    const cleaned = clean(label);
    if (cleaned) return shorten(cleaned);
  }

  const ariaLabel = clean(element.getAttribute("aria-label"));
  if (ariaLabel) return shorten(ariaLabel);

  if (element instanceof HTMLFormElement) {
    const label = clean(element.getAttribute("name") ?? element.getAttribute("id") ?? element.getAttribute("title"));
    if (label) return shorten(label);
  }

  const labels =
    element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement
      ? element.labels
      : null;
  if (labels && labels.length > 0) {
    const label = clean(Array.from(labels).map((item) => item.textContent).join(" "));
    if (label) return shorten(label);
  }

  if (element instanceof HTMLInputElement) {
    if (element.type === "submit" || element.type === "button" || element.type === "reset") {
      const value = clean(element.value);
      if (value) return shorten(value);
    }
    const hint = clean(element.placeholder) || clean(element.title);
    if (hint) return shorten(hint);
    const name = clean(element.name) || clean(element.id);
    if (name) return shorten(name);
  }

  if (element instanceof HTMLTextAreaElement) {
    const hint = clean(element.placeholder) || clean(element.title);
    if (hint) return shorten(hint);
    const name = clean(element.name) || clean(element.id);
    if (name) return shorten(name);
  }

  if (element instanceof HTMLSelectElement) {
    const name = clean(element.name) || clean(element.id) || clean(element.title);
    if (name) return shorten(name);
  }

  const image = element.querySelector("img[alt]");
  const alt = clean(image?.getAttribute("alt"));
  if (alt) return shorten(alt);

  const text = (element as HTMLElement).innerText || element.textContent || element.getAttribute("title") || "";
  return shorten(clean(text));
}
