import { useEffect, useState } from 'react';

import type { PendingApprovalsResponse } from '../../lib/treasury-api';

import BroadcasterSubmitBlock from '../broadcaster/BroadcasterSubmitBlock';

import { approveTimelockPayment } from '../../lib/execute-api';

import { truncateAddress } from '../../lib/format';

import { getToolDisplayName } from '../../lib/tool-labels';

import { isDemoMode } from '../../lib/demo-mode';

import { secondsUntilRelease } from '../../lib/owner-guard';

import type { SessionApproval } from '../../lib/activity';

import LoadingBlock from './LoadingBlock';



type Props = {

  onChain: PendingApprovalsResponse | null;

  sessionApprovals: SessionApproval[];

  loading: boolean;

  onSelectCommand?: (command: string) => void;

};



function OnChainPendingRow({

  txId,

  releaseTime,

  releaseTimeIso,

  status,

  target,

}: {

  txId: string;

  releaseTime: string;

  releaseTimeIso: string | null;

  status: string;

  target: string;

}) {

  const demo = isDemoMode();

  const [countdown, setCountdown] = useState(0);



  useEffect(() => {

    const tick = () => setCountdown(secondsUntilRelease(releaseTime));

    tick();

    const id = window.setInterval(tick, 1000);

    return () => window.clearInterval(id);

  }, [releaseTime]);



  return (

    <article className="approval-item on-chain">

      <div className="approval-item-head">

        <strong>Timelock #{txId}</strong>

        <span className="status-badge pending">{status}</span>

      </div>

      <p className="card-copy mono">{truncateAddress(target)}</p>

      {releaseTimeIso ? (

        <p className="card-copy muted">Release {releaseTimeIso}</p>

      ) : null}

      {!demo ? (

        <BroadcasterSubmitBlock

          label="Submit release on-chain (Broadcaster)"

          loadingLabel="Releasing…"

          successMessage="Timelock released on Sepolia via Dynamic Broadcaster"

          disabled={countdown > 0}

          disabledHint={`Timelock ${countdown}s`}

          onSubmit={() => approveTimelockPayment(txId)}

        />

      ) : null}

    </article>

  );

}



export default function ApprovalsPanel({

  onChain,

  sessionApprovals,

  loading,

  onSelectCommand,

}: Props) {

  const pending = onChain?.pending ?? [];

  const hasSession = sessionApprovals.length > 0;

  const hasOnChain = pending.length > 0;



  return (

    <section className="approvals-panel">

      <h2>Approvals</h2>

      {loading ? <LoadingBlock label="Loading on-chain pending…" /> : null}



      {!loading && !hasOnChain && !hasSession ? (

        <p className="card-copy muted">No pending approvals.</p>

      ) : null}



      {sessionApprovals.map((item) => (

        <article key={item.id} className="approval-item session">

          <div className="approval-item-head">

            <strong>{getToolDisplayName(item.tool)}</strong>

            <span className={`status-badge ${item.statusColor}`}>{item.statusLabel}</span>

          </div>

          <p className="card-copy">{item.summary}</p>

          <p className="card-copy muted">

            Submit from the tool card in chat when signed meta-tx is ready.

          </p>

        </article>

      ))}



      {pending.map((row) => (

        <OnChainPendingRow

          key={row.txId}

          txId={row.txId}

          releaseTime={row.releaseTime}

          releaseTimeIso={row.releaseTimeIso}

          status={row.status}

          target={row.target}

        />

      ))}



      {onSelectCommand ? (

        <div className="approval-quick">

          <button type="button" className="suggestion-chip" onClick={() => onSelectCommand('/pending')}>

            Refresh pending

          </button>

        </div>

      ) : null}

    </section>

  );

}
