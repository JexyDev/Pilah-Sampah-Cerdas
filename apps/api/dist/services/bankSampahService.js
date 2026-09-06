/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
const prisma = new PrismaClient();
export const bankSampahService = {
    /**
     * Add a deposit or withdrawal transaction for a Warga
     */
    addTransaction: async (userId, type, amount, description) => {
        return prisma.$transaction(async (tx) => {
            // Find or create user ledger
            let ledger = await tx.bankSampahLedger.findUnique({
                where: { userId },
            });
            if (!ledger) {
                ledger = await tx.bankSampahLedger.create({
                    data: {
                        userId,
                        saldoRupiah: 0.0,
                        riwayatTransaksi: "[]",
                    },
                });
            }
            const currentBalance = Number(ledger.saldoRupiah);
            let newBalance = currentBalance;
            if (type === "DEPOSIT") {
                newBalance += Number(amount);
            }
            else if (type === "WITHDRAWAL") {
                if (currentBalance < Number(amount)) {
                    throw new Error("INSUFFICIENT_FUNDS");
                }
                newBalance -= Number(amount);
            }
            else {
                throw new Error("INVALID_TRANSACTION_TYPE");
            }
            // Parse current transaction history
            let history = [];
            try {
                if (typeof ledger.riwayatTransaksi === "string") {
                    history = JSON.parse(ledger.riwayatTransaksi);
                }
                else if (Array.isArray(ledger.riwayatTransaksi)) {
                    history = ledger.riwayatTransaksi;
                }
                else if (ledger.riwayatTransaksi && typeof ledger.riwayatTransaksi === "object") {
                    history = ledger.riwayatTransaksi;
                }
            }
            catch (e) {
                console.error("[bankSampahService] JSON parse error:", e);
                history = [];
            }
            // Create new transaction payload
            const txPayload = {
                id: uuidv4(),
                type,
                amount: Number(amount),
                description: description ||
                    (type === "DEPOSIT" ? "Setoran sampah anorganik" : "Penarikan saldo tunai"),
                timestamp: new Date().toISOString(),
            };
            history.unshift(txPayload);
            // Save updated ledger
            const updated = await tx.bankSampahLedger.update({
                where: { id: ledger.id },
                data: {
                    saldoRupiah: newBalance,
                    riwayatTransaksi: history,
                },
            });
            return updated;
        });
    },
    /**
     * Get balance and transaction history for a user
     */
    getLedger: async (userId) => {
        const ledger = await prisma.bankSampahLedger.findUnique({
            where: { userId },
        });
        if (!ledger) {
            return {
                userId,
                saldoRupiah: 0.0,
                riwayatTransaksi: [],
            };
        }
        return ledger;
    },
};
