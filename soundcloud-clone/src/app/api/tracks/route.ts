import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const genre = searchParams.get("genre");
    const sort = searchParams.get("sort") || "latest";
    const userId = searchParams.get("userId");
    const feed = searchParams.get("feed");

    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as { id: string } | undefined)?.id;

    const where: Record<string, unknown> = { isPublic: true };
    if (genre && genre !== "All") where.genre = genre;
    if (userId) where.userId = userId;

    if (feed === "true" && currentUserId) {
      const following = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });
      const followingIds = following.map((f) => f.followingId);
      followingIds.push(currentUserId);
      where.userId = { in: followingIds };
    }

    const orderBy: Record<string, string> =
      sort === "popular"
        ? { plays: "desc" }
        : sort === "oldest"
          ? { createdAt: "asc" }
          : { createdAt: "desc" };

    const [tracks, total] = await Promise.all([
      prisma.track.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: { select: { likes: true, comments: true, reposts: true } },
          ...(currentUserId
            ? {
                likes: {
                  where: { userId: currentUserId },
                  select: { id: true },
                },
                reposts: {
                  where: { userId: currentUserId },
                  select: { id: true },
                },
              }
            : {}),
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.track.count({ where }),
    ]);

    const tracksWithMeta = tracks.map((track) => ({
      ...track,
      isLiked: currentUserId
        ? (track as unknown as { likes: { id: string }[] }).likes?.length > 0
        : false,
      isReposted: currentUserId
        ? (track as unknown as { reposts: { id: string }[] }).reposts?.length > 0
        : false,
      likes: undefined,
      reposts: undefined,
    }));

    return NextResponse.json({
      tracks: tracksWithMeta,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Tracks GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
