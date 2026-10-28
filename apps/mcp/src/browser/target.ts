import type { Locator, Page } from "playwright";

import { ToolError } from "../errors.js";
import { ELEMENT_REF_ATTRIBUTE } from "./selectors.js";

export interface Target {
  ref?: string | undefined;
  selector?: string | undefined;
  text?: string | undefined;
}

export function describeTarget(target: Target): string {
  if (target.ref) {
    return `ref "${target.ref}"`;
  }
  if (target.selector) {
    return `selector "${target.selector}"`;
  }
  return `text "${target.text ?? ""}"`;
}

export function resolveTarget(page: Page, target: Target): Locator {
  const provided = [target.ref, target.selector, target.text].filter(
    (value) => value !== undefined && value.trim() !== "",
  ).length;

  if (provided !== 1) {
    throw new ToolError(
      "Provide exactly one of ref, selector, or text to identify the target element. Use a ref from browser_inspect when possible.",
    );
  }

  if (target.ref) {
    const ref = target.ref.trim();
    if (!/^e\d+$/.test(ref)) {
      throw new ToolError(
        `"${target.ref}" is not a valid element ref. Refs look like "e12" and come from browser_inspect.`,
      );
    }
    return page.locator(`[${ELEMENT_REF_ATTRIBUTE}="${ref}"]`);
  }

  if (target.selector) {
    return page.locator(target.selector);
  }

  return page.getByText(target.text ?? "", { exact: false });
}
