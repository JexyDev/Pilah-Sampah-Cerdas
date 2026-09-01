/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Centralized Profile Photo & Default Avatar Utility
 */

import { resolveImageUrl } from "./imageUrl";

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
  if (!path || path.trim() === "" || path === "null" || path === "undefined") {
    return getInitialsSvgDataUri(userName);
  }

  const resolved = resolveImageUrl(path);
  return resolved || getInitialsSvgDataUri(userName);
}

/**
 * Returns full image URL for media / evidence / activity / documentation photo
 */
export function getMediaPhotoUrl(path?: string | null): string {
  if (!path || path.trim() === "" || path === "null" || path === "undefined") {
    return "";
  }

  return resolveImageUrl(path);
}

/**
 * Formats a Google Drive URL from various input formats (full URL, folder ID, file ID)
 */
export function formatGoogleDriveUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("drive.google.com") || trimmed.startsWith("docs.google.com")) {
    return `https://${trimmed}`;
  }
  // Drive folder/file ID (e.g. 1jci_wfqpkerlrwfmkeutnsdu2bwa91zf)
  if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
    return `https://drive.google.com/drive/folders/${trimmed}`;
  }
  return `https://${trimmed}`;
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
