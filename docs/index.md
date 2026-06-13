# AgentBlox Documentation

Implementation plan and integration guides for the ETHGlobal NY 2026 hackathon build.

## Start here

1. Read [architecture.md](./architecture.md) for the system overview.
2. Follow [implementation-plan.md](./implementation-plan.md) for phased tasks.
3. Implement integrations in this order:
   - [bloxchain-integration.md](./bloxchain-integration.md)
   - [dynamic-integration.md](./dynamic-integration.md)
   - [lifi-integration.md](./lifi-integration.md)
   - [ens-integration.md](./ens-integration.md)
   - [agent-bridge.md](./agent-bridge.md)
4. Rehearse using [demo-script.md](./demo-script.md).

## Document index

| Document | Purpose |
|----------|---------|
| [architecture.md](./architecture.md) | Layers, data flow, role model |
| [implementation-plan.md](./implementation-plan.md) | Phased tasks, MVP cuts, timeline |
| [bloxchain-integration.md](./bloxchain-integration.md) | AccountBlox, SDK, meta-tx, timelock |
| [dynamic-integration.md](./dynamic-integration.md) | Embedded wallet + server wallet |
| [lifi-integration.md](./lifi-integration.md) | Composer quotes, whitelist gating |
| [ens-integration.md](./ens-integration.md) | Resolution, text records, setup UI |
| [agent-bridge.md](./agent-bridge.md) | Deterministic flows, API, future MCP |
| [demo-script.md](./demo-script.md) | 3-minute judging demo |

## External references

| Resource | URL |
|----------|-----|
| Bloxchain Protocol | https://github.com/PracticalParticle/Bloxchain-Protocol |
| bloxchain.app | https://bloxchain.app/ |
| Dynamic React Quickstart | https://www.dynamic.xyz/docs/react/reference/quickstart |
| Dynamic Server Wallets | https://www.dynamic.xyz/docs/node/wallets/server-wallets/overview |
| LI.FI Composer SDK | https://docs.li.fi/composer/guides/sdk-integration |
| LI.FI ETHGlobal guide | https://docs.li.fi/composer/ethglobal-ny-2026 |
| ENS + viem | https://viem.sh/docs/ens/actions/getEnsText |
| Bloxchain Account Pattern | https://github.com/PracticalParticle/Bloxchain-Protocol/blob/main/docs/account-pattern.md |

## Hackathon constraints

- **3 sponsors max:** Dynamic, LI.FI, ENS
- **No core protocol changes**
- **ENS lives in AgentBlox** (not bloxchain.app)
- **No LLM for demo** — hardcoded agent flows with agent-ready API
