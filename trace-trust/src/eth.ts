import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { CHAIN_ID, CONTRACT_ADDRESS, RPC_URL } from "./config";
import { MEDICINE_TRACE_ABI } from "./abi/MedicineTraceAbi";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function getReadProvider() {
  return new JsonRpcProvider(RPC_URL);
}

const WALLET_SESSION_KEY = "medtrace_wallet_session_active";

function emitWalletSessionChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("wallet-session-changed"));
  }
}

export function isWalletSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(WALLET_SESSION_KEY) === "1";
}

export function setWalletSessionActive(active: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WALLET_SESSION_KEY, active ? "1" : "0");
  emitWalletSessionChanged();
}

export function hasInjectedWallet(): boolean {
  return typeof window !== "undefined" && !!window.ethereum;
}

export async function getBrowserProvider(): Promise<BrowserProvider> {
  if (!hasInjectedWallet()) {
    throw new Error("No injected wallet found (MetaMask). Install MetaMask to send transactions.");
  }
  return new BrowserProvider(window.ethereum);
}

export async function requestWalletConnection(): Promise<string> {
  const p = await getBrowserProvider();
  // Try to switch wallet to app-expected chain before requesting accounts.
  const targetHex = `0x${CHAIN_ID.toString(16)}`;
  try {
    await p.send("wallet_switchEthereumChain", [{ chainId: targetHex }]);
  } catch (switchErr: any) {
    // 4902 means chain is missing in wallet; add it for local hardhat usage.
    if (switchErr?.code === 4902) {
      await p.send("wallet_addEthereumChain", [
        {
          chainId: targetHex,
          chainName: CHAIN_ID === 31337 ? "Hardhat Local" : `Chain ${CHAIN_ID}`,
          rpcUrls: [RPC_URL],
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        },
      ]);
      await p.send("wallet_switchEthereumChain", [{ chainId: targetHex }]);
    }
  }
  const accounts = await p.send("eth_requestAccounts", []);
  setWalletSessionActive(!!accounts?.[0]);
  return accounts[0] as string;
}

export async function logoutWalletSession(): Promise<void> {
  if (!hasInjectedWallet()) {
    setWalletSessionActive(false);
    return;
  }
  try {
    const p = await getBrowserProvider();
    // Best-effort permission revoke; some wallets may ignore it.
    await p.send("wallet_revokePermissions", [{ eth_accounts: {} }]);
  } catch {
    // ignore
  } finally {
    setWalletSessionActive(false);
  }
}

export async function getConnectedWalletAddress(): Promise<string> {
  if (!hasInjectedWallet()) return "";
  const p = await getBrowserProvider();
  const accounts = await p.send("eth_accounts", []);
  return (accounts?.[0] || "") as string;
}

export async function getWalletAddress(): Promise<string> {
  const p = await getBrowserProvider();
  const signer = await p.getSigner();
  return await signer.getAddress();
}

export function getContractAddress(): string {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Contract address not configured. Deploy the contract (chain/scripts/deploy.ts) or set VITE_CONTRACT_ADDRESS."
    );
  }
  return CONTRACT_ADDRESS;
}

export function getContractRead(addressOverride?: string) {
  const addr = addressOverride || getContractAddress();
  return new Contract(addr, MEDICINE_TRACE_ABI, getReadProvider());
}

export async function getContractWrite(addressOverride?: string) {
  const addr = addressOverride || getContractAddress();
  const p = await getBrowserProvider();
  const signer = await p.getSigner();
  return new Contract(addr, MEDICINE_TRACE_ABI, signer);
}
