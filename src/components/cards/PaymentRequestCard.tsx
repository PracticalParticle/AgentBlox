import { useEffect, useState } from 'react';
import CardShell from './CardShell';
import { isDemoMode } from '../../lib/demo-mode';
import { sepoliaTxUrl } from '../../lib/links';
import {
  approveTimelockPayment as approveTimelockViaBroadcaster,
  executeInstantPayment,
} from '../../lib/execute-api';
import { secondsUntilRelease } from '../../lib/owner-guard';
import {
  canConfirmInstantPayment,
  canConfirmTimelockRelease,
  extractPaymentApproval,
  extractPaymentSignedMetaTx,
} from '../../lib/tool-result-helpers';

type Props = {
  result: Record<string, unknown>;
};

export default function PaymentRequestCard({ result }: Props) {
  const [executing, setExecuting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string; hash?: string } | null>(null);
  const [countdown, setCountdown] = useState(0);
  const demo = isDemoMode();

  const request = result.request as Record<string, unknown> | undefined;
  const onChain = request?.onChain as Record<string, unknown> | undefined;
  const paymentApproval = extractPaymentApproval(result);
  const paymentSignedMetaTx = extractPaymentSignedMetaTx(result);
  const isInstant = canConfirmInstantPayment('request_vendor_payment', result);
  const isTimelock = canConfirmTimelockRelease('request_vendor_payment', result);
  const canAct = !demo && (isInstant || isTimelock);

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

  async function handleConfirmExecution() {
    if (!paymentSignedMetaTx) return;
    setExecuting(true);
    setFeedback(null);
    try {
      const response = await executeInstantPayment(paymentSignedMetaTx);
      setFeedback(
        response.ok
          ? { ok: true, message: 'Payment executed on Sepolia', hash: response.hash }
          : { ok: false, message: response.reason },
      );
    } catch (error) {
      setFeedback({
        ok: false,
        message: error instanceof Error ? error.message : 'Payment execution failed',
      });
    } finally {
      setExecuting(false);
    }
  }

  async function handleConfirmRelease() {
    if (!paymentApproval) return;
    if (countdown > 0) {
      setFeedback({ ok: false, message: `Timelock active — wait ${countdown}s before release.` });
      return;
    }
    setExecuting(true);
    setFeedback(null);
    try {
      const response = await approveTimelockViaBroadcaster(paymentApproval.txId);
      setFeedback(
        response.ok
          ? { ok: true, message: 'Timelock released on Sepolia', hash: response.hash }
          : { ok: false, message: response.reason },
      );
    } catch (error) {
      setFeedback({
        ok: false,
        message: error instanceof Error ? error.message : 'Timelock release failed',
      });
    } finally {
      setExecuting(false);
    }
  }

  const status = typeof result.status === 'string' ? result.status : 'requested';
  const pathLabel = String(request?.pathLabel ?? request?.paymentPath ?? '—');
  const whoLine =
    request?.paymentPath === 'B-fast'
      ? 'Approver signs · Broadcaster executes'
      : 'Analyst requests · Approver signs · Broadcaster releases';

  return (
    <CardShell
      title="Vendor payment"
      tier="propose"
      status={status}
      summary={`Pay ${String(request?.amountUsdc ?? '—')} USDC · ${pathLabel} · ${whoLine}`}
      footer={
        <>
          {canAct && isInstant ? (
            <button
              type="button"
              className="card-cta"
              disabled={executing}
              onClick={handleConfirmExecution}
            >
              {executing ? 'Submitting…' : 'Confirm execution'}
            </button>
          ) : null}
          {canAct && isTimelock ? (
            <button
              type="button"
              className="card-cta"
              disabled={executing || countdown > 0}
              onClick={handleConfirmRelease}
            >
              {executing
                ? 'Releasing…'
                : countdown > 0
                  ? `Timelock ${countdown}s`
                  : 'Confirm release'}
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
          {demo && (isInstant || isTimelock) ? (
            <p className="card-copy muted">Demo mode — execution disabled. Remove ?demo=1 to confirm.</p>
          ) : null}
        </>
      }
    >
      <section className="intent-section">
        <h4>What</h4>
        <p>
          {request?.paymentPath === 'B-fast' ? 'Instant USDC transfer' : 'Timelock disbursement'} to{' '}
          <span className="mono">{String(request?.recipient ?? '—')}</span>
        </p>
      </section>
      <dl className="field-grid">
        <div>
          <dt>Path</dt>
          <dd>{pathLabel}</dd>
        </div>
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
        {request?.signing && typeof request.signing === 'object' ? (
          <div>
            <dt>Approver sign</dt>
            <dd>{String((request.signing as Record<string, unknown>).status ?? '—')}</dd>
          </div>
        ) : null}
      </dl>
      {onChain?.reason ? <p className="card-copy muted">{String(onChain.reason)}</p> : null}
    </CardShell>
  );
}
