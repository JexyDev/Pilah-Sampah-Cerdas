

const VPS_URL = 'http://157.10.252.252:3000/api/v1';

async function testSync() {
  console.log("=== START VPS SYNC VERIFICATION ===");
  
  const testPhone = '+628999' + Math.floor(100000 + Math.random() * 900000);
  const testEmail = 'test.' + Math.floor(100000 + Math.random() * 900000) + '@pilahsampah.id';

  // 1. Register Warga
  console.log(`\n1. Registering Warga with phone: ${testPhone} and email: ${testEmail}...`);
  const regRes = await fetch(`${VPS_URL}/auth/register/warga`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: testPhone,
      password: 'password123',
      name: 'Test Warga Sync',
      email: testEmail,
      address: 'Jl. Test Sync No. 1',
      rtRw: '01/02',
      kelurahan: 'Ciawi'
    })
  });

  if (!regRes.ok) {
    console.error("Register failed:", regRes.status, await regRes.text());
    return;
  }

  const regData = (await regRes.json()) as any;
  console.log("Register success!");

  // 2. Test Login
  console.log("\n2. Testing Login...");
  const loginRes = await fetch(`${VPS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: testPhone, password: 'password123' })
  });
  
  if (!loginRes.ok) {
    console.error("Login failed:", loginRes.status, await loginRes.text());
    return;
  }
  
  const loginData = (await loginRes.json()) as any;
  const token = loginData.data?.accessToken;
  console.log("Login success! Token retrieved.");

  // 2. Testing /bins/my-bins
  console.log("\n2. Testing GET /bins/my-bins...");
  const binsRes = await fetch(`${VPS_URL}/bins/my-bins`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (binsRes.ok) {
    const binsData = (await binsRes.json()) as any;
    console.log("GET /bins/my-bins success!");
    console.log("Bin records returned:", binsData.data?.length);
    if (binsData.data && binsData.data.length > 0) {
      const firstBin = binsData.data[0];
      console.log("Checking structure of first bin:");
      console.log("- id:", firstBin.id);
      console.log("- qrCode:", firstBin.qrCode);
      console.log("- isActive:", firstBin.isActive);
      console.log("- latitude:", firstBin.latitude);
      console.log("- longitude:", firstBin.longitude);
      console.log("- kelurahan:", firstBin.kelurahan);
      
      if (firstBin.isActive !== undefined && firstBin.latitude !== undefined && firstBin.longitude !== undefined && firstBin.kelurahan !== undefined) {
        console.log(">> PASS: All required fields present!");
      } else {
        console.error(">> FAIL: Missing fields!");
      }
    } else {
      console.log(">> PASS: (No bins returned, but request was OK)");
    }
  } else {
    console.error("GET /bins/my-bins failed:", binsRes.status);
  }

  // 3. Testing /notifications/:id/read
  console.log("\n3. Testing PUT /notifications/:id/read (Using mock/test notification ID)...");
  const readRes = await fetch(`${VPS_URL}/notifications/nonexistent-id/read`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("PUT /notifications/:id/read status:", readRes.status);
  if (readRes.status === 200 || readRes.status === 204 || readRes.status === 404) {
    const resText = await readRes.text();
    console.log("Response:", resText);
    if (resText.includes("Notifikasi") || resText.includes("success") || resText.includes("Gagal")) {
      console.log(">> PASS: Endpoint mapped and handled correctly!");
    } else {
      console.error(">> FAIL: Unexpected route response (likely 404 route not found)");
    }
  } else {
    console.error(">> FAIL: HTTP status", readRes.status);
  }

  // 4. Testing /notifications/device-token
  console.log("\n4. Testing POST /notifications/device-token...");
  const tokenRes = await fetch(`${VPS_URL}/notifications/device-token`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ token: 'mock-fcm-token-123' })
  });
  console.log("POST /notifications/device-token status:", tokenRes.status);
  if (tokenRes.ok) {
    console.log("Response:", await tokenRes.json());
    console.log(">> PASS: Device token saved successfully!");
  } else {
    console.error(">> FAIL: HTTP status", tokenRes.status);
  }

  // 5. Testing forgot-password
  console.log("\n5. Testing POST /auth/forgot-password...");
  const forgotRes = await fetch(`${VPS_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail })
  });
  console.log("POST /auth/forgot-password status:", forgotRes.status);
  if (forgotRes.ok) {
    const forgotData = await forgotRes.json();
    console.log("Response:", forgotData);
    console.log(">> PASS: Forgot password handled successfully!");
  } else {
    console.error(">> FAIL: HTTP status", forgotRes.status, await forgotRes.text());
  }

  console.log("\n=== VPS SYNC VERIFICATION DONE ===");
}

testSync().catch(console.error);
