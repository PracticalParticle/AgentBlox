import { normalize } from 'viem/ens';
import type { Address, PublicClient } from 'viem';
import { ENS_TEXT_KEYS } from './config';

export async function resolveEnsToAddress(
  client: PublicClient,
  ensName: string,
): Promise<Address | null> {
  try {
    const address = await client.getEnsAddress({ name: normalize(ensName) });
    return address;
  } catch {
    return null;
  }
}

export async function readTreasuryEnsRecords(
  client: PublicClient,
  ensName: string,
) {
  const name = normalize(ensName);
  const [policyVersion, allowedFlows, app] = await Promise.all([
    client.getEnsText({ name, key: ENS_TEXT_KEYS.policyVersion }),
    client.getEnsText({ name, key: ENS_TEXT_KEYS.allowedFlows }),
    client.getEnsText({ name, key: ENS_TEXT_KEYS.app }),
  ]);
  return { policyVersion, allowedFlows, app };
}
