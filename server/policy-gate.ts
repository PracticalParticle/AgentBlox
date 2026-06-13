import { isAddress, zeroAddress } from 'viem';
import { AGENT_POLICY } from './config.js';

export type PolicyDecision = {
  allowed: boolean;
  reason: string;
  code?:
    | 'FLOW_NOT_ALLOWED'
    | 'TARGET_NOT_WHITELISTED'
    | 'TREASURY_NOT_CONFIGURED'
    | 'INVALID_RECIPIENT'
    | 'INVALID_AMOUNT';
};

export function validateFlowId(flowId: string): PolicyDecision {
  if (!AGENT_POLICY.allowedFlowIds.includes(flowId as (typeof AGENT_POLICY.allowedFlowIds)[number])) {
    return {
      allowed: false,
      code: 'FLOW_NOT_ALLOWED',
      reason: `Flow "${flowId}" is not in the treasury policy allowlist.`,
    };
  }
  return { allowed: true, reason: 'Flow ID permitted by policy manifest.' };
}

export function validateRebalanceAmount(amount: bigint): PolicyDecision {
  if (amount <= 0n) {
    return { allowed: false, reason: 'Rebalance amount must be greater than zero.' };
  }
  return { allowed: true, reason: 'Amount within policy bounds.' };
}

export function validateUnauthorizedTarget(target: string): PolicyDecision {
  return {
    allowed: false,
    code: 'TARGET_NOT_WHITELISTED',
    reason: `Target ${target} is not whitelisted in GuardController. Bloxchain will revert with TargetNotWhitelisted.`,
  };
}

export function validateTreasuryConfigured(configured: boolean): PolicyDecision {
  if (!configured) {
    return {
      allowed: false,
      code: 'TREASURY_NOT_CONFIGURED',
      reason: 'Configure a treasury address in Console or .env before executing treasury tools.',
    };
  }
  return { allowed: true, reason: 'Treasury configured.' };
}

export function validatePaymentRecipient(recipient: string): PolicyDecision {
  if (!isAddress(recipient)) {
    return {
      allowed: false,
      code: 'INVALID_RECIPIENT',
      reason: `Recipient "${recipient}" is not a valid Ethereum address.`,
    };
  }

  if (recipient.toLowerCase() === zeroAddress) {
    return {
      allowed: false,
      code: 'INVALID_RECIPIENT',
      reason: 'Recipient cannot be the zero address.',
    };
  }

  return { allowed: true, reason: 'Recipient address is valid.' };
}

export function validatePaymentAmount(amount: bigint): PolicyDecision {
  if (amount <= 0n) {
    return {
      allowed: false,
      code: 'INVALID_AMOUNT',
      reason: 'Payment amount must be greater than zero.',
    };
  }
  return { allowed: true, reason: 'Payment amount is valid.' };
}
