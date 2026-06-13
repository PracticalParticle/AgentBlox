import { tool } from 'ai';
import { z } from 'zod';
import {
  getLifiQuotePreview,
  proposeRebalance,
  requestVendorPayment,
  simulatePolicyViolation,
} from './propose.js';
import {
  getTreasuryStatus,
  getWhitelistedTargets,
  listPendingApprovals,
  resolveEnsTreasury,
} from './read.js';

export const treasuryTools = {
  get_treasury_status: tool({
    description: 'Get current treasury address, balances, and policy summary on Sepolia.',
    inputSchema: z.object({}),
    execute: async () => getTreasuryStatus(),
  }),

  resolve_ens_treasury: tool({
    description: 'Resolve an ENS name to an AccountBlox address and read policy text records.',
    inputSchema: z.object({
      name: z.string().optional().describe('ENS name e.g. treasury.acme.eth'),
    }),
    execute: async ({ name }) => resolveEnsTreasury(name),
  }),

  list_pending_approvals: tool({
    description: 'List pending timelock approvals awaiting Owner action.',
    inputSchema: z.object({}),
    execute: async () => listPendingApprovals(),
  }),

  get_whitelisted_targets: tool({
    description: 'Show GuardController whitelist expectations for this treasury.',
    inputSchema: z.object({}),
    execute: async () => getWhitelistedTargets(),
  }),

  get_lifi_quote_preview: tool({
    description: 'Read-only preview of a LI.FI Composer quote (does not execute).',
    inputSchema: z.object({
      fromAmount: z.string().optional().describe('Amount in USDC smallest units'),
    }),
    execute: async ({ fromAmount }) => getLifiQuotePreview({ fromAmount }),
  }),

  propose_rebalance: tool({
    description:
      'Propose a treasury rebalance via LI.FI Composer. Returns a proposal card — does NOT execute until confirmed and signed.',
    inputSchema: z.object({
      flowId: z.string().optional().describe('Allowed flow ID, default rebalance-sepolia-v1'),
      amountUsdc: z.string().optional().describe('USDC amount in smallest units'),
    }),
    execute: async ({ flowId, amountUsdc }) => proposeRebalance({ flowId, amountUsdc }),
  }),

  request_vendor_payment: tool({
    description:
      'Request a vendor payment that enters Bloxchain timelock. Requires Owner approval.',
    inputSchema: z.object({
      recipient: z.string().describe('Recipient address'),
      amountUsdc: z.string().describe('USDC amount in smallest units'),
      memo: z.string().optional(),
    }),
    execute: async ({ recipient, amountUsdc, memo }) =>
      requestVendorPayment({ recipient, amountUsdc, memo }),
  }),

  simulate_policy_violation: tool({
    description:
      'Demonstrate a blocked unauthorized transfer — GuardController TargetNotWhitelisted.',
    inputSchema: z.object({
      target: z.string().optional().describe('Non-whitelisted target address'),
    }),
    execute: async ({ target }) => simulatePolicyViolation({ target }),
  }),
};

export type TreasuryToolName = keyof typeof treasuryTools;
