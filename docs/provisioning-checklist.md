# Provisioning Checklist

Step-by-step setup before AgentBlox can operate a treasury on-chain. Split between **bloxchain.app** (on-chain config) and **AgentBlox** (runtime).

**Audience:** Operators setting up for the first time or rehearsing an ETHGlobal demo.  
**See also:** [treasury-lifecycle.md](./treasury-lifecycle.md) · [guard-controller.md](./guard-controller.md) · [event/ethglobal-2026.md](./event/ethglobal-2026.md)

---

## Before you start

- [ ] Sepolia ETH for Owner, Broadcaster, and gas
- [ ] Dynamic environment ID + dashboard configured ([env-configuration.md](./env-configuration.md))
- [ ] Optional: ENS name registered (mainnet) for treasury identity

---

## Part A — bloxchain.app (on-chain)

### A1. Create treasury

- [ ] Clone AccountBlox via CopyBlox or [bloxchain.app](https://bloxchain.app/)
- [ ] **Alternative (script):** in Bloxchain Protocol repo:
  ```bash
  CREATE_WALLET_USE_DEFAULTS=1 node scripts/deployment/create-wallet-copyblox.js
  ```
- [ ] Record **clone address** → `TREASURY_ADDRESS` in AgentBlox `.env`
- [ ] Set timelock period (e.g. 60–300 seconds for test; longer for production)

### A2. Map Dynamic wallets to roles

- [ ] Create Dynamic **embedded wallet** → note address → set as **Owner** at init
- [ ] Create Dynamic **server wallet** → note address → set as **Broadcaster** at init
- [ ] Set **Recovery** to cold backup address

See [integrations/dynamic.md](./integrations/dynamic.md).

### A3. RBAC roles

- [ ] Create `AGENT_POLICY` role *(future Lane A / LI.FI)*; assign server signing address
- [ ] Grant `AGENT_POLICY`: `SIGN_META_REQUEST_AND_APPROVE` on Composer execution selector only
- [ ] Create **`ANALYST`** for timelock payment requests (`EXECUTE_TIME_DELAY_REQUEST`)
- [ ] Create **`APPROVER`** for timelock approval signing (`SIGN_META_APPROVE` on USDC transfer selector)

### A4. GuardController whitelist

Full detail: [guard-controller.md](./guard-controller.md).

**Treasury operation (LI.FI rebalance — *future*):** step-by-step in [getting-started.md Part 4](./getting-started.md#part-4--configure-accountblox-for-lifi-composer-phase-4--future).

- [ ] Register Composer function schema (`LIFI_COMPOSER_FLOW`)
- [ ] Whitelist LI.FI **user proxy** for treasury signer address
- [ ] Whitelist **proxy factory** (first deploy)

**Timelock disbursement (vendor payments):**

- [ ] Whitelist Sepolia USDC for `transfer(address,uint256)` selector
- [ ] If using attached payouts: whitelist `ATTACHED_PAYMENT_RECIPIENT` / `ERC20_TRANSFER` keys per Bloxchain defs

- [ ] Verify **no** arbitrary transfer-to-EOA targets whitelisted

### A5. Fund treasury

- [ ] Send Sepolia ETH to clone (gas for Composer flows)
- [ ] Send test USDC to clone (rebalance / payment flows)

---

## Part B — AgentBlox (application)

### B1. Environment

- [ ] Copy `.env.example` → `.env`
- [ ] Set `TREASURY_ADDRESS` in `.env`
- [ ] Set `VITE_DYNAMIC_ENVIRONMENT_ID`
- [ ] Set `ANALYST_PRIVATE_KEY` + `APPROVER_PRIVATE_KEY` (must match on-chain roles)
- [ ] Set `DYNAMIC_API_TOKEN` + `BROADCASTER_WALLET_ADDRESS` (Broadcaster execution)
- [ ] *(Future Lane A)* `AGENT_POLICY_PRIVATE_KEY`, `REBALANCE_EXECUTION_TARGET`, `LIFI_EXECUTION_SELECTOR`
- [ ] Optional: `ENS_NAME`

### B2. Dynamic dashboard

- [ ] Sepolia enabled
- [ ] Embedded wallets enabled
- [ ] CORS: `http://localhost:5173` (+ Vercel URL if deployed)

### B3. Verify locally

```bash
npm run dev:all
```

- [ ] `GET /api/health` → `treasuryConfigured: true`
- [ ] Optional: `dynamicBroadcasterConfigured`, `agentPolicySigningConfigured` when execution env set
- [ ] Copilot `/status` shows real address + ETH balance + on-chain roles
- [ ] Copilot `/pending` and `/whitelist` return SDK data (Phase 1 ✅)
- [ ] Copilot `/ens` resolves (if ENS configured)
- [ ] Owner connects via `DynamicWidget`

---

## Part C — ENS (AgentBlox only)

See [integrations/ens.md](./integrations/ens.md).

- [ ] Register name (e.g. `treasury.acme.eth`)
- [ ] Set address record → AccountBlox clone
- [ ] Set text records: `bloxchain.policyVersion`, `bloxchain.allowedFlows`, `bloxchain.app`
- [ ] Verify Copilot `/ens` shows matching address

---

## Part D — LI.FI (Sepolia)

See [integrations/lifi.md](./integrations/lifi.md).

- [ ] Pre-test Composer Flow via [Composer API](https://docs.li.fi/composer/composer-api/overview)
- [ ] Confirm `userProxy` for treasury address
- [ ] Save successful tx hash for verification

---

## Part E — End-to-end verification

- [ ] `/pay` → timelock → APPROVER sign → Broadcaster submit (Lane B)
- [ ] *(Future)* `/rebalance` → signed meta-tx → on-chain success (LI.FI)
- [ ] `/whitelist` shows expected targets ✅
- [ ] `/pending` shows TxRecords when applicable ✅

Event context: [event/ethglobal-2026.md](./event/ethglobal-2026.md)

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| `treasuryConfigured: false` | `TREASURY_ADDRESS` in server `.env` |
| APPROVER sign fails | `APPROVER_PRIVATE_KEY` ≠ on-chain APPROVER or missing `SIGN_META_APPROVE` |
| Owner approve fails (legacy) | Embedded wallet address ≠ on-chain Owner |
| Meta-tx reverts | Signer = executor (must differ) |
| `TargetNotWhitelisted` on valid flow | Proxy not whitelisted for execution selector |
| ENS mismatch | Mainnet record vs Sepolia clone address |
