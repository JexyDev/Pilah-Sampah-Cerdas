# SDD — Software Design Document
## pilahsampah.id | Frontend Web Dashboard
**Versi:** 1.0.0 | **Author:** Jeremy Darrell | **Tanggal:** 8 Juli 2026

---

## 1. Tech Stack Frontend

| Kategori | Library | Versi | Alasan |
|----------|---------|-------|--------|
| Framework | React.js + TypeScript | 18.x | Component-based, TypeScript untuk type safety |
| Build Tool | Vite | 5.x | HMR cepat, setup minimal |
| Styling | Tailwind CSS | 3.x | Utility-first, design konsisten |
| Icons | Lucide React | latest | Clean SVG icons, tree-shakeable |
| HTTP Client | Axios | 1.x | withCredentials support, interceptor |
| Global State | Zustand | 4.x | Lightweight, no boilerplate |
| Server State | TanStack Query v5 | 5.x | Cache, loading, error, refetch otomatis |
| Charts | Recharts | 2.x | React-native chart library |
| Maps | React-Leaflet | 4.x | OpenStreetMap, polygon support |
| Routing | React Router DOM | 6.x | Declarative routing |
| Auth Cookie | Browser native | — | httpOnly cookie otomatis dikelola browser |

---

## 2. Struktur Folder Frontend

```
frontend/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Router setup, QueryClientProvider
│   │
│   ├── lib/
│   │   ├── axios.ts                # Axios instance + interceptor (withCredentials: true)
│   │   ├── queryClient.ts          # TanStack Query client config
│   │   └── websocket.ts            # WebSocket singleton + reconnect logic
│   │
│   ├── stores/
│   │   ├── useAuthStore.ts         # user info, isAuthenticated (dari /auth/me)
│   │   ├── useNotifStore.ts        # notifikasi list, unread count
│   │   └── useMapStore.ts          # selected RT, filter peta
│   │
│   ├── hooks/
│   │   ├── useAuth.ts              # login, logout, me query
│   │   ├── useWebSocket.ts         # connect WS, handle events
│   │   ├── useHouseholds.ts        # TanStack Query hooks untuk household data
│   │   ├── useAnalytics.ts         # Summary, trends, AI evaluation
│   │   ├── useLeaderboard.ts       # RT + household ranking
│   │   └── useNotifications.ts     # Notif list + mark read
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── MapPage.tsx
│   │   ├── MapRtDetailPage.tsx     # Sub-halaman RT detail
│   │   ├── HouseholdsPage.tsx
│   │   ├── LeaderboardPage.tsx
│   │   └── AiEvaluationPage.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx        # Sidebar + Topbar wrapper
│   │   │   ├── Sidebar.tsx
│   │   │   └── Topbar.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── KpiCard.tsx
│   │   │   ├── TrendLineChart.tsx
│   │   │   ├── CapacityDonutChart.tsx
│   │   │   ├── MapPreviewCard.tsx
│   │   │   ├── AlertPanel.tsx
│   │   │   └── EvaluationPanel.tsx
│   │   │
│   │   ├── map/
│   │   │   ├── WasteMap.tsx        # Leaflet map wrapper
│   │   │   ├── RtPolygon.tsx       # Per-RT polygon komponen
│   │   │   ├── HouseholdMarker.tsx # Titik koordinat rumah
│   │   │   └── MapFilterPanel.tsx
│   │   │
│   │   ├── households/
│   │   │   ├── HouseholdTable.tsx
│   │   │   ├── CapacityProgressBar.tsx
│   │   │   ├── AiStatusBadge.tsx
│   │   │   └── ResetVolumeModal.tsx
│   │   │
│   │   ├── leaderboard/
│   │   │   ├── PodiumDisplay.tsx
│   │   │   ├── RtRankList.tsx
│   │   │   └── TopFamiliesList.tsx
│   │   │
│   │   └── shared/
│   │       ├── EmptyState.tsx      # Reusable empty state + CTA
│   │       ├── SkeletonLoader.tsx
│   │       ├── ErrorCard.tsx
│   │       ├── ConfirmModal.tsx
│   │       ├── Toast.tsx           # Toast notification
│   │       └── StatusBadge.tsx
│   │
│   └── types/
│       ├── auth.types.ts
│       ├── household.types.ts
│       ├── bin.types.ts
│       ├── analytics.types.ts
│       └── api.types.ts            # ApiResponse<T>, ApiError types
│
├── docs/                           # ← DOKUMEN INI ADA DI SINI
│   ├── prd.md
│   ├── srs.md
│   ├── sdd.md
│   ├── ui_ux_flow.md
│   └── task_breakdown.md
│
├── index.html
├── .env
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## 3. Design System Kode

### 3.1 Tailwind Config (Color Tokens)
```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary: {
        green: { DEFAULT: '#4CAF50', dark: '#2E7D32', light: '#E8F5E9' },
        blue:  { DEFAULT: '#0056A4', dark: '#0D47A1', light: '#E3F2FD' },
      },
      warning: '#F59E0B',
      danger:  '#EF4444',
    },
    fontFamily: {
      sans: ['Plus Jakarta Sans', 'sans-serif'],
    },
  },
}
```

### 3.2 Auth Store Design (Zustand)
```typescript
// stores/useAuthStore.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  wsToken: string | null;  // token untuk WS (dari /auth/me response)
  setUser: (user: User, wsToken: string) => void;
  clearAuth: () => void;
}
```

### 3.3 WebSocket Architecture (Frontend)
```typescript
// lib/websocket.ts — Singleton pattern
class WsClient {
  private ws: WebSocket | null = null;
  private retryDelay = 1000;
  
  connect(token: string) {
    const url = `${import.meta.env.VITE_WS_URL}/ws?token=${token}`;
    this.ws = new WebSocket(url);
    
    this.ws.onmessage = (ev) => {
      const { event, data } = JSON.parse(ev.data);
      if (event === 'bin_full_alert') {
        useNotifStore.getState().addNotif(data);
      }
      if (event === 'capacity_update') {
        queryClient.invalidateQueries({ queryKey: ['households'] });
      }
    };
    
    this.ws.onclose = () => {
      // Exponential backoff reconnect
      setTimeout(() => this.connect(token), Math.min(this.retryDelay *= 2, 30000));
    };
  }
  
  // Kirim ping setiap 30 detik
  startPing() {
    setInterval(() => this.ws?.send(JSON.stringify({ event: 'ping' })), 30000);
  }
}
```

### 3.4 Protected Route Pattern
```typescript
// App.tsx
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}
```

### 3.5 KpiCard Component Interface
```typescript
interface KpiCardProps {
  title: string;
  value: string | number;
  subLabel: string;
  icon: LucideIcon;
  iconColor: 'green' | 'blue' | 'red' | 'amber';
  trend?: { value: string; isPositive: boolean };
}
```

### 3.6 CapacityProgressBar Logic
```typescript
// Sinkron dengan backend threshold 22.5L / 25L
const getBarColor = (volumeLiter: number): string => {
  const pct = (volumeLiter / 25) * 100;
  if (pct >= 90) return 'bg-red-500';    // PENUH: ≥ 22.5L
  if (pct >= 70) return 'bg-amber-500';  // HAMPIR: 17.5L - 22.4L
  return 'bg-green-500';                 // AMAN: < 17.5L
};
```

---

## 4. Routing Structure

```typescript
// App.tsx routes
/login                   → LoginPage (public)
/                        → DashboardPage (protected)
/map                     → MapPage (protected)
/map/:rtRwId             → MapRtDetailPage (protected)
/households              → HouseholdsPage (protected)
/leaderboard             → LeaderboardPage (protected)
/ai-evaluation           → AiEvaluationPage (protected)
*                        → Navigate to /
```

---

## 5. Environment Variables

```env
# frontend/.env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
# Saat Ngrok aktif:
# VITE_API_URL=https://<ngrok-id>.ngrok-free.app
# VITE_WS_URL=wss://<ngrok-id>.ngrok-free.app
```
