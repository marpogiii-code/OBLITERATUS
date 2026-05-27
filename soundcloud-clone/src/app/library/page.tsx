"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import TrackCard from "@/components/TrackCard";
import { TrackWithUser, PlaylistWithUser } from "@/types";
import Link from "next/link";

type Tab = "likes" | "playlists" | "following" | "history";

export default function LibraryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("likes");
  const [tracks, setTracks] = useState<TrackWithUser[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (!session) return;

    async function fetchData() {
      setLoading(true);
      try {
        const userId = (session?.user as { id: string }).id;
        if (activeTab === "likes") {
          const res = await fetch(`/api/tracks?userId=${userId}&limit=50`);
          const data = await res.json();
          setTracks(data.tracks || []);
        } else if (activeTab === "playlists") {
          const res = await fetch(
            `/api/playlists?userId=${(session?.user as { id: string }).id}`
          );
          const data = await res.json();
          setPlaylists(data || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [session, activeTab]);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlaylistName.trim() }),
      });

      if (res.ok) {
        const playlist = await res.json();
        setPlaylists((prev) => [playlist, ...prev]);
        setNewPlaylistName("");
        setShowNewPlaylist(false);
      }
    } catch {
      // ignore
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-sc-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Library</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-sc-dark-4">
        {(["likes", "playlists", "following", "history"] as Tab[]).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-sc-orange text-sc-orange"
                  : "border-transparent text-sc-gray hover:text-white"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          )
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-sc-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === "likes" && (
            <div>
              {tracks.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {tracks.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      tracks={tracks}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-sc-dark-3 rounded-lg">
                  <p className="text-sc-gray mb-2">
                    You haven&apos;t liked any tracks yet
                  </p>
                  <Link
                    href="/explore"
                    className="text-sc-orange hover:underline text-sm"
                  >
                    Explore tracks
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === "playlists" && (
            <div>
              <button
                onClick={() => setShowNewPlaylist(true)}
                className="mb-4 px-4 py-2 text-sm bg-sc-dark-3 text-sc-gray hover:text-white rounded-sm transition-colors"
              >
                + Create new playlist
              </button>

              {showNewPlaylist && (
                <form
                  onSubmit={handleCreatePlaylist}
                  className="flex gap-2 mb-6"
                >
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Playlist name"
                    className="flex-1 bg-sc-dark-4 text-white text-sm rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sc-orange"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-sc-orange hover:bg-sc-orange-dark text-white rounded-sm"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewPlaylist(false)}
                    className="px-4 py-2 text-sm text-sc-gray hover:text-white"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {playlists.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {playlists.map((playlist) => (
                    <Link
                      key={playlist.id}
                      href={`/playlist/${playlist.id}`}
                      className="group"
                    >
                      <div className="aspect-square bg-sc-dark-4 rounded overflow-hidden mb-2 relative">
                        {playlist.coverUrl ? (
                          <img
                            src={playlist.coverUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="white"
                              opacity="0.5"
                            >
                              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-white group-hover:underline truncate">
                        {playlist.name}
                      </p>
                      <p className="text-xs text-sc-gray">
                        {playlist._count?.tracks || 0} tracks
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-sc-dark-3 rounded-lg">
                  <p className="text-sc-gray">
                    No playlists yet. Create one above!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "following" && (
            <div className="text-center py-16 bg-sc-dark-3 rounded-lg">
              <p className="text-sc-gray">
                Artists you follow will appear here
              </p>
            </div>
          )}

          {activeTab === "history" && (
            <div className="text-center py-16 bg-sc-dark-3 rounded-lg">
              <p className="text-sc-gray">
                Your listening history will appear here
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
