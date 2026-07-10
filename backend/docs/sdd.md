# SDD — Software Design Document
## pilahsampah.id | Backend API Service
**Versi:** 1.0.0 | **Author:** Jeremy Darrell | **Tanggal:** 8 Juli 2026

---

## 1. Arsitektur Sistem

```
[Flutter Mobile App]           [React Dashboard Web]
       |                               |
       | HTTPS (Bearer Token)          | HTTPS (httpOnly Cookie)
       |                               |
       +---------------+---------------+
                       |
              [Ngrok HTTPS Tunnel]
                       |
              [Express.js Server - Port 3000]
                       |
          +------------+-------------+
          |            |             |
     [REST API]  [WebSocket /ws]  [Static Health]
          |
          +--------+--------+--------+
          |        |        |        |
      [Redis]  [Prisma]  [Queue]  [Auth Middleware]
                  |
           [PostgreSQL DB]
```

---

## 2. Struktur Folder Backend

```
backend/
├── src/
│   ├── index.ts                    # Entry point, server init
│   ├── app.ts                      # Express app setup, middleware mounting
│   ├── websocket.ts                # WebSocket server setup & event handlers
│   │
│   ├── config/
│   │   ├── env.ts                  # Typed env variables (zod validation)
│   │   ├── database.ts             # Prisma client singleton
│   │   └── redis.ts                # Redis client singleton + fallback
│   │
│   ├── middleware/
│   │   ├── authenticate.ts         # JWT verification (cookie OR Bearer)
│   │   ├── authorize.ts            # Role-based access control
│   │   ├── validate.ts             # Zod schema validation middleware
│   │   ├── rateLimiter.ts          # express-rate-limit config
│   │   └── errorHandler.ts         # Global error handler
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── household.routes.ts
│   │   ├── bin.routes.ts
│   │   ├── waste.routes.ts
│   │   ├── notification.routes.ts
│   │   ├── leaderboard.routes.ts
│   │   └── analytics.routes.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── household.controller.ts
│   │   ├── bin.controller.ts
│   │   ├── waste.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── leaderboard.controller.ts
│   │   └── analytics.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts         # bcrypt, JWT sign/verify
│   │   ├── bin.service.ts          # Kapasitas logic, konversi volume→kg
│   │   ├── waste.service.ts        # AI mock, queue, quota, hash check
│   │   ├── point.service.ts        # Kalkulasi poin harian
│   │   ├── notification.service.ts # Create & broadcast notifikasi
│   │   └── redis.service.ts        # Queue FIFO, quota management
│   │
│   └── utils/
│       ├── asyncHandler.ts         # Wrapper async controller (no try-catch)
│       ├── ApiResponse.ts          # Standard response builder
│       ├── ApiError.ts             # Custom error class
│       └── hash.ts                 # SHA-256 image hashing
│
├── prisma/
│   └── schema.prisma               # Database schema (9 model)
│
├── docs/                           # ← DOKUMEN INI ADA DI SINI
│   ├── prd.md
│   ├── srs.md
│   ├── sdd.md
│   ├── ui_ux_flow.md
│   └── task_breakdown.md
│
├── .env
├── package.json
└── tsconfig.json
```

---

## 3. Design Pattern

### 3.1 Controller-Service-Repository Pattern
```
Route → Controller → Service → Prisma (ORM) → Database
```
- **Controller**: Hanya memproses request/response, tidak ada business logic
- **Service**: Semua business logic, kalkulasi, dan interaksi Redis di sini
- **Prisma**: Query database, tidak ada raw SQL

### 3.2 Authentication Flow

#### Web Client (React Dashboard):
```
1. POST /api/v1/auth/login { email, password, clientType: "web" }
2. Server verifikasi bcrypt hash
3. Server sign JWT { userId, role, rtRwId }
4. Server set: Set-Cookie: jwt=<token>; HttpOnly; SameSite=Strict; Path=/; MaxAge=86400
5. Client menyimpan TIDAK ADA — cookie otomatis dikelola browser
6. Setiap request browser mengirim cookie otomatis
7. Middleware authenticate: req.cookies.jwt → verify JWT
```

#### Mobile Client (Flutter):
```
1. POST /api/v1/auth/login { email, password, clientType: "mobile" }
2. Server verifikasi bcrypt hash
3. Server sign JWT { userId, role, rtRwId }
4. Server respond: { "data": { "accessToken": "...", "user": {...} } }
5. Flutter menyimpan ke flutter_secure_storage: key="access_token"
6. Setiap request Flutter: headers: { "Authorization": "Bearer <token>" }
7. Middleware authenticate: req.headers.authorization → verify JWT
```

#### Middleware authenticate.ts (Unified):
```typescript
const token = req.cookies?.jwt || req.headers.authorization?.split(' ')[1];
if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Token tidak ditemukan');
const payload = jwt.verify(token, env.JWT_SECRET);
req.user = payload;
```

### 3.3 WebSocket Architecture
```typescript
// websocket.ts
const wss = new WebSocketServer({ server });
const clients = new Map<string, Set<WebSocket>>(); // rtRwId → Set<ws>

wss.on('connection', (ws, req) => {
  const token = new URL(req.url).searchParams.get('token');
  const user = verifyToken(token);
  // Simpan ws ke map berdasarkan rtRwId
  clients.get(user.rtRwId)?.add(ws);
});

// Broadcast ke RT spesifik
export function broadcastToRT(rtRwId: string, event: string, data: any) {
  clients.get(rtRwId)?.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, data }));
    }
  });
}
```

### 3.4 Redis Queue & Quota Pattern
```typescript
// Key: quota:{userId}:{YYYY-MM-DD} → TTL 86400s (1 hari)
// Key: image_hash:{sha256}:{YYYY-MM-DD} → TTL 86400s
// Queue: JS in-memory array (max 100) dengan async FIFO processing
```

### 3.5 Database Transaction (Pessimistic Locking)
```typescript
// bin.service.ts — POST /api/v1/bins/scan
const result = await prisma.$transaction(async (tx) => {
  const bin = await tx.bin.findUniqueOrThrow({
    where: { qrCode },
    // PostgreSQL level row lock
  });
  if (bin.currentVolumeLiter + estimatedVolume > 25.0) {
    throw new ApiError(400, 'BIN_OVERFLOW', 'Kapasitas tong terlampaui');
  }
  // Update dalam transaksi yang sama → atomic
  return await tx.bin.update({ where: { id: bin.id }, data: { currentVolumeLiter: bin.currentVolumeLiter + estimatedVolume } });
});
```

---

## 4. Database Schema (Prisma)

```prisma
// 9 Model Relasional

model Role {
  id    Int    @id @default(autoincrement())
  name  String @unique  // ADMIN | PETUGAS_KELURAHAN | PETUGAS_RW | PETUGAS_RT | WARGA
  users User[]
  @@map("roles")
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  password      String         // bcrypt hash
  name          String
  roleId        Int
  role          Role           @relation(...)
  // ... relations
  @@map("users")
}

model RtRwArea {
  id         Int         @id @default(autoincrement())
  name       String      @unique  // "RT 01 / RW 05"
  kelurahan  String      // "Dago" | "Coblong" | etc
  households Household[]
  bins       Bin[]
  @@map("rt_rw_areas")
}

model Household {
  id        String     @id @default(uuid())
  userId    String
  rtRwId    Int
  address   String
  latitude  Decimal    @db.Decimal(11, 8)   // GPS koordinat presisi tinggi
  longitude Decimal    @db.Decimal(11, 8)
  // ... relations
  @@map("households")
}

model Bin {
  id                 String  @id @default(uuid())
  qrCode             String  @unique
  type               BinType // ORGANIC | NON_ORGANIC
  maxCapacityLiter   Decimal @default(25.0)  // TETAP 25L
  currentVolumeLiter Decimal @default(0.0)
  rtRwId             Int
  // ... relations
  @@map("bins")
}

model WasteLog {
  id          String   @id @default(uuid())
  householdId String
  binId       String
  weightKg    Decimal  // hasil konversi volume × density
  volumeLiter Decimal
  type        BinType
  requestId   String   @db.Uuid
  createdAt   DateTime @default(now())
  @@map("waste_logs")
}

model AiRequestLog {
  id           String   @id @default(uuid())
  userId       String
  requestId    String   @unique @db.Uuid
  imageHash    String?  // SHA-256 untuk deteksi duplikasi
  resultStatus String   // SUCCESS | TIMEOUT | IMAGE_UNREADABLE | DUPLICATE_IMAGE
  durationMs   Int?
  createdAt    DateTime @default(now())
  @@map("ai_request_logs")
}

model PointHistory {
  id          String   @id @default(uuid())
  userId      String
  points      Int
  description String
  createdAt   DateTime @default(now())
  @@map("point_history")
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  title     String
  message   String
  isRead    Boolean  @default(false)
  type      String   // BIN_FULL | AI_FAILURE | SYSTEM
  createdAt DateTime @default(now())
  @@map("notifications")
}
```

---

## 5. Environment Variables (.env)

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pilahsampah_db?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="<256-bit-random-string-generate-via-openssl-rand-base64-32>"
JWT_EXPIRES_IN="24h"
COOKIE_SECRET="<random-string-untuk-cookie-signing>"

# Server
PORT=3000
NODE_ENV=development

# CORS — Origins yang diizinkan
CORS_ORIGIN_WEB="http://localhost:5173"
CORS_ORIGIN_NGROK="https://<ngrok-id>.ngrok-free.app"
```
