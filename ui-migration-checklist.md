# UI Migration Checklist (App -> New UI)

Use this to shift only frontend UI while keeping same blockchain + wallet + AI behavior.

## 1. Pre-Migration Snapshot

- [ ] Backup current `app/src` and `app/.env`.
- [ ] Confirm deployed contract address and chain ID.
- [ ] Confirm current working wallet account (admin/account #0 for write ops).
- [ ] Confirm local node RPC is reachable (example: `http://127.0.0.1:8545`).

## 2. Must Keep Files/Logic

- [x] Keep ABI exactly: `app/src/abi/MedicineTraceAbi.ts`.
- [x] Keep config behavior: `app/src/config.ts`.
- [x] Keep wallet + contract helpers: `app/src/eth.ts`.
- [x] Keep read data helper: `app/src/data.ts`.
- [x] Keep QR parse/build contract: `app/src/utils.ts`.
- [x] Keep types: `app/src/types.ts`.
- [x] Keep AI analysis engine: `app/src/aiAnalysis.ts`.

## 3. Route Contract (Do Not Break)

- [x] `/create` for manufacturer create + QR generation.
- [x] `/scan-add` for participant checkpoint append.
- [x] `/verify` for customer scan + history + AI verdict.
- [x] `/` for landing/home.

## 4. Feature Parity by Route

### `/create`

- [x] Wallet session required before submit.
- [x] UI-level authorization for configured writer address.
- [x] Call `createMedicine(...)`.
- [x] Parse `MedicineCreated` event and extract `medicineId`.
- [x] Generate QR payload with `chainId + contract + medicineId`.

### `/scan-add`

- [x] Parse QR payload with `parseQRPayload`.
- [x] Load current record (`loadMedicineRecord`) after scan.
- [x] Wallet session required before submit.
- [x] Check writer address gate.
- [x] Check `PARTICIPANT_ROLE` before `addCheckpoint`.
- [x] Append notes tags:
`[reportedAt=...] [scanMode=BOX|STRIP] [scannedUnits=N]`.

### `/verify`

- [x] Parse QR payload.
- [x] Load medicine + checkpoints.
- [x] Run `runAiMedicineRiskCheck(...)`.
- [x] Render timeline + verdict + suspicion score.
- [x] Show parse/loading/analysis errors clearly.

## 5. Env Parity (Required)

Keep same keys in new UI build:

- [x] `VITE_RPC_URL`
- [x] `VITE_CHAIN_ID`
- [x] `VITE_CONTRACT_ADDRESS`
- [x] `VITE_AUTHORIZED_WRITE_ADDRESS`
- [x] `VITE_GEMINI_API_KEY`
- [x] `VITE_GEMINI_MODEL`

## 6. Wallet/Network Behavior

- [x] Login button calls `requestWalletConnection()`.
- [x] Auto switch/add chain using configured `CHAIN_ID`.
- [x] Show connected address and chain status.
- [x] Show wrong-network warning if chain mismatch.
- [x] Logout clears local wallet session flag.

## 7. QR Compatibility Rules

New UI must accept all currently supported scan formats:

- [x] JSON payload format.
- [x] `medtrace://<chainId>/<contract>/<medicineId>`
- [x] URL query format with `chainId`, `contract`, `medicineId`.

## 8. Test Matrix Before Cutover

- [ ] Create medicine on-chain works.
- [ ] QR scan on `scan-add` resolves payload and loads history.
- [ ] Add checkpoint success path works.
- [ ] Missing role path gives clear error (no unknown custom revert UX).
- [ ] Customer verify returns timeline.
- [ ] AI analysis returns verdict in both cases:
- [ ] With Gemini key.
- [ ] Without Gemini key (local fallback).
- [ ] Chain mismatch warning visible in wallet panel.
- [ ] Phone scan path works on same Wi-Fi (if needed for demo).

## 9. Final Switch Plan

- [x] Replace only UI layer first.
- [x] Rewire routes/components to existing services/helpers.
- [x] Remove dummy/mock data from new UI.
- [ ] Smoke test all 3 core flows (`create`, `scan-add`, `verify`).
- [ ] Keep old UI branch/tag for instant rollback.

## 10. Rollback Plan

- [ ] Keep previous frontend folder untouched until demo sign-off.
- [ ] If critical bug appears, revert to previous UI branch/tag.
- [ ] Re-apply migration in smaller commits route-by-route.
