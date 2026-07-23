import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000/api/v1';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_super_secure_key_123';

// Helper to generate access token
function generateToken(userId: string, roleName: string, rtRwId?: number) {
  return jwt.sign({ userId, role: roleName, rtRwId }, JWT_SECRET, { expiresIn: '15m' });
}

async function doFetch(path: string, method: string, token: string, body?: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return res;
}

async function testRBAC() {
  console.log("\\n=== BAGIAN 1: RBAC & KEAMANAN LINTAS ROLE ===");
  
  // Create dummy users for each role if not exist
  const roles = await prisma.role.findMany();
  const users: Record<string, { id: string, token: string }> = {};

  for (const role of roles) {
    let user = await prisma.user.findFirst({ where: { roleId: role.id } });
    const rtRw = await prisma.rtRwArea.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: `Test ${role.name}`,
          email: `test_${role.name.toLowerCase()}@example.com`,
          password: 'password',
          roleId: role.id,
          status: 'Aktif',
          rtRwId: rtRw?.id
        }
      });
    } else if (user.rtRwId === null) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { rtRwId: rtRw?.id }
      });
    }
    users[role.name] = { id: user.id, token: generateToken(user.id, role.name, user.rtRwId || undefined) };
  }

  // Admin DLH/Camat/Lurah mencoba POST/PUT/DELETE
  const monitoringRoles = ['ADMIN_DLH', 'CAMAT', 'LURAH'];
  for (const roleName of monitoringRoles) {
    const token = users[roleName].token;
    
    // Try POST to some endpoint
    const postRes = await doFetch('/categories', 'POST', token, { name: 'Test', pointsPerKg: 10 });
    console.log(`[${roleName}] POST /categories: ${postRes.status} (Expected: 403)`);
    
    // Admin DLH resolve discrepancy (PUT /waste/logs/:id/resolve) should be allowed, but we need a valid ID.
    // Let's just check 403 on another PUT endpoint
    const putRes = await doFetch('/categories/123', 'PUT', token, { name: 'Test' });
    console.log(`[${roleName}] PUT /categories/123: ${putRes.status} (Expected: 403)`);
  }

  // Camat/Lurah mencoba akses halaman Review Diskrepansi AI (khusus Admin DLH) 
  // Let's assume the endpoint is GET /superadmin/discrepancies or similar
  // Wait, Admin DLH resolve is PUT /waste/logs/:id/resolve
  // Let's test Camat/Lurah on that endpoint
  for (const roleName of ['CAMAT', 'LURAH']) {
    const token = users[roleName].token;
    const resolveRes = await doFetch('/waste/logs/fake-id/resolve', 'PUT', token, { status: 'RESOLVED' });
    console.log(`[${roleName}] PUT /waste/logs/fake-id/resolve: ${resolveRes.status} (Expected: 403)`);
  }

  // Warga mencoba akses endpoint approval RW/Admin
  const wargaToken = users['WARGA'].token;
  const wargaRes = await doFetch('/rw/bins/fake-id/approve', 'POST', wargaToken);
  console.log(`[WARGA] POST /rw/bins/fake-id/approve: ${wargaRes.status} (Expected: 403)`);
  
  const batchCode = 'TEST_BATCH_' + Date.now();
  const category = await prisma.wasteCategory.findFirst();
  const rtrw = await prisma.rtRwArea.findFirst();

  const batchRes = await doFetch('/super-admin/bins/generate-qr', 'POST', users['SUPER_ADMIN'].token, { totalQr: 1, batchCode, categoryId: category?.id, rtRwId: rtrw?.id });
  console.log(`[SUPER_ADMIN] POST /super-admin/bins/generate-qr: ${batchRes.status} (Expected: 201)`);
  
  // Mahasiswa scan QR (Since we don't have the QR Code directly from the response easily without parsing, we will query DB)
  const batch = await prisma.qrBatch.findUnique({ where: { batchCode }, include: { bins: true } });
  if (batch && batch.bins.length > 0) {
    const qrCode = batch.bins[0].qrCode;
    
    // Mahasiswa scan
    const kknToken = users['MAHASISWA_KKN'].token;
    const scanRes = await doFetch('/kkn/qr/claim', 'POST', kknToken, { qrCode, latitude: -6.9, longitude: 107.6 });
    console.log(`[MAHASISWA] POST /kkn/qr/claim: ${scanRes.status} (Expected: 200)`);
    
    // Check status in DB
    const binCheck1 = await prisma.bin.findUnique({ where: { qrCode } });
    console.log(`[MAHASISWA] Status after scan: ${binCheck1?.status} (Expected: ASSIGNED_TO_PIC)`);

    const regRes = await doFetch('/bins/register-warga', 'POST', users['WARGA'].token, { qrCode, maxCapacityLiter: 50, latitude: -6.9, longitude: 107.6 });
    console.log(`[WARGA] POST /bins/register-warga: ${regRes.status} (Expected: 200)`);
    if (regRes.status !== 200 && regRes.status !== 201) console.log(await regRes.json());

    const binCheck2 = await prisma.bin.findUnique({ where: { qrCode } });
    console.log(`[WARGA] Status after register: ${binCheck2?.status} (Expected: PENDING_APPROVAL)`);
    
    // Approve RW
    const rwToken = users['RW'].token;
    const approveRes = await doFetch(`/rw/bins/${binCheck2?.id}/approve`, 'PUT', rwToken);
    console.log(`[RW] PUT /rw/bins/:id/approve: ${approveRes.status} (Expected: 200)`);
    if (approveRes.status !== 200) console.log(await approveRes.json());
    
    const binCheck3 = await prisma.bin.findUnique({ where: { qrCode } });
    console.log(`[RW] Status after approve: ${binCheck3?.status} (Expected: ACTIVE_BOUND)`);
  } else {
    console.log("Failed to create QR Batch for test.");
  }
}

async function runTests() {
  console.log("Starting tests...");
  try {
    const res = await fetch(`${BASE_URL}/ping`).catch(() => null);
    if (!res) {
       console.log("Server not reachable on /api/ping. Make sure backend is running on port 3000.");
       return;
    }
    console.log("Server is reachable!");
    await testRBAC();
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
