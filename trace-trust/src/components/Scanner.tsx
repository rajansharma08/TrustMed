import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";

interface ScannerProps {
  onScan: (text: string) => boolean | void | Promise<boolean | void>;
  autoStart?: boolean;
  showControls?: boolean;
  allowStop?: boolean;
  startLabel?: string;
}

export function Scanner({
  onScan,
  autoStart = true,
  showControls = true,
  allowStop = true,
  startLabel = "Start Camera",
}: ScannerProps) {
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const secureContext = typeof window !== "undefined" ? window.isSecureContext : true;
  const hasMediaDevices = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
  const canUseCamera = secureContext && hasMediaDevices;
  const [shouldStart, setShouldStart] = useState(autoStart && canUseCamera);
  const elementId = useMemo(() => `qr-reader-${Math.random().toString(36).slice(2)}`, []);
  const qrRef = useRef<Html5Qrcode | null>(null);
  const activeRef = useRef(false);

  const stopScanner = useCallback(async () => {
    const qr = qrRef.current;
    if (!qr) return;
    try {
      await qr.stop();
    } catch {
      // Scanner might already be stopped.
    }
    // @ts-ignore clear exists at runtime.
    await qr.clear?.().catch?.(() => {});
    activeRef.current = false;
    setRunning(false);
  }, []);

  useEffect(() => {
    qrRef.current = new Html5Qrcode(elementId);
    return () => {
      stopScanner().catch(() => {});
      qrRef.current = null;
    };
  }, [elementId, stopScanner]);

  useEffect(() => {
    if (canUseCamera) return;
    setError(
      "Camera access needs HTTPS or localhost. For laptop scanning, open this app on localhost. For customer phone flow, use the phone's normal camera to scan the QR and open the verify page.",
    );
    setShouldStart(false);
  }, [canUseCamera]);

  useEffect(() => {
    const qr = qrRef.current;
    if (!qr || !shouldStart || activeRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        setError("");
        await qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          async (decodedText) => {
            if (cancelled) return;
            const accepted = await onScan(decodedText);
            if (accepted === false) return;
            setShouldStart(false);
            await stopScanner();
          },
          () => {},
        );
        if (cancelled) return;
        activeRef.current = true;
        setRunning(true);
      } catch (e: any) {
        if (!cancelled) {
          setError(String(e?.message || e));
          setShouldStart(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onScan, shouldStart, stopScanner]);

  return (
    <div className="glass-card p-6 space-y-3">
      <h3 className="text-lg font-display font-semibold text-foreground">Scanner</h3>
      <p className="text-sm text-muted-foreground">
        {showControls
          ? "Camera is optional. Start it when you want to scan a QR."
          : "Camera starts automatically. Scan QR to continue."}
      </p>

      {showControls && (
        <div className="flex items-center gap-2">
          {!running ? (
            <Button
              type="button"
              disabled={!canUseCamera}
              onClick={() => setShouldStart(true)}
              className="gradient-primary text-primary-foreground border-0"
            >
              {startLabel}
            </Button>
          ) : allowStop ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShouldStart(false);
                stopScanner().catch(() => {});
              }}
            >
              Stop Camera
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Scanning...</span>
          )}
        </div>
      )}

      <div id={elementId} className="w-full" />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
