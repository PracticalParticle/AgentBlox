import {
  WALLET_TRANSFER_AMOUNT_ETH,
  WALLET_TRANSFER_AMOUNT_WEI,
  type WalletTransferDirection,
  walletTransferLabel,
} from '../chat/wallet-transfer-command.js';
import { isTreasuryConfigured, TREASURY_ADDRESS } from '../config.js';

export async function prepareWalletTransfer(direction: WalletTransferDirection) {
  if (!isTreasuryConfigured()) {
    return {
      status: 'rejected',
      direction,
      message: 'Treasury not configured — set TREASURY_ADDRESS in .env.',
    };
  }

  return {
    status: 'ready',
    direction,
    amountEth: WALLET_TRANSFER_AMOUNT_ETH,
    amountWei: WALLET_TRANSFER_AMOUNT_WEI.toString(),
    treasuryAddress: TREASURY_ADDRESS,
    network: 'sepolia',
    label: walletTransferLabel(direction),
    walletAction:
      direction === 'deposit'
        ? 'send_eth_to_treasury'
        : 'execute_with_timelock_native_transfer',
    nextSteps:
      direction === 'deposit'
        ? [
            'Connect your Dynamic wallet in the header.',
            'Confirm below — your wallet sends 0.01 ETH to the treasury (not the agent server key).',
          ]
        : [
            'Connect your Dynamic wallet in the header (Owner role recommended).',
            'Confirm below — your wallet requests a timelock native transfer from treasury to you.',
            'After releaseTime, approve via /pending or the Approvals sidebar.',
          ],
  };
}
