import { useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import type { Address } from 'viem';
import { isDynamicEnvironmentConfigured } from '../../lib/dynamic-config';
import { truncateAddress } from '../../lib/format';
import {
  executeWalletDeposit,
  executeWalletWithdrawRequest,
} from '../../lib/wallet-transfer-eth';
import CardShell from './CardShell';

type Props = {
  result: Record<string, unknown>;
};

export default function WalletTransferCard({ result }: Props) {
  const { primaryWallet } = useDynamicContext();
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<{ ok: boolean; message: string; hash?: string } | null>(
    null,
  );

  const direction = result.direction === 'withdraw' ? 'withdraw' : 'deposit';
  const amountEth = typeof result.amountEth === 'string' ? result.amountEth : '0.01';
  const treasuryAddress = typeof result.treasuryAddress === 'string' ? result.treasuryAddress : '';
  const status = typeof result.status === 'string' ? result.status : 'ready';
  const nextSteps = Array.isArray(result.nextSteps) ? (result.nextSteps as string[]) : [];

  async function handleConfirm() {
    if (!treasuryAddress || busy) return;

    setBusy(true);
    setOutcome(null);

    const execution =
      direction === 'deposit'
        ? await executeWalletDeposit({
            wallet: primaryWallet,
            treasuryAddress: treasuryAddress as Address,
            amountEth,
          })
        : await executeWalletWithdrawRequest({
            wallet: primaryWallet,
            treasuryAddress: treasuryAddress as Address,
            amountEth,
          });

    setBusy(false);

    if (execution.ok) {
      setOutcome({
        ok: true,
        hash: execution.hash,
        message:
          direction === 'deposit'
            ? `Sent ${amountEth} ETH to treasury.`
            : `Timelock withdraw requested (${amountEth} ETH). Check /pending when releaseTime passes.`,
      });
      return;
    }

    setOutcome({ ok: false, message: execution.reason });
  }

  if (status === 'rejected') {
    return (
      <CardShell
        title={direction === 'deposit' ? 'Deposit ETH' : 'Withdraw ETH'}
        tier="execute"
        status="blocked"
        summary={String(result.message ?? 'Treasury not configured.')}
      />
    );
  }

  const dynamicReady = isDynamicEnvironmentConfigured();
  const walletConnected = Boolean(primaryWallet?.address);
  const canConfirm = dynamicReady && walletConnected && !busy;

  return (
    <CardShell
      title={direction === 'deposit' ? 'Deposit ETH' : 'Withdraw ETH'}
      tier="execute"
      status="ready"
      summary={
        direction === 'deposit'
          ? `${amountEth} ETH · your Dynamic wallet → treasury`
          : `${amountEth} ETH · treasury → your wallet (timelock request)`
      }
      footer={
        <>
          {!dynamicReady ? (
            <p className="card-copy muted">Set VITE_DYNAMIC_ENVIRONMENT_ID to enable wallet actions.</p>
          ) : null}
          <div className="tool-card-actions">
            <button
              type="button"
              className="primary"
              disabled={!canConfirm}
              onClick={() => void handleConfirm()}
            >
              {busy
                ? 'Confirming…'
                : direction === 'deposit'
                  ? `Send ${amountEth} ETH to treasury`
                  : `Request ${amountEth} ETH withdraw`}
            </button>
          </div>
          {outcome ? (
            <p className={`card-copy tool-card-feedback ${outcome.ok ? 'success' : 'error'}`}>
              {outcome.message}
              {outcome.hash ? (
                <>
                  {' '}
                  <a
                    href={`https://sepolia.etherscan.io/tx/${outcome.hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View tx
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
        </>
      }
    >
      <p className="card-copy">
        Treasury: <span className="mono">{truncateAddress(treasuryAddress)}</span>
      </p>
      <p className="card-copy">
        Connected wallet:{' '}
        {walletConnected ? (
          <span className="mono">{truncateAddress(primaryWallet!.address)}</span>
        ) : (
          'Connect via Dynamic in the header'
        )}
      </p>
      <p className="card-copy muted">Uses your connected wallet — not the agent server keys.</p>
      {nextSteps.length > 0 ? (
        <ul className="card-copy">
          {nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      ) : null}
    </CardShell>
  );
}
