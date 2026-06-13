import CardShell from './CardShell';
import { truncateAddress } from '../../lib/format';

type Props = {
  result: Record<string, unknown>;
};

export default function EnsTreasuryCard({ result }: Props) {
  if (result.error) {
    return (
      <CardShell title="ENS treasury" tier="read" status="rejected" summary="ENS not configured">
        <p className="card-copy">{String(result.error)}</p>
      </CardShell>
    );
  }

  const textRecords = result.textRecords as Record<string, string | null> | undefined;
  const matches = result.matchesConfiguredTreasury;

  return (
    <CardShell
      title="ENS treasury"
      tier="read"
      status="ok"
      summary={String(result.name ?? result.normalized ?? 'ENS name')}
    >
      <dl className="field-grid">
        <div>
          <dt>Resolved address</dt>
          <dd className="mono">
            {result.address ? truncateAddress(String(result.address)) : 'Not found'}
          </dd>
        </div>
        <div>
          <dt>Matches treasury</dt>
          <dd>{matches === true ? 'Yes' : matches === false ? 'No' : '—'}</dd>
        </div>
      </dl>
      {textRecords ? (
        <table className="mini-table">
          <tbody>
            {Object.entries(textRecords).map(([key, value]) => (
              <tr key={key}>
                <th>{key}</th>
                <td>{value ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </CardShell>
  );
}
