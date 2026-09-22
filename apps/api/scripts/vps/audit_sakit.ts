import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const nim = '44324018';
  console.log(`Auditing student with NIM: ${nim}`);

  const student = await prisma.studentKkn.findUnique({
    where: { nim },
    include: {
      user: {
        include: {
          studentLeaveRequests: true,
          attendances: true
        }
      }
    }
  });

  if (!student) {
    console.log('Student not found');
    return;
  }

  console.log('Student:', student.user.name);

  console.log('\nLeave Requests:');
  student.user.studentLeaveRequests.forEach(req => {
    console.log(`- ID: ${req.id}`);
    console.log(`  Type: ${req.type}`);
    console.log(`  Start: ${req.startDate.toISOString()}`);
    console.log(`  End: ${req.endDate.toISOString()}`);
    console.log(`  Status: ${req.status}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
