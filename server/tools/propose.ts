import { AGENT_POLICY, isTreasuryConfigured, TREASURY_ADDRESS } from '../config.js';
import {
  validateFlowId,
  validateRebalanceAmount,
  validateTreasuryConfigured,
  validateUnauthorizedTarget,
} from '../policy-gate.js';
import { sepoliaClient } from '../clients.js';
import { composeRebalanceFlow } from '../lifi/compose.js';
import { signRebalanceMetaTransaction } from '../signing/meta-tx.js';
import { SEPOLIA_USDC } from '../config.js';

export async function proposeRebalance(params: {
  flowId?: string;
  amountUsdc?: string;
}) {
  const treasuryCheck = validateTreasuryConfigured(isTreasuryConfigured());
  if (!treasuryCheck.allowed) {
    return { status: 'rejected', policy: treasuryCheck, proposal: null };
  }

  const flowId = params.flowId || 'rebalance-sepolia-v1';
  const flowCheck = validateFlowId(flowId);
  if (!flowCheck.allowed) {
    return { status: 'rejected', policy: flowCheck, proposal: null };
  }

  const amount = BigInt(params.amountUsdc || '1000000'); // 1 USDC default
  const amountCheck = validateRebalanceAmount(amount);
  if (!amountCheck.allowed) {
    return { status: 'rejected', policy: amountCheck, proposal: null };
  }

  const ethBalance = await sepoliaClient.getBalance({ address: TREASURY_ADDRESS });

  const compose = await composeRebalanceFlow({ flowId, fromAmount: amount });

  const signing = await signRebalanceMetaTransaction({
    flowId,
    executionIntent: compose.ok ? compose.executionIntent : undefined,
  });

  const proposal = {
    flowId,
    treasuryAddress: TREASURY_ADDRESS,
    action: 'rebalance',
    fromToken: SEPOLIA_USDC,
    toToken: compose.ok ? compose.quote.toToken : undefined,
    fromAmount: amount.toString(),
    lifiIntegrator: 'AgentBlox',
    status: signing.ok ? 'awaiting_confirmation' : 'awaiting_configuration',
    compose: compose.ok
      ? {
          status: 'composed',
          userProxy: compose.userProxy,
          quote: compose.quote,
          executionSelector: compose.executionIntent.executionSelector,
        }
      : {
          status: 'compose_failed',
          code: compose.code,
          reason: compose.reason,
        },
    signing: signing.ok
      ? {
          status: 'signed',
          signerAddress: signing.signerAddress,
          signedMetaTx: signing.signedMetaTx,
          execution: {
            target: signing.intent.target,
            executionSelector: signing.intent.executionSelector,
            operationType: signing.intent.operationType,
          },
        }
      : {
          status: 'unsigned',
          code: signing.code,
          reason: signing.reason,
        },
    nextSteps: signing.ok
      ? [
          'Review Intent Preview in Copilot',
          'Click Confirm execution — Dynamic Broadcaster submits requestAndApproveExecution',
          'GuardController validates whitelist → external target executes',
        ]
      : [
          compose.ok ? null : compose.reason,
          signing.reason,
          'Set LIFI_API_KEY + AGENT_POLICY_PRIVATE_KEY, or manual REBALANCE_EXECUTION_* env vars',
        ].filter(Boolean),
  };

  return {
    status: signing.ok ? 'proposed' : 'proposed_unsigned',
    policy: { allowed: true, reason: 'Proposal passes off-chain policy gate.' },
    treasuryEthBalance: ethBalance.toString(),
    proposal,
  };
}

export async function requestVendorPayment(params: {
  recipient: string;
  amountUsdc: string;
  memo?: string;
}) {
  const treasuryCheck = validateTreasuryConfigured(isTreasuryConfigured());
  if (!treasuryCheck.allowed) {
    return { status: 'rejected', policy: treasuryCheck, request: null };
  }

  const request = {
    treasuryAddress: TREASURY_ADDRESS,
    recipient: params.recipient,
    amountUsdc: params.amountUsdc,
    memo: params.memo || 'Vendor payment',
    lane: 'B — institutional timelock',
    txRecordStatus: 'PENDING',
    nextSteps: [
      'Timelock window starts (Bloxchain timeLockPeriodSec)',
      'Owner approves via Dynamic embedded wallet',
      'Payment executes with full TxRecord audit trail',
    ],
    status: 'awaiting_owner_approval',
    note: 'On-chain executeWithTimeLock — Phase 5 implementation.',
  };

  return {
    status: 'requested',
    policy: { allowed: true, reason: 'Payment request created; requires Owner approval.' },
    request,
  };
}

export async function simulatePolicyViolation(params: { target?: string }) {
  const treasuryCheck = validateTreasuryConfigured(isTreasuryConfigured());
  if (!treasuryCheck.allowed) {
    return { status: 'rejected', policy: treasuryCheck };
  }

  const target = params.target || '0x000000000000000000000000000000000000dEaD';
  const policy = validateUnauthorizedTarget(target);

  return {
    status: 'blocked',
    policy,
    demonstration: {
      scenario: 'Agent prompt-injected drain attempt',
      target,
      expectedOnChainError: 'TargetNotWhitelisted',
      bloxchainLayer: 'GuardController',
      message:
        'This proposal would revert on-chain. Bloxchain enforces whitelists architecturally — not via prompt engineering.',
    },
    allowedFlowIds: AGENT_POLICY.allowedFlowIds,
  };
}

