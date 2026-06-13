import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isEthereumWallet } from '@dynamic-labs/ethereum';
import type { Address } from 'viem';
import type { AgentBloxToolPayload } from '../../lib/tool-parser';
import { statusColor } from '../../lib/tool-parser';
import { executeRebalance } from '../../lib/execute-api';
import { approveTimelockPayment, secondsUntilRelease } from '../../lib/owner-guard';
import {
  canApprovePayment as shouldShowApprovePayment,
  canConfirmRebalance as shouldShowConfirmRebalance,
  extractPaymentApproval,
  extractSignedMetaTx,
} from '../../lib/tool-result-helpers';

type Props = {
  payload: AgentBloxToolPayload;
};

export default function ToolResultCard({ payload }: Props) {
  const { primaryWallet } = useDynamicContext();
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
  const paymentApproval = result ? extractPaymentApproval(result) : null;

  const showConfirmRebalance = shouldShowConfirmRebalance(payload.tool, result);
  const showApprovePayment = shouldShowApprovePayment(payload.tool, result);

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
    if (!signedMetaTx) return;
    setExecuting(true);
    setExecuteResult(null);
    try {
      const response = await executeRebalance(signedMetaTx);
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

  async function handleApprovePayment() {
    if (!paymentApproval || !primaryWallet || !isEthereumWallet(primaryWallet)) {
      setExecuteResult({
        ok: false,
        message: 'Connect Dynamic Owner wallet in the header before approving.',
      });
      return;
    }

    if (countdown > 0) {
      setExecuteResult({
        ok: false,
        message: `Timelock active — wait ${countdown}s before approving.`,
      });
      return;
    }

    setExecuting(true);
    setExecuteResult(null);
    try {
      const walletClient = await primaryWallet.getWalletClient();
      const ownerAddress = primaryWallet.address as Address;
      const response = await approveTimelockPayment({
        txId: paymentApproval.txId,
        treasuryAddress: paymentApproval.treasuryAddress,
        walletClient,
        ownerAddress,
      });
      if (response.ok) {
        setExecuteResult({ ok: true, message: `Approved: ${response.hash}` });
      } else {
        setExecuteResult({ ok: false, message: response.reason });
      }
    } catch (error) {
      setExecuteResult({
        ok: false,
        message: error instanceof Error ? error.message : 'Owner approval failed',
      });
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className={`tool-card status-${statusColor(status)}`}>
      <div className="tool-card-header">
        <span className="tool-name">{payload.tool}</span>
        <span className={`status-badge ${statusColor(status)}`}>{status}</span>
      </div>
      <pre className="tool-card-body">{JSON.stringify(payload.result, null, 2)}</pre>
      {showConfirmRebalance && (
        <div className="tool-card-actions">
          <button type="button" disabled={executing} onClick={handleConfirmExecution}>
            {executing ? 'Submitting…' : 'Confirm execution'}
          </button>
        </div>
      )}
      {showApprovePayment && (
        <div className="tool-card-actions">
          <button
            type="button"
            disabled={executing || countdown > 0}
            onClick={handleApprovePayment}
          >
            {executing
              ? 'Approving…'
              : countdown > 0
                ? `Timelock ${countdown}s`
                : 'Approve as Owner'}
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
