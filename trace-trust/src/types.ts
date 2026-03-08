export type Medicine = {
  name: string;
  batch: string;
  manufacturerName: string;
  mfgDate: bigint;
  expDate: bigint;
  metadataURI: string;
  creator: string;
};

export type Checkpoint = {
  timestamp: bigint;
  actor: string;
  location: string;
  status: string;
  notes: string;
};

export type QRPayload = {
  type: "MEDTRACE";
  chainId: number;
  contract: string;
  medicineId: string; // keep as string for QR + UI
};

export type RiskVerdict = "LEGIT" | "REVIEW" | "SUSPECT";

export type RiskAnalysisResult = {
  verdict: RiskVerdict;
  suspicionScore: number; // 0 to 100
  summary: string;
  highlights: string[];
  aiNarrative: string;
  usedGemini: boolean;
};
