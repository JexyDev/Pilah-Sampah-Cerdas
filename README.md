# 🗑️ Pilah Sampah Cerdas (Trashcare)

> **Sistem Pengelolaan Sampah Terintegrasi Berbasis AI** — Kecamatan Coblong, Bandung

Aplikasi yang membantu warga memilah sampah dengan benar, memantau kepatuhan, dan memberikan insentif melalui gamifikasi. Dibangun sebagai monorepo dengan Backend API, Frontend Web, dan Mobile App dalam satu repositori.

---

## 📁 Struktur Monorepo

```
pilahsampah-id/
├── apps/
│   ├── api/                 # Backend — Express.js + Prisma + TypeScript
│   │   ├── prisma/          #   Database schema & migrations
│   │   └── src/
│   │       ├── controllers/ #   Request handlers
│   │       ├── services/    #   Business logic
│   │       ├── repositories/#   Data access layer
│   │       ├── routes/      #   API route definitions
│   │       ├── middlewares/  #   Auth, RBAC, rate limiting
│   │       └── utils/       #   JWT, hashing, geolocation
│   │
│   ├── web/                 # Frontend — React + Vite + Tailwind CSS
│   │   └── src/
│   │       ├── pages/       #   27 halaman fitur
│   │       ├── components/  #   Reusable UI components
│   │       ├── services/    #   API client layer
│   │       ├── store/       #   Zustand state management
│   │       └── routes/      #   React Router config
│   │
│   └── mobile/              # Mobile — Flutter (Dart)
│       └── lib/
│           ├── core/        #   Services, providers
│           ├── data/        #   Models, repositories
│           ├── domain/      #   Entities, use cases
│           └── presentation/#   Screens, widgets
│
├── docs/                    # Dokumentasi proyek
├── scripts/                 # Migration & seed scripts
├── docker-compose.yml       # PostgreSQL + Redis (local dev)
└── package.json             # Root monorepo scripts
```

---

## 🚀 Quick Start

### Prasyarat
- Node.js >= 18
- PostgreSQL 15+ & Redis 7+
- Flutter SDK (untuk mobile)

### 1. Clone & Install
```bash
git clone https://github.com/JexyDev/Pilah-Sampah-Cerdas.git
cd Pilah-Sampah-Cerdas

# Install semua dependencies
npm run install:all
```

### 2. Setup Database (Docker)
```bash
docker-compose up -d
cd apps/api
cp .env.example .env    # Edit sesuai kebutuhan
npx prisma migrate dev
npx prisma db seed
```

### 3. Jalankan Aplikasi
```bash
# Dari root folder:
npm run dev:api          # Backend  → http://localhost:3000
npm run dev:web          # Frontend → http://localhost:5173

# Atau jalankan bersamaan (Linux/Mac):
npm run dev:api & npm run dev:web
```

### 4. Mobile (Flutter)
```bash
cd apps/mobile
flutter pub get
flutter run
```

---

## 🛠 Tech Stack

| Layer | Teknologi |
|---|---|
| **Backend** | Express.js, TypeScript, Prisma ORM, PostgreSQL, Redis |
| **Frontend** | React 19, Vite, Tailwind CSS 4, Zustand, Recharts, Leaflet |
| **Mobile** | Flutter, Dart |
| **AI** | Gemini API (klasifikasi sampah) |
| **Infra** | PM2, Nginx, GitHub Actions CI/CD |

---

## 📋 Branching Strategy

Lihat [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) untuk SOP lengkap.

**Ringkasan:** Satu branch `main`, fitur dikerjakan di `feature/*`, merge via Pull Request.

---

## 👥 Tim Pengembang

- **Jeremy Darrell** — Backend & Frontend Web
- **Muhammad Habil Putrawan** — Mobile App (Flutter)

---

## 📄 Lisensi

UNLICENSED — Hak cipta dilindungi.
