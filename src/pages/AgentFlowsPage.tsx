export default function AgentFlowsPage() {
  return (
    <section className="page">
      <h1>Agent Flows</h1>
      <p className="lead">
        Deterministic policy flows for the hackathon demo. No LLM — hardcoded rules
        with an agent-ready API for future Hermes/OpenClaw integration.
      </p>
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2>Rebalance (policy execution / meta-tx)</h2>
        <p>
          Triggers a whitelisted LI.FI Composer flow via AGENT_POLICY signature and
          Dynamic Broadcaster execution.
        </p>
        <div className="flow-actions">
          <button className="primary" type="button" disabled>
            Run Rebalance
          </button>
          <button className="danger" type="button" disabled>
            Simulate Attack (blocked)
          </button>
        </div>
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <h2>Vendor payment (timelock)</h2>
        <p>Request a USDC payment that enters PENDING until Owner approves.</p>
        <div className="flow-actions">
          <button type="button" disabled>
            Request Payment
          </button>
        </div>
      </div>
    </section>
  );
}
