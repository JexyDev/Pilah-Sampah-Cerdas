import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const cols = await prisma.$queryRaw<any[]>`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'tong_sampah' AND table_schema = 'public'
  ORDER BY ordinal_position
`;
console.log("=== tong_sampah columns ===");
cols.forEach((c: any) => console.log(`  ${c.column_name}: ${c.data_type}`));

const userCols = await prisma.$queryRaw<any[]>`
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'pengguna' AND table_schema = 'public' ORDER BY ordinal_position
`;
console.log("\n=== pengguna (user) columns ===");
userCols.forEach((c: any) => console.log(`  ${c.column_name}`));

const hhCols = await prisma.$queryRaw<any[]>`
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'rumah_tangga' AND table_schema = 'public' ORDER BY ordinal_position
`;
console.log("\n=== rumah_tangga (household) columns ===");
hhCols.forEach((c: any) => console.log(`  ${c.column_name}`));

await prisma.$disconnect();
