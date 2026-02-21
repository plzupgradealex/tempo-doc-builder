/**
 * Generate a unique identifier.
 */
export function uid(): string {
  return crypto.randomUUID();
}
