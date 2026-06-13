export default function DashboardPage() {
  return (
    <section className="page">
      <h1>Treasury Dashboard</h1>
      <p className="lead">
        Monitor pending approvals, transaction history, and ENS-resolved treasury
        identity. Connect your Dynamic wallet to approve Lane B payments.
      </p>
      <div className="card-grid">
        <article className="card">
          <h2>Lane A — Agentic</h2>
          <p>Meta-tx proposals signed by AGENT_POLICY, executed by Dynamic Broadcaster.</p>
          <span className="status-badge pending">Implementation pending</span>
        </article>
        <article className="card">
          <h2>Lane B — Fintech</h2>
          <p>Timelock payment requests with CFO approval and TxRecord audit trail.</p>
          <span className="status-badge pending">Implementation pending</span>
        </article>
        <article className="card">
          <h2>ENS Identity</h2>
          <p>Resolve treasury name to AccountBlox clone and read policy text records.</p>
          <span className="status-badge pending">Implementation pending</span>
        </article>
      </div>
    </section>
  );
}
