import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id },
    });

    if (!playlist || playlist.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { trackId } = await req.json();

    const maxPosition = await prisma.playlistTrack.findFirst({
      where: { playlistId: params.id },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const playlistTrack = await prisma.playlistTrack.create({
      data: {
        playlistId: params.id,
        trackId,
        position: (maxPosition?.position ?? -1) + 1,
      },
    });

    return NextResponse.json(playlistTrack);
  } catch (error) {
    console.error("Playlist track POST error:", error);
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

    const userId = (session.user as { id: string }).id;
    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id },
    });

    if (!playlist || playlist.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { trackId } = await req.json();

    await prisma.playlistTrack.delete({
      where: {
        playlistId_trackId: { playlistId: params.id, trackId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Playlist track DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
