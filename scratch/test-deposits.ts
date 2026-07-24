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

    console.log("Total deposits queried successfully from Prisma:", deposits.length);
    if (deposits.length > 0) {
      console.log("Sample deposit:", JSON.stringify(deposits[0], null, 2));
    }
  } catch (e: any) {
    console.error("Prisma query failed:", e.message);
  }
}

run().finally(() => prisma.$disconnect());
