const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    let sql = fs.readFileSync('prisma/migrations/20260723034830_rename_tables_to_indonesian/migration.sql', 'utf8');
    
    // Remove lines that rename a column to itself to avoid Postgres errors
    const lines = sql.split('\n');
    const filteredLines = lines.filter(line => {
        const match = line.match(/RENAME COLUMN "([^"]+)" TO "([^"]+)"/);
        if (match && match[1] === match[2]) {
            return false;
        }
        return true;
    });
    
    await prisma.$executeRawUnsafe(filteredLines.join('\n'));
    console.log('SQL Executed Successfully');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
