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

- [ ] Create `AGENT_POLICY` role; assign server signing address (from `AGENT_POLICY_PRIVATE_KEY`)
- [ ] Grant `AGENT_POLICY`: `SIGN_META_REQUEST_AND_APPROVE` on Composer execution selector only
- [ ] Optional: create `ANALYST` for timelock payment requests

### A4. GuardController whitelist

Full detail: [guard-controller.md](./guard-controller.md).

**Treasury operation (LI.FI rebalance):**

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
- [ ] Set `AGENT_POLICY_PRIVATE_KEY` (must match on-chain `AGENT_POLICY` wallet)
- [ ] Set `DYNAMIC_API_TOKEN` for Broadcaster (Phase 2+)
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
- [ ] Copilot `/status` shows real address + ETH balance
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

- [ ] `/rebalance` → on-chain success (Phase 3–4)
- [ ] `/attack` → off-chain block + optional on-chain revert (Phase 4)
- [ ] `/pay` → timelock → Owner approve (Phase 5)
- [ ] `/whitelist` shows expected targets (Phase 1)
- [ ] `/pending` shows TxRecords when applicable (Phase 1)

Event context: [event/ethglobal-2026.md](./event/ethglobal-2026.md)

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| `treasuryConfigured: false` | `TREASURY_ADDRESS` in server `.env` |
| Owner approve fails | Embedded wallet address ≠ on-chain Owner |
| Meta-tx reverts | Signer = executor (must differ) |
| `TargetNotWhitelisted` on valid flow | Proxy not whitelisted for execution selector |
| ENS mismatch | Mainnet record vs Sepolia clone address |
