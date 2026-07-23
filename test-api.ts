import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
const prisma = new PrismaClient();
async function main() {
  const admin = await prisma.user.findFirst({ where: { role: { name: 'ADMIN_DLH' } } });
  if (!admin) return console.log('no admin dlh');
  const token = jwt.sign({ userId: admin.id, role: 'ADMIN_DLH' }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '1h' });
  try {
    const res = await fetch('http://localhost:3000/api/v1/super-admin/dashboard', { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json();
    console.log(res.status, JSON.stringify(data).substring(0, 200));
  } catch (e: any) {
    console.error(e);
  }
}
main();
