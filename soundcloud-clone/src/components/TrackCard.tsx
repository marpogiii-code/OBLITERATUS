"use client";

import Link from "next/link";
import { usePlayer } from "@/contexts/PlayerContext";
import { useSession } from "next-auth/react";
import { TrackWithUser } from "@/types";
import { formatDuration, formatTimeAgo, formatCount } from "@/lib/utils";
import { useState } from "react";

interface TrackCardProps {
  track: TrackWithUser;
  tracks?: TrackWithUser[];
  showWaveform?: boolean;
}

export default function TrackCard({
  track,
  tracks,
  showWaveform = false,
}: TrackCardProps) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const { data: session } = useSession();
  const [liked, setLiked] = useState(track.isLiked || false);
  const [likeCount, setLikeCount] = useState(track._count?.likes || 0);

  const isCurrentTrack = currentTrack?.id === track.id;

  const handlePlay = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(track, tracks);
    }
  };

  const handleLike = async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/tracks/${track.id}/like`, {
        method: "POST",
      });
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));
    } catch {
      // ignore
    }
  };

  if (showWaveform) {
    return (
      <div className="bg-sc-dark-3 rounded overflow-hidden">
        <div className="flex">
          {/* Cover */}
          <div className="w-[160px] h-[160px] flex-shrink-0 relative group">
            {track.coverUrl ? (
              <img
                src={track.coverUrl}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-sc-orange to-orange-800" />
            )}
            <button
              onClick={handlePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="w-12 h-12 rounded-full bg-sc-orange flex items-center justify-center">
                {isCurrentTrack && isPlaying ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </div>
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/profile/${track.user.username}`}
                className="text-xs text-sc-gray hover:text-white transition-colors"
              >
                {track.user.displayName}
              </Link>
              <span className="text-xs text-sc-gray-dark">
                {formatTimeAgo(track.createdAt)}
              </span>
            </div>
            <Link
              href={`/track/${track.id}`}
              className="text-sm text-white hover:underline block truncate mb-3"
            >
              {track.title}
            </Link>

            {/* Waveform placeholder */}
            <div className="h-[60px] bg-sc-dark-4 rounded mb-3 flex items-end px-1 gap-[1px]">
              {Array.from({ length: 80 }, (_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t transition-colors"
                  style={{
                    height: `${Math.random() * 80 + 10}%`,
                    backgroundColor:
                      isCurrentTrack && isPlaying
                        ? i < 40
                          ? "#ff5500"
                          : "#4a4a4a"
                        : "#4a4a4a",
                  }}
                />
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  liked
                    ? "text-sc-orange"
                    : "text-sc-gray hover:text-white"
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {formatCount(likeCount)}
              </button>
              <span className="flex items-center gap-1 text-xs text-sc-gray">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {formatCount(track.plays)}
              </span>
              <span className="flex items-center gap-1 text-xs text-sc-gray">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
                </svg>
                {formatCount(track._count?.comments || 0)}
              </span>
              <span className="text-xs text-sc-gray ml-auto">
                {formatDuration(track.duration)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <div className="relative aspect-square bg-sc-dark-4 rounded overflow-hidden mb-2">
        {track.coverUrl ? (
          <img
            src={track.coverUrl}
            alt={track.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-sc-orange to-orange-800" />
        )}
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="w-12 h-12 rounded-full bg-sc-orange flex items-center justify-center shadow-lg">
            {isCurrentTrack && isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </button>
        {isCurrentTrack && isPlaying && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1">
            <div className="w-1 h-3 bg-sc-orange animate-pulse rounded" />
            <div className="w-1 h-4 bg-sc-orange animate-pulse rounded delay-75" />
            <div className="w-1 h-2 bg-sc-orange animate-pulse rounded delay-150" />
          </div>
        )}
      </div>
      <Link
        href={`/track/${track.id}`}
        className="text-sm text-white hover:underline block truncate"
      >
        {track.title}
      </Link>
      <Link
        href={`/profile/${track.user.username}`}
        className="text-xs text-sc-gray hover:text-white transition-colors block truncate"
      >
        {track.user.displayName}
      </Link>
      <div className="flex items-center gap-3 mt-1 text-xs text-sc-gray">
        <span className="flex items-center gap-0.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          {formatCount(track.plays)}
        </span>
        <span className="flex items-center gap-0.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          {formatCount(likeCount)}
        </span>
      </div>
    </div>
  );
}
