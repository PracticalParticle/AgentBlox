import { useEffect, useState } from 'react';
import type { AgentBloxToolPayload } from '../../lib/tool-parser';
import { statusColor } from '../../lib/tool-parser';
import BroadcasterSubmitBlock from '../broadcaster/BroadcasterSubmitBlock';
import {
  approveTimelockPayment as approveTimelockViaBroadcaster,
  executeInstantPayment,
  executeRebalance,
} from '../../lib/execute-api';
import { isDemoMode } from '../../lib/demo-mode';
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
  const demo = isDemoMode();
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

  const showConfirmRebalance = !demo && canConfirmRebalance(payload.tool, result);
  const showConfirmInstantPayment = !demo && canConfirmInstantPayment(payload.tool, result);
  const showConfirmTimelockRelease = !demo && canConfirmTimelockRelease(payload.tool, result);

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

  const showConfirmExecution = showConfirmRebalance || showConfirmInstantPayment;
  const executionMetaTx = signedMetaTx ?? paymentSignedMetaTx;

  return (
    <div className={`tool-card status-${statusColor(status)}`}>
      <div className="tool-card-header">
        <span className="tool-name">{payload.tool}</span>
        <span className={`status-badge ${statusColor(status)}`}>{status}</span>
      </div>
      <pre className="tool-card-body">{JSON.stringify(payload.result, null, 2)}</pre>
      {showConfirmExecution && executionMetaTx ? (
        <div className="tool-card-actions">
          <BroadcasterSubmitBlock
            className=""
            onSubmit={() =>
              paymentSignedMetaTx
                ? executeInstantPayment(executionMetaTx)
                : executeRebalance(executionMetaTx)
            }
          />
        </div>
      ) : null}
      {showConfirmTimelockRelease && paymentApproval ? (
        <div className="tool-card-actions">
          <BroadcasterSubmitBlock
            className=""
            label="Submit release on-chain (Broadcaster)"
            loadingLabel="Releasing…"
            successMessage="Timelock released on Sepolia via Dynamic Broadcaster"
            disabled={countdown > 0}
            disabledHint={`Timelock ${countdown}s`}
            onSubmit={() => approveTimelockViaBroadcaster(paymentApproval.txId)}
          />
        </div>
      ) : null}
    </div>
  );
}
