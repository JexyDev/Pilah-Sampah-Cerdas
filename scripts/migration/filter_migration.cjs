const fs = require('fs');
const file = 'prisma/migrations/20260723034830_rename_tables_to_indonesian/migration.sql';
const sql = fs.readFileSync(file, 'utf8');
const lines = sql.split('\n');
const filtered = lines.filter(l => {
    const m = l.match(/RENAME COLUMN "([^"]+)" TO "([^"]+)"/);
    if (m && m[1] === m[2]) return false;
    return true;
});
fs.writeFileSync(file, filtered.join('\n'));
console.log('Filtered SQL saved.');
