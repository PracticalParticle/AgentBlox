import CardShell from './CardShell';
import { parseEnsAllowedFlows } from '../../lib/ens-parse';
import { truncateAddress } from '../../lib/format';

type Props = {
  result: Record<string, unknown>;
};

function ensManagerUrl(name: string): string {
  return `https://app.ens.domains/${encodeURIComponent(name)}`;
}

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
  const parsedFlows = Array.isArray(result.parsedAllowedFlows)
    ? (result.parsedAllowedFlows as string[])
    : parseEnsAllowedFlows(textRecords?.allowedFlows);
  const displayName = String(result.name ?? result.normalized ?? 'ENS name');
  const mismatch = matches === false;

  return (
    <CardShell
      title="ENS treasury"
      tier="read"
      status={mismatch ? 'blocked' : 'ok'}
      summary={displayName}
    >
      {mismatch ? (
        <p className="tool-card-feedback error">
          Resolved address does not match <code>TREASURY_ADDRESS</code> in .env. Update the ENS{' '}
          <code>addr</code> record or fix server config.
        </p>
      ) : null}

      <dl className="field-grid">
        <div>
          <dt>Resolved address</dt>
          <dd className="mono">
            {result.address ? truncateAddress(String(result.address)) : 'Not set'}
          </dd>
        </div>
        <div>
          <dt>Matches treasury</dt>
          <dd>{matches === true ? 'Yes' : matches === false ? 'No' : '—'}</dd>
        </div>
        <div>
          <dt>Policy version</dt>
          <dd>{textRecords?.policyVersion ?? '—'}</dd>
        </div>
        <div>
          <dt>App</dt>
          <dd>{textRecords?.app ?? '—'}</dd>
        </div>
      </dl>

      {parsedFlows.length > 0 ? (
        <section className="intent-section">
          <h4>Allowed flows (ENS policy)</h4>
          <div className="flow-chip-row">
            {parsedFlows.map((flow) => (
              <span key={flow} className="suggestion-chip flow-chip">
                {flow}
              </span>
            ))}
          </div>
          <p className="card-copy muted">
            Rebalance and other ops must use a flow ID listed here when ENS is configured.
          </p>
        </section>
      ) : (
        <p className="card-copy muted">
          No <code>bloxchain.allowedFlows</code> text record — server policy allowlist only.
        </p>
      )}

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

      <p className="card-copy">
        <a href={ensManagerUrl(displayName)} target="_blank" rel="noreferrer" className="primary-link">
          Manage on app.ens.domains
        </a>
        {' · '}
        <a href="/console" className="primary-link">
          Link ENS in Console
        </a>
      </p>
    </CardShell>
  );
}
