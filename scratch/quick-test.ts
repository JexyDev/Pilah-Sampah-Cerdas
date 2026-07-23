// Quick API test
async function test() {
  // 1. Test readOnlyGuard fix (ADMIN_DLH register camat)
  const loginAdmin = await fetch("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@psc.id", password: "password123" }),
  });
  const adminData = await loginAdmin.json();
  const adminToken = adminData.data?.accessToken;
  console.log("AdminDLH login:", loginAdmin.status, adminToken ? "token OK" : "no token");

  const testCamat = await fetch("http://localhost:3000/api/v1/auth/register/camat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: "TEST_CAMAT_TEMP", email: `test.camat.${Date.now()}@test.id`, password: "password123", phone: "+62811111111" }),
  });
  const camatData = await testCamat.json();
  console.log("Register Camat test:", testCamat.status, JSON.stringify(camatData).slice(0, 150));

  // 2. Test bins table fix
  const loginSA = await fetch("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "superadmin@psc.id", password: "password123" }),
  });
  const saData = await loginSA.json();
  const saToken = saData.data?.accessToken;

  const testWarga = await fetch("http://localhost:3000/api/v1/auth/register/warga", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${saToken}` },
    body: JSON.stringify({
      name: "TEST_WARGA_TEMP",
      email: `test.warga.${Date.now()}@test.id`,
      password: "password123",
      phone: `+62812${Date.now().toString().slice(-7)}`,
      qrCode: "NONEXISTENT_QR",
      wargaSubtype: "UTAMA",
      rtRwId: 1,
      latitude: -6.893,
      longitude: 107.615,
    }),
  });
  const wargaData = await testWarga.json();
  console.log("Register Warga test (expect BIN_NOT_FOUND, not 'bins does not exist'):", testWarga.status, JSON.stringify(wargaData).slice(0, 200));
}

test().catch(console.error);
