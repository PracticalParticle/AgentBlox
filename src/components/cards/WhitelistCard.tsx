import CardShell from './CardShell';
import { truncateAddress } from '../../lib/format';

type Props = {
  result: Record<string, unknown>;
};

export default function WhitelistCard({ result }: Props) {
  const entries =
    (result.selectors as Array<{
      selector: string;
      label: string;
      addresses: string[];
    }>) ?? [];

  const total = entries.reduce((sum, e) => sum + (e.addresses?.length ?? 0), 0);

  return (
    <CardShell
      title="GuardController whitelist"
      tier="read"
      status="ok"
      summary={`${total} whitelisted target${total === 1 ? '' : 's'}`}
    >
      {result.configured === false ? (
        <p className="card-copy">Treasury not configured.</p>
      ) : (
        entries.map((entry) => (
          <div key={entry.selector} className="whitelist-group">
            <h4>{entry.label}</h4>
            <p className="mono muted">{entry.selector}</p>
            {entry.addresses.length === 0 ? (
              <p className="card-copy muted">No targets whitelisted for this selector.</p>
            ) : (
              <ul className="mono-list">
                {entry.addresses.map((addr) => (
                  <li key={addr}>{truncateAddress(addr)}</li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}
    </CardShell>
  );
}
