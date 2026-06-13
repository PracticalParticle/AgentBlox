export function truncateAddress(address: string, visible = 4): string {
  if (!address.startsWith('0x') || address.length < 10) return address;
  return `${address.slice(0, 2 + visible)}…${address.slice(-visible)}`;
}

export function userStatusLabel(status: string | undefined): string {
  switch (status) {
    case 'proposed':
      return 'Awaiting your confirm';
    case 'requested_on_chain':
    case 'requested':
      return 'Pending approval';
    case 'requested_unsigned':
    case 'proposed_unsigned':
      return 'Needs configuration';
    case 'blocked':
      return 'Blocked by policy';
    case 'rejected':
      return 'Rejected';
    case 'ok':
      return 'Complete';
    default:
      return status || 'Complete';
  }
}

export function tierLabel(tier: 'read' | 'propose' | 'execute' | 'validate'): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
