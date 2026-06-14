import { AGENT_POLICY, isTreasuryConfigured, SEPOLIA_USDC, TREASURY_ADDRESS } from '../config.js';
import { requestVendorPaymentOnChain } from '../execution/payment.js';
import { composeRebalanceFlow } from '../lifi/compose.js';
import {
  validateFlowId,
  validatePaymentAmount,
  validatePaymentRecipient,
  validateRebalanceAmount,
  validateTreasuryConfigured,
  validateUnauthorizedTarget,
} from '../policy-gate.js';
import { sepoliaClient } from '../clients.js';
import { signRebalanceMetaTransaction } from '../signing/meta-tx.js';

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
    lane: 'B — institutional timelock',
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
          `Timelock active — approve after ${onChain.releaseTimeIso ?? 'releaseTime'}`,
          'Connect Dynamic Owner wallet in the header',
          'Click Approve as Owner in the payment card',
          'Verify COMPLETED via /pending or Sepolia Etherscan',
        ]
      : [
          onChain.reason,
          'Provision ANALYST role on treasury (EXECUTE_TIME_DELAY_REQUEST on ERC20 transfer)',
          'Whitelist Sepolia USDC for transfer(address,uint256)',
          'Set ANALYST_PRIVATE_KEY in .env',
        ],
    status: onChain.ok ? 'awaiting_owner_approval' : 'awaiting_configuration',
  };

  return {
    status: onChain.ok ? 'requested_on_chain' : 'requested_unsigned',
    policy: { allowed: true, reason: 'Payment request passes off-chain policy gate.' },
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
