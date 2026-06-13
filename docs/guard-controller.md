# GuardController Setup

**Audience:** Operators provisioning or extending a treasury on bloxchain.app.  
**Prerequisites:** AccountBlox clone created — [provisioning-checklist.md](./provisioning-checklist.md) Part A.  
**See also:** [integrations/bloxchain.md](./integrations/bloxchain.md) · [integrations/lifi.md](./integrations/lifi.md) · [governance.md](./governance.md)

GuardController is **core Bloxchain protocol** — not a sponsor integration. It gates every external call from an AccountBlox clone.

---

## Mental model

GuardController does **not** embed LI.FI or any protocol. It is a gated low-level caller:

1. Register an **external function schema** (e.g. Composer proxy execute function).
2. **Whitelist** allowed target addresses **per function selector**.
3. Execute via meta-tx or timelock; EngineBlox validates, then `target.call(calldata)`.

```
executionSelector (4 bytes) + executionParams (ABI args without selector)
        ↓
EngineBlox.buildCallData → abi.encodePacked(selector, params)
        ↓
AccountBlox → external target
```

**Empty whitelist = deny all** external targets for that selector.

For the generic extension recipe (any protocol), see [extending-use-cases.md](./extending-use-cases.md).

---

## Whitelist actions (`guardConfigBatch`)

| Action | Purpose |
|--------|---------|
| `REGISTER_FUNCTION` | Register signature, operation type, allowed TxActions |
| `ADD_TARGET_TO_WHITELIST` | Allow contract address for a selector |
| `REMOVE_TARGET_FROM_WHITELIST` | Deny address (see governance warnings) |
| `UNREGISTER_FUNCTION` | Remove schema (see governance warnings) |

Executed via Owner-signed meta-tx → Broadcaster. Details: [governance.md](./governance.md).

---

## Worked example: LI.FI Composer (rebalance)

Provisioning checklist: [provisioning-checklist.md](./provisioning-checklist.md) Part A4.

### Register function schema

- **Function signature:** from LI.FI compile response (proxy execute function)
- **Operation type:** e.g. `LIFI_COMPOSER_FLOW`
- **Actions:** `SIGN_META_REQUEST_AND_APPROVE` + `EXECUTE_META_REQUEST_AND_APPROVE`

Reference: Bloxchain `scripts/sanity-sdk/guard-controller/erc20-mint-controller-tests.ts`

### Whitelist targets

| Target | Why |
|--------|-----|
| Composer `userProxy` for this treasury | Normal execution — **per-signer proxy**, not a generic router |
| Proxy factory (chain-specific) | First-time deploy + execute |
| Sepolia USDC contract | Timelock vendor payments (see below) |

LI.FI-specific compose and tools: [integrations/lifi.md](./integrations/lifi.md).

---

## Timelock disbursement whitelist (vendor payments)

For Copilot `/pay` → `executeWithTimeLock` on USDC `transfer(address,uint256)`:

| Whitelist entry | Selector / target |
|-----------------|-------------------|
| Sepolia USDC contract | `transfer(address,uint256)` (`0xa9059cbb`) |
| Recipient address | May need `ATTACHED_PAYMENT_RECIPIENT_SELECTOR` if using attached payouts |

Bloxchain **attached payment** keys (register via same `guardConfigBatch` flow when using `executeWithPayment`):

| Selector | Whitelist |
|----------|-----------|
| `ATTACHED_PAYMENT_RECIPIENT_SELECTOR` | Payment recipient address |
| `ERC20_TRANSFER_SELECTOR` | ERC20 token contract for payout |

AgentBlox Phase 5 path uses **`executeWithTimeLock`** + USDC transfer selector unless you adopt `executeWithPayment`. Confirm selector setup matches your bloxchain.app template.

Grant **ANALYST** role: `EXECUTE_TIME_DELAY_REQUEST` on the payment execution selector. **Owner** approves via `approveTimeLockExecution`.

---

## Policy execution: TxRecord fields (Composer)

| Field | Source |
|-------|--------|
| `target` | LI.FI `userProxy` from compose response |
| `value` | Usually `0` |
| `executionSelector` | First 4 bytes of compiled calldata |
| `executionParams` | Remainder (EngineBlox prepends selector via `encodePacked`) |
| `operationType` | `keccak256("LIFI_COMPOSER_FLOW")` |
| `gasLimit` | Generous cap — Composer flows need headroom |

Handler on clone:

```typescript
await guardController.requestAndApproveExecution(signedMetaTx, { from: broadcasterAddress });
```

- Signer in meta-tx: `AGENT_POLICY` wallet  
- Executor (`msg.sender`): Broadcaster  
- Handler selector in signed meta-tx must be `requestAndApproveExecution` on the treasury clone  

Flow: [on-chain-execution-flow.md](./on-chain-execution-flow.md).

---

## Token approvals

**Preferred:** include `approve` inside the Composer Flow (atomic).

**Alternative:** register + whitelist `approve(address,uint256)` on ERC20 as a separate execution selector (two gated txs).

---

## Policy validation (blocked target)

`simulate_policy_violation` (`/attack`) targets a non-whitelisted address. On-chain revert:

```
TargetNotWhitelisted(target, functionSelector)
```

---

## Operational warnings

When changing whitelist on a live treasury:

- Do not delist targets referenced by pending TxRecords
- Unregistering functions breaks pending txs for that selector
- See [governance.md](./governance.md)

---

## Bloxchain references

| Resource | Path |
|----------|------|
| Whitelist tests | `test/foundry/integration/WhitelistWorkflow.t.sol` |
| Meta-tx tests | `test/foundry/integration/MetaTransaction.t.sol` |
| SDK example | `scripts/sanity-sdk/guard-controller/erc20-mint-controller-tests.ts` |
| GuardController defs | `contracts/core/execution/lib/definitions/GuardControllerDefinitions.sol` |
| Protocol GuardController doc | [github.com/PracticalParticle/Bloxchain-Protocol/blob/main/docs/guard-controller.md](https://github.com/PracticalParticle/Bloxchain-Protocol/blob/main/docs/guard-controller.md) |

---

## AgentBlox implementation files

| File | Phase | Status |
|------|-------|--------|
| `server/bloxchain.ts` | 1 | ✅ Done |
| `server/tools/read.ts` | 1 | ✅ Done |
| `server/dynamic/broadcaster.ts` | 2 | ✅ Scaffold |
| `server/signing/meta-tx.ts` | 3 | ✅ Done |
| `server/execution/rebalance.ts` | 3 | ✅ Done |
| `server/lifi/compose.ts` | 4 | Pending |
