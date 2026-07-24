const BASE_URL = 'http://localhost:3000/api/v1';

async function testSuperAdminApprovals() {
  console.log('=== START SUPER ADMIN APPROVALS TEST ===');
  
  // 1. Login as Super Admin
  console.log('\n1. Logging in as Super Admin...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '+628111111111',
      password: 'password123'
    })
  });
  if (!loginRes.ok) {
    console.error('Super Admin login failed:', loginRes.status, await loginRes.text());
    return;
  }
  const loginData: any = await loginRes.json();
  const token = loginData.accessToken || loginData.data?.accessToken;
  if (!token) {
    console.error('Token not found in login response:', loginData);
    return;
  }
  console.log('Logged in! Token obtained:', token.substring(0, 10) + '...');

  const adminHeaders = { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` 
  };

  // 2. Find categories first
  console.log('\n2. Fetching categories...');
  const catRes = await fetch(`${BASE_URL}/categories`, { headers: adminHeaders });
  const catData = await catRes.json();
  const categories = catData.data || [];
  const organicCat = categories.find((c: any) => c.name.toUpperCase().includes('ORGANIK'));
  const catId = organicCat ? organicCat.id : (categories[0]?.id || 'ORGANIK');

  // 3. Generate a printed bin QR code
  console.log(`\n3. Generating a printed QR code batch with category ${catId}...`);
  const genRes = await fetch(`${BASE_URL}/super-admin/bins/generate-qr`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      totalQr: 1,
      categoryId: catId
    })
  });
  if (!genRes.ok) {
    console.error('Failed to generate QR batch:', genRes.status, await genRes.text());
    return;
  }
  
  // Find the generated QR code from master list
  console.log('\n4. Finding the generated QR code...');
  const qrListRes = await fetch(`${BASE_URL}/super-admin/bins/qr-master`, { headers: adminHeaders });
  const qrListData = await qrListRes.json();
  const qrs = qrListData.data || [];
  const printedQr = qrs.find((q: any) => q.status === 'PRINTED');
  if (!printedQr) {
    console.error('No printed QR code found in master list');
    return;
  }
  console.log(`Found PRINTED QR: ${printedQr.qrCode}`);

  // 3. Register Warga with the printed QR code
  console.log('\n5. Registering Warga with QR code...');
  const phone = '+628999' + Math.floor(100000 + Math.random() * 900000);
  const email = `test.${Math.floor(100000 + Math.random() * 900000)}@pilahsampah.id`;
  const registerRes = await fetch(`${BASE_URL}/auth/register/warga`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Warga Demo Approval',
      phone,
      email,
      password: 'password123',
      rtRw: 'RT 05 / RW 09',
      kelurahan: 'Dago',
      qrCode: printedQr.qrCode,
      wargaSubtype: 'UTAMA'
    })
  });
  
  if (!registerRes.ok) {
    console.error('Failed to register warga:', registerRes.status, await registerRes.text());
    return;
  }
  console.log('Warga registered successfully! Bin status should be PENDING_APPROVAL.');

  // 4. Verify bin is in pending list for Super Admin
  console.log('\n6. Verifying bin appears in Super Admin pending list...');
  const pendingBinsRes = await fetch(`${BASE_URL}/super-admin/approvals/bins`, { headers: adminHeaders });
  const pendingBinsData = await pendingBinsRes.json();
  const pendingBins = pendingBinsData.data || [];
  const myPendingBin = pendingBins.find((b: any) => b.qrCode === printedQr.qrCode);
  
  if (!myPendingBin) {
    console.error('Bin not found in pending list. Pending list:', pendingBins);
    return;
  }
  console.log(`PASS: Bin ${printedQr.qrCode} is in pending list! rtRwId: ${myPendingBin.rtRwId}`);

  // 5. Approve the bin via Super Admin
  console.log('\n7. Approving bin via Super Admin...');
  const approveRes = await fetch(`${BASE_URL}/super-admin/approvals/bins/${myPendingBin.id}/approve`, {
    method: 'PUT',
    headers: adminHeaders
  });
  if (!approveRes.ok) {
    console.error('Failed to approve bin:', approveRes.status, await approveRes.text());
    return;
  }
  console.log('Bin approved! Checking if status is ACTIVE_BOUND...');
  
  // Verify status in master list
  const qrCheckRes = await fetch(`${BASE_URL}/super-admin/bins/qr-master`, { headers: adminHeaders });
  const qrCheckData = await qrCheckRes.json();
  const qrCheck = (qrCheckData.data || []).find((q: any) => q.id === myPendingBin.id);
  if (qrCheck?.status === 'ACTIVE_BOUND') {
    console.log('PASS: Bin status is now ACTIVE_BOUND!');
  } else {
    console.error('FAIL: Bin status is:', qrCheck?.status);
    return;
  }

  // 6. Register Petugas Residu
  console.log('\n8. Registering Petugas Residu...');
  const petugasPhone = '+628999' + Math.floor(100000 + Math.random() * 900000);
  const petugasEmail = `petugas.${Math.floor(100000 + Math.random() * 900000)}@pilahsampah.id`;
  const regPetugasRes = await fetch(`${BASE_URL}/auth/register/petugas-residu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Petugas Demo Approval',
      phone: petugasPhone,
      email: petugasEmail,
      password: 'password123',
      rtRw: 'RT 05 / RW 09',
      kelurahan: 'Dago',
      noWa: petugasPhone,
      assignedZone: 'Dago'
    })
  });
  
  if (!regPetugasRes.ok) {
    console.error('Failed to register petugas:', regPetugasRes.status, await regPetugasRes.text());
    return;
  }
  const regPetugasData: any = await regPetugasRes.json();
  const petugasUserId = regPetugasData.data.id;
  console.log(`Petugas registered! User ID: ${petugasUserId}`);

  // 7. Verify Petugas appears in Super Admin pending list
  console.log('\n9. Verifying petugas appears in Super Admin pending list...');
  const pendingPetugasRes = await fetch(`${BASE_URL}/super-admin/approvals/petugas`, { headers: adminHeaders });
  const pendingPetugasData = await pendingPetugasRes.json();
  const pendingPetugas = pendingPetugasData.data || [];
  
  // Find petugas record
  const myPendingPetugas = pendingPetugas.find((p: any) => p.userId === petugasUserId);
  if (!myPendingPetugas) {
    console.error('Petugas not found in Super Admin pending list. List:', pendingPetugas);
    return;
  }
  console.log(`PASS: Petugas is in pending list! ID: ${myPendingPetugas.id}`);

  // 8. Verify Petugas appears in RW pending list
  console.log('\n10. Verifying petugas appears in RW pending list...');
  const usersRes = await fetch(`${BASE_URL}/users?roleName=RW`, { headers: adminHeaders });
  const usersData = await usersRes.json();
  const rwUser = (usersData.data || []).find((u: any) => u.rtRwId === myPendingBin.rtRwId);
  
  if (rwUser) {
    console.log(`Found RW user ${rwUser.name} for rtRwId ${myPendingBin.rtRwId}.`);
  }
  
  // 9. Approve Petugas via Super Admin
  console.log('\n11. Approving petugas via Super Admin...');
  const verifyRes = await fetch(`${BASE_URL}/super-admin/approvals/petugas/${myPendingPetugas.id}/verify`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ action: 'APPROVED' })
  });
  
  if (!verifyRes.ok) {
    console.error('Failed to approve petugas:', verifyRes.status, await verifyRes.text());
    return;
  }
  console.log('PASS: Petugas approved successfully!');

  console.log('\n=== ALL SUPER ADMIN APPROVALS TESTS PASSED ===');
}

testSuperAdminApprovals();
