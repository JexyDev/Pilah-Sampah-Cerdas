/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Centralized Profile Photo & Default Avatar Utility
 */

export const DEFAULT_AVATAR_FALLBACKS = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1511497584788-876761465586?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=256&h=256&q=80",
];

/**
 * Returns a SVG Data URI for initial avatar fallback when image fails to load completely
 */
export function getInitialsSvgDataUri(name: string = "User"): string {
  const cleanName = name.trim() || "User";
  const initials = cleanName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="64" fill="#1D3B2F"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="48" font-weight="800" fill="#ffffff">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Returns full image URL for profile photo path
 */
export function getProfilePhotoUrl(path?: string, userName: string = "User"): string {
  if (!path || path.trim() === "") {
    // Generate deterministic UI-Avatar or scenery fallback
    const encodedName = encodeURIComponent(userName || "User");
    return `https://ui-avatars.com/api/?name=${encodedName}&background=1D3B2F&color=fff&bold=true&size=256`;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("data:image/")) {
    return path;
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
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
