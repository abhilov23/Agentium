// Helpers for validating URLs and building Chrome permission patterns.
import { ExtensionError } from "./errors";

// Return true only for normal http and https pages.
export function isSupportedPageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Build the Chrome permission pattern for a page's origin.
export function originPattern(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ExtensionError(`"${value}" is not a valid URL.`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ExtensionError("Agentium only supports http and https pages.");
  }
  return `${url.origin}/*`;
}
