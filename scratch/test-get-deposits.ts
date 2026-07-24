import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  try {
    const deposits = await prisma.wasteLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        household: {
          include: {
            user: {
              select: {
                name: true,
                role: {
                  select: { name: true },
                },
              },
            },
          },
        },
        category: true,
        bin: {
          include: {
            rtRw: true,
          },
        },
      },
      where: {
        household: {
          user: {
            role: {
              name: "WARGA",
            },
          },
        },
      },
    });
    console.log("Success fetching deposits! Count:", deposits.length);
    console.log("First deposit:", JSON.stringify(deposits[0], null, 2));
  } catch (e: any) {
    console.error("Failed fetching deposits:", e);
  }
}

run().finally(() => prisma.$disconnect());
