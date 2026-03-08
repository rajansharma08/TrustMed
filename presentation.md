# Medicine QR + Blockchain Traceability
## Presentation Report (Code Flow)

## Slide 1: Problem Statement
- Counterfeit medicine and broken supply-chain visibility create trust and safety issues.
- Traditional labels/QRs can be copied; users cannot verify full custody history.
- Need: tamper-evident, shared, and queryable medicine lifecycle records.

## Slide 2: Proposed Solution
- Each medicine gets an on-chain record in `MedicineTrace` smart contract.
- QR code stores only a pointer: `chainId + contract + medicineId`.
- Every supply-chain participant appends checkpoints to the same record.
- Customer scans QR and sees full chain-of-custody timeline.

## Slide 3: Tech Stack
- Smart contract: Solidity + OpenZeppelin `AccessControl`.
- Chain runtime: Hardhat local node (`chainId 31337`).
- Frontend: React + Vite + Ethers v6 + `html5-qrcode` + `qrcode`.
- Routing: `create`, `scan-add`, `verify` user journeys.

## Slide 4: High-Level Architecture
- `chain/`
- `contracts/MedicineTrace.sol`: core data + role-gated writes.
- `scripts/deploy.ts`: deploy + write frontend deployment JSON.
- `scripts/grantParticipant.ts`: grant participant role.
- `scripts/createSample.ts`: seed sample medicine/checkpoint.
- `app/`
- `src/config.ts`: network/RPC/contract config.
- `src/eth.ts`: read provider + wallet write provider.
- `src/pages/*`: Create, Scan+Add, Verify flows.

## Slide 5: Smart Contract Data Model
- `Medicine` struct:
- `name`, `batch`, `manufacturerName`, `mfgDate`, `expDate`, `metadataURI`, `creator`, `exists`.
- `Checkpoint` struct:
- `timestamp`, `actor`, `location`, `status`, `notes`.
- Storage:
- `nextMedicineId`, `medicines[mId]`, `history[mId][]`.

## Slide 6: Access Control Design
- `DEFAULT_ADMIN_ROLE`: can grant/revoke roles.
- `MANUFACTURER_ROLE`: can call `createMedicine`.
- `PARTICIPANT_ROLE`: can call `addCheckpoint`.
- Constructor grants admin, manufacturer, participant roles to deployer by default.

## Slide 7: Contract Functions and Events
- `createMedicine(...)`:
- Valid caller: manufacturer.
- Creates record, emits `MedicineCreated`.
- Adds initial `CREATED` checkpoint, emits `CheckpointAdded`.
- `addCheckpoint(...)`:
- Valid caller: participant.
- Appends timeline step, emits `CheckpointAdded`.
- Read functions:
- `getMedicine`, `checkpointCount`, `getCheckpoint`, `medicineExists`.

## Slide 8: Deployment-to-Frontend Wiring
- Deploy script gets deployed address and chainId.
- Writes `app/src/deployments/localhost.json`.
- Frontend `config.ts` loads:
- `RPC_URL` default `http://127.0.0.1:8545`
- `CHAIN_ID` default `31337`
- `CONTRACT_ADDRESS` from deployment file
- Result: after deploy, UI auto-picks latest local contract.

## Slide 9: Frontend App Flow
- `main.tsx`: mounts app with `BrowserRouter`.
- `App.tsx`: routes + top navigation + deployment notice.
- `TopNav` + `WalletStatus`:
- Connect wallet, show connected address.
- Validate active network (`chainId` must match expected).

## Slide 10: Create + QR Flow (Manufacturer)
- Page: `src/pages/Create.tsx`.
- Uses `getContractWrite()` from `eth.ts` (wallet signer required).
- Calls `createMedicine(...)`.
- Waits for receipt and parses `MedicineCreated` event to get `medicineId`.
- Builds QR payload:
- JSON: `{ type: "MEDTRACE", chainId, contract, medicineId }`
- Shows downloadable QR image via `QRCodeBox`.

## Slide 11: Scan + Add Checkpoint Flow (Participant)
- Page: `src/pages/ScanAdd.tsx`.
- `Scanner` reads QR with camera or payload can be pasted manually.
- `parseQRPayload` validates payload format/address/id.
- `loadMedicineRecord` fetches medicine + checkpoint history.
- On submit, app calls `addCheckpoint(medicineId, location, status, notes)`.
- Requires `PARTICIPANT_ROLE`; else transaction reverts.

## Slide 12: Verify Flow (Customer)
- Page: `src/pages/Verify.tsx`.
- Accepts scan or manual `contract + medicineId`.
- Calls only read methods through JSON-RPC.
- Displays medicine details + timeline (`Timeline.tsx`).
- Shows expiration signal via `isExpired(expDate)`.
- Wallet is optional for verification-only usage.

## Slide 13: QR Payload Strategy
- QR is immutable once printed; blockchain record is mutable by authorized actors.
- Supported QR formats:
- JSON `MEDTRACE` payload (default generated).
- URI style: `medtrace://<chainId>/<contract>/<medicineId>`.
- Invalid payloads are blocked with explicit parse errors.

## Slide 14: Error Handling in Current Build
- Wallet/network mismatch shown in UI (`expected 31337`).
- Role failures bubble from chain as custom error; UI currently shows generic revert text.
- Missing deployment file triggers configuration warning.
- If node restarts, chain state resets and roles/deployments must be recreated.

## Slide 15: Demo Script for Judges (2-3 Minutes)
1. Start `hardhat node`, deploy contract, seed sample.
2. Connect manufacturer wallet (deployer account) on network `31337`.
3. Create medicine and show generated QR.
4. Switch to participant wallet and add checkpoint from scanned QR.
5. Open verify page and show full chain history + actor trail + expiry field.
6. Explain role-based security and tamper-evident event history.

## Slide 16: Security and Trust Angle
- Unauthorized writers blocked by role checks.
- All updates are signed transactions from wallet addresses.
- Timeline provides non-repudiation and auditability.
- Limitation: this proves recorded custody events, not physical authenticity by itself.

## Slide 17: Known Limitations (Hackathon Scope)
- Metadata is mostly plain text; large data should move off-chain with hash anchoring.
- Role/admin operations are manual scripts.
- Local-network centric demo; testnet/mainnet pipeline not enabled by default.
- Production build currently needs `@types/qrcode` typing fix in app.

## Slide 18: Future Improvements
- Add manufacturer role grant script (currently participant grant exists).
- Decode custom errors in UI for clearer role failure messages.
- Add explorer links and tx hash cards for each checkpoint.
- Add DID/org-based permissions and multi-sig admin controls.
- Add anti-counterfeit hardware linkage (NFC/secure tags).

## Slide 19: Project Run Commands (Windows PowerShell)
```powershell
# Terminal 1
cd chain
npm.cmd install
npm.cmd run node

# Terminal 2
cd chain
npm.cmd run deploy:localhost
npm.cmd run create:sample:localhost

# Optional: grant participant
npm.cmd run grant:participant:localhost -- 0xYourWallet

# Terminal 3
cd app
npm.cmd install
npm.cmd run dev
```

## Slide 20: Key Takeaway
- This system turns a static QR into a live, verifiable supply-chain pointer.
- Smart contract roles control who can write.
- Customers get transparent custody history from origin to final delivery.
