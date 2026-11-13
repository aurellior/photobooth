"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { DataConnection, MediaConnection } from "peerjs";
import QRCode from "qrcode";
import { FilterMode, StripLayout, ScreenType } from "@/types/booth";

export type ConnectionStatus = "IDLE" | "HOSTING" | "CONNECTING" | "CONNECTED" | "ERROR";
export type PlayerRole = "HOST" | "GUEST" | null;

export interface PeerMessage {
  type:
    | "PING"
    | "PONG"
    | "SET_FILTER"
    | "SET_LAYOUT"
    | "START_COUNTDOWN"
    | "ESTAFET_TOGGLE"
    | "EXCHANGE_FRAME"
    | "NAVIGATE";
  filter?: FilterMode;
  layout?: StripLayout;
  seconds?: number;
  enabled?: boolean;
  screen?: ScreenType;
  slot?: number;
  dataUrl?: string;
  burstFrames?: string[];
  timestamp?: number;
}

export function useCoopRoom(localStream: MediaStream | null) {
  const [status, setStatus] = useState<ConnectionStatus>("IDLE");
  const [role, setRole] = useState<PlayerRole>(null);
  const [roomCode, setRoomCode] = useState<string>("884-21A");
  const [shareableUrl, setShareableUrl] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [pingMs, setPingMs] = useState<number>(24);
  const [isEstafet, setIsEstafet] = useState<boolean>(false);

  // Callbacks for synchronized events
  const onFilterSyncRef = useRef<((filter: FilterMode) => void) | null>(null);
  const onLayoutSyncRef = useRef<((layout: StripLayout) => void) | null>(null);
  const onCountdownSyncRef = useRef<((seconds: number) => void) | null>(null);
  const onEstafetSyncRef = useRef<((enabled: boolean) => void) | null>(null);
  const onNavigateSyncRef = useRef<((screen: ScreenType) => void) | null>(null);
  const onRemoteFrameRef = useRef<
    ((slot: number, dataUrl: string, burstFrames: string[]) => void) | null
  >(null);

  // PeerJS instances
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const peerInstanceRef = useRef<any>(null);
  const dataConnRef = useRef<DataConnection | null>(null);
  const mediaConnRef = useRef<MediaConnection | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean room code for Peer ID (only letters and numbers)
  const formatRoomCode = (raw: string) => {
    return raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
  };

  // Generate QR code whenever shareableUrl changes
  useEffect(() => {
    if (shareableUrl) {
      QRCode.toDataURL(shareableUrl, {
        width: 180,
        margin: 1,
        color: {
          dark: "#1a1917",
          light: "#fef9e7",
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch(() => {});
    }
  }, [shareableUrl]);

  // Clean up all connections
  const disconnect = useCallback(() => {
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (dataConnRef.current) {
      dataConnRef.current.close();
      dataConnRef.current = null;
    }
    if (mediaConnRef.current) {
      mediaConnRef.current.close();
      mediaConnRef.current = null;
    }
    if (peerInstanceRef.current) {
      peerInstanceRef.current.destroy();
      peerInstanceRef.current = null;
    }
    setRemoteStream(null);
    setStatus("IDLE");
    setRole(null);
  }, []);

  // Send message over WebRTC DataChannel
  const sendMessage = useCallback((msg: PeerMessage) => {
    if (dataConnRef.current && dataConnRef.current.open) {
      dataConnRef.current.send(msg);
    }
  }, []);

  // Handle incoming DataChannel messages
  const handleDataMessage = useCallback(
    (msg: PeerMessage) => {
      switch (msg.type) {
        case "PING":
          sendMessage({ type: "PONG", timestamp: msg.timestamp });
          break;
        case "PONG":
          if (msg.timestamp) {
            const rtt = Date.now() - msg.timestamp;
            setPingMs(Math.max(8, Math.round(rtt / 2)));
          }
          break;
        case "SET_FILTER":
          if (msg.filter && onFilterSyncRef.current) {
            onFilterSyncRef.current(msg.filter);
          }
          break;
        case "SET_LAYOUT":
          if (msg.layout && onLayoutSyncRef.current) {
            onLayoutSyncRef.current(msg.layout);
          }
          break;
        case "START_COUNTDOWN":
          if (typeof msg.seconds === "number" && onCountdownSyncRef.current) {
            onCountdownSyncRef.current(msg.seconds);
          }
          break;
        case "ESTAFET_TOGGLE":
          if (typeof msg.enabled === "boolean") {
            setIsEstafet(msg.enabled);
            if (onEstafetSyncRef.current) {
              onEstafetSyncRef.current(msg.enabled);
            }
          }
          break;
        case "NAVIGATE":
          if (msg.screen && onNavigateSyncRef.current) {
            onNavigateSyncRef.current(msg.screen);
          }
          break;
        case "EXCHANGE_FRAME":
          if (
            typeof msg.slot === "number" &&
            msg.dataUrl &&
            onRemoteFrameRef.current
          ) {
            onRemoteFrameRef.current(msg.slot, msg.dataUrl, msg.burstFrames || []);
          }
          break;
      }
    },
    [sendMessage]
  );

  // Setup periodic ping
  const startPing = useCallback(() => {
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    pingIntervalRef.current = setInterval(() => {
      sendMessage({ type: "PING", timestamp: Date.now() });
    }, 2000);
  }, [sendMessage]);

  // Host a new Co-op Room (P1)
  const createRoom = useCallback(
    async (codeToUse?: string) => {
      disconnect();

      const rawCode = codeToUse || roomCode;
      const cleanCode = formatRoomCode(rawCode);
      const hostPeerId = `coop98-${cleanCode}-p1`;

      if (typeof window !== "undefined") {
        const origin = window.location.origin;
        setShareableUrl(`${origin}/?room=${cleanCode}`);
      }

      setStatus("HOSTING");
      setRole("HOST");

      try {
        const { default: Peer } = await import("peerjs");
        const peer = new Peer(hostPeerId, {
          debug: 1,
        });
        peerInstanceRef.current = peer;

        peer.on("open", () => {
          setStatus("HOSTING");
        });

        // Answer incoming data connection
        peer.on("connection", (conn) => {
          dataConnRef.current = conn;

          conn.on("open", () => {
            setStatus("CONNECTED");
            startPing();
          });

          conn.on("data", (data) => {
            handleDataMessage(data as PeerMessage);
          });

          conn.on("close", () => {
            setStatus("HOSTING");
            setRemoteStream(null);
          });
        });

        // Answer incoming video media call
        peer.on("call", (call) => {
          mediaConnRef.current = call;
          if (localStream) {
            call.answer(localStream);
          } else {
            // Answer without sending local stream if unavailable
            call.answer();
          }

          call.on("stream", (remote) => {
            setRemoteStream(remote);
            setStatus("CONNECTED");
          });

          call.on("close", () => {
            setRemoteStream(null);
          });
        });

        peer.on("error", (err) => {
          console.warn("Peer error (retrying with new room code):", err);
          // If ID is already taken, regenerate
          if (err.type === "unavailable-id") {
            const nextCode = `${Math.floor(100 + Math.random() * 900)}${Math.floor(10 + Math.random() * 90)}A`;
            setRoomCode(nextCode);
            createRoom(nextCode);
          } else {
            setStatus("ERROR");
          }
        });
      } catch (err) {
        console.error("Failed to load PeerJS:", err);
        setStatus("ERROR");
      }
    },
    [disconnect, roomCode, localStream, startPing, handleDataMessage]
  );

  // Join an existing Co-op Room (P2)
  const joinRoom = useCallback(
    async (codeToJoin: string) => {
      disconnect();

      const cleanCode = formatRoomCode(codeToJoin);
      const hostPeerId = `coop98-${cleanCode}-p1`;
      const guestPeerId = `coop98-${cleanCode}-p2-${Math.floor(Math.random() * 9999)}`;

      setStatus("CONNECTING");
      setRole("GUEST");

      try {
        const { default: Peer } = await import("peerjs");
        const peer = new Peer(guestPeerId, {
          debug: 1,
        });
        peerInstanceRef.current = peer;

        peer.on("open", () => {
          // 1. Establish Data Connection with Host
          const conn = peer.connect(hostPeerId, { reliable: true });
          dataConnRef.current = conn;

          conn.on("open", () => {
            setStatus("CONNECTED");
            startPing();
          });

          conn.on("data", (data) => {
            handleDataMessage(data as PeerMessage);
          });

          conn.on("close", () => {
            setStatus("IDLE");
            setRemoteStream(null);
          });

          // 2. Establish Media Call with Host
          if (localStream) {
            const call = peer.call(hostPeerId, localStream);
            mediaConnRef.current = call;

            call.on("stream", (remote) => {
              setRemoteStream(remote);
              setStatus("CONNECTED");
            });

            call.on("close", () => {
              setRemoteStream(null);
            });
          }
        });

        peer.on("error", (err) => {
          console.error("Peer join error:", err);
          setStatus("ERROR");
        });
      } catch (err) {
        console.error("Failed to load PeerJS:", err);
        setStatus("ERROR");
      }
    },
    [disconnect, localStream, startPing, handleDataMessage]
  );

  // Check URL query parameters on mount (?room=XXXXXX) to auto-join
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get("room");
      if (roomParam) {
        const clean = formatRoomCode(roomParam);
        setRoomCode(clean);
        // Will auto-join once user confirms or when media is ready
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
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
    disconnect,
    sendMessage,
    // Callback setters
    setOnFilterSync: (fn: (filter: FilterMode) => void) => {
      onFilterSyncRef.current = fn;
    },
    setOnLayoutSync: (fn: (layout: StripLayout) => void) => {
      onLayoutSyncRef.current = fn;
    },
    setOnCountdownSync: (fn: (seconds: number) => void) => {
      onCountdownSyncRef.current = fn;
    },
    setOnEstafetSync: (fn: (enabled: boolean) => void) => {
      onEstafetSyncRef.current = fn;
    },
    setOnNavigateSync: (fn: (screen: ScreenType) => void) => {
      onNavigateSyncRef.current = fn;
    },
    setOnRemoteFrame: (
      fn: (slot: number, dataUrl: string, burstFrames: string[]) => void
    ) => {
      onRemoteFrameRef.current = fn;
    },
  };
}

