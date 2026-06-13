import { describe, expect, it } from 'vitest';
import { sepoliaAddressUrl, sepoliaTxUrl } from './links';

describe('links', () => {
  it('builds Sepolia tx URL', () => {
    expect(sepoliaTxUrl('0xabc')).toBe('https://sepolia.etherscan.io/tx/0xabc');
  });

  it('builds Sepolia address URL', () => {
    expect(sepoliaAddressUrl('0xdef')).toBe('https://sepolia.etherscan.io/address/0xdef');
  });
});
