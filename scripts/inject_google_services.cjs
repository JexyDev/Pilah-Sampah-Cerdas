const fs = require('fs');
const path = require('path');

const secret = (
  process.env.GOOGLE_SERVICES_JSON_BASE64 ||
  process.env.GOOGLE_SERVICES_JSON ||
  ''
).trim();

if (!secret) {
  console.error('❌ FATAL: Secret GOOGLE_SERVICES_JSON_BASE64 atau GOOGLE_SERVICES_JSON belum diatur di GitHub Secrets!');
  console.error('Silakan buka: Repository Settings -> Secrets and variables -> Actions -> New repository secret');
  process.exit(1);
}

let jsonContent = secret;

// Jika input bukan raw JSON (tidak diawali '{'), decode dari base64
if (!jsonContent.startsWith('{')) {
  try {
    // Hapus whitespace, line breaks, carriage returns, dan padding anomali
    const sanitized = jsonContent.replace(/\s+/g, '');
    jsonContent = Buffer.from(sanitized, 'base64').toString('utf-8');
  } catch (err) {
    console.error('❌ Gagal decode base64:', err.message);
    process.exit(1);
  }
}

try {
  const parsed = JSON.parse(jsonContent);
  if (!parsed.project_info || !parsed.project_info.project_id) {
    throw new Error('JSON tidak memiliki field wajib "project_info.project_id"');
  }

  const targetDir = path.resolve(process.cwd(), 'android/app');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetPath = path.join(targetDir, 'google-services.json');
  fs.writeFileSync(targetPath, JSON.stringify(parsed, null, 2), 'utf-8');
  console.log('✅ Berhasil menyuntikkan google-services.json!');
  console.log('   - Project ID :', parsed.project_info.project_id);
  console.log('   - Package    :', parsed.client?.[0]?.client_info?.android_client_info?.package_name || 'unknown');
  console.log('   - Target File:', targetPath);
} catch (err) {
  console.error('❌ Format konten bukan google-services.json yang valid:', err.message);
  process.exit(1);
}
