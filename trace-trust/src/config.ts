import localhostDeployment from "./deployments/localhost.json";

function resolveRuntimeUrl(value: string, fallback: string): string {
  const raw = value || fallback;
  if (!raw) return fallback;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/") && typeof window !== "undefined") {
    return `${window.location.origin}${raw}`;
  }
  return raw;
}

export const APP_NAME = "Medicine Trace (QR + Blockchain Demo)";

// For a demo we default to Hardhat local node settings.
// You can override any value with Vite env vars: VITE_RPC_URL, VITE_CHAIN_ID, VITE_CONTRACT_ADDRESS
export const RPC_URL: string =
  resolveRuntimeUrl((import.meta as any).env?.VITE_RPC_URL || "", "/rpc");

export const WALLET_RPC_URL: string =
  (import.meta as any).env?.VITE_WALLET_RPC_URL || "http://127.0.0.1:8545";

export const CHAIN_ID: number = Number(
  (import.meta as any).env?.VITE_CHAIN_ID || (localhostDeployment as any).chainId || 31337
);

export const DEPLOYMENT_CONTRACT_ADDRESS: string = (localhostDeployment as any).address || "";

export const CONTRACT_ADDRESS: string =
  (import.meta as any).env?.VITE_CONTRACT_ADDRESS || DEPLOYMENT_CONTRACT_ADDRESS || "";

// Optional public base URL for QR verification links (recommended for phone scans).
// Example: https://your-domain.com
export const VERIFY_BASE_URL: string =
  (import.meta as any).env?.VITE_VERIFY_BASE_URL || "";

// Hardhat default Account #0 (deployer/admin)
export const AUTHORIZED_WRITE_ADDRESS: string =
  (
    (import.meta as any).env?.VITE_AUTHORIZED_WRITE_ADDRESS ||
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  ).toLowerCase();

export const OPENAI_API_KEY: string =
  (import.meta as any).env?.VITE_OPENAI_API_KEY || "";

export const OPENAI_MODEL: string =
  (import.meta as any).env?.VITE_OPENAI_MODEL || "gpt-4o-mini";
