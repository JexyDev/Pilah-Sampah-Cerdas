# ARCHITECTURE_MOBILE.md — apps/mobile

> Tech stack: Flutter (sesuaikan jika React Native)
> Pola: Clean Architecture + Feature-first, selaras dengan pola backend supaya tim mudah paham lintas layer.

---

## 1. Struktur Folder (WAJIB)

```
apps/mobile/
├── lib/
│   ├── core/                          # Hal yang dipakai di seluruh app
│   │   ├── constants/
│   │   │   └── app_constants.dart
│   │   ├── network/
│   │   │   ├── api_client.dart         # dio/http instance + interceptor
│   │   │   └── network_exceptions.dart
│   │   ├── theme/
│   │   │   └── app_theme.dart
│   │   ├── utils/
│   │   │   └── date_formatter.dart
│   │   └── services/
│   │       └── notification_engine.dart   # background notification rule engine
│   │
│   ├── features/                      # Setiap fitur = 1 folder mandiri
│   │   └── schedule/
│   │       ├── data/
│   │       │   ├── models/
│   │       │   │   └── schedule_model.dart      # mapping JSON <-> object
│   │       │   └── repositories/
│   │       │       └── schedule_repository_impl.dart
│   │       ├── domain/
│   │       │   ├── entities/
│   │       │   │   └── schedule_entity.dart      # model bisnis murni
│   │       │   ├── repositories/
│   │       │   │   └── schedule_repository.dart  # abstract/interface
│   │       │   └── usecases/
│   │       │       └── get_active_schedule.dart
│   │       └── presentation/
│   │           ├── pages/
│   │           │   └── schedule_page.dart
│   │           ├── widgets/
│   │           │   └── schedule_card.dart
│   │           └── providers/ (atau bloc/)
│   │               └── schedule_provider.dart
│   │
│   ├── shared_widgets/                 # Widget generic lintas fitur
│   │   ├── loading_indicator.dart
│   │   └── error_view.dart
│   │
│   └── main.dart
│
├── test/
│   └── features/
│       └── schedule/
│           └── get_active_schedule_test.dart
├── android/
├── ios/
├── pubspec.yaml
└── .env.example
```

---

## 2. Aturan Dependency Antar Layer

```
presentation  →  domain  ←  data
```

- `domain/` (entity, repository interface, usecase) **tidak boleh** import dari `data/` atau `presentation/`.
- `data/` mengimplementasikan interface dari `domain/repositories`, mengurus konversi JSON ↔ Entity.
- `presentation/` (page, widget, provider/bloc) hanya memanggil `usecase`, tidak pernah memanggil `data/repositories` langsung atau parsing JSON di UI.

**Contoh SALAH:**
```dart
// ❌ Widget langsung fetch & parsing JSON
final response = await http.get(url);
final json = jsonDecode(response.body); // logic ada di widget, salah!
```

**Contoh BENAR:**
```dart
// ✅ Widget memanggil usecase lewat provider
final schedule = ref.watch(getActiveScheduleProvider);
```

---

## 3. Konvensi Penamaan

| Elemen | Konvensi | Contoh |
|--------|----------|--------|
| File | snake_case.dart | `schedule_repository_impl.dart` |
| Class | PascalCase | `ScheduleRepositoryImpl` |
| Variable/function | camelCase | `getActiveSchedule()` |
| Folder fitur | snake_case | `features/schedule` |

---

## 4. Aturan Khusus: Background Notification Engine

Karena Trashcare butuh notifikasi jadwal yang tetap jalan walau app ditutup:

- Semua logic ada di `core/services/notification_engine.dart`, **bukan** tersebar di UI.
- Jam/jadwal notifikasi (rule) didefinisikan sebagai constant di `core/constants/app_constants.dart`, contoh:
```dart
class NotificationSchedule {
  static const int morningHour = 7;
  static const int eveningHour = 16;
}
```
- Wajib pakai `flutter_local_notifications` + `timezone`, dengan `zonedSchedule` dan `matchDateTimeComponents: DateTimeComponents.time` supaya berulang harian otomatis.
- Wajib ada notification id tetap (id=1 pagi, id=2 sore) supaya tidak duplikat saat re-init.
- Wajib ada penanganan permission (notification, exact alarm, battery optimization) dengan **try-catch**, tidak boleh crash jika ditolak user — cukup log dan retry saat app dibuka lagi.
- Wajib ada `BOOT_COMPLETED` receiver di `android/app/src/main/AndroidManifest.xml` agar jadwal aktif ulang otomatis setelah restart device.

---

## 5. State Management

- Gunakan satu pendekatan konsisten di seluruh app (pilih salah satu dan pertahankan): **Riverpod** (disarankan untuk clean architecture) atau **Bloc**.
- Tidak boleh campur `setState()` untuk data dari API — `setState` hanya untuk state UI lokal murni (misal: toggle visibility password).

---

## 6. Error & Loading Handling (WAJIB di Setiap Halaman yang Fetch Data)

```dart
schedule.when(
  loading: () => const LoadingIndicator(),
  error: (err, _) => ErrorView(message: err.toString()),
  data: (data) => data.isEmpty
      ? const EmptyState()
      : ScheduleList(items: data),
);
```

---

## 7. Checklist Sebelum Menambah Fitur Mobile Baru

```
[ ] Folder fitur baru dibuat mengikuti pola data/domain/presentation
[ ] Entity domain terpisah dari model data (JSON mapping)
[ ] Usecase berisi logic bisnis, dipanggil dari provider/bloc
[ ] Widget tidak fetch API atau parsing JSON langsung
[ ] Loading, error, empty state ditangani di semua halaman fetch data
[ ] Jika terkait notifikasi: sudah dites app di-kill lalu notif tetap muncul sesuai jadwal
[ ] Jika terkait notifikasi: sudah dites device restart, jadwal tetap aktif
[ ] Permission handling tidak menyebabkan crash jika ditolak user
[ ] Unit test usecase ditambahkan dan lolos
```
