"use client";

import React, { useState, useEffect, useRef } from "react";
import { PlayerMode, ReceiptStamp, CapturedPhoto, StripLayout } from "@/types/booth";
import { retroAudio } from "@/utils/retroAudio";
import { downloadReceiptPNG, exportStoryVideo } from "@/utils/receiptGenerator";
import confetti from "canvas-confetti";

interface ReceiptScreenProps {
  playerMode: PlayerMode;
  onPlayerModeChange: (mode: PlayerMode) => void;
  onTakeAnother: () => void;
  capturedPhotos: CapturedPhoto[];
  selectedLayout?: StripLayout;
}

const STICKER_PALETTE = [
  { icon: "⭐", label: "STAR" },
  { icon: "😊", label: "90s SMILE" },
  { icon: "❤️", label: "HEART" },
  { icon: "[COOL!]", label: "BUBBLE" },
  { icon: "👾", label: "INVADER" },
  { icon: "🔌", label: "LINK CABLE" },
  { icon: "[90s VIP]", label: "CLUB" },
];

export const ReceiptScreen: React.FC<ReceiptScreenProps> = ({
  playerMode,
  onPlayerModeChange,
  onTakeAnother,
  capturedPhotos,
  selectedLayout = "4-STRIP VERTICAL",
}) => {
  const [contrast, setContrast] = useState<number>(180);
  const [stamps, setStamps] = useState<ReceiptStamp[]>([]);
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);

  const [linkCopied, setLinkCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [exportingVideo, setExportingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  // Animated printing simulation state
  const [isPaperFed, setIsPaperFed] = useState(false);
  const [isGifPlaying, setIsGifPlaying] = useState<boolean>(true);
  const [burstFrameIdx, setBurstFrameIdx] = useState<number>(0);

  const receiptPaperRef = useRef<HTMLDivElement | null>(null);

  // Animated printer emergence on mount
  useEffect(() => {
    retroAudio.playThermalPrinter(2000);
    const timer = setTimeout(() => {
      setIsPaperFed(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Mini burst loop animation
  useEffect(() => {
    if (!isGifPlaying) return;
    const interval = setInterval(() => {
      setBurstFrameIdx((prev) => (prev + 1) % 6);
    }, 180);
    return () => clearInterval(interval);
  }, [isGifPlaying]);

  const handleConfetti = () => {
    retroAudio.playSuccess();
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ["#8bac0f", "#fd591e", "#1d1c15", "#fef9ed"],
      });
    } catch {}
  };

  // 1. Download High-Res PNG with user stickers
  const handleDownloadPNG = async () => {
    retroAudio.playPlasticClick();
    setDownloading(true);
    try {
      await downloadReceiptPNG({
        photos: capturedPhotos,
        stamps,
        layout: selectedLayout,
        playerMode,
        receiptNumber: "#00492-98",
        contrastPercent: contrast,
      });
      handleConfetti();
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloading(false);
    }
  };

  // 2. Export 9:16 Animated GIF / Vertical Video Loop
  const handleExportVideo = async () => {
    retroAudio.playPlasticClick();
    setExportingVideo(true);
    setVideoProgress(10);

    try {
      const progressTimer = setInterval(() => {
        setVideoProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 300);

      await exportStoryVideo({
        photos: capturedPhotos,
        layout: selectedLayout,
        playerMode,
        stamps,
        receiptNumber: "#00492-98",
        contrastPercent: contrast,
      });

      clearInterval(progressTimer);
      setVideoProgress(100);
      handleConfetti();
    } catch (err) {
      console.error("Export video error:", err);
    } finally {
      setTimeout(() => {
        setExportingVideo(false);
        setVideoProgress(0);
      }, 1000);
    }
  };

  // 3. Print Physical Via Bluetooth (simulated)
  const handlePrintThermal = () => {
    retroAudio.playThermalPrinter(2500);
    alert("Simulating Bluetooth ESC/POS Print Job Sent to 57mm Thermal Printer!");
  };

  // Sticker Placement Logic
  const handleAddStamp = (icon: string) => {
    retroAudio.playStamp();
    const newStamp: ReceiptStamp = {
      id: "stamp-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
      stamp: icon,
      left: 30 + Math.random() * 40,
      top: 15 + Math.random() * 60,
      rotate: (Math.random() - 0.5) * 30,
      scale: 1,
    };
    setStamps((prev) => [...prev, newStamp]);
    setSelectedStampId(newStamp.id);
  };

  const handleClearStamps = () => {
    retroAudio.playPlasticClick();
    setStamps([]);
    setSelectedStampId(null);
  };

  const handleCopyLink = () => {
    retroAudio.playCountdownBeep(0);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("https://booth98.link/r/00492");
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col font-mono text-[#1d1c15] select-none p-2 sm:p-4">
      {/* Top System Telemetry Bar (Hardware Bevel) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f2eee1] p-2.5 rounded-lg shadow-xs mb-4 border border-[#c5c9b1]/60">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-[#ae3200] text-white font-bold text-[9px] uppercase tracking-widest shadow-xs rounded">
            UNIT: CB-98-PRN
          </span>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#8bac0f] animate-ping" />
            <span className="text-[10px] font-bold text-[#516600] uppercase">
              HEAD HEATING: 142°C [OPTIMAL]
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-[#454936] uppercase tracking-wider hidden md:inline">
            PAPER ROLL REMAINING: 88.4M [B&amp;W DITHER]
          </span>
          <div className="flex items-center gap-1 bg-[#ece8dc] px-2 py-0.5 rounded border border-[#c5c9b1]/40">
            <span className="w-2.5 h-1.5 bg-[#516600]" />
            <span className="w-2.5 h-1.5 bg-[#516600]" />
            <span className="w-2.5 h-1.5 bg-[#516600]" />
            <span className="w-2.5 h-1.5 bg-[#c5c9b1]" />
            <span className="text-[9px] text-[#1d1c15] ml-1 font-bold">FEED READY</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Stage (Receipt) + Right Deck (Controls) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT / CENTER STAGE: Thermal Slit & Spilling Receipt (Cols 1-7) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Hardware Thermal Dispenser Mouth / Slit Chassis */}
          <div className="w-full max-w-[430px] bg-[#323129] text-[#f5f1e4] p-2 rounded-t-xl shadow-xl flex flex-col items-center relative z-20 border border-[#1d1c15]">
            <div className="w-full flex items-center justify-between px-2 text-[#c5c9b1] text-[9px] uppercase mb-1">
              <span className="flex items-center gap-1 text-[#ffb59e]">
                <span className="material-symbols-outlined text-[13px] text-[#ae3200]">
                  warning
                </span>
                DO NOT PULL WHILE PRINTING
              </span>
              <span>SLOT #01 FEED</span>
            </div>
            {/* Dark Machine Slit with LED Warning line */}
            <div className="w-full h-3 bg-[#1d1c15] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[#ae3200]/20 animate-pulse" />
              <div className="w-32 h-[1px] bg-[#fd591e] shadow-[0_0_6px_#fd591e]" />
            </div>
          </div>

          {/* Continuous Realistic Thermal Receipt Paper with Animated Roll Out */}
          <div
            className={`w-full max-w-[420px] relative -mt-1 group transition-all duration-700 ease-out origin-top ${
              isPaperFed
                ? "translate-y-0 opacity-100 scale-y-100"
                : "-translate-y-12 opacity-0 scale-y-75"
            }`}
          >
            {/* Top Perforation Saw-Tooth Mask Effect */}
            <div
              className="w-full h-3 bg-[#fef9e7] overflow-hidden"
              style={{
                clipPath:
                  "polygon(0% 100%, 2% 0%, 4% 100%, 6% 0%, 8% 100%, 10% 0%, 12% 100%, 14% 0%, 16% 100%, 18% 0%, 20% 100%, 22% 0%, 24% 100%, 26% 0%, 28% 100%, 30% 0%, 32% 100%, 34% 0%, 36% 100%, 38% 0%, 40% 100%, 42% 0%, 44% 100%, 46% 0%, 48% 100%, 50% 0%, 52% 100%, 54% 0%, 56% 100%, 58% 0%, 60% 100%, 62% 0%, 64% 100%, 66% 0%, 68% 100%, 70% 0%, 72% 100%, 74% 0%, 76% 100%, 78% 0%, 80% 100%, 82% 0%, 84% 100%, 86% 0%, 88% 100%, 90% 0%, 92% 100%, 94% 0%, 96% 100%, 98% 0%, 100% 100%)",
              }}
            />

            {/* Main Receipt Body (Warm paper texture with hard shadow) */}
            <div
              ref={receiptPaperRef}
              id="receipt-paper"
              className="w-full bg-[#fef9e7] text-[#1a1917] px-5 sm:px-6 pt-3 pb-8 shadow-[0_12px_30px_rgba(0,0,0,0.18)] relative"
            >
              {/* Faint Thermal Streaks Vertical Watermark Overlay */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.8)_20%,transparent_21%,transparent_60%,rgba(0,0,0,0.5)_61%,transparent_62%)] bg-[length:40px_100%]" />

              {/* Receipt Header */}
              <div className="text-center flex flex-col items-center mb-3">
                <div className="flex items-center justify-center gap-1 text-[#1a1917] mb-1">
                  <span className="material-symbols-outlined text-[16px]">videogame_asset</span>
                  <span className="font-bold text-base sm:text-lg uppercase tracking-tight">
                    {playerMode === "2p" ? "CO-OP BOOTH 98" : "SOLO BOOTH 98"}
                  </span>
                  <span className="material-symbols-outlined text-[16px]">videogame_asset</span>
                </div>
                <p className="text-[9px] uppercase tracking-widest text-[#454936]">
                  {playerMode === "2p"
                    ? "CO-OP BOOTH 98 // 2P LINKED"
                    : "SOLO BOOTH 98 // 1P SESSION"}
                </p>
                <div className="w-full text-center tracking-tight text-[10px] text-[#454936] my-1">
                  * * * ARCHIVAL KIOSK PRINT * * *
                </div>
                <div className="w-full flex justify-between text-[9px] text-[#454936] mt-1 pt-1 border-t border-dashed border-[#8c887b]">
                  <span>RECEIPT: #00492</span>
                  <span>TOKYO-NODE-04</span>
                </div>
                <div className="w-full flex justify-between text-[9px] text-[#454936]">
                  <span>DATE: OCT 24, 1998</span>
                  <span>TIME: 21:45 EST</span>
                </div>
                <div className="w-full text-left text-[9px] font-bold text-[#1a1917] mt-1">
                  {playerMode === "2p"
                    ? "OPERATORS: P1 (YOU) + P2 (ALEX_98)"
                    : "OPERATOR: P1 (SOLO_PILOT)"}
                </div>
              </div>

              {/* Perforated Rule */}
              <div className="w-full text-center text-xs text-[#8c887b] tracking-[0.25em] select-none my-2 font-mono">
                - - - - - - - - - - - - - - - - - - -
              </div>

              {/* 4-Frame Vertical Photo Strip */}
              <div
                className={`relative my-2 ${
                  selectedLayout === "2x2 GRID"
                    ? "grid grid-cols-2 gap-2"
                    : "flex flex-col gap-2.5"
                }`}
              >
                {capturedPhotos && capturedPhotos.length > 0 ? (
                  capturedPhotos.map((photo, idx) => {
                    const burstFrame =
                      isGifPlaying && photo.burstFrames && photo.burstFrames.length > 0
                        ? photo.burstFrames[burstFrameIdx % photo.burstFrames.length]
                        : photo.dataUrl;

                    return (
                      <div
                        key={idx}
                        className={`relative bg-[#1a1917] p-1 shadow-sm overflow-hidden group ${
                          selectedLayout === "SINGLE POLAROID" ? "pb-6" : ""
                        }`}
                      >
                        <div className="relative w-full aspect-[4/3] bg-[#2d2c27] overflow-hidden flex items-center justify-center">
                          <img
                            src={burstFrame}
                            alt={`Photo #${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            style={{
                              filter: `contrast(${contrast}%) brightness(95%)`,
                            }}
                          />
                          {/* Dot-matrix scan overlay */}
                          <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.5)_1px,transparent_1px)] bg-[size:3px_3px] pointer-events-none opacity-40" />

                          {/* Corner Index Stamp */}
                          <span className="absolute top-1 left-1.5 text-[8px] text-[#fef9e7] bg-[#1a1917] px-1 py-0.5 leading-none">
                            #{String(idx + 1).padStart(2, "0")} // CAPTURE.RAW
                          </span>
                          <span className="absolute bottom-1 right-1.5 text-[8px] text-[#fef9e7] bg-[#1a1917] px-1 py-0.5 leading-none">
                            {playerMode === "2p" ? "P1•P2" : "SOLO"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Placeholder sample 4 frames
                  Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="relative bg-[#1a1917] p-1 shadow-sm overflow-hidden"
                    >
                      <div className="relative w-full aspect-[4/3] bg-[#2d2c27] overflow-hidden flex items-center justify-center text-[#fef9e7]">
                        <span className="text-[10px] font-bold">
                          [RAW PHOTO #{idx + 1} PLACEHOLDER]
                        </span>
                      </div>
                    </div>
                  ))
                )}

                {/* Placed Stamps Layer */}
                <div className="absolute inset-0 pointer-events-none z-20">
                  {stamps.map((stamp) => (
                    <div
                      key={stamp.id}
                      style={{
                        position: "absolute",
                        left: `${stamp.left}%`,
                        top: `${stamp.top}%`,
                        transform: `translate(-50%, -50%) rotate(${stamp.rotate}deg)`,
                      }}
                      className="text-2xl drop-shadow cursor-pointer pointer-events-auto"
                      onClick={() => setSelectedStampId(stamp.id)}
                      title="Click to select sticker"
                    >
                      {stamp.stamp.startsWith("[") ? (
                        <span className="bg-[#1d1c15] text-[#fef9ed] px-1.5 py-0.5 rounded text-[10px] font-bold border border-[#c5c9b1]">
                          {stamp.stamp.replace(/[[\]]/g, "")}
                        </span>
                      ) : (
                        stamp.stamp
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Perforated Marker */}
              <div className="w-full text-center text-xs text-[#8c887b] tracking-[0.25em] select-none my-2 font-mono">
                - - - - - - - - - - - - - - - - - - -
              </div>

              {/* Itemized Fun Memory Receipt Printout */}
              <div className="text-[11px] flex flex-col gap-1 text-[#1a1917] my-3">
                <div className="flex justify-between">
                  <span>[01] SYNCED BURST x4</span>
                  <span className="font-bold">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span>[02] NOSTALGIA OVERFLOW</span>
                  <span className="font-bold">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span>[03] CHAOS LEVEL: 99%</span>
                  <span className="font-bold text-[#ae3200]">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span>[04] CO-OP LINK STABILITY</span>
                  <span className="font-bold">100%</span>
                </div>
                <div className="pt-1 mt-1 border-t border-dashed border-[#8c887b] flex justify-between text-xs font-bold">
                  <span>TOTAL MEMORIES</span>
                  <span>INFINITE</span>
                </div>
              </div>

              {/* Perforated Rule */}
              <div className="w-full text-center text-xs text-[#8c887b] tracking-[0.25em] select-none my-1 font-mono">
                =====================================
              </div>

              {/* Barcode & QR Code Section */}
              <div className="flex items-center justify-between gap-2 pt-2">
                {/* 1-Bit Barcode */}
                <div className="flex flex-col items-start gap-1 flex-1">
                  <div className="w-full h-10 flex items-stretch gap-[2px] bg-[#fef9e7] p-1 overflow-hidden">
                    <div className="w-1 bg-[#1a1917]" />
                    <div className="w-2 bg-[#1a1917]" />
                    <div className="w-0.5 bg-[#1a1917]" />
                    <div className="w-1.5 bg-[#1a1917]" />
                    <div className="w-0.5 bg-[#1a1917]" />
                    <div className="w-3 bg-[#1a1917]" />
                    <div className="w-1 bg-[#1a1917]" />
                    <div className="w-2.5 bg-[#1a1917]" />
                    <div className="w-1 bg-[#1a1917]" />
                    <div className="w-0.5 bg-[#1a1917]" />
                    <div className="w-2 bg-[#1a1917]" />
                    <div className="w-1.5 bg-[#1a1917]" />
                    <div className="w-0.5 bg-[#1a1917]" />
                    <div className="w-2 bg-[#1a1917]" />
                    <div className="w-3 bg-[#1a1917]" />
                    <div className="w-1 bg-[#1a1917]" />
                    <div className="w-2 bg-[#1a1917]" />
                    <div className="w-0.5 bg-[#1a1917]" />
                    <div className="w-1 bg-[#1a1917]" />
                    <div className="w-3 bg-[#1a1917]" />
                    <div className="w-1 bg-[#1a1917]" />
                  </div>
                  <span className="text-[8px] tracking-widest text-[#454936]">
                    * 9804-00492-LINK *
                  </span>
                </div>

                {/* 1-Bit Pixel QR Box */}
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-12 h-12 p-1 bg-[#1a1917] flex items-center justify-center">
                    <div className="w-full h-full bg-[#fef9e7] p-0.5 grid grid-cols-5 grid-rows-5 gap-0.5">
                      <div className="bg-[#1a1917]" />
                      <div className="bg-[#1a1917]" />
                      <div className="bg-[#1a1917]" />
                      <div className="bg-[#fef9e7]" />
                      <div className="bg-[#1a1917]" />
                      <div className="bg-[#1a1917]" />
                      <div className="bg-[#fef9e7]" />
                      <div className="bg-[#1a1917]" />
                      <div className="bg-[#1a1917]" />
                      <div className="bg-[#1a1917]" />
                      <div className="bg-[#1a1917]" />
                      <div className="bg-[#1a1917]" />
                      <div className="bg-[#fef9e7]" />
                      <div className="bg-[#1a1917]" />
                      <div className="bg-[#fef9e7]" />
                      <div className="bg-[#fef9e7]" />
                      <div className="bg-[#1a1917]" />
                      <div className="bg-[#1a1917]" />
                      <div className="bg-[#fef9e7]" />
                      <div className="bg-[#1a1917]" />
                      <div className="bg-[#1a1917]" />
                      <div className="bg-[#fef9e7]" />
                      <div className="bg-[#1a1917]" />
                      <div className="bg-[#1a1917]" />
                      <div className="bg-[#1a1917]" />
                    </div>
                  </div>
                  <span className="text-[8px] text-[#454936] uppercase">SCAN FOR GIF</span>
                </div>
              </div>

              {/* Footer Notice */}
              <div className="mt-4 pt-2 border-t border-dashed border-[#8c887b] text-center flex flex-col gap-0.5">
                <p className="text-[10px] uppercase font-bold text-[#1a1917]">
                  THANK YOU FOR VISITING CO-OP BOOTH 98!
                </p>
                <p className="text-[8px] text-[#454936] tracking-wider">
                  KEEP STRIP IN A COOL, DRY CARTRIDGE SLOT.
                </p>
                <p className="text-[8px] text-[#757964] mt-0.5">
                  FEED ID: #TRP-88904-X • PRINTED VIA HEATED HEAD
                </p>
              </div>
            </div>

            {/* Bottom Saw-Tooth Cut Edge */}
            <div
              className="w-full h-3 bg-[#fef9e7] overflow-hidden -mt-[1px] shadow-[0_6px_10px_rgba(0,0,0,0.15)]"
              style={{
                clipPath:
                  "polygon(0% 0%, 2% 100%, 4% 0%, 6% 100%, 8% 0%, 10% 100%, 12% 0%, 14% 100%, 16% 0%, 18% 100%, 20% 0%, 22% 100%, 24% 0%, 26% 100%, 28% 0%, 30% 100%, 32% 0%, 34% 100%, 36% 0%, 38% 100%, 40% 0%, 42% 100%, 44% 0%, 46% 100%, 48% 0%, 50% 100%, 52% 0%, 54% 100%, 56% 0%, 58% 100%, 60% 0%, 62% 100%, 64% 0%, 66% 100%, 68% 0%, 70% 100%, 72% 0%, 74% 100%, 76% 0%, 78% 100%, 80% 0%, 82% 100%, 84% 0%, 86% 100%, 88% 0%, 90% 100%, 92% 0%, 94% 100%, 96% 0%, 98% 100%, 100% 0%)",
              }}
            />
          </div>
        </div>

        {/* RIGHT SIDE: Tactile Retro Hardware Action Deck & Sticker Drawer (Cols 8-12) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Hardware Action Station Enclosure */}
          <div className="bg-[#f2eee1] p-4 rounded-xl shadow-md border border-[#c5c9b1]">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#e6e2d6]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#ae3200] text-[20px]">
                  output
                </span>
                <span className="font-bold text-xs uppercase text-[#1d1c15]">OUTPUT DECK</span>
              </div>
              <span className="text-[9px] text-[#516600] uppercase font-bold tracking-widest bg-[#ece8dc] px-2 py-0.5 rounded border border-[#c5c9b1]/60">
                READY [3/3]
              </span>
            </div>

            {/* Mode Switcher */}
            <div className="mb-3 p-1 bg-[#ece8dc] rounded-lg flex items-center gap-1 border border-[#c5c9b1] shadow-inner">
              <button
                onClick={() => onPlayerModeChange("1p")}
                className={`flex-1 py-1 px-2 rounded text-[9px] uppercase transition-all flex items-center justify-center gap-1 cursor-pointer font-bold ${
                  playerMode === "1p"
                    ? "bg-[#516600] text-white shadow-xs"
                    : "text-[#454936] hover:text-[#1d1c15]"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">person</span>
                <span>[ 1P SOLO ]</span>
              </button>
              <button
                onClick={() => onPlayerModeChange("2p")}
                className={`flex-1 py-1 px-2 rounded text-[9px] uppercase transition-all flex items-center justify-center gap-1 cursor-pointer font-bold ${
                  playerMode === "2p"
                    ? "bg-[#516600] text-white shadow-xs"
                    : "text-[#454936] hover:text-[#1d1c15]"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">group</span>
                <span>[ 2P LINKED ]</span>
              </button>
            </div>

            {/* Hardware Buttons Stack */}
            <div className="flex flex-col gap-2.5">
              {/* 1. Primary Action: DOWNLOAD PNG STRIP */}
              <button
                onClick={handleDownloadPNG}
                disabled={downloading}
                className="w-full bg-[#fd591e] hover:bg-[#ae3200] active:translate-y-1 transition-all p-3 rounded-lg shadow-[0_4px_0_#852400] active:shadow-none flex items-center justify-between text-white cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-black/20 rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">save</span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-xs uppercase tracking-tight leading-tight">
                      {downloading ? "GENERATING STRIP..." : "DOWNLOAD PNG STRIP"}
                    </span>
                    <span className="text-[8px] text-white/80 uppercase">
                      LOSSLESS 1-BIT ARCHIVE (300 DPI)
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>

              {/* 2. EXPORT ANIMATED GIF LOOP */}
              <button
                onClick={handleExportVideo}
                disabled={exportingVideo}
                className="w-full bg-[#323129] hover:bg-[#1d1c15] active:translate-y-1 transition-all p-3 rounded-lg shadow-[0_4px_0_#1d1c15] active:shadow-none flex items-center justify-between text-[#f5f1e4] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/10 rounded flex items-center justify-center text-[#ccf157]">
                    <span className="material-symbols-outlined text-[20px]">slow_motion_video</span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-xs uppercase tracking-tight leading-tight">
                      {exportingVideo ? `EXPORTING ${videoProgress}%` : "EXPORT ANIMATED GIF / VIDEO"}
                    </span>
                    <span className="text-[8px] text-[#c5c9b1] uppercase">
                      4-FRAME BURST MOTION CASSETTE (9:16)
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[20px] text-[#ccf157]">
                  play_circle
                </span>
              </button>

              {/* 3. PRINT PHYSICAL VIA BLUETOOTH */}
              <button
                onClick={handlePrintThermal}
                className="w-full bg-[#ece8dc] hover:bg-[#e6e2d6] active:translate-y-1 transition-all p-3 rounded-lg shadow-[0_4px_0_#c5c9b1] active:shadow-none flex items-center justify-between text-[#1d1c15] cursor-pointer border border-[#c5c9b1]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#e6e2d6] rounded flex items-center justify-center text-[#3f6839]">
                    <span className="material-symbols-outlined text-[20px]">print</span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-xs uppercase tracking-tight leading-tight">
                      PRINT PHYSICAL VIA BLUETOOTH
                    </span>
                    <span className="text-[8px] text-[#454936] uppercase">
                      ESC/POS • PAPERANG • CAT PRINTER
                    </span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 bg-[#f2eee1] rounded text-[8px] text-[#3f6839] font-bold uppercase border border-[#c5c9b1]/60">
                  BLE READY
                </span>
              </button>

              {/* 4. TAKE ANOTHER PHOTO */}
              <button
                onClick={onTakeAnother}
                className="w-full bg-[#f8f3e7] hover:bg-[#e6e2d6] active:translate-y-1 transition-all p-2 rounded-lg shadow-[0_3px_0_#c5c9b1] active:shadow-none flex items-center justify-center gap-2 text-[#1d1c15] cursor-pointer border border-[#c5c9b1]"
              >
                <span className="material-symbols-outlined text-[18px] text-[#ae3200]">
                  restart_alt
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold">
                  TAKE ANOTHER PHOTO // NEW ROLL
                </span>
              </button>
            </div>
          </div>

          {/* Interactive Sticker Drawer / Y2K Pixel Stamp Tray */}
          <div className="bg-[#f2eee1] p-4 rounded-xl shadow-md border border-[#c5c9b1] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#516600] text-[18px]">brush</span>
                <span className="font-bold text-xs uppercase text-[#1d1c15]">STAMP TRAY</span>
              </div>
              <span className="text-[8px] text-[#454936] uppercase">CLICK TO STAMP RECEIPT</span>
            </div>

            {/* Stamp Buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {STICKER_PALETTE.map((st, i) => (
                <button
                  key={i}
                  onClick={() => handleAddStamp(st.icon)}
                  className="flex flex-col items-center justify-center p-1.5 bg-[#fef9ed] hover:bg-white rounded shadow-[0_2px_0_#c5c9b1] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <span className="text-lg">
                    {st.icon.startsWith("[") ? (
                      <span className="text-[9px] font-bold bg-[#323129] text-white px-1 py-0.5 rounded">
                        {st.label}
                      </span>
                    ) : (
                      st.icon
                    )}
                  </span>
                  <span className="text-[8px] mt-0.5 uppercase text-[#454936]">{st.label}</span>
                </button>
              ))}
              <button
                onClick={handleClearStamps}
                className="flex flex-col items-center justify-center p-1.5 bg-[#ece8dc] hover:bg-[#ffdad6] text-[#ba1a1a] rounded shadow-[0_2px_0_#c5c9b1] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                title="Clear all stamps"
              >
                <span className="material-symbols-outlined text-[16px]">ink_eraser</span>
                <span className="text-[8px] mt-0.5 uppercase">CLEAR</span>
              </button>
            </div>

            {/* Dithering Contrast Slider Control */}
            <div className="bg-[#f8f3e7] p-2 rounded-lg flex flex-col gap-1 border border-[#c5c9b1]/60">
              <div className="flex justify-between items-center text-[#1d1c15]">
                <span className="text-[9px] uppercase font-bold">THERMAL DITHER CONTRAST</span>
                <span className="text-[9px] bg-[#f2eee1] px-1.5 py-0.5 rounded text-[#516600] font-bold border border-[#c5c9b1]/40">
                  {contrast}%
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="260"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-[#516600] h-1.5 bg-[#e6e2d6] rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[8px] text-[#454936]">
                <span>[LIGHT TAPE]</span>
                <span>[HEAVY CRUNCH]</span>
              </div>
            </div>

            {/* Share Link Direct Copy Box */}
            <div className="flex flex-col gap-1">
              <label className="text-[8px] uppercase text-[#454936]">QUICK MEMORY LINK:</label>
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-[#c5c9b1] shadow-inner">
                <span className="material-symbols-outlined text-[16px] text-[#454936] ml-1">
                  link
                </span>
                <input
                  type="text"
                  readOnly
                  value="booth98.link/r/00492"
                  className="w-full bg-transparent text-[10px] text-[#1d1c15] outline-none font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-2 py-0.5 bg-[#f2eee1] hover:bg-[#516600] hover:text-white active:bg-[#8bac0f] text-[#1d1c15] text-[9px] uppercase rounded transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                >
                  {linkCopied ? "COPIED!" : "COPY"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
