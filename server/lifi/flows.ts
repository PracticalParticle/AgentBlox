import { materialisers, resources, type ComposeSdk } from '@lifi/composer-sdk';
import type { Address } from 'viem';
import {
  LIFI_REBALANCE_SLIPPAGE,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_USDC,
  SEPOLIA_WETH,
} from '../config.js';

export const REBALANCE_FLOW_IDS = ['rebalance-sepolia-v1'] as const;

export type RebalanceFlowId = (typeof REBALANCE_FLOW_IDS)[number];

export function isKnownRebalanceFlowId(flowId: string): flowId is RebalanceFlowId {
  return (REBALANCE_FLOW_IDS as readonly string[]).includes(flowId);
}

export type BuildRebalanceFlowParams = {
  sdk: ComposeSdk;
  flowId: RebalanceFlowId;
  fromAmount: bigint;
  slippage?: number;
};

/** USDC → WETH swap on Sepolia — demo rebalance flow for ETHGlobal. */
export function buildRebalanceFlowBuilder(params: BuildRebalanceFlowParams) {
  const slippage = params.slippage ?? LIFI_REBALANCE_SLIPPAGE;

  const builder = params.sdk.flow(SEPOLIA_CHAIN_ID, {
    name: params.flowId,
    inputs: {
      amountIn: resources.erc20(SEPOLIA_USDC, SEPOLIA_CHAIN_ID),
    },
  });

  builder.lifi.swap('swap', {
    bind: { amountIn: builder.inputs.amountIn },
    config: {
      resourceOut: resources.erc20(SEPOLIA_WETH, SEPOLIA_CHAIN_ID),
      slippage,
    },
  });

  return builder;
}

export type CompileRebalanceFlowParams = BuildRebalanceFlowParams & {
  signer: Address;
};

export async function compileRebalanceFlow(params: CompileRebalanceFlowParams) {
  const builder = buildRebalanceFlowBuilder(params);

  return builder.compile({
    signer: params.signer,
    inputs: {
      amountIn: materialisers.directDeposit({
        amount: params.fromAmount,
      }),
    },
    sweepTo: params.signer,
  });
}
