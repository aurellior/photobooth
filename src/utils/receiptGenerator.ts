// Dynamic Thermal Receipt Canvas Generator & Video/GIF Export Engine

import { CapturedPhoto, ReceiptStamp, StripLayout, PlayerMode } from "@/types/booth";

export interface ReceiptGeneratorOptions {
  photos: CapturedPhoto[];
  stamps: ReceiptStamp[];
  layout: StripLayout;
  playerMode: PlayerMode;
  receiptNumber?: string;
  contrastPercent?: number;
  frameIndexOffset?: number; // for animated burst generation
}

// Helper to load image as HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Render High-Resolution Receipt Canvas (e.g. 600px width x dynamic height)
 */
export async function renderReceiptCanvas(
  options: ReceiptGeneratorOptions
): Promise<HTMLCanvasElement> {
  const {
    photos,
    stamps,
    layout,
    playerMode,
    receiptNumber = "#00492",
    contrastPercent = 180,
    frameIndexOffset = 0,
  } = options;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas 2d context");

  // Determine canvas dimensions based on layout
  const width = 600;
  let height = 1500;

  if (layout === "4-STRIP VERTICAL") {
    height = 1750;
  } else if (layout === "2x2 GRID") {
    height = 1350;
  } else if (layout === "SINGLE POLAROID") {
    height = 1250;
  }

  canvas.width = width;
  canvas.height = height;

  // 1. Thermal Paper Background (#fef9e7 warm thermal tone)
  ctx.fillStyle = "#fef9e7";
  ctx.fillRect(0, 0, width, height);

  // Subtle thermal paper noise / streaks
  ctx.fillStyle = "rgba(0, 0, 0, 0.02)";
  for (let i = 0; i < width; i += 30) {
    ctx.fillRect(i, 0, 2, height);
  }

  // 2. Receipt Header
  ctx.fillStyle = "#1a1917";
  ctx.textAlign = "center";

  // Arcade icon header
  ctx.font = "bold 24px 'Courier New', monospace";
  const mainTitle = playerMode === "2p" ? "CO-OP BOOTH 98" : "SOLO BOOTH 98";
  ctx.fillText(`🎮 ${mainTitle} 🎮`, width / 2, 50);

  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.fillStyle = "#454936";
  const subTitle =
    playerMode === "2p"
      ? "CO-OP BOOTH 98 // 2P LINKED"
      : "SOLO BOOTH 98 // 1P SESSION";
  ctx.fillText(subTitle, width / 2, 75);
  ctx.fillText("* * * ARCHIVAL KIOSK PRINT * * *", width / 2, 95);

  // Metadata row
  ctx.strokeStyle = "#8c887b";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(35, 110);
  ctx.lineTo(width - 35, 110);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = "12px 'Courier New', monospace";
  ctx.textAlign = "left";
  ctx.fillText(`RECEIPT: ${receiptNumber}`, 40, 130);
  ctx.textAlign = "right";
  ctx.fillText("TOKYO-NODE-04", width - 40, 130);

  const now = new Date();
  const dateStr = `OCT 24, 1998`;
  const timeStr = `21:45 EST`;
  ctx.textAlign = "left";
  ctx.fillText(`DATE: ${dateStr}`, 40, 148);
  ctx.textAlign = "right";
  ctx.fillText(`TIME: ${timeStr}`, width - 40, 148);

  ctx.textAlign = "left";
  ctx.font = "bold 12px 'Courier New', monospace";
  ctx.fillText(
    playerMode === "2p"
      ? "OPERATORS: P1 (YOU) + P2 (ALEX_98)"
      : "OPERATOR: P1 (SOLO_PILOT)",
    40,
    168
  );

  // Perforation dashed divider
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(35, 185);
  ctx.lineTo(width - 35, 185);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Render Captured Photos based on Layout
  let photoBottomY = 200;

  // Pre-load photo images (using burst frame if offset provided)
  const loadedPhotos: HTMLImageElement[] = [];
  for (let i = 0; i < 4; i++) {
    const photo = photos[i];
    let src = photo?.dataUrl;
    if (photo && photo.burstFrames && photo.burstFrames.length > 0) {
      const bIdx = frameIndexOffset % photo.burstFrames.length;
      src = photo.burstFrames[bIdx];
    }
    if (src) {
      try {
        const img = await loadImage(src);
        loadedPhotos.push(img);
      } catch {
        // Fallback placeholder
      }
    }
  }

  // Draw Layouts
  if (layout === "4-STRIP VERTICAL") {
    const photoW = 500;
    const photoH = 260;
    const startX = (width - photoW) / 2;
    let startY = 205;

    for (let i = 0; i < 4; i++) {
      const img = loadedPhotos[i];
      // Black photo border
      ctx.fillStyle = "#1a1917";
      ctx.fillRect(startX - 4, startY - 4, photoW + 8, photoH + 8);

      if (img) {
        ctx.save();
        ctx.filter = `contrast(${contrastPercent}%) brightness(95%)`;
        ctx.drawImage(img, startX, startY, photoW, photoH);
        ctx.restore();
      } else {
        ctx.fillStyle = "#163f15";
        ctx.fillRect(startX, startY, photoW, photoH);
      }

      // Stamp badge on frame
      ctx.fillStyle = "#1a1917";
      ctx.fillRect(startX + 4, startY + 4, 140, 20);
      ctx.fillStyle = "#fef9e7";
      ctx.font = "bold 11px 'Courier New', monospace";
      ctx.textAlign = "left";
      const opTag = photos[i]?.operator || (playerMode === "2p" ? "P1•P2 DUAL" : "P1 SOLO");
      ctx.fillText(`#0${i + 1} // ${opTag}`, startX + 8, startY + 18);

      ctx.fillRect(startX + photoW - 70, startY + photoH - 24, 66, 20);
      ctx.fillText(opTag, startX + photoW - 64, startY + photoH - 10);

      startY += photoH + 20;
    }
    photoBottomY = startY;
  } else if (layout === "2x2 GRID") {
    const photoW = 240;
    const photoH = 180;
    const gap = 20;
    const startX = (width - (photoW * 2 + gap)) / 2;
    let startY = 210;

    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const px = startX + col * (photoW + gap);
      const py = startY + row * (photoH + gap);

      ctx.fillStyle = "#1a1917";
      ctx.fillRect(px - 4, py - 4, photoW + 8, photoH + 8);

      const img = loadedPhotos[i];
      if (img) {
        ctx.save();
        ctx.filter = `contrast(${contrastPercent}%) brightness(95%)`;
        ctx.drawImage(img, px, py, photoW, photoH);
        ctx.restore();
      } else {
        ctx.fillStyle = "#163f15";
        ctx.fillRect(px, py, photoW, photoH);
      }

      ctx.fillStyle = "#1a1917";
      ctx.fillRect(px + 4, py + 4, 90, 18);
      ctx.fillStyle = "#fef9e7";
      ctx.font = "bold 10px 'Courier New', monospace";
      ctx.fillText(`#0${i + 1} // 2x2`, px + 8, py + 17);
    }
    photoBottomY = startY + 2 * (photoH + gap) + 10;
  } else {
    // SINGLE POLAROID style
    const polaroidW = 500;
    const polaroidH = 460;
    const px = (width - polaroidW) / 2;
    const py = 210;

    // Classic Polaroid White Border
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(px, py, polaroidW, polaroidH);
    ctx.strokeStyle = "#1a1917";
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, polaroidW, polaroidH);

    // Grid of 4 within polaroid
    const innerW = 460;
    const innerH = 340;
    const ix = px + 20;
    const iy = py + 20;

    ctx.fillStyle = "#1a1917";
    ctx.fillRect(ix, iy, innerW, innerH);

    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const subW = (innerW - 8) / 2;
      const subH = (innerH - 8) / 2;
      const sx = ix + 2 + col * (subW + 4);
      const sy = iy + 2 + row * (subH + 4);

      const img = loadedPhotos[i];
      if (img) {
        ctx.save();
        ctx.filter = `contrast(${contrastPercent}%) brightness(95%)`;
        ctx.drawImage(img, sx, sy, subW, subH);
        ctx.restore();
      }
    }

    // Hand-written Polaroid style caption
    ctx.fillStyle = "#1a1917";
    ctx.font = "bold 18px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("MEMORIES IN THE BOOTH '98", width / 2, py + polaroidH - 35);

    photoBottomY = py + polaroidH + 20;
  }

  // 4. Render User-Placed Stickers
  stamps.forEach((stamp) => {
    ctx.save();
    // Convert relative % to canvas coordinates
    const sx = (stamp.left / 100) * width;
    const sy = (stamp.top / 100) * height;

    ctx.translate(sx, sy);
    ctx.rotate((stamp.rotate * Math.PI) / 180);

    const scale = stamp.scale || 1.3;
    ctx.scale(scale, scale);

    if (stamp.stamp.startsWith("[")) {
      const text = stamp.stamp.replace(/[[\]]/g, "");
      ctx.fillStyle = "#1a1917";
      ctx.fillRect(-35, -14, 70, 28);
      ctx.fillStyle = "#fef9e7";
      ctx.font = "bold 13px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText(text, 0, 5);
    } else {
      ctx.font = "38px sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 4;
      ctx.fillText(stamp.stamp, 0, 10);
    }

    ctx.restore();
  });

  // 5. Itemized Receipt Lines (Funny Stats)
  let statsY = photoBottomY + 15;
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "#8c887b";
  ctx.beginPath();
  ctx.moveTo(35, statsY);
  ctx.lineTo(width - 35, statsY);
  ctx.stroke();
  ctx.setLineDash([]);

  statsY += 25;
  ctx.font = "13px 'Courier New', monospace";
  ctx.fillStyle = "#1a1917";

  const lines = [
    { label: "[01] VIBE CHECK: PASSED", val: "$0.00" },
    { label: "[02] NOSTALGIA OVERFLOW", val: "$0.00" },
    { label: "[03] CHAOS LEVEL: 99%", val: "FREE" },
    {
      label: "[04] CO-OP LINK STABILITY",
      val: playerMode === "2p" ? "100%" : "SOLO",
    },
  ];

  lines.forEach((l) => {
    ctx.textAlign = "left";
    ctx.fillText(l.label, 40, statsY);
    ctx.textAlign = "right";
    ctx.fillText(l.val, width - 40, statsY);
    statsY += 22;
  });

  statsY += 5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(35, statsY);
  ctx.lineTo(width - 35, statsY);
  ctx.stroke();
  ctx.setLineDash([]);

  statsY += 26;
  ctx.font = "bold 15px 'Courier New', monospace";
  ctx.textAlign = "left";
  ctx.fillText("TOTAL MEMORIES:", 40, statsY);
  ctx.textAlign = "right";
  ctx.fillText("INFINITE", width - 40, statsY);

  statsY += 20;

  // 6. Barcode & QR Code Section
  statsY += 15;
  const barcodeX = 40;
  const barcodeY = statsY;
  const barcodeW = 340;
  const barcodeH = 50;

  // Draw pixel barcode bars
  ctx.fillStyle = "#1a1917";
  const barPattern = [
    2, 4, 1, 3, 1, 5, 2, 4, 1, 3, 2, 5, 1, 4, 3, 2, 1, 4, 2, 3, 1, 5, 2, 4, 1,
    3, 1, 4, 2, 5, 1, 3, 2, 4,
  ];
  let curX = barcodeX;
  barPattern.forEach((w) => {
    ctx.fillRect(curX, barcodeY, w, barcodeH);
    curX += w + 2;
  });

  ctx.font = "10px 'Courier New', monospace";
  ctx.textAlign = "left";
  ctx.fillText("* 9804-00492-LINK *", barcodeX, barcodeY + barcodeH + 16);

  // Draw Mini QR Code Box
  const qrX = width - 110;
  const qrY = barcodeY;
  const qrSize = 70;

  ctx.fillStyle = "#1a1917";
  ctx.fillRect(qrX, qrY, qrSize, qrSize);
  ctx.fillStyle = "#fef9e7";
  const pSize = qrSize / 5;
  // 5x5 QR representation
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if ((r + c) % 2 === 0 || (r === 0 && c === 0) || (r === 4 && c === 4)) {
        ctx.fillRect(qrX + c * pSize, qrY + r * pSize, pSize, pSize);
      }
    }
  }

  ctx.fillStyle = "#1a1917";
  ctx.font = "bold 9px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText("SCAN 4 GIF", qrX + qrSize / 2, qrY + qrSize + 16);

  // 7. Footer Polite Message & Sawtooth bottom
  statsY = barcodeY + barcodeH + 45;
  ctx.textAlign = "center";
  ctx.font = "bold 11px 'Courier New', monospace";
  ctx.fillText("THANK YOU FOR VISITING CO-OP BOOTH 98!", width / 2, statsY);
  ctx.font = "10px 'Courier New', monospace";
  ctx.fillStyle = "#454936";
  ctx.fillText("KEEP STRIP IN A COOL, DRY CARTRIDGE SLOT.", width / 2, statsY + 18);

  return canvas;
}

/**
 * Export Receipt as High-Resolution PNG
 */
export async function downloadReceiptPNG(
  options: ReceiptGeneratorOptions,
  filename: string = `booth98_${Date.now()}.png`
) {
  const canvas = await renderReceiptCanvas(options);
  const dataUrl = canvas.toDataURL("image/png");

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Export 9:16 Vertical Video (WebM/MP4) ready for IG Story / TikTok
 * Generates an animated video cycling through the burst frames!
 */
export async function exportStoryVideo(
  options: ReceiptGeneratorOptions,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const storyWidth = 720;
  const storyHeight = 1280;

  const storyCanvas = document.createElement("canvas");
  storyCanvas.width = storyWidth;
  storyCanvas.height = storyHeight;
  const storyCtx = storyCanvas.getContext("2d");
  if (!storyCtx) throw new Error("Could not create story canvas context");

  const stream = storyCanvas.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3000000 });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }));
    };
  });

  recorder.start();

  // Animate through 6 burst steps (approx 3.6 seconds total loop)
  const totalFrames = 36;
  for (let f = 0; f < totalFrames; f++) {
    const burstOffset = Math.floor(f / 6) % 6;

    // Render receipt with burst offset
    const receiptCanvas = await renderReceiptCanvas({
      ...options,
      frameIndexOffset: burstOffset,
    });

    // Draw 9:16 background
    storyCtx.fillStyle = "#1d1c15";
    storyCtx.fillRect(0, 0, storyWidth, storyHeight);

    // Draw subtle 90s decorative background
    storyCtx.fillStyle = "#323129";
    storyCtx.font = "bold 16px 'Courier New', monospace";
    storyCtx.fillStyle = "#8bac0f";
    storyCtx.fillText("★ CO-OP BOOTH 98 ★", 30, 45);

    // Scale receipt to fit nicely inside the vertical story
    const scale = (storyHeight * 0.88) / receiptCanvas.height;
    const destW = receiptCanvas.width * scale;
    const destH = receiptCanvas.height * scale;
    const destX = (storyWidth - destW) / 2;
    const destY = (storyHeight - destH) / 2;

    // Drop shadow behind receipt
    storyCtx.shadowColor = "rgba(0,0,0,0.6)";
    storyCtx.shadowBlur = 20;
    storyCtx.drawImage(receiptCanvas, destX, destY, destW, destH);
    storyCtx.shadowColor = "transparent";

    if (onProgress) {
      onProgress(Math.round(((f + 1) / totalFrames) * 100));
    }

    // Wait ~100ms per frame
    await new Promise((r) => setTimeout(r, 100));
  }

  recorder.stop();
  return recordingPromise;
}

