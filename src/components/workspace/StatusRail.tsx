import { Link } from 'react-router-dom';

import type { ServerHealth } from '../../hooks/useServerHealth';

import type { TreasuryStatusResponse } from '../../lib/treasury-api';

import { truncateAddress } from '../../lib/format';

import { sepoliaAddressUrl } from '../../lib/links';

import LoadingBlock from './LoadingBlock';



type Props = {

  health: ServerHealth | null;

  treasury: TreasuryStatusResponse | null;

  treasuryLoading: boolean;

  demo?: boolean;

};



function integrationDot(ok: boolean | undefined) {

  return ok ? '●' : '○';

}



export default function StatusRail({ health, treasury, treasuryLoading, demo }: Props) {

  const configured = demo || (treasury?.configured ?? health?.treasuryConfigured);



  return (

    <aside className="status-rail">

      {demo ? (

        <section className="rail-section rail-demo-tag">

          <span className="status-badge pending">Demo preview</span>

        </section>

      ) : null}



      <section className="rail-section">

        <h2>Balance</h2>

        {treasuryLoading && !demo ? (

          <LoadingBlock label="Loading treasury…" />

        ) : configured && treasury ? (

          <>

            <p className="rail-balance">{treasury.ethBalance ?? '—'} ETH</p>

            <p className="card-copy muted">Sepolia</p>

            {treasury.address ? (

              <p className="mono muted">

                <a

                  href={sepoliaAddressUrl(treasury.address)}

                  target="_blank"

                  rel="noreferrer"

                  className="etherscan-link"

                >

                  {truncateAddress(treasury.address)}

                </a>

              </p>

            ) : null}

            {treasury.ensName ? <p className="rail-ens">{treasury.ensName}</p> : null}

          </>

        ) : (

          <p className="card-copy">

            Treasury not connected.{' '}

            <Link to="/setup">Complete setup</Link>

          </p>

        )}

      </section>



      <section className="rail-section">

        <h2>Policy</h2>

        <ul className="check-list compact">

          <li>{configured ? '✓' : '○'} Treasury configured</li>

          <li>{health?.agentPolicySigningConfigured ? '✓' : '○'} Agent signing</li>

          <li>{health?.lifiComposeConfigured ? '✓' : '○'} LI.FI compose</li>

        </ul>

      </section>



      <section className="rail-section">

        <h2>Integrations</h2>

        <ul className="integration-stack">

          <li>

            <span>ENS</span>

            <span>{treasury?.ensName ?? 'not set'}</span>

          </li>

          <li>

            <span>Dynamic</span>

            <span>

              {integrationDot(health?.dynamicEnvironmentConfigured)} env{' '}

              {integrationDot(health?.dynamicBroadcasterConfigured)} broadcaster

            </span>

          </li>

          <li>

            <span>LI.FI</span>

            <span>{integrationDot(health?.lifiComposeConfigured)} compose</span>

          </li>

          <li>

            <span>Bloxchain</span>

            <span>{integrationDot(configured)} GuardController</span>

          </li>

        </ul>

      </section>



      <section className="rail-section">

        <h2>Mode</h2>

        <span className={`status-badge ${health?.llmEnabled ? 'completed' : 'pending'}`}>

          {health?.mode ?? 'loading'}

        </span>

      </section>

    </aside>

  );

}

