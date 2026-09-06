const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'apps', 'api', 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Append new models if not exist
const newModels = `

model University {
  id        String          @id @default(uuid())
  name      String          @unique
  dpls      DosenPembimbing[]
  kknGroups KknGroup[]
}

model DosenPembimbing {
  id           String      @id @default(uuid())
  userId       String      @unique
  user         User        @relation(fields: [userId], references: [id])
  universityId String
  university   University  @relation(fields: [universityId], references: [id])
  kknGroups    KknGroup[]
}

model KknGroup {
  id           String           @id @default(uuid())
  name         String
  universityId String
  university   University       @relation(fields: [universityId], references: [id])
  dplId        String
  dpl          DosenPembimbing  @relation(fields: [dplId], references: [id])
  rtRwId       Int?
  rtRwArea     RtRwArea?        @relation(fields: [rtRwId], references: [id])
  users        User[]
  kknActivityZones KknActivityZone[]
}

model StatusHistory {
  id            String   @id @default(uuid())
  referenceId   String   @map("id_referensi")
  referenceType String   @map("tipe_referensi")
  statusFrom    String?  @map("status_sebelumnya")
  statusTo      String   @map("status_baru")
  changedAt     DateTime @default(now()) @map("waktu_perubahan")
  changedById   String?  @map("id_pengubah")
  changedBy     User?    @relation(fields: [changedById], references: [id], onDelete: SetNull)
  notes         String?  @map("catatan")

  @@index([referenceId, referenceType])
  @@map("riwayat_status")
}

model KknActivityZone {
  id             String    @id @default(uuid())
  kknGroupId     String    @map("id_kelompok_kkn")
  kknGroup       KknGroup  @relation(fields: [kknGroupId], references: [id], onDelete: Cascade)
  boundaryPoints Json      @map("titik_batas")
  name           String    @map("nama_zona")
  description    String?   @map("deskripsi")
  createdAt      DateTime  @default(now()) @map("dibuat_pada")
  updatedAt      DateTime  @updatedAt @map("diperbarui_pada")
  schedules      Schedule[]

  @@map("zona_kegiatan_kkn")
}
`;

if (!content.includes('model KknActivityZone')) {
  content += newModels;
}

// Update User
if (!content.includes('statusHistories StatusHistory[]')) {
    content = content.replace(
        '  locations   StudentLocation[]    @relation("StudentLocations")',
        '  locations   StudentLocation[]    @relation("StudentLocations")\n  statusHistories StatusHistory[]'
    );
}

// Update Schedule
if (!content.includes('kknActivityZoneId')) {
    content = content.replace(
        '  polygon   Json?\n  createdAt DateTime @default(now()) @map("dibuat_pada")',
        '  polygon   Json?\n  kknActivityZoneId String? @map("id_zona_kkn")\n  kknActivityZone KknActivityZone? @relation(fields: [kknActivityZoneId], references: [id], onDelete: SetNull)\n  createdAt DateTime @default(now()) @map("dibuat_pada")'
    );
}

// Update RtRwArea to relate to KknGroup
if (content.includes('model RtRwArea {') && !content.includes('kknGroups   KknGroup[]')) {
    content = content.replace(
        '  wargaPolygon WargaPolygon?',
        '  wargaPolygon WargaPolygon?\n  kknGroups   KknGroup[]'
    );
}

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Schema updated successfully');
