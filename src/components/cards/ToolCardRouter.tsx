import type { AgentBloxToolPayload } from '../../lib/tool-parser';
import { getToolDisplayName } from '../../lib/tool-labels';
import ToolResultCard from '../chat/ToolResultCard';
import EnsTreasuryCard from './EnsTreasuryCard';
import LifiQuoteCard from './LifiQuoteCard';
import PaymentRequestCard from './PaymentRequestCard';
import PendingApprovalsCard from './PendingApprovalsCard';
import PolicyBlockedCard from './PolicyBlockedCard';
import RebalanceProposalCard from './RebalanceProposalCard';
import TreasuryStatusCard from './TreasuryStatusCard';
import WalletTransferCard from './WalletTransferCard';
import WhitelistCard from './WhitelistCard';

type Props = {
  payload: AgentBloxToolPayload;
};

export default function ToolCardRouter({ payload }: Props) {
  const result = payload.result as Record<string, unknown> | null;
  if (!result) {
    return (
      <div className="typed-card">
        <div className="typed-card-header">
          <span className="typed-card-title">{getToolDisplayName(payload.tool)}</span>
        </div>
        <p className="card-copy muted">No result payload.</p>
      </div>
    );
  }

  switch (payload.tool) {
    case 'get_treasury_status':
      return <TreasuryStatusCard result={result} />;
    case 'resolve_ens_treasury':
      return <EnsTreasuryCard result={result} />;
    case 'list_pending_approvals':
      return <PendingApprovalsCard result={result} />;
    case 'get_whitelisted_targets':
      return <WhitelistCard result={result} />;
    case 'get_lifi_quote_preview':
      return <LifiQuoteCard result={result} />;
    case 'propose_rebalance':
      return <RebalanceProposalCard result={result} />;
    case 'request_vendor_payment':
      return <PaymentRequestCard result={result} />;
    case 'prepare_wallet_transfer':
      return <WalletTransferCard result={result} />;
    case 'simulate_policy_violation':
      return <PolicyBlockedCard result={result} />;
    default:
      return <ToolResultCard payload={payload} />;
  }
}
