# BACKEND CHANGE SPECIFICATION: MEDIA STORAGE PERSISTENCE, DEFAULT ASSETS & MOBILE IMAGE FALLBACK PROTOCOL

- Target Service: `apps/api` (Backend Express.js, Multer Storage, Static Asset Delivery)
- Originating Team: BERSEKA Mobile Engineering Team
- Target Path: `docs/BACKEND_CHANGE_ORDER_MEDIA_STORAGE_AND_IMAGE_FALLBACK.md`
- Status: CHANGE ORDER & RFC
- Priority: HIGH / UI INTEGRITY ISSUE

---

## 1. Executive Summary & Problem Background

### 1.1 Field Incident
On the mobile screen `ProkerDetailView` (under *Riwayat Entri Pemanfaatan*), image attachments fail to render. Instead of displaying the photographed documentation, the user interface renders the broken image fallback widget (`Icons.broken_image_rounded`).

### 1.2 Root Cause Analysis

#### A. Static Asset Fallback Format Mismatch (`apps/api/src/index.ts`)
- In `apps/api/src/index.ts:365-530`, when a requested upload file cannot be found on the server filesystem, backend dynamically generates an official SVG archive card (`generateOfficialArchiveSvg`) and responds with:
  ```http
  Content-Type: image/svg+xml
  ```
- **Mobile Limitation:** Flutter's standard `Image.network` and `CachedNetworkImage` raster engines strictly decode bitmap streams (`image/jpeg`, `image/png`, `image/webp`). When an endpoint returns XML SVG data for a URL ending in `.jpg`/`.png`, the Flutter bitmap decoder throws an unhandled decode exception, causing the widget's `errorBuilder` to render a broken image icon.

#### B. Ephemeral File Storage During CI/CD Deployments
- Uploaded files are written to local disk directories (`apps/api/uploads/` or `uploads/`).
- If CI/CD pipelines, container rebuilds, or VPS process restarts run without a persistent volume mount mapped to `/uploads`, physical files uploaded by students are wiped, while the PostgreSQL database retains the stale URI strings.

#### C. Missing Default Placeholder Asset (`/uploads/default-pemanfaatan.jpg`)
- In `apps/api/src/services/kknService.ts:3715` and `5724`:
  ```ts
  fotoDokumentasiUrl: fotoDokumentasiUrl || "/uploads/default-pemanfaatan.jpg"
  ```
- The database references `/uploads/default-pemanfaatan.jpg` as the fallback placeholder, but this asset does not exist on the server's upload storage.

---

## 2. Technical Specifications & Required Changes

### 2.1 Raster Fallback Delivery for Mobile User Agents (`apps/api/src/index.ts`)
File: `apps/api/src/index.ts`

When a file request under `/uploads/*` is missing on disk, inspect the `User-Agent` or request `Accept` header:
1. If the client is mobile or explicitly expects raster imagery, **do NOT send SVG**.
2. Stream a verified lightweight PNG/JPEG placeholder (e.g., standard BERSEKA document placeholder) or redirect to a CDN raster fallback.
3. Only serve the inline SVG card if `Accept: image/svg+xml` is explicitly requested by a desktop web browser.

```ts
// apps/api/src/index.ts: Upload missing fallback handler
if (/\.(jpg|jpeg|png|webp)$/i.test(requestedPath)) {
  const isMobileClient = req.headers["user-agent"]?.includes("Dart") ||
                         req.headers["user-agent"]?.includes("BERSEKA_MOBILE") ||
                         !req.headers["accept"]?.includes("image/svg+xml");

  if (isMobileClient) {
    const defaultPlaceholderPath = path.resolve(process.cwd(), "public/images/default-placeholder.png");
    if (fs.existsSync(defaultPlaceholderPath)) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.sendFile(defaultPlaceholderPath);
    }
    // Fallback: 1x1 transparent PNG pixel to avoid decode crashes
    const transparentPixel = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
    res.setHeader("Content-Type", "image/png");
    return res.status(200).send(transparentPixel);
  }

  // Web Browser: Proceed with generateOfficialArchiveSvg
  const archiveSvg = generateOfficialArchiveSvg(archiveData);
  res.setHeader("Content-Type", "image/svg+xml");
  return res.status(200).send(archiveSvg);
}
```

---

### 2.2 Seed Missing Default Assets in Server Storage
Ensure the following files physically exist under `uploads/` across staging and production VPS instances:
- `/uploads/default-pemanfaatan.jpg`
- `/uploads/default-avatar.png`
- `/uploads/default-bin-placeholder.png`

Add an automated startup verification in Express initialization (`apps/api/src/index.ts`):
```ts
function ensureDefaultUploadAssets() {
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const defaultAsset = path.resolve(uploadsDir, "default-pemanfaatan.jpg");
  if (!fs.existsSync(defaultAsset)) {
    // Copy bundled fallback asset from repository to uploads folder
    const bundledAsset = path.resolve(process.cwd(), "apps/api/src/assets/default-pemanfaatan.jpg");
    if (fs.existsSync(bundledAsset)) {
      fs.copyFileSync(bundledAsset, defaultAsset);
    }
  }
}
```

---

### 2.3 VPS Storage Persistence & CI/CD Protection
For staging and production VPS configurations:
1. Ensure the directory `/var/www/berseka/uploads` or the container volume `/app/apps/api/uploads` is mapped to **persistent storage** that survives:
   - GitHub Actions automated runner deployments.
   - Docker container teardown (`docker compose down && docker compose up -d`).
   - PM2 service restarts.
2. Verify Nginx / Caddy reverse proxy configuration to properly cache static files under `/uploads/` without truncating byte streams.

---

## 3. Verification & Acceptance Criteria

| ID | Test Scenario | Expected Outcome |
|---|---|---|
| **IMG-01** | Request non-existent upload via Mobile Header (`Accept: image/*`) | Server returns HTTP 200 with `Content-Type: image/png` or `image/jpeg` (NOT `image/svg+xml`). |
| **IMG-02** | Fetch `/uploads/default-pemanfaatan.jpg` | Returns HTTP 200 with valid JPEG headers and valid image body. |
| **IMG-03** | Submit Pemanfaatan logbook with photo | Uploaded file persists across server restart and renders in mobile client without `Icons.broken_image_rounded`. |
| **IMG-04** | Web Browser direct navigation to missing upload | Returns official SVG archive document card without regressions for web users. |
