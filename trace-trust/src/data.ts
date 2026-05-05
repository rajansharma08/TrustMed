import type { Checkpoint, Medicine } from "./types";
import { getContractRead } from "./eth";

async function withRpcTimeout<T>(promise: Promise<T>, label: string, ms = 10000): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} timed out. Ensure the frontend dev server and Hardhat node are running, then retry.`));
        }, ms);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function loadMedicineRecord(contractAddress: string, medicineId: string): Promise<{
  medicine: Medicine;
  checkpoints: Checkpoint[];
}> {
  const c = getContractRead(contractAddress);
  const id = BigInt(medicineId);

  const exists: boolean = await withRpcTimeout(c.medicineExists(id), "Medicine lookup");
  if (!exists) {
    throw new Error(`Medicine ID ${medicineId} was not found for this contract.`);
  }

  const m = await withRpcTimeout(c.getMedicine(id), "Medicine read");
  const medicine: Medicine = {
    name: m[0],
    batch: m[1],
    manufacturerName: m[2],
    mfgDate: m[3],
    expDate: m[4],
    metadataURI: m[5],
    creator: m[6],
  };

  const count: bigint = await withRpcTimeout(c.checkpointCount(id), "Checkpoint count read");
  const n = Number(count);
  const checkpoints: Checkpoint[] = [];
  for (let i = 0; i < n; i++) {
    const cp = await withRpcTimeout(c.getCheckpoint(id, BigInt(i)), `Checkpoint #${i} read`);
    checkpoints.push({
      timestamp: cp[0],
      actor: cp[1],
      location: cp[2],
      status: cp[3],
      notes: cp[4],
    });
  }

  return { medicine, checkpoints };
}
