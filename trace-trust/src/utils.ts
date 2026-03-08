import type { QRPayload } from "./types";

export function toUnixSeconds(dateStr: string): bigint {
  // dateStr expected like '2026-03-05' or ISO; we use Date parsing
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
  return BigInt(Math.floor(d.getTime() / 1000));
}

export function fromUnixSeconds(ts: bigint): string {
  const n = Number(ts);
  if (!Number.isFinite(n)) return String(ts);
  const d = new Date(n * 1000);
  return d.toISOString().slice(0, 10);
}

export function shortAddr(addr: string): string {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export function isHexAddress(s: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(s.trim());
}

export function parseQRPayload(raw: string): QRPayload {
  const text = raw.trim();
  const readMedicineId = (value: unknown): string => {
    if (typeof value === "string" && /^\d+$/.test(value.trim())) return value.trim();
    if (typeof value === "number" && Number.isInteger(value) && value >= 0) return String(value);
    throw new Error("Invalid medicineId");
  };
  const readChainId = (value: unknown): number => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) throw new Error("Invalid chainId");
    return n;
  };

  // JSON payload
  if (text.startsWith("{")) {
    const obj = JSON.parse(text);
    if (obj?.type && obj.type !== "MEDTRACE") throw new Error("Not a MEDTRACE QR payload");
    const chainId = readChainId(obj?.chainId);
    const contract = String(obj?.contract || obj?.contractAddress || "");
    if (!isHexAddress(contract)) throw new Error("Invalid contract address");
    const medicineId = readMedicineId(obj?.medicineId);
    return { type: "MEDTRACE", chainId, contract, medicineId };
  }

  // URI-like: medtrace://<chainId>/<contract>/<medicineId>
  const m = /^medtrace:\/\/(\d+)\/(0x[a-fA-F0-9]{40})\/(\d+)$/.exec(text);
  if (m) {
    return {
      type: "MEDTRACE",
      chainId: Number(m[1]),
      contract: m[2],
      medicineId: m[3],
    };
  }

  // URL-like: https://.../?chainId=31337&contract=0x...&medicineId=1
  try {
    const url = new URL(text);
    const chainIdParam = url.searchParams.get("chainId");
    const contractParam = url.searchParams.get("contract") || url.searchParams.get("contractAddress");
    const medicineIdParam = url.searchParams.get("medicineId") || url.searchParams.get("id");
    if (chainIdParam && contractParam && medicineIdParam) {
      const chainId = readChainId(chainIdParam);
      if (!isHexAddress(contractParam)) throw new Error("Invalid contract address");
      const medicineId = readMedicineId(medicineIdParam);
      return { type: "MEDTRACE", chainId, contract: contractParam, medicineId };
    }
  } catch {
    // Not a URL payload; continue with other parsers.
  }

  // Simple: medicineId only
  if (/^\d+$/.test(text)) {
    throw new Error("Scanned only an ID. Expected full MEDTRACE payload (JSON or medtrace://...).");
  }

  throw new Error("Unrecognized QR payload format");
}

export function buildQRPayload(chainId: number, contract: string, medicineId: string): QRPayload {
  return { type: "MEDTRACE", chainId, contract, medicineId };
}

export function isExpired(expDate: bigint): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return expDate > 0n && expDate < now;
}

