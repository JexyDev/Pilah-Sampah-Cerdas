import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAudit() {
  console.log('Seeding audit trail...');
  const users = await prisma.user.findMany({ take: 5 });
  const superUser = await prisma.user.findFirst({ where: { role: { name: 'SUPER_USER' } } });
  const adminDlh = await prisma.user.findFirst({ where: { role: { name: 'ADMIN_DLH' } } });

  const creators = [superUser, adminDlh, ...users].filter(Boolean);

  if (creators.length > 0) {
    const today = new Date();
    const trails = [
      { action: 'USER_LOGIN', userIndex: 0, old: null, new: { ip: '192.168.1.5', userAgent: 'Chrome/124.0.0.0 Safari/537.36' }, minutesAgo: 5 },
      { action: 'UPDATE_USER', userIndex: 1, old: { status: 'PENDING' }, new: { status: 'APPROVED' }, minutesAgo: 15 },
      { action: 'CREATE_BIN', userIndex: 2, old: null, new: { capacity: 100, category: 'ORGANIK' }, minutesAgo: 45 },
      { action: 'UPDATE_SETTINGS', userIndex: 0, old: { system_theme: 'light' }, new: { system_theme: 'dark' }, minutesAgo: 120 },
      { action: 'DELETE_WASTE_LOG', userIndex: 1, old: { id: 'abc-123', weight: 5 }, new: null, minutesAgo: 300 },
      { action: 'USER_LOGIN', userIndex: 2, old: null, new: { ip: '10.0.0.4', userAgent: 'Mobile Safari/15.0' }, minutesAgo: 1440 },
      { action: 'APPROVE_DISCREPANCY', userIndex: 0, old: { status: 'PENDING_REVIEW' }, new: { status: 'RESOLVED', finalWeight: 12 }, minutesAgo: 2880 },
    ];

    for (const trail of trails) {
      const u = creators[trail.userIndex % creators.length];
      await prisma.auditTrail.create({
        data: {
          action: trail.action,
          userId: u?.id,
          timestamp: new Date(today.getTime() - trail.minutesAgo * 60000),
          oldValue: trail.old,
          newValue: trail.new,
        }
      });
    }
    console.log('Created audit trails');
  } else {
    console.log('No users found to associate with audit trails');
  }
}

seedAudit().catch(console.error).finally(() => { prisma.$disconnect() });
