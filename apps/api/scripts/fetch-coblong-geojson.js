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
    console.log(`Fetching ${item.name}...`);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        results[item.name] = {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          display_name: data[0].display_name,
          boundingbox: data[0].boundingbox,
          geojson: data[0].geojson
        };
      } else {
        console.log(`No data found for ${item.name}`);
      }
    } catch (err) {
      console.error(`Error ${item.name}:`, err);
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  fs.writeFileSync('./scripts/coblong_osm_real.json', JSON.stringify(results, null, 2));
  console.log("SUCCESS_FETCH_COBLONG_REAL_GIS");
}

main();
