import { ethers, network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Factory = await ethers.getContractFactory("MedicineTrace");
  const contract = await Factory.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  console.log(`MedicineTrace deployed to: ${address}`);
  console.log(`Network: ${network.name} (chainId=${chainId})`);

  // Write deployment info for the frontend
  const outDir = path.join(__dirname, "..", "..", "app", "src", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${network.name}.json`);
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        network: network.name,
        chainId,
        contract: "MedicineTrace",
        address,
        deployedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  console.log("Wrote frontend deployment file:", outPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
