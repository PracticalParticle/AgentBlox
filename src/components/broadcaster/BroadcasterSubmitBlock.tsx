import { useState } from 'react';
import { useBroadcasterReady } from '../../hooks/useBroadcasterReady';
import type { ExecuteResponse } from '../../lib/execute-api';
import { sepoliaTxUrl } from '../../lib/links';
import { truncateAddress } from '../../lib/format';

type Props = {
  label?: string;
  loadingLabel?: string;
  successMessage?: string;
  disabled?: boolean;
  disabledHint?: string;
  className?: string;
  onSubmit: () => Promise<ExecuteResponse>;
};

export default function BroadcasterSubmitBlock({
  label = 'Submit on-chain (Broadcaster)',
  loadingLabel = 'Submitting…',
  successMessage = 'Submitted on Sepolia via Dynamic Broadcaster',
  disabled = false,
  disabledHint,
  className = 'card-cta',
  onSubmit,
}: Props) {
  const { loading: healthLoading, ready, notReadyMessage, walletAddress } = useBroadcasterReady();
  const [executing, setExecuting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string; hash?: string } | null>(
    null,
  );

  const blocked = healthLoading || !ready || disabled;
  const buttonLabel = executing ? loadingLabel : disabled && disabledHint ? disabledHint : label;

  async function handleClick() {
    if (blocked || executing) return;
    setExecuting(true);
    setFeedback(null);
    try {
      const response = await onSubmit();
      setFeedback(
        response.ok
          ? { ok: true, message: successMessage, hash: response.hash }
          : { ok: false, message: response.reason },
      );
    } catch (error) {
      setFeedback({
        ok: false,
        message: error instanceof Error ? error.message : 'Broadcaster submit failed',
      });
    } finally {
      setExecuting(false);
    }
  }

  return (
    <>
      <button type="button" className={className} disabled={blocked || executing} onClick={handleClick}>
        {buttonLabel}
      </button>
      {!healthLoading && !ready ? (
        <p className="card-copy muted">{notReadyMessage}</p>
      ) : null}
      {ready && walletAddress ? (
        <p className="card-copy muted">
          Dynamic server wallet: <span className="mono">{truncateAddress(walletAddress)}</span>
        </p>
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
    </>
  );
}
