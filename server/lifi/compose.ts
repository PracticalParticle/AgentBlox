import { createComposeSdk, isComposeError } from '@lifi/composer-sdk';
import type { Address, Hex } from 'viem';
import {
  isLifiComposeConfigured,
  isTreasuryConfigured,
  LIFI_API_KEY,
  LIFI_COMPOSER_BASE_URL,
  LIFI_INTEGRATOR,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_USDC,
  SEPOLIA_WETH,
  TREASURY_ADDRESS,
} from '../config.js';
import type { RebalanceExecutionIntent } from '../signing/meta-tx.js';
import { resolveRebalanceOperationType } from '../signing/meta-tx.js';
import { splitExecutionCalldata } from './calldata.js';
import { compileRebalanceFlow, isKnownRebalanceFlowId, type RebalanceFlowId } from './flows.js';

export type LifiComposeSuccess = {
  ok: true;
  flowId: string;
  userProxy: Address;
  calldata: Hex;
  executionIntent: RebalanceExecutionIntent;
  transactionRequest: {
    to: Address;
    data: Hex;
    value: string;
    gasLimit?: string;
  };
  quote: {
    fromChain: number;
    toChain: number;
    fromToken: Address;
    toToken: Address;
    fromAmount: string;
    integrator: string;
    estimatedAmountOut?: string;
    estimatedAmountOutMin?: string;
    approvalAddress?: Address;
    approvals?: { token: Address; spender: Address; amount: string }[];
  };
  producedResources?: Record<string, unknown>;
};

export type LifiComposeFailure = {
  ok: false;
  code:
    | 'TREASURY_NOT_CONFIGURED'
    | 'UNKNOWN_FLOW'
    | 'COMPOSE_NOT_CONFIGURED'
    | 'COMPOSE_FAILED'
    | 'COMPOSE_PARTIAL';
  reason: string;
  details?: unknown;
};

export type LifiComposeResult = LifiComposeSuccess | LifiComposeFailure;

function createLifiComposeSdk() {
  return createComposeSdk({
    baseUrl: LIFI_COMPOSER_BASE_URL,
    apiKey: LIFI_API_KEY,
  });
}

function extractEstimatedOut(
  producedResources: Record<string, { simulated?: { amountOut?: bigint; amountOutMin?: bigint } }>,
) {
  for (const resource of Object.values(producedResources)) {
    if (resource.simulated?.amountOut !== undefined) {
      return {
        estimatedAmountOut: resource.simulated.amountOut.toString(),
        estimatedAmountOutMin: resource.simulated.amountOutMin?.toString(),
      };
    }
  }
  return {};
}

export async function composeRebalanceFlow(params: {
  flowId: string;
  fromAmount: bigint;
  slippage?: number;
}): Promise<LifiComposeResult> {
  if (!isTreasuryConfigured()) {
    return {
      ok: false,
      code: 'TREASURY_NOT_CONFIGURED',
      reason: 'Set TREASURY_ADDRESS before composing a rebalance flow.',
    };
  }

  if (!isKnownRebalanceFlowId(params.flowId)) {
    return {
      ok: false,
      code: 'UNKNOWN_FLOW',
      reason: `Unknown flow ID "${params.flowId}". Allowed: rebalance-sepolia-v1`,
    };
  }

  if (!isLifiComposeConfigured()) {
    return {
      ok: false,
      code: 'COMPOSE_NOT_CONFIGURED',
      reason: 'Set LIFI_API_KEY in .env (portal.li.fi). Optional: LIFI_COMPOSER_BASE_URL.',
    };
  }

  try {
    const sdk = createLifiComposeSdk();
    const result = await compileRebalanceFlow({
      sdk,
      flowId: params.flowId as RebalanceFlowId,
      fromAmount: params.fromAmount,
      slippage: params.slippage,
      signer: TREASURY_ADDRESS,
    });

    if (result.status === 'partial') {
      return {
        ok: false,
        code: 'COMPOSE_PARTIAL',
        reason: result.error.message,
        details: {
          kind: result.error.kind,
          simulationRevert: result.simulationRevert,
        },
      };
    }

    const calldata = result.transactionRequest.data as Hex;
    const { executionSelector, executionParams } = splitExecutionCalldata(calldata);
    const estimates = extractEstimatedOut(result.producedResources);

    const gasLimit = result.transactionRequest.gasLimit
      ? BigInt(result.transactionRequest.gasLimit)
      : 1_500_000n;

    const executionIntent: RebalanceExecutionIntent = {
      target: result.userProxy as Address,
      executionSelector,
      executionParams,
      operationType: resolveRebalanceOperationType(params.flowId),
      gasLimit,
    };

    return {
      ok: true,
      flowId: params.flowId,
      userProxy: result.userProxy as Address,
      calldata,
      executionIntent,
      transactionRequest: {
        to: result.transactionRequest.to as Address,
        data: calldata,
        value: result.transactionRequest.value,
        gasLimit: result.transactionRequest.gasLimit,
      },
      quote: {
        fromChain: SEPOLIA_CHAIN_ID,
        toChain: SEPOLIA_CHAIN_ID,
        fromToken: SEPOLIA_USDC,
        toToken: SEPOLIA_WETH,
        fromAmount: params.fromAmount.toString(),
        integrator: LIFI_INTEGRATOR,
        ...estimates,
        approvals: result.approvals?.map((a) => ({
          token: a.token as Address,
          spender: a.spender as Address,
          amount: a.amount,
        })),
      },
      producedResources: result.producedResources,
    };
  } catch (error) {
    if (isComposeError(error)) {
      return {
        ok: false,
        code: 'COMPOSE_FAILED',
        reason: error.message,
        details: { code: error.code },
      };
    }

    return {
      ok: false,
      code: 'COMPOSE_FAILED',
      reason: error instanceof Error ? error.message : 'LI.FI compose failed',
    };
  }
}

/** Read-only quote via standard LI.FI /v1/quote when Composer API key is unavailable. */
export async function fetchLifiQuoteFallback(params: {
  fromAmount: string;
}): Promise<{ ok: true; quote: unknown } | { ok: false; reason: string }> {
  if (!isTreasuryConfigured()) {
    return { ok: false, reason: 'Treasury not configured' };
  }

  const search = new URLSearchParams({
    fromChain: String(SEPOLIA_CHAIN_ID),
    toChain: String(SEPOLIA_CHAIN_ID),
    fromToken: SEPOLIA_USDC,
    toToken: SEPOLIA_WETH,
    fromAmount: params.fromAmount,
    fromAddress: TREASURY_ADDRESS,
    toAddress: TREASURY_ADDRESS,
    integrator: LIFI_INTEGRATOR,
    slippage: '0.01',
  });

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (LIFI_API_KEY) {
      headers['x-lifi-api-key'] = LIFI_API_KEY;
    }

    const res = await fetch(`https://li.quest/v1/quote?${search.toString()}`, { headers });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, reason: `LI.FI quote failed (${res.status}): ${text.slice(0, 200)}` };
    }

    const quote = await res.json();
    return { ok: true, quote };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'LI.FI quote request failed',
    };
  }
}

export { isLifiComposeConfigured } from '../config.js';
