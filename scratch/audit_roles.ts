import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api/v1';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret_super_secure_key_123";

function generateToken(user: any, roleName: string) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: roleName,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

async function testRoles() {
  const roles = [
    { name: 'SUPER_ADMIN' },
    { name: 'ADMIN_DLH' },
    { name: 'CAMAT' },
    { name: 'LURAH' },
    { name: 'RW' },
    { name: 'RT' },
    { name: 'PETUGAS_RESIDU' },
    { name: 'WARGA' },
    { name: 'MAHASISWA_KKN' },
  ];

  console.log("=== BAGIAN 2: FUNCTIONAL TEST PER ROLE ===");
  for (const r of roles) {
    const roleDb = await prisma.role.findFirst({ where: { name: r.name } });
    if (!roleDb) {
      console.log(`❌ Role ${r.name} not found in DB`);
      continue;
    }
    const user = await prisma.user.findFirst({ where: { roleId: roleDb.id } });
    if (!user) {
      console.log(`❌ No user for ${r.name}`);
      continue;
    }

    const token = generateToken(user, r.name);

    // Test RBAC: POST /bins/areas 
    const postRes = await fetch(`${API_URL}/bins/areas`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: `Test RT for ${r.name}`, kelurahanId: 1 })
    });

    const getRes = await fetch(`${API_URL}/bins/locations`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`\nTesting Role: ${r.name}`);
    console.log(`POST /bins/areas -> Status: ${postRes.status}`);
    console.log(`GET /bins/locations -> Status: ${getRes.status}`);

    if (['ADMIN_DLH', 'CAMAT', 'LURAH', 'RT'].includes(r.name)) {
      if (postRes.status === 403) {
        console.log(`✅ RBAC (Read-Only) working properly for ${r.name} (Blocked from POST).`);
      } else {
        console.log(`❌ RBAC FAIL: ${r.name} should be read-only but got ${postRes.status}`);
      }
    }
    if (getRes.status === 200 || getRes.status === 404) {
      console.log(`✅ RBAC (Read) working properly for ${r.name}.`);
    } else {
      console.log(`❌ RBAC FAIL (Read) for ${r.name} -> ${getRes.status}`);
    }
  }
}

testRoles().catch(console.error).finally(() => prisma.$disconnect());
