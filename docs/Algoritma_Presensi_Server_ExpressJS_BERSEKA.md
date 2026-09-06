

BERSEKA  |  Spesifikasi Teknis Presensi KKN
## Dokumen Teknis  •  1
## BERSEKA.ID
Algoritma Presensi Mahasiswa KKN
Berbasis GPS dan Geofence
Arsitektur server-authoritative menggunakan Express.js: seluruh validasi,
kalkulasi durasi, rasio, dan status dilakukan pada server
AtributKeterangan
## Platform
BERSEKA — aplikasi mobile dan sistem administrasi
## KKN
Aktor utama
Mahasiswa KKN, admin, DPL, dan pengelola
lokasi/RW
Jadwal defaultSenin–Sabtu, pukul 08.00–17.00 WIB
Target kehadiranMinimal 4 jam/hari; dapat dikonfigurasi admin
Basis validasi
Agenda aktif, waktu server, GPS, geofence, akurasi
lokasi, dan durasi aktual
Status akhir
Hadir dan memenuhi; hadir dan tidak memenuhi;
sakit; izin; tanpa keterangan
Prinsip utama  Check-in bukan satu-satunya bukti kehadiran. Durasi hanya bertambah ketika
mahasiswa berada pada waktu yang sah, di dalam geofence yang benar, dan lokasi lolos
validasi kualitas serta integritas.
Dokumen siap dijadikan acuan pengembangan backend API dan aplikasi Flutter

BERSEKA  |  Spesifikasi Teknis Presensi KKN
## Dokumen Teknis  •  2
- Latar Belakang dan Tujuan
BERSEKA mendukung pengelolaan kegiatan KKN berbasis wilayah. Setiap kelompok
ditempatkan pada RW tertentu dan memiliki satu atau lebih agenda kegiatan. Untuk
meningkatkan objektivitas, keterlacakan, dan disiplin, kehadiran mahasiswa dicatat melalui
aplikasi mobile dengan GPS dan geofence. Sistem tidak sekadar merekam check-in dan check-out,
tetapi mengukur akumulasi keberadaan aktual pada lokasi serta waktu kegiatan yang sah.
Tujuan algoritma adalah menghasilkan status presensi harian yang konsisten, dapat diaudit, dan
dapat diterapkan pada Flutter serta backend. Keputusan final dibentuk dari validitas agenda,
identitas mahasiswa, waktu server, lokasi, kualitas GPS, akumulasi durasi, dan pengajuan sakit
atau izin yang telah diverifikasi.
- Ruang Lingkup dan Aktor
AktorTanggung jawab
## Mahasiswa
Check-in, memberikan izin lokasi, menjaga pelacakan
aktif, check-out, serta mengajukan sakit/izin dengan
bukti.
## Admin
Mengatur agenda, hari dan jam aktif, target durasi,
radius geofence, toleransi GPS, serta verifikasi data
khusus.
## DPL
Memantau kehadiran, meninjau anomali, dan
memverifikasi atau memberi rekomendasi atas
sakit/izin.
Sistem backend
Menjadi sumber waktu, memvalidasi aturan,
mengakumulasi durasi, mengunci status final, dan
menyimpan audit trail.
## Aplikasi Flutter
Mengambil GPS, menampilkan status/timer, mengirim
log, mengelola antrean offline, dan memberi
notifikasi.
## 3. Definisi Status Presensi
KodeKeteranganKondisi utama
HADIR_MEMENUHIHadir dan memenuhi
Durasi aktual valid   target durasi ≥
harian.
HADIR_TIDAK_MEMENUHIHadir dan tidak memenuhiDurasi aktual valid > 0 tetapi < target.
SAKITSakit
Pengajuan sakit tersedia dan telah

BERSEKA  |  Spesifikasi Teknis Presensi KKN
## Dokumen Teknis  •  3
KodeKeteranganKondisi utama
disetujui.
IZINIzin
Pengajuan izin tersedia dan telah
disetujui.
TANPA_KETERANGANTanpa keterangan
Agenda selesai, durasi aktual 0, dan
tidak ada sakit/izin disetujui.
MENUNGGU_VERIFIKASIStatus sementara
Pengajuan sakit/izin belum
diputuskan.
IN_PROGRESSStatus sementara
Check-in valid dan agenda masih
berlangsung.
## 4. Parameter Sistem
ParameterNilai awalSumber/pengelola
Hari aktifSenin–SabtuAdmin/agenda
Jam aktif08.00–17.00 WIBAdmin/agenda
Target durasi240 menitAdmin
Radius geofence50–150 meterAdmin per lokasi
Interval pelacakan1–5 menitKonfigurasi sistem
Akurasi GPS maksimum30–50 meterAdmin/sistem
Batas gap lokasi10 menitAdmin/sistem
Zona waktuAsia/JakartaKonfigurasi server
Toleransi sinkronisasi offline30 menitAdmin/sistem
Kebijakan konfigurasi  Nilai di atas adalah nilai awal. Seluruh parameter penting harus
tersimpan di basis data dan memiliki riwayat perubahan agar keputusan presensi dapat
direkonstruksi sesuai aturan yang berlaku pada tanggal kegiatan.
## 5. Model Data Inti
## 5.1 Mahasiswa
studentId, studentName, groupId, assignedRwId, deviceId, isActive

BERSEKA  |  Spesifikasi Teknis Presensi KKN
## Dokumen Teknis  •  4
5.2 Agenda KKN
agendaId, groupId, rwId, activityDate, startTime, endTime, targetDurationMinutes, latitude, longitude,
geofenceRadiusMeters, timezone, status
5.3 Presensi harian
attendanceId, studentId, agendaId, date, checkInTime, checkOutTime, actualDurationMinutes, attendanceStatus,
fulfillmentRatio, counterStatus, lastValidLocationTime, finalizedAt, notes
5.4 Log lokasi
locationLogId, attendanceId, timestampServer, timestampDevice, latitude, longitude, accuracy, distanceFromCenter,
isInsideGeofence, isValidSchedule, isMockLocation, validationStatus
5.5 Pengajuan ketidakhadiran
absenceRequestId, studentId, date, type, reason, attachmentUrl, submittedAt, approvalStatus, approvedBy, approvedAt
## 6. Validasi Jadwal
Agenda dinyatakan sah apabila seluruh kondisi berikut terpenuhi:
Mahasiswa aktif dan terhubung dengan kelompok pada agenda.
Agenda berstatus aktif.
Tanggal lokal berdasarkan zona waktu agenda sama dengan activityDate.
Hari termasuk hari aktif yang ditentukan.
Waktu server berada antara startTime dan endTime.
validSchedule = studentActive
AND assignedToAgenda
AND agendaStatus == ACTIVE
AND localDate == activityDate
AND localTime >= startTime
AND localTime <= endTime
- Validasi GPS dan Geofence
Jarak antara lokasi mahasiswa dan titik pusat kegiatan dihitung menggunakan rumus Haversine.
Dengan latitude φ, longitude λ, dan radius bumi R   6.371.000 meter:≈
a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
d = 2R × atan2( a,  (1-a))√√
Lokasi valid apabila jarak d tidak melebihi radius geofence, akurasi GPS berada dalam batas,
data lokasi masih segar, layanan lokasi aktif, dan mock location tidak terdeteksi.
validLocation = distanceMeters <= geofenceRadiusMeters
AND accuracyMeters <= maximumGpsAccuracy
AND locationAgeSeconds <= maximumLocationAge
AND gpsEnabled
AND NOT mockLocationDetected

BERSEKA  |  Spesifikasi Teknis Presensi KKN
## Dokumen Teknis  •  5
## 8. Alur Check-in
1.Aplikasi meminta konfigurasi agenda aktif dari server.
2.Mahasiswa memberikan izin lokasi dan menekan Check-in.
3.Flutter mengambil lokasi dengan akurasi tinggi dan mengirimkannya bersama identitas
agenda serta perangkat.
4.Backend memvalidasi mahasiswa, agenda, waktu server, assignment, geofence, akurasi, dan
integritas lokasi.
5.Jika valid, backend membuat atau membuka presensi harian, mencatat checkInTime, dan
mengaktifkan penghitungan durasi.
6.Jika gagal, sistem menyimpan alasan penolakan dan menampilkan tindakan perbaikan.
Istilah antarmuka  Gunakan istilah “Penghitungan Durasi Aktif”, bukan “billing waktu”,
karena proses ini tidak berkaitan dengan transaksi finansial.
## 9. Akumulasi Durasi Aktual
Durasi tidak dihitung langsung dari selisih check-in dan check-out. Sistem menjumlahkan
interval antardata lokasi yang sama-sama valid, berada di dalam geofence, dan tidak melampaui
batas kehilangan sinyal.
D_aktual = Σ Δtᵢ, untuk setiap interval i yang memenuhi:
- jadwal valid
- lokasi awal dan akhir valid
- kedua titik berada di dalam geofence
- Δtᵢ <= maximumAllowedGap
IntervalKondisiDurasi yang dihitung
08.00–09.30Di dalam geofence90 menit
09.30–10.00Di luar geofence0 menit
10.00–12.30Di dalam geofence150 menit
Total240 menit
## 10. Rasio Pemenuhan
fulfillmentRatio = actualDurationMinutes / targetDurationMinutes
displayPercentage = min(fulfillmentRatio, 1.0) × 100%
Rasio mentah tetap disimpan agar durasi lebih dari target tidak hilang. Untuk progress bar,
persentase dapat dibatasi maksimum 100%.

BERSEKA  |  Spesifikasi Teknis Presensi KKN
## Dokumen Teknis  •  6
AktualTargetRasio mentahStatus
240 menit240 menit100%Hadir dan memenuhi
300 menit240 menit125%Hadir dan memenuhi
180 menit240 menit75%Hadir dan tidak memenuhi
0 menit240 menit0%
Tanpa keterangan, jika
tanpa izin/sakit
- Aturan Klasifikasi dan Prioritas
Klasifikasi menggunakan urutan prioritas agar hanya ada satu status final per mahasiswa,
agenda, dan tanggal:
7.Sakit yang telah disetujui.
8.Izin yang telah disetujui.
9.Hadir dan memenuhi jika durasi aktual   target.≥
10.Hadir dan tidak memenuhi jika durasi aktual > 0 tetapi < target.
11.Menunggu verifikasi jika ada pengajuan yang belum diputuskan.
12.Tanpa keterangan jika agenda selesai, durasi 0, dan tidak ada pengajuan yang disetujui.
Aturan konsistensi  Sakit dan izin tidak boleh otomatis menghapus log lokasi. Log tetap
disimpan untuk audit, sedangkan status akhir mengikuti keputusan verifikasi dan kebijakan
## KKN.

BERSEKA  |  Spesifikasi Teknis Presensi KKN
## Dokumen Teknis  •  7
## 12. Pseudocode Utama
FUNCTION processDailyAttendance(studentId, agendaId, currentLocation):
student    = getStudent(studentId)
agenda     = getAgenda(agendaId)
serverTime = getServerTime()
localTime  = convertTimezone(serverTime, agenda.timezone)
IF student == NULL OR student.isActive == FALSE:
## RETURN ERROR_STUDENT_NOT_ACTIVE
IF agenda == NULL OR agenda.status != ACTIVE:
## RETURN ERROR_AGENDA_NOT_ACTIVE
IF student.groupId != agenda.groupId:
## RETURN ERROR_AGENDA_NOT_ASSIGNED
IF localTime.date != agenda.activityDate:
## RETURN ERROR_INVALID_DATE
IF localTime.time < agenda.startTime OR localTime.time > agenda.endTime:
## RETURN ERROR_OUTSIDE_SCHEDULE
IF NOT currentLocation.permissionGranted:
## RETURN ERROR_LOCATION_PERMISSION
IF NOT currentLocation.gpsEnabled:
## RETURN ERROR_GPS_DISABLED
IF currentLocation.isMockLocation:
saveSecurityFlag(studentId, agendaId, MOCK_LOCATION)
## RETURN ERROR_MOCK_LOCATION
IF currentLocation.accuracy > agenda.maximumGpsAccuracy:
## RETURN ERROR_LOW_GPS_ACCURACY
distance = haversine(currentLocation, agenda.centerPoint)
isInside = distance <= agenda.geofenceRadiusMeters
saveLocationLog(studentId, agendaId, serverTime, distance, isInside)
IF NOT isInside:
pauseDurationCounter(studentId, agendaId)
## RETURN OUTSIDE_GEOFENCE
attendance = getOrCreateDailyAttendance(studentId, agendaId, localTime.date)
IF attendance.checkInTime == NULL:
attendance.checkInTime = serverTime
attendance.status = IN_PROGRESS
attendance.lastValidLocationTime = serverTime
attendance.counterStatus = ACTIVE
saveAttendance(attendance)
## RETURN CHECK_IN_SUCCESS

BERSEKA  |  Spesifikasi Teknis Presensi KKN
## Dokumen Teknis  •  8
## 13. Pseudocode Akumulasi Durasi
FUNCTION updateActiveDuration(studentId, agendaId, newLocation):
attendance = getActiveAttendance(studentId, agendaId)
agenda = getAgenda(agendaId)
serverTime = getServerTime()
IF attendance == NULL:
## RETURN NO_ACTIVE_ATTENDANCE
IF serverTime > agenda.endDateTime:
finalizeAttendance(studentId, agendaId)
## RETURN AGENDA_FINISHED
validation = validateLocationAndSchedule(agenda, newLocation, serverTime)
previousLog = getLastLocationLog(studentId, agendaId)
IF validation.isValid:
IF previousLog != NULL
AND previousLog.validationStatus == VALID
AND previousLog.isInsideGeofence:
interval = minutesBetween(serverTime, previousLog.timestampServer)
IF interval <= agenda.maximumAllowedGap:
attendance.actualDurationMinutes += interval
## ELSE:
createAnomaly(LOCATION_DATA_GAP)
attendance.lastValidLocationTime = serverTime
attendance.counterStatus = ACTIVE
## ELSE:
attendance.counterStatus = PAUSED
attendance.fulfillmentRatio =
attendance.actualDurationMinutes / agenda.targetDurationMinutes
saveAttendance(attendance)
saveLocationLog(validation)
RETURN attendance

BERSEKA  |  Spesifikasi Teknis Presensi KKN
## Dokumen Teknis  •  9
- Pseudocode Finalisasi dan Check-out
FUNCTION finalizeAttendance(studentId, agendaId):
attendance = getOrCreateEmptyAttendance(studentId, agendaId)
agenda = getAgenda(agendaId)
request = getAbsenceRequest(studentId, agenda.activityDate)
IF request.approvalStatus == PENDING:
finalStatus = MENUNGGU_VERIFIKASI
ELSE IF request.type == SICK AND request.approvalStatus == APPROVED:
finalStatus = SAKIT
ELSE IF request.type == PERMISSION AND request.approvalStatus == APPROVED:
finalStatus = IZIN
ELSE IF attendance.actualDurationMinutes >= agenda.targetDurationMinutes:
finalStatus = HADIR_MEMENUHI
ELSE IF attendance.actualDurationMinutes > 0:
finalStatus = HADIR_TIDAK_MEMENUHI
## ELSE:
finalStatus = TANPA_KETERANGAN
attendance.checkOutTime = getServerTime()
attendance.attendanceStatus = finalStatus
attendance.fulfillmentRatio =
attendance.actualDurationMinutes / agenda.targetDurationMinutes
attendance.counterStatus = STOPPED
attendance.finalizedAt = getServerTime()
saveAttendance(attendance)
RETURN attendance
FUNCTION manualCheckOut(studentId, agendaId, currentLocation):
attendance = getActiveAttendance(studentId, agendaId)
IF attendance == NULL:
## RETURN ERROR_NO_ACTIVE_ATTENDANCE
updateActiveDuration(studentId, agendaId, currentLocation)
RETURN finalizeAttendance(studentId, agendaId)
- Pembagian Tanggung Jawab Flutter dan Server
KomponenBoleh dilakukan
Tidak boleh menjadi sumber
keputusan
## Flutter
Mengambil GPS, membaca
accuracy/mock flag dari OS,
mengirim sampel, menyimpan
antrean offline, dan menampilkan
respons server.
Waktu resmi, hasil Haversine final,
durasi aktual, rasio, status akhir,
serta koreksi presensi.
## Express.js
Memvalidasi token, agenda,
assignment, waktu server, GPS,
geofence, urutan log, idempotensi,
durasi, rasio, dan status.
Tidak mempercayai timer, tanggal,
rasio, atau status yang dihitung
perangkat.
## Database
Menyimpan konfigurasi efektif,
presensi, log lokasi, izin/sakit,
anomali, dan audit trail.
Tidak menerima perubahan presensi
tanpa service dan transaksi server.

BERSEKA  |  Spesifikasi Teknis Presensi KKN
## Dokumen Teknis  •  10
Aturan mutlak  Flutter tidak mengirim actualDurationMinutes, fulfillmentRatio,
displayPercentage, atau attendanceStatus sebagai nilai yang dipercaya. Semua nilai tersebut
dihitung ulang oleh Express.js dan dikembalikan melalui API.
15.1 Payload Flutter ke server
## {
"requestId": "uuid-v4",
"agendaId": "agenda-123",
"capturedAtDevice": "2026-08-29T08:05:10+07:00",
## "latitude": -6.89123,
## "longitude": 107.61012,
"accuracyMeters": 12.4,
"isMockLocation": false,
"deviceId": "registered-device-id"
## }
15.2 Respons server yang ditampilkan Flutter
## {
"serverTime": "2026-08-29T01:05:11.420Z",
"validationStatus": "VALID_INSIDE_GEOFENCE",
"counterStatus": "ACTIVE",
"actualDurationSeconds": 7320,
"targetDurationSeconds": 14400,
"fulfillmentRatio": 0.5083,
"displayPercentage": 50.83,
"attendanceStatus": "IN_PROGRESS"
## }
- Implementasi Kalkulasi pada Express.js
16.1 Struktur modul backend
src/
routes/attendance.routes.js
controllers/attendance.controller.js
services/attendance.service.js
services/location-validation.service.js
services/duration.service.js
services/classification.service.js
jobs/finalize-attendance.job.js
middleware/auth.js
middleware/idempotency.js
repositories/attendance.repository.js
config/attendance.config.js

BERSEKA  |  Spesifikasi Teknis Presensi KKN
## Dokumen Teknis  •  11
16.2 Kalkulasi jarak Haversine di server
const EARTH_RADIUS_METERS = 6_371_000;
function toRadians(degrees) {
return degrees * Math.PI / 180;
## }
export function haversineMeters(lat1, lon1, lat2, lon2) {
const dLat = toRadians(lat2 - lat1);
const dLon = toRadians(lon2 - lon1);
const p1 = toRadians(lat1);
const p2 = toRadians(lat2);
const a = Math.sin(dLat / 2) ** 2
+ Math.cos(p1) * Math.cos(p2) * Math.sin(dLon / 2) ** 2;
return 2 * EARTH_RADIUS_METERS
- Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
## }
16.3 Fungsi klasifikasi hanya di server
export function classifyAttendance({
actualSeconds,
targetSeconds,
agendaHasEnded,
approvedAbsenceType,
hasPendingAbsenceRequest,
## }) {
if (approvedAbsenceType === 'SICK') return 'SAKIT';
if (approvedAbsenceType === 'PERMISSION') return 'IZIN';
if (actualSeconds >= targetSeconds) return 'HADIR_MEMENUHI';
if (actualSeconds > 0) return 'HADIR_TIDAK_MEMENUHI';
if (hasPendingAbsenceRequest) return 'MENUNGGU_VERIFIKASI';
if (agendaHasEnded) return 'TANPA_KETERANGAN';
return 'NOT_STARTED';
## }

BERSEKA  |  Spesifikasi Teknis Presensi KKN
## Dokumen Teknis  •  12
16.4 Service pemrosesan log secara transaksional
export async function processLocationSample(input, authUser) {
return db.transaction(async (tx) => {
// 1. Idempotensi: requestId unik per mahasiswa.
const duplicate = await tx.locationLog.findUnique({
where: { studentId_requestId: {
studentId: authUser.studentId,
requestId: input.requestId,
## }},
## });
if (duplicate) return buildAttendanceResponse(duplicate.attendanceId, tx);
// 2. Kunci baris presensi untuk mencegah race condition.
const agenda = await loadAuthorizedAgenda(input.agendaId, authUser, tx);
const serverNow = new Date();
validateServerSchedule(agenda, serverNow);
validateLocationPayload(input, agenda, serverNow);
const distanceMeters = haversineMeters(
input.latitude, input.longitude,
agenda.latitude, agenda.longitude,
## );
const inside = distanceMeters <= agenda.geofenceRadiusMeters;
const attendance = await getOrCreateAttendanceForUpdate(
authUser.studentId, agenda, serverNow, tx,
## );
const previous = await getLastAcceptedLog(attendance.id, tx);
let incrementSeconds = 0;
if (inside && previous?.isAccepted && previous.isInsideGeofence) {
const gap = Math.floor((serverNow - previous.serverTimestamp) / 1000);
if (gap > 0 && gap <= agenda.maximumAllowedGapSeconds) {
incrementSeconds = gap;
## }
## }
const actualSeconds = attendance.actualDurationSeconds + incrementSeconds;
const ratio = agenda.targetDurationSeconds > 0
? actualSeconds / agenda.targetDurationSeconds : 0;
await tx.locationLog.create({ data: buildLocationLog({
input, attendance, serverNow, distanceMeters, inside,
## })});
await tx.attendance.update({
where: { id: attendance.id },
data: {
actualDurationSeconds: actualSeconds,
fulfillmentRatio: ratio,
counterStatus: inside ? 'ACTIVE' : 'PAUSED',
lastValidLocationTime: inside ? serverNow : attendance.lastValidLocationTime,
## },
## });
return buildAttendanceResponse(attendance.id, tx);
## });
## }
Transaksi dan locking  Implementasi ORM harus memakai transaksi dan row-level lock atau

BERSEKA  |  Spesifikasi Teknis Presensi KKN
## Dokumen Teknis  •  13
mekanisme optimistic concurrency. Tujuannya mencegah dua sampel lokasi paralel
menambahkan interval yang sama.
- Rancangan API Express.js
MetodeEndpointFungsi
GET/v1/agendas/active
Mengambil agenda aktif dan
konfigurasi geofence.
POST/v1/attendance/check-in
Validasi awal dan memulai sesi
presensi.
POST/v1/attendance/location
Mengirim log lokasi dan
memperbarui durasi.
POST/v1/attendance/check-out
Menutup sesi dan menghasilkan
status sementara/final.
GET/v1/attendance/today
Mengambil timer, rasio, status, dan
anomali hari ini.
POST/v1/absence-requests
Mengajukan sakit atau izin berikut
bukti.
PATCH/v1/absence-requests/{id}
Verifikasi pengajuan oleh pihak
berwenang.
Idempotensi  Setiap request lokasi harus membawa requestId unik. Backend wajib menolak
duplikasi agar durasi tidak terhitung dua kali ketika antrean offline dikirim ulang.
17.1 Contoh route Express.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { processLocationSample } from '../services/attendance.service.js';
const router = express.Router();
router.post('/v1/attendance/location', authenticate, async (req, res, next) => {
try {
const result = await processLocationSample(req.body, req.user);
res.status(200).json({ success: true, data: result });
} catch (error) {
next(error);
## }
## });
export default router;

BERSEKA  |  Spesifikasi Teknis Presensi KKN
## Dokumen Teknis  •  14
17.2 Scheduler finalisasi otomatis
// Dijalankan periodik oleh worker/cron terdistribusi.
export async function finalizeExpiredAttendances() {
const now = new Date();
const sessions = await repository.findUnfinalizedEndedAgendas(now);
for (const session of sessions) {
await finalizeAttendanceOnServer(session.id, now);
## }
## }
Pada produksi dengan lebih dari satu instance Express.js, scheduler harus memakai distributed
lock atau job queue agar satu presensi tidak difinalisasi ganda.
- Arsitektur Server-Authoritative
LapisanKomponenPeran
## Mobile
Flutter, location service, secure
storage, offline queue
Mengirim bukti lokasi dan
menampilkan nilai hasil perhitungan
server.
API Express.js
Auth, schema validation, rate limit,
controller
Menerima sampel dan meneruskan
ke service; tanpa kalkulasi di
controller.
Engine server
Schedule validator, geofence
validator, duration accumulator,
classifier
Menjalankan seluruh kalkulasi dan
menghasilkan keputusan
deterministik.
## Data
Relational database, location log,
audit log
Menyimpan sumber kebenaran dan
jejak perubahan.
WorkerCron/job queue dan distributed lock
Auto-finalize agenda, rekonsiliasi log,
dan proses anomali.
DashboardAdmin, DPL, pengelola KKN
Konfigurasi, monitoring, verifikasi,
dan pelaporan.
Flutter Mobile   Express.js API   Validasi autentikasi & payload→→
Transaksi database   Validasi jadwal server & geofence→→
Akumulasi durasi   Rasio   Klasifikasi status→→→
Respons server   Flutter/Dashboard→→
Server merupakan satu-satunya sumber kebenaran. Waktu, jarak, interval, durasi, rasio,
progress, dan status akhir dihitung oleh Express.js. Flutter hanya menyajikan nilai terakhir dari
server dan dapat menampilkan estimasi visual sementara yang wajib diberi label “belum
tersinkronisasi” serta tidak disimpan sebagai nilai resmi.
- Keamanan, Privasi, dan Integritas Data
Gunakan waktu server sebagai acuan keputusan.

BERSEKA  |  Spesifikasi Teknis Presensi KKN
## Dokumen Teknis  •  15
Deteksi mock location dan tandai perangkat berisiko.
Periksa akurasi, usia lokasi, kecepatan perpindahan, dan konsistensi lintasan.
Batasi satu akun pada perangkat yang terdaftar sesuai kebijakan.
Gunakan token autentikasi, TLS, requestId, dan signature/nonces bila diperlukan.
Pisahkan hak akses mahasiswa, DPL, admin, dan pengelola wilayah.
Enkripsi data sensitif saat transit dan saat tersimpan.
Terapkan persetujuan pengguna untuk pelacakan lokasi selama agenda aktif.
Tetapkan masa retensi log rinci dan mekanisme penghapusan sesuai kebijakan.
Simpan audit trail atas perubahan konfigurasi, verifikasi izin, koreksi presensi, dan finalisasi.
Jangan melakukan pelacakan di luar waktu kegiatan kecuali terdapat dasar dan persetujuan
yang jelas.
- Kondisi Khusus dan Kebijakan Operasional
KondisiPerlakuan sistem
GPS mati/izin ditolak
Timer dijeda; aplikasi menampilkan instruksi
mengaktifkan GPS/izin.
Keluar geofence
Timer dijeda mulai titik valid terakhir; status tetap
## IN_PROGRESS.
Internet terputus
Log masuk antrean terenkripsi; sinkronisasi saat daring
dan divalidasi server.
Gap melebihi batas
Interval tidak dihitung otomatis dan dicatat sebagai
anomali.
Baterai/OS menghentikan background task
Notifikasi peringatan; durasi tanpa bukti lokasi tidak
dihitung.
Agenda dipindahkan
Gunakan versi agenda efektif; perubahan harus tercatat
dalam audit trail.
Dua agenda beririsanCegah dua sesi aktif atau tentukan prioritas eksplisit.
Check-out tidak dilakukanBackend melakukan auto-finalize saat agenda selesai.
Sakit/izin diajukan setelah agenda
Ikuti batas waktu pengajuan dan proses verifikasi
kebijakan KKN.
## 21. Skenario Pengujian Penerimaan
IDSkenarioHasil yang diharapkan
## TC-01
Check-in pada jadwal, di dalam
geofence, GPS akurat
Sesi aktif dan timer mulai.
TC-02Check-in di luar geofenceDitolak; jarak dan alasan tersimpan.

BERSEKA  |  Spesifikasi Teknis Presensi KKN
## Dokumen Teknis  •  16
IDSkenarioHasil yang diharapkan
TC-03Check-in di luar jam agendaDitolak sebagai outside schedule.
TC-04Aktual 240 menit dari target 240 menitHADIR_MEMENUHI, rasio 100%.
TC-05Aktual 180 menit dari target 240 menitHADIR_TIDAK_MEMENUHI, rasio 75%.
TC-06Tidak ada log dan sakit disetujuiSAKIT.
TC-07Tidak ada log dan izin disetujuiIZIN.
## TC-08
Tidak ada log/pengajuan setelah agenda
selesai
## TANPA_KETERANGAN.
TC-09Pengajuan izin masih pendingMENUNGGU_VERIFIKASI.
TC-10Keluar geofence selama 30 menit30 menit tidak dihitung.
TC-11Mock location terdeteksiLokasi ditolak dan security flag dibuat.
TC-12Request location dikirim ulangIdempotensi mencegah durasi ganda.
TC-13Internet terputus lalu sinkronisasi
Data diterima hanya jika lolos
kebijakan offline.
TC-14Aplikasi tidak check-out hingga 17.00Auto-finalize berjalan.
## 22. Contoh Rekap Hasil
MahasiswaAktualTargetRasioKeterangan
Mahasiswa A270 menit240 menit112,5%Hadir dan memenuhi
Mahasiswa B180 menit240 menit75%
Hadir dan tidak
memenuhi
Mahasiswa C0 menit240 menit0%Sakit
Mahasiswa D0 menit240 menit0%Izin
Mahasiswa E0 menit240 menit0%Tanpa keterangan
## 23. Kriteria Siap Implementasi
Konfigurasi agenda, geofence, target, dan toleransi tersedia di backend.
Satu sumber waktu server dan zona waktu telah ditetapkan.
Kontrak API, enum status, serta aturan idempotensi telah disepakati.
Flutter mampu mengirim lokasi foreground/background sesuai izin OS.
Backend mengakumulasi durasi secara deterministik dan dapat diuji ulang.

BERSEKA  |  Spesifikasi Teknis Presensi KKN
## Dokumen Teknis  •  17
Workflow sakit/izin memiliki pihak pemeriksa dan batas waktu keputusan.
Dashboard menampilkan raw log, anomali, rasio, dan status final.
Kebijakan privasi, retensi, akses, dan koreksi data telah disahkan.
Unit test, integration test, dan acceptance test TC-01 sampai TC-14 lulus.

BERSEKA  |  Spesifikasi Teknis Presensi KKN
## Dokumen Teknis  •  18
## 24. Kesimpulan
Algoritma presensi BERSEKA menggabungkan validasi identitas, agenda, waktu server, posisi
GPS, geofence, kualitas lokasi, dan durasi aktual. Mahasiswa baru dinyatakan hadir memenuhi
apabila akumulasi keberadaan valid mencapai target yang ditentukan admin. Sistem juga
mengakomodasi hadir tidak memenuhi, sakit, izin, dan tanpa keterangan melalui prioritas
klasifikasi yang eksplisit. Pemisahan tanggung jawab antara Flutter dan backend membuat
proses lebih aman, konsisten, transparan, serta dapat diaudit untuk kebutuhan pengelolaan
## KKN.
Rekomendasi final  Implementasikan engine keputusan sepenuhnya pada Express.js sebagai
layanan backend yang deterministik dan transaksional. Flutter hanya berfungsi sebagai sensor
lokasi, antarmuka, antrean sinkronisasi, dan penyaji respons server; bukan sumber kebenaran
waktu, geofence, durasi, rasio, maupun status.