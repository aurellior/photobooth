"use client";

import React from "react";
import { FilterMode, CaptureScheme, CountdownSeconds, PlayerMode } from "@/types/booth";
import { retroAudio } from "@/utils/retroAudio";

interface ControlDeckProps {
  activeFilter: FilterMode;
  onFilterChange: (filter: FilterMode) => void;
  captureScheme: CaptureScheme;
  onSchemeChange: (scheme: CaptureScheme) => void;
  onShutterPress: () => void;
  isSnapping?: boolean;
  currentShot?: number;
  totalShots?: number;
  timerSeconds: CountdownSeconds;
  onTimerChange: (seconds: CountdownSeconds) => void;
  // Mode Estafet (Pass-the-Booth)
  playerMode?: PlayerMode;
  isEstafet?: boolean;
  onEstafetToggle?: (enabled: boolean) => void;
}

export const ControlDeck: React.FC<ControlDeckProps> = ({
  activeFilter,
  onFilterChange,
  captureScheme,
  onSchemeChange,
  onShutterPress,
  isSnapping = false,
  currentShot = 1,
  totalShots = 4,
  timerSeconds,
  onTimerChange,
  playerMode = "1p",
  isEstafet = false,
  onEstafetToggle,
}) => {
  const handleFilterClick = (filter: FilterMode) => {
    retroAudio.playPlasticClick();
    onFilterChange(filter);
  };

  const handleTimerToggle = (sec: CountdownSeconds) => {
    retroAudio.playPlasticClick();
    onTimerChange(sec);
  };

  const handleShutter = () => {
    retroAudio.playPlasticClick();
    onShutterPress();
  };

  const handleEstafetSwitch = () => {
    retroAudio.playPlasticClick();
    if (onEstafetToggle) {
      onEstafetToggle(!isEstafet);
    }
  };

  return (
    <div className="w-full bg-[#ece8dc] rounded-lg px-2.5 sm:px-3 py-1.5 shadow-md border border-[#c5c9b1] flex flex-wrap items-center justify-between gap-2 flex-shrink-0 font-mono select-none">
      {/* Left: Tactile Filter Bank (Compact Buttons) */}
      <div className="flex items-center gap-1.5">
        <div className="hidden sm:flex flex-col text-left leading-none pr-1">
          <span className="text-[8px] font-bold uppercase text-[#454936]">FILTER</span>
          <span className="text-[7px] text-[#516600] uppercase font-bold">[BANK A]</span>
        </div>
        <div className="flex items-center gap-1">
          {(
            [
              { id: "GB 4-BIT", label: "BAYER" },
              { id: "PS1 LOW-POLY", label: "160x144" },
              { id: "THERMAL RECEIPT", label: "HALFTONE" },
              { id: "CCTV 2004", label: "CCTV '04" },
            ] as { id: FilterMode; label: string }[]
          ).map((item) => {
            const isSelected = activeFilter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleFilterClick(item.id)}
                className={`py-1 px-1.5 sm:px-2 rounded text-[8px] font-bold uppercase text-center transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#516600] text-white shadow-inner border border-[#3c4d00]"
                    : "bg-[#f2eee1] text-[#454936] hover:bg-[#dedace] border border-[#c5c9b1]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Center: Big Shutter Trigger Deck */}
      <div className="flex items-center gap-2">
        <div className="w-11 h-11 rounded-full bg-[#dedace] p-0.5 flex items-center justify-center border-2 border-[#c5c9b1] shadow-inner">
          <button
            onClick={handleShutter}
            disabled={isSnapping}
            className={`w-9 h-9 rounded-full bg-[#fd591e] hover:bg-[#ae3200] text-white flex flex-col items-center justify-center shadow-[0_2px_0_#852400] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer ${
              isSnapping ? "opacity-75 cursor-not-allowed scale-95" : ""
            }`}
            title="FIRE SHUTTER"
          >
            <span className="material-symbols-outlined text-[15px]">camera</span>
            <span className="text-[7px] font-bold uppercase tracking-tight leading-none">
              {isSnapping ? `${currentShot}/${totalShots}` : "SNAP"}
            </span>
          </button>
        </div>
        <div className="hidden lg:flex flex-col text-left leading-tight">
          <span className="text-[10px] font-bold text-[#ae3200] uppercase tracking-wide">
            {isSnapping ? "CAPTURING..." : "SYNC STROBE"}
          </span>
          <span className="text-[8px] text-[#516600] font-bold uppercase">
            {playerMode === "2p" ? "SIMULTANEOUS FIRE" : "CONTINUOUS REEL"}
          </span>
        </div>
      </div>

      {/* Right: 1P SOLO vs 2P CO-OP Scheme Selector, Timer, Estafet & Cartridge Status */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Scheme Selector */}
        <div className="flex items-center gap-1 bg-[#f2eee1] p-0.5 rounded border border-[#c5c9b1]">
          <button
            onClick={() => {
              retroAudio.playPlasticClick();
              onSchemeChange("SPLIT-SCREEN");
            }}
            className={`flex items-center gap-1 py-1 px-2 rounded text-[8px] font-bold uppercase transition cursor-pointer ${
              playerMode === "2p"
                ? "bg-[#fd591e] text-white shadow-sm"
                : "bg-transparent text-[#454936] hover:bg-[#dedace]"
            }`}
          >
            <span className="material-symbols-outlined text-[12px]">splitscreen</span> 2P CO-OP
          </button>
          <button
            onClick={() => {
              retroAudio.playPlasticClick();
              onSchemeChange("SOLO RIG");
            }}
            className={`flex items-center gap-1 py-1 px-2 rounded text-[8px] font-bold uppercase transition cursor-pointer ${
              playerMode === "1p"
                ? "bg-[#fd591e] text-white shadow-sm"
                : "bg-transparent text-[#454936] hover:bg-[#dedace]"
            }`}
          >
            <span className="material-symbols-outlined text-[12px]">fullscreen</span> 1P SOLO
          </button>
        </div>

        {/* Timer selector 3s vs 5s */}
        <div className="hidden xs:flex items-center gap-0.5 bg-[#f2eee1] p-0.5 rounded border border-[#c5c9b1]">
          <button
            onClick={() => handleTimerToggle(3)}
            className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded cursor-pointer transition-all ${
              timerSeconds === 3
                ? "bg-[#516600] text-white shadow-xs"
                : "text-[#454936] hover:bg-[#dedace]"
            }`}
          >
            3s
          </button>
          <button
            onClick={() => handleTimerToggle(5)}
            className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded cursor-pointer transition-all ${
              timerSeconds === 5
                ? "bg-[#516600] text-white shadow-xs"
                : "text-[#454936] hover:bg-[#dedace]"
            }`}
          >
            5s
          </button>
        </div>

        {/* Estafet Pass-The-Booth Toggle (Active in 2P mode) */}
        {playerMode === "2p" && (
          <button
            onClick={handleEstafetSwitch}
            className={`hidden sm:flex items-center gap-1 py-1 px-1.5 rounded text-[8px] font-bold uppercase border transition-all cursor-pointer ${
              isEstafet
                ? "bg-[#fd591e] text-white border-[#852400] shadow-xs"
                : "bg-[#f2eee1] text-[#454936] hover:bg-[#dedace] border-[#c5c9b1]"
            }`}
            title="Toggle Estafet / Pass-the-Booth sequence"
          >
            <span className="material-symbols-outlined text-[11px]">cached</span>
            <span>ESTAFET: {isEstafet ? "ON" : "OFF"}</span>
          </button>
        )}

        {/* Cartridge Loaded Badge */}
        <div className="hidden md:flex items-center gap-1 text-[8px] font-mono text-[#454936] bg-[#f2eee1] px-2 py-1 rounded border border-[#c5c9b1]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#516600]" />
          <span className="font-bold">57mm LOADED</span>
        </div>
      </div>
    </div>
  );
};
