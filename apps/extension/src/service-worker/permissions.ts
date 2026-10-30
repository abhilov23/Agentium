// Checks whether the extension may access a website.
import { ExtensionError } from "../shared/errors";
import { originPattern } from "../shared/urls";

// Check Chrome permissions for a page's origin.
export async function isSiteAuthorized(url: string): Promise<boolean> {
  const pattern = originPattern(url);
  return chrome.permissions.contains({ origins: [pattern] });
}

// Throw a helpful error when the origin is not allowed.
export async function assertSiteAuthorized(url: string): Promise<void> {
  if (await isSiteAuthorized(url)) return;
  const origin = new URL(url).origin;
  throw new ExtensionError(
    `Agentium does not have access to ${origin}. Open the extension popup and allow access to this site.`,
  );
}
