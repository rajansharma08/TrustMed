import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

export function QRCodeBox({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");
    setDataUrl("");

    QRCode.toDataURL(value, { margin: 2, width: 320 })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e?.message || e));
      });

    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="text-lg font-display font-bold text-foreground">QR Code</h3>
      <p className="text-sm text-muted-foreground">
        This QR encodes a pointer to the blockchain record (contract + medicineId).
      </p>

      <div className="bg-secondary rounded-xl p-6 flex flex-col items-center gap-3">
        {dataUrl ? (
          <img src={dataUrl} alt="Medicine QR" className="w-64 h-64 rounded-lg border border-border bg-white p-2" />
        ) : (
          <div className="text-sm text-muted-foreground">Generating...</div>
        )}
      </div>

      {dataUrl ? (
        <Button asChild variant="outline" size="sm">
          <a href={dataUrl} download="medicine-qr.png">
            Download QR Image
          </a>
        </Button>
      ) : null}

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">QR payload</summary>
        <pre className="mt-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">{value}</pre>
      </details>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
