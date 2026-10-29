// Error type used for expected extension failures.
export class ExtensionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtensionError";
  }
}

// Return a readable message for any thrown value.
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
