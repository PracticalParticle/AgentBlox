# Getting Started

Step-by-step guide to run AgentBlox locally and connect it to a **new AccountBlox treasury** on Sepolia.

**Time estimate:** 1–2 hours for first-time setup (on-chain provisioning + env + verification).

**Related docs:** [provisioning-checklist.md](./provisioning-checklist.md) (checklist format) · [env-configuration.md](./env-configuration.md) (full env reference) · [guard-controller.md](./guard-controller.md) (whitelist detail) · [treasury-lifecycle.md](./treasury-lifecycle.md) (product model)

---

## What you are building

AgentBlox does **not** deploy Bloxchain contracts. You:

1. **Provision** an AccountBlox clone on Sepolia (via [bloxchain.app](https://bloxchain.app/) or protocol scripts).
2. **Configure** roles, RBAC, and GuardController whitelists on that clone.
3. **Point** AgentBlox at the clone address and sponsor integrations (Dynamic, LI.FI, optional ENS).

```text
bloxchain.app / CopyBlox     →  AccountBlox clone (Sepolia)
Dynamic                      →  Owner + Broadcaster keys
LI.FI Composer               →  Rebalance execution (whitelisted)
AgentBlox (.env + Copilot)   →  Day-to-day operations
```

### Role map (must match at provisioning)

| AccountBlox role | Who holds it | AgentBlox usage |
|------------------|--------------|-----------------|
| **Owner** | Dynamic embedded wallet (human) | Timelock approvals, governance |
| **Broadcaster** | Dynamic server wallet | Submits signed meta-txs |
| **Recovery** | Cold backup address | Emergency rotation |
| **AGENT_POLICY** | Server private key in `.env` | Signs meta-tx only — never executes |
| **ANALYST** (optional) | Ops wallet | Timelock payment requests (Phase 5) |

**Critical invariant:** for rebalances, `AGENT_POLICY` **signs** and Broadcaster **executes**. They must be different addresses.

---

## Prerequisites

Before you start, gather:

| Item | Why |
|------|-----|
| **Node.js ≥ 18.20** | Run AgentBlox (`package.json` engines) |
| **Sepolia ETH** | Gas for clone init, role config, and demo txs |
| **Sepolia test USDC** | Rebalance demo ([Circle faucet](https://faucet.circle.com/) → Sepolia USDC `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`) |
| **Dynamic account** | [app.dynamic.xyz](https://app.dynamic.xyz) — Environment ID ([§1.2](#12-get-vite_dynamic_environment_id)) + API token |
| **LI.FI API key** | [portal.li.fi](https://portal.li.fi) — Composer compose for `/quote` and `/rebalance` |
| **AGENT_POLICY keypair** | Generate once; address goes on-chain, private key goes in `.env` only |

Optional: ENS name on mainnet for `/ens` demo ([integrations/ens.md](./integrations/ens.md)).

---

## Part 1 — Run AgentBlox locally

### 1.1 Clone and install

```bash
git clone <your-agentblox-repo-url>
cd AgentBlox
npm install
```

### 1.2 Get `VITE_DYNAMIC_ENVIRONMENT_ID`

AgentBlox uses one Dynamic **Environment ID** for both the browser widget and the server Broadcaster client. You need it before the Copilot login widget will work.

#### Step 1: Create a Dynamic account and project

1. Open [app.dynamic.xyz](https://app.dynamic.xyz) and sign in (or create an account).
2. If prompted, create a **new project** for AgentBlox (name it e.g. `AgentBlox Sepolia`).

#### Step 2: Copy the Environment ID

1. In the left sidebar, go to **Developer** → **API**  
   Direct link: [app.dynamic.xyz/dashboard/developer/api](https://app.dynamic.xyz/dashboard/developer/api)
2. Find **Environment ID** (a UUID string, e.g. `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).
3. Click **Copy** and save it — you will paste this into `.env` as `VITE_DYNAMIC_ENVIRONMENT_ID`.

The server reads the same variable from `.env` via `dotenv`; do **not** create a separate `DYNAMIC_ENVIRONMENT_ID`.

#### Step 3: Configure the environment (before first login)

In the Dynamic dashboard for this project, set:

| Setting | Location | Value |
|---------|----------|-------|
| Sepolia | **Chains & Networks** | Enabled |
| Sign-in | **Sign-in Methods** | Email OTP (recommended for demo) |
| Embedded wallets | **Wallets** | Enabled (Owner role) |
| Allowed origins | **Security** | `http://localhost:5173` |

For a deployed demo, add your production URL to **Allowed origins** as well.

More detail: [integrations/dynamic.md](./integrations/dynamic.md).

### 1.3 Create environment file

```bash
cp .env.example .env
```

Minimum to boot the app (reads only):

```env
TREASURY_ADDRESS=0xYourCloneAddressAfterPart2
VITE_DYNAMIC_ENVIRONMENT_ID=paste-environment-id-from-step-1.2
```

### 1.4 Start dev servers

```bash
npm run dev:all
```

| Service | URL |
|---------|-----|
| Copilot UI | http://localhost:5173 |
| API server | http://localhost:3001 |

### 1.5 Quick health check

```bash
curl http://localhost:3001/api/health
```

With only `TREASURY_ADDRESS` set, expect `treasuryConfigured: true`. Other flags turn `true` as you complete Parts 2–4.

---

## Part 2 — Create and configure AccountBlox (on-chain)

This is the most important section. AgentBlox cannot operate until a clone exists with correct roles and whitelists.

### 2.1 Choose a provisioning path

| Path | Best for |
|------|----------|
| **[bloxchain.app](https://bloxchain.app/)** | Guided UI — recommended for hackathon |
| **CopyBlox script** | Developers already in [Bloxchain Protocol](https://github.com/PracticalParticle/Bloxchain-Protocol) repo |

Sepolia protocol addresses (reference): see [integrations/bloxchain.md](./integrations/bloxchain.md).

---

### 2.2 Path A — bloxchain.app (recommended)

#### Step 1: Create the clone

1. Open [bloxchain.app](https://bloxchain.app/) and connect a wallet with Sepolia ETH.
2. Start **Create treasury** / clone AccountBlox via CopyBlox.
3. When prompted, set:
   - **Timelock period** — e.g. `120` seconds for demos (longer for production).
   - **Owner** — see Step 2 below (Dynamic embedded address).
   - **Broadcaster** — see Step 2 below (Dynamic server wallet address).
   - **Recovery** — a cold backup address you control.

4. Complete deployment. **Copy the clone address** — this becomes `TREASURY_ADDRESS`.

#### Step 2: Prepare Dynamic addresses *before* initialize

You need two addresses **before** you finalize Owner and Broadcaster on-chain:

**Owner (embedded wallet)**

1. Ensure `VITE_DYNAMIC_ENVIRONMENT_ID` is set (see [§1.2](#12-get-vite_dynamic_environment_id)).
2. In [Dynamic dashboard](https://app.dynamic.xyz): confirm **Sepolia**, **Embedded wallets**, and Email OTP (or your preferred sign-in) are enabled.
3. Add CORS origin: `http://localhost:5173`.
4. In AgentBlox UI, open http://localhost:5173 and sign in via **DynamicWidget** in the header.
5. Note `primaryWallet.address` — this is your **Owner** candidate.

**Broadcaster (server wallet)**

1. In Dynamic dashboard, create a **server wallet** (Node / server wallets).
2. Note the wallet address — this is your **Broadcaster** candidate.
3. Create an **API token** with permission to use that server wallet.

See [integrations/dynamic.md](./integrations/dynamic.md) for dashboard details.

#### Step 3: Initialize roles on the clone

If bloxchain.app did not set Owner/Broadcaster during clone:

1. Use the app’s role configuration step, **or**
2. Call `initialize(owner, broadcaster, recovery, timeLockPeriodSec, eventForwarder)` on the clone per [Bloxchain account pattern](https://github.com/PracticalParticle/Bloxchain-Protocol/blob/main/docs/account-pattern.md).

Verify:

- Owner = Dynamic embedded address
- Broadcaster = Dynamic server wallet address
- Recovery = your backup address

---

### 2.3 Path B — CopyBlox script (advanced)

From the **Bloxchain Protocol** repository:

```bash
# In Bloxchain-Protocol repo — adjust env for your Owner/Broadcaster addresses
CREATE_WALLET_USE_DEFAULTS=1 node scripts/deployment/create-wallet-copyblox.js
```

Record the deployed **clone address**. Then configure RBAC and GuardController using bloxchain.app or SDK sanity scripts under `scripts/sanity-sdk/`.

Reference: [Bloxchain getting started](https://github.com/PracticalParticle/Bloxchain-Protocol/blob/main/docs/getting-started.md).

---

### 2.4 Configure RBAC — AGENT_POLICY role

AgentBlox’s server signs rebalance meta-txs with `AGENT_POLICY_PRIVATE_KEY`. That key’s **address** must exist on-chain with sign-only permissions.

#### Generate AGENT_POLICY key (off-chain)

```bash
# Example with cast (Foundry) — or any secure key generator
cast wallet new
```

Save:

- **Address** → assign to `AGENT_POLICY` role on-chain
- **Private key** → `AGENT_POLICY_PRIVATE_KEY` in `.env` (never commit, never `VITE_*`)

#### On-chain RBAC steps

1. Create role **`AGENT_POLICY`** (via bloxchain.app or `roleConfigBatch`).
2. Assign the AGENT_POLICY **wallet address** to that role.
3. Grant **`SIGN_META_REQUEST_AND_APPROVE`** on the LI.FI Composer **execution selector** only — not Broadcaster permissions.

The execution selector comes from your first successful LI.FI compose (Part 3). You can whitelist a placeholder selector during provisioning and update after first `/quote` if your tooling requires it upfront.

Optional: create **`ANALYST`** for timelock `/pay` flows (Phase 5):

1. Generate an off-chain key (`cast wallet new`).
2. Create role **`ANALYST`** and assign the wallet address.
3. Grant **`EXECUTE_TIME_DELAY_REQUEST`** on `transfer(address,uint256)` with handler `executeWithTimeLock`.
4. Set **`ANALYST_PRIVATE_KEY`** in `.env`.

---

### 2.5 Configure GuardController whitelist

GuardController is the on-chain gate: **empty whitelist = deny all** external calls.

See [guard-controller.md](./guard-controller.md) for the full model.

#### For LI.FI rebalance (required for `/rebalance`)

| Action | What to whitelist |
|--------|-------------------|
| Register function schema | Composer proxy execute function (from LI.FI compile) |
| `ADD_TARGET_TO_WHITELIST` | LI.FI **`userProxy`** for your treasury signer (`TREASURY_ADDRESS`) |
| `ADD_TARGET_TO_WHITELIST` | LI.FI **proxy factory** (first-time proxy deploy on Sepolia) |

**Important:** `userProxy` is **per treasury address**, not a shared router. Get it from AgentBlox after Part 3:

```text
Copilot → /quote  →  response includes userProxy
```

Whitelist that address for the execution selector returned in the same response.

#### For vendor payments (optional — Phase 5)

| Target | Selector |
|--------|----------|
| Sepolia USDC `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | `transfer(address,uint256)` (`0xa9059cbb`) |

Do **not** whitelist arbitrary EOAs for unrestricted transfers.

---

### 2.6 Fund the treasury

Send to the **clone address** (`TREASURY_ADDRESS`):

| Asset | Purpose |
|-------|---------|
| Sepolia ETH | Gas for Composer / meta-tx execution |
| Sepolia USDC | Rebalance demo (default 1 USDC = `1000000` units, 6 decimals) |

---

## Part 3 — LI.FI Composer setup

AgentBlox composes rebalance flows server-side (`server/lifi/compose.ts`).

### 3.1 Get LI.FI API key

1. Register at [portal.li.fi](https://portal.li.fi).
2. Create an API key.
3. Add to `.env`:

```env
LIFI_API_KEY=your-api-key
# Hackathon deployment (default in code):
# LIFI_COMPOSER_BASE_URL=https://ethglobal-composer.li.quest
```

### 3.2 Discover userProxy and selector

With `TREASURY_ADDRESS` and `LIFI_API_KEY` set:

1. Run `npm run dev:all`.
2. In Copilot, run **`/quote`**.
3. From the tool result, note:
   - **`userProxy`** → whitelist on GuardController (Part 2.5)
   - **`executionSelector`** → set `LIFI_EXECUTION_SELECTOR` in `.env` for `/whitelist` reads

Default demo flow: **`rebalance-sepolia-v1`** — USDC → WETH on Sepolia.

Details: [integrations/lifi.md](./integrations/lifi.md).

---

## Part 4 — Complete AgentBlox `.env`

Full reference: [env-configuration.md](./env-configuration.md).

### 4.1 Required for full demo

```env
# --- Client (browser) — from Dynamic Developer → API (§1.2)
VITE_DYNAMIC_ENVIRONMENT_ID=paste-environment-id-from-dynamic-dashboard

# --- Server (treasury) ---
TREASURY_ADDRESS=0xYourAccountBloxClone

# --- Dynamic Broadcaster ---
DYNAMIC_API_TOKEN=your-dynamic-api-token
BROADCASTER_WALLET_ADDRESS=0xYourDynamicServerWallet

# --- AGENT_POLICY signing ---
AGENT_POLICY_PRIVATE_KEY=0x...must match on-chain AGENT_POLICY role...

# --- LI.FI Composer ---
LIFI_API_KEY=your-lifi-api-key

# --- ANALYST timelock requests (/pay) ---
ANALYST_PRIVATE_KEY=0x...must match on-chain ANALYST role...
```

### 4.2 Optional

```env
ENS_NAME=treasury.acme.eth
OPENAI_API_KEY=sk-...          # natural language Copilot; slash commands work without it
LIFI_EXECUTION_SELECTOR=0x.... # from /quote; helps /whitelist display
SEPOLIA_RPC_URL=https://rpc.sepolia.org
```

### 4.3 What not to do

- Do **not** put secrets in `VITE_*` variables (they ship to the browser).
- Do **not** duplicate `TREASURY_ADDRESS` as `VITE_TREASURY_ADDRESS`.
- Do **not** use the Broadcaster key as AGENT_POLICY (breaks signer ≠ executor).

---

## Part 5 — Verify setup

### 5.1 Health endpoint

```bash
curl http://localhost:3001/api/health
```

Target flags for a fully configured demo:

| Field | Expected |
|-------|----------|
| `treasuryConfigured` | `true` |
| `dynamicEnvironmentConfigured` | `true` |
| `dynamicBroadcasterConfigured` | `true` |
| `agentPolicySigningConfigured` | `true` |
| `lifiComposeConfigured` | `true` |
| `analystConfigured` | `true` (for `/pay`) |
| `broadcaster.matchesOnChainBroadcaster` | `true` |

### 5.2 Copilot slash commands

Open http://localhost:5173 and run:

| Command | Validates |
|---------|-----------|
| `/status` | Treasury address, ETH balance, on-chain Owner/Broadcaster |
| `/whitelist` | GuardController whitelist entries |
| `/pending` | TxRecord reads via `@bloxchain/sdk` |
| `/quote` | LI.FI compose + userProxy |
| `/rebalance` | Policy gate → compose → signed meta-tx in tool card |
| `/attack` | Off-chain policy block (unauthorized target) |

### 5.3 First on-chain rebalance

1. **`/rebalance`** — confirm tool card shows `compose.status: composed` and `signing.status: signed`.
2. Click **Confirm execution** in the tool card.
3. Broadcaster submits `requestAndApproveExecution`.
4. Verify on [Sepolia Etherscan](https://sepolia.etherscan.io).

Flow diagram: [on-chain-execution-flow.md](./on-chain-execution-flow.md).

---

## Part 6 — Optional ENS identity

ENS is configured on **Ethereum mainnet**; the treasury clone lives on **Sepolia**.

1. Register a name (e.g. `treasury.yourteam.eth`).
2. Set **address record** → your Sepolia clone (or document cross-chain mapping in text records).
3. Set text records (recommended):
   - `bloxchain.policyVersion`
   - `bloxchain.allowedFlows` → e.g. `rebalance-sepolia-v1`
   - `bloxchain.app` → `AgentBlox`

4. Add to `.env`:

```env
ENS_NAME=treasury.yourteam.eth
```

5. Verify: Copilot **`/ens`**.

Details: [integrations/ens.md](./integrations/ens.md).

---

## Setup order summary

Use this sequence if you are configuring from scratch:

```text
1. Dynamic dashboard: copy Environment ID (§1.2) + Sepolia, embedded wallet, server wallet, API token
2. Generate AGENT_POLICY keypair
3. Clone AccountBlox on Sepolia (Owner, Broadcaster, Recovery, timelock)
4. RBAC: AGENT_POLICY role + sign permission on Composer selector
5. Fund clone (ETH + USDC)
6. AgentBlox .env: TREASURY_ADDRESS, Dynamic, AGENT_POLICY, LIFI_API_KEY
7. npm run dev:all → /quote → note userProxy + selector
8. GuardController: whitelist userProxy + proxy factory
9. /status, /whitelist, /rebalance → Confirm execution
10. (Optional) ENS + /ens
```

Checklist format: [provisioning-checklist.md](./provisioning-checklist.md).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `treasuryConfigured: false` | Missing/invalid `TREASURY_ADDRESS` | Set 42-char hex address in `.env`; restart server |
| `/status` shows wrong Owner/Broadcaster | Addresses mismatch at init | Re-provision or governance update ([governance.md](./governance.md)) |
| `compose_failed` / `COMPOSE_NOT_CONFIGURED` | No `LIFI_API_KEY` | Add key from portal.li.fi |
| `proposed_unsigned` / missing agent key | No `AGENT_POLICY_PRIVATE_KEY` | Generate key; assign address to AGENT_POLICY role |
| Meta-tx reverts: signer = executor | Same wallet for AGENT_POLICY and Broadcaster | Use separate keys; re-provision roles |
| `TargetNotWhitelisted` on execute | userProxy not whitelisted | Run `/quote`, whitelist returned `userProxy` for selector |
| Broadcaster submit fails | Dynamic env | Check `DYNAMIC_API_TOKEN`, `BROADCASTER_WALLET_ADDRESS`, dashboard CORS |
| `/ens` empty | No `ENS_NAME` or mainnet RPC | Set `ENS_NAME`; check `MAINNET_RPC_URL` |
| Dynamic widget does not open | CORS or missing env ID | Set `VITE_DYNAMIC_ENVIRONMENT_ID` (§1.2); add `http://localhost:5173` in Dynamic **Security → Allowed origins** |

---

## Next steps

| Goal | Doc |
|------|-----|
| Understand tools and commands | [copilot.md](./copilot.md) · [treasury-tools.md](./treasury-tools.md) |
| Change policy on a live treasury | [governance.md](./governance.md) |
| Add new capabilities | [extending-use-cases.md](./extending-use-cases.md) |
| Demo rehearsal | [demo-script.md](./demo-script.md) |
| Build status | [implementation-status.md](./implementation-status.md) |
| Architecture | [architecture.md](./architecture.md) |

---

## Quick reference — Sepolia defaults

Used by AgentBlox rebalance flow unless overridden in `.env`:

| Token | Address |
|-------|---------|
| USDC | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
| WETH | `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14` |
| Chain ID | `11155111` |

Default allowed flow ID: **`rebalance-sepolia-v1`**.
