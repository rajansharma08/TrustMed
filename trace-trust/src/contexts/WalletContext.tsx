import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AUTHORIZED_WRITE_ADDRESS } from "@/config";
import {
  getBrowserProvider,
  getConnectedWalletAddress,
  hasInjectedWallet,
  isWalletSessionActive,
  logoutWalletSession,
  requestWalletConnection,
  setWalletSessionActive,
} from "@/eth";

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  authorizedWriter: string;
  isAuthorized: boolean;
}

interface WalletContextType extends WalletState {
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

const baseState: WalletState = {
  isConnected: false,
  address: null,
  chainId: null,
  authorizedWriter: AUTHORIZED_WRITE_ADDRESS,
  isAuthorized: false,
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<WalletState>(baseState);

  const refresh = useCallback(async () => {
    const sessionActive = isWalletSessionActive();
    if (!hasInjectedWallet()) {
      setState({ ...baseState });
      return;
    }

    try {
      const provider = await getBrowserProvider();
      const net = await provider.getNetwork();
      const connected = sessionActive ? await getConnectedWalletAddress() : "";
      const normalized = connected.toLowerCase();

      setState({
        isConnected: sessionActive && !!connected,
        address: sessionActive && connected ? connected : null,
        chainId: Number(net.chainId),
        authorizedWriter: AUTHORIZED_WRITE_ADDRESS,
        isAuthorized: sessionActive && !!connected && normalized === AUTHORIZED_WRITE_ADDRESS,
      });
    } catch {
      setState({ ...baseState });
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  useEffect(() => {
    if (!hasInjectedWallet()) return;

    const onAccountsChanged = (accounts: string[]) => {
      const next = accounts?.[0] || "";
      if (!next) setWalletSessionActive(false);
      refresh().catch(() => {});
    };
    const onChainChanged = () => refresh().catch(() => {});
    const onSessionChanged = () => refresh().catch(() => {});

    window.ethereum.on?.("accountsChanged", onAccountsChanged);
    window.ethereum.on?.("chainChanged", onChainChanged);
    window.addEventListener("wallet-session-changed", onSessionChanged);

    return () => {
      window.ethereum.removeListener?.("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener?.("chainChanged", onChainChanged);
      window.removeEventListener("wallet-session-changed", onSessionChanged);
    };
  }, [refresh]);

  const connect = useCallback(() => {
    requestWalletConnection()
      .then(() => refresh())
      .catch(() => refresh());
  }, [refresh]);

  const disconnect = useCallback(() => {
    logoutWalletSession()
      .then(() => refresh())
      .catch(() => refresh());
  }, [refresh]);

  return <WalletContext.Provider value={{ ...state, connect, disconnect }}>{children}</WalletContext.Provider>;
};
