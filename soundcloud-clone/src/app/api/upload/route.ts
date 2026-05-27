import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { generateWaveformData } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const formData = await req.formData();

    const audioFile = formData.get("audio") as File | null;
    const coverFile = formData.get("cover") as File | null;
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || "";
    const genre = (formData.get("genre") as string) || "None";
    const tags = (formData.get("tags") as string) || "";
    const isPublic = formData.get("isPublic") !== "false";

    if (!audioFile || !title) {
      return NextResponse.json(
        { error: "Audio file and title are required" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const audioExt = audioFile.name.split(".").pop() || "mp3";
    const audioFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${audioExt}`;
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    await writeFile(path.join(uploadDir, audioFilename), audioBuffer);
    const audioUrl = `/uploads/${audioFilename}`;

    let coverUrl = "";
    if (coverFile) {
      const coverExt = coverFile.name.split(".").pop() || "jpg";
      const coverFilename = `${Date.now()}-cover-${Math.random().toString(36).slice(2)}.${coverExt}`;
      const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
      await writeFile(path.join(uploadDir, coverFilename), coverBuffer);
      coverUrl = `/uploads/${coverFilename}`;
    }

    const waveformData = JSON.stringify(generateWaveformData(200));

    const track = await prisma.track.create({
      data: {
        title,
        description,
        audioUrl,
        coverUrl,
        genre,
        tags,
        isPublic,
        waveformData,
        userId,
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
      },
    });

    return NextResponse.json(track);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
