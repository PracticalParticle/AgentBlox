import { normalize } from 'viem/ens';
import { mainnetClient } from './clients.js';
import { ENS_NAME } from './config.js';

export const ENS_TEXT_KEYS = {
  policyVersion: 'bloxchain.policyVersion',
  allowedFlows: 'bloxchain.allowedFlows',
  app: 'bloxchain.app',
} as const;

/** Parse comma-separated `bloxchain.allowedFlows` text record (no spaces). */
export function parseEnsAllowedFlows(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Fetch allowed flow IDs from ENS when `ENS_NAME` (or override) is configured. */
export async function fetchEnsAllowedFlows(ensName?: string): Promise<string[]> {
  const name = ensName || ENS_NAME;
  if (!name) return [];

  try {
    const normalized = normalize(name);
    const raw = await mainnetClient.getEnsText({
      name: normalized,
      key: ENS_TEXT_KEYS.allowedFlows,
    });
    return parseEnsAllowedFlows(raw);
  } catch {
    return [];
  }
}
