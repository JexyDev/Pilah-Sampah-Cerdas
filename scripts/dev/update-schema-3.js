const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'apps', 'api', 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Fix RtRwArea
if (content.includes('@@map("wilayah_rt_rw")') && !content.includes('kknGroups   KknGroup[]')) {
    content = content.replace(
        '  @@unique([kelurahanId, name])\n  @@map("wilayah_rt_rw")',
        '  @@unique([kelurahanId, name])\n  kknGroups   KknGroup[]\n  @@map("wilayah_rt_rw")'
    );
}

// Fix Schedule
if (!content.includes('kknActivityZoneId')) {
    content = content.replace(
        '  polygon   Json?\n  createdAt DateTime @default(now()) @map("dibuat_pada")',
        '  polygon   Json?\n  kknActivityZoneId String? @map("id_zona_kkn")\n  kknActivityZone KknActivityZone? @relation(fields: [kknActivityZoneId], references: [id], onDelete: SetNull)\n  createdAt DateTime @default(now()) @map("dibuat_pada")'
    );
}

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Fixed missing relations 3');
