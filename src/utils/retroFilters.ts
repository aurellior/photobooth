// High-Performance Real-Time Retro Shaders and Canvas Filter Pipeline (60 FPS)

export type FilterMode = "GB 4-BIT" | "PS1 LOW-POLY" | "THERMAL RECEIPT" | "CCTV 2004";

// Game Boy 4-color palette (RGB)
const GB_PALETTE: [number, number, number][] = [
  [15, 56, 15],   // #0F380F - Darkest green/black
  [48, 98, 48],   // #306230 - Dark green
  [139, 172, 15], // #8BAC0F - Light olive
  [155, 188, 15], // #9BBC0F - Bright green-yellow
];

// Bayer 4x4 matrix normalized from 0 to 15
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

// Reusable scratch canvases to avoid memory allocations in animation loop
let offscreenCanvas: HTMLCanvasElement | null = null;
let offscreenCtx: CanvasRenderingContext2D | null = null;

function getOffscreenCanvas(width: number, height: number) {
  if (!offscreenCanvas) {
    offscreenCanvas = document.createElement("canvas");
  }
  if (offscreenCanvas.width !== width || offscreenCanvas.height !== height) {
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    offscreenCtx = offscreenCanvas.getContext("2d", { willReadFrequently: true });
  }
  return { canvas: offscreenCanvas, ctx: offscreenCtx };
}

/**
 * Apply Game Boy 4-Bit Bayer Dithering Filter
 */
export function applyGameBoyDither(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const yMod = y % 4;
    const rowOffset = y * width * 4;

    for (let x = 0; x < width; x++) {
      const i = rowOffset + x * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Bayer matrix offset (-32 to +32)
      const bayerVal = BAYER_4X4[yMod][x % 4];
      const ditherOffset = (bayerVal / 16.0 - 0.5) * 56;
      const adjustedLum = Math.min(255, Math.max(0, lum + ditherOffset));

      // 4-Color Quantization
      let colorIdx = 0;
      if (adjustedLum < 56) {
        colorIdx = 0;
      } else if (adjustedLum < 120) {
        colorIdx = 1;
      } else if (adjustedLum < 190) {
        colorIdx = 2;
      } else {
        colorIdx = 3;
      }

      const [pr, pg, pb] = GB_PALETTE[colorIdx];
      data[i] = pr;
      data[i + 1] = pg;
      data[i + 2] = pb;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Apply PS1 15-Bit Low-Poly Downscale & Quantization
 */
export function applyPS1LowPoly(
  targetCtx: CanvasRenderingContext2D,
  sourceCanvas: CanvasImageSource,
  targetWidth: number,
  targetHeight: number
) {
  // Target low internal resolution (160x120)
  const lowW = 160;
  const lowH = 120;

  const { ctx: lowCtx } = getOffscreenCanvas(lowW, lowH);
  if (!lowCtx) return;

  // Render downscaled with crisp scaling
  lowCtx.imageSmoothingEnabled = false;
  lowCtx.drawImage(sourceCanvas, 0, 0, lowW, lowH);

  // 15-Bit Color Quantization (5 bits per channel = 32 values)
  const imgData = lowCtx.getImageData(0, 0, lowW, lowH);
  const data = imgData.data;
  const quantStep = 255 / 31; // ~8.225

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Quantize 8-bit to 5-bit and scale back
    data[i] = Math.round(Math.floor(r / 8) * quantStep);
    data[i + 1] = Math.round(Math.floor(g / 8) * quantStep);
    data[i + 2] = Math.round(Math.floor(b / 8) * quantStep);
  }

  lowCtx.putImageData(imgData, 0, 0);

  // Upscale back with pixelated nearest-neighbor interpolation
  targetCtx.imageSmoothingEnabled = false;
  targetCtx.drawImage(lowCtx.canvas, 0, 0, targetWidth, targetHeight);
}

/**
 * Apply High-Contrast Thermal Receipt Halftone Dot Matrix
 */
export function applyThermalReceipt(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Paper thermal colors: #1a1917 (black) vs #fef9e7 (white/cream)
  const ink = [26, 25, 23];
  const paper = [254, 249, 231];

  for (let y = 0; y < height; y++) {
    const yMod = y % 4;
    const rowOffset = y * width * 4;

    for (let x = 0; x < width; x++) {
      const i = rowOffset + x * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Luminance with high-contrast S-curve
      let lum = 0.299 * r + 0.587 * g + 0.114 * b;
      lum = (lum - 128) * 1.6 + 128; // High contrast
      lum = Math.min(255, Math.max(0, lum));

      // Bayer halftone dot threshold
      const bayerVal = BAYER_4X4[yMod][x % 4];
      const threshold = (bayerVal / 16.0) * 255;

      const isWhite = lum > threshold;
      const [colR, colG, colB] = isWhite ? paper : ink;

      data[i] = colR;
      data[i + 1] = colG;
      data[i + 2] = colB;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Apply CCTV 2004 Security Cam Shader (Interlaced Scanlines, Grain, HUD Overlay)
 */
export function applyCCTV2004(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timestampMs: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const scanlineSpeed = (timestampMs * 0.06) % height;

  for (let y = 0; y < height; y++) {
    const isScanline = y % 2 === 0;
    const isMovingBar = Math.abs(y - scanlineSpeed) < 6;
    const rowOffset = y * width * 4;

    for (let x = 0; x < width; x++) {
      const i = rowOffset + x * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Grayscale + High Contrast
      let lum = 0.299 * r + 0.587 * g + 0.114 * b;
      lum = (lum - 128) * 1.35 + 128;

      // Interlaced scanline darkener
      if (isScanline) {
        lum *= 0.82;
      }
      // Moving CRT hum bar
      if (isMovingBar) {
        lum += 24;
      }

      // Analog digital noise grain
      const noise = (Math.random() - 0.5) * 20;
      lum = Math.min(255, Math.max(0, lum + noise));

      // Slight green phosphor tint
      data[i] = Math.min(255, lum * 0.9);
      data[i + 1] = Math.min(255, lum * 1.05);
      data[i + 2] = Math.min(255, lum * 0.9);
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Real-Time CCTV HUD Overlay
  ctx.save();
  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 4;

  // Top Left: Recording tag
  const isBlink = Math.floor(timestampMs / 500) % 2 === 0;
  if (isBlink) {
    ctx.fillStyle = "#ff3333";
    ctx.beginPath();
    ctx.arc(20, 22, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillText("CAM-01 [REC]", 32, 26);
  ctx.fillText("LOC: TOKYO-STN 04 // 24FPS", 32, 42);

  // Bottom Left: Real-Time Timestamp
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 8);
  ctx.fillText(`${dateStr} ${timeStr} JST`, 20, height - 18);

  // Top Right: VHS Play Tag
  ctx.textAlign = "right";
  ctx.fillText("SP 0:00:18", width - 20, 26);
  ctx.fillText("TAPE: METAL-IV", width - 20, 42);

  ctx.restore();
}

/**
 * Main Frame Processing Engine:
 * Reads source video/image, applies natural horizontal mirror,
 * and processes through chosen retro filter.
 */
export function renderRetroFrame(
  source: HTMLVideoElement | HTMLImageElement,
  targetCanvas: HTMLCanvasElement,
  mode: FilterMode,
  timestampMs: number = performance.now()
) {
  const ctx = targetCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  const w = targetCanvas.width;
  const h = targetCanvas.height;

  // Natural horizontal mirror
  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(source, 0, 0, w, h);
  ctx.restore();

  // Route to selected filter shader
  switch (mode) {
    case "GB 4-BIT":
      applyGameBoyDither(ctx, w, h);
      break;
    case "PS1 LOW-POLY":
      applyPS1LowPoly(ctx, targetCanvas, w, h);
      break;
    case "THERMAL RECEIPT":
      applyThermalReceipt(ctx, w, h);
      break;
    case "CCTV 2004":
      applyCCTV2004(ctx, w, h, timestampMs);
      break;
  }
}

