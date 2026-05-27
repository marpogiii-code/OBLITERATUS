"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TrackCard from "@/components/TrackCard";
import UserCard from "@/components/UserCard";
import { TrackWithUser } from "@/types";
import Link from "next/link";

type SearchTab = "all" | "tracks" | "users" | "playlists";

interface SearchUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  _count: { tracks: number; followers: number };
}

interface SearchPlaylist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  user: { id: string; username: string; displayName: string; avatarUrl: string };
  _count: { tracks: number };
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [tab, setTab] = useState<SearchTab>("all");
  const [tracks, setTracks] = useState<TrackWithUser[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [playlists, setPlaylists] = useState<SearchPlaylist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) return;

    async function search() {
      setLoading(true);
      try {
        const type = tab === "all" ? "all" : tab;
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&type=${type}`
        );
        const data = await res.json();
        setTracks(data.tracks || []);
        setUsers(data.users || []);
        setPlaylists(data.playlists || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    search();
  }, [query, tab]);

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">
        Search results for &quot;{query}&quot;
      </h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-sc-dark-4">
        {(["all", "tracks", "users", "playlists"] as SearchTab[]).map(
          (t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-sc-orange text-sc-orange"
                  : "border-transparent text-sc-gray hover:text-white"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
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
          {/* Tracks */}
          {(tab === "all" || tab === "tracks") && tracks.length > 0 && (
            <section className="mb-8">
              {tab === "all" && (
                <h2 className="text-lg font-semibold mb-4">Tracks</h2>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tracks.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    tracks={tracks}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Users */}
          {(tab === "all" || tab === "users") && users.length > 0 && (
            <section className="mb-8">
              {tab === "all" && (
                <h2 className="text-lg font-semibold mb-4">People</h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {users.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            </section>
          )}

          {/* Playlists */}
          {(tab === "all" || tab === "playlists") &&
            playlists.length > 0 && (
              <section className="mb-8">
                {tab === "all" && (
                  <h2 className="text-lg font-semibold mb-4">Playlists</h2>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {playlists.map((playlist) => (
                    <Link
                      key={playlist.id}
                      href={`/playlist/${playlist.id}`}
                      className="group"
                    >
                      <div className="aspect-square bg-sc-dark-4 rounded overflow-hidden mb-2">
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
                        {playlist.user.displayName} ·{" "}
                        {playlist._count.tracks} tracks
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

          {/* No results */}
          {tracks.length === 0 &&
            users.length === 0 &&
            playlists.length === 0 && (
              <div className="text-center py-16 bg-sc-dark-3 rounded-lg">
                <p className="text-sc-gray text-lg mb-2">
                  No results found for &quot;{query}&quot;
                </p>
                <p className="text-sc-gray-dark text-sm">
                  Try different keywords or browse{" "}
                  <Link
                    href="/explore"
                    className="text-sc-orange hover:underline"
                  >
                    trending tracks
                  </Link>
                </p>
              </div>
            )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-sc-orange border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
