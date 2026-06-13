# Provisioning Checklist

Step-by-step setup before AgentBlox demo works end-to-end. Split between **bloxchain.app** (on-chain config) and **AgentBlox** (runtime).

---

## Before you start

- [ ] Sepolia ETH for Owner, Broadcaster, and gas
- [ ] Dynamic environment ID + dashboard configured ([env-configuration.md](./env-configuration.md))
- [ ] Optional: ENS name registered (mainnet) for identity demo

---

## Part A — bloxchain.app (on-chain)

### A1. Create treasury

- [ ] Clone AccountBlox via CopyBlox or bloxchain.app
- [ ] Record **clone address** → `TREASURY_ADDRESS` in AgentBlox `.env`
- [ ] Set timelock period (e.g. 60–300 seconds for demo)

### A2. Map Dynamic wallets to roles

- [ ] Create Dynamic **embedded wallet** → note address → set as **Owner** at init (or update via timelock)
- [ ] Create Dynamic **server wallet** → note address → set as **Broadcaster** at init
- [ ] Set **Recovery** to cold backup address

### A3. RBAC roles

- [ ] Create `AGENT_POLICY` role; assign server signing address (from `AGENT_POLICY_PRIVATE_KEY`)
- [ ] Grant `AGENT_POLICY`: `SIGN_META_REQUEST_AND_APPROVE` on Composer execution selector only
- [ ] Optional: create `ANALYST` for Lane B payment requests

### A4. GuardController whitelist

See [guard-controller-setup.md](./guard-controller-setup.md).

- [ ] Register Composer function schema (`LIFI_COMPOSER_FLOW`)
- [ ] Whitelist LI.FI **user proxy** for treasury signer address
- [ ] Whitelist **proxy factory** (first deploy)
- [ ] Whitelist Sepolia USDC for Lane B (if using vendor payments)
- [ ] Verify **no** arbitrary transfer targets whitelisted

### A5. Fund treasury

- [ ] Send Sepolia ETH to clone (gas for Composer flows)
- [ ] Send test USDC to clone (rebalance / payment demo)

---

## Part B — AgentBlox (application)

### B1. Environment

- [ ] Copy `.env.example` → `.env`
- [ ] Set `TREASURY_ADDRESS` and `VITE_TREASURY_ADDRESS`
- [ ] Set `VITE_DYNAMIC_ENVIRONMENT_ID`
- [ ] Set `AGENT_POLICY_PRIVATE_KEY` (must match on-chain `AGENT_POLICY` wallet)
- [ ] Set `DYNAMIC_API_TOKEN` for Broadcaster (Phase 2+)
- [ ] Optional: `ENS_NAME` / `VITE_ENS_NAME`

### B2. Dynamic dashboard

- [ ] Sepolia enabled
- [ ] Embedded wallets enabled
- [ ] CORS: `http://localhost:5173` (+ Vercel URL if deployed)

### B3. Verify locally

```bash
npm run dev:all
```

- [ ] `GET /api/health` → `treasuryConfigured: true`
- [ ] Copilot `/status` shows real address + ETH balance
- [ ] Copilot `/ens` resolves (if ENS configured)
- [ ] Owner connects via `DynamicWidget`

---

## Part C — ENS (AgentBlox only)

ENS is **not** configured on bloxchain.app.

- [ ] Register name (e.g. `treasury.acme.eth`)
- [ ] Set address record → AccountBlox clone
- [ ] Set text records:
  - `bloxchain.policyVersion` → `1.0.0`
  - `bloxchain.allowedFlows` → `rebalance-sepolia-v1`
  - `bloxchain.app` → `agentblox`
- [ ] Verify Copilot `/ens` shows matching address

---

## Part D — LI.FI (Sepolia)

- [ ] Pre-test one Composer Flow via [Composer API](https://docs.li.fi/composer/composer-api/overview)
- [ ] Confirm `userProxy` for treasury address
- [ ] Save successful + revert tx hashes for submission

---

## Part E — Demo readiness

- [ ] Lane A: `/rebalance` → on-chain success (Phase 3–4)
- [ ] Lane A: `/attack` → on-chain revert or clear blocked state
- [ ] Lane B: `/pay` → timelock → Owner approve (Phase 5)
- [ ] ENS booth script rehearsed ([demo-script.md](./demo-script.md))
- [ ] Etherscan links bookmarked

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| `treasuryConfigured: false` | `TREASURY_ADDRESS` in server `.env` |
| Owner approve fails | Embedded wallet address ≠ on-chain Owner |
| Meta-tx reverts | Signer = executor (must differ) |
| `TargetNotWhitelisted` on valid flow | Proxy not whitelisted for execution selector |
| ENS mismatch | Mainnet record vs Sepolia clone address |
