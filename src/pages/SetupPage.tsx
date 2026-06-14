import { Link } from 'react-router-dom';

import { BLOXCHAIN_SEPOLIA } from '../lib/config';

import { useBroadcasterVerify } from '../hooks/useBroadcasterVerify';

import { useServerHealth } from '../hooks/useServerHealth';

import { truncateAddress } from '../lib/format';



export default function SetupPage() {

  const { health } = useServerHealth();

  const { verifyResult, wallets, loading, error, runVerify, loadWallets } = useBroadcasterVerify();



  const broadcasterReady =

    health?.dynamicBroadcasterConfigured && health.broadcaster?.matchesOnChainBroadcaster !== false;



  return (

    <section className="page setup-page">

      <h1>Setup</h1>

      <p className="lead">

        Connect your AccountBlox treasury on Sepolia. Provision via{' '}

        <a href="https://bloxchain.app/" target="_blank" rel="noreferrer">

          bloxchain.app

        </a>

        , then configure <code>.env</code>. See{' '}

        <a href="https://github.com/PracticalParticle/AgentBlox/blob/main/docs/getting-started.md">

          getting-started

        </a>{' '}

        for the full checklist.

      </p>



      <p className="card-copy muted">

        Judge preview without full env:{' '}

        <Link to="/?demo=1" className="primary-link">

          Open demo workspace (?demo=1)

        </Link>

      </p>



      <ol className="setup-steps">

        <li className={health?.dynamicEnvironmentConfigured ? 'done' : ''}>

          <strong>Dynamic</strong> — set <code>VITE_DYNAMIC_ENVIRONMENT_ID</code> in .env

        </li>

        <li className={health?.treasuryConfigured ? 'done' : ''}>

          <strong>Treasury</strong> — set <code>TREASURY_ADDRESS</code> to your AccountBlox clone

        </li>

        <li className={broadcasterReady ? 'done' : ''}>

          <strong>Broadcaster</strong> — <code>DYNAMIC_API_TOKEN</code> +{' '}

          <code>BROADCASTER_WALLET_ADDRESS</code>

        </li>

        <li className={health?.agentPolicySigningConfigured ? 'done' : ''}>

          <strong>Agent policy</strong> — <code>AGENT_POLICY_PRIVATE_KEY</code>

        </li>

        <li className={health?.lifiComposeConfigured ? 'done' : ''}>

          <strong>LI.FI Composer</strong> — server compose wired
          {health?.lifiApiKeyConfigured ? (
            <> (<code>LIFI_API_KEY</code> set)</>
          ) : (
            <> (optional <code>LIFI_API_KEY</code> for rate limits)</>
          )}

        </li>

        <li className={health?.analystConfigured ? 'done' : ''}>
          <strong>Analyst</strong> — <code>ANALYST_PRIVATE_KEY</code> for B-timelock /pay
        </li>
        <li className={health?.approverConfigured ? 'done' : ''}>
          <strong>Approver</strong> — <code>APPROVER_PRIVATE_KEY</code> for B-fast + timelock approve
        </li>
        <li className={health?.ensConfigured ? 'done' : ''}>
          <strong>ENS</strong> — <code>ENS_NAME</code> + mainnet <code>bloxchain.*</code> text records
        </li>

      </ol>



      <article className="card setup-broadcaster-card">

        <h2>Dynamic Broadcaster</h2>

        <p className="card-copy">

          The Broadcaster submits signed meta-txs after AGENT_POLICY signs. Server-only secrets —

          never use <code>VITE_</code> prefix.

        </p>

        <ol className="setup-substeps">
          <li>
            Dynamic dashboard → <strong>Developer → API</strong> → token with{' '}
            <strong>WaaS Authenticate</strong> + <strong>Environment Users Read/Write</strong>.
          </li>
          <li>
            Set <code>DYNAMIC_API_TOKEN</code> in <code>.env</code>, then run{' '}
            <code>npm run docker:ops:create-wallet</code> (Windows/Docker) or{' '}
            <code>npm run create:broadcaster-wallet</code> (writes gitignored{' '}
            <code>data/dynamic-server-wallet.json</code>).
          </li>
          <li>
            Set <code>BROADCASTER_WALLET_ADDRESS</code> from that file — must match on-chain Broadcaster
            role.
          </li>
          <li>Run verify below — connected wallet and on-chain match.</li>
        </ol>



        <div className="setup-actions">

          <button type="button" className="primary" disabled={loading} onClick={() => void loadWallets()}>

            {loading ? 'Loading…' : 'List server wallets'}

          </button>

          <button type="button" className="suggestion-chip" disabled={loading} onClick={() => void runVerify()}>

            Test Broadcaster connection

          </button>

        </div>



        {error ? <p className="tool-card-feedback error">{error}</p> : null}



        {wallets?.ok && wallets.wallets.length > 0 ? (

          <ul className="console-list mono">

            {wallets.wallets.map((wallet) => (

              <li key={wallet.address}>

                {wallet.address}

                {wallet.name ? ` (${wallet.name})` : ''}

              </li>

            ))}

          </ul>

        ) : wallets && !wallets.ok ? (

          <p className="card-copy muted">{wallets.error ?? 'Could not list wallets'}</p>

        ) : null}



        {verifyResult ? (

          <div className={`verify-result ${verifyResult.ok ? 'ok' : 'error'}`}>

            <p>

              Connection: {verifyResult.ok ? 'OK' : 'Failed'}

              {verifyResult.walletAddress ? (

                <> · wallet {truncateAddress(verifyResult.walletAddress)}</>

              ) : null}

            </p>

            <p className="card-copy muted">{verifyResult.status.message}</p>

            {verifyResult.status.onChainBroadcasters.length > 0 ? (

              <p className="card-copy mono">

                On-chain Broadcaster: {verifyResult.status.onChainBroadcasters.map(truncateAddress).join(', ')}

              </p>

            ) : null}

            {verifyResult.error ? <p className="tool-card-feedback error">{verifyResult.error}</p> : null}

          </div>

        ) : null}



        <p className="card-copy muted">
          CLI: <code>npm run docker:ops:create-wallet</code> ·{' '}
          <code>npm run docker:ops:verify</code>
        </p>

      </article>



      <div className="card-grid">

        <article className="card">

          <h2>Server status</h2>

          <ul className="console-list">

            <li>Mode: {health?.mode ?? '…'}</li>

            <li>Treasury: {health?.treasuryConfigured ? 'configured' : 'missing'}</li>

            <li>Dynamic env: {health?.dynamicEnvironmentConfigured ? 'ok' : 'missing'}</li>

            <li>

              Broadcaster:{' '}

              {broadcasterReady

                ? 'ready'

                : health?.broadcaster?.message ?? 'not configured'}

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

      </div>



      {health?.treasuryConfigured ? (

        <p className="setup-ready">

          Treasury is configured.{' '}

          <Link to="/" className="primary-link">

            Open Workspace →

          </Link>

        </p>

      ) : (

        <p className="card-copy muted">

          After setting <code>TREASURY_ADDRESS</code>, restart <code>npm run dev:all</code> and

          return here.

        </p>

      )}

    </section>

  );

}

