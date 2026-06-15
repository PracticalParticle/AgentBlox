import { resolvePaymentDisplayLabel } from './token-amount';
import { getToolDisplayName } from './tool-labels';
import { userStatusLabel } from './format';
import { statusColor } from './tool-parser';

export type SessionApproval = {
  id: string;
  tool: string;
  statusLabel: string;
  statusColor: string;
  summary: string;
};

export type ActivityItem = {
  id: string;
  label: string;
  tool: string;
  timestamp: number;
};

export function extractSessionApprovals(
  toolBlocks: Array<{ tool: string; result: unknown }>,
): SessionApproval[] {
  const items: SessionApproval[] = [];

  for (const [index, block] of toolBlocks.entries()) {
    const result = block.result as Record<string, unknown> | null;
    if (!result) continue;

    if (
      block.tool === 'propose_rebalance' &&
      (result.status === 'proposed' || result.status === 'proposed_unsigned')
    ) {
      const proposal = result.proposal as Record<string, unknown> | undefined;
      items.push({
        id: `rebalance-${index}`,
        tool: block.tool,
        statusLabel: userStatusLabel(String(result.status)),
        statusColor: statusColor(String(result.status)),
        summary: `Rebalance ${String(proposal?.fromAmount ?? '')} USDC units`,
      });
    }

    if (
      block.tool === 'request_vendor_payment' &&
      (result.status === 'requested_on_chain' || result.status === 'requested_unsigned')
    ) {
      const request = result.request as Record<string, unknown> | undefined;
      items.push({
        id: `pay-${index}`,
        tool: block.tool,
        statusLabel: userStatusLabel(String(result.status)),
        statusColor: statusColor(String(result.status)),
        summary: `Pay ${resolvePaymentDisplayLabel(request)} to vendor`,
      });
    }
  }

  return items.reverse();
}

export function extractActivityItems(
  entries: Array<{ id: string; tool: string; result: unknown; timestamp: number }>,
): ActivityItem[] {
  return entries.map((entry) => {
    const result = entry.result as Record<string, unknown> | null;
    const status = result?.status ? userStatusLabel(String(result.status)) : 'Complete';
    return {
      id: entry.id,
      tool: entry.tool,
      label: `${getToolDisplayName(entry.tool)} · ${status}`,
      timestamp: entry.timestamp,
    };
  });
}
