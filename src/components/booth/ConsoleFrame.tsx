"use client";

import React, { useState } from "react";
import { ScreenType } from "@/types/booth";
import { retroAudio } from "@/utils/retroAudio";

interface ConsoleFrameProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  children: React.ReactNode;
  onButtonAPress?: () => void;
  onButtonBPress?: () => void;
  onStartPress?: () => void;
  onSelectPress?: () => void;
}

export const ConsoleFrame: React.FC<ConsoleFrameProps> = ({
  currentScreen,
  onNavigate,
  children,
  onButtonAPress,
  onButtonBPress,
  onStartPress,
  onSelectPress,
}) => {
  const [sfxMuted, setSfxMuted] = useState(false);

  const toggleSound = () => {
    retroAudio.playPlasticClick();
    setSfxMuted((prev) => !prev);
  };

  const handleNav = (screen: ScreenType) => {
    retroAudio.playPlasticClick();
    onNavigate(screen);
  };

  const handleDpad = (freq: number) => {
    retroAudio.playCountdownBeep(0);
  };

  return (
    <div className="h-screen w-screen bg-[#dedace] text-[#1d1c15] flex flex-col justify-between font-mono select-none overflow-hidden">
      {/* SLIM TOP NAVIGATION HEADER (approx 40px) */}
      <header className="w-full flex-shrink-0 z-50 bg-[#ece8dc] border-b border-[#757964]/20 shadow-sm">
        <div className="h-10 max-w-7xl mx-auto px-3 md:px-6 flex items-center justify-between gap-3">
          {/* Title & Link Status */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#516600] text-white flex items-center justify-center font-bold text-[11px] rounded shadow-inner">
              98
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs tracking-tight uppercase leading-none text-[#1d1c15]">
                CO-OP BOOTH 98
              </span>
              <span className="hidden sm:inline text-[9px] text-[#454936] tracking-wider uppercase border-l border-[#c5c9b1] pl-2">
                LINK v2.4
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-[#f2eee1] border border-[#c5c9b1] rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-[#516600] animate-pulse" />
              <span className="text-[8px] text-[#516600] font-bold uppercase tracking-wider">
                LOCKED
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-[#f2eee1] p-0.5 rounded border border-[#c5c9b1]">
            <button
              onClick={() => handleNav("LOBBY")}
              className={`px-2 py-0.5 text-[9px] rounded uppercase font-bold transition cursor-pointer ${
                currentScreen === "LOBBY"
                  ? "bg-[#8bac0f] text-[#2e3c00] shadow-sm"
                  : "text-[#454936] hover:bg-[#e6e2d6] hover:text-[#1d1c15]"
              }`}
            >
              1. LOBBY
            </button>
            <button
              onClick={() => handleNav("CAMERA")}
              className={`px-2 py-0.5 text-[9px] rounded uppercase font-bold transition cursor-pointer ${
                currentScreen === "CAMERA"
                  ? "bg-[#8bac0f] text-[#2e3c00] shadow-sm"
                  : "text-[#454936] hover:bg-[#e6e2d6] hover:text-[#1d1c15]"
              }`}
            >
              2. LIVE BOOTH [DUAL]
            </button>
            <button
              onClick={() => handleNav("RECEIPT")}
              className={`px-2 py-0.5 text-[9px] rounded uppercase font-bold transition cursor-pointer ${
                currentScreen === "RECEIPT"
                  ? "bg-[#8bac0f] text-[#2e3c00] shadow-sm"
                  : "text-[#454936] hover:bg-[#e6e2d6] hover:text-[#1d1c15]"
              }`}
            >
              3. RECEIPT PRINTER
            </button>
          </nav>

          {/* Right Telemetry Badges */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 text-[9px] leading-none">
              <span className="text-[#ae3200] font-bold uppercase">[THERMAL MATRIX]</span>
              <span className="text-[#454936] uppercase font-mono">3V DC</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleSound}
                className="w-6 h-6 bg-[#f2eee1] hover:bg-[#e6e2d6] border border-[#c5c9b1] text-[#454936] rounded flex items-center justify-center cursor-pointer"
                title={sfxMuted ? "Unmute Retro SFX" : "Mute Retro SFX"}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {sfxMuted ? "volume_off" : "volume_up"}
                </span>
              </button>
              <div className="w-6 h-6 rounded-full bg-[#516600] flex items-center justify-center text-white shadow-sm font-bold text-[10px]">
                P1
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* DYNAMIC SCREEN MAIN BODY */}
      {currentScreen === "LOBBY" ? (
        /* SCREEN 1 (LOBBY): Portable Handheld DMG-98 Console Enclosure */
        <main className="w-full flex-1 min-h-0 flex items-center justify-center p-2 sm:p-3 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-full flex flex-col justify-between gap-2">
            {/* Retro Handheld Console Body */}
            <div className="w-full bg-[#dedace] border-2 border-[#c5c9b1] rounded-2xl p-2.5 sm:p-4 shadow-[0_8px_0_#9a988d,0_12px_20px_rgba(0,0,0,0.18)] flex flex-col gap-2">
              {/* Chassis Top Bezel Bar */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ae3200] shadow-inner animate-pulse" />
                  <span className="text-[11px] font-bold tracking-wider text-[#1d1c15] uppercase">
                    PORTABLE CO-OP TERMINAL
                  </span>
                  <span className="hidden sm:inline text-[9px] text-[#454936] bg-[#fef9ed] px-1.5 py-0.5 rounded border border-[#c5c9b1] font-mono">
                    DMG-98
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-[#454936] uppercase font-mono">
                  <span className="hidden md:inline">SYSTEM: 8-BIT Z80</span>
                  <div className="flex gap-1 ml-1">
                    <span className="w-1 h-3 bg-[#757964]/50 rounded-full" />
                    <span className="w-1 h-3 bg-[#757964]/50 rounded-full" />
                    <span className="w-1 h-3 bg-[#757964]/50 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Recessed LCD Screen Well */}
              <div className="w-full bg-[#323129] rounded-xl p-2 sm:p-3 shadow-inner border border-[#1d1c15]">
                <div className="flex items-center justify-between text-[9px] text-[#ece8dc] mb-1.5 px-1 font-mono uppercase">
                  <span className="flex items-center gap-1 text-[#b1d43d]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ccf157] animate-ping" />
                    SERIAL: 16-BIT 4.19MHz
                  </span>
                  <span className="text-[#ffdbd0] hidden xs:inline">
                    COMM BUS: 2-PLAYER LINK ACTIVE
                  </span>
                  <span className="bg-[#24231d] px-1.5 py-0.5 rounded text-[#ccf157]">
                    CH-01
                  </span>
                </div>

                {/* Inner Lobby Content */}
                <div className="relative rounded-lg overflow-hidden border border-[#516600]/40">
                  {children}
                </div>
              </div>

              {/* Handheld Lower Control Deck (D-Pad, SELECT/START, A/B) */}
              <div className="flex items-center justify-between px-2 pt-1 select-none">
                {/* Molded D-Pad */}
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <div className="absolute w-14 h-4.5 bg-[#323129] rounded shadow-[0_2px_0_#1d1c15]" />
                    <div className="absolute w-4.5 h-14 bg-[#323129] rounded shadow-[0_2px_0_#1d1c15]" />
                    <div className="absolute w-3.5 h-3.5 rounded-full bg-[#1d1c15]/60 shadow-inner z-10" />
                    <button
                      onClick={() => handleDpad(320)}
                      className="absolute top-0 w-4 h-4 flex items-center justify-center text-[#f2eee1] active:scale-90 z-20 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[12px]">arrow_drop_up</span>
                    </button>
                    <button
                      onClick={() => handleDpad(300)}
                      className="absolute bottom-0 w-4 h-4 flex items-center justify-center text-[#f2eee1] active:scale-90 z-20 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[12px]">arrow_drop_down</span>
                    </button>
                    <button
                      onClick={() => handleDpad(280)}
                      className="absolute left-0 w-4 h-4 flex items-center justify-center text-[#f2eee1] active:scale-90 z-20 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[12px]">arrow_left</span>
                    </button>
                    <button
                      onClick={() => handleDpad(340)}
                      className="absolute right-0 w-4 h-4 flex items-center justify-center text-[#f2eee1] active:scale-90 z-20 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[12px]">arrow_right</span>
                    </button>
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-[10px] font-bold text-[#1d1c15] uppercase tracking-wider leading-none">
                      RETRO BOOTH
                    </span>
                    <span className="text-[8px] text-[#454936] font-mono uppercase mt-0.5">
                      STEREO COMM 16Ω
                    </span>
                  </div>
                </div>

                {/* Rubber SELECT / START */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      onClick={() => {
                        retroAudio.playPlasticClick();
                        onSelectPress?.();
                      }}
                      className="w-7 h-2 bg-[#454936] rounded-full rotate-[-25deg] shadow-[0_1px_0_#1d1c15] active:translate-y-0.5 transition-transform cursor-pointer"
                    />
                    <span className="text-[8px] font-bold text-[#454936] uppercase mt-1">
                      SELECT
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      onClick={() => {
                        retroAudio.playPlasticClick();
                        onStartPress?.();
                      }}
                      className="w-7 h-2 bg-[#454936] rounded-full rotate-[-25deg] shadow-[0_1px_0_#1d1c15] active:translate-y-0.5 transition-transform cursor-pointer"
                    />
                    <span className="text-[8px] font-bold text-[#454936] uppercase mt-1">
                      START
                    </span>
                  </div>
                </div>

                {/* B & A Buttons */}
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex gap-1 rotate-[-30deg] opacity-70">
                    <span className="w-1 h-7 bg-[#454936] rounded-full" />
                    <span className="w-1 h-7 bg-[#454936] rounded-full" />
                    <span className="w-1 h-7 bg-[#454936] rounded-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        onClick={() => {
                          retroAudio.playPlasticClick();
                          onButtonBPress?.();
                        }}
                        className="w-8 h-8 rounded-full bg-[#ae3200] text-white font-bold text-xs flex items-center justify-center shadow-[0_2px_0_#521300] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                      >
                        B
                      </button>
                      <span className="text-[8px] font-bold text-[#1d1c15] uppercase">
                        BACK
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 -mt-2">
                      <button
                        onClick={() => {
                          retroAudio.playPlasticClick();
                          onButtonAPress?.();
                        }}
                        className="w-8 h-8 rounded-full bg-[#fd591e] text-white font-bold text-xs flex items-center justify-center shadow-[0_2px_0_#852400] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                      >
                        A
                      </button>
                      <span className="text-[8px] font-bold text-[#1d1c15] uppercase">
                        ENTER
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
              <div className="bg-[#f2eee1] px-2.5 py-1.5 rounded border border-[#c5c9b1]/40 flex items-center gap-2 shadow-xs">
                <span className="material-symbols-outlined text-[#516600] text-[16px]">sensors</span>
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] text-[#454936] uppercase">ONLINE PAIRS</span>
                  <span className="font-bold text-[#1d1c15] font-mono text-[10px] mt-0.5">
                    1,429 LINKED
                  </span>
                </div>
              </div>
              <div className="bg-[#f2eee1] px-2.5 py-1.5 rounded border border-[#c5c9b1]/40 flex items-center gap-2 shadow-xs">
                <span className="material-symbols-outlined text-[#ae3200] text-[16px]">receipt_long</span>
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] text-[#454936] uppercase">DISPATCHED</span>
                  <span className="font-bold text-[#1d1c15] font-mono text-[10px] mt-0.5">
                    34,810 STRIPS
                  </span>
                </div>
              </div>
              <div className="bg-[#f2eee1] px-2.5 py-1.5 rounded border border-[#c5c9b1]/40 flex items-center gap-2 shadow-xs">
                <span className="material-symbols-outlined text-[#3f6839] text-[16px]">memory</span>
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] text-[#454936] uppercase">CHASSIS ROM</span>
                  <span className="font-bold text-[#3f6839] font-mono text-[10px] mt-0.5">
                    STATUS [OK]
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : currentScreen === "CAMERA" ? (
        /* SCREEN 2 (LIVE BOOTH DUAL CAM): Maximized Appliance Monitor Well */
        <main className="w-full flex-1 min-h-0 px-3 md:px-6 py-1.5 max-w-7xl mx-auto flex flex-col gap-1.5 overflow-hidden">
          {children}
        </main>
      ) : (
        /* SCREEN 3 (RECEIPT): Full Kiosk Paper & Action Stage */
        <main className="w-full flex-1 min-h-0 px-3 md:px-6 py-2 max-w-7xl mx-auto overflow-y-auto">
          {children}
        </main>
      )}

      {/* SLIM HARDWARE FOOTER */}
      <footer className="w-full flex-shrink-0 bg-[#e6e2d6] border-t border-[#c5c9b1] py-1 px-3 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[8px] text-[#454936] uppercase font-mono">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-1 bg-[#757964] rounded-full" />
              <div className="w-2.5 h-1 bg-[#757964] rounded-full" />
              <div className="w-2.5 h-1 bg-[#757964] rounded-full" />
            </div>
            <span>CO-OP PHOTO BOOTH SYSTEM 98 // APPLIANCE UNIT</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#454936]">SESSION: #CB98-DUAL</span>
            <span className="text-[#516600] font-bold">STATION: ONLINE [CH-01/CH-02]</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
