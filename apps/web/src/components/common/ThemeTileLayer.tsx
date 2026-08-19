/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * ThemeTileLayer: Leaflet TileLayer that dynamically switches between
 * standard OpenStreetMap/CartoDB Voyager (light) and CartoDB Dark Matter (dark)
 */

import React from "react";
import { TileLayer, type TileLayerProps } from "react-leaflet";
import { useThemeStore } from "../../store/useThemeStore";

interface ThemeTileLayerProps extends Omit<TileLayerProps, "url"> {
  lightUrl?: string;
  darkUrl?: string;
  url?: string;
}

export const CARTO_DARK_MATTER_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
export const OSM_LIGHT_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const ThemeTileLayer: React.FC<ThemeTileLayerProps> = ({
  lightUrl = OSM_LIGHT_URL,
  darkUrl = CARTO_DARK_MATTER_URL,
  url,
  attribution,
  ...props
}) => {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === "dark";

  const activeUrl = isDark ? darkUrl : (url || lightUrl);
  const activeAttribution = attribution || (
    isDark
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  );

  return (
    <TileLayer
      key={isDark ? "dark-tile" : "light-tile"}
      url={activeUrl}
      attribution={activeAttribution}
      maxZoom={20}
      maxNativeZoom={19}
      {...props}
    />
  );
};

export default ThemeTileLayer;
