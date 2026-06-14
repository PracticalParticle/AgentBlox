import CardShell from './CardShell';

type Props = {
  result: Record<string, unknown>;
};

export default function PolicyBlockedCard({ result }: Props) {
  const policy = result.policy as { reason?: string; code?: string } | undefined;
  const demo = result.demonstration as Record<string, unknown> | undefined;
  const isEnsBlock = policy?.code === 'FLOW_NOT_IN_ENS';

  return (
    <CardShell
      title="Policy enforcement"
      tier="validate"
      status="blocked"
      summary="Blocked by policy — GuardController would revert on-chain"
    >
      <p className="card-copy">{policy?.reason ?? 'This action is not permitted.'}</p>
      {policy?.code ? (
        <p className="card-copy mono muted">Code: {policy.code}</p>
      ) : null}
      {isEnsBlock ? (
        <p className="card-copy muted">
          Update <code>bloxchain.allowedFlows</code> on your ENS name (Console → Link ENS) or align
          the server <code>ENS_NAME</code> with your treasury policy.
        </p>
      ) : null}
      {demo ? (
        <dl className="field-grid">
          <div>
            <dt>Scenario</dt>
            <dd>{String(demo.scenario ?? '—')}</dd>
          </div>
          <div>
            <dt>Expected on-chain</dt>
            <dd>{String(demo.expectedOnChainError ?? 'TargetNotWhitelisted')}</dd>
          </div>
          <div>
            <dt>Layer</dt>
            <dd>{String(demo.bloxchainLayer ?? 'GuardController')}</dd>
          </div>
        </dl>
      ) : null}
    </CardShell>
  );
}
