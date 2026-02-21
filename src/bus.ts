/**
 * Simple event bus for component communication.
 * Components emit and listen for events without direct coupling.
 */

const bus = new EventTarget();

export function emit(event: string, detail?: Record<string, unknown>): void {
  bus.dispatchEvent(new CustomEvent(event, { detail }));
}

export function on(event: string, handler: (detail: Record<string, unknown>) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent).detail ?? {});
  bus.addEventListener(event, listener);
  return () => bus.removeEventListener(event, listener);
}
