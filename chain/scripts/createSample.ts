import { ethers, network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

function readDeployment(): { address: string } {
  const p = path.join(__dirname, "..", "..", "app", "src", "deployments", `${network.name}.json`);
  if (!fs.existsSync(p)) {
    throw new Error(`Deployment file not found: ${p}. Deploy first.`);
  }
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const { address } = readDeployment();
  const contract = await ethers.getContractAt("MedicineTrace", address);

  const now = Math.floor(Date.now() / 1000);
  const oneYear = 365 * 24 * 60 * 60;

  const tx1 = await contract.createMedicine(
    "Paracetamol 500mg",
    "BATCH-2026-0001",
    "Demo Pharma Pte Ltd",
    now - 7 * 24 * 60 * 60,
    now + oneYear,
    "ipfs://example-metadata",
    "MT Singapore"
  );
  const r1 = await tx1.wait();
  console.log("Created medicine. tx:", tx1.hash);

  // The contract emits MedicineCreated(medicineId,...). Extract it:
  const ev = r1?.logs
    .map((l: any) => {
      try { return contract.interface.parseLog(l); } catch { return null; }
    })
    .find((p: any) => p && p.name === "MedicineCreated");

  const medicineId = ev?.args?.medicineId?.toString();
  console.log("medicineId:", medicineId);

  const tx2 = await contract.addCheckpoint(
    medicineId,
    "MT Consignment Warehouse Batam",
    "RECEIVED",
    "Received into consignment storage"
  );
  await tx2.wait();
  console.log("Added checkpoint. tx:", tx2.hash);

  console.log("Deployer:", deployer.address);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
