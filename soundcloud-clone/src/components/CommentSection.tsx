"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CommentWithUser } from "@/types";
import { formatTimeAgo, formatDuration } from "@/lib/utils";

interface CommentSectionProps {
  trackId: string;
  comments: CommentWithUser[];
  currentTime?: number;
}

export default function CommentSection({
  trackId,
  comments: initialComments,
  currentTime = 0,
}: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tracks/${trackId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), timestamp: currentTime }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [comment, ...prev]);
        setContent("");
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Comment Form */}
      {session ? (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-sc-dark-4 flex-shrink-0 overflow-hidden">
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-sc-gray">
                {session.user?.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 bg-sc-dark-4 text-white text-sm rounded-sm px-3 py-2 placeholder-sc-gray focus:outline-none focus:ring-1 focus:ring-sc-orange"
          />
        </form>
      ) : (
        <p className="text-sm text-sc-gray mb-6">
          <Link href="/login" className="text-sc-orange hover:underline">
            Sign in
          </Link>{" "}
          to leave a comment
        </p>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-sc-gray text-center py-8">
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Link
                href={`/profile/${comment.user.username}`}
                className="w-8 h-8 rounded-full bg-sc-dark-4 flex-shrink-0 overflow-hidden"
              >
                {comment.user.avatarUrl ? (
                  <img
                    src={comment.user.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-sc-gray">
                    {comment.user.displayName[0]?.toUpperCase()}
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${comment.user.username}`}
                    className="text-xs text-sc-gray hover:text-white transition-colors"
                  >
                    {comment.user.displayName}
                  </Link>
                  {comment.timestamp > 0 && (
                    <span className="text-xs text-sc-gray-dark">
                      at {formatDuration(comment.timestamp)}
                    </span>
                  )}
                  <span className="text-xs text-sc-gray-dark ml-auto">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-white mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
