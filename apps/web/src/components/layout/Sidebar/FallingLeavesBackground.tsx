import React, { useMemo } from "react";

interface LeafConfig {
  id: number;
  left: number; // percentage 0 - 100
  duration: number; // seconds
  delay: number; // seconds
  size: number; // px
  sway: number; // px
  opacity: number;
  color: string;
  type: 0 | 1 | 2; // leaf SVG type
}

const LEAF_COLORS = [
  "#549e26", // Fresh Green
  "#055c46", // Deep Forest Green
  "#10b981", // Vibrant Emerald
  "#86efac", // Light Mint/Lime
  "#2563eb", // Blue Accent (Logo leaf color)
];

const LeafSVG: React.FC<{ type: number; color: string; size: number }> = ({
  type,
  color,
  size,
}) => {
  if (type === 0) {
    // Classic Organic Leaf
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21 3C21 3 14 3 9 8C4 13 4 19 4 19C4 19 10 19 15 14C20 9 21 3 21 3Z"
          fill={color}
        />
        <path
          d="M4 19L11 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-white/40"
        />
      </svg>
    );
  } else if (type === 1) {
    // Curved Eco Sprout Leaf
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM15.5 14.5C13 17 8.5 16 7 14.5C6.5 14 6 12 8 9C10 6 14.5 6 16.5 7.5C18.5 9 18 12 15.5 14.5Z"
          fill={color}
        />
      </svg>
    );
  } else {
    // Elegant Slender Leaf
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17 2C17 2 10.5 4.5 7 9.5C3.5 14.5 5 21 5 21C5 21 11.5 19.5 15 14.5C18.5 9.5 17 2 17 2Z"
          fill={color}
        />
        <path
          d="M5 21C7.5 16 11 11.5 17 2"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="text-white/30"
        />
      </svg>
    );
  }
};

export const FallingLeavesBackground: React.FC = () => {
  // Generate deterministic randomized leaf positions so re-renders don't cause jumps
  const leaves: LeafConfig[] = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const leftPositions = [4, 14, 25, 36, 47, 58, 69, 78, 88, 93, 20, 62];
      const durations = [9.5, 12, 8, 14, 10, 13, 9, 11.5, 15, 10.5, 12.5, 8.5];
      const delays = [0, 2.2, 4.5, 1.2, 6, 3.5, 7.2, 0.8, 5, 8, 3, 6.5];
      const sizes = [14, 18, 12, 22, 16, 20, 13, 19, 15, 21, 14, 17];
      const sways = [25, -30, 20, -25, 35, -20, 28, -35, 18, -22, 30, -18];
      const opacities = [0.24, 0.18, 0.28, 0.20, 0.26, 0.15, 0.22, 0.30, 0.19, 0.25, 0.21, 0.23];
      const colorIndex = i % LEAF_COLORS.length;
      const type = (i % 3) as 0 | 1 | 2;

      return {
        id: i,
        left: leftPositions[i],
        duration: durations[i],
        delay: delays[i],
        size: sizes[i],
        sway: sways[i],
        opacity: opacities[i],
        color: LEAF_COLORS[colorIndex],
        type,
      };
    });
  }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute animate-falling-leaf"
          style={
            {
              left: `${leaf.left}%`,
              top: `-30px`,
              "--fall-duration": `${leaf.duration}s`,
              "--fall-delay": `${leaf.delay}s`,
              "--leaf-sway": `${leaf.sway}px`,
            } as React.CSSProperties
          }
        >
          <div 
            className="transform transition-transform duration-500 hover:scale-125"
            style={{ opacity: leaf.opacity }}
          >
            <LeafSVG type={leaf.type} color={leaf.color} size={leaf.size} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FallingLeavesBackground;
