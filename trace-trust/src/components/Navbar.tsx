import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/StatusPill";
import { Shield, Menu, X, Pill } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CHAIN_ID } from "@/config";

const navItems = [
  { label: "Home", path: "/" },
  // { label: "Dashboard", path: "/dashboard" },
  { label: "Create + QR", path: "/create" },
  { label: "Scan + Add Step", path: "/scan-add" },
  { label: "Verify (Customer)", path: "/verify" },
];

export const Navbar = () => {
  const { isConnected, address, chainId, isAuthorized, connect, disconnect } = useWallet();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const shortAddr = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg text-foreground">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <Pill className="h-4 w-4 text-primary-foreground" />
          </div>
          Trust Med
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Wallet area */}
        <div className="hidden md:flex items-center gap-3">
          {isConnected ? (
            <>
              <StatusPill variant="info" dot>{`Chain: ${chainId}`}</StatusPill>
              {chainId !== null && chainId !== CHAIN_ID && (
                <StatusPill variant="warning">{`Wrong network (expected ${CHAIN_ID})`}</StatusPill>
              )}
              <span className="text-xs font-mono bg-secondary px-2 py-1 rounded-md text-foreground">{shortAddr(address!)}</span>
              {isAuthorized && (
                <StatusPill variant="success">
                  <Shield className="h-3 w-3" />Writer
                </StatusPill>
              )}
              <Button variant="outline" size="sm" onClick={disconnect}>Logout</Button>
            </>
          ) : (
            <Button size="sm" className="gradient-primary text-primary-foreground border-0" onClick={connect}>Login</Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-3 py-2 rounded-lg text-sm font-medium",
                location.pathname === item.path ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-border space-y-2">
            {isConnected ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <StatusPill variant="info" dot>{`Chain: ${chainId}`}</StatusPill>
                  {chainId !== null && chainId !== CHAIN_ID && (
                    <StatusPill variant="warning">{`Wrong network (expected ${CHAIN_ID})`}</StatusPill>
                  )}
                  <span className="text-xs font-mono bg-secondary px-2 py-1 rounded-md">{shortAddr(address!)}</span>
                  {isAuthorized && <StatusPill variant="success"><Shield className="h-3 w-3" />Writer</StatusPill>}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={disconnect}>Logout</Button>
              </>
            ) : (
              <Button size="sm" className="w-full gradient-primary text-primary-foreground border-0" onClick={connect}>Login</Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
