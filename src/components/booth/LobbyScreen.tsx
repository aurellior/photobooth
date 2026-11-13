"use client";

import React, { useState } from "react";
import { PlayerMode, StripLayout, HardwareMode } from "@/types/booth";
import { retroAudio } from "@/utils/retroAudio";
import { ConnectionStatus } from "@/hooks/useCoopRoom";

interface LobbyScreenProps {
  playerMode: PlayerMode;
  onPlayerModeChange: (mode: PlayerMode) => void;
  selectedLayout: StripLayout;
  onLayoutChange: (layout: StripLayout) => void;
  roomCode: string;
  onRefreshRoomCode: () => void;
  onStartBooth: () => void;
  // 2P Multiplayer props
  onCreateRoom?: () => void;
  onJoinRoom?: (code: string) => void;
  connectionStatus?: ConnectionStatus;
  shareableUrl?: string;
  qrCodeDataUrl?: string;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  playerMode,
  onPlayerModeChange,
  selectedLayout,
  onLayoutChange,
  roomCode,
  onRefreshRoomCode,
  onStartBooth,
  onCreateRoom,
  onJoinRoom,
  connectionStatus = "IDLE",
  shareableUrl,
  qrCodeDataUrl,
}) => {
  const [hardwarePalette, setHardwarePalette] = useState<HardwareMode>("GB 4-BIT");
  const [copied, setCopied] = useState(false);

  // Join modal / dialog state
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinInputCode, setJoinInputCode] = useState("");

  const handleModeSwitch = (mode: PlayerMode) => {
    retroAudio.playPlasticClick();
    onPlayerModeChange(mode);
  };

  const handlePaletteSelect = (pal: HardwareMode) => {
    retroAudio.playCountdownBeep(0);
    setHardwarePalette(pal);
  };

  const handleLayoutSelect = (layout: StripLayout) => {
    retroAudio.playPlasticClick();
    onLayoutChange(layout);
  };

  const handleCopyCode = () => {
    retroAudio.playCountdownBeep(0);
    const textToCopy = shareableUrl || roomCode;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = () => {
    retroAudio.playPlasticClick();
    onRefreshRoomCode();
  };

  const handleStart = () => {
    retroAudio.playCoin();
    onStartBooth();
  };

  const handleCreateRoomClick = () => {
    retroAudio.playPlasticClick();
    if (onCreateRoom) {
      onCreateRoom();
    }
  };

  const handleConfirmJoin = () => {
    if (!joinInputCode.trim()) return;
    retroAudio.playPlasticClick();
    if (onJoinRoom) {
      onJoinRoom(joinInputCode.trim());
    }
    setIsJoinModalOpen(false);
  };

  return (
    <div className="w-full flex flex-col gap-2 p-2 sm:p-3 bg-[#323129] text-[#1d1c15] select-none font-mono">
      {/* Chassis Top Bar: Mode Switcher [2P LINK] vs [1P SOLO] */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ae3200] animate-pulse" />
          <span className="text-[10px] font-bold text-[#ece8dc] uppercase tracking-wider">
            {playerMode === "2p" ? "COMM BUS: 2-PLAYER LINK ACTIVE" : "COMM BUS: 1-PLAYER STANDALONE"}
          </span>
        </div>

        {/* Tactile 1P / 2P Switcher */}
        <div className="flex items-center gap-1 bg-[#1d1c15] p-1 rounded-md shadow-inner border border-[#454936]">
          <span className="text-[9px] text-[#ccf157] font-bold px-1 hidden xs:inline tracking-wider">
            MODE:
          </span>
          <button
            onClick={() => handleModeSwitch("2p")}
            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded transition-all flex items-center gap-1 cursor-pointer ${
              playerMode === "2p"
                ? "bg-[#fef9ed] text-[#ae3200] shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                : "text-[#c5c9b1] hover:text-white"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                playerMode === "2p" ? "bg-[#fd591e] animate-pulse" : "bg-[#757964]"
              }`}
            />
            2P LINK
          </button>
          <button
            onClick={() => handleModeSwitch("1p")}
            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded transition-all flex items-center gap-1 cursor-pointer ${
              playerMode === "1p"
                ? "bg-[#fef9ed] text-[#ae3200] shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                : "text-[#c5c9b1] hover:text-white"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                playerMode === "1p" ? "bg-[#fd591e] animate-pulse" : "bg-[#757964]"
              }`}
            />
            1P SOLO
          </button>
        </div>
      </div>

      {/* Olive Green Dot-Matrix CRT Viewport */}
      <div
        className="w-full bg-[#8bac0f] border-2 border-[#516600] rounded-lg p-2.5 sm:p-3 text-[#161e00] shadow-inner relative overflow-hidden"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(15, 56, 15, 0.08) 0px, rgba(15, 56, 15, 0.08) 1px, transparent 1px, transparent 2px)",
        }}
      >
        {/* CRT Filter Palette Bar */}
        <div className="flex items-center justify-between pb-1.5 border-b border-[#516600]/30 mb-2">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold tracking-wider mr-1 text-[#161e00]">PALETTE:</span>
            {(["GB 4-BIT", "PS1 LOW-POLY", "THERMAL TAPE"] as HardwareMode[]).map((pal) => (
              <button
                key={pal}
                onClick={() => handlePaletteSelect(pal)}
                className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded cursor-pointer transition-all ${
                  hardwarePalette === pal
                    ? "bg-[#fef9ed] text-[#1d1c15] shadow-xs"
                    : "hover:bg-[#fef9ed]/60 text-[#161e00]"
                }`}
              >
                [{pal === "PS1 LOW-POLY" ? "PS1 DITHER" : pal === "THERMAL TAPE" ? "THERMAL" : pal}]
              </button>
            ))}
          </div>
          <div className="text-[9px] font-bold uppercase font-mono text-[#2e3c00]">
            FPS: 60 // ISO 100
          </div>
        </div>

        {/* 2P LINK ROOM VIEW */}
        {playerMode === "2p" ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Left Col: Pair Link Info & Actions */}
            <div className="md:col-span-7 flex flex-col gap-1.5">
              <div className="flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase opacity-80 text-[#2e3c00]">
                <span className="material-symbols-outlined text-[12px]">cable</span>
                DUAL-CAMERA SYNCHRONIZATION
              </div>
              <h1 className="text-sm sm:text-base font-bold uppercase tracking-tight leading-tight m-0 text-[#161e00]">
                PAIR LINK ROOM TERMINAL
              </h1>
              <p className="text-[10px] leading-tight text-[#2e3c00] max-w-md">
                Establish a synchronized stereo link with Player 2. Capture synchronized poses into dual monochrome thermal photo strips.
              </p>

              {/* Stereo Thermal Strip Layout Selector */}
              <div className="flex flex-col gap-1 py-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-[#161e00] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px]">receipt_long</span>
                    STEREO THERMAL STRIP LAYOUT:
                  </span>
                  <span className="text-[7px] font-mono text-[#516600] font-bold">
                    SYNC: {selectedLayout === "4-STRIP VERTICAL" ? "CLASSIC 4-CUT" : selectedLayout === "2x2 GRID" ? "ARCADE QUAD" : "WIDE POLAROID"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5" id="coop-templates-row">
                  <button
                    type="button"
                    onClick={() => handleLayoutSelect("4-STRIP VERTICAL")}
                    className={`p-1 rounded flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                      selectedLayout === "4-STRIP VERTICAL"
                        ? "bg-white border-2 border-[#ae3200] text-[#ae3200]"
                        : "bg-white/70 border border-[#516600]/40 text-[#161e00] hover:bg-white"
                    }`}
                  >
                    <div className="w-4 h-7 bg-[#dedace] border border-[#1d1c15] p-0.5 flex flex-col justify-between shrink-0">
                      <span className="w-full h-1 bg-[#454936] block" />
                      <span className="w-full h-1 bg-[#454936] block" />
                      <span className="w-full h-1 bg-[#454936] block" />
                      <span className="w-full h-1 bg-[#454936] block" />
                    </div>
                    <div className="flex flex-col text-left leading-none">
                      <span className="text-[8px] font-bold text-[#1d1c15] uppercase">4-CUT STRIP</span>
                      <span className="text-[6px] font-mono text-[#454936] mt-0.5">DUAL 4-POSE</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLayoutSelect("2x2 GRID")}
                    className={`p-1 rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedLayout === "2x2 GRID"
                        ? "bg-white border-2 border-[#ae3200] text-[#ae3200] shadow-xs"
                        : "bg-white/70 border border-[#516600]/40 text-[#161e00] hover:bg-white"
                    }`}
                  >
                    <div className="w-5 h-7 bg-[#dedace] border border-[#1d1c15] p-0.5 grid grid-cols-2 gap-0.5 shrink-0">
                      <span className="w-full h-2 bg-[#454936] block" />
                      <span className="w-full h-2 bg-[#454936] block" />
                      <span className="w-full h-2 bg-[#454936] block" />
                      <span className="w-full h-2 bg-[#454936] block" />
                    </div>
                    <div className="flex flex-col text-left leading-none">
                      <span className="text-[8px] font-bold text-[#1d1c15] uppercase">QUAD 2x2</span>
                      <span className="text-[6px] font-mono text-[#454936] mt-0.5">SPLIT PAIR</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLayoutSelect("SINGLE POLAROID")}
                    className={`p-1 rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedLayout === "SINGLE POLAROID"
                        ? "bg-white border-2 border-[#ae3200] text-[#ae3200] shadow-xs"
                        : "bg-white/70 border border-[#516600]/40 text-[#161e00] hover:bg-white"
                    }`}
                  >
                    <div className="w-5 h-7 bg-[#dedace] border border-[#1d1c15] p-0.5 flex flex-col justify-between shrink-0">
                      <span className="w-full h-4 bg-[#454936] block" />
                      <span className="w-full h-1 bg-[#c5c9b1] block" />
                    </div>
                    <div className="flex flex-col text-left leading-none">
                      <span className="text-[8px] font-bold text-[#1d1c15] uppercase">POLAROID</span>
                      <span className="text-[6px] font-mono text-[#454936] mt-0.5">CO-OP SIGN</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Dual Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleCreateRoomClick}
                  className="bg-[#ae3200] hover:bg-[#852400] text-white px-2 py-2 rounded font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-[0_2px_0_#521300] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">add_circle</span>
                  <span>CREATE ROOM</span>
                </button>
                <button
                  onClick={() => setIsJoinModalOpen(true)}
                  className="bg-[#fef9ed] text-[#1d1c15] hover:bg-white px-2 py-2 rounded font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 border border-[#516600]/40 shadow-[0_2px_0_#516600] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">dialpad</span>
                  <span>JOIN CODE</span>
                </button>
              </div>

              {/* Wire connection simulation status */}
              <div className="bg-[#7eab75]/30 p-1.5 rounded border border-[#516600]/30 flex items-center justify-between text-[9px] mt-0.5">
                <span className="font-bold flex items-center gap-1 text-[#163f15]">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      connectionStatus === "CONNECTED"
                        ? "bg-[#516600] animate-pulse"
                        : "bg-[#ae3200] animate-pulse"
                    }`}
                  />
                  STATUS: {connectionStatus === "CONNECTED" ? "2P LINKED // READY" : connectionStatus}
                </span>
                <span className="font-mono text-[#2e3c00]">LINK BUFFER: 64.0 KB</span>
              </div>

              {connectionStatus === "CONNECTED" && (
                <div className="pt-1">
                  <button
                    onClick={handleStart}
                    className="w-full bg-[#516600] hover:bg-[#3c4d00] text-white px-3 py-2 rounded font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-[0_2px_0_#2e3c00] active:translate-y-0.5 cursor-pointer animate-pulse"
                  >
                    <span className="material-symbols-outlined text-[15px]">videocam</span>
                    <span>ENTER 2P BOOTH STUDIO</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Col: Room Token & QR */}
            <div className="md:col-span-5 bg-[#fef9ed] border border-[#516600]/40 rounded-lg p-2.5 text-[#1d1c15] shadow flex flex-col gap-1.5">
              <div className="flex items-center justify-between border-b border-dashed border-[#757964]/50 pb-1 text-[9px] uppercase font-bold text-[#454936]">
                <span>ROOM TOKEN</span>
                <span>#HOST-CB98</span>
              </div>
              <div className="text-center py-1 bg-[#ece8dc] rounded border border-dashed border-[#c5c9b1]">
                <span className="text-[8px] uppercase tracking-widest font-mono text-[#454936] block">
                  SESSION CODE
                </span>
                <span className="text-xl font-bold tracking-widest text-[#ae3200] font-mono select-all">
                  {roomCode || "884-21A"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyCode}
                  className="flex-1 bg-[#516600] hover:bg-[#3c4d00] text-white py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm active:translate-y-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px]">content_copy</span>
                  <span>{copied ? "COPIED!" : "COPY LINK"}</span>
                </button>
                <button
                  onClick={handleRefresh}
                  className="p-1 bg-[#e6e2d6] text-[#1d1c15] hover:bg-[#dedace] rounded border border-[#c5c9b1] active:translate-y-0.5 cursor-pointer"
                  title="Generate New Code"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                </button>
              </div>

              {/* Mini QR quick scan */}
              <div className="flex items-center gap-2 pt-1 border-t border-dashed border-[#757964]/40">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Room QR Code"
                    className="w-10 h-10 rounded border border-[#1d1c15] bg-white p-0.5 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 bg-[#1d1c15] p-1 flex flex-col justify-between rounded shrink-0">
                    <div className="flex justify-between">
                      <span className="w-1.5 h-1.5 bg-white" />
                      <span className="w-1.5 h-1.5 bg-white" />
                    </div>
                    <div className="flex justify-center">
                      <span className="w-1.5 h-1.5 bg-white" />
                    </div>
                    <div className="flex justify-between">
                      <span className="w-1.5 h-1.5 bg-white" />
                      <span className="w-1.5 h-1.5 bg-white" />
                    </div>
                  </div>
                )}
                <div className="flex flex-col leading-none">
                  <span className="text-[9px] font-bold uppercase text-[#1d1c15]">P2 QUICK SYNC</span>
                  <span className="text-[8px] text-[#454936] mt-0.5">
                    Scan to pair mobile viewport
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 1P SOLO RETRO STUDIO VIEW */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Left Col: Template Selection & Start */}
            <div className="md:col-span-7 flex flex-col gap-1.5">
              <div className="flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase opacity-80 text-[#2e3c00]">
                <span className="material-symbols-outlined text-[12px]">videocam</span>
                STANDALONE RETRO PHOTO BOOTH
              </div>
              <h1 className="text-sm sm:text-base font-bold uppercase tracking-tight leading-tight m-0 text-[#161e00]">
                1-PLAYER RETRO STUDIO
              </h1>
              <p className="text-[10px] leading-tight text-[#2e3c00] max-w-md">
                Single handheld mode. Select your thermal strip template and fire the automatic continuous timer.
              </p>

              {/* Template Selector with Visual Miniature Diagrams */}
              <div className="flex flex-col gap-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#2e3c00] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">view_comfy</span>
                    PRINT TEMPLATE LAYOUT:
                  </span>
                  <span className="text-[8px] font-mono text-[#516600] font-bold" id="template-spec-label">
                    {selectedLayout === "4-STRIP VERTICAL"
                      ? "57x210mm // 4 POSES"
                      : selectedLayout === "2x2 GRID"
                      ? "57x140mm // 4 POSES"
                      : "57x90mm // 1 POSE"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5" id="template-cards-grid">
                  {/* Card 1: CLASSIC 4-CUT */}
                  <button
                    type="button"
                    onClick={() => handleLayoutSelect("4-STRIP VERTICAL")}
                    className={`p-1.5 rounded flex flex-col items-center gap-1 transition-all relative text-left group cursor-pointer ${
                      selectedLayout === "4-STRIP VERTICAL"
                        ? "bg-white border-2 border-[#ae3200] text-[#ae3200] shadow-xs"
                        : "bg-white/70 border border-[#516600]/40 text-[#161e00] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shadow-inner ${
                          selectedLayout === "4-STRIP VERTICAL" ? "bg-[#ae3200]" : "bg-[#757964]"
                        }`}
                      />
                      <span
                        className={`text-[7px] font-mono px-1 py-0.2 font-bold rounded border ${
                          selectedLayout === "4-STRIP VERTICAL"
                            ? "bg-[#fef9ed] text-[#ae3200] border-[#ae3200]/30"
                            : "bg-[#fef9ed] text-[#454936] border-[#c5c9b1]"
                        }`}
                      >
                        4-CUT
                      </span>
                    </div>
                    <div className="w-7 h-11 bg-[#fef9ed] border border-[#1d1c15] rounded p-0.5 flex flex-col justify-between items-center shadow-inner">
                      <div className="w-full h-1.5 bg-[#454936] rounded-xs" />
                      <div className="w-full h-1.5 bg-[#454936] rounded-xs" />
                      <div className="w-full h-1.5 bg-[#454936] rounded-xs" />
                      <div className="w-full h-1.5 bg-[#454936] rounded-xs" />
                      <div className="w-full h-0.5 bg-[#ae3200]/50" />
                    </div>
                    <div className="flex flex-col items-center leading-none mt-0.5">
                      <span className="text-[8px] font-bold uppercase text-[#1d1c15]">CLASSIC 4-CUT</span>
                      <span className="text-[7px] text-[#454936] font-mono">STRIP // 4P</span>
                    </div>
                  </button>

                  {/* Card 2: ARCADE QUAD */}
                  <button
                    type="button"
                    onClick={() => handleLayoutSelect("2x2 GRID")}
                    className={`p-1.5 rounded flex flex-col items-center gap-1 transition-all relative text-left group cursor-pointer ${
                      selectedLayout === "2x2 GRID"
                        ? "bg-white border-2 border-[#ae3200] text-[#ae3200] shadow-xs"
                        : "bg-white/70 border border-[#516600]/40 text-[#161e00] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shadow-inner ${
                          selectedLayout === "2x2 GRID" ? "bg-[#ae3200]" : "bg-[#757964]"
                        }`}
                      />
                      <span
                        className={`text-[7px] font-mono px-1 py-0.2 font-bold rounded border ${
                          selectedLayout === "2x2 GRID"
                            ? "bg-[#fef9ed] text-[#ae3200] border-[#ae3200]/30"
                            : "bg-[#fef9ed] text-[#454936] border-[#c5c9b1]"
                        }`}
                      >
                        2x2
                      </span>
                    </div>
                    <div className="w-9 h-11 bg-[#fef9ed] border border-[#1d1c15] rounded p-0.5 grid grid-cols-2 gap-0.5 shadow-inner items-center">
                      <div className="w-full h-3.5 bg-[#454936] rounded-xs" />
                      <div className="w-full h-3.5 bg-[#454936] rounded-xs" />
                      <div className="w-full h-3.5 bg-[#454936] rounded-xs" />
                      <div className="w-full h-3.5 bg-[#454936] rounded-xs" />
                    </div>
                    <div className="flex flex-col items-center leading-none mt-0.5">
                      <span className="text-[8px] font-bold uppercase text-[#1d1c15]">ARCADE QUAD</span>
                      <span className="text-[7px] text-[#454936] font-mono">2x2 GRID // 4P</span>
                    </div>
                  </button>

                  {/* Card 3: WIDE POLAROID */}
                  <button
                    type="button"
                    onClick={() => handleLayoutSelect("SINGLE POLAROID")}
                    className={`p-1.5 rounded flex flex-col items-center gap-1 transition-all relative text-left group cursor-pointer ${
                      selectedLayout === "SINGLE POLAROID"
                        ? "bg-white border-2 border-[#ae3200] text-[#ae3200] shadow-xs"
                        : "bg-white/70 border border-[#516600]/40 text-[#161e00] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shadow-inner ${
                          selectedLayout === "SINGLE POLAROID" ? "bg-[#ae3200]" : "bg-[#757964]"
                        }`}
                      />
                      <span
                        className={`text-[7px] font-mono px-1 py-0.2 font-bold rounded border ${
                          selectedLayout === "SINGLE POLAROID"
                            ? "bg-[#fef9ed] text-[#ae3200] border-[#ae3200]/30"
                            : "bg-[#fef9ed] text-[#454936] border-[#c5c9b1]"
                        }`}
                      >
                        1-POSE
                      </span>
                    </div>
                    <div className="w-9 h-11 bg-[#fef9ed] border border-[#1d1c15] rounded p-0.5 flex flex-col justify-between items-center shadow-inner">
                      <div className="w-full h-6 bg-[#454936] rounded-xs" />
                      <div className="w-full h-2 bg-[#dedace] rounded-xs flex items-center justify-center">
                        <div className="w-4 h-0.5 bg-[#757964]/60" />
                      </div>
                    </div>
                    <div className="flex flex-col items-center leading-none mt-0.5">
                      <span className="text-[8px] font-bold uppercase text-[#1d1c15]">WIDE POLAROID</span>
                      <span className="text-[7px] text-[#454936] font-mono">RETRO CARD // 1P</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Insert Coin Button */}
              <div className="pt-1">
                <button
                  onClick={handleStart}
                  className="w-full bg-[#fd591e] hover:bg-[#ae3200] text-white px-3 py-2 rounded font-bold text-[11px] uppercase tracking-wider flex items-center justify-between shadow-[0_2px_0_#852400] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] animate-bounce">
                      sports_esports
                    </span>
                    <span>INSERT COIN // START 1P BOOTH</span>
                  </div>
                  <span className="bg-[#1d1c15] text-[#ccf157] px-1.5 py-0.5 rounded font-mono text-[9px] font-bold">
                    1 CREDIT
                  </span>
                </button>
              </div>
            </div>

            {/* Right Col: Optical Viewfinder Preview */}
            <div className="md:col-span-5 bg-[#fef9ed] border border-[#516600]/40 rounded-lg p-2.5 text-[#1d1c15] shadow flex flex-col gap-1.5">
              <div className="flex items-center justify-between border-b border-dashed border-[#757964]/50 pb-1 text-[9px] uppercase font-bold text-[#454936]">
                <span>OPTICAL VIEWFINDER</span>
                <span>#CAM-01 ACTIVE</span>
              </div>
              <div className="w-full h-20 bg-[#1d1c15] rounded p-2 flex flex-col justify-between border border-[#516600] relative overflow-hidden">
                <div className="flex justify-between items-center text-[#ccf157] text-[8px] font-mono">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    REC READY
                  </span>
                  <span>128 x 112 px</span>
                </div>
                {/* Crosshair overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                  <div className="w-6 h-6 border border-[#ccf157] flex items-center justify-center">
                    <div className="w-1 h-1 bg-[#ccf157] rounded-full" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-white text-[8px] z-10 font-bold uppercase">
                  <span className="bg-[#ae3200] px-1 py-0.2 rounded text-[8px]">
                    {selectedLayout}
                  </span>
                  <span className="text-[#ccf157]">MONO DITHER</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[9px] text-[#454936] font-bold uppercase pt-1 border-t border-dashed border-[#757964]/40">
                <span className="flex items-center gap-1 text-[#516600]">
                  <span className="material-symbols-outlined text-[13px]">print</span>
                  THERMAL PRINTER READY
                </span>
                <span className="font-mono text-[#ae3200]">FEED: OK</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Join Code Modal Dialog */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#ece8dc] border-2 border-[#516600] rounded-xl p-4 max-w-sm w-full shadow-2xl flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between border-b border-[#c5c9b1] pb-1.5">
              <span className="font-bold text-xs uppercase text-[#1d1c15] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#ae3200]">dialpad</span>
                ENTER ROOM CODE
              </span>
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="text-[#454936] hover:text-[#1d1c15] font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-[10px] text-[#454936] leading-tight">
              Type the 6-character room token displayed on Player 1&apos;s booth terminal (e.g. 884-21A):
            </p>
            <input
              type="text"
              value={joinInputCode}
              onChange={(e) => setJoinInputCode(e.target.value.toUpperCase())}
              placeholder="e.g. 88421A"
              maxLength={8}
              className="bg-white border-2 border-[#516600] p-2 text-center text-lg font-bold tracking-widest text-[#ae3200] rounded outline-none font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="flex-1 bg-[#dedace] hover:bg-[#c5c9b1] text-[#1d1c15] py-1.5 rounded font-bold text-[10px] uppercase cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmJoin}
                className="flex-1 bg-[#516600] hover:bg-[#3c4d00] text-white py-1.5 rounded font-bold text-[10px] uppercase shadow-sm cursor-pointer"
              >
                CONNECT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
