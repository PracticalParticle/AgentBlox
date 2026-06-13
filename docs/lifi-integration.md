# LI.FI Integration

LI.FI **Composer** provides atomic multi-step execution (swap, bridge, deposit). In AgentBlox, Composer is the **only whitelisted external execution target** for Lane A agent flows.

## Official documentation

- Composer overview: https://docs.li.fi/composer/overview
- SDK integration: https://docs.li.fi/composer/guides/sdk-integration
- ETHGlobal NY 2026 guide: https://docs.li.fi/composer/ethglobal-ny-2026
- SDK overview: https://docs.li.fi/sdk/overview
- Agent / MCP: https://docs.li.fi/agents/

## Architecture role

```
Agent Bridge → builds Composer calldata
     ↓
AGENT_POLICY signs meta-tx (target = whitelisted LI.FI executor)
     ↓
Dynamic Broadcaster executes
     ↓
GuardController whitelist check
     ↓
LI.FI Composer runs atomic flow
```

**LI.FI does not enforce policy.** Bloxchain GuardController does. LI.FI only executes what AccountBlox permits.

## Packages

```bash
npm i @lifi/sdk@^4.0.0 @lifi/sdk-provider-ethereum@^4.0.0
```

Already in `package.json` (LI.FI SDK v4 as of June 2026).

## SDK setup

Per current LI.FI docs, use `createClient` (v3 API):

```typescript
import { createClient, getQuote, convertQuoteToRoute, executeRoute } from '@lifi/sdk';
import { EthereumProvider } from '@lifi/sdk-provider-ethereum';

const client = createClient({
  integrator: import.meta.env.VITE_LIFI_INTEGRATOR || 'AgentBlox',
});

client.setProviders([
  EthereumProvider({
    getWalletClient: () => Promise.resolve(walletClient),
  }),
]);
```

Create `src/lib/lifi.ts` for client initialization.

> **Note:** For hackathon Lane A, execution goes through **AccountBlox meta-tx**, not direct `executeRoute` from user wallet. Use LI.FI SDK primarily to **get quotes and transaction calldata**, then embed calldata in Bloxchain meta-tx payload.

## Getting a Composer quote

```typescript
const quote = await getQuote(client, {
  fromChain: 11155111,  // Sepolia chain ID
  toChain: 11155111,
  fromToken: '0x...',   // Sepolia USDC
  toToken: '0x...',     // Target token / vault address
  fromAmount: '1000000',
  fromAddress: treasuryAddress, // AccountBlox clone holds funds
});
```

The `toToken` address triggers Composer routing when it is a supported protocol token.

### Verify Composer route

Check quote response:
- `tool` field should be `"composer"` for Composer routes
- `transactionRequest` contains calldata to embed in meta-tx

## Execution via Bloxchain (not direct SDK execute)

### Recommended hackathon path

1. `getQuote` → extract `transactionRequest.to` and `transactionRequest.data`
2. Whitelist `transactionRequest.to` in GuardController at provisioning
3. Build meta-tx with target = whitelisted LI.FI executor, calldata from quote
4. AGENT_POLICY signs → Broadcaster executes

### Why not direct `executeRoute`?

AccountBlox must mediate all external calls. Direct wallet execution bypasses GuardController and breaks the demo narrative.

### Alternative (simpler MVP)

If meta-tx + Composer calldata integration is blocked:
- Pre-build one fixed Composer flow calldata offline
- Hardcode in `server/flows/rebalance.ts`
- Still whitelist the executor contract on-chain

## Sepolia considerations

- Confirm Composer-supported tokens/contracts on Sepolia testnet
- Pre-simulate quote before demo
- Have fallback: single swap tx if Composer unavailable on Sepolia
- Document tx hashes for submission either way

## Whitelist configuration

At treasury provisioning (bloxchain.app):

| Whitelist entry | Value |
|-----------------|-------|
| Target contract | LI.FI Composer executor address for Sepolia |
| Function selector | Guard execution selector used in meta-tx |
| Optional | Sepolia USDC for approvals in attached payments |

### Attack demo

Build meta-tx targeting **non-whitelisted** contract (e.g. direct `transfer` on USDC to attacker EOA). GuardController reverts `TargetNotWhitelisted`. UI shows blocked state.

## Agent Bridge integration

`server/flows/rebalance.ts`:

```typescript
// 1. Read treasury balances (viem)
// 2. If USDC > threshold → call LI.FI getQuote with fixed params
// 3. Validate flow ID / tool === 'composer' against manifest allowed list
// 4. Return { target, calldata, value } for meta-tx builder
```

`server/flows/simulate-attack.ts`:

```typescript
// Build calldata to non-whitelisted target
// Return expected revert reason for UI
```

## Hardcoded policy (no LLM)

| Rule | Value (configure in env or constants) |
|------|---------------------------------------|
| Rebalance threshold | e.g. USDC > 10 USDC |
| Allowed flow | One fixed `fromToken` → `toToken` pair |
| Max amount | Cap per demo safety |

## Prize alignment

| Track | Requirement |
|-------|-------------|
| Agentic Workflows ($4k) | Composer as execution layer behind agent treasury |
| Most Innovative ($4k) | "Bloxchain-gated Composer" pattern |
| Best UX ($3.5k) | Clear UI for flow status |

## UI requirements

- Show quote summary before execution (from/to tokens, amount)
- Show execution status from `TxRecord` + LI.FI `updateRouteHook` if using SDK polling
- Distinguish success vs `TargetNotWhitelisted` failure

## Environment variables

```env
VITE_LIFI_INTEGRATOR=AgentBlox
```

## Files to implement

| File | Purpose |
|------|---------|
| `src/lib/lifi.ts` | LI.FI client + quote helpers |
| `server/flows/rebalance.ts` | Deterministic rebalance logic |
| `server/flows/simulate-attack.ts` | Non-whitelisted target for demo |
| `src/components/LifiFlowStatus.tsx` | Quote + execution status UI |

## Do not

- Whitelist arbitrary contracts — only specific LI.FI executor + known flow
- Let agent pick any `toToken` without off-chain policy validation
- Execute LI.FI routes directly from browser wallet bypassing AccountBlox

## Partnership pitch

> "LI.FI handles execution complexity; Bloxchain handles authorization constitution. Official Bloxchain-gated Composer pattern with per-treasury allowed Flow IDs."
