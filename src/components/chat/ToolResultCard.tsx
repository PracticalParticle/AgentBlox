import { useState } from 'react';
import type { AgentBloxToolPayload } from '../../lib/tool-parser';
import { statusColor } from '../../lib/tool-parser';
import { executeRebalance } from '../../lib/execute-api';
import type { SerializedMetaTransaction } from '../../lib/meta-tx-types';

type Props = {
  payload: AgentBloxToolPayload;
};

function extractSignedMetaTx(result: Record<string, unknown>): SerializedMetaTransaction | null {
  const proposal = result.proposal as Record<string, unknown> | undefined;
  const signing = proposal?.signing as Record<string, unknown> | undefined;
  if (signing?.status !== 'signed' || !signing.signedMetaTx) {
    return null;
  }
  return signing.signedMetaTx as SerializedMetaTransaction;
}

export default function ToolResultCard({ payload }: Props) {
  const result = payload.result as Record<string, unknown> | null;
  const [executing, setExecuting] = useState(false);
  const [executeResult, setExecuteResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  const status =
    typeof result?.status === 'string'
      ? result.status
      : typeof result?.configured === 'boolean' && !result.configured
        ? 'rejected'
        : 'ok';

  const signedMetaTx = result ? extractSignedMetaTx(result) : null;
  const canConfirm =
    payload.tool === 'propose_rebalance' &&
    signedMetaTx !== null &&
    result?.status === 'proposed';

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

  return (
    <div className={`tool-card status-${statusColor(status)}`}>
      <div className="tool-card-header">
        <span className="tool-name">{payload.tool}</span>
        <span className={`status-badge ${statusColor(status)}`}>{status}</span>
      </div>
      <pre className="tool-card-body">{JSON.stringify(payload.result, null, 2)}</pre>
      {canConfirm && (
        <div className="tool-card-actions">
          <button type="button" disabled={executing} onClick={handleConfirmExecution}>
            {executing ? 'Submitting…' : 'Confirm execution'}
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
