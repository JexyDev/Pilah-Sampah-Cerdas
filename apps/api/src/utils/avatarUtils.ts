/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Avatar Utility for General Scenery & Landscape Default Profile Pictures (No People Photos)
 */

// 100 General Scenery / Landscape / Nature photo URLs
export const SCENERY_DEFAULT_AVATARS: string[] = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1511497584788-876761465586?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1439853949127-fa647821eba0?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=256&h=256&q=80",
  ...Array.from({ length: 80 }, (_, i) => {
    const ids = [
      "photo-1506744038136-46273834b3fb",
      "photo-1511497584788-876761465586",
      "photo-1470071459604-3b5ec3a7fe05",
      "photo-1441974231531-c6227db76b6e",
      "photo-1472214103451-9374bd1c798e",
      "photo-1426604966848-d7adac402bff",
      "photo-1501785888041-af3ef285b470",
      "photo-1469474968028-56623f02e42e",
      "photo-1447752875215-b2761acb3c5d",
      "photo-1433086966358-54859d0ed716",
    ];
    const pid = ids[i % ids.length];
    return `https://images.unsplash.com/${pid}?auto=format&fit=crop&w=256&h=256&q=80&sig=${i + 21}`;
  }),
];

/**
 * Returns a random or deterministic scenery profile picture URL
 */
export function getRandomDefaultAvatar(seedName?: string): string {
  if (seedName && seedName.trim().length > 0) {
    let hash = 0;
    const nameStr = seedName.trim();
    for (let i = 0; i < nameStr.length; i++) {
      hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % SCENERY_DEFAULT_AVATARS.length;
    return SCENERY_DEFAULT_AVATARS[index];
  }

  const randomIndex = Math.floor(Math.random() * SCENERY_DEFAULT_AVATARS.length);
  return SCENERY_DEFAULT_AVATARS[randomIndex];
}
