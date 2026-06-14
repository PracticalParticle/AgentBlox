import { useEffect, useState } from 'react';
import type { AgentBloxToolPayload } from '../../lib/tool-parser';
import { statusColor } from '../../lib/tool-parser';
import {
  approveTimelockPayment as approveTimelockViaBroadcaster,
  executeInstantPayment,
  executeRebalance,
} from '../../lib/execute-api';
import { secondsUntilRelease } from '../../lib/owner-guard';
import {
  canConfirmInstantPayment,
  canConfirmRebalance,
  canConfirmTimelockRelease,
  extractPaymentApproval,
  extractPaymentSignedMetaTx,
  extractSignedMetaTx,
} from '../../lib/tool-result-helpers';

type Props = {
  payload: AgentBloxToolPayload;
};

export default function ToolResultCard({ payload }: Props) {
  const result = payload.result as Record<string, unknown> | null;
  const [executing, setExecuting] = useState(false);
  const [executeResult, setExecuteResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [countdown, setCountdown] = useState(0);

  const status =
    typeof result?.status === 'string'
      ? result.status
      : typeof result?.configured === 'boolean' && !result.configured
        ? 'rejected'
        : 'ok';

  const signedMetaTx = result ? extractSignedMetaTx(result) : null;
  const paymentSignedMetaTx = result ? extractPaymentSignedMetaTx(result) : null;
  const paymentApproval = result ? extractPaymentApproval(result) : null;

  const showConfirmRebalance = canConfirmRebalance(payload.tool, result);
  const showConfirmInstantPayment = canConfirmInstantPayment(payload.tool, result);
  const showConfirmTimelockRelease = canConfirmTimelockRelease(payload.tool, result);

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
    const metaTx = signedMetaTx ?? paymentSignedMetaTx;
    if (!metaTx) return;
    setExecuting(true);
    setExecuteResult(null);
    try {
      const response = paymentSignedMetaTx
        ? await executeInstantPayment(metaTx)
        : await executeRebalance(metaTx);
      if (response.ok) {
        setExecuteResult({ ok: true, message: `Submitted: ${response.hash}` });
      } else {
        setExecuteResult({ ok: false, message: response.reason });
      }
    } catch (error) {
      setExecuteResult({
        ok: false,
        message: error instanceof Error ? error.message : 'Execution request failed',
      });
    } finally {
      setExecuting(false);
    }
  }

  async function handleConfirmRelease() {
    if (!paymentApproval) return;
    if (countdown > 0) {
      setExecuteResult({
        ok: false,
        message: `Timelock active — wait ${countdown}s before release.`,
      });
      return;
    }

    setExecuting(true);
    setExecuteResult(null);
    try {
      const response = await approveTimelockViaBroadcaster(paymentApproval.txId);
      if (response.ok) {
        setExecuteResult({ ok: true, message: `Released: ${response.hash}` });
      } else {
        setExecuteResult({ ok: false, message: response.reason });
      }
    } catch (error) {
      setExecuteResult({
        ok: false,
        message: error instanceof Error ? error.message : 'Timelock release failed',
      });
    } finally {
      setExecuting(false);
    }
  }

  const showConfirmExecution = showConfirmRebalance || showConfirmInstantPayment;

  return (
    <div className={`tool-card status-${statusColor(status)}`}>
      <div className="tool-card-header">
        <span className="tool-name">{payload.tool}</span>
        <span className={`status-badge ${statusColor(status)}`}>{status}</span>
      </div>
      <pre className="tool-card-body">{JSON.stringify(payload.result, null, 2)}</pre>
      {showConfirmExecution && (
        <div className="tool-card-actions">
          <button type="button" disabled={executing} onClick={handleConfirmExecution}>
            {executing ? 'Submitting…' : 'Confirm execution'}
          </button>
        </div>
      )}
      {showConfirmTimelockRelease && (
        <div className="tool-card-actions">
          <button type="button" disabled={executing || countdown > 0} onClick={handleConfirmRelease}>
            {executing
              ? 'Releasing…'
              : countdown > 0
                ? `Timelock ${countdown}s`
                : 'Confirm release'}
          </button>
        </div>
      )}
      {executeResult && (
        <p className={`tool-card-feedback ${executeResult.ok ? 'ok' : 'error'}`}>
          {executeResult.message}
        </p>
      )}
    </div>
  );
}
