import { useEffect, useState } from 'react';
import EnsLinkWizard from '../components/ens/EnsLinkWizard';
import { BLOXCHAIN_SEPOLIA } from '../lib/config';
import { useServerHealth } from '../hooks/useServerHealth';
import { useEnsTreasury } from '../hooks/useEnsTreasury';
import {
  loadStoredTreasuryReference,
  saveStoredTreasuryReference,
} from '../lib/treasury-storage';

export default function ConsolePage() {
  const { health } = useServerHealth();
  const [treasuryAddress, setTreasuryAddress] = useState('');
  const [ensName, setEnsName] = useState('');
  const lookupName = ensName.trim() || null;
  const { data: ensData, loading: ensLoading, error: ensError, refresh: refreshEns } =
    useEnsTreasury(lookupName);

  useEffect(() => {
    const stored = loadStoredTreasuryReference();
    setTreasuryAddress(stored.treasuryAddress);
    setEnsName(stored.ensName);
  }, []);

  useEffect(() => {
    saveStoredTreasuryReference({ treasuryAddress, ensName });
  }, [treasuryAddress, ensName]);

  return (
    <section className="page">
      <h1>Console</h1>
      <p className="lead">
        Configure and inspect your treasury. Provision AccountBlox clones on{' '}
        <a href="https://bloxchain.app/" target="_blank" rel="noreferrer">
          bloxchain.app
        </a>
        , then import here. Day-to-day operations happen in{' '}
        <a href="/">Copilot</a>.
      </p>

      <div className="card-grid">
        <article className="card">
          <h2>Server status</h2>
          <ul className="console-list">
            <li>Mode: {health?.mode ?? '…'}</li>
            <li>LLM: {health?.llmEnabled ? 'enabled' : 'fallback slash commands'}</li>
            <li>Treasury: {health?.treasuryConfigured ? 'configured' : 'set TREASURY_ADDRESS in .env'}</li>
            <li>ENS: {health?.ensConfigured ? 'configured' : 'set ENS_NAME in .env'}</li>
            <li>Dynamic env: {health?.dynamicEnvironmentConfigured ? 'configured' : 'set VITE_DYNAMIC_ENVIRONMENT_ID'}</li>
            <li>
              Analyst (/pay):{' '}
              {health?.analystConfigured ? 'configured' : 'set ANALYST_PRIVATE_KEY (Phase 5)'}
            </li>
            <li>
              Broadcaster:{' '}
              {health?.dynamicBroadcasterConfigured
                ? 'ready'
                : health?.broadcaster?.message ?? 'Phase 2 — see .env.example'}
            </li>
          </ul>
        </article>

        <article className="card">
          <h2>Bloxchain Sepolia</h2>
          <ul className="console-list mono">
            <li>AccountBlox: {BLOXCHAIN_SEPOLIA.accountBloxTemplate}</li>
            <li>CopyBlox: {BLOXCHAIN_SEPOLIA.copyBlox}</li>
            <li>EngineBlox: {BLOXCHAIN_SEPOLIA.engineBlox}</li>
          </ul>
        </article>

        <article className="card">
          <h2>Role model</h2>
          <ul className="console-list">
            <li>Owner → Dynamic embedded wallet</li>
            <li>Broadcaster → Dynamic server wallet</li>
            <li>AGENT_POLICY → AgentBlox server (sign only)</li>
            <li>GuardController → LI.FI whitelist</li>
          </ul>
        </article>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2>Treasury import (local reference)</h2>
        <p>
          Set <code>TREASURY_ADDRESS</code> and <code>ENS_NAME</code> in <code>.env</code> for the
          server. Fields below persist in this browser for operator notes.
        </p>
        <label>
          Treasury address
          <input
            type="text"
            value={treasuryAddress}
            onChange={(e) => setTreasuryAddress(e.target.value)}
            placeholder="0x..."
            className="ens-wizard-input"
          />
        </label>
        <label style={{ display: 'block', marginTop: '1rem' }}>
          ENS name
          <input
            type="text"
            value={ensName}
            onChange={(e) => setEnsName(e.target.value)}
            placeholder="treasury.acme.eth"
            className="ens-wizard-input"
          />
        </label>
        <div style={{ marginTop: '1rem' }}>
          <button type="button" className="suggestion-chip" disabled={!lookupName || ensLoading} onClick={() => void refreshEns()}>
            {ensLoading ? 'Resolving…' : 'Resolve ENS'}
          </button>
        </div>
        {ensError ? <p className="tool-card-feedback error">{ensError}</p> : null}
        {ensData && !ensData.error ? (
          <ul className="console-list mono" style={{ marginTop: '1rem' }}>
            <li>Address: {ensData.address ?? 'not set'}</li>
            <li>Policy: {ensData.textRecords?.policyVersion ?? '—'}</li>
            <li>Flows: {ensData.textRecords?.allowedFlows ?? '—'}</li>
            <li>
              Matches .env treasury:{' '}
              {ensData.matchesConfiguredTreasury === true
                ? 'yes'
                : ensData.matchesConfiguredTreasury === false
                  ? 'no — fix addr record'
                  : '—'}
            </li>
          </ul>
        ) : null}
      </div>

      <article className="card ens-link-card">
        <h2>Link ENS (mainnet write)</h2>
        <EnsLinkWizard
          ensName={ensName}
          treasuryAddress={treasuryAddress}
          onEnsNameChange={setEnsName}
          onTreasuryAddressChange={setTreasuryAddress}
        />
      </article>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2>Environment checklist</h2>
        <ul className="console-list">
          <li><code>VITE_DYNAMIC_ENVIRONMENT_ID</code> — Dynamic dashboard</li>
          <li><code>TREASURY_ADDRESS</code> — AccountBlox clone from bloxchain.app</li>
          <li><code>ENS_NAME</code> — mainnet resolver + bloxchain.* text records</li>
          <li><code>OPENAI_API_KEY</code> — optional, enables natural language Copilot</li>
          <li><code>AGENT_POLICY_PRIVATE_KEY</code> — server signing (Phase 3)</li>
        </ul>
      </div>
    </section>
  );
}
