import type { TreasuryToolName } from '../tools/index.js';
import {
  proposeRebalance,
  requestVendorPayment,
  simulatePolicyViolation,
} from '../tools/propose.js';
import { prepareWalletTransfer } from '../tools/wallet-transfer.js';
import {
  getLifiQuotePreview,
  getTreasuryStatus,
  getWhitelistedTargets,
  listPendingApprovals,
  resolveEnsTreasury,
} from '../tools/read.js';
import { parsePaySlashCommand, PAY_DEMO_COMMANDS } from './pay-command.js';
import { parseWalletTransferCommand } from './wallet-transfer-command.js';

type RoutedCommand = {
  tool: TreasuryToolName;
  args: Record<string, unknown>;
  label: string;
};

function normalize(text: string) {
  return text.trim().toLowerCase();
}

export function routeUserMessage(text: string): RoutedCommand | null {
  const msg = normalize(text);

  if (msg.startsWith('/status') || msg.includes('treasury status') || msg === 'status') {
    return { tool: 'get_treasury_status', args: {}, label: 'Treasury status' };
  }

  if (
    msg.startsWith('/ens') ||
    msg.includes('resolve ens') ||
    msg.includes('what is treasury') ||
    msg.includes('who is this treasury')
  ) {
    const nameMatch = text.match(/[\w-]+\.eth/i);
    return {
      tool: 'resolve_ens_treasury',
      args: { name: nameMatch?.[0] },
      label: 'ENS resolution',
    };
  }

  if (msg.startsWith('/pending') || msg.includes('pending approval')) {
    return { tool: 'list_pending_approvals', args: {}, label: 'Pending approvals' };
  }

  if (msg.startsWith('/whitelist') || msg.includes('whitelisted')) {
    return { tool: 'get_whitelisted_targets', args: {}, label: 'Whitelist' };
  }

  const walletTransfer = parseWalletTransferCommand(text);
  if (walletTransfer) {
    return {
      tool: 'prepare_wallet_transfer',
      args: { direction: walletTransfer },
      label: walletTransfer === 'deposit' ? 'Deposit 0.01 ETH' : 'Withdraw 0.01 ETH',
    };
  }

  if (msg.startsWith('/quote') || msg.includes('lifi quote')) {
    return { tool: 'get_lifi_quote_preview', args: {}, label: 'LI.FI quote preview' };
  }

  if (msg.startsWith('/pay') || msg === 'pay') {
    const parsed = parsePaySlashCommand(text);
    if (parsed) {
      return {
        tool: 'request_vendor_payment',
        args: {
          recipient: parsed.recipient,
          amountDollars: parsed.amountDollars,
          memo: parsed.memo,
        },
        label: parsed.label,
      };
    }
    return null;
  }

  if (msg.includes('vendor payment') || msg.includes('pay vendor')) {
    const parsed = parsePaySlashCommand(PAY_DEMO_COMMANDS.timelock);
    if (!parsed) return null;
    return {
      tool: 'request_vendor_payment',
      args: {
        recipient: parsed.recipient,
        amountDollars: parsed.amountDollars,
        memo: parsed.memo,
      },
      label: parsed.label,
    };
  }

  if (msg.includes('instant payment') || msg.includes('small payment')) {
    const parsed = parsePaySlashCommand(PAY_DEMO_COMMANDS.fast);
    if (!parsed) return null;
    return {
      tool: 'request_vendor_payment',
      args: {
        recipient: parsed.recipient,
        amountDollars: parsed.amountDollars,
        memo: parsed.memo,
      },
      label: parsed.label,
    };
  }

  if (
    msg.startsWith('/rebalance') ||
    msg.includes('rebalance') ||
    msg.includes('rebalancing')
  ) {
    return { tool: 'propose_rebalance', args: {}, label: 'Propose rebalance' };
  }

  if (
    msg.startsWith('/attack') ||
    msg.includes('drain') ||
    msg.includes('steal') ||
    msg.includes('unauthorized')
  ) {
    return { tool: 'simulate_policy_violation', args: {}, label: 'Policy violation demo' };
  }

  if (msg.startsWith('/help') || msg === 'help') {
    return null;
  }

  return null;
}

export async function executeRoutedTool(command: RoutedCommand) {
  switch (command.tool) {
    case 'get_treasury_status':
      return getTreasuryStatus();
    case 'resolve_ens_treasury':
      return resolveEnsTreasury(command.args.name as string | undefined);
    case 'list_pending_approvals':
      return listPendingApprovals();
    case 'get_whitelisted_targets':
      return getWhitelistedTargets();
    case 'get_lifi_quote_preview':
      return getLifiQuotePreview(command.args as { fromAmount?: string });
    case 'propose_rebalance':
      return proposeRebalance(command.args as { flowId?: string; amountUsdc?: string });
    case 'request_vendor_payment':
      return requestVendorPayment(
        command.args as {
          recipient: string;
          amountUsdc?: string;
          amountDollars?: string;
          memo?: string;
        },
      );
    case 'simulate_policy_violation':
      return simulatePolicyViolation(command.args as { target?: string });
    case 'prepare_wallet_transfer':
      return prepareWalletTransfer(
        command.args.direction as 'deposit' | 'withdraw',
      );
    default:
      return { error: 'Unknown tool' };
  }
}

export function formatToolResult(tool: string, result: unknown): string {
  return `**${tool}**\n\n\`\`\`agentblox-tool\n${JSON.stringify({ tool, result }, null, 2)}\n\`\`\``;
}

export const HELP_MESSAGE = `**AgentBlox Copilot commands**

Slash commands (works without LLM API key):
- \`/status\` — treasury status
- \`/deposit\` — send 0.01 ETH to treasury (your Dynamic wallet)
- \`/withdraw\` — request 0.01 ETH from treasury to your wallet (timelock)
- \`/pay 5$\` — instant vendor payment (B-fast: ANALYST sign → Broadcaster)
- \`/pay 20$\` — timelock vendor payment (ANALYST request → APPROVER sign → Broadcaster)
- \`/rebalance\` — propose LI.FI rebalance
- \`/ens\` — resolve ENS name
- \`/attack\` — demo blocked unauthorized transfer
- \`/pending\` — pending approvals
- \`/whitelist\` — GuardController whitelist
- \`/help\` — this message

Natural language works when \`OPENAI_API_KEY\` is configured.`;
