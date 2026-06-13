import type { PendingApprovalsResponse } from '../../lib/treasury-api';

import { truncateAddress } from '../../lib/format';

import { getToolDisplayName } from '../../lib/tool-labels';

import type { SessionApproval } from '../../lib/activity';

import LoadingBlock from './LoadingBlock';



type Props = {

  onChain: PendingApprovalsResponse | null;

  sessionApprovals: SessionApproval[];

  loading: boolean;

  onSelectCommand?: (command: string) => void;

};



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

        </article>

      ))}



      {pending.map((row) => (

        <article key={row.txId} className="approval-item on-chain">

          <div className="approval-item-head">

            <strong>Timelock #{row.txId}</strong>

            <span className="status-badge pending">{row.status}</span>

          </div>

          <p className="card-copy mono">{truncateAddress(row.target)}</p>

          {row.releaseTimeIso ? (

            <p className="card-copy muted">Release {row.releaseTimeIso}</p>

          ) : null}

        </article>

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

