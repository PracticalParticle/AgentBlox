import CardShell from './CardShell';
import BroadcasterSubmitBlock from '../broadcaster/BroadcasterSubmitBlock';
import { executeRebalance } from '../../lib/execute-api';
import { isDemoMode } from '../../lib/demo-mode';
import { extractSignedMetaTx } from '../../lib/tool-result-helpers';

type Props = {
  result: Record<string, unknown>;
};

export default function RebalanceProposalCard({ result }: Props) {
  const demo = isDemoMode();

  const proposal = result.proposal as Record<string, unknown> | undefined;
  const compose = proposal?.compose as Record<string, unknown> | undefined;
  const signing = proposal?.signing as Record<string, unknown> | undefined;
  const signedMetaTx = extractSignedMetaTx(result);
  const canConfirm = !demo && result.status === 'proposed' && signedMetaTx !== null;

  const status = typeof result.status === 'string' ? result.status : 'proposed';

  return (
    <CardShell
      title="Rebalance proposal"
      tier="propose"
      status={status}
      summary={`Flow ${String(proposal?.flowId ?? 'rebalance-sepolia-v1')} · Agent signs · Broadcaster executes`}
      footer={
        <>
          {canConfirm && signedMetaTx ? (
            <BroadcasterSubmitBlock onSubmit={() => executeRebalance(signedMetaTx)} />
          ) : null}
          {result.status === 'proposed_unsigned' ? (
            <p className="card-copy muted">
              Meta-tx signing failed — check AGENT_POLICY_PRIVATE_KEY and on-chain SIGN_META roles.
            </p>
          ) : null}
          {demo && signedMetaTx ? (
            <p className="card-copy muted">Demo mode — execution disabled. Remove ?demo=1 to submit.</p>
          ) : null}
        </>
      }
    >
      <section className="intent-section">
        <h4>What</h4>
        <p>Policy-gated treasury operation (LI.FI compose when integrated).</p>
      </section>
      <section className="intent-section">
        <h4>Policy</h4>
        <ul className="check-list">
          <li>Flow ID allowlisted</li>
          <li>Amount &gt; 0</li>
          <li>Treasury configured</li>
        </ul>
      </section>
      <dl className="field-grid">
        <div>
          <dt>Amount (USDC units)</dt>
          <dd>{String(proposal?.fromAmount ?? '—')}</dd>
        </div>
        <div>
          <dt>Compose</dt>
          <dd>{String(compose?.status ?? '—')}</dd>
        </div>
        <div>
          <dt>Signing</dt>
          <dd>{String(signing?.status ?? '—')}</dd>
        </div>
      </dl>
      {compose?.userProxy ? (
        <p className="card-copy mono">userProxy: {String(compose.userProxy)}</p>
      ) : null}
    </CardShell>
  );
}
