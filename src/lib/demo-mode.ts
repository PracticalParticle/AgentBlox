/** True when URL has ?demo=1 — read-only judge preview without full .env. */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('demo') === '1';
}
