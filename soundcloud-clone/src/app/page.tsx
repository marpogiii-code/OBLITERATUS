"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import TrackCard from "@/components/TrackCard";
import { TrackWithUser } from "@/types";
import Link from "next/link";

export default function HomePage() {
  const { data: session } = useSession();
  const [feedTracks, setFeedTracks] = useState<TrackWithUser[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<TrackWithUser[]>([]);
  const [recentTracks, setRecentTracks] = useState<TrackWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [trendingRes, recentRes] = await Promise.all([
          fetch("/api/tracks?sort=popular&limit=12"),
          fetch("/api/tracks?sort=latest&limit=12"),
        ]);

        const trending = await trendingRes.json();
        const recent = await recentRes.json();

        setTrendingTracks(trending.tracks || []);
        setRecentTracks(recent.tracks || []);

        if (session) {
          const feedRes = await fetch("/api/tracks?feed=true&limit=10");
          const feed = await feedRes.json();
          setFeedTracks(feed.tracks || []);
        }
      } catch (err) {
        console.error("Failed to fetch tracks:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-sc-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      {/* Hero Banner */}
      {!session && (
        <div className="bg-gradient-to-r from-sc-orange to-orange-700 rounded-lg p-8 mb-10">
          <h1 className="text-3xl font-bold mb-2">
            Discover music you&apos;ll love
          </h1>
          <p className="text-white/80 mb-6 max-w-lg">
            Upload your first track and begin your journey. SoundCloud gives you
            space to create, find your fans, and connect with other artists.
          </p>
          <div className="flex gap-3">
            <Link
              href="/signup"
              className="px-6 py-2.5 bg-white text-sc-orange font-semibold rounded-sm hover:bg-gray-100 transition-colors"
            >
              Start uploading
            </Link>
            <Link
              href="/explore"
              className="px-6 py-2.5 border border-white text-white rounded-sm hover:bg-white/10 transition-colors"
            >
              Explore trending
            </Link>
          </div>
        </div>
      )}

      {/* Feed */}
      {session && feedTracks.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your Feed</h2>
            <Link
              href="/explore"
              className="text-sm text-sc-orange hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {feedTracks.slice(0, 5).map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                tracks={feedTracks}
                showWaveform
              />
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {session ? "Trending Now" : "Hear what\u2019s trending"}
          </h2>
          <Link
            href="/explore"
            className="text-sm text-sc-orange hover:underline"
          >
            Explore more
          </Link>
        </div>
        {trendingTracks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {trendingTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                tracks={trendingTracks}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-sc-dark-3 rounded-lg">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="mx-auto text-sc-gray-dark mb-3"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            <p className="text-sc-gray mb-2">No tracks yet</p>
            {session ? (
              <Link
                href="/upload"
                className="text-sc-orange hover:underline text-sm"
              >
                Be the first to upload!
              </Link>
            ) : (
              <Link
                href="/signup"
                className="text-sc-orange hover:underline text-sm"
              >
                Sign up and start uploading
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Recently Uploaded */}
      {recentTracks.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recently Uploaded</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                tracks={recentTracks}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
