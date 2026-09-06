/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
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
          },
        },
        setoranOtomatis: {
          select: { berat: true },
        },
        pointHistory: {
          select: { points: true },
        },
        studentProfile: {
          include: { assignedPolygon: true, kelompok: true },
        },
        petugasProfile: true,
        bins: {
          include: {
            registeredByStudent: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { role: true, studentProfile: true, petugasProfile: true },
    });
  }

  async findByPhone(phone: string) {
    return prisma.user.findUnique({
      where: { phone },
    });
  }

  async findByEmail(_email: string) {
    return null;
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
