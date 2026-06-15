import { describe, expect, it } from 'vitest';
import { formatExecutionError } from './format-execution-error.js';

describe('formatExecutionError', () => {
  it('uses userMessage from SDK enhanced errors', () => {
    expect(
      formatExecutionError({
        userMessage: 'SignerNotAuthorized: Signer 0xabc is not authorized',
      }),
    ).toContain('SignerNotAuthorized');
  });

  it('decodes SignerNotAuthorized revert data', () => {
    expect(
      formatExecutionError({
        originalError: {
          cause: {
            raw: '0x3b94fe24000000000000000000000000a6e822b0343d40b480d509d83e4c13437702e58d',
          },
        },
      }),
    ).toContain('0xa6e822b0343d40b480d509d83e4c13437702e58d');
  });

  it('falls back for unknown errors', () => {
    expect(formatExecutionError(null)).toBe('Broadcaster execution failed');
  });

  it('decodes TargetNotWhitelisted revert data', () => {
    const raw =
      '0x1fe7e0ac0000000000000000000000001c7d4b196cb0c7b01d743fbc6116a902379c7238' +
      '00000000000000000000000000000000000000000000000000000000a9059cbb';
    expect(formatExecutionError({ errorData: raw })).toContain('TargetNotWhitelisted');
  });

  it('decodes InsufficientBalance revert data', () => {
    const raw =
      '0xcf4791810000000000000000000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000004c4b40';
    expect(formatExecutionError({ message: raw })).toContain('InsufficientBalance');
  });

  it('surfaces Dynamic wallet password errors', () => {
    expect(
      formatExecutionError({
        message: 'Password is required for decryption but not provided.',
      }),
    ).toContain('DYNAMIC_WALLET_PASSWORD');
  });
});
