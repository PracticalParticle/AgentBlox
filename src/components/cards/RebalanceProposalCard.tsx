import { useState } from 'react';
import CardShell from './CardShell';
import { executeRebalance } from '../../lib/execute-api';
import { isDemoMode } from '../../lib/demo-mode';
import { sepoliaTxUrl } from '../../lib/links';
import { extractSignedMetaTx } from '../../lib/tool-result-helpers';

type Props = {
  result: Record<string, unknown>;
};

export default function RebalanceProposalCard({ result }: Props) {
  const [executing, setExecuting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string; hash?: string } | null>(null);
  const demo = isDemoMode();

  const proposal = result.proposal as Record<string, unknown> | undefined;
  const compose = proposal?.compose as Record<string, unknown> | undefined;
  const signing = proposal?.signing as Record<string, unknown> | undefined;
  const signedMetaTx = extractSignedMetaTx(result);
  const canConfirm = !demo && result.status === 'proposed' && signedMetaTx !== null;

  async function handleConfirm() {
    if (!signedMetaTx) return;
    setExecuting(true);
    setFeedback(null);
    try {
      const response = await executeRebalance(signedMetaTx);
      setFeedback(
        response.ok
          ? { ok: true, message: 'Submitted on Sepolia', hash: response.hash }
          : { ok: false, message: response.reason },
      );
    } catch (error) {
      setFeedback({
        ok: false,
        message: error instanceof Error ? error.message : 'Execution request failed',
      });
    } finally {
      setExecuting(false);
    }
  }

  const status = typeof result.status === 'string' ? result.status : 'proposed';

  return (
    <CardShell
      title="Rebalance proposal"
      tier="propose"
      status={status}
      summary={`Flow ${String(proposal?.flowId ?? 'rebalance-sepolia-v1')} · Agent signs · Broadcaster executes`}
      footer={
        <>
          {canConfirm ? (
            <button type="button" className="card-cta" disabled={executing} onClick={handleConfirm}>
              {executing ? 'Submitting…' : 'Confirm execution'}
            </button>
          ) : null}
          {feedback ? (
            <p className={`tool-card-feedback ${feedback.ok ? 'ok' : 'error'}`}>
              {feedback.message}
              {feedback.hash ? (
                <>
                  {' '}
                  <a href={sepoliaTxUrl(feedback.hash)} target="_blank" rel="noreferrer">
                    View on Etherscan
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
          {demo && signedMetaTx ? (
            <p className="card-copy muted">Demo mode — execution disabled. Remove ?demo=1 to confirm.</p>
          ) : null}
        </>
      }
    >
      <section className="intent-section">
        <h4>What</h4>
        <p>Swap USDC → WETH via LI.FI Composer (policy-gated).</p>
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
