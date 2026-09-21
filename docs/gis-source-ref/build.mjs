import { build } from "esbuild";
import fs from "node:fs";

const out = await build({
  entryPoints: ["src/main.jsx"],
  bundle: true, minify: true, format: "iife", write: false, outdir: "dist",
  jsx: "transform", loader: { ".js": "jsx", ".png": "dataurl" },
  define: { "process.env.NODE_ENV": '"production"' },
  target: ["es2019"], legalComments: "none",
});
let js = "", css = "";
for (const f of out.outputFiles) {
  if (f.path.endsWith(".js")) js = f.text;
  if (f.path.endsWith(".css")) css = f.text;
}
const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GIS Eksekutif Tata Kelola Sampah — Kecamatan Coblong</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script>${js.replace(/<\/script/gi, "<\\/script")}</script>
</body>
</html>`;
fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("dist/index.html", html);
console.log("OK", (html.length / 1024).toFixed(0) + " KB");
