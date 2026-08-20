const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'apps', 'api', 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Fix User model
if (!content.includes('dosenPembimbing DosenPembimbing?')) {
    content = content.replace(
        '  statusHistories StatusHistory[]',
        '  statusHistories StatusHistory[]\n  dosenPembimbing DosenPembimbing?\n  kknGroupId    String?   @map("id_kelompok_kkn")\n  kknGroup      KknGroup? @relation(fields: [kknGroupId], references: [id])'
    );
}

// Fix RtRwArea
if (!content.includes('kknGroups KknGroup[]')) {
    content = content.replace(
        '  wargaPolygon WargaPolygon?',
        '  wargaPolygon WargaPolygon?\n  kknGroups KknGroup[]'
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
console.log('Fixed missing relations');
