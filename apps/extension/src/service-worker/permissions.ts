import { ExtensionError } from "../shared/errors";
import { originPattern } from "../shared/urls";

export async function isSiteAuthorized(url: string): Promise<boolean> {
  const pattern = originPattern(url);
  return chrome.permissions.contains({ origins: [pattern] });
}

export async function assertSiteAuthorized(url: string): Promise<void> {
  if (await isSiteAuthorized(url)) return;
  const origin = new URL(url).origin;
  throw new ExtensionError(
    `FoundryLens does not have access to ${origin}. Open the extension popup and allow access to this site.`,
  );
}
