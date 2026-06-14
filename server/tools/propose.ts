import {
  AGENT_POLICY,
  isTreasuryConfigured,
  PAYMENT_INSTANT_MAX_USDC,
  SEPOLIA_USDC,
  TREASURY_ADDRESS,
} from '../config.js';
import { requestVendorPaymentOnChain } from '../execution/payment.js';
import { composeRebalanceFlow } from '../lifi/compose.js';
import {
  resolvePaymentPath,
  validateFlowIdWithEns,
  validatePaymentAmount,
  validatePaymentRecipient,
  validateRebalanceAmount,
  validateTreasuryConfigured,
  validateUnauthorizedTarget,
} from '../policy-gate.js';
import { sepoliaClient } from '../clients.js';
import { signRebalanceMetaTransaction } from '../signing/meta-tx.js';
import { signPaymentInstantMetaTransaction } from '../signing/payment-meta-tx.js';

export async function proposeRebalance(params: {
  flowId?: string;
  amountUsdc?: string;
}) {
  const treasuryCheck = validateTreasuryConfigured(isTreasuryConfigured());
  if (!treasuryCheck.allowed) {
    return { status: 'rejected', policy: treasuryCheck, proposal: null };
  }

  const flowId = params.flowId || 'rebalance-sepolia-v1';
  const flowCheck = await validateFlowIdWithEns(flowId);
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
          'Set AGENT_POLICY_PRIVATE_KEY, or manual REBALANCE_EXECUTION_* env vars if compose failed',
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

  const recipientCheck = validatePaymentRecipient(params.recipient);
  if (!recipientCheck.allowed) {
    return { status: 'rejected', policy: recipientCheck, request: null };
  }

  let amount: bigint;
  try {
    amount = BigInt(params.amountUsdc);
  } catch {
    return {
      status: 'rejected',
      policy: {
        allowed: false,
        code: 'INVALID_AMOUNT' as const,
        reason: `amountUsdc "${params.amountUsdc}" is not a valid integer.`,
      },
      request: null,
    };
  }

  const amountCheck = validatePaymentAmount(amount);
  if (!amountCheck.allowed) {
    return { status: 'rejected', policy: amountCheck, request: null };
  }

  const paymentPath = resolvePaymentPath(amount);
  const pathLabel = paymentPath === 'B-fast' ? 'B-fast — instant meta-tx' : 'B-timelock — delayed release';

  if (paymentPath === 'B-fast') {
    const signing = await signPaymentInstantMetaTransaction({
      recipient: params.recipient as `0x${string}`,
      amount,
    });

    const request = {
      treasuryAddress: TREASURY_ADDRESS,
      recipient: params.recipient,
      amountUsdc: params.amountUsdc,
      memo: params.memo || 'Vendor payment',
      token: 'USDC',
      paymentPath,
      pathLabel,
      instantThresholdUsdc: PAYMENT_INSTANT_MAX_USDC.toString(),
      txRecordStatus: signing.ok ? 'awaiting_execution' : 'not_submitted',
      signing: signing.ok
        ? {
            status: 'signed' as const,
            signerAddress: signing.signerAddress,
            signedMetaTx: signing.signedMetaTx,
            execution: {
              target: signing.intent.target,
              executionSelector: signing.intent.executionSelector,
              operationType: signing.intent.operationType,
            },
          }
        : {
            status: 'unsigned' as const,
            code: signing.code,
            reason: signing.reason,
          },
      onChain: {
        status: signing.ok ? ('signed' as const) : ('not_configured' as const),
        code: signing.ok ? undefined : signing.code,
        reason: signing.ok ? undefined : signing.reason,
      },
      nextSteps: signing.ok
        ? [
            'APPROVER signed instant payment meta-tx (no ANALYST gas)',
            'Click Confirm execution — Broadcaster submits requestAndApproveExecution',
            'Verify COMPLETED via /status or Sepolia Etherscan',
          ]
        : [
            signing.reason,
            'Provision APPROVER role with SIGN_META_REQUEST_AND_APPROVE on USDC transfer',
            'Set APPROVER_PRIVATE_KEY in .env',
          ],
      status: signing.ok ? 'awaiting_confirmation' : 'awaiting_configuration',
    };

    return {
      status: signing.ok ? 'proposed' : 'requested_unsigned',
      policy: {
        allowed: true,
        reason: `Payment routed to ${pathLabel} (amount below ${PAYMENT_INSTANT_MAX_USDC} USDC units).`,
      },
      request,
    };
  }

  const onChain = await requestVendorPaymentOnChain({
    recipient: params.recipient as `0x${string}`,
    amount,
  });

  const request = {
    treasuryAddress: TREASURY_ADDRESS,
    recipient: params.recipient,
    amountUsdc: params.amountUsdc,
    memo: params.memo || 'Vendor payment',
    token: 'USDC',
    paymentPath,
    pathLabel,
    instantThresholdUsdc: PAYMENT_INSTANT_MAX_USDC.toString(),
    txRecordStatus: onChain.ok ? 'PENDING' : 'not_submitted',
    onChain: onChain.ok
      ? {
          status: 'submitted' as const,
          txId: onChain.txId,
          hash: onChain.hash,
          releaseTime: onChain.releaseTime,
          releaseTimeIso: onChain.releaseTimeIso,
          requester: onChain.requester,
        }
      : {
          status: 'not_configured' as const,
          code: onChain.code,
          reason: onChain.reason,
        },
    nextSteps: onChain.ok
      ? [
          `Timelock active — release after ${onChain.releaseTimeIso ?? 'releaseTime'}`,
          'Click Confirm release — APPROVER signs + Broadcaster submits approve meta-tx',
          'Verify COMPLETED via /pending or Sepolia Etherscan',
        ]
      : [
          onChain.reason,
          'Provision ANALYST role (EXECUTE_TIME_DELAY_REQUEST on ERC20 transfer)',
          'Fund ANALYST wallet with Sepolia ETH for executeWithTimeLock gas',
          'Set ANALYST_PRIVATE_KEY in .env',
        ],
    status: onChain.ok ? 'awaiting_release' : 'awaiting_configuration',
  };

  return {
    status: onChain.ok ? 'requested_on_chain' : 'requested_unsigned',
    policy: {
      allowed: true,
      reason: `Payment routed to ${pathLabel} (amount at/above ${PAYMENT_INSTANT_MAX_USDC} USDC units).`,
    },
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
