import { SEPOLIA_USDC, ANALYST_WALLET_ADDRESS } from '../config.js';

type ExecutionErrorLike = {
  userMessage?: string;
  message?: string;
  shortMessage?: string;
  errorData?: string;
  originalError?: {
    message?: string;
    shortMessage?: string;
    cause?: { raw?: string; signature?: string };
    data?: string;
  };
};

function decodeSignerNotAuthorized(raw: string | undefined): string | null {
  if (!raw?.startsWith('0x3b94fe24') || raw.length < 74) {
    return null;
  }
  const signer = `0x${raw.slice(34, 74)}`;
  return (
    `SignerNotAuthorized: ${signer} is not authorized for this meta-tx. ` +
    `Grant the ANALYST role wallet SIGN_META_REQUEST_AND_APPROVE on **both** selectors: ` +
    `handler requestAndApproveExecution (0xde0df793) and execution ERC-20 transfer (0xa9059cbb). ` +
    `Ensure ANALYST_PRIVATE_KEY matches ${ANALYST_WALLET_ADDRESS}.`
  );
}

function appendActionableHint(message: string): string {
  if (message.includes('SignerNotAuthorized') || message.includes('0x3b94fe24')) {
    return (
      `${message} On-chain fix: ANALYST (${ANALYST_WALLET_ADDRESS}) needs SIGN_META_REQUEST_AND_APPROVE on ` +
      `handler 0xde0df793 and execution 0xa9059cbb; register + whitelist USDC via guardConfigBatch.`
    );
  }
  if (message.includes('TargetNotWhitelisted')) {
    return (
      `${message} Whitelist ${SEPOLIA_USDC} for ERC-20 transfer (0xa9059cbb) on GuardController.`
    );
  }
  if (message.includes('InvalidNonce')) {
    return `${message} Re-run /pay to sign a fresh meta-tx (nonce may have advanced).`;
  }
  return message;
}

export function formatExecutionError(error: unknown): string {
  if (error instanceof Error) {
    return appendActionableHint(error.message);
  }

  if (!error || typeof error !== 'object') {
    return 'Broadcaster execution failed';
  }

  const e = error as ExecutionErrorLike;

  if (typeof e.userMessage === 'string' && e.userMessage.trim().length > 0) {
    return appendActionableHint(e.userMessage);
  }

  const raw =
    e.errorData ??
    e.originalError?.cause?.raw ??
    e.originalError?.data ??
    (typeof e.originalError?.cause?.signature === 'string'
      ? e.originalError.cause.signature
      : undefined);

  const decoded = decodeSignerNotAuthorized(raw);
  if (decoded) {
    return decoded;
  }

  const msg =
    e.shortMessage ??
    e.message ??
    e.originalError?.shortMessage ??
    e.originalError?.message;

  if (typeof msg === 'string' && msg.trim().length > 0) {
    return appendActionableHint(msg);
  }

  return 'Broadcaster execution failed';
}
