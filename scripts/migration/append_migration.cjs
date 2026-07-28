const fs = require('fs');
const sql = `
ALTER TABLE "peran" RENAME COLUMN "name" TO "nama";
ALTER TABLE "pengguna" RENAME COLUMN "name" TO "nama";
ALTER TABLE "kelurahan" RENAME COLUMN "name" TO "nama";
ALTER TABLE "wilayah_rt_rw" RENAME COLUMN "name" TO "nama";
ALTER TABLE "kategori_sampah" RENAME COLUMN "name" TO "nama";
`;
fs.appendFileSync('prisma/migrations/20260723034830_rename_tables_to_indonesian/migration.sql', sql);
console.log('Appended to migration.sql');
