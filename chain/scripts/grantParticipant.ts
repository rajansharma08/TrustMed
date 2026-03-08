import { ethers, network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

function readDeployment(): { address: string } {
  const p = path.join(__dirname, "..", "..", "app", "src", "deployments", `${network.name}.json`);
  if (!fs.existsSync(p)) {
    throw new Error(
      `Deployment file not found: ${p}. Deploy first with: npm run deploy:${network.name === "localhost" ? "localhost" : "<network>"}`
    );
  }
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

async function main() {
  const participant = process.env.PARTICIPANT_ADDRESS || process.argv[2];
  if (!participant) {
    console.error("Usage: PARTICIPANT_ADDRESS=0xabc... npm run grant:participant:localhost");
    console.error("   or: npm run grant:participant:localhost -- 0xabc...");
    process.exit(1);
  }

  const { address } = readDeployment();
  const contract = await ethers.getContractAt("MedicineTrace", address);
  const role = await contract.PARTICIPANT_ROLE();

  const tx = await contract.grantRole(role, participant);
  console.log("Granting PARTICIPANT_ROLE to", participant, "tx:", tx.hash);
  await tx.wait();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
