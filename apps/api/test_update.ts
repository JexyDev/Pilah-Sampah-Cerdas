import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.systemConfig.upsert({
    where: { key: 'app_release_info' },
    update: {
      value: JSON.stringify({
        latestVersion: "9.9.9",
        forceUpdate: true,
        downloadUrl: "https://google.com"
      })
    },
    create: {
      key: 'app_release_info',
      value: JSON.stringify({
        latestVersion: "9.9.9",
        forceUpdate: true,
        downloadUrl: "https://google.com"
      }),
      description: "App release info"
    }
  });
  console.log("Update trigger SET!");
}
main().finally(() => prisma.$disconnect());
