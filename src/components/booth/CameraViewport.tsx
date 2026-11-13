"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { PlayerMode, FilterMode } from "@/types/booth";
import { useWebcam } from "@/hooks/useWebcam";
import { renderRetroFrame } from "@/utils/retroFilters";
import { ConnectionStatus } from "@/hooks/useCoopRoom";

export interface CameraViewportHandle {
  captureP1Frame: () => string | null;
  captureP2Frame: () => string | null;
  captureCombinedFrame: () => string | null;
}

interface CameraViewportProps {
  playerMode: PlayerMode;
  onPlayerModeChange: (mode: PlayerMode) => void;
  activeFilter: FilterMode;
  currentShot: number;
  totalShots?: number;
  countdown: number | null;
  onSnap?: () => void;
  // 2P Multiplayer props
  remoteStream?: MediaStream | null;
  connectionStatus?: ConnectionStatus;
  pingMs?: number;
  isEstafet?: boolean;
}

export const CameraViewport = forwardRef<CameraViewportHandle, CameraViewportProps>(
  (
    {
      playerMode,
      onPlayerModeChange,
      activeFilter,
      currentShot,
      totalShots = 4,
      countdown,
      remoteStream,
      connectionStatus = "IDLE",
      pingMs = 14,
      isEstafet = false,
    },
    ref
  ) => {
    const { videoRef, isReady, error, retry } = useWebcam();
    const canvasP1Ref = useRef<HTMLCanvasElement | null>(null);

    // P2 Remote Video & Canvas
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const canvasP2Ref = useRef<HTMLCanvasElement | null>(null);

    const animationFrameRef = useRef<number | null>(null);
    const [timestampText, setTimestampText] = useState<string>("1998-10-24 21:42:08 JST");

    // Connect remoteStream to hidden video element
    useEffect(() => {
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {});
      }
    }, [remoteStream]);

    // Update real-time clock timestamp
    useEffect(() => {
      const updateClock = () => {
        const now = new Date();
        const y = 1998;
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const ss = String(now.getSeconds()).padStart(2, "0");
        setTimestampText(`${y}-${m}-${d} ${hh}:${mm}:${ss} JST`);
      };
      updateClock();
      const timer = setInterval(updateClock, 1000);
      return () => clearInterval(timer);
    }, []);

    // Expose capture methods to parent
    useImperativeHandle(ref, () => ({
      captureP1Frame: () => {
        if (canvasP1Ref.current) {
          return canvasP1Ref.current.toDataURL("image/png");
        }
        return null;
      },
      captureP2Frame: () => {
        if (canvasP2Ref.current) {
          return canvasP2Ref.current.toDataURL("image/png");
        }
        return null;
      },
      captureCombinedFrame: () => {
        const p1Canvas = canvasP1Ref.current;
        const p2Canvas = canvasP2Ref.current;
        if (!p1Canvas) return null;

        const w = p1Canvas.width;
        const h = p1Canvas.height;

        const comp = document.createElement("canvas");
        comp.width = w * 2;
        comp.height = h;
        const ctx = comp.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(p1Canvas, 0, 0, w, h);
        if (p2Canvas) {
          ctx.drawImage(p2Canvas, w, 0, w, h);
        } else {
          ctx.drawImage(p1Canvas, w, 0, w, h);
        }
        return comp.toDataURL("image/png");
      },
    }));

    // 60fps render loop with retroFilters
    useEffect(() => {
      let active = true;

      const loop = () => {
        if (!active) return;

        // Render P1
        if (videoRef.current && canvasP1Ref.current && isReady) {
          renderRetroFrame(videoRef.current, canvasP1Ref.current, activeFilter);
        }

        // Render P2 if 2P mode
        if (playerMode === "2p") {
          if (remoteVideoRef.current && canvasP2Ref.current && remoteStream) {
            renderRetroFrame(remoteVideoRef.current, canvasP2Ref.current, activeFilter);
          } else if (canvasP2Ref.current && canvasP1Ref.current) {
            const ctx2 = canvasP2Ref.current.getContext("2d");
            if (ctx2) {
              ctx2.drawImage(canvasP1Ref.current, 0, 0);
            }
          }
        }

        animationFrameRef.current = requestAnimationFrame(loop);
      };

      animationFrameRef.current = requestAnimationFrame(loop);

      return () => {
        active = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isReady, activeFilter, playerMode, remoteStream, videoRef]);

    return (
      <div className="w-full flex-1 min-h-0 flex flex-col gap-1.5 select-none font-mono">
        {/* Hidden Video Elements */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="hidden"
          style={{ transform: "scaleX(-1)" }}
        />
        <video
          ref={remoteVideoRef}
          playsInline
          muted
          autoPlay
          className="hidden"
        />

        {/* ULTRA-COMPACT INTEGRATED SUB-BAR: Exposure Reel + Status + Countdown */}
        <div className="w-full bg-[#ece8dc] rounded border border-[#c5c9b1] px-2.5 py-1 flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-[#fd591e] animate-ping" />
              <span className="text-[9px] font-bold text-[#ae3200] tracking-wide uppercase">
                [{activeFilter}]
              </span>
            </div>
            <span className="text-[9px] text-[#454936] hidden sm:inline uppercase">
              PARALLEL SYNC: 60FPS
            </span>
          </div>

          {/* 4-Frame Reel Counter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-[#454936] font-bold uppercase hidden xs:inline">
              FILM STRIP:
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalShots }).map((_, idx) => {
                const shotNum = idx + 1;
                const isCurrent = currentShot === shotNum;
                const isPast = currentShot > shotNum;
                return (
                  <div
                    key={shotNum}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-1 transition-all ${
                      isCurrent
                        ? "bg-[#516600] text-white shadow-xs"
                        : isPast
                        ? "bg-[#8bac0f] text-[#2e3c00]"
                        : "bg-[#f2eee1] text-[#454936] border border-[#c5c9b1] opacity-75"
                    }`}
                  >
                    <span>#{String(shotNum).padStart(2, "0")}</span>
                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ccf157] animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compact Sync Clock HUD */}
          <div className="flex items-center gap-1.5 bg-[#23221c] text-[#f5f1e4] px-2 py-0.5 rounded border border-[#454936]">
            <span className="text-[8px] text-[#a4d39a] uppercase font-bold tracking-wider">
              AUTO-SNAP
            </span>
            <span className="text-xs font-bold text-[#fd591e] tracking-widest font-mono">
              {countdown !== null ? String(countdown).padStart(2, "0") : "--"}
            </span>
          </div>
        </div>

        {/* CRT DUAL MONITOR WELL (EXPANDED TO MAXIMUM AVAILABLE VERTICAL ROOM) */}
        <div className="w-full flex-1 min-h-0 bg-[#23221c] rounded-xl p-2 shadow-2xl border-4 border-[#323129] relative flex flex-col justify-between overflow-hidden">
          {/* CRT Top Bezel HUD */}
          <div className="flex items-center justify-between pb-1 text-[#f5f1e4] text-[9px] flex-shrink-0 z-20 border-b border-[#454936]/40">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#ba1a1a] text-white rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span className="font-bold tracking-wider uppercase text-[8px]">REC [LIVE]</span>
              </div>
              <span className="text-[#c5c9b1] uppercase font-mono text-[8px]">
                {timestampText}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[8px]">
              <span className="text-[#bfefb4] font-bold">
                LINK BUS: {playerMode === "2p" ? "FULL-DUPLEX" : "INTERNAL"}
              </span>
              <span className="text-[#ccf157]">LATENCY: {pingMs}ms</span>
              <span className="text-[#ffb59e]">FRAME BUFFER: OK</span>
            </div>
          </div>

          {/* Camera Error Display if Camera Denied */}
          {error && (
            <div className="my-4 p-4 bg-[#ba1a1a]/90 border border-white text-white rounded text-center flex flex-col items-center gap-2 z-30">
              <span className="material-symbols-outlined text-[32px]">videocam_off</span>
              <span className="font-bold text-xs uppercase">CAMERA ACCESS REQUIRED</span>
              <span className="text-[10px] text-white/80 max-w-md">{error.message}</span>
              <button
                onClick={retry}
                className="mt-1 px-3 py-1 bg-white text-[#ba1a1a] rounded font-bold text-[10px] uppercase shadow-sm cursor-pointer"
              >
                RETRY PERMISSION
              </button>
            </div>
          )}

          {/* Viewports Grid (Side-by-Side Dual Cam, Taller Portrait Framing) */}
          <div
            className={`flex-1 min-h-0 grid gap-2 relative my-1 items-stretch ${
              playerMode === "2p" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {/* P1 Viewport (Tokyo) */}
            <div className="relative rounded-lg overflow-hidden border-2 border-[#516600]/80 bg-[#161e00] flex flex-col justify-between shadow-inner h-full min-h-[220px] sm:min-h-[260px]">
              {/* Retro Dithered Background Preview Image */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAySqM6fDv7AeZ15-f4RDT_5TqCufI7E-mfDgRKFeg4vU94unJc9LjNpgBVU_HEeMppFXFeEJ7TzjNVhVIx_5xeW24pLkIlvmE9EE_6beP4vHC_hLiFNWZh-hjZYbSwJPatoXHwqeOB_or092-HwjlKhJxRWEB92mzm0BDUqdokXPPSd88U6Uv7xjJmTRmc2smsZyf3fxtD7mk2b_QeG-z5q4yc-ow8if1gsvk2nr0"
                alt="P1 Retro Preview"
                className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity contrast-125 filter grayscale"
              />
              <div className="absolute inset-0 bg-[#8bac0f]/20 mix-blend-color pointer-events-none" />

              {/* Canvas Render for P1 Live Feed */}
              <canvas
                ref={canvasP1Ref}
                width={320}
                height={240}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Scanline overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)",
                }}
              />

              {/* Top HUD Overlay */}
              <div className="relative z-10 flex items-center justify-between bg-black/75 px-2 py-0.5 text-white m-1 rounded border border-[#516600]">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#ccf157] text-[14px]">
                    videocam
                  </span>
                  <span className="text-[9px] font-bold text-[#ccf157] uppercase tracking-wider">
                    {playerMode === "2p" ? "P1 [YOU / TOKYO-01]" : "P1 [YOU / SOLO RETRO]"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] text-[#c5c9b1] font-mono">640x480</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ccf157] animate-pulse" />
                </div>
              </div>

              {/* Crosshairs / Reticle */}
              <div className="relative z-10 w-full flex-1 flex flex-col justify-between p-2 pointer-events-none">
                <div className="flex justify-between items-start">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-[#ccf157]" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-[#ccf157]" />
                </div>
                {/* Center Focus Box */}
                <div className="self-center flex flex-col items-center">
                  <div className="w-10 h-10 border border-[#ccf157]/60 rounded-sm flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-[#ccf157]" />
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-[#ccf157]" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-[#ccf157]" />
                </div>
              </div>

              {/* Bottom Sub-HUD */}
              <div className="relative z-10 flex items-center justify-between bg-black/75 px-2 py-0.5 text-white m-1 rounded border border-[#516600]">
                <span className="text-[8px] text-[#ccf157] font-bold uppercase">
                  [TX ACTIVE] GAIN: +6dB
                </span>
                <span className="text-[8px] text-[#c5c9b1] uppercase font-mono">
                  160x144 DITHER
                </span>
              </div>
            </div>

            {/* P2 Viewport (Osaka) - only in 2P mode */}
            {playerMode === "2p" && (
              <div className="relative rounded-lg overflow-hidden border-2 border-[#ae3200]/80 bg-[#3a0b00] flex flex-col justify-between shadow-inner h-full min-h-[220px] sm:min-h-[260px]">
                {/* Retro Dithered Background Preview Image */}
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsyvpL_5Kfy6KYw3XcFZPE2g66V_KTEdbY-JJSi6L4qzH9KRdRUyezruwThY8RDGxNQkhG9FU4KMJ42WAcqOudtb8XpGHkda3a8Y3xFxZ5bS1LEj9fN6kf8SZJK3EvTZ95uSJL-bSmUDJ8RXr5Gh2m7rjXTIHmQTWPMy3fZwYsxMypw4ivjNMTCUI0w2L5a-I6HpnMraxNkW9bApsc1HT-qCAANFcZ2xbeb9GuVi0"
                  alt="P2 Remote Preview"
                  className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity contrast-125 filter grayscale"
                />
                <div className="absolute inset-0 bg-[#fd591e]/20 mix-blend-color pointer-events-none" />

                {/* Canvas Render for P2 */}
                <canvas
                  ref={canvasP2Ref}
                  width={320}
                  height={240}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Scanline overlay */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)",
                  }}
                />

                {/* Top HUD Overlay */}
                <div className="relative z-10 flex items-center justify-between bg-black/75 px-2 py-0.5 text-white m-1 rounded border border-[#ae3200]">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#ffb59e] text-[14px]">
                      satellite_alt
                    </span>
                    <span className="text-[9px] font-bold text-[#ffb59e] uppercase tracking-wider">
                      P2 [ALEX_98 / OSAKA-04]
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-[#c5c9b1] font-mono">
                      {connectionStatus === "CONNECTED" ? "LINKED" : connectionStatus}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffb59e] animate-ping" />
                  </div>
                </div>

                {/* Crosshairs / Reticle */}
                <div className="relative z-10 w-full flex-1 flex flex-col justify-between p-2 pointer-events-none">
                  <div className="flex justify-between items-start">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-[#ffb59e]" />
                    <div className="w-4 h-4 border-t-2 border-r-2 border-[#ffb59e]" />
                  </div>
                  {/* Center Focus Box */}
                  <div className="self-center flex flex-col items-center">
                    <div className="w-10 h-10 border border-[#ffb59e]/60 rounded-sm flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-[#ffb59e]" />
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="w-4 h-4 border-b-2 border-l-2 border-[#ffb59e]" />
                    <div className="w-4 h-4 border-b-2 border-r-2 border-[#ffb59e]" />
                  </div>
                </div>

                {/* Bottom Sub-HUD */}
                <div className="relative z-10 flex items-center justify-between bg-black/75 px-2 py-0.5 text-white m-1 rounded border border-[#ae3200]">
                  <span className="text-[8px] text-[#ffb59e] font-bold uppercase">
                    [RX SYNCED] {pingMs}ms
                  </span>
                  <span className="text-[8px] text-[#c5c9b1] uppercase font-mono">
                    B-CHANNEL OK
                  </span>
                </div>
              </div>
            )}

            {/* Center Link Cable Badge for 2P mode */}
            {playerMode === "2p" && (
              <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex-col items-center bg-[#23221c]/90 backdrop-blur-sm border-2 border-[#8bac0f] text-white px-2.5 py-0.5 rounded shadow-xl">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#ccf157] text-[14px] animate-spin">
                    sync
                  </span>
                  <span className="text-[8px] font-bold tracking-widest text-[#ccf157] uppercase">
                    DUAL LINK
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom CRT Monitor Sub-Status Bar */}
          <div className="flex items-center justify-between text-[#c5c9b1] text-[8px] uppercase tracking-wider bg-black/60 px-2.5 py-0.5 rounded border border-[#454936]/40 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-[#bfefb4]">STN-NET: ESTABLISHED</span>
              <span>DITHER: ATKINSON-98</span>
              <span className="text-[#ffb59e] hidden sm:inline">STROBE: CHARGED (300V)</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span>PORT: 0x378</span>
              <span className="font-bold text-[#ccf157]">BUFFER: 100%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CameraViewport.displayName = "CameraViewport";
