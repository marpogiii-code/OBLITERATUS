"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePlayer } from "@/contexts/PlayerContext";
import CommentSection from "@/components/CommentSection";
import Waveform from "@/components/Waveform";
import Link from "next/link";
import { TrackWithUser, CommentWithUser } from "@/types";
import { formatDuration, formatTimeAgo, formatCount } from "@/lib/utils";

export default function TrackPage() {
  const params = useParams();
  const { data: session } = useSession();
  const {
    playTrack,
    currentTrack,
    isPlaying,
    togglePlay,
    currentTime,
    duration,
    seekTo,
  } = usePlayer();
  const [track, setTrack] = useState<TrackWithUser | null>(null);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTrack = useCallback(async () => {
    try {
      const res = await fetch(`/api/tracks/${params.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setTrack(data);
      setComments(data.comments || []);
      setLiked(data.isLiked || false);
      setLikeCount(data._count?.likes || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchTrack();
  }, [fetchTrack]);

  useEffect(() => {
    if (track && session) {
      fetch(`/api/users/${track.userId}`).then(async (res) => {
        if (res.ok) {
          const user = await res.json();
          setFollowing(user.isFollowing || false);
        }
      });
    }
  }, [track, session]);

  const handlePlay = () => {
    if (!track) return;
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  const handleLike = async () => {
    if (!session || !track) return;
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

  const handleFollow = async () => {
    if (!session || !track) return;
    try {
      const res = await fetch(`/api/users/${track.userId}/follow`, {
        method: "POST",
      });
      const data = await res.json();
      setFollowing(data.following);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-sc-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Track not found</h1>
        <Link href="/" className="text-sc-orange hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  const isCurrentTrack = currentTrack?.id === track.id;
  const waveformData = track.waveformData
    ? JSON.parse(track.waveformData)
    : Array.from({ length: 200 }, () => Math.random() * 0.8 + 0.1);
  const progress =
    isCurrentTrack && duration > 0 ? currentTime / duration : 0;

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-sc-dark-3 to-sc-dark">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 min-w-0">
              {/* Track Info */}
              <div className="flex items-start gap-4 mb-4">
                <button
                  onClick={handlePlay}
                  className="w-14 h-14 rounded-full bg-sc-orange hover:bg-sc-orange-dark flex items-center justify-center flex-shrink-0 transition-colors"
                >
                  {isCurrentTrack && isPlaying ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <div className="min-w-0">
                  <Link
                    href={`/profile/${track.user.username}`}
                    className="text-sm text-sc-gray hover:text-white transition-colors"
                  >
                    {track.user.displayName}
                  </Link>
                  <h1 className="text-2xl font-bold truncate">{track.title}</h1>
                  <div className="flex items-center gap-3 mt-1 text-xs text-sc-gray">
                    <span>{formatTimeAgo(track.createdAt)}</span>
                    {track.genre !== "None" && (
                      <span className="px-2 py-0.5 bg-sc-dark-4 rounded-sm">
                        #{track.genre}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Waveform */}
              <div className="mb-4">
                <Waveform
                  data={waveformData}
                  progress={progress}
                  onSeek={(p) => {
                    if (isCurrentTrack) {
                      seekTo(p * duration);
                    } else {
                      playTrack(track);
                    }
                  }}
                  height={80}
                />
              </div>
            </div>

            {/* Cover Art */}
            <div className="w-[260px] h-[260px] flex-shrink-0 rounded overflow-hidden">
              {track.coverUrl ? (
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-sc-orange to-orange-800 flex items-center justify-center">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="white" opacity="0.3">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions & Details */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-sc-dark-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-sm border transition-colors ${
              liked
                ? "border-sc-orange text-sc-orange"
                : "border-sc-dark-4 text-sc-gray hover:border-sc-gray hover:text-white"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            Like
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-sm border border-sc-dark-4 text-sc-gray hover:border-sc-gray hover:text-white transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
            </svg>
            Share
          </button>
          {session &&
            (session.user as { id: string }).id !== track.userId && (
              <button
                onClick={handleFollow}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-sm transition-colors ${
                  following
                    ? "bg-sc-orange text-white"
                    : "border border-sc-orange text-sc-orange hover:bg-sc-orange hover:text-white"
                }`}
              >
                {following ? "Following" : "Follow"}
              </button>
            )}

          {/* Stats */}
          <div className="flex items-center gap-4 ml-auto text-xs text-sc-gray">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              {formatCount(track.plays)}
            </span>
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {formatCount(likeCount)}
            </span>
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
              </svg>
              {formatCount(comments.length)}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left - Comments & Description */}
          <div className="flex-1 min-w-0">
            {/* Artist Info */}
            <div className="flex items-center gap-3 mb-6">
              <Link
                href={`/profile/${track.user.username}`}
                className="w-10 h-10 rounded-full bg-sc-dark-4 overflow-hidden flex-shrink-0"
              >
                {track.user.avatarUrl ? (
                  <img
                    src={track.user.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sc-gray bg-gradient-to-br from-purple-600 to-blue-500">
                    {track.user.displayName[0]?.toUpperCase()}
                  </div>
                )}
              </Link>
              <Link
                href={`/profile/${track.user.username}`}
                className="text-sm text-sc-gray hover:text-white transition-colors"
              >
                {track.user.displayName}
              </Link>
            </div>

            {/* Description */}
            {track.description && (
              <p className="text-sm text-sc-gray mb-6 whitespace-pre-wrap">
                {track.description}
              </p>
            )}

            {/* Tags */}
            {track.tags && (
              <div className="flex flex-wrap gap-2 mb-6">
                {track.tags.split(",").map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs bg-sc-dark-3 text-sc-gray rounded-sm"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* Comments */}
            <h3 className="text-lg font-semibold mb-4">
              {comments.length} comment{comments.length !== 1 ? "s" : ""}
            </h3>
            <CommentSection
              trackId={track.id}
              comments={comments}
              currentTime={isCurrentTrack ? currentTime : 0}
            />
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[300px] flex-shrink-0">
            <div className="bg-sc-dark-3 rounded p-4">
              <h3 className="text-sm font-semibold mb-3">Track info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-sc-gray">Duration</span>
                  <span>{formatDuration(track.duration)}</span>
                </div>
                {track.genre !== "None" && (
                  <div className="flex justify-between">
                    <span className="text-sc-gray">Genre</span>
                    <span>{track.genre}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sc-gray">Uploaded</span>
                  <span>{formatTimeAgo(track.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
