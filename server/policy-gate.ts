import { AGENT_POLICY } from './config.js';

export type PolicyDecision = {
  allowed: boolean;
  reason: string;
  code?: 'FLOW_NOT_ALLOWED' | 'TARGET_NOT_WHITELISTED' | 'TREASURY_NOT_CONFIGURED';
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
