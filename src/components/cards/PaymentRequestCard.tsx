import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isEthereumWallet } from '@dynamic-labs/ethereum';
import type { Address } from 'viem';
import CardShell from './CardShell';
import { isDemoMode } from '../../lib/demo-mode';
import { sepoliaTxUrl } from '../../lib/links';
import { approveTimelockPayment, secondsUntilRelease } from '../../lib/owner-guard';
import { extractPaymentApproval } from '../../lib/tool-result-helpers';

type Props = {
  result: Record<string, unknown>;
};

export default function PaymentRequestCard({ result }: Props) {
  const { primaryWallet } = useDynamicContext();
  const [executing, setExecuting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string; hash?: string } | null>(null);
  const [countdown, setCountdown] = useState(0);
  const demo = isDemoMode();

  const request = result.request as Record<string, unknown> | undefined;
  const onChain = request?.onChain as Record<string, unknown> | undefined;
  const paymentApproval = extractPaymentApproval(result);
  const canApprove = !demo && result.status === 'requested_on_chain' && paymentApproval !== null;

  useEffect(() => {
    if (!paymentApproval) {
      setCountdown(0);
      return;
    }
    const tick = () => setCountdown(secondsUntilRelease(paymentApproval.releaseTime));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [paymentApproval]);

  async function handleApprove() {
    if (!paymentApproval || !primaryWallet || !isEthereumWallet(primaryWallet)) {
      setFeedback({
        ok: false,
        message: 'Connect Dynamic Owner wallet in the header before approving.',
      });
      return;
    }
    if (countdown > 0) {
      setFeedback({ ok: false, message: `Timelock active — wait ${countdown}s before approving.` });
      return;
    }
    setExecuting(true);
    setFeedback(null);
    try {
      const walletClient = await primaryWallet.getWalletClient();
      const response = await approveTimelockPayment({
        txId: paymentApproval.txId,
        treasuryAddress: paymentApproval.treasuryAddress,
        walletClient,
        ownerAddress: primaryWallet.address as Address,
      });
      setFeedback(
        response.ok
          ? { ok: true, message: 'Approved on Sepolia', hash: response.hash }
          : { ok: false, message: response.reason },
      );
    } catch (error) {
      setFeedback({
        ok: false,
        message: error instanceof Error ? error.message : 'Owner approval failed',
      });
    } finally {
      setExecuting(false);
    }
  }

  const status = typeof result.status === 'string' ? result.status : 'requested';

  return (
    <CardShell
      title="Vendor payment"
      tier="propose"
      status={status}
      summary={`Pay ${String(request?.amountUsdc ?? '—')} USDC · Analyst requests · Owner approves`}
      footer={
        <>
          {canApprove ? (
            <button
              type="button"
              className="card-cta"
              disabled={executing || countdown > 0}
              onClick={handleApprove}
            >
              {executing
                ? 'Approving…'
                : countdown > 0
                  ? `Timelock ${countdown}s`
                  : 'Approve as Owner'}
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
          {demo && paymentApproval ? (
            <p className="card-copy muted">Demo mode — Owner approval disabled. Remove ?demo=1 to approve.</p>
          ) : null}
        </>
      }
    >
      <section className="intent-section">
        <h4>What</h4>
        <p>
          Timelock disbursement to <span className="mono">{String(request?.recipient ?? '—')}</span>
        </p>
      </section>
      <dl className="field-grid">
        <div>
          <dt>Memo</dt>
          <dd>{String(request?.memo ?? '—')}</dd>
        </div>
        <div>
          <dt>On-chain</dt>
          <dd>{String(onChain?.status ?? 'not submitted')}</dd>
        </div>
        {onChain?.txId ? (
          <div>
            <dt>TxRecord ID</dt>
            <dd>{String(onChain.txId)}</dd>
          </div>
        ) : null}
        {onChain?.releaseTimeIso ? (
          <div>
            <dt>Release</dt>
            <dd>{String(onChain.releaseTimeIso)}</dd>
          </div>
        ) : null}
      </dl>
      {onChain?.reason ? <p className="card-copy muted">{String(onChain.reason)}</p> : null}
    </CardShell>
  );
}
