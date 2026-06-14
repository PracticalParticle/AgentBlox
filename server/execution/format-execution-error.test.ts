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
});
