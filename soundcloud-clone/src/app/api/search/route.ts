import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!q.trim()) {
      return NextResponse.json({ tracks: [], users: [], playlists: [] });
    }

    const results: {
      tracks?: unknown[];
      users?: unknown[];
      playlists?: unknown[];
    } = {};

    if (type === "all" || type === "tracks") {
      results.tracks = await prisma.track.findMany({
        where: {
          isPublic: true,
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { tags: { contains: q } },
            { genre: { contains: q } },
          ],
        },
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
        },
        orderBy: { plays: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    if (type === "all" || type === "users") {
      results.users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q } },
            { displayName: { contains: q } },
          ],
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          _count: { select: { tracks: true, followers: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    if (type === "all" || type === "playlists") {
      results.playlists = await prisma.playlist.findMany({
        where: {
          isPublic: true,
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: { select: { tracks: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
