/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class UserRepository {
  async findMany(whereClause: any) {
    return prisma.user.findMany({
      where: whereClause,
      include: {
        role: true,
        rtRw: {
          include: { kelurahan: true },
        },
        households: {
          include: {
            rtRw: {
              include: { kelurahan: true },
            },
            wasteLogs: {
              select: { weightKg: true },
            },
          },
        },
        pointHistory: {
          select: { points: true },
        },
        studentProfile: {
          include: { assignedPolygon: true }
        },
        petugasProfile: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { role: true, studentProfile: true, petugasProfile: true }
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findByNik(nik: string) {
    return prisma.user.findUnique({
      where: { nik },
    });
  }

  async findRoleByName(name: string) {
    return prisma.role.findUnique({
      where: { name },
    });
  }

  async create(data: any) {
    return prisma.user.create({
      data,
      include: { role: { select: { name: true } } },
    });
  }

  async update(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
      include: { role: { select: { name: true } } },
    });
  }

  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }
}

export const userRepository = new UserRepository();
