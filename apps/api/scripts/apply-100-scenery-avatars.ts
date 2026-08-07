import { PrismaClient } from "@prisma/client";
import { SCENERY_DEFAULT_AVATARS, getRandomDefaultAvatar } from "../src/utils/avatarUtils.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🏞️ UPDATING ALL USER PROFILE PICTURES TO 100 GENERAL SCENERY PHOTOS IN REAL DATABASE...");

  const users = await prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${users.length} total users in database.`);

  let updatedCount = 0;
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    // Distribute 100 scenery avatars across all users deterministically/evenly
    const avatarUrl = SCENERY_DEFAULT_AVATARS[i % SCENERY_DEFAULT_AVATARS.length];
    
    await prisma.user.update({
      where: { id: u.id },
      data: { fotoProfil: avatarUrl },
    });
    updatedCount++;
  }

  console.log(`✅ Successfully updated ${updatedCount} users in REAL database with 100 general scenery avatars!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
