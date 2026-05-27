import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 12);

  const user1 = await prisma.user.upsert({
    where: { email: "demo@soundcloud.com" },
    update: {},
    create: {
      email: "demo@soundcloud.com",
      username: "demouser",
      displayName: "Demo User",
      password,
      bio: "Welcome to SoundCloud Clone! This is a demo account.",
      avatarUrl: "",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "artist@soundcloud.com" },
    update: {},
    create: {
      email: "artist@soundcloud.com",
      username: "coolartist",
      displayName: "Cool Artist",
      password,
      bio: "Producer | Beatmaker | Music lover",
      avatarUrl: "",
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "dj@soundcloud.com" },
    update: {},
    create: {
      email: "dj@soundcloud.com",
      username: "djmixer",
      displayName: "DJ Mixer",
      password,
      bio: "Mixing beats since 2010",
      avatarUrl: "",
    },
  });

  console.log("Seeded users:", user1.id, user2.id, user3.id);

  const followPairs = [
    { followerId: user1.id, followingId: user2.id },
    { followerId: user1.id, followingId: user3.id },
    { followerId: user2.id, followingId: user1.id },
  ];
  for (const pair of followPairs) {
    await prisma.follow.upsert({
      where: { followerId_followingId: pair },
      update: {},
      create: pair,
    });
  }

  console.log("Seeded follows");

  const playlist = await prisma.playlist.create({
    data: {
      name: "My Favorites",
      description: "A collection of my favorite tracks",
      userId: user1.id,
    },
  });

  console.log("Seeded playlist:", playlist.id);
  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
