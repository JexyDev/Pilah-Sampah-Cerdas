import fs from 'fs';

const kelurahans = [
  { name: "Dago", q: "Kelurahan Dago, Coblong, Kota Bandung" },
  { name: "Sadang Serang", q: "Kelurahan Sadang Serang, Coblong, Kota Bandung" },
  { name: "Sekeloa", q: "Kelurahan Sekeloa, Coblong, Kota Bandung" },
  { name: "Lebak Gede", q: "Kelurahan Lebak Gede, Coblong, Kota Bandung" },
  { name: "Lebak Siliwangi", q: "Kelurahan Lebak Siliwangi, Coblong, Kota Bandung" },
  { name: "Cipaganti", q: "Kelurahan Cipaganti, Coblong, Kota Bandung" }
];

async function main() {
  const results = {};
  for (const item of kelurahans) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(item.q)}&polygon_geojson=1&format=json`;
    console.log(`Fetching full precision GIS for ${item.name}...`);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        let rawCoords = [];
        const geo = data[0].geojson;
        if (geo.type === 'Polygon') {
          rawCoords = geo.coordinates[0];
        } else if (geo.type === 'MultiPolygon') {
          // Find largest polygon ring
          let maxLen = 0;
          for (const poly of geo.coordinates) {
            if (poly[0].length > maxLen) {
              maxLen = poly[0].length;
              rawCoords = poly[0];
            }
          }
        }
        
        // Convert [lng, lat] to Leaflet [lat, lng] with full precision (no downsampling!)
        const leafletCoords = rawCoords.map(c => [Number(c[1].toFixed(6)), Number(c[0].toFixed(6))]);
        
        results[item.name] = {
          centroid: [parseFloat(data[0].lat), parseFloat(data[0].lon)],
          bounds: leafletCoords,
          pointCount: leafletCoords.length,
          display_name: data[0].display_name
        };
        console.log(`✅ ${item.name}: ${leafletCoords.length} precise boundary points fetched.`);
      } else {
        console.log(`❌ No data found for ${item.name}`);
      }
    } catch (err) {
      console.error(`Error fetching ${item.name}:`, err);
    }
    await new Promise(r => setTimeout(r, 1200));
  }
  fs.writeFileSync('./scripts/coblong_lapak_gis_full.json', JSON.stringify(results, null, 2));
  console.log("SUCCESS_FULL_PRECISION_GIS_FETCH");
}

main();
