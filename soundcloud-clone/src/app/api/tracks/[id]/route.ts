import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as { id: string } | undefined)?.id;

    const track = await prisma.track.findUnique({
      where: { id: params.id },
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
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    await prisma.track.update({
      where: { id: params.id },
      data: { plays: { increment: 1 } },
    });

    let isLiked = false;
    let isReposted = false;
    if (currentUserId) {
      const [like, repost] = await Promise.all([
        prisma.like.findUnique({
          where: {
            userId_trackId: { userId: currentUserId, trackId: params.id },
          },
        }),
        prisma.repost.findUnique({
          where: {
            userId_trackId: { userId: currentUserId, trackId: params.id },
          },
        }),
      ]);
      isLiked = !!like;
      isReposted = !!repost;
    }

    return NextResponse.json({ ...track, isLiked, isReposted });
  } catch (error) {
    console.error("Track GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as { id: string }).id;
    const track = await prisma.track.findUnique({
      where: { id: params.id },
    });

    if (!track || track.userId !== currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = await req.json();
    const updated = await prisma.track.update({
      where: { id: params.id },
      data: {
        title: data.title,
        description: data.description,
        genre: data.genre,
        tags: data.tags,
        isPublic: data.isPublic,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Track PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as { id: string }).id;
    const track = await prisma.track.findUnique({
      where: { id: params.id },
    });

    if (!track || track.userId !== currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.track.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
