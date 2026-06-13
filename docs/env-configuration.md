# Environment Configuration

AgentBlox uses a **server-first** env model: treasury and Copilot tools read from unprefixed server vars. The browser only needs `VITE_*` for the Dynamic widget.

Copy `.env.example` → `.env` before running.

---

## Required minimum

| Variable | Runtime | Purpose |
|----------|---------|---------|
| `VITE_DYNAMIC_ENVIRONMENT_ID` | Browser | Dynamic embedded wallet widget |
| `TREASURY_ADDRESS` | Server | AccountBlox clone on Sepolia |

Without `TREASURY_ADDRESS`, Copilot tools return `TREASURY_NOT_CONFIGURED`.

**Do not duplicate treasury/ENS as `VITE_*` vars** — the server owns configuration; Console/Setup will load from `/api/health` and tools in later UI phases.

---

## Optional (server)

| Variable | Default | Purpose |
|----------|---------|---------|
| `ENS_NAME` | — | Default name for `/ens` tool |
| `SEPOLIA_RPC_URL` | `https://rpc.sepolia.org` | Server Sepolia reads |
| `MAINNET_RPC_URL` | publicnode | ENS resolution (mainnet) |
| `PORT` | `3001` | AgentBlox server port |
| `OPENAI_API_KEY` | — | Enables LLM Copilot mode |
| `LLM_MODEL` | `gpt-4o-mini` | OpenAI model when key is set |
| `LIFI_INTEGRATOR` | `AgentBlox` | LI.FI compose integrator string |
| `LIFI_EXECUTION_SELECTOR` | — | 4-byte Composer selector for whitelist reads |

Without `OPENAI_API_KEY`, slash commands work (`mode: copilot-fallback`).

---

## Phase 2+ (Dynamic Broadcaster — server only)

| Variable | Purpose |
|----------|---------|
| `DYNAMIC_API_TOKEN` | Authenticate Dynamic Node SDK |
| `BROADCASTER_WALLET_ADDRESS` | Dynamic server wallet — must match on-chain Broadcaster |

The server reads `VITE_DYNAMIC_ENVIRONMENT_ID` from `.env` via `dotenv` — **no separate `DYNAMIC_ENVIRONMENT_ID` needed**.

**Never** prefix secrets with `VITE_` — they must not reach the browser bundle.

---

## Phase 3+ (AGENT_POLICY signing — server only)

| Variable | Purpose |
|----------|---------|
| `AGENT_POLICY_PRIVATE_KEY` | EIP-712 meta-tx signer |

Must match the wallet assigned to `AGENT_POLICY` on-chain at provisioning.

---

## What we removed (and why)

| Removed | Reason |
|---------|--------|
| `VITE_TREASURY_ADDRESS` | Redundant — server `TREASURY_ADDRESS` is canonical |
| `VITE_ENS_NAME` | Redundant — server `ENS_NAME` is canonical |
| `VITE_SEPOLIA_RPC_URL` | No client-side chain reads in MVP; server uses `SEPOLIA_RPC_URL` |
| `VITE_LIFI_INTEGRATOR` | Never used in browser; server uses `LIFI_INTEGRATOR` |
| `DYNAMIC_ENVIRONMENT_ID` | Duplicate of `VITE_DYNAMIC_ENVIRONMENT_ID` (available to server via dotenv) |

---

## Example `.env`

```env
VITE_DYNAMIC_ENVIRONMENT_ID=your-dynamic-env-id

TREASURY_ADDRESS=0xYourCloneAddress
ENS_NAME=treasury.acme.eth

# Optional
# OPENAI_API_KEY=
# LIFI_EXECUTION_SELECTOR=0x........ 

# Phase 2+
# DYNAMIC_API_TOKEN=
# BROADCASTER_WALLET_ADDRESS=0x...

# Phase 3+
# AGENT_POLICY_PRIVATE_KEY=
```

---

## Verification

```bash
npm run dev:all
curl http://localhost:3001/api/health
```

Expected when configured:

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
