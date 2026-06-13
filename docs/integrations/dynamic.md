# Dynamic Integration

**Audience:** Developers configuring Owner and Broadcaster wallets.  
**Prerequisites:** Dynamic dashboard + Sepolia — [env-configuration.md](../env-configuration.md).  
**See also:** [provisioning-checklist.md](../provisioning-checklist.md) Part A2 · [env-configuration.md](../env-configuration.md) · [on-chain-execution-flow.md](../on-chain-execution-flow.md) · [event/ethglobal-2026.md](../event/ethglobal-2026.md)

Dynamic provides **two wallet surfaces** in AgentBlox:

| Wallet | AccountBlox role | Usage |
|--------|------------------|-------|
| **Embedded wallet** | Owner (human) | Timelock approvals, governance changes |
| **Server wallet** | Broadcaster | Policy execution (meta-tx submit) |

---

## Official documentation

- React Quickstart (Vite 5): https://www.dynamic.xyz/docs/react/reference/quickstart
- Embedded wallets setup: https://www.dynamic.xyz/docs/react/wallets/embedded-wallets/mpc/setup
- Server wallets (Node): https://www.dynamic.xyz/docs/node/wallets/server-wallets/overview
- Vite polyfills: https://www.dynamic.xyz/docs/overview/troubleshooting/react/vitejs-polyfills-necessary-for-dynamic-sdk

---

## Packages

### Frontend (installed)

```bash
npm i @dynamic-labs/sdk-react-core @dynamic-labs/ethereum
```

### Server — Broadcaster (Phase 2 ✅ scaffold)

```bash
npm i @dynamic-labs-wallet/node-evm @dynamic-labs-wallet/node
```

Implemented: `server/dynamic/client.ts`, `server/dynamic/broadcaster.ts`. Requires `DYNAMIC_API_TOKEN` + `BROADCASTER_WALLET_ADDRESS` in `.env`.

---

## Dashboard configuration (required)

Configure at https://app.dynamic.xyz before local dev:

| Setting | Location | Value |
|---------|----------|-------|
| Sepolia enabled | Chains & Networks | On |
| Sign-in method | Sign-in Methods | Email OTP (recommended) |
| Embedded wallets | Wallets | Enabled |
| Allowed origins | Security | `http://localhost:5173` |

For production deploy, add Vercel URL to Allowed Origins.

---

## Frontend setup (done in scaffold)

### vite.config.ts polyfills

Dynamic requires Node globals. **Use Vite 5 only** — Vite 8 is incompatible.

```typescript
define: {
  'process.env': {},
  global: 'globalThis',
},
```

### Provider (`src/main.tsx`)

```typescript
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';

<DynamicContextProvider
  settings={{
    environmentId: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID,
    walletConnectors: [EthereumWalletConnectors],
  }}
>
```

### Widget

```typescript
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
```

### Post-login hooks

```typescript
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

const { primaryWallet, user, handleLogOut } = useDynamicContext();
// primaryWallet.address — Owner candidate
```

---

## Owner role

### Requirements

- Embedded wallet address must match AccountBlox Owner set at provisioning
- If mismatch: re-provision treasury or update Owner via Bloxchain timelock ([governance.md](../governance.md))

### Approve timelock

```typescript
await guardController.approveTimeLockExecution(txId, { from: ownerAddress });
```

### UI flow

1. User connects via `DynamicWidget`
2. Copilot or Console shows connected Owner address
3. Pending approvals from `/pending` tool
4. Approve button calls `approveTimeLockExecution` with Dynamic signer (Phase 5)

---

## Broadcaster role

Server-side only. **Never expose Broadcaster credentials in frontend.**

### Setup (Node SDK)

```typescript
import { DynamicEvmWalletClient } from '@dynamic-labs-wallet/node-evm';

const client = new DynamicEvmWalletClient({ environmentId });
await client.authenticateApiToken(process.env.DYNAMIC_API_TOKEN!);

const { walletMetadata, externalServerKeyShares } = await client.createWalletAccount({
  thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
  backUpToDynamic: true,
});
```

Create `server/dynamic/broadcaster.ts` for submit logic — **done**. Execution path:

```typescript
// server/execution/rebalance.ts
await guardController.requestAndApproveExecution(signedMetaTx, {
  from: BROADCASTER_WALLET_ADDRESS,
});
```

Wallet client comes from `getBroadcasterWalletClient()` (`getEvmWallets()` + `walletMetadata`, not `accountAddress`).

---

## Environment variables

```env
# Browser (required)
VITE_DYNAMIC_ENVIRONMENT_ID=your-env-id

# Server — Phase 2+ (same env id is available via dotenv, no duplicate var)
DYNAMIC_API_TOKEN=your-api-token
BROADCASTER_WALLET_ADDRESS=optional-if-persisted
```

Full reference: [env-configuration.md](../env-configuration.md).

---

## Mapping to AccountBlox roles

| AccountBlox role | Dynamic wallet | Where configured |
|----------------|----------------|------------------|
| Owner | Embedded (user login) | bloxchain.app init + user connects |
| Broadcaster | Server wallet | bloxchain.app init + server persists metadata |

At provisioning, set `initialOwner` = Dynamic embedded address and `broadcaster` = Dynamic server wallet address.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Widget doesn't open | Check CORS allowed origins |
| No wallet after login | Enable Embedded Wallets in dashboard |
| Sepolia txs fail | Enable Sepolia chain in dashboard |
| Owner approve fails | Embedded address ≠ on-chain Owner |

---

## Do not

- Put `DYNAMIC_API_TOKEN` in `VITE_*` env vars
- Let embedded wallet act as Broadcaster (breaks signer ≠ executor)
- Use Dynamic + Ledger together as sponsor integrations (overlap)

---

## Files (implementation status)

| File | Status | Purpose |
|------|--------|---------|
| `server/dynamic/client.ts` | ✅ Done | Authenticated `DynamicEvmWalletClient` factory |
| `server/dynamic/broadcaster.ts` | ✅ Done | Status check + viem wallet client |
| `server/execution/rebalance.ts` | ✅ Done | `requestAndApproveExecution` submit |
| `src/hooks/useDynamicOwner.ts` | Pending | Wrap `useDynamicContext` for Owner actions (Phase 5) |
