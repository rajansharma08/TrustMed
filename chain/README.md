# Chain (Hardhat + Solidity)

Smart-contract workspace for medicine traceability.

## Contents
- `contracts/MedicineTrace.sol`: main contract
- `scripts/deploy.ts`: deploys contract
- `scripts/createSample.ts`: creates one sample medicine + checkpoint
- `scripts/grantParticipant.ts`: grants `PARTICIPANT_ROLE`

## Prerequisites
- Node.js 18+ (recommended)
- npm

## Install
```powershell
cd chain
npm.cmd install
```

## Local Development Flow

1. Start local chain.
```powershell
cd chain
npm.cmd run node
```

2. Deploy in a second terminal.
```powershell
cd chain
npm.cmd run deploy:localhost
```

3. Optional sample data.
```powershell
cd chain
npm.cmd run create:sample:localhost
```

4. If needed, grant participant role.
```powershell
cd chain
npm.cmd run grant:participant:localhost -- 0xYourWalletAddress
```

## Role Model
- `DEFAULT_ADMIN_ROLE`: grants/revokes roles
- `MANUFACTURER_ROLE`: can call `createMedicine(...)`
- `PARTICIPANT_ROLE`: can call `addCheckpoint(...)`

Constructor grants all three roles to deployer/admin by default.

## Contract Data Model
- `Medicine`: name, batch, manufacturer, mfg/exp timestamps, metadata URI, creator
- `Checkpoint`: timestamp, actor, location, status, notes

Each new medicine automatically receives an initial `CREATED` checkpoint.

## Scripts
- `npm.cmd run compile`: compile contract
- `npm.cmd run test`: run Hardhat tests
- `npm.cmd run node`: start local node
- `npm.cmd run deploy:localhost`: deploy to local node
- `npm.cmd run create:sample:localhost`: seed sample transaction flow
- `npm.cmd run grant:participant:localhost -- 0x...`: grant participant role

## Frontend Integration Note
Current frontend lives in `../trace-trust`.

For reliable local demo wiring, set the deployed address in `trace-trust/.env`:
```env
VITE_CONTRACT_ADDRESS=<address from deploy output>
```

## Optional Testnet Setup
1. Copy `.env.example` to `.env`.
2. Set:
- `RPC_URL`
- `PRIVATE_KEY`
3. Add target network block in `hardhat.config.ts`.
4. Run deploy with that network.

## Troubleshooting
- `HH505 A native version of solc failed to run`:
  - Try `npx hardhat clean --global`
  - Retry compile/deploy
- `Deployment file not found` in scripts:
  - Run `npm.cmd run deploy:localhost` first
- Role-related reverts:
  - Ensure caller wallet has correct role (`grantParticipant` as needed)
