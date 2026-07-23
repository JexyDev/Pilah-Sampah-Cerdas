const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const tables = ['peran', 'pengguna', 'kelurahan', 'wilayah_rt_rw', 'kategori_sampah'];
    for (const t of tables) {
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "${t}" RENAME COLUMN "name" TO "nama"`);
            console.log(`Renamed in ${t}`);
        } catch (e) {
            console.log(`Failed or already renamed in ${t}`);
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
