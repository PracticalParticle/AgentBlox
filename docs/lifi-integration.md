# LI.FI Integration

LI.FI **Composer** provides atomic multi-step execution (swap, bridge, deposit). In AgentBlox, Composer runs **only** through GuardController-whitelisted calls triggered by Copilot tools.

---

## Official documentation

- Composer overview: https://docs.li.fi/composer/overview
- Composer API: https://docs.li.fi/composer/composer-api/overview
- ETHGlobal NY 2026: https://docs.li.fi/composer/ethglobal-ny-2026
- Agent / MCP: https://docs.li.fi/agents/

---

## Architecture role

```
Copilot /rebalance → propose_rebalance tool
     ↓
LI.FI POST /compose → userProxy + calldata
     ↓
AGENT_POLICY signs meta-tx (target = userProxy)
     ↓
Dynamic Broadcaster → requestAndApproveExecution
     ↓
GuardController whitelist check
     ↓
LI.FI user proxy → atomic Composer flow
```

**LI.FI does not enforce policy.** Bloxchain GuardController does.

See [guard-controller-setup.md](./guard-controller-setup.md) and [on-chain-execution-flow.md](./on-chain-execution-flow.md).

---

## Composer user proxy model

| Concept | AgentBlox value |
|---------|-----------------|
| Signer | AccountBlox clone (`TREASURY_ADDRESS`) |
| Execution `to` | `userProxy` from compose response |
| First tx | May target proxy factory (deploy + execute) |
| Calldata | Full compiled Flow — split into `executionSelector` + `executionParams` for GuardController |

Do **not** assume a generic router address — proxy is **per treasury signer**.

---

## Packages

```bash
npm i @lifi/sdk@^4.0.0 @lifi/sdk-provider-ethereum@^4.0.0
```

Already in `package.json`.

For Composer authoring, also consider `@lifi/composer-sdk` when building Flows programmatically.

---

## SDK usage in AgentBlox

### Read-only quote (Phase 4)

Implement in `server/lifi/compose.ts`:

```typescript
// Option A: Composer API POST /compose
// Option B: @lifi/composer-sdk build Flow + compose

// Returns: { userProxy, calldata, executionSelector, executionParams }
```

Wire into:

- `get_lifi_quote_preview` tool — read-only
- `propose_rebalance` tool — embed in meta-tx

### Do not use direct `executeRoute` from browser

AccountBlox must mediate all external calls. Direct wallet execution bypasses GuardController.

---

## Execution via Bloxchain meta-tx

1. Compose Flow with `sender: TREASURY_ADDRESS`
2. Extract `userProxy` and calldata
3. Split calldata:
   - `executionSelector` = first 4 bytes
   - `executionParams` = remainder (EngineBlox prepends selector via `encodePacked`)
4. Whitelist `userProxy` + proxy factory at provisioning
5. AGENT_POLICY signs meta-tx; Broadcaster submits

Handler: `guardController.requestAndApproveExecution(signedMetaTx, ...)`

---

## Tool integration

| Tool | LI.FI usage |
|------|-------------|
| `get_lifi_quote_preview` | Compose / quote read-only |
| `propose_rebalance` | Fixed Flow ID + compose → meta-tx payload |

Policy gate validates `flowId ∈ AGENT_POLICY.allowedFlowIds` before compose.

Optional: cross-check ENS `bloxchain.allowedFlows` text record.

---

## Whitelist configuration

At provisioning ([guard-controller-setup.md](./guard-controller-setup.md)):

| Entry | Value |
|-------|-------|
| Function schema | Composer proxy execute function |
| Whitelist targets | `userProxy`, proxy factory |
| Lane B | Sepolia USDC for payments |

---

## Attack demo

`/attack` → `simulate_policy_violation`:

- Off-chain: policy gate rejects non-whitelisted target
- Phase 4: optional Broadcaster submit → `TargetNotWhitelisted` on-chain

---

## Hardcoded policy (hackathon)

| Rule | Default |
|------|---------|
| Flow ID | `rebalance-sepolia-v1` |
| Amount | 1 USDC (`1000000` units) |
| Threshold | `AGENT_POLICY.rebalanceUsdcThreshold` in `server/config.ts` |

Configure in `server/config.ts` — no LLM required.

---

## Sepolia considerations

- Pre-simulate compose before demo
- Confirm supported tokens on Sepolia
- Fallback: document single pre-built calldata if compose API blocked
- Save Etherscan links for submission

---

## Environment variables

```env
VITE_LIFI_INTEGRATOR=AgentBlox
LIFI_INTEGRATOR=AgentBlox
```

See [env-configuration.md](./env-configuration.md).

---

## Files to implement

| File | Phase | Purpose |
|------|-------|---------|
| `server/lifi/compose.ts` | 4 | Compose + calldata split |
| `src/lib/lifi.ts` | 4 | Optional client wrapper |
| `server/tools/propose.ts` | 3–4 | Wire compose into rebalance |
| `server/tools/read.ts` | 4 | Real quote in preview tool |

---

## Prize alignment

| Track | Requirement |
|-------|-------------|
| Agentic Workflows ($4k) | Composer as execution layer behind agent treasury |
| Most Innovative ($4k) | Bloxchain-gated Composer pattern |

---

## Do not

- Whitelist arbitrary contracts
- Let tools pick any Flow without policy validation
- Execute routes directly from Dynamic embedded wallet bypassing AccountBlox

---

## Partnership pitch

> "LI.FI handles execution complexity; Bloxchain handles authorization constitution. Per-treasury allowed Flow IDs whitelisted in GuardController."
