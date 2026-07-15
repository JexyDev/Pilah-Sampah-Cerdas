import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class TransactionService {
  async getDeposits(binCode?: string) {
    // REKAP-01 FIX: Only return waste logs from WARGA users (role.name = 'WARGA')
    // This prevents admin/petugas-created records from appearing in rekap setoran
    return prisma.wasteLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        household: {
          include: {
            user: {
              select: { 
                name: true,
                role: {
                  select: { name: true }
                }
              }
            }
          }
        },
        category: true,
        bin: {
          include: {
            rtRw: true
          }
        }
      },
      where: {
        household: {
          user: {
            role: {
              name: 'WARGA' // RBAC: Only include WasteLog from WARGA users
            }
          }
        },
        bin: binCode ? {
          qrCode: binCode
        } : undefined
      }
    });
  }
}

export const transactionService = new TransactionService();
