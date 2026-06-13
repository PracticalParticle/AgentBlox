import { encodeAbiParameters, keccak256, parseAbiParameters, toBytes, type Address, type Hex } from 'viem';

/** Matches GuardControllerDefinitions ERC20_TRANSFER operation type. */
export const ERC20_TRANSFER_OPERATION_TYPE = keccak256(toBytes('ERC20_TRANSFER')) as Hex;

export function encodeErc20TransferParams(recipient: Address, amount: bigint): Hex {
  return encodeAbiParameters(parseAbiParameters('address, uint256'), [recipient, amount]);
}
