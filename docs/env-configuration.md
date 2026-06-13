# Environment Configuration

All environment variables for AgentBlox. Server reads from `.env` via `dotenv`; Vite exposes only `VITE_*` to the browser.

Copy `.env.example` → `.env` before running.

---

## Required minimum

| Variable | Where | Purpose |
|----------|-------|---------|
| `TREASURY_ADDRESS` | Server | AccountBlox clone on Sepolia |
| `VITE_TREASURY_ADDRESS` | Client | Display in Console (optional if server-only) |
| `VITE_DYNAMIC_ENVIRONMENT_ID` | Client | Dynamic widget |

Without `TREASURY_ADDRESS`, Copilot tools return `TREASURY_NOT_CONFIGURED`.

---

## Phase 2+ (Dynamic Broadcaster)

| Variable | Where | Purpose |
|----------|-------|---------|
| `DYNAMIC_API_TOKEN` | Server only | Authenticate Node SDK |
| `DYNAMIC_ENVIRONMENT_ID` | Server | Same env as frontend |
| `BROADCASTER_WALLET_ID` | Server | Persisted server wallet ref |

**Never** prefix with `VITE_` — tokens must not reach the browser bundle.

---

## Phase 3+ (AGENT_POLICY signing)

| Variable | Where | Purpose |
|----------|-------|---------|
| `AGENT_POLICY_PRIVATE_KEY` | Server only | EIP-712 meta-tx signer |

Must match the wallet assigned to `AGENT_POLICY` role on-chain at provisioning.

---

## RPC URLs

| Variable | Default | Purpose |
|----------|---------|---------|
| `SEPOLIA_RPC_URL` | `https://rpc.sepolia.org` | Server Sepolia reads |
| `VITE_SEPOLIA_RPC_URL` | same | Client (if needed) |
| `MAINNET_RPC_URL` | public node | ENS resolution (mainnet) |

---

## ENS

| Variable | Purpose |
|----------|---------|
| `ENS_NAME` / `VITE_ENS_NAME` | Default treasury ENS for `/ens` tool |

ENS `.eth` resolution uses **mainnet** resolver even when treasury is on Sepolia.

---

## Copilot LLM (optional)

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Enables LLM mode in Copilot |
| `LLM_MODEL` | Default `gpt-4o-mini` |

Without `OPENAI_API_KEY`, slash commands and keyword fallback work (`mode: copilot-fallback`).

---

## LI.FI

| Variable | Purpose |
|----------|---------|
| `VITE_LIFI_INTEGRATOR` | Integrator string (`AgentBlox`) |
| `LIFI_INTEGRATOR` | Server-side quote requests |

---

## Server port

| Variable | Default |
|----------|---------|
| `PORT` | `3001` |

Vite proxies `/api` → `http://localhost:3001` (see `vite.config.ts`).

---

## Example `.env`

```env
VITE_DYNAMIC_ENVIRONMENT_ID=your-dynamic-env-id
VITE_SEPOLIA_RPC_URL=https://rpc.sepolia.org
VITE_TREASURY_ADDRESS=0xYourCloneAddress
VITE_ENS_NAME=treasury.acme.eth
VITE_LIFI_INTEGRATOR=AgentBlox

PORT=3001
SEPOLIA_RPC_URL=https://rpc.sepolia.org
MAINNET_RPC_URL=https://ethereum-rpc.publicnode.com
TREASURY_ADDRESS=0xYourCloneAddress
ENS_NAME=treasury.acme.eth

# Phase 2+
DYNAMIC_API_TOKEN=
AGENT_POLICY_PRIVATE_KEY=

# Optional LLM
OPENAI_API_KEY=
LLM_MODEL=gpt-4o-mini
```

---

## Verification

```bash
npm run dev:all
curl http://localhost:3001/api/health
```

Expected:

```json
{
  "status": "ok",
  "service": "agentblox-server",
  "llmEnabled": false,
  "treasuryConfigured": true,
  "mode": "copilot-fallback"
}
```

See [provisioning-checklist.md](./provisioning-checklist.md) for full setup order.
