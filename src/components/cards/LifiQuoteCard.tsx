import CardShell from './CardShell';

type Props = {
  result: Record<string, unknown>;
};

export default function LifiQuoteCard({ result }: Props) {
  const quote = result.quote as Record<string, unknown> | undefined;
  const compose = result.compose as Record<string, unknown> | undefined;
  const status = typeof result.status === 'string' ? result.status : 'preview';

  return (
    <CardShell
      title="LI.FI quote preview"
      tier="read"
      status={status}
      summary="Preview only — no execution"
    >
      {result.error ? <p className="card-copy error">{String(result.error)}</p> : null}
      {quote ? (
        <dl className="field-grid">
          <div>
            <dt>Flow</dt>
            <dd>{String(quote.flowId ?? 'rebalance-sepolia-v1')}</dd>
          </div>
          <div>
            <dt>From amount</dt>
            <dd>{String(quote.fromAmount ?? '—')} (USDC units)</dd>
          </div>
          {quote.toToken ? (
            <div>
              <dt>To token</dt>
              <dd className="mono">{String(quote.toToken)}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      {compose?.userProxy ? (
        <p className="card-copy">
          userProxy: <span className="mono">{String(compose.userProxy)}</span>
        </p>
      ) : null}
      {result.reason ? <p className="card-copy muted">{String(result.reason)}</p> : null}
    </CardShell>
  );
}
