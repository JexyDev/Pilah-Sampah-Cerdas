import * as fs from "fs";
import * as path from "path";

const BASE_URL = "http://localhost:3000";

interface RequestOptions {
  method?: string;
  body?: any;
  token?: string;
}

async function apiRequest(endpoint: string, options: RequestOptions = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const method = options.method || "GET";

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const status = res.status;
    let data;
    try {
      data = await res.json();
    } catch {
      data = await res.text();
    }

    return { status, data };
  } catch (error: any) {
    return { status: 500, data: { error: "FETCH_ERROR", message: error.message } };
  }
}

async function run() {
  console.log("Generating baseline snapshots...");

  // 1. Get tokens
  console.log("Logging in users...");
  const adminLogin = await apiRequest("/api/v1/auth/login", {
    method: "POST",
    body: { email: "admin@psc.id", password: "password123" },
  });

  const wargaLogin = await apiRequest("/api/v1/auth/login", {
    method: "POST",
    body: { email: "warga@psc.id", password: "password123" },
  });

  const adminToken = adminLogin.data?.data?.accessToken;
  const wargaToken = wargaLogin.data?.data?.accessToken;

  if (!adminToken || !wargaToken) {
    console.error("Failed to get tokens. Are you sure the backend server is running and seeded?", {
      adminLogin,
      wargaLogin,
    });
    process.exit(1);
  }

  console.log("Tokens retrieved successfully.");

  const snapshots: Array<{
    controller: string;
    endpoint: string;
    scenario: string;
    method: string;
    status: number;
    response: string;
  }> = [];

  const record = async (
    controller: string,
    endpoint: string,
    scenario: string,
    method: string,
    options: RequestOptions
  ) => {
    console.log(`Running scenario: [${controller}] ${method} ${endpoint} - ${scenario}`);
    const res = await apiRequest(endpoint, options);
    // Mask dynamic values like uuid, dates, tokens
    let resStr = JSON.stringify(res.data, null, 2);
    resStr = resStr.replace(/"id":\s*"[0-9a-fA-F-]{36}"/g, '"id": "MASKED_UUID"');
    resStr = resStr.replace(/"userId":\s*"[0-9a-fA-F-]{36}"/g, '"userId": "MASKED_UUID"');
    resStr = resStr.replace(/"token":\s*"[^"]+"/g, '"token": "MASKED_TOKEN"');
    resStr = resStr.replace(/"accessToken":\s*"[^"]+"/g, '"accessToken": "MASKED_TOKEN"');
    resStr = resStr.replace(/"refreshToken":\s*"[^"]+"/g, '"refreshToken": "MASKED_TOKEN"');
    resStr = resStr.replace(/"createdAt":\s*"[^"]+"/g, '"createdAt": "MASKED_DATE"');
    resStr = resStr.replace(/"updatedAt":\s*"[^"]+"/g, '"updatedAt": "MASKED_DATE"');

    snapshots.push({
      controller,
      endpoint,
      scenario,
      method,
      status: res.status,
      response: resStr,
    });
  };

  // ==========================================
  // USER CONTROLLER SCENARIOS
  // ==========================================

  // Scenario 1: Get all users (Success - Admin)
  await record("userController", "/api/v1/users", "Sukses - Admin", "GET", {
    method: "GET",
    token: adminToken,
  });

  // Scenario 2: Get all users (Unauthorized - No token)
  await record("userController", "/api/v1/users", "Error - Tanpa Token", "GET", {
    method: "GET",
  });

  // Scenario 3: Get all users (Forbidden - Warga trying to access admin endpoint)
  await record("userController", "/api/v1/users", "Error - Warga Akses Get Users", "GET", {
    method: "GET",
    token: wargaToken,
  });

  // Scenario 4: Create User (Success - Admin)
  const randNum = Math.floor(Math.random() * 100000);
  const testEmail = `test_${randNum}@psc.id`;
  const testNik = `32730123${randNum.toString().padStart(8, "0")}`;
  await record("userController", "/api/v1/users", "Sukses - Create User", "POST", {
    method: "POST",
    token: adminToken,
    body: {
      name: "Test User Refactor",
      email: testEmail,
      password: "password123",
      roleName: "WARGA",
      nik: testNik,
      status: "Aktif",
    },
  });

  // Scenario 5: Create User (Error - Validation Missing Fields)
  await record("userController", "/api/v1/users", "Error - Validation Missing Fields", "POST", {
    method: "POST",
    token: adminToken,
    body: {
      name: "Test User Validation",
    },
  });

  // Scenario 6: Create User (Conflict - Existing Email)
  await record("userController", "/api/v1/users", "Error - Conflict Email", "POST", {
    method: "POST",
    token: adminToken,
    body: {
      name: "Admin Duplicate",
      email: "admin@psc.id",
      password: "password123",
      roleName: "ADMIN",
    },
  });

  // Scenario 7: Update User (Success - Admin)
  // Let's first fetch all users to get a non-admin user ID
  const allUsersRes = await apiRequest("/api/v1/users", { method: "GET", token: adminToken });
  const nonAdminUser = allUsersRes.data?.data?.find((u: any) => u.email.startsWith("test_"));
  const targetUserId = nonAdminUser ? nonAdminUser.id : "00000000-0000-0000-0000-000000000000";

  await record("userController", `/api/v1/users/${targetUserId}`, "Sukses - Update User", "PUT", {
    method: "PUT",
    token: adminToken,
    body: {
      name: "Test User Refactor Updated",
      email: testEmail,
      roleName: "WARGA",
      status: "Nonaktif",
    },
  });

  // Scenario 8: Update User (Error - Not Found)
  await record("userController", "/api/v1/users/00000000-0000-0000-0000-000000000000", "Error - User Not Found", "PUT", {
    method: "PUT",
    token: adminToken,
    body: {
      name: "Updated Not Found",
      email: "notfound@psc.id",
      roleName: "WARGA",
    },
  });

  // Scenario 9: Delete User (Success - Admin)
  await record("userController", `/api/v1/users/${targetUserId}`, "Sukses - Delete User", "DELETE", {
    method: "DELETE",
    token: adminToken,
  });

  // Scenario 10: Delete User (Error - Delete Self)
  const currentAdminUser = allUsersRes.data?.data?.find((u: any) => u.email === "admin@psc.id");
  const currentAdminId = currentAdminUser ? currentAdminUser.id : "00000000-0000-0000-0000-000000000000";
  // To simulate delete self, we need to pass a header. The route parses JWT token to req.user.userId.
  // Wait, let's login as admin to get admin id and delete that same id.
  await record("userController", `/api/v1/users/${currentAdminId}`, "Error - Delete Self", "DELETE", {
    method: "DELETE",
    token: adminToken,
  });

  // ==========================================
  // BIN CONTROLLER SCENARIOS
  // ==========================================

  // Scenario 1: Get all bins (Success - Public)
  await record("binController", "/api/v1/bins", "Sukses - Get Bins", "GET", {});

  // Scenario 2: Get locations (Success - Public)
  await record("binController", "/api/v1/bins/locations", "Sukses - Get Locations", "GET", {});

  // Scenario 3: Get areas (Success - Public)
  await record("binController", "/api/v1/bins/areas", "Sukses - Get Areas", "GET", {});

  // Scenario 4: Get kelurahans (Success - User token)
  await record("binController", "/api/v1/bins/kelurahans", "Sukses - Get Kelurahans", "GET", {
    token: wargaToken,
  });

  // Scenario 5: Get my bins (Success - Warga)
  await record("binController", "/api/v1/bins/my-bins", "Sukses - Get My Bins", "GET", {
    token: wargaToken,
  });

  // Scenario 6: Create Bin (Success - Admin)
  const binCode = `QR-TEST-${Math.floor(Math.random() * 10000)}`;
  // Let's get categories first
  const categoriesRes = await apiRequest("/api/v1/categories", { method: "GET", token: adminToken });
  const organicCatId = categoriesRes.data?.data?.[0]?.id;
  const rtrwRes = await apiRequest("/api/v1/bins/areas");
  // Let's see the structure of areas
  const testRtRwId = rtrwRes.data?.data?.[0]?.id || 1;

  await record("binController", "/api/v1/bins", "Sukses - Create Bin", "POST", {
    method: "POST",
    token: adminToken,
    body: {
      qrCode: binCode,
      categoryId: organicCatId,
      maxCapacityLiter: 25.0,
      rtRwId: testRtRwId,
      latitude: -6.8912345,
      longitude: 107.6123456,
    },
  });

  // Scenario 7: Create Bin (Error - Missing field)
  await record("binController", "/api/v1/bins", "Error - Missing QR Code", "POST", {
    method: "POST",
    token: adminToken,
    body: {
      categoryId: organicCatId,
      maxCapacityLiter: 25.0,
    },
  });

  // Scenario 8: Get bin status (Success - Public)
  // Let's fetch all bins first to get an ID
  const allBinsRes = await apiRequest("/api/v1/bins");
  const targetBin = allBinsRes.data?.data?.find((b: any) => b.kode.startsWith("QR-TEST-"));
  const targetBinCode = targetBin ? targetBin.kode : "QR-TEST-MOCK";

  await record("binController", `/api/v1/bins/${targetBinCode}/status`, "Sukses - Get Status", "GET", {});

  // Scenario 9: Get bin status (Error - Not Found)
  await record("binController", "/api/v1/bins/QR-NOT-EXIST/status", "Error - Bin Status Not Found", "GET", {});

  // Scenario 10: Empty bin (Success - Admin/Petugas)
  await record("binController", `/api/v1/bins/${targetBinCode}/empty`, "Sukses - Empty Bin", "POST", {
    token: adminToken,
  });

  // Scenario 11: Scan bin (Error - Out of range)
  // First get household ID for warga
  // We can call /api/v1/households/my-household or similar. Let's see what is in householdController.ts routes
  const myHouseholds = await apiRequest("/api/v1/bins/my-bins", { token: wargaToken }); // Wait, my-bins contains household list?
  // Let's just do a GET /api/v1/households? or query DB to fetch warga's household.
  // Actually, let's write a simple query to prisma inside the script to fetch a valid householdId.
  const { PrismaClient: LocalPrisma } = await import("@prisma/client");
  const prismaInstance = new LocalPrisma();
  const wargaUser = await prismaInstance.user.findUnique({
    where: { email: "warga@psc.id" },
    include: { households: true },
  });
  const testHouseholdId = wargaUser?.households?.[0]?.id || "00000000-0000-0000-0000-000000000000";
  await prismaInstance.$disconnect();

  await record("binController", "/api/v1/bins/scan", "Error - Scan Out of Range", "POST", {
    token: wargaToken,
    body: {
      qrCode: targetBinCode,
      detectedType: "ORGANIC",
      estimatedVolume: 3.5,
      householdId: testHouseholdId,
      userLat: -6.9999999, // Way out of range
      userLng: 107.9999999,
    },
  });

  // Scenario 12: Delete Bin (Success - Admin)
  // Let's find the created bin's real database ID or code
  const dbBin = targetBinCode;
  await record("binController", `/api/v1/bins/${dbBin}`, "Sukses - Delete Bin", "DELETE", {
    token: adminToken,
  });

  // 3. Write markdown file
  let mdContent = `# Refactor Baseline Snapshot - userController & binController

File ini berisi baseline snapshot untuk semua endpoint di \`userController.ts\` dan \`binController.ts\`. Nilai dinamis seperti UUID, Token, dan Tanggal telah disensor (\`MASKED_*\`) agar perbandingan diff setelah refactor konsisten.

Jumlah Skenario: ${snapshots.length}

## Ringkasan Skenario
| Controller | Endpoint | Skenario | Method | Status |
|---|---|---|---|---|
`;

  snapshots.forEach((s) => {
    mdContent += `| ${s.controller} | \`${s.endpoint}\` | ${s.scenario} | ${s.method} | ${s.status} |\n`;
  });

  mdContent += "\n## Rincian Skenario dan Response\n";

  snapshots.forEach((s) => {
    mdContent += `\n### ${s.controller} - ${s.method} ${s.endpoint} (${s.scenario})
**HTTP Status:** ${s.status}

\`\`\`json
${s.response}
\`\`\`
`;
  });

  const docsDir = path.join(process.cwd(), "docs");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir);
  }
  fs.writeFileSync(path.join(docsDir, "refactor-baseline-user-bin.md"), mdContent, "utf8");
  console.log("Baseline snapshot generated successfully in docs/refactor-baseline-user-bin.md!");
}

run().catch(console.error);
