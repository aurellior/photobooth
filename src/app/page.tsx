"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ScreenType,
  PlayerMode,
  StripLayout,
  FilterMode,
  CaptureScheme,
  CountdownSeconds,
  CapturedPhoto,
} from "@/types/booth";
import { ConsoleFrame } from "@/components/booth/ConsoleFrame";
import { LobbyScreen } from "@/components/booth/LobbyScreen";
import { CameraViewport, CameraViewportHandle } from "@/components/booth/CameraViewport";
import { ControlDeck } from "@/components/booth/ControlDeck";
import { ReceiptScreen } from "@/components/booth/ReceiptScreen";
import { retroAudio } from "@/utils/retroAudio";
import { useCoopRoom } from "@/hooks/useCoopRoom";

export default function PhotoboothApp() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("LOBBY");
  const [playerMode, setPlayerMode] = useState<PlayerMode>("1p");
  const [selectedLayout, setSelectedLayout] = useState<StripLayout>("4-STRIP VERTICAL");
  const [activeFilter, setActiveFilter] = useState<FilterMode>("GB 4-BIT");
  const [captureScheme, setCaptureScheme] = useState<CaptureScheme>("SOLO RIG");
  const [timerSeconds, setTimerSeconds] = useState<CountdownSeconds>(3);

  // Local media stream placeholder for WebRTC
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // Camera capture state
  const [currentShot, setCurrentShot] = useState<number>(1);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSnapping, setIsSnapping] = useState<boolean>(false);
  const [flash, setFlash] = useState<boolean>(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);

  const viewportRef = useRef<CameraViewportHandle | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebRTC 2P Link Cable Hook
  const {
    status: connectionStatus,
    role,
    roomCode,
    setRoomCode,
    shareableUrl,
    qrCodeDataUrl,
    remoteStream,
    pingMs,
    isEstafet,
    setIsEstafet,
    createRoom,
    joinRoom,
    sendMessage,
    setOnFilterSync,
    setOnLayoutSync,
    setOnCountdownSync,
    setOnEstafetSync,
    setOnNavigateSync,
    setOnRemoteFrame,
  } = useCoopRoom(localStream);

  // Acquire local webcam stream for WebRTC call
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        })
        .then((s) => setLocalStream(s))
        .catch(() => {});
    }
  }, []);

  // Register WebRTC incoming synchronizations
  useEffect(() => {
    setOnFilterSync((f) => setActiveFilter(f));
    setOnLayoutSync((l) => setSelectedLayout(l));
    setOnEstafetSync((e) => setIsEstafet(e));
    setOnNavigateSync((s) => setCurrentScreen(s));
  }, [setOnFilterSync, setOnLayoutSync, setOnEstafetSync, setOnNavigateSync, setIsEstafet]);

  // Shutter countdown sequence (triggered locally or remotely via DataChannel)
  const executeCountdownAndSnap = useCallback(
    (secondsToUse: number) => {
      if (isSnapping || countdown !== null) return;

      let count = secondsToUse;
      setCountdown(count);
      retroAudio.playCountdownBeep(count);

      countdownIntervalRef.current = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
          retroAudio.playCountdownBeep(count);
        } else if (count === 0) {
          setCountdown(0);
          retroAudio.playCountdownBeep(0);
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

          // Flash and mechanical shutter snap
          setIsSnapping(true);
          setFlash(true);
          retroAudio.playShutterFlash();

          // Determine which frame to capture:
          let primaryDataUrl = "";
          let opTag: "P1" | "P2" | "DUAL" = "P1";

          if (playerMode === "2p") {
            if (isEstafet) {
              const isP1 = currentShot % 2 !== 0;
              opTag = isP1 ? "P1" : "P2";
              primaryDataUrl =
                (isP1
                  ? viewportRef.current?.captureP1Frame()
                  : viewportRef.current?.captureP2Frame()) || "";
            } else {
              opTag = "DUAL";
              primaryDataUrl =
                viewportRef.current?.captureCombinedFrame() ||
                viewportRef.current?.captureP1Frame() ||
                "";
            }
          } else {
            opTag = "P1";
            primaryDataUrl = viewportRef.current?.captureP1Frame() || "";
          }

          // Sample mini burst frames over ~1.2s - 1.5s for animated GIF loop
          const burst: string[] = [];
          if (primaryDataUrl) burst.push(primaryDataUrl);

          let burstCount = 0;
          const burstInterval = setInterval(() => {
            burstCount++;
            const burstFrame =
              playerMode === "2p" && !isEstafet
                ? viewportRef.current?.captureCombinedFrame()
                : isEstafet && currentShot % 2 === 0
                ? viewportRef.current?.captureP2Frame()
                : viewportRef.current?.captureP1Frame();

            if (burstFrame) burst.push(burstFrame);

            if (burstCount >= 5) {
              clearInterval(burstInterval);

              const newPhoto: CapturedPhoto = {
                id: `${Date.now()}-${currentShot}`,
                frameIndex: currentShot,
                dataUrl: primaryDataUrl,
                burstFrames: burst,
                operator: opTag,
                timestamp: new Date().toLocaleTimeString(),
                filterMode: activeFilter,
              };

              setCapturedPhotos((prev) => [...prev, newPhoto]);

              // Broadcast captured frame to peer
              if (connectionStatus === "CONNECTED") {
                sendMessage({
                  type: "EXCHANGE_FRAME",
                  slot: currentShot,
                  dataUrl: primaryDataUrl,
                  burstFrames: burst,
                });
              }

              if (currentShot < 4) {
                setCurrentShot((prev) => prev + 1);
              } else {
                // 4 shots completed: Transition to Receipt!
                retroAudio.playSuccess();
                setTimeout(() => {
                  setCurrentScreen("RECEIPT");
                  if (connectionStatus === "CONNECTED") {
                    sendMessage({ type: "NAVIGATE", screen: "RECEIPT" });
                  }
                }, 700);
              }
            }
          }, 200);

          setTimeout(() => {
            setFlash(false);
            setIsSnapping(false);
            setCountdown(null);
          }, 320);
        }
      }, 1000);
    },
    [
      isSnapping,
      countdown,
      playerMode,
      isEstafet,
      currentShot,
      activeFilter,
      connectionStatus,
      sendMessage,
    ]
  );

  // Hook remote countdown trigger
  useEffect(() => {
    setOnCountdownSync((sec) => {
      executeCountdownAndSnap(sec);
    });
  }, [setOnCountdownSync, executeCountdownAndSnap]);

  // Hook remote frame exchange
  useEffect(() => {
    setOnRemoteFrame((slot, url, burst) => {
      setCapturedPhotos((prev) => {
        const existing = prev.find((p) => p.frameIndex === slot);
        if (existing) {
          return prev.map((p) =>
            p.frameIndex === slot ? { ...p, dataUrlP2: url, burstFramesP2: burst } : p
          );
        }
        return prev;
      });
    });
  }, [setOnRemoteFrame]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Shutter action triggered by user
  const handleShutterTrigger = () => {
    if (connectionStatus === "CONNECTED") {
      sendMessage({ type: "START_COUNTDOWN", seconds: timerSeconds });
    }
    executeCountdownAndSnap(timerSeconds);
  };

  // Start booth session from Lobby
  const handleStartBooth = () => {
    retroAudio.playCoin();
    setCurrentShot(1);
    setCapturedPhotos([]);
    setCurrentScreen("CAMERA");
    if (connectionStatus === "CONNECTED") {
      sendMessage({ type: "NAVIGATE", screen: "CAMERA" });
    }
  };

  // Physical button mappings from ConsoleFrame
  const handleButtonA = () => {
    retroAudio.playPlasticClick();
    if (currentScreen === "LOBBY") {
      handleStartBooth();
    } else if (currentScreen === "CAMERA") {
      handleShutterTrigger();
    } else if (currentScreen === "RECEIPT") {
      retroAudio.playSuccess();
    }
  };

  const handleButtonB = () => {
    retroAudio.playPlasticClick();
    if (currentScreen === "CAMERA") {
      setCurrentScreen("LOBBY");
      if (connectionStatus === "CONNECTED") {
        sendMessage({ type: "NAVIGATE", screen: "LOBBY" });
      }
    } else if (currentScreen === "RECEIPT") {
      setCurrentScreen("CAMERA");
      if (connectionStatus === "CONNECTED") {
        sendMessage({ type: "NAVIGATE", screen: "CAMERA" });
      }
    }
  };

  const handleSelect = () => {
    retroAudio.playPlasticClick();
    const nextMode = playerMode === "1p" ? "2p" : "1p";
    setPlayerMode(nextMode);
    setCaptureScheme(nextMode === "2p" ? "SPLIT-SCREEN" : "SOLO RIG");
  };

  const handleStart = () => {
    retroAudio.playPlasticClick();
    if (currentScreen === "LOBBY") {
      handleStartBooth();
    } else if (currentScreen === "CAMERA") {
      handleShutterTrigger();
    }
  };

  return (
    <ConsoleFrame
      currentScreen={currentScreen}
      onNavigate={(screen) => {
        retroAudio.playPlasticClick();
        setCurrentScreen(screen);
        if (connectionStatus === "CONNECTED") {
          sendMessage({ type: "NAVIGATE", screen });
        }
      }}
      onButtonAPress={handleButtonA}
      onButtonBPress={handleButtonB}
      onStartPress={handleStart}
      onSelectPress={handleSelect}
    >
      {/* White screen flash overlay */}
      {flash && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200" />
      )}

      {/* Screen 1: Lobby */}
      {currentScreen === "LOBBY" && (
        <LobbyScreen
          playerMode={playerMode}
          onPlayerModeChange={(mode) => {
            setPlayerMode(mode);
            setCaptureScheme(mode === "2p" ? "SPLIT-SCREEN" : "SOLO RIG");
          }}
          selectedLayout={selectedLayout}
          onLayoutChange={(layout) => {
            setSelectedLayout(layout);
            if (connectionStatus === "CONNECTED") {
              sendMessage({ type: "SET_LAYOUT", layout });
            }
          }}
          roomCode={roomCode}
          onRefreshRoomCode={() => {
            const nextCode = `${Math.floor(100 + Math.random() * 900)}${Math.floor(10 + Math.random() * 90)}A`;
            setRoomCode(nextCode);
          }}
          onStartBooth={handleStartBooth}
          onCreateRoom={() => {
            createRoom();
          }}
          onJoinRoom={(code) => {
            joinRoom(code);
          }}
          connectionStatus={connectionStatus}
          shareableUrl={shareableUrl}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      )}

      {/* Screen 2: Camera + Control Deck */}
      {currentScreen === "CAMERA" && (
        <>
          <CameraViewport
            ref={viewportRef}
            playerMode={playerMode}
            onPlayerModeChange={(mode) => {
              setPlayerMode(mode);
              setCaptureScheme(mode === "2p" ? "SPLIT-SCREEN" : "SOLO RIG");
            }}
            activeFilter={activeFilter}
            currentShot={currentShot}
            totalShots={4}
            countdown={countdown}
            onSnap={handleShutterTrigger}
            remoteStream={remoteStream}
            connectionStatus={connectionStatus}
            pingMs={pingMs}
            isEstafet={isEstafet}
          />
          <ControlDeck
            activeFilter={activeFilter}
            onFilterChange={(filter) => {
              setActiveFilter(filter);
              if (connectionStatus === "CONNECTED") {
                sendMessage({ type: "SET_FILTER", filter });
              }
            }}
            captureScheme={captureScheme}
            onSchemeChange={(scheme) => {
              setCaptureScheme(scheme);
              setPlayerMode(scheme === "SPLIT-SCREEN" ? "2p" : "1p");
            }}
            onShutterPress={handleShutterTrigger}
            isSnapping={isSnapping}
            currentShot={currentShot}
            totalShots={4}
            timerSeconds={timerSeconds}
            onTimerChange={setTimerSeconds}
            playerMode={playerMode}
            isEstafet={isEstafet}
            onEstafetToggle={(enabled) => {
              setIsEstafet(enabled);
              if (connectionStatus === "CONNECTED") {
                sendMessage({ type: "ESTAFET_TOGGLE", enabled });
              }
            }}
          />
        </>
      )}

      {/* Screen 3: Receipt */}
      {currentScreen === "RECEIPT" && (
        <ReceiptScreen
          playerMode={playerMode}
          onPlayerModeChange={setPlayerMode}
          onTakeAnother={() => {
            setCurrentShot(1);
            setCapturedPhotos([]);
            setCurrentScreen("CAMERA");
            if (connectionStatus === "CONNECTED") {
              sendMessage({ type: "NAVIGATE", screen: "CAMERA" });
            }
          }}
          capturedPhotos={capturedPhotos}
          selectedLayout={selectedLayout}
        />
      )}
    </ConsoleFrame>
  );
}
