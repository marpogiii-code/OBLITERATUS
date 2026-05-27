"use client";

import Link from "next/link";
import { formatCount } from "@/lib/utils";

interface UserCardProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    bio?: string;
    _count?: {
      tracks?: number;
      followers?: number;
    };
  };
}

export default function UserCard({ user }: UserCardProps) {
  return (
    <Link href={`/profile/${user.username}`} className="group block">
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-sc-dark-3 transition-colors">
        <div className="w-12 h-12 rounded-full bg-sc-dark-4 overflow-hidden flex-shrink-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg text-sc-gray bg-gradient-to-br from-purple-600 to-blue-500">
              {user.displayName[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-white group-hover:text-sc-orange transition-colors truncate">
            {user.displayName}
          </p>
          {user._count && (
            <p className="text-xs text-sc-gray">
              {formatCount(user._count.tracks || 0)} tracks ·{" "}
              {formatCount(user._count.followers || 0)} followers
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
