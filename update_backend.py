import os
import re

# 1. Update binService.ts to remove ASSIGNED_TO_PIC
bin_svc_path = 'apps/api/src/services/binService.ts'
with open(bin_svc_path, 'r', encoding='utf-8') as f:
    bin_svc = f.read()

# Replace ASSIGNED_TO_PIC with ACTIVE_BOUND (shortcut for skip assignment)
# In rejectActivation and createBatch and any assignment
bin_svc = bin_svc.replace('"ASSIGNED_TO_PIC"', '"ACTIVE_BOUND"')
bin_svc = bin_svc.replace('BinStatus.ASSIGNED_TO_PIC', 'BinStatus.ACTIVE_BOUND')

with open(bin_svc_path, 'w', encoding='utf-8') as f:
    f.write(bin_svc)

# 2. Add location ping to kknAttendanceRoutes.ts and kknAttendanceService.ts
kkn_svc_path = 'apps/api/src/services/kknAttendanceService.ts'
with open(kkn_svc_path, 'r', encoding='utf-8') as f:
    kkn_svc = f.read()

location_ping_code = '''
  async pingLocation(userId: string, latitude: number, longitude: number) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId }
    });
    if (!student) throw new Error("STUDENT_NOT_FOUND");
    
    // Simpan lokasi
    await prisma.studentLocation.create({
      data: {
        studentId: userId,
        latitude,
        longitude
      }
    });

    // Cek durasi di zona
    // (Implementasi durasi absen berdasarkan lokasi - Dummy for now as requested)
    return { success: true, message: "Lokasi berhasil dilacak" };
  }

  async getWargaDampingan(userId: string) {
    // Ambil warga yang di-register oleh mahasiswa ini
    const bins = await prisma.bin.findMany({
      where: { registeredByStudentId: userId },
      include: {
        user: {
          include: { households: true }
        },
        wasteLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    return bins.map(b => ({
      binId: b.id,
      wargaName: b.user?.name || "Unknown",
      address: b.user?.households?.[0]?.address || "-",
      recentLogs: b.wasteLogs
    }));
  }
'''
if 'pingLocation' not in kkn_svc:
    kkn_svc = kkn_svc.replace('export class KknAttendanceService {', 'export class KknAttendanceService {\\n' + location_ping_code)
    with open(kkn_svc_path, 'w', encoding='utf-8') as f:
        f.write(kkn_svc)

kkn_route_path = 'apps/api/src/routes/kknAttendanceRoutes.ts'
with open(kkn_route_path, 'r', encoding='utf-8') as f:
    kkn_routes = f.read()

route_code = '''
router.post('/location-ping', authMiddleware, roleMiddleware(['MAHASISWA_KKN']), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const result = await kknAttendanceService.pingLocation(req.user!.id, latitude, longitude);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/warga-dampingan', authMiddleware, roleMiddleware(['MAHASISWA_KKN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const result = await kknAttendanceService.getWargaDampingan(req.user!.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
'''
if '/location-ping' not in kkn_routes:
    kkn_routes = kkn_routes.replace('export default router;', route_code + '\\nexport default router;')
    with open(kkn_route_path, 'w', encoding='utf-8') as f:
        f.write(kkn_routes)

print("Backend update success")
