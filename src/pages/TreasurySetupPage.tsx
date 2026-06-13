import { useState } from 'react';

export default function TreasurySetupPage() {
  const [treasuryAddress, setTreasuryAddress] = useState('');
  const [ensName, setEnsName] = useState('');

  return (
    <section className="page">
      <h1>Treasury Setup</h1>
      <p className="lead">
        Import an AccountBlox clone provisioned on{' '}
        <a href="https://bloxchain.app/" target="_blank" rel="noreferrer">
          bloxchain.app
        </a>
        . Configure ENS identity here in AgentBlox.
      </p>
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2>Import Treasury</h2>
        <p style={{ marginBottom: '1rem' }}>
          Paste the AccountBlox clone address from bloxchain.app or Sepolia explorer.
        </p>
        <label>
          Treasury address
          <input
            type="text"
            value={treasuryAddress}
            onChange={(e) => setTreasuryAddress(e.target.value)}
            placeholder="0x..."
            style={{ display: 'block', width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
          />
        </label>
        <label style={{ display: 'block', marginTop: '1rem' }}>
          ENS name (optional)
          <input
            type="text"
            value={ensName}
            onChange={(e) => setEnsName(e.target.value)}
            placeholder="treasury.acme.eth"
            style={{ display: 'block', width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
          />
        </label>
      </div>
    </section>
  );
}
