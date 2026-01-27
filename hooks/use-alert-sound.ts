"use client";

import { useRef, useCallback } from "react";

interface UseAlertSoundOptions {
  soundPath?: string;
  throttleMs?: number;
}

export function useAlertSound({
  soundPath = "/siren-alert.mp3",
  throttleMs = 8000, // 8 seconds cooldown between plays
}: UseAlertSoundOptions = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  const playAlertSound = useCallback(() => {
    const now = Date.now();
    const timeSinceLastPlay = now - lastPlayedRef.current;

    // Check if enough time has passed since last play (throttling)
    if (timeSinceLastPlay < throttleMs) {
      console.log(
        `[v0] Alert sound throttled. Wait ${Math.ceil((throttleMs - timeSinceLastPlay) / 1000)}s before next alert`,
      );
      return;
    }

    // Ensure audio element exists
    if (!audioRef.current) {
      audioRef.current = new Audio(soundPath);
      audioRef.current.preload = "auto";
    }

    try {
      // Reset audio to start and play
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isPlayingRef.current = true;
            lastPlayedRef.current = now;
            console.log("[v0] Alert sound playing");
          })
          .catch((error) => {
            console.error("[v0] Alert sound play failed:", error);
          });
      }
    } catch (error) {
      console.error("[v0] Error playing alert sound:", error);
    }
  }, [soundPath, throttleMs]);

  const stopAlertSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      isPlayingRef.current = false;
      console.log("[v0] Alert sound stopped");
    }
  }, []);

  return {
    playAlertSound,
    stopAlertSound,
    isPlaying: isPlayingRef,
  };
}
