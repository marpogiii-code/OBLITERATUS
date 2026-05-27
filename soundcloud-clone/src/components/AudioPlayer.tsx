"use client";

import { usePlayer } from "@/contexts/PlayerContext";
import { formatDuration } from "@/lib/utils";
import Waveform from "./Waveform";
import Link from "next/link";

export default function AudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    togglePlay,
    seekTo,
    setVolume,
    toggleMute,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
  } = usePlayer();

  if (!currentTrack) return null;

  const waveformData = currentTrack.waveformData
    ? JSON.parse(currentTrack.waveformData)
    : Array.from({ length: 200 }, () => Math.random() * 0.8 + 0.1);

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-sc-dark-2 border-t border-sc-dark-4 z-50 h-[56px]">
      <div className="flex items-center h-full px-4 gap-4 max-w-screen-2xl mx-auto">
        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevTrack}
            className="text-sc-gray hover:text-white transition-colors"
            title="Previous"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-sc-orange hover:bg-sc-orange-dark flex items-center justify-center transition-colors"
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={nextTrack}
            className="text-sc-gray hover:text-white transition-colors"
            title="Next"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* Time */}
        <span className="text-xs text-sc-gray w-10 text-right tabular-nums">
          {formatDuration(currentTime)}
        </span>

        {/* Waveform */}
        <div className="flex-1 min-w-0">
          <Waveform
            data={waveformData}
            progress={progress}
            onSeek={(p) => seekTo(p * duration)}
            height={32}
            barWidth={2}
            barGap={1}
          />
        </div>

        {/* Duration */}
        <span className="text-xs text-sc-gray w-10 tabular-nums">
          {formatDuration(duration)}
        </span>

        {/* Volume */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMute}
            className="text-sc-gray hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 h-1 accent-sc-orange"
          />
        </div>

        {/* Shuffle & Repeat */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleShuffle}
            className={`transition-colors ${isShuffled ? "text-sc-orange" : "text-sc-gray hover:text-white"}`}
            title="Shuffle"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
            </svg>
          </button>
          <button
            onClick={toggleRepeat}
            className={`transition-colors relative ${repeatMode !== "none" ? "text-sc-orange" : "text-sc-gray hover:text-white"}`}
            title={`Repeat: ${repeatMode}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
            </svg>
            {repeatMode === "one" && (
              <span className="absolute -top-1 -right-1 text-[8px] font-bold">1</span>
            )}
          </button>
        </div>

        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-0 max-w-[200px]">
          <div className="w-8 h-8 rounded bg-sc-dark-4 flex-shrink-0 overflow-hidden">
            {currentTrack.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-sc-orange to-orange-700" />
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/track/${currentTrack.id}`}
              className="text-xs text-white truncate block hover:underline"
            >
              {currentTrack.title}
            </Link>
            <Link
              href={`/profile/${currentTrack.user.username}`}
              className="text-[10px] text-sc-gray truncate block hover:underline"
            >
              {currentTrack.user.displayName}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
