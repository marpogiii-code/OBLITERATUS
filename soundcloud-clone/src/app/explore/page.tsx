"use client";

import { useEffect, useState } from "react";
import TrackCard from "@/components/TrackCard";
import { TrackWithUser } from "@/types";
import { getGenres } from "@/lib/utils";

export default function ExplorePage() {
  const [tracks, setTracks] = useState<TrackWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState("All");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchTracks() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          sort,
          page: String(page),
          limit: "24",
        });
        if (genre !== "All") params.set("genre", genre);

        const res = await fetch(`/api/tracks?${params}`);
        const data = await res.json();
        setTracks(data.tracks || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error("Failed to fetch:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTracks();
  }, [genre, sort, page]);

  const genres = ["All", ...getGenres().filter((g) => g !== "None")];

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Explore</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {["popular", "latest", "oldest"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setSort(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${
                sort === s
                  ? "bg-sc-orange text-white"
                  : "bg-sc-dark-3 text-sc-gray hover:text-white"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <select
          value={genre}
          onChange={(e) => {
            setGenre(e.target.value);
            setPage(1);
          }}
          className="bg-sc-dark-3 text-white text-sm rounded-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-sc-orange"
        >
          {genres.map((g) => (
            <option key={g} value={g}>
              {g === "All" ? "All genres" : g}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-sc-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tracks.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} tracks={tracks} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm bg-sc-dark-3 text-sc-gray hover:text-white rounded-sm disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-sm text-sc-gray">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm bg-sc-dark-3 text-sc-gray hover:text-white rounded-sm disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-sc-dark-3 rounded-lg">
          <p className="text-sc-gray text-lg mb-2">No tracks found</p>
          <p className="text-sc-gray-dark text-sm">
            Try a different genre or check back later
          </p>
        </div>
      )}
    </div>
  );
}
