import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const [areaCount, allKels] = await Promise.all([
    p.rtRwArea.count(),
    p.kelurahan.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const areas = await p.rtRwArea.findMany({
    select: { id: true, name: true, kelurahanId: true },
    orderBy: { id: "asc" },
  });
  console.log(JSON.stringify({ areaCount, allKels, areas }, null, 2));
}
main().catch(console.error).finally(() => p.$disconnect());
