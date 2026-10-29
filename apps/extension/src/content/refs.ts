// Maps short refs such as e12 to elements on the page.
export class ElementRegistry {
  private readonly elementsByRef = new Map<string, Element>();
  private readonly refsByElement = new WeakMap<Element, string>();
  private nextRef = 1;

  // Return a stable ref for this element, creating one if needed.
  register(element: Element): string {
    const existing = this.refsByElement.get(element);
    if (existing) return existing;

    const ref = `e${this.nextRef}`;
    this.nextRef += 1;
    this.refsByElement.set(element, ref);
    this.elementsByRef.set(ref, element);
    return ref;
  }

  // Find the element for a ref and reject stale refs.
  resolve(ref: string): Element {
    const element = this.elementsByRef.get(ref);
    if (!element) {
      throw new Error(`Unknown element reference ${ref}. Inspect the page again to obtain fresh references.`);
    }
    if (!element.isConnected) {
      this.elementsByRef.delete(ref);
      throw new Error(`Element ${ref} is no longer on the page. Inspect the page again.`);
    }
    return element;
  }
}
