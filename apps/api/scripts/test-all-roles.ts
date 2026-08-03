const API_BASE = "http://localhost:3000/api/v1";

const testRoles = [
  { role: "Super Admin", phone: "+628111111111", pass: "password123" },
  { role: "Admin DLH", phone: "+628111111112", pass: "password123" },
  { role: "DPL (Dosen)", phone: "+6281300000001", pass: "123456" },
  { role: "Camat Coblong", phone: "+628111111113", pass: "password123" },
  { role: "Lurah Dago", phone: "+628111111114", pass: "password123" },
  { role: "RW 06 Dago", phone: "+628111111115", pass: "password123" },
  { role: "RT 01 Dago", phone: "+628111111116", pass: "password123" },
  { role: "Petugas Residu", phone: "+628111111117", pass: "password123" },
  { role: "Mhs KKN", phone: "+628111111118", pass: "password123" },
  { role: "Warga Mandiri", phone: "+62812001001", pass: "password123" },
];

async function verifyAllRoles() {
  console.log("==================================================");
  console.log("🔍 TESTING VERIFIKASI AKUN & DASHBOARD SEMUA ROLE");
  console.log("==================================================\n");

  let successCount = 0;

  for (const item of testRoles) {
    try {
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: item.phone, password: item.pass }),
      }).then((r) => r.json());

      if (loginRes.data?.accessToken) {
        console.log(`✅ [${item.role}] Login Berhasil | Role: ${loginRes.data.user.role?.name || loginRes.data.user.role}`);
        successCount++;
      } else {
        console.error(`❌ [${item.role}] Login Gagal:`, loginRes.message || loginRes.error);
      }
    } catch (err: any) {
      console.error(`❌ [${item.role}] Exception:`, err.message);
    }
  }

  console.log("\n==================================================");
  console.log(`📊 Hasil Pengujian: ${successCount} / ${testRoles.length} Role Berhasil Terverifikasi 100%`);
  console.log("==================================================");
}

verifyAllRoles();
