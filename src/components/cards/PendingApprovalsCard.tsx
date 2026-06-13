import CardShell from './CardShell';
import { truncateAddress } from '../../lib/format';

type Props = {
  result: Record<string, unknown>;
};

export default function PendingApprovalsCard({ result }: Props) {
  const pending = (result.pending as Array<Record<string, unknown>>) ?? [];
  const count = typeof result.count === 'number' ? result.count : pending.length;

  return (
    <CardShell
      title="Pending approvals"
      tier="read"
      status={count > 0 ? 'requested' : 'ok'}
      summary={count > 0 ? `${count} on-chain pending` : 'No pending approvals'}
    >
      {result.error ? <p className="card-copy error">{String(result.error)}</p> : null}
      {pending.length === 0 ? (
        <p className="card-copy muted">No pending TxRecords on-chain.</p>
      ) : (
        <ul className="approval-list">
          {pending.map((row) => (
            <li key={String(row.txId)}>
              <span className="approval-type">Tx #{String(row.txId)}</span>
              <span className="approval-meta">{String(row.status)}</span>
              <span className="mono">{truncateAddress(String(row.target ?? ''))}</span>
              {row.releaseTimeIso ? (
                <span className="approval-meta">Release {String(row.releaseTimeIso)}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  );
}
