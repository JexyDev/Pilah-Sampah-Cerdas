import { PrismaClient } from "@prisma/client";
import { authService } from "../src/services/authService";

const prisma = new PrismaClient();

async function main() {
  const roleWarga = await prisma.role.findFirst({ where: { name: "WARGA" } });
  if (!roleWarga) {
    console.log("Role WARGA not found");
    return;
  }

  const wargaUser = await prisma.user.findFirst({ where: { roleId: roleWarga.id } });
  if (!wargaUser) {
    console.log("No WARGA user found");
    return;
  }

  const testPhone = "+6281234567890";
  
  await prisma.user.update({
    where: { id: wargaUser.id },
    data: { phone: testPhone },
  });

  console.log(`Updated user ${wargaUser.email} (ID: ${wargaUser.id}) to have phone: ${testPhone}`);

  try {
    const result = await authService.requestOtp(testPhone);
    console.log("OTP requested successfully:", result);
    console.log("OTP is hardcoded as '123456' for development.");
  } catch (error) {
    console.error("Failed to request OTP:", error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
