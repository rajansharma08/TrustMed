import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

export function QRCodeBox({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState("");
  const [svgMarkup, setSvgMarkup] = useState("");
  const [error, setError] = useState("");
  const opensVerifyPage = /^https?:\/\//i.test(value);
  const trimmedValue = value.trim();
  const svgDownloadUrl = svgMarkup ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}` : "";
  const downloadUrl = dataUrl || svgDownloadUrl;

  useEffect(() => {
    let cancelled = false;
    setError("");
    setDataUrl("");
    setSvgMarkup("");

    if (!trimmedValue) {
      setError("QR data is empty. Create the medicine again to generate a fresh QR.");
      return () => {
        cancelled = true;
      };
    }

    Promise.allSettled([
      QRCode.toDataURL(trimmedValue, { margin: 2, width: 320 }),
      QRCode.toString(trimmedValue, { type: "svg", margin: 2, width: 320 }),
    ])
      .then(([pngResult, svgResult]) => {
        if (cancelled) return;

        const messages: string[] = [];
        if (pngResult.status === "fulfilled") {
          setDataUrl(pngResult.value);
        } else {
          messages.push(String((pngResult.reason as any)?.message || pngResult.reason));
        }

        if (svgResult.status === "fulfilled") {
          setSvgMarkup(svgResult.value);
        } else {
          messages.push(String((svgResult.reason as any)?.message || svgResult.reason));
        }

        if (messages.length === 2) {
          setError(messages.join(" | "));
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(String(e?.message || e));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [trimmedValue]);

  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="text-lg font-display font-bold text-foreground">QR Code</h3>
      <p className="text-sm text-muted-foreground">
        {opensVerifyPage
          ? "This QR opens the customer verify page directly on supported phones."
          : "This QR encodes a pointer to the blockchain record (contract + medicineId)."}
      </p>

      <div className="bg-secondary rounded-xl p-6 flex flex-col items-center gap-3">
        {svgMarkup ? (
          <div
            className="w-64 h-64 rounded-lg border border-border bg-white p-2 [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        ) : dataUrl ? (
          <img src={dataUrl} alt="Medicine QR" className="w-64 h-64 rounded-lg border border-border bg-white p-2" />
        ) : (
          <div className="text-sm text-muted-foreground">Generating...</div>
        )}
      </div>

      {downloadUrl ? (
        <Button asChild variant="outline" size="sm">
          <a href={downloadUrl} download={dataUrl ? "medicine-qr.png" : "medicine-qr.svg"}>
            Download QR Image
          </a>
        </Button>
      ) : null}

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">QR payload</summary>
        <pre className="mt-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">{trimmedValue}</pre>
      </details>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
