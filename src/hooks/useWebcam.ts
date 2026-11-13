"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface WebcamError {
  type: "PERMISSION_DENIED" | "DEVICE_NOT_FOUND" | "UNREADABLE" | "UNKNOWN";
  message: string;
  code: string;
}

export function useWebcam() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<WebcamError | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, []);

  const startStream = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    stopStream();

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError({
        type: "DEVICE_NOT_FOUND",
        message: "COMMUNICATION BUS ERROR: No camera hardware interface found on host.",
        code: "ERR_NO_MEDIA_DEVICES",
      });
      setIsLoading(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        // Wait until video has loaded metadata to ensure natural dimensions
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current
              .play()
              .then(() => {
                setIsReady(true);
                setIsLoading(false);
              })
              .catch((playErr) => {
                console.error("Video play error:", playErr);
                setIsReady(true);
                setIsLoading(false);
              });
          }
        };
      }
    } catch (err: unknown) {
      setIsLoading(false);
      setIsReady(false);

      const errorObj = err as { name?: string; message?: string };
      if (
        errorObj.name === "NotAllowedError" ||
        errorObj.name === "PermissionDeniedError"
      ) {
        setError({
          type: "PERMISSION_DENIED",
          message:
            "SECURITY ACCESS REJECTED: CMOS optical sensor permission was denied by operator. Please allow camera access in browser permissions.",
          code: "SEC_FAULT_ACCESS_DENIED_0x13",
        });
      } else if (
        errorObj.name === "NotFoundError" ||
        errorObj.name === "DevicesNotFoundError"
      ) {
        setError({
          type: "DEVICE_NOT_FOUND",
          message:
            "HARDWARE DISCONNECTED: Optical lens sensor (CAM-01) not found in link port.",
          code: "HW_FAULT_DEV_NOT_FOUND_0x04",
        });
      } else if (
        errorObj.name === "NotReadableError" ||
        errorObj.name === "TrackStartError"
      ) {
        setError({
          type: "UNREADABLE",
          message:
            "I/O BUS BUSY: Camera hardware is in use by another peripheral process.",
          code: "IO_RESOURCE_LOCKED_0x0A",
        });
      } else {
        setError({
          type: "UNKNOWN",
          message: errorObj.message || "UNIDENTIFIED PERIPHERAL EXCEPTION OCCURRED.",
          code: "SYS_HALT_UNKNOWN_0xFF",
        });
      }
    }
  }, [stopStream]);

  useEffect(() => {
    startStream();
    return () => {
      stopStream();
    };
  }, [startStream, stopStream]);

  return {
    videoRef,
    stream: streamRef.current,
    isLoading,
    isReady,
    error,
    retry: startStream,
    stop: stopStream,
  };
}

