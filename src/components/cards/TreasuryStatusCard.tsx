import CardShell from './CardShell';
import { truncateAddress } from '../../lib/format';

type Props = {
  result: Record<string, unknown>;
};

export default function TreasuryStatusCard({ result }: Props) {
  if (result.configured === false) {
    return (
      <CardShell
        title="Treasury status"
        tier="read"
        status="rejected"
        summary="Treasury not configured"
      >
        <p className="card-copy">{String(result.message ?? 'Set TREASURY_ADDRESS in .env')}</p>
      </CardShell>
    );
  }

  const roles = result.roles as Record<string, unknown> | undefined;
  const policy = result.policy as { engine?: string; guard?: string } | undefined;

  return (
    <CardShell
      title="Treasury status"
      tier="read"
      status="ok"
      summary={`${result.ethBalance ?? '—'} ETH on Sepolia`}
    >
      <dl className="field-grid">
        <div>
          <dt>Address</dt>
          <dd className="mono">{truncateAddress(String(result.address ?? ''))}</dd>
        </div>
        {result.ensName ? (
          <div>
            <dt>ENS</dt>
            <dd>{String(result.ensName)}</dd>
          </div>
        ) : null}
        {roles?.owner ? (
          <div>
            <dt>Owner</dt>
            <dd className="mono">{truncateAddress(String(roles.owner))}</dd>
          </div>
        ) : null}
        {Array.isArray(roles?.broadcasters) && roles.broadcasters.length > 0 ? (
          <div>
            <dt>Broadcaster</dt>
            <dd className="mono">{truncateAddress(String(roles.broadcasters[0]))}</dd>
          </div>
        ) : null}
      </dl>
      {policy ? (
        <ul className="policy-chips">
          <li>{policy.engine}</li>
          <li>{policy.guard}</li>
        </ul>
      ) : null}
    </CardShell>
  );
}
