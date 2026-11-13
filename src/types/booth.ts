export type ScreenType = "LOBBY" | "CAMERA" | "RECEIPT";

export type PlayerMode = "1p" | "2p";

export type StripLayout = "4-STRIP VERTICAL" | "2x2 GRID" | "SINGLE POLAROID";

export type FilterMode = "GB 4-BIT" | "PS1 LOW-POLY" | "THERMAL RECEIPT" | "CCTV 2004";

// Backward compatibility alias
export type HardwareFilter = FilterMode;

export type HardwareMode = "GB 4-BIT" | "PS1 LOW-POLY" | "THERMAL TAPE";

export type CaptureScheme = "SPLIT-SCREEN" | "SOLO RIG";

export type CountdownSeconds = 3 | 5;

export interface CapturedPhoto {
  id: string;
  frameIndex: number;
  dataUrl: string; // P1 or combined
  burstFrames: string[];
  dataUrlP2?: string; // P2 photo in 2P mode
  burstFramesP2?: string[];
  operator?: "P1" | "P2" | "DUAL";
  timestamp: string;
  filterMode: FilterMode;
}

export interface ReceiptStamp {
  id: string;
  stamp: string;
  top: number;
  left: number;
  rotate: number;
  scale?: number;
}
