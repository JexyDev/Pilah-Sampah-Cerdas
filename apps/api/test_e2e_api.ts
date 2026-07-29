import fs from 'fs';

async function req(method: string, path: string, body?: any, token?: string) {
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`http://localhost:3000${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  
  let data;
  const text = await res.text();
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function runTests() {
  console.log('--- STARTING E2E API TESTS ---');
  let report = '';
  
  const log = (msg: string) => { console.log(msg); report += msg + '\n'; };

  try {
    // 1. Register Warga
    log('Testing Warga Registration...');
    const regWarga = await req('POST', '/api/v1/auth/register', {
      name: 'Warga API Test',
      phone: '089999999991',
      password: 'password123',
      role: 'Warga',
      rtRwId: 1, // Asumsi 1 adalah ID RW 01 Dago
      wargaSubtype: 'Rumah Tangga',
      address: 'Jl. Dago API'
    });
    log(`Reg Warga Status: ${regWarga.status} - Data: ${JSON.stringify(regWarga.data)}`);

    // Login Warga
    const loginWarga = await req('POST', '/api/v1/auth/login', {
      phone: '089999999991',
      password: 'password123'
    });
    log(`Login Warga Status: ${loginWarga.status}`);
    const tokenWarga = loginWarga.data?.token;

    // 2. Setoran Otomatis Warga
    if (tokenWarga) {
        log('Testing Setoran Otomatis Warga...');
        const setoran = await req('POST', '/api/v1/transactions/setoran-otomatis', {
            fotoSampahUrl: 'dummy_url',
            hasilKlasifikasiAi: 'Organik',
            confidenceAi: 0.98,
            berat: 2.0,
            qrTempatSampahId: 'QR-ORG-DAGO-001',
            lokasiGps: '-6.123,107.123'
        }, tokenWarga);
        log(`Setoran Otomatis Status: ${setoran.status} - Data: ${JSON.stringify(setoran.data)}`);
    }

    // 3. Register Petugas Residu
    log('Testing Petugas Residu Registration...');
    const regPetugas = await req('POST', '/api/v1/auth/register', {
        name: 'Petugas API Test',
        phone: '089999999992',
        password: 'password123',
        role: 'Petugas Residu',
        rtRwId: 1
    });
    log(`Reg Petugas Status: ${regPetugas.status} - Data: ${JSON.stringify(regPetugas.data)}`);

    // 4. Edge Cases - Setoran Berat Negatif
    if (tokenWarga) {
        log('Testing Edge Case: Berat Negatif...');
        const setoranNeg = await req('POST', '/api/v1/transactions/setoran-otomatis', {
            fotoSampahUrl: 'dummy_url',
            hasilKlasifikasiAi: 'Organik',
            confidenceAi: 0.98,
            berat: -5.0, // NEGATIF
            qrTempatSampahId: 'QR-ORG-DAGO-001',
            lokasiGps: '-6.123,107.123'
        }, tokenWarga);
        log(`Setoran Negatif Status: ${setoranNeg.status} - Data: ${JSON.stringify(setoranNeg.data)}`);
    }

  } catch (err: any) {
    log('Error: ' + err.message);
  }

  fs.writeFileSync('e2e_api_test_results.txt', report);
  console.log('--- E2E API TESTS DONE ---');
}

runTests();
