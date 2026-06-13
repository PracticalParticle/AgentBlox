import {
  GUARD_CONTROLLER_FUNCTION_SELECTORS,
  MetaTransactionSigner,
  TxAction,
  type Address,
  type Hex,
  type MetaTransaction,
} from '@bloxchain/sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { keccak256, toBytes } from 'viem';
import {
  AGENT_POLICY_PRIVATE_KEY,
  isAgentPolicySigningConfigured,
  REBALANCE_EXECUTION_PARAMS,
  REBALANCE_EXECUTION_TARGET,
  REBALANCE_OPERATION_TYPE,
  TREASURY_ADDRESS,
} from '../config.js';
import { createGuardController, sdkPublicClient, sdkSepolia } from '../bloxchain.js';
import {
  deserializeMetaTransaction,
  serializeMetaTransaction,
  type SerializedMetaTransaction,
} from './serialize.js';

export type RebalanceExecutionIntent = {
  target: Address;
  executionSelector: Hex;
  executionParams: Hex;
  operationType: Hex;
  gasLimit?: bigint;
};

export type SignRebalanceResult =
  | {
      ok: true;
      signedMetaTx: SerializedMetaTransaction;
      signerAddress: Address;
      intent: RebalanceExecutionIntent;
    }
  | {
      ok: false;
      reason: string;
      code: 'MISSING_AGENT_KEY' | 'MISSING_EXECUTION_CONFIG' | 'SIGNING_FAILED';
    };

export function resolveRebalanceOperationType(flowId: string): Hex {
  if (REBALANCE_OPERATION_TYPE.startsWith('0x') && REBALANCE_OPERATION_TYPE.length === 66) {
    return REBALANCE_OPERATION_TYPE as Hex;
  }
  return keccak256(toBytes(flowId)) as Hex;
}

export function getRebalanceExecutionIntent(flowId: string): RebalanceExecutionIntent | null {
  if (
    !REBALANCE_EXECUTION_TARGET.startsWith('0x') ||
    REBALANCE_EXECUTION_TARGET.length !== 42
  ) {
    return null;
  }

  const executionSelector = process.env.REBALANCE_EXECUTION_SELECTOR as Hex | undefined;
  const selector =
    executionSelector?.startsWith('0x') && executionSelector.length === 10
      ? executionSelector
      : (process.env.LIFI_EXECUTION_SELECTOR as Hex | undefined);

  if (!selector?.startsWith('0x') || selector.length !== 10) {
    return null;
  }

  return {
    target: REBALANCE_EXECUTION_TARGET,
    executionSelector: selector,
    executionParams: REBALANCE_EXECUTION_PARAMS,
    operationType: resolveRebalanceOperationType(flowId),
    gasLimit: 1_000_000n,
  };
}

export async function signRebalanceMetaTransaction(params: {
  flowId: string;
  requesterAddress?: Address;
}): Promise<SignRebalanceResult> {
  if (!isAgentPolicySigningConfigured()) {
    return {
      ok: false,
      code: 'MISSING_AGENT_KEY',
      reason: 'Set AGENT_POLICY_PRIVATE_KEY in .env (must match on-chain AGENT_POLICY role).',
    };
  }

  const intent = getRebalanceExecutionIntent(params.flowId);
  if (!intent) {
    return {
      ok: false,
      code: 'MISSING_EXECUTION_CONFIG',
      reason:
        'Set REBALANCE_EXECUTION_TARGET and REBALANCE_EXECUTION_SELECTOR (or LIFI_EXECUTION_SELECTOR) for meta-tx signing.',
    };
  }

  try {
    const account = privateKeyToAccount(AGENT_POLICY_PRIVATE_KEY);
    const signerAddress = account.address;
    const requester = params.requesterAddress ?? signerAddress;

    const guardController = createGuardController();
    const metaTxSigner = new MetaTransactionSigner(
      sdkPublicClient,
      undefined,
      TREASURY_ADDRESS,
      sdkSepolia,
    );

    const metaTxParams = await guardController.createMetaTxParams(
      TREASURY_ADDRESS,
      GUARD_CONTROLLER_FUNCTION_SELECTORS.REQUEST_AND_APPROVE_EXECUTION_SELECTOR,
      TxAction.SIGN_META_REQUEST_AND_APPROVE,
      3600n,
      0n,
      signerAddress,
    );

    const txParams = {
      requester,
      target: intent.target,
      value: 0n,
      gasLimit: intent.gasLimit ?? 1_000_000n,
      operationType: intent.operationType,
      executionSelector: intent.executionSelector,
      executionParams: intent.executionParams,
    };

    const unsignedMetaTx = await metaTxSigner.createUnsignedMetaTransactionForNew(
      txParams,
      metaTxParams,
    );

    const signedMetaTx = await metaTxSigner.signMetaTransaction(
      unsignedMetaTx,
      signerAddress,
      AGENT_POLICY_PRIVATE_KEY,
    );

    return {
      ok: true,
      signedMetaTx: serializeMetaTransaction(signedMetaTx),
      signerAddress,
      intent,
    };
  } catch (error) {
    return {
      ok: false,
      code: 'SIGNING_FAILED',
      reason: error instanceof Error ? error.message : 'Meta-tx signing failed',
    };
  }
}

export async function submitSignedRebalanceMetaTransaction(
  serialized: SerializedMetaTransaction,
): Promise<{ ok: true; hash: string } | { ok: false; reason: string }> {
  const { executeRebalanceWithBroadcaster } = await import('../execution/rebalance.js');
  return executeRebalanceWithBroadcaster(deserializeMetaTransaction(serialized));
}

export type { SerializedMetaTransaction, MetaTransaction };
