/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * SmartZoneService — Adaptive Multi-Posko Geofence Engine
 * =========================================================
 * Solves the "berpencar" problem where students from the same KKN group
 * are physically scattered across multiple posco locations and could not attend.
 *
 * Architecture:
 *  1. Multi-Posko: Each group can register N poscos (not just 1).
 *  2. Auto-Polygon: Every 5 min, a convex hull is generated from active student GPS
 *     and saved to KelompokKkn.autoPolygon for backend geofence checks.
 *  3. Zone Check: A student is "inside zone" if they are within ANY of:
 *     (a) official PoskoKkn radius (primary), OR
 *     (b) any PoskoKknMulti radius, OR
 *     (c) the auto-generated convex hull polygon (with buffer).
 */

import { prisma } from "../lib/prisma.js";
import {
  Point,
  convexHull,
  inflatePolygon,
  computeCentroid,
  circleToPolygon,
  getDistanceInMeters,
  isPointInPolygonWithBuffer,
} from "../utils/geoUtils.js";
import { calculateDistance } from "./kknAttendanceService.js";

const DEFAULT_AUTO_POLYGON_BUFFER_M = 75;
const DEFAULT_POSKO_RADIUS_M = 500;
const ACTIVE_STUDENT_WINDOW_MIN = 30;
const MIN_STUDENTS_FOR_HULL = 3;

export interface ZoneCheckResult {
  isInside: boolean;
  matchedPosko: string | null;
  matchedPoskoId: string | null;
  matchedMethod: "POSKO_UTAMA" | "POSKO_MULTI" | "AUTO_POLYGON" | "NONE";
  distanceToNearest: number;
  nearestPoskoName: string | null;
  allPoskos: Array<{ id: string; nama: string; lat: number; lng: number; distance: number }>;
  autoPolygonActive: boolean;
}

export interface GroupZoneInfo {
  kelompokId: string;
  kelompokName: string;
  polygon: Point[];
  centerLat: number;
  centerLng: number;
  boundingRadius: number;
  studentCount: number;
  poskoPoints: Array<{ id: string; nama: string; lat: number; lng: number; isUtama: boolean; radius: number }>;
  updatedAt: Date;
}

export class SmartZoneService {
  async getActiveStudentLocations(kelompokId: string, minutesBack = ACTIVE_STUDENT_WINDOW_MIN): Promise<Point[]> {
    const since = new Date(Date.now() - minutesBack * 60 * 1000);
    const students = await prisma.studentKkn.findMany({
      where: { kelompokId },
      select: { userId: true },
    });
    const studentIds = students.map((s) => s.userId);
    if (studentIds.length === 0) return [];
    const locations: Point[] = [];
    for (const sid of studentIds) {
      const loc = await prisma.studentLocation.findFirst({
        where: { studentId: sid, recordedAt: { gte: since } },
        orderBy: { recordedAt: "desc" },
        select: { latitude: true, longitude: true },
      });
      if (loc) locations.push({ lat: Number(loc.latitude), lng: Number(loc.longitude) });
    }
    return locations;
  }

  async getGroupPoskos(kelompokId: string): Promise<Array<{
    id: string; nama: string; lat: number; lng: number;
    isUtama: boolean; radius: number; source: "POSKO_KKN" | "POSKO_MULTI";
  }>> {
    const result: any[] = [];
    const primary = await prisma.poskoKkn.findUnique({
      where: { kelompokId },
      select: { id: true, nama: true, latitude: true, longitude: true, radius: true } as any,
    });
    if (primary) {
      result.push({ id: primary.id, nama: primary.nama, lat: Number(primary.latitude), lng: Number(primary.longitude), isUtama: true, radius: Number((primary as any).radius) || DEFAULT_POSKO_RADIUS_M, source: "POSKO_KKN" });
    }
    const multi = await (prisma as any).poskoKknMulti.findMany({
      where: { kelompokId },
      select: { id: true, nama: true, latitude: true, longitude: true, isUtama: true, radius: true },
    });
    for (const p of multi) {
      result.push({ id: p.id, nama: p.nama, lat: Number(p.latitude), lng: Number(p.longitude), isUtama: p.isUtama, radius: p.radius ?? DEFAULT_POSKO_RADIUS_M, source: "POSKO_MULTI" });
    }
    return result;
  }

  async computeGroupPolygon(kelompokId: string): Promise<GroupZoneInfo | null> {
    const kelompok = await prisma.kelompokKkn.findUnique({ where: { id: kelompokId }, select: { id: true, name: true } });
    if (!kelompok) return null;
    const poskoPoints = await this.getGroupPoskos(kelompokId);
    const studentPoints = await this.getActiveStudentLocations(kelompokId);
    const allPoints: Point[] = [...poskoPoints.map((p) => ({ lat: p.lat, lng: p.lng })), ...studentPoints];
    if (allPoints.length === 0) return null;
    const bufferMeters = await this.getBufferConfig();
    let polygon: Point[];
    let centroid: Point;
    let boundingRadius = 0;
    if (allPoints.length < MIN_STUDENTS_FOR_HULL) {
      centroid = computeCentroid(allPoints);
      const maxDist = allPoints.reduce((m, p) => Math.max(m, getDistanceInMeters(centroid, p)), 0);
      boundingRadius = maxDist + bufferMeters;
      polygon = circleToPolygon(centroid, boundingRadius);
    } else {
      const hull = convexHull(allPoints);
      centroid = computeCentroid(hull);
      polygon = inflatePolygon(hull, bufferMeters, centroid);
      boundingRadius = polygon.reduce((m, p) => Math.max(m, getDistanceInMeters(centroid, p)), 0);
    }
    return { kelompokId, kelompokName: kelompok.name, polygon, centerLat: centroid.lat, centerLng: centroid.lng, boundingRadius, studentCount: studentPoints.length, poskoPoints, updatedAt: new Date() };
  }

  async updateGroupAutoPolygon(kelompokId: string): Promise<void> {
    try {
      const info = await this.computeGroupPolygon(kelompokId);
      if (!info) return;
      const polygonData = info.polygon.map((p) => [p.lat, p.lng]);
      await (prisma as any).kelompokKkn.update({
        where: { id: kelompokId },
        data: { autoPolygon: polygonData, autoPolygonUpdatedAt: new Date(), autoPolygonStudentCount: info.studentCount },
      });
    } catch (err) {
      console.warn("[SmartZoneService] updateGroupAutoPolygon failed for " + kelompokId + ":", err);
    }
  }

  async isStudentInGroupZone(studentLat: number, studentLng: number, kelompokId: string, bufferMeters?: number): Promise<ZoneCheckResult> {
    const buffer = bufferMeters ?? (await this.getBufferConfig());
    const poskos = await this.getGroupPoskos(kelompokId);
    const studentPoint: Point = { lat: studentLat, lng: studentLng };
    const poskoDistances = poskos.map((p) => ({ ...p, distance: calculateDistance(studentLat, studentLng, p.lat, p.lng) }));
    poskoDistances.sort((a, b) => a.distance - b.distance);
    const nearest = poskoDistances[0] ?? null;

    for (const p of poskoDistances) {
      if (p.distance <= p.radius + buffer) {
        return { isInside: true, matchedPosko: p.nama, matchedPoskoId: p.id, matchedMethod: p.source === "POSKO_KKN" ? "POSKO_UTAMA" : "POSKO_MULTI", distanceToNearest: nearest?.distance ?? 0, nearestPoskoName: nearest?.nama ?? null, allPoskos: poskoDistances, autoPolygonActive: false };
      }
    }

    const kelompok = await (prisma as any).kelompokKkn.findUnique({ where: { id: kelompokId }, select: { autoPolygon: true, autoPolygonUpdatedAt: true } });
    if (kelompok?.autoPolygon && Array.isArray(kelompok.autoPolygon) && (kelompok.autoPolygon as any[]).length >= 3) {
      const polyRaw = kelompok.autoPolygon as any[];
      const polyPoints: Point[] = polyRaw.map((p: any) => ({ lat: Array.isArray(p) ? Number(p[0]) : Number(p.lat ?? p.latitude), lng: Array.isArray(p) ? Number(p[1]) : Number(p.lng ?? p.longitude) }));
      const isStale = kelompok.autoPolygonUpdatedAt && Date.now() - new Date(kelompok.autoPolygonUpdatedAt).getTime() > 15 * 60 * 1000;
      if (!isStale && isPointInPolygonWithBuffer(studentPoint, polyPoints, buffer)) {
        return { isInside: true, matchedPosko: "Zona Auto-Generate Kelompok", matchedPoskoId: null, matchedMethod: "AUTO_POLYGON", distanceToNearest: nearest?.distance ?? 0, nearestPoskoName: nearest?.nama ?? null, allPoskos: poskoDistances, autoPolygonActive: true };
      }
    }

    return { isInside: false, matchedPosko: null, matchedPoskoId: null, matchedMethod: "NONE", distanceToNearest: nearest?.distance ?? 99999, nearestPoskoName: nearest?.nama ?? null, allPoskos: poskoDistances, autoPolygonActive: kelompok?.autoPolygon != null };
  }

  async getGroupsWithActiveStudents(minutesBack = ACTIVE_STUDENT_WINDOW_MIN): Promise<string[]> {
    const since = new Date(Date.now() - minutesBack * 60 * 1000);
    const recentStudentIds = await prisma.studentLocation.findMany({ where: { recordedAt: { gte: since } }, select: { studentId: true }, distinct: ["studentId"] });
    const ids = recentStudentIds.map((r) => r.studentId);
    if (ids.length === 0) return [];
    const students = await prisma.studentKkn.findMany({ where: { userId: { in: ids }, kelompokId: { not: null } }, select: { kelompokId: true }, distinct: ["kelompokId"] });
    return students.map((s) => s.kelompokId!).filter(Boolean);
  }

  async getGroupZonePreview(kelompokId: string) {
    const [kelompok, poskos] = await Promise.all([
      (prisma as any).kelompokKkn.findUnique({ where: { id: kelompokId }, select: { id: true, autoPolygon: true, autoPolygonUpdatedAt: true, autoPolygonStudentCount: true } }),
      this.getGroupPoskos(kelompokId),
    ]);
    let autoPolygon: Point[] | null = null;
    let centerLat: number | null = null, centerLng: number | null = null;
    if (kelompok?.autoPolygon && Array.isArray(kelompok.autoPolygon)) {
      autoPolygon = (kelompok.autoPolygon as any[]).map((p: any) => ({ lat: Array.isArray(p) ? Number(p[0]) : Number(p.lat), lng: Array.isArray(p) ? Number(p[1]) : Number(p.lng) }));
      if (autoPolygon.length > 0) { const c = computeCentroid(autoPolygon); centerLat = c.lat; centerLng = c.lng; }
    }
    return { kelompokId, autoPolygon, autoPolygonUpdatedAt: kelompok?.autoPolygonUpdatedAt ?? null, autoPolygonStudentCount: kelompok?.autoPolygonStudentCount ?? 0, poskos, centerLat, centerLng };
  }

  async forceRegeneratePolygon(kelompokId: string): Promise<GroupZoneInfo | null> {
    const info = await this.computeGroupPolygon(kelompokId);
    if (!info) return null;
    await (prisma as any).kelompokKkn.update({ where: { id: kelompokId }, data: { autoPolygon: info.polygon.map((p) => [p.lat, p.lng]), autoPolygonUpdatedAt: new Date(), autoPolygonStudentCount: info.studentCount } });
    return info;
  }

  private async getBufferConfig(): Promise<number> {
    try {
      const { configService } = await import("./configService.js");
      const val = await configService.getConfig("smart_zone_polygon_buffer_meters");
      if (val) return parseInt(val, 10);
    } catch (_) {}
    return DEFAULT_AUTO_POLYGON_BUFFER_M;
  }
}

export const smartZoneService = new SmartZoneService();

