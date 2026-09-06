import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('./scripts/coblong_osm_real.json', 'utf-8'));

function simplifyCoordinates(geojson, maxPoints = 12) {
  let coords = [];
  if (geojson.type === 'Polygon') {
    coords = geojson.coordinates[0];
  } else if (geojson.type === 'MultiPolygon') {
    coords = geojson.coordinates[0][0];
  } else if (geojson.type === 'Point') {
    return [[geojson.coordinates[1], geojson.coordinates[0]]];
  }

  // Convert from [lng, lat] to Leaflet [lat, lng]
  const leafletCoords = coords.map(c => [c[1], c[0]]);

  // Downsample to maxPoints for clean performance & UI rendering
  if (leafletCoords.length <= maxPoints) return leafletCoords;
  const step = Math.ceil(leafletCoords.length / maxPoints);
  const sampled = [];
  for (let i = 0; i < leafletCoords.length; i += step) {
    sampled.push([Number(leafletCoords[i][0].toFixed(5)), Number(leafletCoords[i][1].toFixed(5))]);
  }
  return sampled;
}

const kelurahanColors = {
  "Dago": "#10b981",
  "Sadang Serang": "#3b82f6",
  "Sekeloa": "#8b5cf6",
  "Lebak Gede": "#f59e0b",
  "Lebak Siliwangi": "#ec4899",
  "Cipaganti": "#14b8a6"
};

const processed = {};

for (const [name, info] of Object.entries(raw)) {
  const bounds = simplifyCoordinates(info.geojson, 10);
  processed[name] = {
    centroid: [info.lat, info.lon],
    bounds: bounds,
    display_name: info.display_name
  };
  console.log(`Kelurahan ${name}: Centroid [${info.lat}, ${info.lon}], Polygon points: ${bounds.length}`);
}

fs.writeFileSync('./scripts/coblong_processed.json', JSON.stringify(processed, null, 2));
