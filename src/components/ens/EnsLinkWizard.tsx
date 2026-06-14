import { useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isAddress, type Address } from 'viem';
import {
  buildEnsTextRecords,
  DEFAULT_ENS_ALLOWED_FLOWS,
  DEFAULT_ENS_APP,
  DEFAULT_ENS_POLICY_VERSION,
  writeEnsTreasuryRecords,
  type EnsWriteProgress,
} from '../../lib/ens-write';
import { isDynamicEnvironmentConfigured } from '../../lib/dynamic-config';
import { mainnetTxUrl } from '../../lib/links';
import { truncateAddress } from '../../lib/format';
import { ENS_TEXT_KEYS } from '../../lib/config';

type Props = {
  ensName: string;
  treasuryAddress: string;
  onEnsNameChange: (value: string) => void;
  onTreasuryAddressChange: (value: string) => void;
  compact?: boolean;
};

export default function EnsLinkWizard({
  ensName,
  treasuryAddress,
  onEnsNameChange,
  onTreasuryAddressChange,
  compact,
}: Props) {
  const { primaryWallet } = useDynamicContext();
  const [policyVersion, setPolicyVersion] = useState(DEFAULT_ENS_POLICY_VERSION);
  const [allowedFlows, setAllowedFlows] = useState(DEFAULT_ENS_ALLOWED_FLOWS);
  const [app, setApp] = useState(DEFAULT_ENS_APP);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<EnsWriteProgress[]>([]);
  const [outcome, setOutcome] = useState<{ ok: boolean; message: string } | null>(null);

  const dynamicReady = isDynamicEnvironmentConfigured();
  const walletConnected = Boolean(primaryWallet?.address);
  const treasuryValid = isAddress(treasuryAddress);
  const ensValid = ensName.trim().endsWith('.eth');
  const canPublish = dynamicReady && walletConnected && treasuryValid && ensValid && !busy;

  const previewRecords = buildEnsTextRecords({
    ensName: ensName.trim(),
    treasuryAddress: treasuryAddress as Address,
    policyVersion,
    allowedFlows,
    app,
  });

  async function handlePublish() {
    if (!canPublish) return;

    setBusy(true);
    setProgress([]);
    setOutcome(null);

    const result = await writeEnsTreasuryRecords({
      wallet: primaryWallet,
      records: {
        ensName: ensName.trim(),
        treasuryAddress: treasuryAddress as Address,
        policyVersion,
        allowedFlows,
        app,
      },
      onProgress: (step) => setProgress((prev) => [...prev, step]),
    });

    setBusy(false);

    if (result.ok) {
      setOutcome({
        ok: true,
        message: `Published ${result.hashes.length} mainnet transaction(s). Set ENS_NAME=${ensName.trim()} in .env and restart the server.`,
      });
      return;
    }

    setOutcome({ ok: false, message: result.reason });
  }

  return (
    <div className={compact ? 'ens-link-wizard compact' : 'ens-link-wizard'}>
      {!compact ? (
        <p className="card-copy">
          Publish treasury address and <code>bloxchain.*</code> text records on Ethereum mainnet.
          Your connected Dynamic wallet must own the ENS name. Gas is paid on mainnet; treasury stays
          on Sepolia.
        </p>
      ) : null}

      <label>
        ENS name
        <input
          type="text"
          value={ensName}
          onChange={(e) => onEnsNameChange(e.target.value)}
          placeholder="treasury.acme.eth"
          className="ens-wizard-input"
        />
      </label>

      <label>
        Treasury address (Sepolia AccountBlox)
        <input
          type="text"
          value={treasuryAddress}
          onChange={(e) => onTreasuryAddressChange(e.target.value)}
          placeholder="0x..."
          className="ens-wizard-input"
        />
      </label>

      <div className="ens-wizard-row">
        <label>
          Policy version
          <input
            type="text"
            value={policyVersion}
            onChange={(e) => setPolicyVersion(e.target.value)}
            className="ens-wizard-input"
          />
        </label>
        <label>
          Allowed flows
          <input
            type="text"
            value={allowedFlows}
            onChange={(e) => setAllowedFlows(e.target.value)}
            placeholder="rebalance-sepolia-v1"
            className="ens-wizard-input"
          />
        </label>
        <label>
          App
          <input
            type="text"
            value={app}
            onChange={(e) => setApp(e.target.value)}
            className="ens-wizard-input"
          />
        </label>
      </div>

      <section className="ens-wizard-preview">
        <h3>Preview</h3>
        <dl className="field-grid">
          <div>
            <dt>setAddr</dt>
            <dd className="mono">{treasuryValid ? truncateAddress(treasuryAddress) : '—'}</dd>
          </div>
        </dl>
        <table className="mini-table">
          <tbody>
            {Object.entries(previewRecords).map(([key, value]) => (
              <tr key={key}>
                <th>{key}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="ens-wizard-actions">
        <button type="button" className="primary" disabled={!canPublish} onClick={() => void handlePublish()}>
          {busy ? 'Publishing…' : 'Publish to ENS (mainnet)'}
        </button>
        <a
          href={`https://app.ens.domains/${encodeURIComponent(ensName.trim() || 'name')}`}
          target="_blank"
          rel="noreferrer"
          className="suggestion-chip ens-wizard-link"
        >
          Open ENS manager
        </a>
      </div>

      {!dynamicReady ? (
        <p className="card-copy muted">Set VITE_DYNAMIC_ENVIRONMENT_ID to enable ENS writes.</p>
      ) : null}
      {dynamicReady && !walletConnected ? (
        <p className="card-copy muted">Connect your Owner wallet (Dynamic widget) to sign mainnet txs.</p>
      ) : null}

      {progress.length > 0 ? (
        <ul className="console-list mono ens-wizard-progress">
          {progress.map((step) => (
            <li key={`${step.step}-${step.hash ?? 'pending'}`}>
              {step.step}
              {step.hash ? (
                <>
                  {' '}
                  ·{' '}
                  <a href={mainnetTxUrl(step.hash)} target="_blank" rel="noreferrer" className="etherscan-link">
                    {truncateAddress(step.hash)}
                  </a>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {outcome ? (
        <p className={`tool-card-feedback ${outcome.ok ? 'ok' : 'error'}`}>{outcome.message}</p>
      ) : null}

      <p className="card-copy muted">
        Text keys: {ENS_TEXT_KEYS.policyVersion}, {ENS_TEXT_KEYS.allowedFlows}, {ENS_TEXT_KEYS.app}
      </p>
    </div>
  );
}
