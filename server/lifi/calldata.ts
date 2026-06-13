import type { Hex } from 'viem';

/** Split full proxy calldata into GuardController executionSelector + executionParams. */
export function splitExecutionCalldata(calldata: Hex): {
  executionSelector: Hex;
  executionParams: Hex;
} {
  if (!calldata.startsWith('0x') || calldata.length < 10) {
    throw new Error('Invalid compose calldata');
  }

  const executionSelector = calldata.slice(0, 10) as Hex;
  const paramsBody = calldata.slice(10);
  const executionParams = (paramsBody.length > 0 ? `0x${paramsBody}` : '0x') as Hex;

  return { executionSelector, executionParams };
}
