import { formatEther, isAddress, type Address } from 'viem';
import { normalize } from 'viem/ens';
import { mainnetClient, sepoliaClient } from '../clients.js';
import {
  ENS_NAME,
  isTreasuryConfigured,
  TREASURY_ADDRESS,
} from '../config.js';

const ENS_TEXT_KEYS = {
  policyVersion: 'bloxchain.policyVersion',
  allowedFlows: 'bloxchain.allowedFlows',
  app: 'bloxchain.app',
} as const;

export async function getTreasuryStatus() {
  const configured = isTreasuryConfigured();
  if (!configured) {
    return {
      configured: false,
      message: 'No treasury address configured. Set TREASURY_ADDRESS in .env or use Console.',
    };
  }

  const [ethBalance, ensName] = await Promise.all([
    sepoliaClient.getBalance({ address: TREASURY_ADDRESS }),
    Promise.resolve(ENS_NAME || null),
  ]);

  return {
    configured: true,
    network: 'sepolia',
    address: TREASURY_ADDRESS,
    ensName,
    ethBalance: formatEther(ethBalance),
    ethBalanceWei: ethBalance.toString(),
    roles: {
      owner: 'Dynamic embedded wallet (see Console)',
      broadcaster: 'Dynamic server wallet',
      agentPolicy: 'AgentBlox server (sign only)',
    },
    policy: {
      engine: 'Bloxchain AccountBlox',
      guard: 'GuardController whitelist enforced on-chain',
    },
  };
}

export async function resolveEnsTreasury(name?: string) {
  const ensName = name || ENS_NAME;
  if (!ensName) {
    return { error: 'No ENS name provided. Configure VITE_ENS_NAME or pass a name.' };
  }

  const normalized = normalize(ensName);
  const address = await mainnetClient.getEnsAddress({ name: normalized });

  const [policyVersion, allowedFlows, app] = await Promise.all([
    mainnetClient.getEnsText({ name: normalized, key: ENS_TEXT_KEYS.policyVersion }),
    mainnetClient.getEnsText({ name: normalized, key: ENS_TEXT_KEYS.allowedFlows }),
    mainnetClient.getEnsText({ name: normalized, key: ENS_TEXT_KEYS.app }),
  ]);

  return {
    name: ensName,
    normalized,
    address,
    textRecords: { policyVersion, allowedFlows, app },
    matchesConfiguredTreasury:
      address && TREASURY_ADDRESS
        ? address.toLowerCase() === TREASURY_ADDRESS.toLowerCase()
        : null,
  };
}

export async function listPendingApprovals() {
  if (!isTreasuryConfigured()) {
    return { pending: [], message: 'Treasury not configured.' };
  }

  // Phase 2: poll TxRecords via @bloxchain/sdk
  return {
    pending: [],
    treasuryAddress: TREASURY_ADDRESS,
    message:
      'Pending approval polling via @bloxchain/sdk is planned (Phase 2). Use propose/request tools to create demo records.',
  };
}

export async function getWhitelistedTargets() {
  if (!isTreasuryConfigured()) {
    return { configured: false, targets: [] };
  }

  return {
    configured: true,
    treasuryAddress: TREASURY_ADDRESS,
    targets: [
      {
        label: 'LI.FI Composer executor',
        status: 'expected_whitelist',
        note: 'Set at provisioning on bloxchain.app via guardConfigBatch',
      },
      {
        label: 'Sepolia USDC',
        status: 'expected_whitelist',
        note: 'Required for timelock vendor payments',
      },
    ],
    message: 'On-chain whitelist reads via GuardController SDK — Phase 2.',
  };
}

export function validateRecipientAddress(recipient: string) {
  return isAddress(recipient) ? { valid: true, address: recipient as Address } : { valid: false };
}
