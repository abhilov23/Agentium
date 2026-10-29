import { ExtensionError } from "./errors";

export function isSupportedPageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function originPattern(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ExtensionError(`"${value}" is not a valid URL.`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ExtensionError("FoundryLens only supports http and https pages.");
  }
  return `${url.origin}/*`;
}
