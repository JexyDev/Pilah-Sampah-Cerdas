import { PrismaClient } from "@prisma/client";
import { getRandomDefaultAvatar } from "../src/utils/avatarUtils.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🖼️ POPULATING DEFAULT RANDOM AVATARS FOR EXISTING USERS...");

  const usersWithoutAvatar = await prisma.user.findMany({
    where: {
      OR: [
        { fotoProfil: null },
        { fotoProfil: "" },
        { fotoProfil: "/uploads/default-avatar.png" },
      ],
    },
  });

  console.log(`Found ${usersWithoutAvatar.length} users needing profile picture assignment.`);

  let updatedCount = 0;
  for (const u of usersWithoutAvatar) {
    const avatarUrl = getRandomDefaultAvatar(u.name);
    await prisma.user.update({
      where: { id: u.id },
      data: { fotoProfil: avatarUrl },
    });
    updatedCount++;
  }

  console.log(`✅ Successfully assigned random default avatars to ${updatedCount} users in database!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
