import { SEPOLIA_USDC, ANALYST_WALLET_ADDRESS } from '../config.js';

type ExecutionErrorLike = {
  userMessage?: string;
  message?: string;
  shortMessage?: string;
  errorData?: string;
  originalError?: {
    message?: string;
    shortMessage?: string;
    cause?: { raw?: string; signature?: string; message?: string };
    data?: string;
  };
};

const REVERT_HEX_PATTERN = /0x[0-9a-fA-F]{8,}/g;

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

function decodeTargetNotWhitelisted(raw: string | undefined): string | null {
  if (!raw?.startsWith('0x1fe7e0ac') || raw.length < 138) {
    return null;
  }
  const target = `0x${raw.slice(34, 74)}`;
  const selector = `0x${raw.slice(130, 138)}`;
  return (
    `TargetNotWhitelisted: ${target} is not whitelisted for selector ${selector}. ` +
    `Register the function on GuardController and whitelist ${target} (e.g. Sepolia USDC ${SEPOLIA_USDC} for ERC-20 transfer 0xa9059cbb).`
  );
}

function decodeInsufficientBalance(raw: string | undefined): string | null {
  if (!raw?.startsWith('0xcf479181') || raw.length < 138) {
    return null;
  }
  const current = BigInt(`0x${raw.slice(34, 66)}`);
  const required = BigInt(`0x${raw.slice(98, 130)}`);
  return (
    `InsufficientBalance: treasury holds ${current.toString()} base units but this payment needs ${required.toString()}. ` +
    `Fund the treasury with enough Sepolia USDC before broadcasting.`
  );
}

function decodeInvalidNonce(raw: string | undefined): string | null {
  if (!raw?.startsWith('0x06427aeb') || raw.length < 138) {
    return null;
  }
  const provided = BigInt(`0x${raw.slice(34, 66)}`);
  const expected = BigInt(`0x${raw.slice(98, 130)}`);
  return (
    `InvalidNonce: signed meta-tx nonce ${provided.toString()} does not match on-chain ${expected.toString()}. ` +
    'Re-run /pay to sign a fresh meta-tx.'
  );
}

function decodeKnownRevert(raw: string | undefined): string | null {
  return (
    decodeSignerNotAuthorized(raw) ??
    decodeTargetNotWhitelisted(raw) ??
    decodeInsufficientBalance(raw) ??
    decodeInvalidNonce(raw)
  );
}

function extractRevertHexCandidates(error: unknown): string[] {
  const candidates: string[] = [];
  const visit = (value: unknown) => {
    if (typeof value !== 'string' || value.length === 0) {
      return;
    }
    const matches = value.match(REVERT_HEX_PATTERN);
    if (matches) {
      candidates.push(...matches);
    }
  };

  if (error instanceof Error) {
    visit(error.message);
  } else if (error && typeof error === 'object') {
    const e = error as ExecutionErrorLike;
    visit(e.userMessage);
    visit(e.message);
    visit(e.shortMessage);
    visit(e.errorData);
    visit(e.originalError?.message);
    visit(e.originalError?.shortMessage);
    visit(e.originalError?.data);
    visit(e.originalError?.cause?.raw);
    visit(e.originalError?.cause?.signature);
    visit(e.originalError?.cause?.message);
  }

  return [...new Set(candidates)];
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
  if (
    message.includes('Password is required for decryption') ||
    message.includes('DYNAMIC_WALLET_PASSWORD')
  ) {
    return (
      `${message} Set DYNAMIC_WALLET_PASSWORD in .env to the same password used when running ` +
      'npm run docker:ops:create-wallet, then restart the server.'
    );
  }
  if (message.includes('InvalidNonce')) {
    return `${message} Re-run /pay to sign a fresh meta-tx (nonce may have advanced).`;
  }
  if (message.includes('ReadableText') || message.includes('Contract error:')) {
    return (
      `${message} If on-chain preflight passed, this may be a Dynamic wallet signing failure — ` +
      'check server logs for "Password is required for decryption" and set DYNAMIC_WALLET_PASSWORD.'
    );
  }
  return message;
}

export function formatExecutionError(error: unknown): string {
  for (const raw of extractRevertHexCandidates(error)) {
    const decoded = decodeKnownRevert(raw);
    if (decoded) {
      return appendActionableHint(decoded);
    }
  }

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

  const decoded = decodeKnownRevert(raw);
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
