import { AGENT_POLICY, isTreasuryConfigured, TREASURY_ADDRESS } from '../config.js';
import {
  validateFlowId,
  validateRebalanceAmount,
  validateTreasuryConfigured,
  validateUnauthorizedTarget,
} from '../policy-gate.js';
import { sepoliaClient } from '../clients.js';

/** Sepolia USDC placeholder — replace with deployed token for demo. */
const SEPOLIA_USDC = '0x1c7D4B196Cb0C7B29D5D0a0D0a0D0a0D0a0D0a0D' as const;

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

  const proposal = {
    flowId,
    treasuryAddress: TREASURY_ADDRESS,
    action: 'rebalance',
    fromToken: SEPOLIA_USDC,
    fromAmount: amount.toString(),
    lifiIntegrator: 'AgentBlox',
    nextSteps: [
      'AGENT_POLICY signs EIP-712 meta-tx (server-side)',
      'Dynamic Broadcaster submits executeMetaTx',
      'GuardController validates whitelist → LI.FI Composer executes',
    ],
    status: 'awaiting_confirmation',
    note: 'Full LI.FI quote + meta-tx signing — Phase 3 implementation.',
  };

  return {
    status: 'proposed',
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

export async function getLifiQuotePreview(params: {
  fromAmount?: string;
}) {
  const treasuryCheck = validateTreasuryConfigured(isTreasuryConfigured());
  if (!treasuryCheck.allowed) {
    return { status: 'rejected', policy: treasuryCheck };
  }

  return {
    status: 'preview',
    note: 'Read-only LI.FI quote preview. Execution requires propose_rebalance + Broadcaster.',
    params: {
      fromChain: 11155111,
      toChain: 11155111,
      fromAmount: params.fromAmount || '1000000',
      fromAddress: TREASURY_ADDRESS,
      integrator: 'AgentBlox',
    },
    docs: 'https://docs.li.fi/composer/guides/sdk-integration',
    implementation: 'Phase 4 — getQuote via @lifi/sdk',
  };
}
