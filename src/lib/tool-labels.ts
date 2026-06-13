export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  get_treasury_status: 'Treasury status',
  resolve_ens_treasury: 'ENS treasury',
  list_pending_approvals: 'Pending approvals',
  get_whitelisted_targets: 'Whitelist',
  get_lifi_quote_preview: 'LI.FI quote',
  propose_rebalance: 'Rebalance proposal',
  request_vendor_payment: 'Vendor payment',
  simulate_policy_violation: 'Policy check',
};

export const TOOL_TIERS: Record<string, 'read' | 'propose' | 'execute' | 'validate'> = {
  get_treasury_status: 'read',
  resolve_ens_treasury: 'read',
  list_pending_approvals: 'read',
  get_whitelisted_targets: 'read',
  get_lifi_quote_preview: 'read',
  propose_rebalance: 'propose',
  request_vendor_payment: 'propose',
  simulate_policy_violation: 'validate',
};

export function getToolDisplayName(tool: string): string {
  return TOOL_DISPLAY_NAMES[tool] ?? tool;
}

export function getToolTier(tool: string): 'read' | 'propose' | 'execute' | 'validate' {
  return TOOL_TIERS[tool] ?? 'read';
}
