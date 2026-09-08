# Widget Peta — Tombol Kompas & Tombol Lokasi Saya (Re-center)

> Dokumen pendamping untuk `gps-calibration-architecture.md`. Berisi panduan implementasi dua tombol kontrol peta (kompas & re-center lokasi) pada fitur presensi KKN berbasis geofencing, agar terintegrasi dengan hasil modul kalibrasi GPS.

Kedua tombol ini melengkapi modul kalibrasi GPS: kalibrasi memastikan **kualitas titik lokasinya**, sedangkan dua tombol ini memastikan **user nyaman membaca & berinteraksi dengan peta** saat presensi geofencing (misal melihat posisinya relatif terhadap radius geofence lokasi KKN).

---

## 1. Requirement

| ID | Requirement | Deskripsi |
|----|-------------|-----------|
| FR-18 | Tombol Kompas (orientasi peta) | Menampilkan arah hadap peta saat ini; saat ditekan, peta kembali ke orientasi **North Up** (rotasi 0°, bearing 0). Tombol otomatis muncul hanya saat peta dalam keadaan diputar/di-tilt, meniru perilaku Google Maps native. |
| FR-19 | Tombol Lokasi Saya (Re-center) | Menampilkan kembali posisi user saat ini ke tengah layar peta (animasi kamera), dan mengaktifkan indikator titik biru (`my location dot`) bila belum aktif. |
| FR-20 | Posisi tombol pada widget peta | Kedua tombol diletakkan sebagai overlay di atas `GoogleMap`/`MapView` (menggunakan `Stack`), bukan berdiri sendiri di luar peta — kompas biasanya di kanan atas, tombol lokasi di kanan bawah (di atas info card/bottom sheet jika ada). |
| FR-21 | Sinkronisasi dengan modul kalibrasi | Saat user menekan tombol Lokasi Saya dan hasil GPS terbaru masih berstatus `guide` (BAD), tampilkan indikator kualitas sinyal (badge) alih-alih langsung re-center paksa ke titik yang tidak stabil. |

## 2. Package

Gunakan salah satu sesuai peta yang dipakai di proyek (pilih satu):

```yaml
dependencies:
  google_maps_flutter: ^2.9.0     # jika pakai Google Maps
  # atau
  flutter_map: ^7.0.2             # jika pakai OpenStreetMap/Leaflet-based
  flutter_map_tile_caching: ^9.1.3 # opsional, untuk offline tile di daerah sinyal lemah
```

> Catatan: untuk konteks KKN dengan sinyal jaringan yang kadang buruk, pertimbangkan `flutter_map` + tile caching offline agar peta tetap tampil walau data seluler lemah — GPS satelit tetap bisa berfungsi tanpa internet, tapi tile peta butuh koneksi kecuali di-cache.

## 3. Landasan Teknis

- **Kompas / bearing**: `GoogleMap` mengekspos `CameraPosition.bearing` (0–360°) dan `CameraPosition.tilt`. Tombol kompas hanya perlu tampil ketika `bearing != 0 || tilt != 0`, dan saat ditekan memanggil `animateCamera(CameraUpdate.newCameraPosition(...bearing: 0, tilt: 0))`.
- **Re-center lokasi**: gunakan `Geolocator.getPositionStream()` (atau posisi terakhir dari modul kalibrasi GPS di atas) sebagai sumber koordinat, lalu `controller.animateCamera(CameraUpdate.newLatLngZoom(latLng, currentZoom))`.
- **Google Maps sudah punya tombol bawaan** (`myLocationButtonEnabled: true`, `compassEnabled: true`), tapi untuk konsistensi desain/branding aplikasi presensi KKN, **disarankan pakai tombol custom** (matikan bawaan, buat sendiri via `Stack`) agar bisa dikontrol posisi, style, dan perilakunya (termasuk integrasi dengan state kalibrasi GPS).

## 4. Struktur Widget (Stack Layout)

```dart
class PresensiMapView extends StatefulWidget {
  const PresensiMapView({super.key});

  @override
  State<PresensiMapView> createState() => _PresensiMapViewState();
}

class _PresensiMapViewState extends State<PresensiMapView> {
  GoogleMapController? _mapController;
  double _bearing = 0;
  double _tilt = 0;
  LatLng? _myPosition;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Layer 1: Peta utama
        GoogleMap(
          initialCameraPosition: const CameraPosition(
            target: LatLng(0, 0), // ganti dengan koordinat lokasi KKN
            zoom: 17,
          ),
          myLocationEnabled: true,        // titik biru tetap ditampilkan Google Maps
          myLocationButtonEnabled: false, // matikan tombol bawaan, pakai custom
          compassEnabled: false,          // matikan kompas bawaan, pakai custom
          onCameraMove: (position) {
            setState(() {
              _bearing = position.bearing;
              _tilt = position.tilt;
            });
          },
          onMapCreated: (controller) => _mapController = controller,
          circles: {
            // Visualisasi radius geofence lokasi KKN
            Circle(
              circleId: const CircleId('geofence'),
              center: const LatLng(0, 0), // koordinat posko/lokasi program kerja
              radius: 100, // meter, sesuaikan kebutuhan
              fillColor: Colors.blue.withOpacity(0.1),
              strokeColor: Colors.blue,
              strokeWidth: 2,
            ),
          },
        ),

        // Layer 2: Tombol Kompas — hanya muncul saat peta diputar/tilt
        if (_bearing != 0 || _tilt != 0)
          Positioned(
            top: 16,
            right: 16,
            child: _CompassButton(
              bearing: _bearing,
              onPressed: _resetOrientation,
            ),
          ),

        // Layer 3: Tombol Lokasi Saya — selalu tampil
        Positioned(
          bottom: 100, // beri jarak dari bottom sheet/info card presensi
          right: 16,
          child: _MyLocationButton(
            onPressed: _recenterToMyLocation,
          ),
        ),
      ],
    );
  }

  Future<void> _resetOrientation() async {
    final current = await _mapController?.getZoomLevel() ?? 17;
    await _mapController?.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(
          target: _myPosition ?? const LatLng(0, 0),
          zoom: current,
          bearing: 0, // kembali ke North Up
          tilt: 0,
        ),
      ),
    );
  }

  Future<void> _recenterToMyLocation() async {
    // Idealnya ambil posisi dari state GpsCalibrationBloc (lihat Bab 6.2),
    // bukan langsung dari Geolocator, agar konsisten dengan hasil kalibrasi.
    final position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
    final latLng = LatLng(position.latitude, position.longitude);
    setState(() => _myPosition = latLng);

    await _mapController?.animateCamera(
      CameraUpdate.newLatLngZoom(latLng, 17),
    );
  }
}
```

## 5. Komponen Tombol Custom

```dart
class _CompassButton extends StatelessWidget {
  final double bearing;
  final VoidCallback onPressed;

  const _CompassButton({required this.bearing, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Material(
      shape: const CircleBorder(),
      elevation: 4,
      color: Colors.white,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onPressed,
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Transform.rotate(
            angle: -bearing * (3.14159 / 180), // konversi derajat ke radian
            child: const Icon(Icons.explore, color: Colors.redAccent),
          ),
        ),
      ),
    );
  }
}

class _MyLocationButton extends StatelessWidget {
  final VoidCallback onPressed;

  const _MyLocationButton({required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Material(
      shape: const CircleBorder(),
      elevation: 4,
      color: Colors.white,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onPressed,
        child: const Padding(
          padding: EdgeInsets.all(10),
          child: Icon(Icons.my_location, color: Colors.blueAccent),
        ),
      ),
    );
  }
}
```

## 6. Perilaku yang Wajib Diimplementasikan Agent

1. **Tombol kompas conditional render** — jangan tampilkan permanen; hanya muncul saat `bearing != 0 || tilt != 0`, lalu hilang lagi (fade out) begitu orientasi kembali North Up. Gunakan `AnimatedOpacity`/`AnimatedScale` agar transisinya halus, bukan muncul-hilang mendadak.
2. **Ikon kompas berputar mengikuti bearing** — gunakan `Transform.rotate` dengan sudut kebalikan dari bearing peta, supaya panah kompas selalu menunjuk ke arah Utara sesungguhnya (bukan ikut berputar sama arah dengan peta).
3. **Tombol lokasi saya harus reflect status kalibrasi GPS**: jika `GpsCalibrationState.status == guide` (BAD), beri indikator visual berbeda (misal ikon abu-abu/badge warning) alih-alih ikon biru normal — agar user tahu posisi yang ditampilkan mungkin belum stabil, sejalan dengan tujuan kalibrasi di Bab 1.
4. **Debounce/throttle `onCameraMove`** — event ini terpanggil sangat sering saat user drag peta; hindari `setState` berlebihan yang bisa menyebabkan jank, terutama pada perangkat low-end yang umum dipakai mahasiswa KKN.
5. **Posisi tombol adaptif** — beri jarak (`bottom`/`right` padding) yang menyesuaikan apakah ada bottom sheet/info card presensi di layar, agar tombol tidak tertutup.

---

## 7. Checklist Sebelum Merge

- [ ] Tombol kompas hanya muncul saat peta diputar/tilt, dan hilang otomatis saat kembali North Up.
- [ ] Ikon kompas berputar sesuai bearing peta secara real-time.
- [ ] Tombol Lokasi Saya berhasil re-center kamera ke posisi user dengan animasi halus.
- [ ] Tombol Lokasi Saya menampilkan indikator berbeda saat status kalibrasi GPS = BAD (lihat `gps-calibration-architecture.md` Bab 6.2 untuk `GpsCalibrationState`).
- [ ] `onCameraMove` di-throttle agar tidak menyebabkan jank di perangkat low-end.
- [ ] Posisi tombol tidak tertutup oleh bottom sheet/info card presensi.
