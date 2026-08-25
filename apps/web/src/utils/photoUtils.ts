/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Centralized Profile Photo & Default Avatar Utility
 */

import { getApiBaseUrl } from "./api";

export const DEFAULT_AVATAR_FALLBACKS: string[] = [];

/**
 * Returns a SVG Data URI for initial avatar fallback when image fails to load completely
 */
export function getInitialsSvgDataUri(name: string = "User"): string {
  const cleanName = name
    .replace(/\b(Assoc\.|Prof\.|Dr\.|Dra\.|Drs\.|S\.Kom\.|M\.Kom\.|M\.Eng\.|S\.E\.|M\.Si\.|S\.T\.|M\.T\.|S\.Ds\.|M\.Ds\.|S\.H\.|M\.H\.|S\.Si\.|S\.Pd\.|M\.Pd\.|S\.IP\.|M\.I\.Pol\.|M\.I\.Kom\.|S\.Sos\.|S\.STP\.|M\.AP\.|A\.KS\.|Ph\.D\.|CIMA|CDMP|CSBA)\b/gi, "")
    .trim() || "User";
  const parts = cleanName.split(/\s+/).filter(Boolean);
  const initials = parts.length === 1
    ? parts[0][0].toUpperCase()
    : parts.slice(0, 3).map((part) => part[0].toUpperCase()).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="64" fill="#009966"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="48" font-weight="800" fill="#ffffff">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Returns full image URL for profile photo path
 */
export function getProfilePhotoUrl(path?: string, userName: string = "User"): string {
  if (!path || path.trim() === "") {
    return getInitialsSvgDataUri(userName);
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("data:image/")) {
    return path;
  }

  const baseUrl = getApiBaseUrl();
  const host = baseUrl.replace(/\/api\/v1\/?$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${host}${cleanPath}`;
}

/**
 * Event handler for img onError to prevent infinite loops and show fallback initials SVG
 */
export function handleAvatarError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  userName: string = "User"
) {
  const target = event.currentTarget;
  const fallbackSvg = getInitialsSvgDataUri(userName);
  if (target.src !== fallbackSvg) {
    target.src = fallbackSvg;
  }
}
