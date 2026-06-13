import { GuardController, SecureOwnable, type Chain, type PublicClient } from '@bloxchain/sdk';
import type { Address } from 'viem';
import { sepolia } from 'viem/chains';
import { sepoliaClient } from './clients.js';
import { isTreasuryConfigured, TREASURY_ADDRESS } from './config.js';

/** @bloxchain/sdk bundles its own viem — cast shared client/chain for SDK constructors. */
export const sdkPublicClient = sepoliaClient as unknown as PublicClient;
export const sdkSepolia = sepolia as unknown as Chain;

export function createGuardController(): GuardController {
  if (!isTreasuryConfigured()) {
    throw new Error('Treasury address is not configured');
  }
  return new GuardController(sdkPublicClient, undefined, TREASURY_ADDRESS, sdkSepolia);
}

export function createSecureOwnable(): SecureOwnable {
  if (!isTreasuryConfigured()) {
    throw new Error('Treasury address is not configured');
  }
  return new SecureOwnable(sdkPublicClient, undefined, TREASURY_ADDRESS, sdkSepolia);
}

export type OnChainTreasuryRoles = {
  owner: Address;
  broadcasters: Address[];
  recovery: Address;
  timeLockPeriodSec: string;
  initialized: boolean;
};

export async function readTreasuryRoles(): Promise<OnChainTreasuryRoles> {
  const gc = createGuardController();
  const [owner, broadcasters, recovery, timeLockPeriodSec, initialized] = await Promise.all([
    gc.owner(),
    gc.getBroadcasters(),
    gc.getRecovery(),
    gc.getTimeLockPeriodSec(),
    gc.initialized(),
  ]);

  return {
    owner,
    broadcasters,
    recovery,
    timeLockPeriodSec: timeLockPeriodSec.toString(),
    initialized,
  };
}
