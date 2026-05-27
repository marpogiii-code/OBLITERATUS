"use client";

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { TrackWithUser } from "@/types";

interface PlayerState {
  currentTrack: TrackWithUser | null;
  queue: TrackWithUser[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: "none" | "all" | "one";
}

interface PlayerContextType extends PlayerState {
  audioRef: React.RefObject<HTMLAudioElement>;
  playTrack: (track: TrackWithUser, queue?: TrackWithUser[]) => void;
  togglePlay: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: TrackWithUser) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null!);
  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    isShuffled: false,
    repeatMode: "none",
  });

  const playTrack = useCallback(
    (track: TrackWithUser, queue?: TrackWithUser[]) => {
      const newQueue = queue || [track];
      const idx = newQueue.findIndex((t) => t.id === track.id);
      setState((prev) => ({
        ...prev,
        currentTrack: track,
        queue: newQueue,
        queueIndex: idx >= 0 ? idx : 0,
        isPlaying: true,
      }));
      if (audioRef.current) {
        audioRef.current.src = track.audioUrl;
        audioRef.current.play().catch(() => {});
      }
    },
    []
  );

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !state.currentTrack) return;
    if (state.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [state.isPlaying, state.currentTrack]);

  const pause = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState((prev) => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) audioRef.current.volume = vol;
    setState((prev) => ({ ...prev, volume: vol, isMuted: vol === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const newMuted = !state.isMuted;
    audioRef.current.volume = newMuted ? 0 : state.volume;
    setState((prev) => ({ ...prev, isMuted: newMuted }));
  }, [state.isMuted, state.volume]);

  const nextTrack = useCallback(() => {
    if (state.queue.length === 0) return;
    let nextIdx: number;
    if (state.isShuffled) {
      nextIdx = Math.floor(Math.random() * state.queue.length);
    } else {
      nextIdx = state.queueIndex + 1;
      if (nextIdx >= state.queue.length) {
        if (state.repeatMode === "all") nextIdx = 0;
        else return;
      }
    }
    const next = state.queue[nextIdx];
    if (next) {
      setState((prev) => ({
        ...prev,
        currentTrack: next,
        queueIndex: nextIdx,
        isPlaying: true,
      }));
      if (audioRef.current) {
        audioRef.current.src = next.audioUrl;
        audioRef.current.play().catch(() => {});
      }
    }
  }, [state.queue, state.queueIndex, state.isShuffled, state.repeatMode]);

  const prevTrack = useCallback(() => {
    if (state.queue.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    let prevIdx = state.queueIndex - 1;
    if (prevIdx < 0) {
      if (state.repeatMode === "all") prevIdx = state.queue.length - 1;
      else return;
    }
    const prev = state.queue[prevIdx];
    if (prev) {
      setState((p) => ({
        ...p,
        currentTrack: prev,
        queueIndex: prevIdx,
        isPlaying: true,
      }));
      if (audioRef.current) {
        audioRef.current.src = prev.audioUrl;
        audioRef.current.play().catch(() => {});
      }
    }
  }, [state.queue, state.queueIndex, state.repeatMode]);

  const toggleShuffle = useCallback(() => {
    setState((prev) => ({ ...prev, isShuffled: !prev.isShuffled }));
  }, []);

  const toggleRepeat = useCallback(() => {
    const modes: ("none" | "all" | "one")[] = ["none", "all", "one"];
    const idx = modes.indexOf(state.repeatMode);
    setState((prev) => ({
      ...prev,
      repeatMode: modes[(idx + 1) % modes.length],
    }));
  }, [state.repeatMode]);

  const addToQueue = useCallback((track: TrackWithUser) => {
    setState((prev) => ({
      ...prev,
      queue: [...prev.queue, track],
    }));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setState((prev) => ({ ...prev, currentTime: audio.currentTime }));
    };
    const handleLoadedMetadata = () => {
      setState((prev) => ({ ...prev, duration: audio.duration }));
    };
    const handleEnded = () => {
      if (state.repeatMode === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        nextTrack();
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [nextTrack, state.repeatMode]);

  return (
    <PlayerContext.Provider
      value={{
        ...state,
        audioRef,
        playTrack,
        togglePlay,
        pause,
        seekTo,
        setVolume,
        toggleMute,
        nextTrack,
        prevTrack,
        toggleShuffle,
        toggleRepeat,
        addToQueue,
      }}
    >
      <audio ref={audioRef} preload="metadata" />
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
