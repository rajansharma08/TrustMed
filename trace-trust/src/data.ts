import type { Checkpoint, Medicine } from "./types";
import { getContractRead } from "./eth";

export async function loadMedicineRecord(contractAddress: string, medicineId: string): Promise<{
  medicine: Medicine;
  checkpoints: Checkpoint[];
}> {
  const c = getContractRead(contractAddress);
  const id = BigInt(medicineId);

  const exists: boolean = await c.medicineExists(id);
  if (!exists) {
    throw new Error(`Medicine ID ${medicineId} was not found for this contract.`);
  }

  const m = await c.getMedicine(id);
  const medicine: Medicine = {
    name: m[0],
    batch: m[1],
    manufacturerName: m[2],
    mfgDate: m[3],
    expDate: m[4],
    metadataURI: m[5],
    creator: m[6],
  };

  const count: bigint = await c.checkpointCount(id);
  const n = Number(count);
  const checkpoints: Checkpoint[] = [];
  for (let i = 0; i < n; i++) {
    const cp = await c.getCheckpoint(id, BigInt(i));
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
