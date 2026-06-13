const SEPOLIA_ETHERSCAN = 'https://sepolia.etherscan.io';

export function sepoliaTxUrl(hash: string): string {
  return `${SEPOLIA_ETHERSCAN}/tx/${hash}`;
}

export function sepoliaAddressUrl(address: string): string {
  return `${SEPOLIA_ETHERSCAN}/address/${address}`;
}
