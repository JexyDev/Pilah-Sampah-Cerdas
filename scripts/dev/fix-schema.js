const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'apps', 'api', 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Fix User model (for DosenPembimbing and KknGroup)
if (!content.includes('dosenPembimbing DosenPembimbing?')) {
    content = content.replace(
        '  locations   StudentLocation[]    @relation("StudentLocations")',
        '  locations   StudentLocation[]    @relation("StudentLocations")\n  dosenPembimbing DosenPembimbing?\n  kknGroupId    String?   @map("id_kelompok_kkn")\n  kknGroup      KknGroup? @relation(fields: [kknGroupId], references: [id])'
    );
}

// Fix RtRwArea model (for KknGroup)
if (!content.includes('kknGroups   KknGroup[]')) {
    content = content.replace(
        '  residuLogs  ResiduLog[]\n  latitude    Decimal?     @db.Decimal(11, 8)',
        '  residuLogs  ResiduLog[]\n  kknGroups   KknGroup[]\n  latitude    Decimal?     @db.Decimal(11, 8)'
    );
}

// Fix Schedule model (for KknActivityZone)
if (!content.includes('kknActivityZoneId')) {
    content = content.replace(
        '  polygon   Json?\n  createdAt DateTime @default(now()) @map("dibuat_pada")',
        '  polygon   Json?\n  kknActivityZoneId String? @map("id_zona_kkn")\n  kknActivityZone KknActivityZone? @relation(fields: [kknActivityZoneId], references: [id], onDelete: SetNull)\n  createdAt DateTime @default(now()) @map("dibuat_pada")'
    );
}

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Fixed missing relations 4');
