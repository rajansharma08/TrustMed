# Medicine QR + Blockchain Traceability

Organizer-friendly demo for showing end-to-end medicine traceability:
- on-chain medicine registration
- QR generation as a blockchain pointer
- role-gated supply-chain checkpoint updates
- customer verification with timeline + risk assessment

## Repository Layout
- `chain/`: Solidity contract + Hardhat scripts
- `trace-trust/`: React/Vite frontend (create, scan-add, verify, dashboard)

## System Flow (End to End)
1. Manufacturer creates a medicine record on-chain (`createMedicine`).
2. App generates a QR containing `chainId + contract + medicineId`.
3. Supply chain participant scans QR and appends checkpoints (`addCheckpoint`).
4. Customer scans same QR to read immutable history.
5. Verify page shows timeline plus local/AI anomaly checks.

## 5-Minute Setup (Local Demo)
Use 3 terminals from repo root.

1. Install dependencies.
```powershell
cd chain
npm.cmd install
cd ..\trace-trust
npm.cmd install
```

2. Start Hardhat local chain (Terminal 1).
```powershell
cd chain
npm.cmd run node
```

3. Deploy contract (Terminal 2).
```powershell
cd chain
npm.cmd run deploy:localhost
```
Copy the deployed contract address from terminal output.

4. Configure frontend contract address.
Edit `trace-trust/.env` and set:
```env
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CHAIN_ID=31337
VITE_CONTRACT_ADDRESS=<DEPLOYED_CONTRACT_ADDRESS>
VITE_AUTHORIZED_WRITE_ADDRESS=0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
```

5. Optional: seed one sample medicine/checkpoint (Terminal 2).
```powershell
cd chain
npm.cmd run create:sample:localhost
```

6. Start frontend (Terminal 3).
```powershell
cd trace-trust
npm.cmd run dev
```

7. Open the app.
- `http://localhost:5173/`
- Create: `/create`
- Scan + Add: `/scan-add`
- Verify: `/verify`
- Dashboard: `/dashboard`

## Wallet and Roles (Important for Demo)
- Contract deployer gets `DEFAULT_ADMIN_ROLE`, `MANUFACTURER_ROLE`, `PARTICIPANT_ROLE`.
- UI write actions are restricted to `VITE_AUTHORIZED_WRITE_ADDRESS` (default Hardhat account #0).
- If using MetaMask, import Hardhat account #0 from `npm run node` output.

## QR Payload
The printed QR is immutable and stores a pointer, not mutable status.

Supported payload formats:
- JSON: `{"type":"MEDTRACE","chainId":31337,"contract":"0x...","medicineId":"1"}`
- URI: `medtrace://31337/0x.../1`
- URL query: `...?chainId=31337&contract=0x...&medicineId=1`

## What to Show During Evaluation
1. Create a medicine and display generated QR.
2. Scan QR on `/scan-add` and append checkpoint.
3. Verify the same QR on `/verify` and show timeline + verdict.
4. Open `/dashboard` for aggregate visibility.

## Troubleshooting
- `Unauthorized wallet` in UI: connect the wallet matching `VITE_AUTHORIZED_WRITE_ADDRESS`.
- `missing PARTICIPANT_ROLE`: run `npm.cmd run grant:participant:localhost -- 0xYourWallet`.
- `Contract address not configured`: set `VITE_CONTRACT_ADDRESS` in `trace-trust/.env`.
- Hardhat `HH505` native solc error: run `npx hardhat clean --global` and retry.
- If local chain restarts, redeploy and update `VITE_CONTRACT_ADDRESS`.

## Notes for Production (Out of Hackathon Scope)
- Store only hashes on-chain, keep large metadata off-chain.
- Replace single-writer demo gate with org-grade IAM/DID.
- Add audits, key management, and anti-tamper physical tagging.
- Align with pharma compliance requirements (DSCSA/FMD, etc.).

## Detailed Docs
- Chain setup: `chain/README.md`
- Frontend setup: `trace-trust/README.md`
