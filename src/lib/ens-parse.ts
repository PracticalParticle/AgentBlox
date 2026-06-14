/** Parse comma-separated `bloxchain.allowedFlows` ENS text record. */
export function parseEnsAllowedFlows(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}
