# Docker-Native Setup Plan

**Status:** Implemented (D0–D2) · D3 prod images pending  
**Last updated:** June 2026  
**Audience:** Developers on Windows/macOS/Linux, hackathon judges, CI maintainers

**Related:** [getting-started.md](./getting-started.md) · [env-configuration.md](./env-configuration.md) · [integrations/dynamic.md](./integrations/dynamic.md) · [implementation-status.md](./implementation-status.md)

---

## 1. Why Docker

AgentBlox today assumes a **local Node dev loop** (`npm run dev:all`). That breaks down for two independent reasons:

| Problem | Impact |
|---------|--------|
| **Dynamic Node SDK is Linux/macOS only** | `@dynamic-labs-wallet/node` loads native MPC binaries (`libmpc_executor_*`). On **Windows (`win32`)** both `create:broadcaster-wallet` and **runtime Broadcaster execution** fail. |
| **Two-process topology** | Vite (5173) + Express-like HTTP server (3001) must stay in sync; proxy target is hard-coded to `localhost`. |
| **Reproducible hackathon setup** | Judges and teammates need the same Linux environment without WSL hand-holding. |
| **Secret + wallet artifact handling** | `.env` and `dynamic-server-wallet.json` must persist across container restarts without landing in images. |

**Goal:** Make **Docker Compose the primary dev and ops path**, especially on Windows, while keeping native macOS/Linux dev optional.

---

## 2. Current architecture (baseline)

```text
┌─────────────────────────────────────────────────────────────┐
│ Host (Windows / macOS / Linux)                              │
│                                                             │
│  Browser ──► Vite :5173 ──proxy /api──► tsx server :3001   │
│                    │                         │              │
│                    │ VITE_* (build-time)     │ dotenv .env  │
│                    │ Dynamic React SDK       │ @bloxchain   │
│                    │                         │ Dynamic Node*│
│                    │                         │ LI.FI compose│
└─────────────────────────────────────────────────────────────┘
                              * native MPC — Linux/macOS only
```

### Processes and ports

| Process | Command | Port | Linux-only? |
|---------|---------|------|-------------|
| Frontend | `npm run dev` (Vite 5) | 5173 | No |
| API server | `npm run dev:server` (tsx watch) | 3001 (`PORT`) | **Yes** (Dynamic Broadcaster) |
| Ops CLI | `create:broadcaster-wallet`, `verify:broadcaster` | — | **Yes** |

### Critical server paths (must run in Linux container on Windows hosts)

| Path | Dynamic SDK? |
|------|----------------|
| `server/dynamic/client.ts` | Yes — `authenticateApiToken` |
| `server/dynamic/broadcaster.ts` | Yes — `getEvmWallets`, `getWalletClient` |
| `server/execution/rebalance.ts` | Yes — Broadcaster submits meta-tx |
| `scripts/create-broadcaster-wallet.ts` | Yes — `createWalletAccount` |
| `scripts/verify-broadcaster.ts` | Yes |

Everything else (Bloxchain reads, LI.FI HTTP compose, AGENT_POLICY viem signing, chat) runs on plain Node and would work on Windows **if** Broadcaster were removed — but Broadcaster is core to the demo.

### Config today

| Input | Loaded by | Notes |
|-------|-----------|-------|
| `.env` | `dotenv` in server + Vite | Gitignored |
| `VITE_DYNAMIC_ENVIRONMENT_ID` | Browser + server | Only `VITE_*` var intentionally shared |
| `dynamic-server-wallet.json` | create script output | Gitignored; Broadcaster address source |

---

## 3. Target architecture

```text
┌──────────────── Docker Compose (Linux containers) ────────────┐
│                                                               │
│  ┌─────────────┐     /api proxy      ┌─────────────────────┐ │
│  │ web         │ ──────────────────► │ server              │ │
│  │ Vite dev OR │                     │ tsx server/index.ts │ │
│  │ nginx static│                     │ :3001               │ │
│  │ :5173       │                     │ Dynamic MPC ✓       │ │
│  └─────────────┘                     └─────────────────────┘ │
│         ▲                                      ▲               │
│         │ bind mount                         │ bind mount     │
│         │ ./src, vite.config                 │ .env           │
│         │                                    │ dynamic-server-│
│         │                                    │ wallet.json    │
│  ┌──────┴──────────────────────────────────┴──────────────┐  │
│  │ ops (profile: tools) — one-shot                          │  │
│  │ npm run create:broadcaster-wallet | verify:broadcaster  │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
         ▲
         │ http://localhost:5173
    Host browser (Dynamic widget, Owner wallet)
```

### Design principles

1. **Server always Linux** — single `Dockerfile` base for `server` and `ops` services (same image, different commands).
2. **Secrets never in images** — `env_file: .env` + optional bind mounts; `.dockerignore` excludes `.env` from build context copy but compose injects at runtime.
3. **Persist wallet JSON on host** — mount `./dynamic-server-wallet.json` (or `./data/dynamic-server-wallet.json`) so recreate containers without losing Broadcaster metadata.
4. **Frontend can stay on host initially** — Phase D0 may only containerize `server` + `ops`; full compose adds `web` when proxy wiring is stable.
5. **Preserve Vite 5** — no upgrade to Vite 8 (Dynamic incompatibility documented in [integrations/dynamic.md](./integrations/dynamic.md)).

---

## 4. Proposed file layout

```text
AgentBlox/
├── docker/
│   ├── Dockerfile.server          # multi-stage: deps → dev → prod
│   ├── Dockerfile.web             # optional: nginx static for prod demo
│   ├── docker-entrypoint-server.sh
│   └── nginx.conf                 # prod: /api → server:3001
├── docker-compose.yml             # default dev stack
├── docker-compose.prod.yml        # optional: static web + server
├── .dockerignore
└── docs/docker-plan.md            # this file
```

### npm scripts (to add)

| Script | Purpose |
|--------|---------|
| `docker:dev` | `docker compose up --build` |
| `docker:dev:server` | Server only (host-run Vite) — fastest migration step |
| `docker:down` | `docker compose down` |
| `docker:ops:create-wallet` | Compose profile `tools` → create broadcaster |
| `docker:ops:verify` | Compose profile `tools` → verify broadcaster |
| `docker:verify` | Run `npm run verify` inside Linux container (CI parity) |

---

## 5. Implementation phases

### Phase D0 — Server container (MVP, ~4h)

**Unblocks Windows immediately** without full frontend containerization.

| Task | Detail |
|------|--------|
| Add `docker/Dockerfile.server` | Base `node:22-bookworm-slim` (glibc Linux x64); `npm ci`; copy source |
| Add `docker-compose.yml` | Service `server`: build, `ports: 3001:3001`, `env_file: .env`, volumes for hot reload optional |
| Fix Vite proxy for hybrid mode | Document: host Vite proxies to `http://localhost:3001` (unchanged when server is in Docker with port publish) |
| Add `.dockerignore` | Exclude `node_modules`, `dist`, `.git`, `coverage` |
| Smoke test | `curl localhost:3001/api/health` from Windows host |

**Dev workflow (Windows):**

```bash
docker compose up server          # Linux API + Dynamic
npm run dev                       # Host Vite → localhost:3001
```

**Acceptance:** `/api/health` returns JSON; with full `.env`, `dynamicBroadcasterConfigured` can be true when verified from container.

---

### Phase D1 — Ops profile (~2h)

| Task | Detail |
|------|--------|
| Compose profile `tools` | Same image as server; `command` overrides |
| `create:broadcaster-wallet` | Writes to bind-mounted `dynamic-server-wallet.json` on host |
| `verify:broadcaster` | Read-only check |
| Update [getting-started.md](./getting-started.md) §1.6 | Replace WSL note with `npm run docker:ops:create-wallet` |

**Acceptance:** Windows user with `DYNAMIC_API_TOKEN` creates wallet without WSL.

---

### Phase D2 — Full dev compose (~3h)

| Task | Detail |
|------|--------|
| Service `web` | Vite dev server in container; `ports: 5173:5173` |
| Vite proxy target | `vite.config.ts`: proxy `/api` → `http://server:3001` when `DOCKER=1` or use env `VITE_API_PROXY_TARGET` |
| Bind mounts | Mount `src/`, `server/`, `vite.config.ts` for HMR |
| Dynamic CORS | Dashboard allowed origin remains `http://localhost:5173` (published port) |

**Acceptance:** Single command `docker compose up` → browser at `localhost:5173` full stack.

---

### Phase D3 — Production / demo image (~4h)

| Task | Detail |
|------|--------|
| Multi-stage `Dockerfile.server` | `npm run build` not required for server; run `tsx` or compile to `dist/server` |
| `Dockerfile.web` | `npm run build` → nginx serves `dist/` |
| `docker-compose.prod.yml` | `web` + `server`; no source bind mounts |
| Build-time `VITE_DYNAMIC_ENVIRONMENT_ID` | `ARG` at web build stage only (public id, not secret) |
| Deploy notes | ETHGlobal demo / Fly.io / Railway — server must stay Linux |

**Acceptance:** `docker compose -f docker-compose.prod.yml up` serves static UI + API for judges.

---

### Phase D4 — Docs, CI, polish (~2h)

| Task | Detail |
|------|--------|
| [getting-started.md](./getting-started.md) | Docker-first path; native path as optional |
| [README.md](../README.md) | Quick start with Docker |
| [env-configuration.md](./env-configuration.md) | `DOCKER=1`, compose env_file notes |
| GitHub Actions (optional) | Job `docker:verify` — build image, run tests in container |
| [implementation-plan.md](./implementation-plan.md) | Add Docker phase row |

---

## 6. `docker-compose.yml` sketch (reference)

Not implemented — target shape for Phase D0/D1:

```yaml
services:
  server:
    build:
      context: .
      dockerfile: docker/Dockerfile.server
    ports:
      - "3001:3001"
    env_file:
      - .env
    environment:
      PORT: "3001"
    volumes:
      - ./dynamic-server-wallet.json:/app/dynamic-server-wallet.json
      # optional dev hot reload:
      # - ./server:/app/server
    restart: unless-stopped

  web:
    profiles: ["full"]
    build:
      context: .
      dockerfile: docker/Dockerfile.web-dev
    ports:
      - "5173:5173"
    env_file:
      - .env
    depends_on:
      - server
    volumes:
      - ./src:/app/src
      - ./index.html:/app/index.html

  ops-create-wallet:
    profiles: ["tools"]
    build:
      context: .
      dockerfile: docker/Dockerfile.server
    env_file:
      - .env
    volumes:
      - ./dynamic-server-wallet.json:/app/dynamic-server-wallet.json
    command: ["npm", "run", "create:broadcaster-wallet"]

  ops-verify-broadcaster:
    profiles: ["tools"]
    command: ["npm", "run", "verify:broadcaster"]
```

---

## 7. Environment and volumes

### Required host files

| File | Mount | Purpose |
|------|-------|---------|
| `.env` | `env_file` (not copied into image) | All secrets + `TREASURY_ADDRESS` |
| `dynamic-server-wallet.json` | Bind mount read/write | Broadcaster creation output |

### Optional data directory (future)

Move artifacts to `./data/` to keep repo root clean:

```text
data/
  dynamic-server-wallet.json
  .gitkeep
```

Add `data/*.json` to `.gitignore` (keep `data/.gitkeep` tracked).

### Variables unchanged

No refactor of env var names required for Docker. Server already reads:

- `VITE_DYNAMIC_ENVIRONMENT_ID` (via dotenv — intentional)
- `DYNAMIC_API_TOKEN`, `BROADCASTER_WALLET_ADDRESS`
- `AGENT_POLICY_PRIVATE_KEY`, `LIFI_API_KEY`, etc.

### Vite / browser caveat

`VITE_*` vars are embedded at **frontend build time**. For dev:

- **Host Vite:** reads host `.env` — works today.
- **Container Vite:** pass `env_file` to `web` service — works.
- **Prod static build:** pass `ARG VITE_DYNAMIC_ENVIRONMENT_ID` in Docker build.

---

## 8. Platform and compatibility

| Topic | Decision |
|-------|----------|
| Base image | `node:22-bookworm-slim` (Debian glibc, x64) |
| Apple Silicon | Docker Desktop runs `linux/amd64` via emulation unless building `linux/arm64` — test Dynamic native lib on arm64 Linux explicitly |
| Windows | Docker Desktop **Linux containers** mode (default) — not Windows containers |
| WSL2 | Alternative to Docker Desktop; compose files should work identically |
| Dynamic dashboard | Allowed origin `http://localhost:5173` unchanged |

**Risk:** Dynamic MPC native module may fail on **arm64** Linux without an arm64 build. Mitigation: document `platform: linux/amd64` in compose for M1/M2 Macs if needed.

---

## 9. What we are *not* dockerizing (yet)

| Item | Reason |
|------|--------|
| bloxchain.app provisioning | External web app; on-chain step stays manual |
| Sepolia RPC / chain | Use public RPC from container outbound HTTPS |
| Owner embedded wallet | Runs in **browser on host**; Dynamic widget unchanged |
| `npm run verify` (Vitest) | Can run on host; optional Linux CI job in D4 |
| Private keys in images | Never |

---

## 10. Migration guide (current → Docker-native)

| Today | After D0 | After D2 |
|-------|----------|----------|
| `npm run dev:all` on Linux/macOS | `docker compose up server` + `npm run dev` | `docker compose --profile full up` |
| WSL for `create:broadcaster-wallet` | `docker compose --profile tools run ops-create-wallet` | same |
| `curl localhost:3001/api/health` | unchanged | unchanged |
| Setup UI verify buttons | Works if server in Docker + port 3001 published | same |

---

## 11. Acceptance criteria (overall)

- [ ] Windows 11 + Docker Desktop: create Broadcaster wallet without WSL
- [ ] Windows 11 + Docker Desktop: `/rebalance` → Confirm execution uses Broadcaster inside container
- [ ] `dynamic-server-wallet.json` persists on host after container delete
- [ ] `.env` never appears in `docker history` / image layers
- [ ] [getting-started.md](./getting-started.md) documents Docker path above native/WSL path
- [ ] One-command dev: `npm run docker:dev` (or `docker compose up`)

---

## 12. Task checklist (for implementation-plan)

| ID | Task | Phase | Est. |
|----|------|-------|------|
| D0-1 | `docker/Dockerfile.server` | D0 | 1h |
| D0-2 | `docker-compose.yml` (server only) | D0 | 1h |
| D0-3 | `.dockerignore` | D0 | 15m |
| D0-4 | `npm run docker:dev:server` + smoke doc | D0 | 45m |
| D1-1 | Compose `tools` profile (create + verify) | D1 | 1h |
| D1-2 | Update getting-started §1.6 (Docker-first) | D1 | 30m |
| D2-1 | `web` service + Vite proxy env | D2 | 2h |
| D2-2 | HMR bind mounts | D2 | 1h |
| D3-1 | Prod Dockerfiles + nginx | D3 | 3h |
| D4-1 | README + index.md link | D4 | 30m |
| D4-2 | Optional CI `docker:verify` job | D4 | 1h |

**Total estimate:** ~12–15 hours across phases D0–D4.

---

## 13. Recommended execution order

1. **D0 immediately** — unblocks Windows Broadcaster runtime and API.
2. **D1 next** — unblocks wallet creation (your current blocker).
3. **D2** before hackathon demo freeze if judges use Docker.
4. **D3–D4** as time allows for deployable demo artifact.

---

## 14. Open questions

| Question | Default assumption |
|----------|-------------------|
| Compile server to JS or keep `tsx` in prod? | Keep `tsx` for hackathon speed; compile later for smaller prod image |
| Single compose file vs dev/prod split? | One `docker-compose.yml` + override `docker-compose.prod.yml` |
| Move wallet JSON to `data/`? | Yes in D1 when adding volume docs |
| Should Setup UI detect Docker mode? | Nice-to-have; show hint if health fails on host port |

---

## 15. Summary

AgentBlox should treat **Linux containers as the canonical runtime for anything touching Dynamic’s Node SDK** — not only wallet creation, but also **live Broadcaster execution**. Docker Compose gives Windows developers a first-class path without WSL, standardizes hackathon onboarding, and sets up a clean prod demo deploy. Start with **Phase D0 (server container)** and **Phase D1 (ops profile)** for maximum impact with minimal scope.
