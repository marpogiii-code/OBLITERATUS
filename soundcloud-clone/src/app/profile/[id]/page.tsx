"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import TrackCard from "@/components/TrackCard";
import { TrackWithUser, UserProfile } from "@/types";
import { formatCount, formatTimeAgo } from "@/lib/utils";
import Link from "next/link";

type Tab = "tracks" | "likes" | "playlists";

export default function ProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tracks, setTracks] = useState<TrackWithUser[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("tracks");
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${params.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setUser(data);
      setFollowing(data.isFollowing || false);
      setFollowerCount(data._count?.followers || 0);

      const tracksRes = await fetch(
        `/api/tracks?userId=${data.id}&limit=50`
      );
      const tracksData = await tracksRes.json();
      setTracks(tracksData.tracks || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollow = async () => {
    if (!session || !user) return;
    try {
      const res = await fetch(`/api/users/${user.id}/follow`, {
        method: "POST",
      });
      const data = await res.json();
      setFollowing(data.following);
      setFollowerCount((prev) => (data.following ? prev + 1 : prev - 1));
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

  if (!user) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-2">User not found</h1>
        <Link href="/" className="text-sc-orange hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  const isOwnProfile =
    session && (session.user as { id: string }).id === user.id;

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-sc-dark-3 relative">
        {user.headerUrl && (
          <img
            src={user.headerUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="relative max-w-screen-xl mx-auto px-4 py-8">
          <div className="flex items-end gap-6">
            <div className="w-[120px] h-[120px] rounded-full bg-sc-dark-4 overflow-hidden border-4 border-sc-dark flex-shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-sc-gray bg-gradient-to-br from-purple-600 to-blue-500">
                  {user.displayName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold">{user.displayName}</h1>
              <p className="text-sc-gray">@{user.username}</p>
              {user.bio && (
                <p className="text-sm text-sc-gray-light mt-2 line-clamp-2">
                  {user.bio}
                </p>
              )}
            </div>
            {!isOwnProfile && session && (
              <button
                onClick={handleFollow}
                className={`px-6 py-2 text-sm rounded-sm font-semibold transition-colors flex-shrink-0 ${
                  following
                    ? "bg-sc-dark-4 text-white hover:bg-red-600"
                    : "bg-sc-orange text-white hover:bg-sc-orange-dark"
                }`}
              >
                {following ? "Following" : "Follow"}
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center">
              <p className="text-lg font-bold">
                {formatCount(followerCount)}
              </p>
              <p className="text-xs text-sc-gray">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">
                {formatCount(user._count?.following || 0)}
              </p>
              <p className="text-xs text-sc-gray">Following</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">
                {formatCount(user._count?.tracks || 0)}
              </p>
              <p className="text-xs text-sc-gray">Tracks</p>
            </div>
            <p className="text-xs text-sc-gray-dark ml-auto">
              Member since {formatTimeAgo(user.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-sc-dark-4">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex gap-6">
            {(["tracks", "likes", "playlists"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-sc-orange text-sc-orange"
                    : "border-transparent text-sc-gray hover:text-white"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {activeTab === "tracks" && (
          <>
            {tracks.length > 0 ? (
              <div className="space-y-3">
                {tracks.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    tracks={tracks}
                    showWaveform
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-sc-dark-3 rounded-lg">
                <p className="text-sc-gray mb-2">No tracks yet</p>
                {isOwnProfile && (
                  <Link
                    href="/upload"
                    className="text-sc-orange hover:underline text-sm"
                  >
                    Upload your first track
                  </Link>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "likes" && (
          <div className="text-center py-16 bg-sc-dark-3 rounded-lg">
            <p className="text-sc-gray">Liked tracks will appear here</p>
          </div>
        )}

        {activeTab === "playlists" && (
          <div className="text-center py-16 bg-sc-dark-3 rounded-lg">
            <p className="text-sc-gray">Playlists will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
