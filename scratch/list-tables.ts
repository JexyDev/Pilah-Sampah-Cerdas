import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const tables = await prisma.$queryRaw<any[]>`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
console.log(tables.map((t: any) => t.table_name).join("\n"));
await prisma.$disconnect();
