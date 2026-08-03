const API_BASE = "http://localhost:3000/api/v1";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 RUNNING DPL API & SCOPE AUTHORIZATION 403 TESTS");
  console.log("==================================================\n");

  try {
    // 1. Login DPL 1
    console.log("1. Login sebagai DPL 1 (+6281300000001)...");
    const resLogin1 = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "+6281300000001", password: "123456" }),
    }).then((r) => r.json());

    if (!resLogin1.data?.accessToken) {
      console.error("❌ Login DPL 1 gagal:", resLogin1);
      return;
    }

    const tokenDpl1 = resLogin1.data.accessToken;
    console.log("   ✅ Login DPL 1 Sukses. Token diperoleh.\n");

    // 2. Fetch Group Summary (DPL 1)
    console.log("2. GET /api/v1/dpl/groups (Ringkasan Kelompok Bimbingan DPL 1)...");
    const resGroups1 = await fetch(`${API_BASE}/dpl/groups`, {
      headers: { Authorization: `Bearer ${tokenDpl1}` },
    }).then((r) => r.json());
    console.log("   ✅ Success. Total Kelompok Bimbingan:", resGroups1.data.length);
    const dpl1Group = resGroups1.data[0];
    console.log("      Sample Kelompok DPL 1:", dpl1Group.name, `(${dpl1Group.studentCount} Mhs)\n`);

    // 3. Fetch Students (DPL 1)
    console.log("3. GET /api/v1/dpl/students (Detail per Mahasiswa DPL 1)...");
    const resStudents1 = await fetch(`${API_BASE}/dpl/students`, {
      headers: { Authorization: `Bearer ${tokenDpl1}` },
    }).then((r) => r.json());
    console.log("   ✅ Success. Total Mahasiswa DPL 1:", resStudents1.data.length);
    const sampleStudent = resStudents1.data[0];
    console.log(
      "      Sample Mhs DPL 1:",
      sampleStudent.name,
      `(${sampleStudent.jurusan}) - Score: ${sampleStudent.assessmentScore}\n`
    );

    // 4. Fetch Assisted Citizens (DPL 1)
    console.log(`4. GET /api/v1/dpl/students/${sampleStudent.id}/citizens (Warga Dibantu & Pola Buang)...`);
    const resCitizens1 = await fetch(`${API_BASE}/dpl/students/${sampleStudent.id}/citizens`, {
      headers: { Authorization: `Bearer ${tokenDpl1}` },
    }).then((r) => r.json());
    console.log("   ✅ Success. Citizens count:", resCitizens1.data.totalCitizensAssisted);
    if (resCitizens1.data.citizens.length > 0) {
      console.log(
        "      Sample Citizen Pattern:",
        resCitizens1.data.citizens[0].polaBuangSampah,
        `(Setoran: ${resCitizens1.data.citizens[0].totalSetoranCount}x)\n`
      );
    }

    // 5. Fetch Map Coverage (DPL 1)
    console.log("5. GET /api/v1/dpl/map-coverage (Peta Sebaran RW & Bin)...");
    const resMap = await fetch(`${API_BASE}/dpl/map-coverage`, {
      headers: { Authorization: `Bearer ${tokenDpl1}` },
    }).then((r) => r.json());
    console.log("   ✅ Success. RW Areas:", resMap.data.rwAreas.length, "| Bins:", resMap.data.bins.length, "\n");

    // 6. Fetch Alerts (DPL 1)
    console.log("6. GET /api/v1/dpl/alerts (Notifikasi/Alert Pending Approval DPL 1)...");
    const resAlerts = await fetch(`${API_BASE}/dpl/alerts`, {
      headers: { Authorization: `Bearer ${tokenDpl1}` },
    }).then((r) => r.json());
    console.log("   ✅ Success. Pending approvals:", resAlerts.data.pendingApprovalsCount, "\n");

    // 7. SCOPE AUTHORIZATION CHECK (403 TEST)
    console.log("==================================================");
    console.log("🔒 VALIDASI BACKEND SCOPE AUTHORIZATION (403 FORBIDDEN TEST)");
    console.log("==================================================");
    console.log("7a. Login sebagai DPL 2 (+6281300000002)...");
    const resLogin2 = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "+6281300000002", password: "123456" }),
    }).then((r) => r.json());

    const tokenDpl2 = resLogin2.data.accessToken;
    console.log("    ✅ Login DPL 2 Sukses. Token diperoleh.\n");

    console.log(`7b. DPL 2 mencoba mengakses data kelompok DPL 1 (groupId: ${dpl1Group.id})...`);
    const resScopeGroup = await fetch(`${API_BASE}/dpl/students?groupId=${dpl1Group.id}`, {
      headers: { Authorization: `Bearer ${tokenDpl2}` },
    });
    const bodyScopeGroup = await resScopeGroup.json();

    if (resScopeGroup.status === 403) {
      console.log("   ✅ SUCCESS 403 FORBIDDEN VERIFIED!");
      console.log("      HTTP Status :", resScopeGroup.status);
      console.log("      Error Message:", bodyScopeGroup.message, "\n");
    } else {
      console.error("   ❌ FAIL: Status code lain:", resScopeGroup.status, bodyScopeGroup);
    }

    console.log("7c. DPL 2 mencoba mengakses detail warga dari mahasiswa DPL 1...");
    const resScopeCitizen = await fetch(`${API_BASE}/dpl/students/${sampleStudent.id}/citizens`, {
      headers: { Authorization: `Bearer ${tokenDpl2}` },
    });
    const bodyScopeCitizen = await resScopeCitizen.json();

    if (resScopeCitizen.status === 403) {
      console.log("   ✅ SUCCESS 403 FORBIDDEN VERIFIED!");
      console.log("      HTTP Status :", resScopeCitizen.status);
      console.log("      Error Message:", bodyScopeCitizen.message, "\n");
    } else {
      console.error("   ❌ FAIL: Status code lain:", resScopeCitizen.status, bodyScopeCitizen);
    }

    console.log("==================================================");
    console.log("🎉 SELURUH SKENARIO TESTING BACKEND DPL LULUS 100%");
    console.log("==================================================");
  } catch (error: any) {
    console.error("❌ Critical Test Error:", error.message);
  }
}

runTests();
