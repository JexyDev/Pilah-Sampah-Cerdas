import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const userService = {
  async getAllUsers() {
    const users = await prisma.user.findMany({
      include: {
        role: true,
        households: {
          include: {
            rtRw: {
              include: {
                kelurahan: true
              }
            },
            wasteLogs: true
          }
        }
      }
    });

    // Map to frontend expected format
    return users.map(user => {
      let totalSetoran = 0;
      let wilayah = "Belum Diatur";
      
      if (user.households && user.households.length > 0) {
        const hh = user.households[0];
        wilayah = `${hh.rtRw.kelurahan.name}, ${hh.rtRw.name}`;
        
        hh.wasteLogs.forEach(log => {
          totalSetoran += Number(log.weightKg);
        });
      }

      let roleName = "Warga";
      if (user.role.name === "ADMIN") roleName = "Admin";
      if (user.role.name.includes("PETUGAS")) roleName = "Petugas";

      return {
        id: user.id,
        nama: user.name,
        email: user.email,
        nik: user.id.substring(0, 8).toUpperCase(), // Mock NIK
        peran: roleName,
        wilayah: wilayah,
        setoran: totalSetoran.toFixed(2),
        status: "Aktif",
      };
    });
  }
};
