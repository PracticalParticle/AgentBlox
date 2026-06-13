import { formatEther, isAddress, type Address } from 'viem';
import { normalize } from 'viem/ens';
import { TxStatus } from '@bloxchain/sdk';
import { readTreasuryRoles, createGuardController } from '../bloxchain.js';
import { mainnetClient, sepoliaClient } from '../clients.js';
import {
  ENS_NAME,
  getWhitelistSelectors,
  isTreasuryConfigured,
  TREASURY_ADDRESS,
} from '../config.js';

const ENS_TEXT_KEYS = {
  policyVersion: 'bloxchain.policyVersion',
  allowedFlows: 'bloxchain.allowedFlows',
  app: 'bloxchain.app',
} as const;

const TX_STATUS_LABEL: Record<number, string> = {
  [TxStatus.UNDEFINED]: 'UNDEFINED',
  [TxStatus.PENDING]: 'PENDING',
  [TxStatus.EXECUTING]: 'EXECUTING',
  [TxStatus.PROCESSING_PAYMENT]: 'PROCESSING_PAYMENT',
  [TxStatus.CANCELLED]: 'CANCELLED',
  [TxStatus.COMPLETED]: 'COMPLETED',
  [TxStatus.FAILED]: 'FAILED',
};

function serializeTxRecord(tx: Awaited<ReturnType<ReturnType<typeof createGuardController>['getTransaction']>>) {
  return {
    txId: tx.txId.toString(),
    releaseTime: tx.releaseTime.toString(),
    releaseTimeIso:
      tx.releaseTime > 0n ? new Date(Number(tx.releaseTime) * 1000).toISOString() : null,
    status: TX_STATUS_LABEL[tx.status] ?? String(tx.status),
    statusCode: tx.status,
    target: tx.params.target,
    requester: tx.params.requester,
    value: tx.params.value.toString(),
    executionSelector: tx.params.executionSelector,
    operationType: tx.params.operationType,
    payment: {
      recipient: tx.payment.recipient,
      nativeTokenAmount: tx.payment.nativeTokenAmount.toString(),
      erc20TokenAddress: tx.payment.erc20TokenAddress,
      erc20TokenAmount: tx.payment.erc20TokenAmount.toString(),
    },
  };
}

export async function getTreasuryStatus() {
  const configured = isTreasuryConfigured();
  if (!configured) {
    return {
      configured: false,
      message: 'No treasury address configured. Set TREASURY_ADDRESS in .env or use Console.',
    };
  }

  const [ethBalance, ensName, onChainRoles] = await Promise.all([
    sepoliaClient.getBalance({ address: TREASURY_ADDRESS }),
    Promise.resolve(ENS_NAME || null),
    readTreasuryRoles().catch(() => null),
  ]);

  return {
    configured: true,
    network: 'sepolia',
    address: TREASURY_ADDRESS,
    ensName,
    ethBalance: formatEther(ethBalance),
    ethBalanceWei: ethBalance.toString(),
    roles: onChainRoles
      ? {
          owner: onChainRoles.owner,
          broadcasters: onChainRoles.broadcasters,
          recovery: onChainRoles.recovery,
          timeLockPeriodSec: onChainRoles.timeLockPeriodSec,
          initialized: onChainRoles.initialized,
        }
      : {
          owner: 'unavailable — SDK read failed',
          broadcaster: 'see on-chain Owner/Broadcaster after provisioning',
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
    return { error: 'No ENS name provided. Configure ENS_NAME in .env or pass a name.' };
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

  try {
    const gc = createGuardController();
    const pendingIds = await gc.getPendingTransactions();

    const records = await Promise.all(
      pendingIds.map(async (txId) => {
        const tx = await gc.getTransaction(txId);
        return serializeTxRecord(tx);
      }),
    );

    return {
      pending: records,
      count: records.length,
      treasuryAddress: TREASURY_ADDRESS,
      message:
        records.length > 0
          ? `${records.length} pending approval(s) awaiting action.`
          : 'No pending approvals on-chain.',
    };
  } catch (error) {
    return {
      pending: [],
      treasuryAddress: TREASURY_ADDRESS,
      error: error instanceof Error ? error.message : 'Failed to read pending transactions',
      message: 'Could not poll TxRecords via @bloxchain/sdk. Verify TREASURY_ADDRESS and RPC.',
    };
  }
}

export async function getWhitelistedTargets() {
  if (!isTreasuryConfigured()) {
    return { configured: false, targets: [] };
  }

  const selectors = getWhitelistSelectors();

  try {
    const gc = createGuardController();
    const entries = await Promise.all(
      selectors.map(async ({ selector, label }) => {
        try {
          const addresses = await gc.getFunctionWhitelistTargets(selector);
          return {
            selector,
            label,
            status: 'on_chain' as const,
            addresses,
            count: addresses.length,
          };
        } catch {
          return {
            selector,
            label,
            status: 'not_registered' as const,
            addresses: [] as Address[],
            count: 0,
            note: 'Function selector not registered on this treasury — configure via guardConfigBatch.',
          };
        }
      }),
    );

    const flatTargets = entries.flatMap((entry) =>
      entry.addresses.map((address) => ({
        address,
        selector: entry.selector,
        label: entry.label,
      })),
    );

    return {
      configured: true,
      treasuryAddress: TREASURY_ADDRESS,
      selectors: entries,
      targets: flatTargets,
      totalTargets: flatTargets.length,
      message:
        flatTargets.length > 0
          ? `${flatTargets.length} whitelisted target(s) across ${entries.length} selector(s).`
          : 'No whitelisted targets found. Complete provisioning — see guard-controller.md.',
      hint:
        selectors.length === 1
          ? 'Set LIFI_EXECUTION_SELECTOR in .env after LI.FI provisioning to poll Composer whitelist.'
          : undefined,
    };
  } catch (error) {
    return {
      configured: true,
      treasuryAddress: TREASURY_ADDRESS,
      targets: [],
      error: error instanceof Error ? error.message : 'Failed to read whitelist',
      message: 'Could not read GuardController whitelist via @bloxchain/sdk.',
    };
  }
}

export function validateRecipientAddress(recipient: string) {
  return isAddress(recipient) ? { valid: true, address: recipient as Address } : { valid: false };
}
