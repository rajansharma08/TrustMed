# TraceTrust Frontend (React + Vite)

UI for creating medicine records, scanning QR checkpoints, customer verification, and dashboard analytics.

## Core Routes
- `/`: landing page
- `/create`: manufacturer flow (create medicine + generate QR)
- `/scan-add`: participant flow (scan QR + add checkpoint)
- `/verify`: customer flow (scan/paste QR + verify timeline)
- `/dashboard`: aggregate analytics and flagged cases

## Prerequisites
- Node.js 18+ (recommended)
- npm
- Running blockchain RPC (default `http://127.0.0.1:8545`)

## Environment
Copy `.env.example` to `.env` and fill values.

```powershell
cd trace-trust
Copy-Item .env.example .env
```

Required/important variables:
- `VITE_RPC_URL`: blockchain RPC URL
- `VITE_WALLET_RPC_URL`: wallet network RPC URL (important for MetaMask chain setup)
- `VITE_CHAIN_ID`: expected chain ID (`31337` for local Hardhat)
- `VITE_CONTRACT_ADDRESS`: deployed `MedicineTrace` contract address
- `VITE_AUTHORIZED_WRITE_ADDRESS`: optional preferred writer badge address
- `VITE_GEMINI_API_KEY`: optional, enables Gemini-assisted narrative
- `VITE_GEMINI_MODEL`: Gemini model name
- `VITE_VERIFY_BASE_URL`: optional, base URL for sharable verify links
- `VITE_DASHBOARD_MAX_MEDICINE_ID`: dashboard scan upper bound
- `VITE_DASHBOARD_SCAN_MISS_LIMIT`: dashboard early-stop miss threshold

If `VITE_GEMINI_API_KEY` is empty, verify page still works using local deterministic checks.

## Install and Run
```powershell
cd trace-trust
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:5173`.
Open `http://localhost:8080`.

## Deploy on Vercel
1. Push repo to GitHub.
2. In Vercel, `Add New Project` and import the repo.
3. Set `Root Directory` to `trace-trust`.
4. Build settings:
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
5. Add Environment Variables in Vercel project settings:
- `VITE_RPC_URL`
- `VITE_WALLET_RPC_URL`
- `VITE_CHAIN_ID`
- `VITE_CONTRACT_ADDRESS`
- `VITE_AUTHORIZED_WRITE_ADDRESS`
- `VITE_VERIFY_BASE_URL` (set to your Vercel URL, e.g. `https://trustmed.vercel.app`)
- `VITE_GEMINI_API_KEY` (optional)
- `VITE_GEMINI_MODEL` (optional)
- `VITE_DASHBOARD_MAX_MEDICINE_ID`
- `VITE_DASHBOARD_SCAN_MISS_LIMIT`
6. Deploy.

Notes:
- `vercel.json` is already added for SPA rewrite so direct route refresh works (`/verify`, `/scan-add`, etc.).
- Do not keep `VITE_RPC_URL=http://127.0.0.1:8545` in production; use a reachable RPC endpoint.
- If env values change, trigger a redeploy.

## Chain Dependency (Important)
This app expects a deployed contract. Typical flow:
1. Start local node in `../chain`.
2. Deploy contract via `npm.cmd run deploy:localhost`.
3. Put deployed address into `VITE_CONTRACT_ADDRESS` in `.env`.
4. Restart `npm.cmd run dev` if env changed.

## User Flow in App
1. Login wallet in navbar.
2. On `/create`, submit medicine details to call `createMedicine`.
3. App parses `MedicineCreated` event and generates QR payload.
4. On `/scan-add`, scan/paste QR and submit `addCheckpoint`.
5. On `/verify`, scan/paste QR to fetch full history and risk verdict.
6. On `/dashboard`, review cross-medicine analytics and flagged cases.

## Write Access Behavior
- UI allows any connected wallet; contract roles decide who can create or add checkpoints.
- Contract enforces role checks (`MANUFACTURER_ROLE` / `PARTICIPANT_ROLE`).
- For local demo, Hardhat account #0 is default authorized writer.

## QR Payload Compatibility
Accepted formats:
- JSON: `{"type":"MEDTRACE","chainId":31337,"contract":"0x...","medicineId":"1"}`
- URI: `medtrace://31337/0x.../1`
- URL query: `...?chainId=31337&contract=0x...&medicineId=1`

## Scripts
- `npm.cmd run dev`: start Vite dev server
- `npm.cmd run build`: production build
- `npm.cmd run preview`: preview production build
- `npm.cmd run lint`: lint project
- `npm.cmd run test`: run Vitest
- `npm.cmd run test:watch`: run Vitest in watch mode

## Troubleshooting
- `Contract address not configured`: set `VITE_CONTRACT_ADDRESS`.
- `No injected wallet found`: install/enable MetaMask.
- Wrong network warning: switch wallet to `VITE_CHAIN_ID`.
- `missing PARTICIPANT_ROLE`: grant role from chain scripts, then retry.
- Verify route slow/error with AI: unset Gemini key to use local fallback only.
