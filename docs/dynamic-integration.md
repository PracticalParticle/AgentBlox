# Dynamic Integration

Dynamic provides **two wallet surfaces** in AgentBlox:

| Wallet | Role | Usage |
|--------|------|-------|
| **Embedded wallet** | Owner (human) | Lane B timelock approvals, policy changes |
| **Server wallet** | Broadcaster | Lane A meta-tx execution |

## Official documentation

- React Quickstart (Vite 5): https://www.dynamic.xyz/docs/react/reference/quickstart
- Embedded wallets setup: https://www.dynamic.xyz/docs/react/wallets/embedded-wallets/mpc/setup
- Server wallets (Node): https://www.dynamic.xyz/docs/node/wallets/server-wallets/overview
- Vite polyfills: https://www.dynamic.xyz/docs/overview/troubleshooting/react/vitejs-polyfills-necessary-for-dynamic-sdk

## Packages

### Frontend (installed)

```bash
npm i @dynamic-labs/sdk-react-core @dynamic-labs/ethereum
```

### Server — Broadcaster (add when implementing Phase 2)

```bash
npm i @dynamic-labs-wallet/node-evm
```

## Dashboard configuration (required)

Configure at https://app.dynamic.xyz before local dev:

| Setting | Location | Value |
|---------|----------|-------|
| Sepolia enabled | Chains & Networks | On |
| Sign-in method | Sign-in Methods | Email OTP (recommended) |
| Embedded wallets | Wallets | Enabled |
| Allowed origins | Security | `http://localhost:5173` |

For production/demo deploy, add Vercel URL to Allowed Origins.

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
// Renders auth + wallet connection UI
```

### Post-login hooks

```typescript
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

const { primaryWallet, user, handleLogOut } = useDynamicContext();

// primaryWallet.address — Owner candidate
// primaryWallet.chain — chain ID (number)
```

## Owner role (Lane B)

### Requirements

- Embedded wallet address should match AccountBlox Owner set at provisioning
- If mismatch for demo: re-provision treasury or update Owner via Bloxchain timelock

### Approve timelock

```typescript
// Use @bloxchain/sdk GuardController or SecureOwnable wrapper
// walletClient from Dynamic primaryWallet connector
await guardController.approveTimeLockExecution(txId, { from: ownerAddress });
```

### UI flow

1. User connects via `DynamicWidget`
2. Dashboard shows "Connected as Owner: 0x..."
3. Pending approvals list shows timelock txs
4. "Approve" button calls `approveTimeLockExecution` with Dynamic signer

## Broadcaster role (Lane A)

Server-side only. **Never expose Broadcaster credentials in frontend.**

### Setup (Node SDK)

Per https://www.dynamic.xyz/docs/node/wallets/server-wallets/overview:

```typescript
import { DynamicEvmWalletClient } from '@dynamic-labs-wallet/node-evm';

const client = new DynamicEvmWalletClient({ environmentId });
await client.authenticateApiToken(process.env.DYNAMIC_API_TOKEN!);

const { walletMetadata, externalServerKeyShares } = await client.createWalletAccount({
  thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
  backUpToDynamic: true,
});

// Persist walletMetadata + externalServerKeyShares securely
```

### Execute meta-tx

After Agent Bridge returns signed meta-tx:

1. Broadcaster wallet submits transaction via Dynamic Node SDK
2. Or use viem `walletClient` if Dynamic exposes signing interface for server wallet

Create `server/dynamic/broadcaster.ts` for this logic.

## Environment variables

```env
# Frontend
VITE_DYNAMIC_ENVIRONMENT_ID=your-env-id

# Server
DYNAMIC_API_TOKEN=your-api-token
DYNAMIC_ENVIRONMENT_ID=your-env-id
BROADCASTER_WALLET_ID=optional-if-persisted
```

## Mapping to AccountBlox roles

| AccountBlox role | Dynamic wallet | Where configured |
|----------------|----------------|------------------|
| Owner | Embedded (user login) | bloxchain.app init + user connects |
| Broadcaster | Server wallet | bloxchain.app init + server persists metadata |

At provisioning, set `initialOwner` = expected Dynamic embedded address and `broadcaster` = Dynamic server wallet address.

## Prize alignment

| Track | How to qualify |
|-------|----------------|
| Best Agentic Build | Server wallet executes agent-signed meta-txs |
| Best Money App | Embedded wallet approves treasury payments |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Widget doesn't open | Check CORS allowed origins |
| No wallet after login | Enable Embedded Wallets in dashboard |
| Sepolia txs fail | Enable Sepolia chain in dashboard |
| CORS errors | Add exact origin including port |

## Do not

- Use Dynamic + Ledger together as sponsor integrations (overlap)
- Put `DYNAMIC_API_TOKEN` in `VITE_*` env vars
- Let embedded wallet act as Broadcaster for meta-tx (breaks signer ≠ executor story)

## Files to implement

| File | Purpose |
|------|---------|
| `src/hooks/useDynamicOwner.ts` | Wrap `useDynamicContext` for Owner actions |
| `server/dynamic/broadcaster.ts` | Server wallet init + sign/submit |
| `server/dynamic/client.ts` | Authenticated DynamicEvmWalletClient factory |
