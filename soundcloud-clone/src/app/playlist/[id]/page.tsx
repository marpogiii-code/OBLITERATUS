"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { usePlayer } from "@/contexts/PlayerContext";
import TrackCard from "@/components/TrackCard";
import { PlaylistWithUser, TrackWithUser } from "@/types";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";

export default function PlaylistPage() {
  const params = useParams();
  const { playTrack } = usePlayer();
  const [playlist, setPlaylist] = useState<PlaylistWithUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlaylist = useCallback(async () => {
    try {
      const res = await fetch(`/api/playlists/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setPlaylist(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-sc-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Playlist not found</h1>
        <Link href="/" className="text-sc-orange hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  const playlistTracks: TrackWithUser[] = playlist.tracks.map(
    (pt) => pt.track
  );

  const handlePlayAll = () => {
    if (playlistTracks.length > 0) {
      playTrack(playlistTracks[0], playlistTracks);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-b from-sc-dark-3 to-sc-dark">
        <div className="max-w-screen-xl mx-auto px-4 py-8">
          <div className="flex gap-6">
            <div className="w-[200px] h-[200px] flex-shrink-0 rounded overflow-hidden">
              {playlist.coverUrl ? (
                <img
                  src={playlist.coverUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="white"
                    opacity="0.5"
                  >
                    <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-end">
              <p className="text-xs text-sc-gray mb-1">PLAYLIST</p>
              <h1 className="text-3xl font-bold mb-2">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-sm text-sc-gray mb-3">
                  {playlist.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-sm text-sc-gray">
                <Link
                  href={`/profile/${playlist.user.username}`}
                  className="hover:text-white transition-colors"
                >
                  {playlist.user.displayName}
                </Link>
                <span>·</span>
                <span>{playlist._count?.tracks || 0} tracks</span>
                <span>·</span>
                <span>{formatTimeAgo(playlist.createdAt)}</span>
              </div>
              <div className="mt-4">
                <button
                  onClick={handlePlayAll}
                  className="px-6 py-2.5 bg-sc-orange hover:bg-sc-orange-dark text-white font-semibold rounded-sm transition-colors"
                >
                  Play all
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {playlistTracks.length > 0 ? (
          <div className="space-y-3">
            {playlistTracks.map((track, i) => (
              <div key={track.id} className="flex items-center gap-3">
                <span className="text-sm text-sc-gray w-6 text-right">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <TrackCard
                    track={track}
                    tracks={playlistTracks}
                    showWaveform
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-sc-dark-3 rounded-lg">
            <p className="text-sc-gray">This playlist is empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
