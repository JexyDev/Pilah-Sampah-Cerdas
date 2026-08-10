--
-- PostgreSQL database dump
--

\restrict uM8KDaTnM198CdUTUoVw8Np3Vg1nfKP404L5sStWqnydxQG3krwbb6H4IyP5rHM

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.tugas_penjemputan DROP CONSTRAINT IF EXISTS tugas_penjemputan_id_tempat_sampah_fkey;
ALTER TABLE IF EXISTS ONLY public.tugas_penjemputan DROP CONSTRAINT IF EXISTS tugas_penjemputan_id_pengguna_mengklaim_fkey;
ALTER TABLE IF EXISTS ONLY public.token_penyegar DROP CONSTRAINT IF EXISTS token_penyegar_id_pengguna_fkey;
ALTER TABLE IF EXISTS ONLY public.tempat_sampah DROP CONSTRAINT IF EXISTS tempat_sampah_id_rw_fkey;
ALTER TABLE IF EXISTS ONLY public.tempat_sampah DROP CONSTRAINT IF EXISTS tempat_sampah_id_pengguna_fkey;
ALTER TABLE IF EXISTS ONLY public.tempat_sampah DROP CONSTRAINT IF EXISTS tempat_sampah_id_mahasiswa_pendaftar_fkey;
ALTER TABLE IF EXISTS ONLY public.tempat_sampah DROP CONSTRAINT IF EXISTS tempat_sampah_id_kelurahan_fkey;
ALTER TABLE IF EXISTS ONLY public.tempat_sampah DROP CONSTRAINT IF EXISTS tempat_sampah_id_kategori_fkey;
ALTER TABLE IF EXISTS ONLY public.tempat_sampah DROP CONSTRAINT IF EXISTS tempat_sampah_id_gelombang_qr_fkey;
ALTER TABLE IF EXISTS ONLY public.setoran_otomatis DROP CONSTRAINT IF EXISTS setoran_otomatis_warga_id_fkey;
ALTER TABLE IF EXISTS ONLY public.setoran_otomatis DROP CONSTRAINT IF EXISTS setoran_otomatis_qr_tempat_sampah_id_fkey;
ALTER TABLE IF EXISTS ONLY public.setoran_manual DROP CONSTRAINT IF EXISTS setoran_manual_rw_id_fkey;
ALTER TABLE IF EXISTS ONLY public.setoran_manual DROP CONSTRAINT IF EXISTS setoran_manual_petugas_residu_id_fkey;
ALTER TABLE IF EXISTS ONLY public.rw DROP CONSTRAINT IF EXISTS rw_id_petugas_residu_fkey;
ALTER TABLE IF EXISTS ONLY public.rw DROP CONSTRAINT IF EXISTS rw_id_kelurahan_fkey;
ALTER TABLE IF EXISTS ONLY public.rumah_tangga DROP CONSTRAINT IF EXISTS rumah_tangga_id_rw_fkey;
ALTER TABLE IF EXISTS ONLY public.rumah_tangga DROP CONSTRAINT IF EXISTS rumah_tangga_id_pengguna_fkey;
ALTER TABLE IF EXISTS ONLY public.rt DROP CONSTRAINT IF EXISTS rt_id_rw_fkey;
ALTER TABLE IF EXISTS ONLY public.riwayat_serah_terima_kkn DROP CONSTRAINT IF EXISTS riwayat_serah_terima_kkn_id_rw_fkey;
ALTER TABLE IF EXISTS ONLY public.riwayat_serah_terima_kkn DROP CONSTRAINT IF EXISTS riwayat_serah_terima_kkn_id_pengguna_ke_fkey;
ALTER TABLE IF EXISTS ONLY public.riwayat_serah_terima_kkn DROP CONSTRAINT IF EXISTS riwayat_serah_terima_kkn_id_pengguna_dari_fkey;
ALTER TABLE IF EXISTS ONLY public.riwayat_poin DROP CONSTRAINT IF EXISTS riwayat_poin_id_pengguna_fkey;
ALTER TABLE IF EXISTS ONLY public.petugas_residu DROP CONSTRAINT IF EXISTS petugas_residu_id_pengguna_fkey;
ALTER TABLE IF EXISTS ONLY public.pengguna DROP CONSTRAINT IF EXISTS pengguna_id_rw_fkey;
ALTER TABLE IF EXISTS ONLY public.pengguna DROP CONSTRAINT IF EXISTS pengguna_id_rt_fkey;
ALTER TABLE IF EXISTS ONLY public.pengguna DROP CONSTRAINT IF EXISTS pengguna_id_peran_fkey;
ALTER TABLE IF EXISTS ONLY public.pengajuan_izin_mahasiswa DROP CONSTRAINT IF EXISTS pengajuan_izin_mahasiswa_id_pereview_fkey;
ALTER TABLE IF EXISTS ONLY public.pengajuan_izin_mahasiswa DROP CONSTRAINT IF EXISTS pengajuan_izin_mahasiswa_id_mahasiswa_fkey;
ALTER TABLE IF EXISTS ONLY public.pengajuan_aktivasi_tempat_sampah DROP CONSTRAINT IF EXISTS pengajuan_aktivasi_tempat_sampah_id_tempat_sampah_fkey;
ALTER TABLE IF EXISTS ONLY public.pengajuan_aktivasi_tempat_sampah DROP CONSTRAINT IF EXISTS pengajuan_aktivasi_tempat_sampah_id_pereview_fkey;
ALTER TABLE IF EXISTS ONLY public.pengajuan_aktivasi_tempat_sampah DROP CONSTRAINT IF EXISTS pengajuan_aktivasi_tempat_sampah_id_pengguna_fkey;
ALTER TABLE IF EXISTS ONLY public.pemanfaatan_sampah DROP CONSTRAINT IF EXISTS pemanfaatan_sampah_id_rw_fkey;
ALTER TABLE IF EXISTS ONLY public.pelanggaran DROP CONSTRAINT IF EXISTS pelanggaran_id_tempat_sampah_fkey;
ALTER TABLE IF EXISTS ONLY public.pelanggaran DROP CONSTRAINT IF EXISTS pelanggaran_id_pengguna_petugas_fkey;
ALTER TABLE IF EXISTS ONLY public.pelanggaran DROP CONSTRAINT IF EXISTS pelanggaran_id_pengguna_fkey;
ALTER TABLE IF EXISTS ONLY public.notifikasi DROP CONSTRAINT IF EXISTS notifikasi_id_pengguna_fkey;
ALTER TABLE IF EXISTS ONLY public.mahasiswa_kkn DROP CONSTRAINT IF EXISTS mahasiswa_kkn_id_rw_ditugaskan_fkey;
ALTER TABLE IF EXISTS ONLY public.mahasiswa_kkn DROP CONSTRAINT IF EXISTS mahasiswa_kkn_id_pengguna_fkey;
ALTER TABLE IF EXISTS ONLY public.mahasiswa_kkn DROP CONSTRAINT IF EXISTS mahasiswa_kkn_id_kelompok_fkey;
ALTER TABLE IF EXISTS ONLY public.lokasi_mahasiswa DROP CONSTRAINT IF EXISTS lokasi_mahasiswa_id_mahasiswa_fkey;
ALTER TABLE IF EXISTS ONLY public.kepemilikan_tempat_sampah DROP CONSTRAINT IF EXISTS kepemilikan_tempat_sampah_id_tempat_sampah_fkey;
ALTER TABLE IF EXISTS ONLY public.kepemilikan_tempat_sampah DROP CONSTRAINT IF EXISTS kepemilikan_tempat_sampah_id_pengguna_fkey;
ALTER TABLE IF EXISTS ONLY public.kelurahan DROP CONSTRAINT IF EXISTS kelurahan_id_kecamatan_fkey;
ALTER TABLE IF EXISTS ONLY public.kelompok_kkn DROP CONSTRAINT IF EXISTS kelompok_kkn_id_dpl_fkey;
ALTER TABLE IF EXISTS ONLY public.kehadiran_kegiatan DROP CONSTRAINT IF EXISTS kehadiran_kegiatan_id_mahasiswa_fkey;
ALTER TABLE IF EXISTS ONLY public.kehadiran_kegiatan DROP CONSTRAINT IF EXISTS kehadiran_kegiatan_id_jadwal_fkey;
ALTER TABLE IF EXISTS ONLY public.kecamatan DROP CONSTRAINT IF EXISTS kecamatan_id_kabupaten_fkey;
ALTER TABLE IF EXISTS ONLY public.kabupaten DROP CONSTRAINT IF EXISTS kabupaten_id_provinsi_fkey;
ALTER TABLE IF EXISTS ONLY public.jejak_audit DROP CONSTRAINT IF EXISTS jejak_audit_id_pengguna_fkey;
ALTER TABLE IF EXISTS ONLY public.jadwal DROP CONSTRAINT IF EXISTS jadwal_id_kelompok_fkey;
ALTER TABLE IF EXISTS ONLY public.ide_daur_ulang DROP CONSTRAINT IF EXISTS ide_daur_ulang_id_pengguna_fkey;
ALTER TABLE IF EXISTS ONLY public.hak_akses DROP CONSTRAINT IF EXISTS hak_akses_id_peran_fkey;
ALTER TABLE IF EXISTS ONLY public.gelombang_qr DROP CONSTRAINT IF EXISTS gelombang_qr_id_pengguna_pic_ditugaskan_fkey;
ALTER TABLE IF EXISTS ONLY public.fasilitas DROP CONSTRAINT IF EXISTS fasilitas_id_rw_fkey;
ALTER TABLE IF EXISTS ONLY public.catatan_produksi_fasilitas DROP CONSTRAINT IF EXISTS catatan_produksi_fasilitas_id_fasilitas_fkey;
ALTER TABLE IF EXISTS ONLY public.catatan_permintaan_ai DROP CONSTRAINT IF EXISTS catatan_permintaan_ai_id_pengguna_fkey;
ALTER TABLE IF EXISTS ONLY public.catatan_distribusi_maggot DROP CONSTRAINT IF EXISTS catatan_distribusi_maggot_id_peternakan_fkey;
ALTER TABLE IF EXISTS ONLY public.buku_kas_bank_sampah DROP CONSTRAINT IF EXISTS buku_kas_bank_sampah_id_pengguna_fkey;
DROP INDEX IF EXISTS public.token_penyegar_token_key;
DROP INDEX IF EXISTS public.tempat_sampah_kode_qr_key;
DROP INDEX IF EXISTS public.rw_id_petugas_residu_key;
DROP INDEX IF EXISTS public.rw_id_kelurahan_nama_key;
DROP INDEX IF EXISTS public.rt_id_rw_nama_key;
DROP INDEX IF EXISTS public.provinsi_nama_key;
DROP INDEX IF EXISTS public.petugas_residu_id_pengguna_key;
DROP INDEX IF EXISTS public.peran_nama_key;
DROP INDEX IF EXISTS public.pengguna_no_telepon_key;
DROP INDEX IF EXISTS public.pemanfaatan_sampah_nomor_cara_pemanfaatan_key;
DROP INDEX IF EXISTS public.mahasiswa_kkn_nim_key;
DROP INDEX IF EXISTS public.mahasiswa_kkn_id_pengguna_key;
DROP INDEX IF EXISTS public.lokasi_mahasiswa_direkam_pada_idx;
DROP INDEX IF EXISTS public.kepemilikan_tempat_sampah_id_tempat_sampah_id_pengguna_key;
DROP INDEX IF EXISTS public.kelurahan_nama_key;
DROP INDEX IF EXISTS public.kelompok_kkn_nama_key;
DROP INDEX IF EXISTS public.kehadiran_kegiatan_id_mahasiswa_id_jadwal_key;
DROP INDEX IF EXISTS public.kecamatan_id_kabupaten_nama_key;
DROP INDEX IF EXISTS public.kategori_sampah_nama_key;
DROP INDEX IF EXISTS public.kabupaten_id_provinsi_nama_key;
DROP INDEX IF EXISTS public.hak_akses_id_peran_resource_key;
DROP INDEX IF EXISTS public.gelombang_qr_kode_gelombang_key;
DROP INDEX IF EXISTS public.catatan_permintaan_ai_id_permintaan_key;
DROP INDEX IF EXISTS public.buku_kas_bank_sampah_id_pengguna_key;
ALTER TABLE IF EXISTS ONLY public.tugas_penjemputan DROP CONSTRAINT IF EXISTS tugas_penjemputan_pkey;
ALTER TABLE IF EXISTS ONLY public.token_penyegar DROP CONSTRAINT IF EXISTS token_penyegar_pkey;
ALTER TABLE IF EXISTS ONLY public.tempat_sampah DROP CONSTRAINT IF EXISTS tempat_sampah_pkey;
ALTER TABLE IF EXISTS ONLY public.setoran_otomatis DROP CONSTRAINT IF EXISTS setoran_otomatis_pkey;
ALTER TABLE IF EXISTS ONLY public.setoran_manual DROP CONSTRAINT IF EXISTS setoran_manual_pkey;
ALTER TABLE IF EXISTS ONLY public.rw DROP CONSTRAINT IF EXISTS rw_pkey;
ALTER TABLE IF EXISTS ONLY public.rumah_tangga DROP CONSTRAINT IF EXISTS rumah_tangga_pkey;
ALTER TABLE IF EXISTS ONLY public.rt DROP CONSTRAINT IF EXISTS rt_pkey;
ALTER TABLE IF EXISTS ONLY public.riwayat_serah_terima_kkn DROP CONSTRAINT IF EXISTS riwayat_serah_terima_kkn_pkey;
ALTER TABLE IF EXISTS ONLY public.riwayat_poin DROP CONSTRAINT IF EXISTS riwayat_poin_pkey;
ALTER TABLE IF EXISTS ONLY public.provinsi DROP CONSTRAINT IF EXISTS provinsi_pkey;
ALTER TABLE IF EXISTS ONLY public.petugas_residu DROP CONSTRAINT IF EXISTS petugas_residu_pkey;
ALTER TABLE IF EXISTS ONLY public.peternakan DROP CONSTRAINT IF EXISTS peternakan_pkey;
ALTER TABLE IF EXISTS ONLY public.peran DROP CONSTRAINT IF EXISTS peran_pkey;
ALTER TABLE IF EXISTS ONLY public.pengguna DROP CONSTRAINT IF EXISTS pengguna_pkey;
ALTER TABLE IF EXISTS ONLY public.pengajuan_izin_mahasiswa DROP CONSTRAINT IF EXISTS pengajuan_izin_mahasiswa_pkey;
ALTER TABLE IF EXISTS ONLY public.pengajuan_aktivasi_tempat_sampah DROP CONSTRAINT IF EXISTS pengajuan_aktivasi_tempat_sampah_pkey;
ALTER TABLE IF EXISTS ONLY public.pemanfaatan_sampah DROP CONSTRAINT IF EXISTS pemanfaatan_sampah_pkey;
ALTER TABLE IF EXISTS ONLY public.pelanggaran DROP CONSTRAINT IF EXISTS pelanggaran_pkey;
ALTER TABLE IF EXISTS ONLY public.notifikasi DROP CONSTRAINT IF EXISTS notifikasi_pkey;
ALTER TABLE IF EXISTS ONLY public.mahasiswa_kkn DROP CONSTRAINT IF EXISTS mahasiswa_kkn_pkey;
ALTER TABLE IF EXISTS ONLY public.lokasi_mahasiswa DROP CONSTRAINT IF EXISTS lokasi_mahasiswa_pkey;
ALTER TABLE IF EXISTS ONLY public.konfigurasi_sistem DROP CONSTRAINT IF EXISTS konfigurasi_sistem_pkey;
ALTER TABLE IF EXISTS ONLY public.kode_otp DROP CONSTRAINT IF EXISTS kode_otp_pkey;
ALTER TABLE IF EXISTS ONLY public.kepemilikan_tempat_sampah DROP CONSTRAINT IF EXISTS kepemilikan_tempat_sampah_pkey;
ALTER TABLE IF EXISTS ONLY public.kelurahan DROP CONSTRAINT IF EXISTS kelurahan_pkey;
ALTER TABLE IF EXISTS ONLY public.kelompok_kkn DROP CONSTRAINT IF EXISTS kelompok_kkn_pkey;
ALTER TABLE IF EXISTS ONLY public.kehadiran_kegiatan DROP CONSTRAINT IF EXISTS kehadiran_kegiatan_pkey;
ALTER TABLE IF EXISTS ONLY public.kecamatan DROP CONSTRAINT IF EXISTS kecamatan_pkey;
ALTER TABLE IF EXISTS ONLY public.kategori_sampah DROP CONSTRAINT IF EXISTS kategori_sampah_pkey;
ALTER TABLE IF EXISTS ONLY public.kabupaten DROP CONSTRAINT IF EXISTS kabupaten_pkey;
ALTER TABLE IF EXISTS ONLY public.kabar_sosial DROP CONSTRAINT IF EXISTS kabar_sosial_pkey;
ALTER TABLE IF EXISTS ONLY public.jejak_audit DROP CONSTRAINT IF EXISTS jejak_audit_pkey;
ALTER TABLE IF EXISTS ONLY public.jadwal DROP CONSTRAINT IF EXISTS jadwal_pkey;
ALTER TABLE IF EXISTS ONLY public.ide_daur_ulang DROP CONSTRAINT IF EXISTS ide_daur_ulang_pkey;
ALTER TABLE IF EXISTS ONLY public.hak_akses DROP CONSTRAINT IF EXISTS hak_akses_pkey;
ALTER TABLE IF EXISTS ONLY public.gelombang_qr DROP CONSTRAINT IF EXISTS gelombang_qr_pkey;
ALTER TABLE IF EXISTS ONLY public.fasilitas DROP CONSTRAINT IF EXISTS fasilitas_pkey;
ALTER TABLE IF EXISTS ONLY public.catatan_produksi_fasilitas DROP CONSTRAINT IF EXISTS catatan_produksi_fasilitas_pkey;
ALTER TABLE IF EXISTS ONLY public.catatan_permintaan_ai DROP CONSTRAINT IF EXISTS catatan_permintaan_ai_pkey;
ALTER TABLE IF EXISTS ONLY public.catatan_notifikasi DROP CONSTRAINT IF EXISTS catatan_notifikasi_pkey;
ALTER TABLE IF EXISTS ONLY public.catatan_distribusi_maggot DROP CONSTRAINT IF EXISTS catatan_distribusi_maggot_pkey;
ALTER TABLE IF EXISTS ONLY public.buku_kas_bank_sampah DROP CONSTRAINT IF EXISTS buku_kas_bank_sampah_pkey;
ALTER TABLE IF EXISTS ONLY public.aksi_drop_sampah DROP CONSTRAINT IF EXISTS aksi_drop_sampah_pkey;
ALTER TABLE IF EXISTS public.rw ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.rt ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.provinsi ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.peran ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kecamatan ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kabupaten ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.hak_akses ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.tugas_penjemputan;
DROP TABLE IF EXISTS public.token_penyegar;
DROP TABLE IF EXISTS public.tempat_sampah;
DROP TABLE IF EXISTS public.setoran_otomatis;
DROP TABLE IF EXISTS public.setoran_manual;
DROP SEQUENCE IF EXISTS public.rw_id_seq;
DROP TABLE IF EXISTS public.rw;
DROP TABLE IF EXISTS public.rumah_tangga;
DROP SEQUENCE IF EXISTS public.rt_id_seq;
DROP TABLE IF EXISTS public.rt;
DROP TABLE IF EXISTS public.riwayat_serah_terima_kkn;
DROP TABLE IF EXISTS public.riwayat_poin;
DROP SEQUENCE IF EXISTS public.provinsi_id_seq;
DROP TABLE IF EXISTS public.provinsi;
DROP TABLE IF EXISTS public.petugas_residu;
DROP TABLE IF EXISTS public.peternakan;
DROP SEQUENCE IF EXISTS public.peran_id_seq;
DROP TABLE IF EXISTS public.peran;
DROP TABLE IF EXISTS public.pengguna;
DROP TABLE IF EXISTS public.pengajuan_izin_mahasiswa;
DROP TABLE IF EXISTS public.pengajuan_aktivasi_tempat_sampah;
DROP TABLE IF EXISTS public.pemanfaatan_sampah;
DROP TABLE IF EXISTS public.pelanggaran;
DROP TABLE IF EXISTS public.notifikasi;
DROP TABLE IF EXISTS public.mahasiswa_kkn;
DROP TABLE IF EXISTS public.lokasi_mahasiswa;
DROP TABLE IF EXISTS public.konfigurasi_sistem;
DROP TABLE IF EXISTS public.kode_otp;
DROP TABLE IF EXISTS public.kepemilikan_tempat_sampah;
DROP TABLE IF EXISTS public.kelurahan;
DROP TABLE IF EXISTS public.kelompok_kkn;
DROP TABLE IF EXISTS public.kehadiran_kegiatan;
DROP SEQUENCE IF EXISTS public.kecamatan_id_seq;
DROP TABLE IF EXISTS public.kecamatan;
DROP TABLE IF EXISTS public.kategori_sampah;
DROP SEQUENCE IF EXISTS public.kabupaten_id_seq;
DROP TABLE IF EXISTS public.kabupaten;
DROP TABLE IF EXISTS public.kabar_sosial;
DROP TABLE IF EXISTS public.jejak_audit;
DROP TABLE IF EXISTS public.jadwal;
DROP TABLE IF EXISTS public.ide_daur_ulang;
DROP SEQUENCE IF EXISTS public.hak_akses_id_seq;
DROP TABLE IF EXISTS public.hak_akses;
DROP TABLE IF EXISTS public.gelombang_qr;
DROP TABLE IF EXISTS public.fasilitas;
DROP TABLE IF EXISTS public.catatan_produksi_fasilitas;
DROP TABLE IF EXISTS public.catatan_permintaan_ai;
DROP TABLE IF EXISTS public.catatan_notifikasi;
DROP TABLE IF EXISTS public.catatan_distribusi_maggot;
DROP TABLE IF EXISTS public.buku_kas_bank_sampah;
DROP TABLE IF EXISTS public.aksi_drop_sampah;
DROP TYPE IF EXISTS public."OwnershipType";
DROP TYPE IF EXISTS public."FacilityType";
DROP TYPE IF EXISTS public."DispatchStatus";
DROP TYPE IF EXISTS public."BinStatus";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: psc_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO psc_user;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: psc_user
--

COMMENT ON SCHEMA public IS '';


--
-- Name: BinStatus; Type: TYPE; Schema: public; Owner: psc_user
--

CREATE TYPE public."BinStatus" AS ENUM (
    'PRINTED',
    'ASSIGNED_TO_PIC',
    'ACTIVE_BOUND',
    'BROKEN',
    'INACTIVE',
    'PENDING_APPROVAL'
);


ALTER TYPE public."BinStatus" OWNER TO psc_user;

--
-- Name: DispatchStatus; Type: TYPE; Schema: public; Owner: psc_user
--

CREATE TYPE public."DispatchStatus" AS ENUM (
    'PENDING',
    'CLAIMED',
    'COMPLETED',
    'ESCALATED'
);


ALTER TYPE public."DispatchStatus" OWNER TO psc_user;

--
-- Name: FacilityType; Type: TYPE; Schema: public; Owner: psc_user
--

CREATE TYPE public."FacilityType" AS ENUM (
    'loseda',
    'bata_terawang',
    'rumah_maggot',
    'bank_sampah',
    'tps',
    'buruan_sae',
    'poc'
);


ALTER TYPE public."FacilityType" OWNER TO psc_user;

--
-- Name: OwnershipType; Type: TYPE; Schema: public; Owner: psc_user
--

CREATE TYPE public."OwnershipType" AS ENUM (
    'UTAMA',
    'TAMBAHAN'
);


ALTER TYPE public."OwnershipType" OWNER TO psc_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: aksi_drop_sampah; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.aksi_drop_sampah (
    id text NOT NULL,
    title text NOT NULL,
    latitude numeric(11,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    radius integer DEFAULT 100 NOT NULL,
    points integer DEFAULT 50 NOT NULL,
    waktu_mulai timestamp(3) without time zone NOT NULL,
    waktu_selesai timestamp(3) without time zone NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.aksi_drop_sampah OWNER TO psc_user;

--
-- Name: buku_kas_bank_sampah; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.buku_kas_bank_sampah (
    id text NOT NULL,
    id_pengguna text NOT NULL,
    saldo_rupiah numeric(12,2) DEFAULT 0.0 NOT NULL,
    riwayat_transaksi jsonb DEFAULT '[]'::jsonb NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.buku_kas_bank_sampah OWNER TO psc_user;

--
-- Name: catatan_distribusi_maggot; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.catatan_distribusi_maggot (
    id text NOT NULL,
    id_peternakan text NOT NULL,
    kuantitas_kg numeric(10,2) NOT NULL,
    tanggal timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.catatan_distribusi_maggot OWNER TO psc_user;

--
-- Name: catatan_notifikasi; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.catatan_notifikasi (
    id text NOT NULL,
    channel text NOT NULL,
    tujuan text NOT NULL,
    status_kirim text NOT NULL,
    tipe_pemicu text NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.catatan_notifikasi OWNER TO psc_user;

--
-- Name: catatan_permintaan_ai; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.catatan_permintaan_ai (
    id text NOT NULL,
    id_pengguna text NOT NULL,
    id_permintaan uuid NOT NULL,
    url_gambar text NOT NULL,
    status_hasil text NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.catatan_permintaan_ai OWNER TO psc_user;

--
-- Name: catatan_produksi_fasilitas; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.catatan_produksi_fasilitas (
    id text NOT NULL,
    id_fasilitas text NOT NULL,
    material_masuk_kg numeric(10,2) NOT NULL,
    output_kg numeric(10,2) NOT NULL,
    jenis_output text NOT NULL,
    periode text NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.catatan_produksi_fasilitas OWNER TO psc_user;

--
-- Name: fasilitas; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.fasilitas (
    id text NOT NULL,
    jenis public."FacilityType" NOT NULL,
    nama text NOT NULL,
    pic text NOT NULL,
    foto text,
    kontak text,
    kapasitas numeric(10,2),
    latitude numeric(11,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL,
    id_rw integer,
    status_persetujuan text DEFAULT 'PENDING'::text NOT NULL
);


ALTER TABLE public.fasilitas OWNER TO psc_user;

--
-- Name: gelombang_qr; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.gelombang_qr (
    id text NOT NULL,
    kode_gelombang text NOT NULL,
    status text NOT NULL,
    id_pengguna_pic_ditugaskan text,
    total_qr integer NOT NULL,
    dicetak_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.gelombang_qr OWNER TO psc_user;

--
-- Name: hak_akses; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.hak_akses (
    id integer NOT NULL,
    id_peran integer NOT NULL,
    resource text NOT NULL,
    bisa_lihat boolean DEFAULT false NOT NULL,
    bisa_buat boolean DEFAULT false NOT NULL,
    bisa_edit boolean DEFAULT false NOT NULL,
    bisa_hapus boolean DEFAULT false NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.hak_akses OWNER TO psc_user;

--
-- Name: hak_akses_id_seq; Type: SEQUENCE; Schema: public; Owner: psc_user
--

CREATE SEQUENCE public.hak_akses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hak_akses_id_seq OWNER TO psc_user;

--
-- Name: hak_akses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: psc_user
--

ALTER SEQUENCE public.hak_akses_id_seq OWNED BY public.hak_akses.id;


--
-- Name: ide_daur_ulang; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.ide_daur_ulang (
    id text NOT NULL,
    id_pengguna text NOT NULL,
    judul text NOT NULL,
    foto text,
    material text NOT NULL,
    status_persetujuan text DEFAULT 'PENDING'::text NOT NULL,
    disetujui_oleh text,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ide_daur_ulang OWNER TO psc_user;

--
-- Name: jadwal; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.jadwal (
    id text NOT NULL,
    title text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "time" text,
    category text NOT NULL,
    location text,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL,
    latitude numeric(11,8),
    longitude numeric(11,8),
    polygon jsonb,
    radius integer DEFAULT 100,
    id_kelompok text
);


ALTER TABLE public.jadwal OWNER TO psc_user;

--
-- Name: jejak_audit; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.jejak_audit (
    id text NOT NULL,
    action text NOT NULL,
    id_pengguna text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    nilai_lama jsonb,
    nilai_baru jsonb
);


ALTER TABLE public.jejak_audit OWNER TO psc_user;

--
-- Name: kabar_sosial; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.kabar_sosial (
    id text NOT NULL,
    tipe text NOT NULL,
    deskripsi text NOT NULL,
    id_pengguna text,
    id_entitas text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.kabar_sosial OWNER TO psc_user;

--
-- Name: kabupaten; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.kabupaten (
    id integer NOT NULL,
    id_provinsi integer NOT NULL,
    nama text NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.kabupaten OWNER TO psc_user;

--
-- Name: kabupaten_id_seq; Type: SEQUENCE; Schema: public; Owner: psc_user
--

CREATE SEQUENCE public.kabupaten_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.kabupaten_id_seq OWNER TO psc_user;

--
-- Name: kabupaten_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: psc_user
--

ALTER SEQUENCE public.kabupaten_id_seq OWNED BY public.kabupaten.id;


--
-- Name: kategori_sampah; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.kategori_sampah (
    id text NOT NULL,
    nama text NOT NULL,
    poin_per_kg integer NOT NULL,
    description text,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.kategori_sampah OWNER TO psc_user;

--
-- Name: kecamatan; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.kecamatan (
    id integer NOT NULL,
    id_kabupaten integer NOT NULL,
    nama text NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.kecamatan OWNER TO psc_user;

--
-- Name: kecamatan_id_seq; Type: SEQUENCE; Schema: public; Owner: psc_user
--

CREATE SEQUENCE public.kecamatan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.kecamatan_id_seq OWNER TO psc_user;

--
-- Name: kecamatan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: psc_user
--

ALTER SEQUENCE public.kecamatan_id_seq OWNED BY public.kecamatan.id;


--
-- Name: kehadiran_kegiatan; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.kehadiran_kegiatan (
    id text NOT NULL,
    id_mahasiswa text NOT NULL,
    id_jadwal text NOT NULL,
    waktu_absen timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metode text NOT NULL,
    latitude numeric(11,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    waktu_checkout timestamp(3) without time zone,
    status text DEFAULT 'DALAM_RADIUS'::text NOT NULL
);


ALTER TABLE public.kehadiran_kegiatan OWNER TO psc_user;

--
-- Name: kelompok_kkn; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.kelompok_kkn (
    id text NOT NULL,
    nama text NOT NULL,
    kelurahan text,
    cakupan_rw jsonb,
    dpl_nama_mentah text,
    id_dpl text,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.kelompok_kkn OWNER TO psc_user;

--
-- Name: kelurahan; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.kelurahan (
    id text NOT NULL,
    id_kecamatan integer,
    nama text NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.kelurahan OWNER TO psc_user;

--
-- Name: kepemilikan_tempat_sampah; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.kepemilikan_tempat_sampah (
    id text NOT NULL,
    id_tempat_sampah text NOT NULL,
    id_pengguna text NOT NULL,
    tipe_kepemilikan public."OwnershipType" NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.kepemilikan_tempat_sampah OWNER TO psc_user;

--
-- Name: kode_otp; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.kode_otp (
    id text NOT NULL,
    phone text NOT NULL,
    code text NOT NULL,
    kedaluwarsa_pada timestamp(3) without time zone NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    used boolean DEFAULT false NOT NULL
);


ALTER TABLE public.kode_otp OWNER TO psc_user;

--
-- Name: konfigurasi_sistem; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.konfigurasi_sistem (
    key text NOT NULL,
    value text NOT NULL,
    tipe text NOT NULL,
    deskripsi text,
    diperbarui_oleh text,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.konfigurasi_sistem OWNER TO psc_user;

--
-- Name: lokasi_mahasiswa; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.lokasi_mahasiswa (
    id text NOT NULL,
    id_mahasiswa text NOT NULL,
    latitude numeric(11,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    direkam_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.lokasi_mahasiswa OWNER TO psc_user;

--
-- Name: mahasiswa_kkn; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.mahasiswa_kkn (
    id text NOT NULL,
    id_pengguna text NOT NULL,
    nim text,
    jurusan text NOT NULL,
    fakultas text NOT NULL,
    no_wa text NOT NULL,
    tanggal_mulai timestamp(3) without time zone NOT NULL,
    tanggal_selesai timestamp(3) without time zone NOT NULL,
    id_rw_ditugaskan integer,
    status_whitelist text DEFAULT 'PENDING'::text NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL,
    id_kelompok text,
    skor_penilaian_dpl numeric(5,2) DEFAULT 0.0,
    is_ketua boolean DEFAULT false NOT NULL
);


ALTER TABLE public.mahasiswa_kkn OWNER TO psc_user;

--
-- Name: notifikasi; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.notifikasi (
    id text NOT NULL,
    id_pengguna text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    sudah_dibaca boolean DEFAULT false NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifikasi OWNER TO psc_user;

--
-- Name: pelanggaran; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.pelanggaran (
    id text NOT NULL,
    id_pengguna text NOT NULL,
    id_tempat_sampah text,
    id_pengguna_petugas text NOT NULL,
    type text NOT NULL,
    severity text NOT NULL,
    url_foto_bukti text NOT NULL,
    notes text,
    poin_dikurangi integer NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.pelanggaran OWNER TO psc_user;

--
-- Name: pemanfaatan_sampah; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.pemanfaatan_sampah (
    id text NOT NULL,
    id_rw integer NOT NULL,
    nomor_cara_pemanfaatan text NOT NULL,
    program text NOT NULL,
    teknologi text NOT NULL,
    bahan_baku text NOT NULL,
    volume_bahan_baku numeric(10,2) NOT NULL,
    unit_bahan_baku text NOT NULL,
    hasil numeric(10,2) NOT NULL,
    unit_hasil text NOT NULL,
    foto_dokumentasi_url text NOT NULL,
    tanggal_pencatatan timestamp(3) without time zone NOT NULL,
    jenis_komoditas text,
    luas_lahan_m2 numeric(8,2),
    volume_pupuk_dipakai_kg numeric(10,2),
    bibit_telur_gram numeric(8,2),
    hasil_kasgot_kg numeric(10,2),
    volume_bioaktivator_liter numeric(8,2),
    masa_fermentasi_hari integer,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.pemanfaatan_sampah OWNER TO psc_user;

--
-- Name: pengajuan_aktivasi_tempat_sampah; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.pengajuan_aktivasi_tempat_sampah (
    id text NOT NULL,
    id_tempat_sampah text NOT NULL,
    id_pengguna text NOT NULL,
    url_foto_bukti text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    id_pereview text,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pengajuan_aktivasi_tempat_sampah OWNER TO psc_user;

--
-- Name: pengajuan_izin_mahasiswa; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.pengajuan_izin_mahasiswa (
    id text NOT NULL,
    id_mahasiswa text NOT NULL,
    tipe text NOT NULL,
    alasan text NOT NULL,
    url_bukti text,
    tanggal_mulai timestamp(3) without time zone NOT NULL,
    tanggal_selesai timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    id_pereview text,
    direview_pada timestamp(3) without time zone,
    alasan_penolakan text,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pengajuan_izin_mahasiswa OWNER TO psc_user;

--
-- Name: pengguna; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.pengguna (
    id text NOT NULL,
    nama text NOT NULL,
    kata_sandi text NOT NULL,
    token_fcm text,
    id_peran integer NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL,
    foto_profil text,
    id_rw integer,
    id_rt integer,
    status text DEFAULT 'Aktif'::text NOT NULL,
    alamat text,
    no_telepon text NOT NULL,
    harus_ganti_password boolean DEFAULT false NOT NULL,
    subtipe_warga text
);


ALTER TABLE public.pengguna OWNER TO psc_user;

--
-- Name: peran; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.peran (
    id integer NOT NULL,
    nama text NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.peran OWNER TO psc_user;

--
-- Name: peran_id_seq; Type: SEQUENCE; Schema: public; Owner: psc_user
--

CREATE SEQUENCE public.peran_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.peran_id_seq OWNER TO psc_user;

--
-- Name: peran_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: psc_user
--

ALTER SEQUENCE public.peran_id_seq OWNED BY public.peran.id;


--
-- Name: peternakan; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.peternakan (
    id text NOT NULL,
    nama text NOT NULL,
    pemilik text NOT NULL,
    no_wa text NOT NULL,
    populasi integer DEFAULT 0 NOT NULL,
    hasil_panen_kg numeric(10,2) DEFAULT 0.00 NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.peternakan OWNER TO psc_user;

--
-- Name: petugas_residu; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.petugas_residu (
    id text NOT NULL,
    id_pengguna text NOT NULL,
    nama text NOT NULL,
    no_wa text NOT NULL,
    skor_kpi numeric(5,2) DEFAULT 100.0 NOT NULL,
    zona_ditugaskan text,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL,
    latitude numeric(11,8),
    longitude numeric(11,8),
    status_whitelist text DEFAULT 'PENDING'::text NOT NULL
);


ALTER TABLE public.petugas_residu OWNER TO psc_user;

--
-- Name: provinsi; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.provinsi (
    id integer NOT NULL,
    nama text NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.provinsi OWNER TO psc_user;

--
-- Name: provinsi_id_seq; Type: SEQUENCE; Schema: public; Owner: psc_user
--

CREATE SEQUENCE public.provinsi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.provinsi_id_seq OWNER TO psc_user;

--
-- Name: provinsi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: psc_user
--

ALTER SEQUENCE public.provinsi_id_seq OWNED BY public.provinsi.id;


--
-- Name: riwayat_poin; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.riwayat_poin (
    id text NOT NULL,
    id_pengguna text NOT NULL,
    points integer NOT NULL,
    description text NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    kategori text DEFAULT 'REDUKSI_TONASE'::text NOT NULL,
    redeemable boolean DEFAULT false NOT NULL
);


ALTER TABLE public.riwayat_poin OWNER TO psc_user;

--
-- Name: riwayat_serah_terima_kkn; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.riwayat_serah_terima_kkn (
    id text NOT NULL,
    id_pengguna_dari text NOT NULL,
    id_pengguna_ke text NOT NULL,
    id_rw integer NOT NULL,
    notes text,
    tanggal_serah_terima timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.riwayat_serah_terima_kkn OWNER TO psc_user;

--
-- Name: rt; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.rt (
    id integer NOT NULL,
    id_rw integer NOT NULL,
    nama text NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.rt OWNER TO psc_user;

--
-- Name: rt_id_seq; Type: SEQUENCE; Schema: public; Owner: psc_user
--

CREATE SEQUENCE public.rt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rt_id_seq OWNER TO psc_user;

--
-- Name: rt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: psc_user
--

ALTER SEQUENCE public.rt_id_seq OWNED BY public.rt.id;


--
-- Name: rumah_tangga; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.rumah_tangga (
    id text NOT NULL,
    id_pengguna text NOT NULL,
    address text NOT NULL,
    id_rw integer NOT NULL,
    latitude numeric(11,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.rumah_tangga OWNER TO psc_user;

--
-- Name: rw; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.rw (
    id integer NOT NULL,
    id_kelurahan text NOT NULL,
    nama text NOT NULL,
    latitude numeric(11,8),
    longitude numeric(11,8),
    id_petugas_residu text,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.rw OWNER TO psc_user;

--
-- Name: rw_id_seq; Type: SEQUENCE; Schema: public; Owner: psc_user
--

CREATE SEQUENCE public.rw_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rw_id_seq OWNER TO psc_user;

--
-- Name: rw_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: psc_user
--

ALTER SEQUENCE public.rw_id_seq OWNED BY public.rw.id;


--
-- Name: setoran_manual; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.setoran_manual (
    id text NOT NULL,
    petugas_residu_id text NOT NULL,
    diinput_oleh text NOT NULL,
    rw_id integer NOT NULL,
    foto_residu_url text NOT NULL,
    berat numeric(10,2) NOT NULL,
    unit text DEFAULT 'Kg'::text NOT NULL,
    lokasi_gps text,
    kategori text DEFAULT 'residu'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.setoran_manual OWNER TO psc_user;

--
-- Name: setoran_otomatis; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.setoran_otomatis (
    id text NOT NULL,
    warga_id text NOT NULL,
    foto_sampah_url text NOT NULL,
    hasil_klasifikasi_ai text NOT NULL,
    confidence_ai numeric(5,2) NOT NULL,
    berat numeric(10,2) NOT NULL,
    unit text DEFAULT 'Kg'::text NOT NULL,
    poin numeric(10,2) NOT NULL,
    qr_tempat_sampah_id text NOT NULL,
    lokasi_gps text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.setoran_otomatis OWNER TO psc_user;

--
-- Name: tempat_sampah; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.tempat_sampah (
    id text NOT NULL,
    kode_qr text NOT NULL,
    id_kategori text,
    maks_kapasitas_liter numeric(5,2) DEFAULT 25.0 NOT NULL,
    volume_sekarang_liter numeric(5,2) DEFAULT 0.0 NOT NULL,
    id_rw integer,
    id_kelurahan text,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL,
    latitude numeric(11,8),
    longitude numeric(11,8),
    id_gelombang_qr text,
    status public."BinStatus" DEFAULT 'PRINTED'::public."BinStatus" NOT NULL,
    id_pengguna text,
    bentuk text,
    diameter numeric(5,2),
    id_mahasiswa_pendaftar text,
    lebar numeric(5,2),
    panjang numeric(5,2),
    tinggi numeric(5,2),
    tipe_wadah text
);


ALTER TABLE public.tempat_sampah OWNER TO psc_user;

--
-- Name: token_penyegar; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.token_penyegar (
    id text NOT NULL,
    id_pengguna text NOT NULL,
    token text NOT NULL,
    kedaluwarsa_pada timestamp(3) without time zone NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.token_penyegar OWNER TO psc_user;

--
-- Name: tugas_penjemputan; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.tugas_penjemputan (
    id text NOT NULL,
    id_tempat_sampah text NOT NULL,
    status public."DispatchStatus" DEFAULT 'PENDING'::public."DispatchStatus" NOT NULL,
    id_pengguna_mengklaim text,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tugas_penjemputan OWNER TO psc_user;

--
-- Name: hak_akses id; Type: DEFAULT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.hak_akses ALTER COLUMN id SET DEFAULT nextval('public.hak_akses_id_seq'::regclass);


--
-- Name: kabupaten id; Type: DEFAULT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kabupaten ALTER COLUMN id SET DEFAULT nextval('public.kabupaten_id_seq'::regclass);


--
-- Name: kecamatan id; Type: DEFAULT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kecamatan ALTER COLUMN id SET DEFAULT nextval('public.kecamatan_id_seq'::regclass);


--
-- Name: peran id; Type: DEFAULT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.peran ALTER COLUMN id SET DEFAULT nextval('public.peran_id_seq'::regclass);


--
-- Name: provinsi id; Type: DEFAULT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.provinsi ALTER COLUMN id SET DEFAULT nextval('public.provinsi_id_seq'::regclass);


--
-- Name: rt id; Type: DEFAULT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.rt ALTER COLUMN id SET DEFAULT nextval('public.rt_id_seq'::regclass);


--
-- Name: rw id; Type: DEFAULT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.rw ALTER COLUMN id SET DEFAULT nextval('public.rw_id_seq'::regclass);


--
-- Data for Name: aksi_drop_sampah; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.aksi_drop_sampah (id, title, latitude, longitude, radius, points, waktu_mulai, waktu_selesai, dibuat_pada, diperbarui_pada) FROM stdin;
\.


--
-- Data for Name: buku_kas_bank_sampah; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.buku_kas_bank_sampah (id, id_pengguna, saldo_rupiah, riwayat_transaksi, dibuat_pada, diperbarui_pada) FROM stdin;
\.


--
-- Data for Name: catatan_distribusi_maggot; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.catatan_distribusi_maggot (id, id_peternakan, kuantitas_kg, tanggal, dibuat_pada) FROM stdin;
\.


--
-- Data for Name: catatan_notifikasi; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.catatan_notifikasi (id, channel, tujuan, status_kirim, tipe_pemicu, dibuat_pada) FROM stdin;
\.


--
-- Data for Name: catatan_permintaan_ai; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.catatan_permintaan_ai (id, id_pengguna, id_permintaan, url_gambar, status_hasil, dibuat_pada) FROM stdin;
3c35d769-1a4a-4b7c-85ea-c20be1bf7c0a	3751704c-c631-4217-920a-ccda56bae879	e6b4a0fa-2a8b-4f03-aa39-aaae6a7ce6c1	/uploads/1786302807146-d892e7a4-9b46-4d7f-aecf-085cbd4a983e.jpg	IMAGE_UNREADABLE	2026-08-09 19:13:28.424
33b315d9-49ad-4355-9760-810c44e76bbd	3751704c-c631-4217-920a-ccda56bae879	29981320-281d-4db2-a9d0-c552f20fb251	/uploads/1786302818017-c21d4e8d-f01e-4f02-ae8f-bac6f6e5f537.jpg	SUCCESS	2026-08-09 19:13:39.222
7e1b30a8-caaf-4a05-a6be-7298b9df2662	3751704c-c631-4217-920a-ccda56bae879	dfe6c316-6704-49ed-8e80-fd39cb403f20	/uploads/1786302873656-8d55c235-f72c-4c8b-aa68-95fd1655b7b1.jpg	SUCCESS	2026-08-09 19:14:34.863
5f9e0590-b859-402b-ae23-4d230c407ee4	3751704c-c631-4217-920a-ccda56bae879	24021271-c069-47da-909c-ced010ec24c8	/uploads/1786302885143-189a602b-35af-40ec-b78f-b00f2369273f.jpg	SUCCESS	2026-08-09 19:14:46.35
1184951d-39c9-4228-836a-190c63ef1e1c	3751704c-c631-4217-920a-ccda56bae879	147a01bc-9242-463a-a308-c70887f21459	/uploads/1786302898313-bca71c85-d530-4520-bbdc-a4ad64267765.jpg	TIMEOUT	2026-08-09 19:15:00.32
ff3865f2-05c0-43f6-a9a8-9e52b3cdde74	3751704c-c631-4217-920a-ccda56bae879	54e0ea16-ea68-4d40-972b-3f4e5cbaf0cc	/uploads/1786302905000-2f822bff-f7a3-4e00-9d05-550faea964d7.jpg	SUCCESS	2026-08-09 19:15:06.207
4928194f-33b4-49a7-a257-e4a56d1d14d1	3751704c-c631-4217-920a-ccda56bae879	47dafd76-7006-4a7c-9f10-27b75ea106d3	/uploads/1786302916527-3540e03c-ba44-4bc3-9554-6b91fe56ea67.jpg	TIMEOUT	2026-08-09 19:15:18.543
d0763413-440a-4358-a7f7-d98172c56d1b	3751704c-c631-4217-920a-ccda56bae879	05ec8295-4ef7-44b1-943e-0e113f867801	/uploads/1786302923474-93f7860e-5b90-42c6-adf8-3d83b1be5892.jpg	SUCCESS	2026-08-09 19:15:24.679
8698f78c-ca6e-4c3a-af86-8ed7df8a8a7e	3751704c-c631-4217-920a-ccda56bae879	027ae9f0-2a4a-4a0d-8c3e-484427820ec1	/uploads/1786302932683-6613cae9-3d81-4540-850f-17906b67d4cd.jpg	SUCCESS	2026-08-09 19:15:33.892
8af9450d-9686-4f09-ac99-1da992094988	3751704c-c631-4217-920a-ccda56bae879	ad73393c-4083-4b2a-91b5-6407420ea3c8	/uploads/1786302940955-538e3dab-fed8-47f3-8c12-abf6f79f60d1.jpg	IMAGE_UNREADABLE	2026-08-09 19:15:42.163
840c6591-47ba-4c89-b805-09a9c2cc61ed	3751704c-c631-4217-920a-ccda56bae879	ff21b8e1-6e7b-48bf-bf8d-6d8b24192c32	/uploads/1786302945647-5413b2fc-5750-4fea-8e1f-c70bdc8a21c8.jpg	IMAGE_UNREADABLE	2026-08-09 19:15:46.853
6bb8ceac-6dd4-49d0-9615-cd9cc018895b	3751704c-c631-4217-920a-ccda56bae879	1ebb3c55-5aad-421b-91cd-a96ac34d2b6d	/uploads/1786302951074-e694c1bd-4942-4e3c-8461-d0b8f9d98caa.jpg	IMAGE_UNREADABLE	2026-08-09 19:15:52.279
c2c301a9-a36d-41fb-acbd-7e74adbbff9f	3751704c-c631-4217-920a-ccda56bae879	b6d2783f-b429-4797-ab01-be10e3ebe80f	/uploads/1786302957207-faf330b9-affa-495b-a874-dec821740812.jpg	IMAGE_UNREADABLE	2026-08-09 19:15:58.413
62c1517a-f980-4f47-b882-b1184ce08cc8	3751704c-c631-4217-920a-ccda56bae879	08b7554c-7424-4958-97ce-d62b1b57b825	/uploads/1786302961452-a4351c65-ee19-4a90-9a76-0d284f3a8f42.jpg	SUCCESS	2026-08-09 19:16:02.656
\.


--
-- Data for Name: catatan_produksi_fasilitas; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.catatan_produksi_fasilitas (id, id_fasilitas, material_masuk_kg, output_kg, jenis_output, periode, dibuat_pada) FROM stdin;
\.


--
-- Data for Name: fasilitas; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.fasilitas (id, jenis, nama, pic, foto, kontak, kapasitas, latitude, longitude, dibuat_pada, diperbarui_pada, id_rw, status_persetujuan) FROM stdin;
\.


--
-- Data for Name: gelombang_qr; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.gelombang_qr (id, kode_gelombang, status, id_pengguna_pic_ditugaskan, total_qr, dicetak_pada, dibuat_pada, diperbarui_pada) FROM stdin;
e8e27b9e-da06-4ec8-b6f7-c5e6c0b292b2	BATCH-001	PRINTED	\N	1	2026-08-09 19:12:51.316	2026-08-09 19:12:51.316	2026-08-09 19:12:51.316
67acd4d5-b1a4-4946-9dc5-1a1e3ec1e5b4	BATCH-002	PRINTED	\N	1	2026-08-09 19:12:55.372	2026-08-09 19:12:55.372	2026-08-09 19:12:55.372
\.


--
-- Data for Name: hak_akses; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.hak_akses (id, id_peran, resource, bisa_lihat, bisa_buat, bisa_edit, bisa_hapus, diperbarui_pada) FROM stdin;
40	11	dashboard_utama	t	f	f	f	2026-08-10 12:09:52.021
41	11	manajemen_tempat_sampah	t	t	f	f	2026-08-10 12:09:52.035
42	11	poin_warga	t	f	f	f	2026-08-10 12:09:52.048
43	9	dashboard_utama	t	f	f	f	2026-08-10 12:09:52.059
44	7	dashboard_utama	t	f	f	f	2026-08-10 12:09:52.069
45	7	dashboard_kkn	t	f	f	f	2026-08-10 12:09:52.082
46	7	monitoring_sampah	t	f	f	f	2026-08-10 12:09:52.097
47	7	laporan_analitik	t	f	f	f	2026-08-10 12:09:52.109
48	8	dashboard_utama	t	f	f	f	2026-08-10 12:09:52.121
49	8	dashboard_kkn	t	t	t	f	2026-08-10 12:09:52.136
50	8	manajemen_mahasiswa	t	t	t	f	2026-08-10 12:09:52.146
51	10	dashboard_utama	t	f	f	f	2026-08-10 12:09:52.161
52	10	pengangkutan	t	t	t	f	2026-08-10 12:09:52.172
53	10	monitoring_sampah	t	f	f	f	2026-08-10 12:09:52.181
54	12	dashboard_utama	t	f	f	f	2026-08-10 12:09:52.193
55	12	poin_warga	t	f	f	f	2026-08-10 12:09:52.205
56	12	ide_daur_ulang	t	t	f	f	2026-08-10 12:09:52.219
1	1	dashboard_utama	t	t	t	t	2026-08-10 12:09:51.45
2	1	dashboard_kkn	t	t	t	t	2026-08-10 12:09:51.469
3	1	monitoring_sampah	t	t	t	t	2026-08-10 12:09:51.484
4	1	pengangkutan	t	t	t	t	2026-08-10 12:09:51.497
5	1	pemanfaatan	t	t	t	t	2026-08-10 12:09:51.51
6	1	hasil_pemanfaatan	t	t	t	t	2026-08-10 12:09:51.527
7	1	manajemen_pengguna	t	t	t	t	2026-08-10 12:09:51.539
8	1	manajemen_mahasiswa	t	t	t	t	2026-08-10 12:09:51.553
9	1	manajemen_tempat_sampah	t	t	t	t	2026-08-10 12:09:51.565
10	1	manajemen_lokasi	t	t	t	t	2026-08-10 12:09:51.577
11	1	master_data_wilayah	t	t	t	t	2026-08-10 12:09:51.593
12	1	laporan_analitik	t	t	t	t	2026-08-10 12:09:51.61
13	1	evaluasi_ai	t	t	t	t	2026-08-10 12:09:51.624
14	1	audit_trail	t	t	t	t	2026-08-10 12:09:51.634
15	1	konfigurasi_sistem	t	t	t	t	2026-08-10 12:09:51.65
16	1	rw_approval	t	t	t	t	2026-08-10 12:09:51.661
17	1	rw_fasilitas	t	t	t	t	2026-08-10 12:09:51.678
18	1	poin_warga	t	t	t	t	2026-08-10 12:09:51.697
19	1	ide_daur_ulang	t	t	t	t	2026-08-10 12:09:51.71
20	2	dashboard_utama	t	f	f	f	2026-08-10 12:09:51.725
21	2	monitoring_sampah	t	f	f	f	2026-08-10 12:09:51.738
22	2	pengangkutan	t	f	f	f	2026-08-10 12:09:51.751
23	2	pemanfaatan	t	f	f	f	2026-08-10 12:09:51.762
24	2	hasil_pemanfaatan	t	f	f	f	2026-08-10 12:09:51.774
25	2	laporan_analitik	t	f	f	f	2026-08-10 12:09:51.788
26	2	evaluasi_ai	t	t	f	f	2026-08-10 12:09:51.801
27	3	dashboard_utama	t	f	f	f	2026-08-10 12:09:51.817
28	3	monitoring_sampah	t	f	f	f	2026-08-10 12:09:51.835
29	3	laporan_analitik	t	f	f	f	2026-08-10 12:09:51.852
30	4	dashboard_utama	t	f	f	f	2026-08-10 12:09:51.864
31	4	monitoring_sampah	t	f	f	f	2026-08-10 12:09:51.875
32	4	laporan_analitik	t	f	f	f	2026-08-10 12:09:51.888
33	5	dashboard_utama	t	f	f	f	2026-08-10 12:09:51.905
34	5	rw_approval	t	t	t	f	2026-08-10 12:09:51.915
35	5	rw_fasilitas	t	t	t	f	2026-08-10 12:09:51.928
36	5	monitoring_sampah	t	f	f	f	2026-08-10 12:09:51.942
37	5	ide_daur_ulang	t	t	f	f	2026-08-10 12:09:51.958
38	6	dashboard_utama	t	f	f	f	2026-08-10 12:09:51.991
39	6	monitoring_sampah	t	f	f	f	2026-08-10 12:09:52.004
\.


--
-- Data for Name: ide_daur_ulang; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.ide_daur_ulang (id, id_pengguna, judul, foto, material, status_persetujuan, disetujui_oleh, dibuat_pada, diperbarui_pada) FROM stdin;
\.


--
-- Data for Name: jadwal; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.jadwal (id, title, date, "time", category, location, dibuat_pada, diperbarui_pada, latitude, longitude, polygon, radius, id_kelompok) FROM stdin;
b3ec4d8b-9c13-4d79-b4b9-3c593c27c2df	sosialisasi	2026-08-10 00:00:00	15.30-17.00 wib	Monitoring	rw 3 ciganitri	2026-08-10 08:24:02.398	2026-08-10 08:24:02.398	\N	\N	\N	100	\N
\.


--
-- Data for Name: jejak_audit; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.jejak_audit (id, action, id_pengguna, "timestamp", nilai_lama, nilai_baru) FROM stdin;
55ed2441-3a1c-4980-91c7-ea0797be41da	GENERATE_QR_BATCH	cbc24ca2-1db8-4569-981e-445c081dc38b	2026-08-09 19:12:51.337	\N	{"totalQr": 1, "batchCode": "BATCH-001", "categoryId": "f860877f-2f07-4972-9aab-61255facbfe1"}
b212fd95-626e-4eb4-921c-daa9bd0d51a6	GENERATE_QR_BATCH	cbc24ca2-1db8-4569-981e-445c081dc38b	2026-08-09 19:12:55.384	\N	{"totalQr": 1, "batchCode": "BATCH-002", "categoryId": "f74f270b-cee0-42ab-9696-85c721774b19"}
a47b3ba5-2405-4ca9-b22a-e7e88615711d	WARGA_REGISTER_BIN	3751704c-c631-4217-920a-ccda56bae879	2026-08-09 19:13:09.79	{"qrCode": "ORG00012026", "status": "PRINTED"}	{"qrCode": "ORG00012026", "status": "ACTIVE_BOUND"}
73678db5-45ec-4c87-bf0e-09af7fd85aec	WARGA_REGISTER_BIN	3751704c-c631-4217-920a-ccda56bae879	2026-08-09 19:13:09.814	{"qrCode": "ANORG00012026", "status": "PRINTED"}	{"qrCode": "ANORG00012026", "status": "ACTIVE_BOUND"}
fd5110f6-faf2-4fc4-82ad-06559f878270	REVIEW_RESET_REQUEST	cbc24ca2-1db8-4569-981e-445c081dc38b	2026-08-09 19:33:06.981	{"status": "PENDING", "request": "14bed9b2-e52e-44d0-90fb-47304b1eea63"}	{"binId": "db85f898-98fb-432b-89ab-4e75a2d667aa", "status": "ON_PROGRESS"}
8d4a8d85-74f2-47a9-bc13-40379a51a407	REVIEW_RESET_REQUEST	cbc24ca2-1db8-4569-981e-445c081dc38b	2026-08-09 19:33:34.835	{"status": "ON_PROGRESS", "request": "14bed9b2-e52e-44d0-90fb-47304b1eea63"}	{"binId": "db85f898-98fb-432b-89ab-4e75a2d667aa", "status": "COMPLETED"}
7a15c2c2-1b3f-463b-9dc9-b00a77bfdb4f	UPDATE_BIN_STATUS	cbc24ca2-1db8-4569-981e-445c081dc38b	2026-08-09 19:36:17.105	\N	{"binId": "f5d26c6e-c047-4e16-9445-217b4cc1cd06", "status": "PRINTED"}
47fa809d-8c7c-445d-9c2e-bd77d807392b	UPDATE_BIN_STATUS	cbc24ca2-1db8-4569-981e-445c081dc38b	2026-08-09 19:36:19.049	\N	{"binId": "f5d26c6e-c047-4e16-9445-217b4cc1cd06", "status": "INACTIVE"}
d66c7b38-cd96-4dda-b2ea-18355fc0da9f	REACTIVATE_BIN	cbc24ca2-1db8-4569-981e-445c081dc38b	2026-08-10 09:18:57.886	\N	{"binId": "f5d26c6e-c047-4e16-9445-217b4cc1cd06", "status": "ACTIVE_BOUND"}
08b56fe5-a1a4-4849-af07-7c05a79c5aae	UPDATE_BIN_STATUS	cbc24ca2-1db8-4569-981e-445c081dc38b	2026-08-10 09:19:02.987	\N	{"binId": "f5d26c6e-c047-4e16-9445-217b4cc1cd06", "status": "INACTIVE"}
\.


--
-- Data for Name: kabar_sosial; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.kabar_sosial (id, tipe, deskripsi, id_pengguna, id_entitas, "timestamp") FROM stdin;
\.


--
-- Data for Name: kabupaten; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.kabupaten (id, id_provinsi, nama, dibuat_pada, diperbarui_pada) FROM stdin;
1	1	Kota Bandung	2026-08-10 07:16:33.627	2026-08-10 07:16:33.627
\.


--
-- Data for Name: kategori_sampah; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.kategori_sampah (id, nama, poin_per_kg, description, dibuat_pada, diperbarui_pada) FROM stdin;
f74f270b-cee0-42ab-9696-85c721774b19	Organik	10	Sisa makanan & organik basah	2026-08-09 09:16:08.714	2026-08-09 09:16:08.714
f860877f-2f07-4972-9aab-61255facbfe1	Anorganik	15	Plastik, kertas, logam, dll	2026-08-09 09:16:08.714	2026-08-09 09:16:08.714
5eb236ad-e11c-47b2-b733-1a1876316808	Residu	2	\N	2026-08-10 07:16:52.105	2026-08-10 07:16:52.105
b7d5cd10-b9f0-43af-92cc-22faaf43d950	B3 (Limbah Berbahaya)	10	\N	2026-08-10 07:16:52.119	2026-08-10 07:16:52.119
\.


--
-- Data for Name: kecamatan; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.kecamatan (id, id_kabupaten, nama, dibuat_pada, diperbarui_pada) FROM stdin;
1	1	Coblong	2026-08-10 07:16:33.655	2026-08-10 07:16:33.655
\.


--
-- Data for Name: kehadiran_kegiatan; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.kehadiran_kegiatan (id, id_mahasiswa, id_jadwal, waktu_absen, metode, latitude, longitude, waktu_checkout, status) FROM stdin;
\.


--
-- Data for Name: kelompok_kkn; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.kelompok_kkn (id, nama, kelurahan, cakupan_rw, dpl_nama_mentah, id_dpl, dibuat_pada, diperbarui_pada) FROM stdin;
0eb46cb1-b00b-4715-b8c8-5e3c874c9715	Kelompok 1 Dago	Dago	[11, 12, 13]	Prof Umi Narimawati,dra, S.E. M.Si.,M.pd	83bf2c8c-0982-4a51-9044-4abebb0abc61	2026-08-09 04:27:22.194	2026-08-09 04:27:22.194
801f18bd-72d4-4303-a964-b9e5aae0fc82	Kelompok 2 Dago	Dago	[3, 5, 6]	Assoc Prof. Dr. Agus Riyanto S.E., M.S.i	\N	2026-08-09 04:27:31.614	2026-08-09 04:27:31.614
80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	Kelompok 3 Dago	Dago	[4, 9, 10]	Assoc. Prof. Dr. Raeni Dwi Santy, S.E., M.Si., CIMA, CDMP	fb2e8f0f-6eae-4455-9369-23d2d7a4cb86	2026-08-09 04:27:44.006	2026-08-09 04:27:44.006
a23595a6-a0c1-4988-a665-29b091cc9dbb	Kelompok 4 Dago	Dago	[1, 2, 7, 8]	Dr. Linna Ismawati, S.E., M.Si.	0cebb027-7e76-46ea-a9fa-f5329a211a84	2026-08-09 04:27:53.537	2026-08-09 04:27:53.537
cca8d808-a7d6-4218-8232-0138b2fef1a8	Kelompok 1 Lebak Gede	Lebak Gede	[1, 12, 13]	Muhammad Aksan Ipaenin, S.T. M.Sc.	9ba241a3-0dcd-44c0-bbb7-c63f07b33e50	2026-08-09 04:28:00.848	2026-08-09 04:28:00.848
d744db10-4706-4687-9d0b-79bebcc5d99a	Kelompok 2 Lebak Gede	Lebak Gede	[4, 7, 14]	Assoc.Prof. Dr. Wartika S.Kom.,MT	f050198c-94ed-41f1-b307-acf6bf10e790	2026-08-09 04:28:04.136	2026-08-09 04:28:04.136
487d33d3-3bbb-498d-b845-7825106beb28	Kelompok 3 Lebak Gede	Lebak Gede	[8, 9, 10, 11]	Myrna Dwi Rahmatya, S.Kom.,M.Kom	123a7397-c0c5-461b-8e98-e427f4303fa9	2026-08-09 04:28:07.359	2026-08-09 04:28:07.359
5407a6a1-c436-4db8-9757-cec1426f5f4d	Kelompok 4 Lebak Gede	Lebak Gede	[2, 3, 15]	Alif Finandhita, S.Kom., M.T.	e6101c87-ec31-4417-8871-84d8ad015353	2026-08-09 04:28:10.557	2026-08-09 04:28:10.557
ca0f1b98-a9b2-46c0-850d-089570350af0	Kelompok 1 Sekeloa	Sekeloa	[1, 2]	Adam Mukharil Bachtiar, S.Kom., M.T., Ph.D	61054176-d0e1-44be-a33b-1e724aab8eff	2026-08-09 04:28:13.754	2026-08-09 04:28:13.754
bb4928cf-a3f7-41c3-a62d-03b62500a3de	Kelompok 2 Sekeloa	Sekeloa	[3, 4]	Dr. Eng. Siswanti Zuraida, S.Pd., M.T.	9cd56f9f-4a97-476d-896f-7a41f5949a27	2026-08-09 04:28:16.738	2026-08-09 04:28:16.738
b1165842-ae6c-4a8e-b115-cb8f695aae84	Kelompok 3 Sekeloa	Sekeloa	[5, 6, 7]	Dr. Olih Solihin, S.Sos., M.I.Kom.	bb9d7c0c-5507-4f33-9ee5-656d86514523	2026-08-09 04:28:19.536	2026-08-09 04:28:19.536
4c6f7f84-f021-45b7-94ae-27237ac348bc	Kelompok 4 Sekeloa	Sekeloa	[8, 9, 10]	Hery Dwi Yulianto, S.T., M.Kom.	b2416008-71f5-4f54-88fc-a5fa19a9bb67	2026-08-09 04:28:22.466	2026-08-09 04:28:22.466
19f594a5-7d50-4560-a9d5-5841201295ea	Kelompok 5 Sekeloa	Sekeloa	[11, 12, 13]	John Adler, S.Si., M.Si.	6d5efd45-719e-4a63-ac69-5e70fc4fc23b	2026-08-09 04:28:25.82	2026-08-09 04:28:25.82
cc5677e8-37b4-409d-9bca-2bb21a7fc0ce	Kelompok 6 Sekeloa	Sekeloa	[14, 15, 16]	Dr. Henike Primawati, S.IP., M.I.Pol.	aa30fe7d-e4b3-45dc-b6b2-e74c4679c5fb	2026-08-09 04:28:28.998	2026-08-09 04:28:28.998
251534d8-fc11-4b89-8a17-cb510e4c6821	Kelompok 1 Lebak Siliwangi	Lebak Siliwangi	[3, 4]	Fenny Febrianti, S.S.,M.Hum	9f0ee84e-da7a-49c9-b172-44e626cc32fc	2026-08-09 04:28:31.761	2026-08-09 04:28:31.761
f1a25933-bf2b-4921-8b04-4f22ef233131	Kelompok 2 Lebak Siliwangi	Lebak Siliwangi	[5, 7]	Dr. Tatik Fidowaty, S.IP., M.Si	00502ca2-71f5-41ad-a7d7-ad32ff695970	2026-08-09 04:28:34.5	2026-08-09 04:28:34.5
fd030909-9d36-4f8d-8ce7-ca808ab7f88c	Kelompok 3 Lebak Siliwangi	Lebak Siliwangi	[6, 8]	Dr. Nungki Heriyati, S.S.S.,I.Kom.,M.A.	5841a306-1a5c-4b71-a554-e78567de1775	2026-08-09 04:28:37.733	2026-08-09 04:28:37.733
549f7a5e-c2cf-4dab-b484-08554156f5ff	Kelompok 1 Sadang Serang	Sadang Serang	[21]	Dr. Agus Mulyana, S.Kom, M.T.	0d56ca89-d13a-42e4-81a9-1d9af8e98b6b	2026-08-09 04:28:41.491	2026-08-09 04:28:41.491
f3fd64e5-312a-4d9b-94c9-4007eab5c7b9	Kelompok 2 Sadang Serang	Sadang Serang	[15]	Amilia Widya, S.Pd., M.T.	bdbd9144-7ea6-4549-8afe-c491f2b46e5b	2026-08-09 04:28:44.027	2026-08-09 04:28:44.027
1d514151-d77c-4b8e-bf5c-67a8316bdb92	Kelompok 3 Sadang Serang	Sadang Serang	[18, 19, 20]	Wahyudi, S.H., M.H.	eeea02ec-cfd4-4ce2-b3b3-610415828e77	2026-08-09 04:28:47.262	2026-08-09 04:28:47.262
7891549c-76ec-48c2-af08-10c8d2a8e8c5	Kelompok 4 Sadang Serang	Sadang Serang	[9, 10, 11, 40]	Richi Dwi Agustia, S.Kom., M.Kom.	10eb9de9-84ce-4cb2-927f-c8d1b47c175e	2026-08-09 04:28:50.003	2026-08-09 04:28:50.003
7148b819-b5b9-46ab-a2ad-405f5c2cd0cb	Kelompok 5 Sadang Serang	Sadang Serang	[3, 4]	Assoc. Prof., Dr. Manap Solihat, Drs., M.Si.	d9eac2ce-1c60-4c3c-a92a-f7afc771acbf	2026-08-09 04:28:52.398	2026-08-09 04:28:52.398
481ed30e-c1eb-45fa-a376-5196a91e7b45	Kelompok 6 Sadang Serang	Sadang Serang	[1, 2, 5]	Cherry Dharmawan, S.Sn., M.Sn.	61a0d2fd-93db-41e1-9deb-73be9e7f5bd4	2026-08-09 04:28:55.166	2026-08-09 04:28:55.166
dba5754c-2452-488a-9c9c-bd31d5de80c3	Kelompok 7 Sadang Serang	Sadang Serang	[12, 13, 14, 70]	Assoc. Prof. Dr. Sri Dewi Anggadini, S.E., M.Si., Ak., CA	802e4b3e-e560-496b-9f21-8fdda755f67a	2026-08-09 04:28:57.894	2026-08-09 04:28:57.894
9257a0b0-16fe-4419-a070-d3cf9eefd714	Kelompok 8 Sadang Serang	Sadang Serang	[6, 7, 8, 9, 60]	Dr.H.Tatang Supriyadi,S.E.,M.M	b4e3d113-63cd-470a-aeea-1fe9e371244e	2026-08-09 04:29:00.758	2026-08-09 04:29:00.758
62985ab4-50ee-4a49-a294-b6e0eb6611f9	Kelompok 9 Sadang Serang	Sadang Serang	[19, 20, 30]	Dr. Wendi Zaman,M.Si	\N	2026-08-09 04:29:03.911	2026-08-09 04:29:03.911
9cc60fce-4ca1-4c3e-a790-06d3b4beba12	Kelompok 10 Sadang Serang	Sadang Serang	[17, 19, 50]	Arif Try Cahyadi, S.Ds., M.Ds.	60d3aa8a-993e-4678-83e5-0630b4ec2b90	2026-08-09 04:29:07.197	2026-08-09 04:29:07.197
101f8ca9-56b3-4c58-b7c4-18a001d6220c	Kelompok 11 Sadang Serang	Sadang Serang	[14, 16, 30]	Ayub Subandi, S.Si., M.T., Ph.D.	adc9be9e-e66d-44f1-a650-fc1bdf5589a3	2026-08-09 04:29:09.688	2026-08-09 04:29:09.688
3ce3582b-5158-4171-85f8-ac0219986829	Kelompok 1 Cipaganti	Cipaganti	[1]	Iyan Andriana, S.T., M.T.	8f19fdca-9ed8-4c6f-9ac1-a94cba5039c9	2026-08-09 04:29:12.127	2026-08-09 04:29:12.127
37657e2b-16f8-4e8d-8140-ab7bb2725bd9	Kelompok 2 Cipaganti	Cipaganti	[2, 3]	Hanhan Maulana, M.Kom., Ph.D.	82979f6f-ace2-4254-b316-f64511c44d29	2026-08-09 04:29:16.234	2026-08-09 04:29:16.234
ba4a1b83-a0e9-40a2-8a19-9965908f5ce3	Kelompok 3 Cipaganti	Cipaganti	[4, 5]	Assoc. Prof. Dr. Rini Maulina, S.Sn., M.Sn.	1e9e26dc-5c28-45f2-b795-5818783d8e7c	2026-08-09 04:29:22.171	2026-08-09 04:29:22.171
b5c8eaf3-bc56-4219-99cf-de2230e00e20	Kelompok 4 Cipaganti	Cipaganti	[6, 7]	Rangga Sidik, S.Kom., M.Kom., M.Eng	74e8f605-b1c2-44e9-bf46-e3c718eb1cf3	2026-08-09 04:29:26.406	2026-08-09 04:29:26.406
\.


--
-- Data for Name: kelurahan; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.kelurahan (id, id_kecamatan, nama, dibuat_pada, diperbarui_pada) FROM stdin;
55251864-2d84-4452-a848-9b1c6b0e558a	1	Dago	2026-08-08 16:56:58.803	2026-08-10 12:09:49.16
5bdfcb1a-3256-42d3-9065-ec9215f33ce0	1	Lebak Gede	2026-08-08 16:57:04.256	2026-08-10 12:09:49.176
f27ddb02-7df2-42ae-88d8-d1590800062b	1	Lebak Siliwangi	2026-08-08 16:57:05.366	2026-08-10 12:09:49.192
f2af23d1-27db-4e83-91e9-6ae4586c311d	1	Sadang Serang	2026-08-08 16:57:00.102	2026-08-10 12:09:49.208
670632d6-a482-4aff-a128-a81f3821ce25	1	Sekeloa	2026-08-08 16:57:01.52	2026-08-10 12:09:49.225
83d5f852-287b-492b-a260-87e50a76f1f2	1	Cipaganti	2026-08-08 16:57:06.188	2026-08-10 12:09:49.241
\.


--
-- Data for Name: kepemilikan_tempat_sampah; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.kepemilikan_tempat_sampah (id, id_tempat_sampah, id_pengguna, tipe_kepemilikan, dibuat_pada) FROM stdin;
ad9a4885-cb73-48f2-83ed-34b5b7f00c31	f5d26c6e-c047-4e16-9445-217b4cc1cd06	3751704c-c631-4217-920a-ccda56bae879	UTAMA	2026-08-09 19:13:09.777
e25142c5-c22d-442d-aa25-fad53ca33f07	db85f898-98fb-432b-89ab-4e75a2d667aa	3751704c-c631-4217-920a-ccda56bae879	UTAMA	2026-08-09 19:13:09.811
\.


--
-- Data for Name: kode_otp; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.kode_otp (id, phone, code, kedaluwarsa_pada, dibuat_pada, used) FROM stdin;
0ed7a307-8564-4db9-847b-5b7ac6ecc2d6	+6283113264500	336140	2026-08-09 17:17:05.345	2026-08-09 17:12:05.385	f
d425a3f8-82da-4633-aed2-559d1f2d0443	+6285351181824	572179	2026-08-10 06:06:51.903	2026-08-10 06:01:51.916	f
\.


--
-- Data for Name: konfigurasi_sistem; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.konfigurasi_sistem (key, value, tipe, deskripsi, diperbarui_oleh, diperbarui_pada) FROM stdin;
BIN_ACTIVE_DURATION_DAYS	30	number	Durasi aktif tempat sampah dalam hari	\N	2026-08-10 12:09:55.154
MAX_BINS_PER_HOUSEHOLD	2	number	Maksimal tempat sampah per rumah tangga	\N	2026-08-10 12:09:55.174
DEFAULT_BIN_CAPACITY_LITER	25	number	Kapasitas default tempat sampah dalam liter	\N	2026-08-10 12:09:55.186
AI_CONFIDENCE_THRESHOLD	0.9	number	Threshold confidence AI untuk diskrepansi	\N	2026-08-10 12:09:55.196
POIN_AKTIVASI_QR_WARGA	10	number	Poin untuk warga saat aktivasi QR	\N	2026-08-10 12:09:55.209
POIN_AKTIVASI_QR_MAHASISWA	10	number	Poin untuk mahasiswa saat membantu registrasi warga	\N	2026-08-10 12:09:55.221
POIN_IDE_DAUR_ULANG	50	number	Poin reward ide daur ulang yang disetujui RW	\N	2026-08-10 12:09:55.231
COLLECTION_WINDOW_PAGI_START	06:00	string	Jam mulai window pengambilan pagi	\N	2026-08-10 12:09:55.253
COLLECTION_WINDOW_PAGI_END	08:00	string	Jam selesai window pengambilan pagi	\N	2026-08-10 12:09:55.264
COLLECTION_WINDOW_SORE_START	16:00	string	Jam mulai window pengambilan sore	\N	2026-08-10 12:09:55.281
COLLECTION_WINDOW_SORE_END	18:00	string	Jam selesai window pengambilan sore	\N	2026-08-10 12:09:55.296
APP_VERSION	1.0.0	string	Versi aplikasi TrashCare	\N	2026-08-10 12:09:55.315
\.


--
-- Data for Name: lokasi_mahasiswa; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.lokasi_mahasiswa (id, id_mahasiswa, latitude, longitude, direkam_pada) FROM stdin;
\.


--
-- Data for Name: mahasiswa_kkn; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.mahasiswa_kkn (id, id_pengguna, nim, jurusan, fakultas, no_wa, tanggal_mulai, tanggal_selesai, id_rw_ditugaskan, status_whitelist, dibuat_pada, diperbarui_pada, id_kelompok, skor_penilaian_dpl, is_ketua) FROM stdin;
d8bb8f28-eb71-4bde-b306-33f38df090b4	cd383f45-f701-4ec6-8b9d-d9d68b144208	21224027	Manajemen S1	-	+6282115280051	2026-08-09 04:27:22.431	2026-09-08 04:27:22.431	11	APPROVED	2026-08-09 04:27:22.433	2026-08-09 07:51:15.523	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
97cffe98-c02b-4b22-8c8d-2448b7828488	59060933-9f84-4e7c-9906-ad3f2dd387fd	21224165	Manajemen S1	-	+6283897917262	2026-08-09 04:27:22.66	2026-09-08 04:27:22.66	11	APPROVED	2026-08-09 04:27:22.661	2026-08-09 07:51:15.552	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
93d43c70-e01b-49e8-8e13-c79841bf11a6	bf9ee1e2-7ec4-49f1-a3d0-966778423e71	21224029	Manajemen S1	-	+6283844209035	2026-08-09 04:27:22.852	2026-09-08 04:27:22.852	11	APPROVED	2026-08-09 04:27:22.853	2026-08-09 07:51:15.578	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
fde3658f-506a-40ee-926b-29f0407e250e	5798e9da-8220-4bb8-9e5d-af5817010fb8	21224017	Manajemen S1	-	+628979745547	2026-08-09 04:27:23.038	2026-09-08 04:27:23.038	11	APPROVED	2026-08-09 04:27:23.039	2026-08-09 07:51:15.631	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
5ee4eaac-4a73-4924-9b16-630bfb77c64d	a8e41d57-91bb-46ab-8090-bf86d2e9c432	21224031	Manajemen S1	-	+6281511722253	2026-08-09 04:27:23.222	2026-09-08 04:27:23.222	11	APPROVED	2026-08-09 04:27:23.222	2026-08-09 07:51:15.653	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
f829422a-00b5-4ce5-b572-086d32c8cbcc	36e2c2fb-9b8b-4de6-9b21-b791e6a39e7c	21224040	Manajemen S1	-	+6281803930324	2026-08-09 04:27:23.422	2026-09-08 04:27:23.422	11	APPROVED	2026-08-09 04:27:23.423	2026-08-09 07:51:15.681	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
5aaa816e-8cb3-4ee3-95e1-76bfe6b99b7c	2c68c4c6-d7f2-4ce4-ba12-704b98a055b7	21224005	Manajemen S1	-	+628978123352	2026-08-09 04:27:23.623	2026-09-08 04:27:23.623	11	APPROVED	2026-08-09 04:27:23.624	2026-08-09 07:51:15.702	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
2d8ce06f-7527-4fbe-a142-7e1f2baac934	035be5af-5643-4562-8d16-e16f831d82ab	21224037	Manajemen S1	-	+6283823067530	2026-08-09 04:27:23.833	2026-09-08 04:27:23.833	11	APPROVED	2026-08-09 04:27:23.834	2026-08-09 07:51:15.725	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
b810f8f0-d247-483f-a049-a3e08122a6b0	0b570caa-7be0-412c-afbd-dcaedc8b5bd7	21224012	Manajemen S1	-	+6281386759563	2026-08-09 04:27:24.055	2026-09-08 04:27:24.055	11	APPROVED	2026-08-09 04:27:24.056	2026-08-09 07:51:15.749	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
6a0a6394-522a-486a-a86c-a758c3f1a5a8	ca752f5c-2c2f-4029-ac0c-7d1a0b079270	21224036	Manajemen S1	-	+62895388814138	2026-08-09 04:27:24.24	2026-09-08 04:27:24.24	11	APPROVED	2026-08-09 04:27:24.241	2026-08-09 07:51:15.765	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
4d06754e-5c66-4b08-a56a-5ce0aae985e3	9706aca6-d367-4a4f-8823-88495fc69477	21224019	Manajemen S1	-	+6281563500163	2026-08-09 04:27:24.469	2026-09-08 04:27:24.469	11	APPROVED	2026-08-09 04:27:24.47	2026-08-09 07:51:15.786	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
83f87c0e-1f8b-4456-8db2-386d4b4709e8	45763743-02ff-4319-8193-9e114f0e7e22	21224009	Manajemen S1	-	+6289516528208	2026-08-09 04:27:24.654	2026-09-08 04:27:24.654	11	APPROVED	2026-08-09 04:27:24.655	2026-08-09 07:51:15.803	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
6a85cea1-bf71-4c69-b7c1-de0f9f247779	97e96275-7dbd-4850-b002-541c5593e7b9	21224042	Manajemen S1	-	+6284898521015	2026-08-09 04:27:24.881	2026-09-08 04:27:24.881	11	APPROVED	2026-08-09 04:27:24.882	2026-08-09 07:51:15.816	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
d300b3ec-f3ec-40b8-b994-b4198689ed31	1aecede4-f769-4b9a-b600-73407f2af897	21224164	Manajemen S1	-	+6283839324380	2026-08-09 04:27:25.313	2026-09-08 04:27:25.313	11	APPROVED	2026-08-09 04:27:25.314	2026-08-09 07:51:15.85	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
ee47575c-5e64-488b-9aec-35efb37f7fe9	f94d59ad-0996-49ea-a06a-342a61ce02ae	21224026	Manajemen S1	-	+628886002536	2026-08-09 04:27:25.505	2026-09-08 04:27:25.505	11	APPROVED	2026-08-09 04:27:25.506	2026-08-09 07:51:15.876	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
c5f82b54-2413-48cf-853a-b2e401aafe3a	2583f6a5-4e73-42d4-9316-0ada70fc9144	21224028	Manajemen S1	-	+62895700887431	2026-08-09 04:27:25.728	2026-09-08 04:27:25.728	11	APPROVED	2026-08-09 04:27:25.73	2026-08-09 07:51:15.899	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
3af47470-457a-49b4-b955-0fc20b4c96b7	ca07c3b7-e56d-4298-a618-de31d6671169	21224004	Manajemen S1	-	+6285189951204	2026-08-09 04:27:25.955	2026-09-08 04:27:25.956	11	APPROVED	2026-08-09 04:27:25.957	2026-08-09 07:51:15.926	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
25e69b25-8caa-4511-b0cb-862e5baae3e3	17bf5aaa-8216-4fe3-955e-1a1a1522f920	21224008	Manajemen S1	-	+6285759177652	2026-08-09 04:27:26.169	2026-09-08 04:27:26.169	11	APPROVED	2026-08-09 04:27:26.17	2026-08-09 07:51:15.943	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
846b67ea-5770-4dec-b979-c337994930c3	e224714a-8aab-442e-8edf-48bff04a1122	21224018	Manajemen S1	-	+6285189951218	2026-08-09 04:27:26.404	2026-09-08 04:27:26.404	11	APPROVED	2026-08-09 04:27:26.405	2026-08-09 07:51:15.974	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
1bf99ba8-50d7-4388-bcc6-f600a539e61d	700a2b4d-2280-448e-8bb5-05a6c80816a7	21224011	Manajemen S1	-	+628985506581	2026-08-09 04:27:26.624	2026-09-08 04:27:26.624	11	APPROVED	2026-08-09 04:27:26.625	2026-08-09 07:51:16.001	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
1816a0fe-2244-4c0f-869b-62dd1ca28fdf	7c8c1b9c-f8d6-4024-92b2-4cae6e6aa8b5	21224034	Manajemen S1	-	+628561404113	2026-08-09 04:27:26.893	2026-09-08 04:27:26.893	11	APPROVED	2026-08-09 04:27:26.894	2026-08-09 07:51:16.023	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
68bc1037-1f81-47f0-a065-42ae922449a5	dca932a0-e6b1-47ce-8e5d-55a6aa18c658	21224030	Manajemen S1	-	+6285769680649	2026-08-09 04:27:27.093	2026-09-08 04:27:27.093	11	APPROVED	2026-08-09 04:27:27.094	2026-08-09 07:51:16.044	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
951cd67d-4859-4bd9-93a0-d45c4999af50	7a557c0b-9786-4eb8-8eca-1e1c2a25b41a	21224010	Manajemen S1	-	+6287717774587	2026-08-09 04:27:27.303	2026-09-08 04:27:27.303	11	APPROVED	2026-08-09 04:27:27.304	2026-08-09 07:51:16.069	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
c8a511ef-033c-48e4-b48d-eb82b3e97e6f	2a52664c-af37-483c-b8c1-53e00037762c	21224022	Manajemen S1	-	+6281511687598	2026-08-09 04:27:27.547	2026-09-08 04:27:27.547	11	APPROVED	2026-08-09 04:27:27.548	2026-08-09 07:51:16.087	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
b6c284e7-4540-4c38-9511-903151ecd54c	9f561f32-b784-4b46-989f-b70b7c05dcfe	21224175	Manajemen S1	-	+6281220505575	2026-08-09 04:27:27.761	2026-09-08 04:27:27.761	11	APPROVED	2026-08-09 04:27:27.762	2026-08-09 07:51:16.107	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
08f9c8d3-7864-4414-89d0-8894b21fa0e7	1634ab34-536e-437f-b1f5-0697e3ee359b	21224003	Manajemen S1	-	+6281323194418	2026-08-09 04:27:27.956	2026-09-08 04:27:27.956	11	APPROVED	2026-08-09 04:27:27.957	2026-08-09 07:51:16.127	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
79fb5f15-220a-43a0-8ae2-a528bf77a34a	c29fe1f6-9925-41a9-8ebb-8ff7f247cb02	21224166	Manajemen S1	-	+6289506697457	2026-08-09 04:27:28.146	2026-09-08 04:27:28.146	11	APPROVED	2026-08-09 04:27:28.147	2026-08-09 07:51:16.153	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
2c687925-0917-48c3-b8c2-c41a2c304727	3cebe196-81a6-4da8-8d2b-deaeb834c81e	21224007	Manajemen S1	-	+6285797295168	2026-08-09 04:27:28.347	2026-09-08 04:27:28.347	11	APPROVED	2026-08-09 04:27:28.348	2026-08-09 07:51:16.178	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
83881c3d-4919-476a-98d4-336122617f6b	9d55d39f-7c6d-4619-ab8d-ca71ce7db705	21224176	Manajemen S1	-	+6282119092783	2026-08-09 04:27:28.558	2026-09-08 04:27:28.558	11	APPROVED	2026-08-09 04:27:28.559	2026-08-09 07:51:16.209	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
8a9a4aa6-2069-48ce-a3f3-77179019e504	cd8c68e6-1063-468f-aa85-a55ec27ec598	21224002	Manajemen S1	-	+6282219712650	2026-08-09 04:27:28.75	2026-09-08 04:27:28.75	11	APPROVED	2026-08-09 04:27:28.751	2026-08-09 07:51:16.23	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
4f8e8a2a-31f6-46fc-97ec-97091031520a	a6986884-d5d3-4986-ae8e-a0fcd080e095	21224038	Manajemen S1	-	+6289646841703	2026-08-09 04:27:28.936	2026-09-08 04:27:28.936	11	APPROVED	2026-08-09 04:27:28.937	2026-08-09 07:51:16.25	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
b655915a-177c-4798-be9c-b0851584b3cc	2b9a95e4-71ba-44ed-a03a-7c15715c9713	\N	Manajemen S1	-	+6283156658230	2026-08-09 04:27:43.219	2026-09-08 04:27:43.219	\N	APPROVED	2026-08-09 04:27:43.22	2026-08-09 04:27:43.22	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
6e08d1ad-e421-45ba-8322-1d95b8516c98	4b97dadc-cf58-420f-99b2-a90b2bab165b	21224020	Manajemen S1	-	+6285872823913	2026-08-09 04:27:29.993	2026-09-08 04:27:29.993	11	APPROVED	2026-08-09 04:27:29.994	2026-08-09 07:51:16.312	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
e291e840-e985-4e14-bd13-61c4e9fa2424	e2b40693-e209-4087-bbb1-3c5a667de896	21224025	Manajemen S1	-	+628973142285	2026-08-09 04:27:30.175	2026-09-08 04:27:30.175	11	APPROVED	2026-08-09 04:27:30.176	2026-08-09 07:51:16.338	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
6257fa4c-0675-492b-9a25-fef6895effaf	4f8216e0-09cc-4505-8f1b-2ecf0db52061	21224033	Manajemen S1	-	+628818366327	2026-08-09 04:27:30.379	2026-09-08 04:27:30.379	11	APPROVED	2026-08-09 04:27:30.38	2026-08-09 07:51:16.357	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
b09d4640-0f53-4a84-ac9a-6bb52d4e3a69	4f69506c-f213-4452-96f4-0be070f697fc	21224006	Manajemen S1	-	+6281395481402	2026-08-09 04:27:30.782	2026-09-08 04:27:30.782	11	APPROVED	2026-08-09 04:27:30.783	2026-08-09 07:51:16.379	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
71439212-104e-4cd2-be98-78a17cbad32e	9ed49870-1478-4e4b-9a43-025cc9529974	21224021	Manajemen S1	-	+6281219521365	2026-08-09 04:27:31.031	2026-09-08 04:27:31.031	11	APPROVED	2026-08-09 04:27:31.032	2026-08-09 07:51:16.409	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
bdc6a16a-029d-459b-98c4-b2634a09508a	f2aedc1f-fcd5-45b4-9cee-d60870357662	21224074	Manajemen S1	-	+628817877256	2026-08-09 04:27:32.024	2026-09-08 04:27:32.024	\N	APPROVED	2026-08-09 04:27:32.025	2026-08-09 07:51:16.432	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
4bcbfa0c-c43c-4a4a-8555-957faf060545	ea12a835-76a9-4746-ad29-f30dbceba2a2	21224059	Manajemen S1	-	+6282158665230	2026-08-09 04:27:32.237	2026-09-08 04:27:32.237	\N	APPROVED	2026-08-09 04:27:32.238	2026-08-09 07:51:16.476	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
9f03cb38-aff0-4de3-a03c-51b33d02c9ad	d5204a7b-5e1b-4558-867b-7bcf10ab259f	21224050	Manajemen S1	-	+6287754486452	2026-08-09 04:27:33.835	2026-09-08 04:27:33.835	\N	APPROVED	2026-08-09 04:27:33.836	2026-08-09 07:51:16.498	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
1f2ebdef-cf62-4593-baaf-d988b701c61d	b3921bb0-c5e8-4143-b105-606e94b58ae1	21224048	Manajemen S1	-	+6285174164181	2026-08-09 04:27:34.142	2026-09-08 04:27:34.142	\N	APPROVED	2026-08-09 04:27:34.143	2026-08-09 07:51:16.554	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
df5ce3a5-444e-4222-b37d-10062bd95fd8	294f2855-73fa-4e3f-823a-69556f619a51	21224065	Manajemen S1	-	+62895358490228	2026-08-09 04:27:36.154	2026-09-08 04:27:36.154	\N	APPROVED	2026-08-09 04:27:36.155	2026-08-09 07:51:16.622	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
fc0fcfa0-bfbe-42f1-85b0-455eb838a9fa	fe10b4f8-68f7-42a0-b3c6-a4d3fb886d11	21224080	Manajemen S1	-	+6281313804028	2026-08-09 04:27:37.006	2026-09-08 04:27:37.006	\N	APPROVED	2026-08-09 04:27:37.007	2026-08-09 07:51:16.662	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
ffd53d26-ad5e-433e-a7c3-70908d704d43	c2bc6957-9816-4cf7-a33a-82ba436f813e	21224053	Manajemen S1	-	+6285795533802	2026-08-09 04:27:37.458	2026-09-08 04:27:37.458	\N	APPROVED	2026-08-09 04:27:37.459	2026-08-09 07:51:16.679	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
c70aa7e4-5688-421f-9274-3ee771bdcc71	0900bdbd-11b2-409b-ac43-789664288b2d	21224063	Manajemen S1	-	+6281319030001	2026-08-09 04:27:37.945	2026-09-08 04:27:37.945	\N	APPROVED	2026-08-09 04:27:37.946	2026-08-09 07:51:16.711	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
824f3f4c-77fd-4a26-a349-4784bf4e2fdb	e10be224-75b1-4ec3-bb15-041774ff6277	21224884	Manajemen S1	-	+6281320760468	2026-08-09 04:27:38.499	2026-09-08 04:27:38.499	\N	APPROVED	2026-08-09 04:27:38.5	2026-08-09 07:51:16.742	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
6f486ed2-0967-441c-ac6b-aec470541844	41020309-15f8-4339-a214-da900e3c71e0	21224060	Manajemen S1	-	+6285722154395	2026-08-09 04:27:38.769	2026-09-08 04:27:38.769	\N	APPROVED	2026-08-09 04:27:38.77	2026-08-09 07:51:16.77	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
71b4678f-90f7-44f4-a050-c39b43c4e44d	2020b648-5724-4156-ab23-6cab4ebea46c	21224070	Manajemen S1	-	+628996064729	2026-08-09 04:27:39.021	2026-09-08 04:27:39.021	\N	APPROVED	2026-08-09 04:27:39.024	2026-08-09 07:51:16.804	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
7c7b778a-b3ba-47fa-89a1-ed84a8bfa412	f6dea3d2-61de-4da8-8b57-585135ab5e4a	21224055	Manajemen S1	-	+628889368346	2026-08-09 04:27:39.257	2026-09-08 04:27:39.257	\N	APPROVED	2026-08-09 04:27:39.258	2026-08-09 07:51:16.825	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
c30781f7-1c91-485c-8683-4ec53c382957	678e6e47-65b3-4760-bbc4-b7338d0eb03e	21224058	Manajemen S1	-	+6288291330000	2026-08-09 04:27:39.482	2026-09-08 04:27:39.482	\N	APPROVED	2026-08-09 04:27:39.483	2026-08-09 07:51:16.846	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
9c92382c-2262-45fc-a984-218c92348366	e4866a88-9060-4002-9496-462cefe6692e	21224174	Manajemen S1	-	+628995125554	2026-08-09 04:27:41.082	2026-09-08 04:27:41.082	\N	APPROVED	2026-08-09 04:27:41.083	2026-08-09 07:51:16.868	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
e8727d17-dc8c-4c08-a2e0-8f791e554a22	2698da11-7446-4ec3-824c-1fa715b3fdd6	21224062	Manajemen S1	-	+6288706317498	2026-08-09 04:27:41.801	2026-09-08 04:27:41.801	\N	APPROVED	2026-08-09 04:27:41.802	2026-08-09 07:51:16.901	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
b5242998-e225-41a1-a815-61140dd68e2d	10790eac-b6df-4679-a529-21ea7dd33854	21224043	Manajemen S1	-	+6282318183722	2026-08-09 04:27:42.049	2026-09-08 04:27:42.049	\N	APPROVED	2026-08-09 04:27:42.05	2026-08-09 07:51:16.92	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
8e28e708-77d8-4a32-b475-7c41b95a16d8	e5a6e324-3325-4573-9901-184aa1889eb3	21224066	Manajemen S1	-	+6288220934370	2026-08-09 04:27:42.275	2026-09-08 04:27:42.275	\N	APPROVED	2026-08-09 04:27:42.276	2026-08-09 07:51:16.948	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
503b7b11-9cfb-49c5-831e-0a215de6424d	c45f150d-b509-4dc1-92a9-399764f2e470	21224068	Manajemen S1	-	+6282319283427	2026-08-09 04:27:42.498	2026-09-08 04:27:42.498	\N	APPROVED	2026-08-09 04:27:42.498	2026-08-09 07:51:16.975	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
66e5c192-ef0b-4ce3-9eee-4983639b1d6c	446d8c14-49a2-495d-9e7e-cf45054ae0ef	21224082	Manajemen S1	-	+6285863001647	2026-08-09 04:27:43.014	2026-09-08 04:27:43.014	\N	APPROVED	2026-08-09 04:27:43.015	2026-08-09 07:51:17.027	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
693b75f7-e1ca-4052-8d2c-7a2822059dcf	9a773bdd-fc6e-4fae-9fcc-37213d36689b	21224069	Manajemen S1	-	+6289991390087	2026-08-09 04:27:43.436	2026-09-08 04:27:43.436	\N	APPROVED	2026-08-09 04:27:43.437	2026-08-09 07:51:17.069	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
051525e7-37a0-419b-a908-3e61769765fc	88d50d98-da69-43e7-ac7f-39609ac8cbf7	21224169	Manajemen S1	-	+6283116984764	2026-08-09 04:27:44.227	2026-09-08 04:27:44.227	\N	APPROVED	2026-08-09 04:27:44.229	2026-08-09 07:51:17.103	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
b6288099-0015-43c5-abca-a097de28d34d	9aecde92-7e04-41bf-95b3-dbd8d68b7bdc	21224110	Manajemen S1	-	+6281282645771	2026-08-09 04:27:44.434	2026-09-08 04:27:44.434	\N	APPROVED	2026-08-09 04:27:44.435	2026-08-09 07:51:17.131	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
98fca2dc-f87d-4104-90be-84aa44cc7043	f173cb53-34f0-42b6-84e6-abf26d938cc0	21224085	Manajemen S1	-	+6281224153036	2026-08-09 04:27:44.646	2026-09-08 04:27:44.646	\N	APPROVED	2026-08-09 04:27:44.647	2026-08-09 07:51:17.157	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
e4aa2c3b-532d-4f82-a5f0-b7e05d8df97d	3f18ee5e-f027-40cf-bfd1-b79f4e5a48bb	21224120	Manajemen S1	-	+6287827619437	2026-08-09 04:27:45.065	2026-09-08 04:27:45.065	\N	APPROVED	2026-08-09 04:27:45.066	2026-08-09 07:51:17.175	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
efe53569-ecc2-4e8b-aeec-cd55447c1e43	b4cd0b79-de3f-443c-975d-a49b9f01deff	21224177	Manajemen S1	-	+6283148289991	2026-08-09 04:27:45.272	2026-09-08 04:27:45.272	\N	APPROVED	2026-08-09 04:27:45.273	2026-08-09 07:51:17.199	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
99f218bf-eac6-4e9b-8aed-cc4060ecdb98	99b1d623-62cd-470a-b3a7-1a4f6a314694	21224039	Manajemen S1	-	+6281321384239	2026-08-09 04:27:29.493	2026-09-08 04:27:29.493	11	APPROVED	2026-08-09 04:27:29.495	2026-08-09 07:51:17.248	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
afc0e87d-6369-4890-a914-ecddb8240545	4c84871b-b20c-4ded-9b7c-3592439d7e5b	21225023	Manajemen S1	-	+628990054657	2026-08-09 04:27:29.728	2026-09-08 04:27:29.728	11	APPROVED	2026-08-09 04:27:29.729	2026-08-09 07:51:17.279	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
159669a4-c510-45c4-a88b-00c26eac14b1	383f9695-c5bb-4043-b200-32c51b7e4b5c	21224014	Manajemen S1	-	+62895370305522	2026-08-09 04:27:30.578	2026-09-08 04:27:30.578	11	APPROVED	2026-08-09 04:27:30.579	2026-08-09 07:51:17.305	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
56c6899d-6a46-49af-ab32-ad64949c2d12	91a153e1-12ab-47ca-85ed-16c3e5e83a86	21224035	Manajemen S1	-	+6287775676469	2026-08-09 04:27:31.233	2026-09-08 04:27:31.233	11	APPROVED	2026-08-09 04:27:31.234	2026-08-09 07:51:17.323	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
ff568198-c503-45f6-9904-d9703f9f957a	a717fa7e-0e1b-4273-91fb-73ac7be11a2f	21224072	Manajemen S1	-	+6282195176008	2026-08-09 04:27:31.819	2026-09-08 04:27:31.819	\N	APPROVED	2026-08-09 04:27:31.82	2026-08-09 07:51:17.345	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
b69dc5f5-e477-4cd5-acbf-5ab8d6084ce1	a6f756de-c210-4b59-8447-91b30f053adf	21224077	Manajemen S1	-	+6281224790197	2026-08-09 04:27:33.003	2026-09-08 04:27:33.003	\N	APPROVED	2026-08-09 04:27:33.004	2026-08-09 07:51:17.366	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
acad012b-c122-443b-ba6f-311dc18a548b	600bdde0-6555-4511-a2de-1c2794af1601	21224056	Manajemen S1	-	+6285795181569	2026-08-09 04:27:34.389	2026-09-08 04:27:34.389	\N	APPROVED	2026-08-09 04:27:34.391	2026-08-09 07:51:17.381	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
80f152bb-b7ae-4e5e-b9d1-e1788dbbabbe	38e59a8c-96a4-4f64-a682-bedf2fb32af2	21224081	Manajemen S1	-	+6281917113086	2026-08-09 04:27:35.658	2026-09-08 04:27:35.658	\N	APPROVED	2026-08-09 04:27:35.659	2026-08-09 07:51:17.404	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
3ddb1f7f-d143-4f63-8297-c91e3dda2cb2	1e9e17d4-a4e0-4391-a175-2f5b5cc3b51c	21224064	Manajemen S1	-	+6285846160400	2026-08-09 04:27:36.362	2026-09-08 04:27:36.362	\N	APPROVED	2026-08-09 04:27:36.363	2026-08-09 07:51:17.442	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
11e29aef-e535-45dc-8abb-48f75cc7a111	e19cce72-154b-478c-acfe-aa91d9ebffb3	21224057	Manajemen S1	-	+628987830220	2026-08-09 04:27:36.566	2026-09-08 04:27:36.566	\N	APPROVED	2026-08-09 04:27:36.566	2026-08-09 07:51:17.465	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
66a6490b-5dd4-458d-8679-12bc964460bf	ef43c9c5-f0dd-4aa9-a886-7c8a16aa02c1	21224079	Manajemen S1	-	+6281324831783	2026-08-09 04:27:37.241	2026-09-08 04:27:37.241	\N	APPROVED	2026-08-09 04:27:37.242	2026-08-09 07:51:17.491	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
103be917-8252-44e5-a111-db7627f1bcc6	c5ff96f5-4541-4843-9656-5d30fc776679	21224073	Manajemen S1	-	+62859113375004	2026-08-09 04:27:37.687	2026-09-08 04:27:37.687	\N	APPROVED	2026-08-09 04:27:37.688	2026-08-09 07:51:17.523	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
d08c7d5d-5b65-4d77-92fd-1ef318a59d7e	11e4d026-9c1d-4301-88ab-8ead9c712656	21224044	Manajemen S1	-	+6281223670035	2026-08-09 04:27:38.239	2026-09-08 04:27:38.239	\N	APPROVED	2026-08-09 04:27:38.24	2026-08-09 07:51:17.544	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
c2ca46ec-3142-4c00-9b08-94963bf80528	5d646a2d-1a3c-46ff-b694-117cbdec22b5	21224046	Manajemen S1	-	+6282118971151	2026-08-09 04:27:39.681	2026-09-08 04:27:39.681	\N	APPROVED	2026-08-09 04:27:39.682	2026-08-09 07:51:17.563	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
4096d0a5-3142-4102-8e3c-adac8af77f3b	93e891b3-0e90-4d4d-936e-f05745c2890d	21224061	Manajemen S1	-	+6285158668915	2026-08-09 04:27:39.901	2026-09-08 04:27:39.901	\N	APPROVED	2026-08-09 04:27:39.902	2026-08-09 07:51:17.594	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
13d2416e-4f48-44ee-806b-80b933d436a2	69028391-346d-4e23-aee4-46cd6e3e900c	21224078	Manajemen S1	-	+628211500633	2026-08-09 04:27:40.14	2026-09-08 04:27:40.14	\N	APPROVED	2026-08-09 04:27:40.141	2026-08-09 07:51:17.628	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
e3384924-4289-42ff-bfb0-05181be7a60b	81407b96-688b-40f8-b0e0-32707bec5200	21224075	Manajemen S1	-	+6282119393893	2026-08-09 04:27:40.399	2026-09-08 04:27:40.399	\N	APPROVED	2026-08-09 04:27:40.4	2026-08-09 07:51:17.653	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
6ce69e10-95e2-4add-84de-7b8d0bf35508	9fed464f-2af9-49f2-ac07-f17164074b51	21224067	Manajemen S1	-	+6289525033833	2026-08-09 04:27:40.594	2026-09-08 04:27:40.594	\N	APPROVED	2026-08-09 04:27:40.595	2026-08-09 07:51:17.682	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
68125ce2-3b40-4bb7-b4d0-5283d8401c36	64e3b91d-4c58-41ab-8d59-72775e76a048	21224047	Manajemen S1	-	+6285795196508	2026-08-09 04:27:40.844	2026-09-08 04:27:40.844	\N	APPROVED	2026-08-09 04:27:40.845	2026-08-09 07:51:17.701	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
ef4cb1f0-6fcf-4552-8fab-98d70ddae2da	221d9274-2358-4e81-8a13-06bd97494bf8	21224052	Manajemen S1	-	+6282258665540	2026-08-09 04:27:41.312	2026-09-08 04:27:41.312	\N	APPROVED	2026-08-09 04:27:41.314	2026-08-09 07:51:17.723	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
20b6f0da-0810-4294-9c18-5dc4f9efa67d	4451b020-8ef6-4b65-b17f-a6cc399b198f	21224115	Manajemen S1	-	+62881022832251	2026-08-09 04:27:44.85	2026-09-08 04:27:44.85	\N	APPROVED	2026-08-09 04:27:44.851	2026-08-09 07:51:17.763	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
fc3b7280-bb34-4c88-81ee-8440070601e4	9dec4a83-3e4c-42d5-9339-a61c3fc8195f	21224121	Manajemen S1	-	+‪087711796723‬	2026-08-09 04:27:45.48	2026-09-08 04:27:45.48	\N	APPROVED	2026-08-09 04:27:45.481	2026-08-09 07:51:17.794	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
c37a0c1b-b959-4d2d-92a8-5dec5c0f85d6	1683ece4-f947-4f11-87bf-56887e8bc839	21224090	Manajemen S1	-	+6282120844233	2026-08-09 04:27:45.709	2026-09-08 04:27:45.709	\N	APPROVED	2026-08-09 04:27:45.71	2026-08-09 07:51:17.814	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
81247521-c5ab-4f3e-b68f-8922df778d03	4fc23037-0685-4dcc-87fc-0790cadea767	21224122	Manajemen S1	-	+6287717192033	2026-08-09 04:27:45.912	2026-09-08 04:27:45.912	\N	APPROVED	2026-08-09 04:27:45.913	2026-08-09 07:51:17.83	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
2ab9db4b-3e0c-4e4b-af82-04b54f17ef9e	a2a8389a-2df7-4238-890b-95c8f247bf48	21224096	Manajemen S1	-	+6285703177882	2026-08-09 04:27:46.339	2026-09-08 04:27:46.339	\N	APPROVED	2026-08-09 04:27:46.34	2026-08-09 07:51:17.855	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
10ef5fdb-5fdc-4de8-9c5a-e05d9f704437	726fb640-d2d2-4024-bb5d-412f548f3a2d	21224118	Manajemen S1	-	+6281311800184	2026-08-09 04:27:47.223	2026-09-08 04:27:47.223	\N	APPROVED	2026-08-09 04:27:47.224	2026-08-09 07:51:17.881	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
e3e72c9b-e8c5-4b54-83fa-90cd8d6d1a23	4ce33363-620f-4807-a9f5-4459b0e530e4	21224101	Manajemen S1	-	+6281220625671	2026-08-09 04:27:47.481	2026-09-08 04:27:47.481	\N	APPROVED	2026-08-09 04:27:47.482	2026-08-09 07:51:17.909	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
c6741495-c1cf-4138-b6c8-2ee1a0d71cc8	b0f0a80a-aec1-40f2-8a68-54a44e9dd734	21224117	Manajemen S1	-	+6282240299206	2026-08-09 04:27:47.719	2026-09-08 04:27:47.719	\N	APPROVED	2026-08-09 04:27:47.72	2026-08-09 07:51:17.929	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
360da38a-aa88-49dc-8cb1-2d135351c391	eeec278a-558b-4abf-b117-af10d4ba5595	21224106	Manajemen S1	-	+6289678280308	2026-08-09 04:27:48.218	2026-09-08 04:27:48.218	\N	APPROVED	2026-08-09 04:27:48.218	2026-08-09 07:51:17.954	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
6c29bb8c-f7d6-40d4-84cb-a42c7f861daf	9bea2ea5-2991-4bfb-a1d7-f3c7a82b13e8	21224092	Manajemen S1	-	+6287717798568	2026-08-09 04:27:48.485	2026-09-08 04:27:48.485	\N	APPROVED	2026-08-09 04:27:48.486	2026-08-09 07:51:17.971	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
5c04c12d-22ab-48a1-aec3-da98b06fbe7b	44159a5e-e8c5-4e34-9859-5640fc5c02c5	21224167	Manajemen S1	-	+6287715776714	2026-08-09 04:27:48.917	2026-09-08 04:27:48.917	\N	APPROVED	2026-08-09 04:27:48.918	2026-08-09 07:51:17.995	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
59c50e43-53bb-4153-a5e6-c04e5a529b77	d5dad548-bbce-41b9-83c0-ddbbe51f6ee3	21224107	Manajemen S1	-	+6282111139288	2026-08-09 04:27:46.131	2026-09-08 04:27:46.131	\N	APPROVED	2026-08-09 04:27:46.132	2026-08-09 07:51:18.01	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
19cf562e-0e6d-4c37-a123-73113ae8282f	f1cbc227-975b-4d9b-b30f-e33eb8afa49a	21224100	Manajemen S1	-	+6289507903585	2026-08-09 04:27:46.556	2026-09-08 04:27:46.556	\N	APPROVED	2026-08-09 04:27:46.557	2026-08-09 07:51:18.046	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
ed9c3b78-837c-4b0e-8747-f0a74f6a8a52	ec3b3984-f470-45fb-9f20-29b7c34c346a	21224124	Manajemen S1	-	+6282353630640	2026-08-09 04:27:46.778	2026-09-08 04:27:46.778	\N	APPROVED	2026-08-09 04:27:46.779	2026-08-09 07:51:18.069	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
bd60a523-48ee-4b90-846f-3134e35a049d	8987c28a-7d72-4305-93f8-31bf363e2263	21224112	Manajemen S1	-	+6285189951112	2026-08-09 04:27:46.985	2026-09-08 04:27:46.985	\N	APPROVED	2026-08-09 04:27:46.986	2026-08-09 07:51:18.082	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
fa07628d-ec54-45da-8084-55cf11cdc2a8	34430fca-95f0-44d7-9390-5a128ed7a135	21224087	Manajemen S1	-	+6281293136429	2026-08-09 04:27:47.951	2026-09-08 04:27:47.951	\N	APPROVED	2026-08-09 04:27:47.952	2026-08-09 07:51:18.107	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
c2797dea-78e1-4aa3-81a8-51b408d6ea2c	0a22831f-f769-4a5c-9037-9b42ad7ecbf7	21224111	Manajemen S1	-	+6281462216348	2026-08-09 04:27:48.694	2026-09-08 04:27:48.694	\N	APPROVED	2026-08-09 04:27:48.695	2026-08-09 07:51:18.13	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
49ec21d7-bc4a-404f-bf45-b8b02d7e9415	6b29aa62-edfd-45e1-80ea-c04643f3cea7	21224089	Manajemen S1	-	+6285945315016	2026-08-09 04:27:50.504	2026-09-08 04:27:50.504	\N	APPROVED	2026-08-09 04:27:50.506	2026-08-09 07:51:18.149	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
0f234e39-cbb8-4987-b3fa-900441fb5b39	92bde298-1ee2-4b6b-9b46-ccb16c54c2b2	21224168	Manajemen S1	-	+6285755985220	2026-08-09 04:27:51.921	2026-09-08 04:27:51.921	\N	APPROVED	2026-08-09 04:27:51.922	2026-08-09 07:51:18.169	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
ce4ea210-4c00-400f-9b2f-d5eccde79eb3	45176547-be23-4293-b94a-994d9dc29ef8	21224108	Manajemen S1	-	+6281224533255	2026-08-09 04:27:52.125	2026-09-08 04:27:52.125	\N	APPROVED	2026-08-09 04:27:52.126	2026-08-09 07:51:18.191	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
7a2f827c-1cf3-46ab-b8ee-2ffd9990d2f7	d6860353-f1ae-47e3-aaec-bb19a29496e1	21224123	Manajemen S1	-	+6282246474166	2026-08-09 04:27:52.329	2026-09-08 04:27:52.329	\N	APPROVED	2026-08-09 04:27:52.33	2026-08-09 07:51:18.224	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
6b613474-2e8a-47c4-9773-6a1289bf17a9	5935ae0b-1dfa-43eb-9305-c35d2fc169eb	21224119	Manajemen S1	-	+6285692830244	2026-08-09 04:27:52.553	2026-09-08 04:27:52.553	\N	APPROVED	2026-08-09 04:27:52.554	2026-08-09 07:51:18.248	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
633dcab5-f564-4664-9e6b-adcd8d4b892f	341737c3-1026-4477-bc3e-02978b7c3932	21224088	Manajemen S1	-	+6281276236978	2026-08-09 04:27:52.965	2026-09-08 04:27:52.965	\N	APPROVED	2026-08-09 04:27:52.966	2026-08-09 07:51:18.277	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
3ff3c2cb-14db-43f3-af64-ca9984308ad3	c4406dd2-d87f-4a62-98ed-8e633fb26791	21224114	Manajemen S1	-	+6285757487725	2026-08-09 04:27:53.157	2026-09-08 04:27:53.157	\N	APPROVED	2026-08-09 04:27:53.158	2026-08-09 07:51:18.586	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
e987cf1f-013d-466f-a3a0-68f81d94a2d1	204fe0e1-cfbe-48f7-a00e-8a4a411dccdc	21224146	Manajemen S1	-	+6282219556950	2026-08-09 04:27:54.11	2026-09-08 04:27:54.11	10	APPROVED	2026-08-09 04:27:54.111	2026-08-09 07:51:18.879	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
05d6dad5-726b-440e-a21a-398723c1962f	742eb361-1fd8-4cc7-b6d1-d3d82dc5a72f	21224158	Manajemen S1	-	+6281372526217	2026-08-09 04:27:54.354	2026-09-08 04:27:54.354	10	APPROVED	2026-08-09 04:27:54.355	2026-08-09 07:51:18.999	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
85a06346-98f2-405e-b430-c12c5a85af89	f47d1167-0bd1-4486-9ee5-3971c8f97753	21224157	Manajemen S1	-	+6285654051690	2026-08-09 04:27:54.551	2026-09-08 04:27:54.551	10	APPROVED	2026-08-09 04:27:54.554	2026-08-09 07:51:19.143	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
92988576-80ec-43ad-abd5-06cf0d021e79	680e3deb-7938-4cfb-ae2e-c5b48a1c41c6	21224138	Manajemen S1	-	+62881022108729	2026-08-09 04:27:56.302	2026-09-08 04:27:56.302	10	APPROVED	2026-08-09 04:27:56.303	2026-08-09 07:51:19.254	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
8182c5da-bfe4-4e57-81e7-67f2f719d31e	47043722-a76d-42f7-a62e-2738a6dc81ab	21224140	Manajemen S1	-	+6282246461248	2026-08-09 04:27:56.486	2026-09-08 04:27:56.486	10	APPROVED	2026-08-09 04:27:56.487	2026-08-09 07:51:19.277	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
93638861-1240-4348-9342-673ca1f1c581	7b3e997f-1f27-4f9d-b5fe-d3086818d436	21224151	Manajemen S1	-	+6285722573334	2026-08-09 04:27:57.315	2026-09-08 04:27:57.315	10	APPROVED	2026-08-09 04:27:57.316	2026-08-09 07:51:19.296	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
942c3b9f-7e69-46d2-87e8-d1d88f017542	f8b3c0dc-d4bf-46dd-b799-237e7b47e223	21224128	Manajemen S1	-	+6287735522636	2026-08-09 04:27:58.528	2026-09-08 04:27:58.528	10	APPROVED	2026-08-09 04:27:58.529	2026-08-09 07:51:19.315	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
34366a55-5225-4251-b72f-4c472d57263a	7e104bb0-85a3-47db-bbd0-b7f13d41d1b4	21224136	Manajemen S1	-	+6285603679106	2026-08-09 04:27:59.09	2026-09-08 04:27:59.09	10	APPROVED	2026-08-09 04:27:59.091	2026-08-09 07:51:19.333	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
354d062b-ebc0-4bcd-961d-421194ea5a36	7b9206eb-ff83-4b66-8a2b-b421cb89a5c2	21224172	Manajemen S1	-	+6281220084181	2026-08-09 04:27:59.294	2026-09-08 04:27:59.294	10	APPROVED	2026-08-09 04:27:59.295	2026-08-09 07:51:19.35	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
77e46a34-5e48-4ff2-991a-baf8e67e9eb9	9bbfccfc-8389-41f0-9d36-f4c922fbbeed	21224150	Manajemen S1	-	+6285759336603	2026-08-09 04:27:59.663	2026-09-08 04:27:59.663	10	APPROVED	2026-08-09 04:27:59.664	2026-08-09 07:51:19.383	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
7fc982e9-cb1c-420d-a172-520e3a7708fa	2dd08e49-1cdf-411b-b286-a6e0f35696e7	21224094	Manajemen S1	-	+6282176610429	2026-08-09 04:27:49.396	2026-09-08 04:27:49.396	\N	APPROVED	2026-08-09 04:27:49.397	2026-08-09 07:51:19.426	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
fb30985e-79fe-447e-aaf8-e6061b9f4f9e	ae528518-357d-4425-b628-7a1199a51708	21224104	Manajemen S1	-	+6283165567309	2026-08-09 04:27:49.656	2026-09-08 04:27:49.656	\N	APPROVED	2026-08-09 04:27:49.657	2026-08-09 07:51:19.457	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
5d25fc94-e936-4bb9-98f5-abd29ad861c9	70113d02-686b-4f38-8c67-bfa6b0c1410d	21224091	Manajemen S1	-	+6285351014171	2026-08-09 04:27:49.874	2026-09-08 04:27:49.874	\N	APPROVED	2026-08-09 04:27:49.875	2026-08-09 07:51:19.489	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
b90591c1-5299-4189-a4b6-7e748c289b2f	2402065d-e490-4e42-a3db-c703f22b9297	21224099	Manajemen S1	-	+6283101438384	2026-08-09 04:27:50.099	2026-09-08 04:27:50.099	\N	APPROVED	2026-08-09 04:27:50.101	2026-08-09 07:51:19.511	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
56599ba9-d923-42a1-8ece-110feea0c4da	12dde950-15ed-49ac-8f71-5b38324170ad	21224093	Manajemen S1	-	+62895422514414	2026-08-09 04:27:50.307	2026-09-08 04:27:50.307	\N	APPROVED	2026-08-09 04:27:50.307	2026-08-09 07:51:19.538	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
dd7c808e-bc2e-4829-bb49-2b17c6f600bc	52d6b1a7-a447-40c6-bfc9-8f2717857190	21224097	Manajemen S1	-	+6285624036958	2026-08-09 04:27:50.703	2026-09-08 04:27:50.703	\N	APPROVED	2026-08-09 04:27:50.705	2026-08-09 07:51:19.555	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
0f78c48f-8540-4d30-b849-b72a109ef3c4	e2e5f3ca-b3cb-41f1-a9eb-c4fd8025389d	21224113	Manajemen S1	-	+6289604552149	2026-08-09 04:27:51.096	2026-09-08 04:27:51.096	\N	APPROVED	2026-08-09 04:27:51.097	2026-08-09 07:51:19.604	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
13b430aa-5867-40f0-b4fa-03a5989c3384	f9701643-e4ab-43ad-9b96-6056b5dfd999	21224095	Manajemen S1	-	+628131675694	2026-08-09 04:27:51.297	2026-09-08 04:27:51.297	\N	APPROVED	2026-08-09 04:27:51.298	2026-08-09 07:51:19.628	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
a1c852f2-2039-4536-8895-39fda7428d19	41356cf7-ee8c-4524-88c2-e658b5abfebb	21224084	Manajemen S1	-	+6289517043643	2026-08-09 04:27:51.494	2026-09-08 04:27:51.494	\N	APPROVED	2026-08-09 04:27:51.495	2026-08-09 07:51:19.647	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
2539b84a-ebbd-4255-bf2e-3884dced9c32	32f72df1-18df-4184-8c0f-34230c944dca	21224116	Manajemen S1	-	+6282297452725	2026-08-09 04:27:51.695	2026-09-08 04:27:51.695	\N	APPROVED	2026-08-09 04:27:51.696	2026-08-09 07:51:19.669	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
d461181a-f591-485f-93bc-d9c280290014	0556f503-96ad-4a44-9cb1-252b66532712	21224098	Manajemen S1	-	+6285155375885	2026-08-09 04:27:52.745	2026-09-08 04:27:52.745	\N	APPROVED	2026-08-09 04:27:52.747	2026-08-09 07:51:19.698	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
2565f9b2-1b2e-45bb-b7ca-d214dfdb73f9	0e87e15a-7b9c-4762-a9dd-f885ae47353b	21224903	Manajemen S1	-	+6281775467166	2026-08-09 04:27:53.734	2026-09-08 04:27:53.734	10	APPROVED	2026-08-09 04:27:53.735	2026-08-09 07:51:19.721	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
205416e1-d538-4b07-813d-9eccf3297022	4217872e-83be-48e9-a2e5-c9f58eb8d22b	21224148	Manajemen S1	-	+6281293072550	2026-08-09 04:27:53.919	2026-09-08 04:27:53.919	10	APPROVED	2026-08-09 04:27:53.92	2026-08-09 07:51:19.742	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
ce6523b2-038e-4b9c-8bab-42ce190777d8	3be55267-4247-48d5-8d10-3d5224f69557	21224149	Manajemen S1	-	+6281394934993	2026-08-09 04:27:54.75	2026-09-08 04:27:54.75	10	APPROVED	2026-08-09 04:27:54.751	2026-08-09 07:51:19.775	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
7f9438e9-17b3-440a-a2e0-c3cdaca5a655	2f35dac8-e164-4134-9f97-1fbd08edf5b6	21224170	Manajemen S1	-	+6283874417569	2026-08-09 04:27:54.941	2026-09-08 04:27:54.941	10	APPROVED	2026-08-09 04:27:54.942	2026-08-09 07:51:19.802	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
8957cea9-f67f-4850-b1f6-dd0194ba5425	b7880357-350a-4eba-8cd1-9fab07f089fd	21224142	Manajemen S1	-	+6283824585228	2026-08-09 04:27:55.129	2026-09-08 04:27:55.129	10	APPROVED	2026-08-09 04:27:55.13	2026-08-09 07:51:19.832	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
bd99d281-4ca1-4f5f-b08d-90cca403cffe	8b3c8ccf-fdce-438b-8ddf-47f29de15730	21224132	Manajemen S1	-	+6281931712757	2026-08-09 04:27:55.314	2026-09-08 04:27:55.314	10	APPROVED	2026-08-09 04:27:55.315	2026-08-09 07:51:19.858	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
e73a8a84-84f7-402a-a193-7da88781e7b2	04efc2f9-adcf-4351-acd2-78966953b508	21224153	Manajemen S1	-	+6285934462167	2026-08-09 04:27:55.5	2026-09-08 04:27:55.5	10	APPROVED	2026-08-09 04:27:55.501	2026-08-09 07:51:19.878	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
7ab94c6d-96ab-4a9f-b0ba-4f0bd8ab8d06	f0b22d26-6ec1-4718-a137-336d9b78014f	21224145	Manajemen S1	-	+6282128014219	2026-08-09 04:27:55.714	2026-09-08 04:27:55.714	10	APPROVED	2026-08-09 04:27:55.715	2026-08-09 07:51:19.895	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
c70f4339-86cb-480e-a824-2c706c2a3e09	a14fc6d9-db8b-4c1f-970d-fcf0b34a27b3	21224171	Manajemen S1	-	+6289636456272	2026-08-09 04:27:55.908	2026-09-08 04:27:55.908	10	APPROVED	2026-08-09 04:27:55.909	2026-08-09 07:51:19.916	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
69799248-e2e6-4139-8e45-fc393a3088be	45548570-6fc0-4ef0-83ca-8b748ff835d0	21224143	Manajemen S1	-	+6282126490757	2026-08-09 04:27:56.103	2026-09-08 04:27:56.103	10	APPROVED	2026-08-09 04:27:56.104	2026-08-09 07:51:19.944	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
11a1c06f-89de-4613-9547-b9d5fd390279	59ab1e52-d003-406f-a131-b7db3dbdb5a5	21224152	Manajemen S1	-	+62881023218517	2026-08-09 04:27:56.692	2026-09-08 04:27:56.692	10	APPROVED	2026-08-09 04:27:56.693	2026-08-09 07:51:19.974	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
99ed4e9f-8e3e-44ae-8140-85fc505854e5	eadb9275-a2c7-436b-b95c-37c16f21ad13	21224154	Manajemen S1	-	+62895703172150	2026-08-09 04:27:56.891	2026-09-08 04:27:56.891	10	APPROVED	2026-08-09 04:27:56.892	2026-08-09 07:51:19.992	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
350d5772-3299-4c92-a778-992c39052640	9600fda8-cbe9-4b8a-bdf9-7eb1620ef92f	21224144	Manajemen S1	-	+6282126329827	2026-08-09 04:27:57.093	2026-09-08 04:27:57.093	10	APPROVED	2026-08-09 04:27:57.094	2026-08-09 07:51:20.017	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
467d394a-f74a-46d4-9b6b-9f0fbddf4ed8	2bfdabfc-41ed-4c96-b09e-fa11617964c8	21224155	Manajemen S1	-	+6285722401125	2026-08-09 04:27:57.757	2026-09-08 04:27:57.757	10	APPROVED	2026-08-09 04:27:57.758	2026-08-09 07:51:20.058	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
4e9e8b4f-9617-4f5b-8783-00dd62c8e715	4d953e54-ad68-4383-bcde-6d6d942f88bc	21224130	Manajemen S1	-	+6281292690092	2026-08-09 04:27:57.991	2026-09-08 04:27:57.991	10	APPROVED	2026-08-09 04:27:57.993	2026-08-09 07:51:20.081	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
4ee5096a-4a03-4008-8e43-f6ff16eb2cda	46020e67-5598-49bc-96a8-ed0756c53718	21224134	Manajemen S1	-	+6282218910613	2026-08-09 04:27:58.172	2026-09-08 04:27:58.172	10	APPROVED	2026-08-09 04:27:58.173	2026-08-09 07:51:20.094	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
c5b25b9c-0a12-4d1a-972e-dcd5975085ca	a4d19f94-4cdd-4e75-9610-92178d3506a9	21224137	Manajemen S1	-	+6281214421750	2026-08-09 04:27:58.35	2026-09-08 04:27:58.35	10	APPROVED	2026-08-09 04:27:58.351	2026-08-09 07:51:20.111	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
4c792499-f0e9-4cbe-81de-c3210b11334f	6cb73847-5822-4d72-929b-db5ec4f9e13b	21224129	Manajemen S1	-	+6285862845702	2026-08-09 04:27:58.717	2026-09-08 04:27:58.717	10	APPROVED	2026-08-09 04:27:58.718	2026-08-09 07:51:20.142	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
ed133c05-fa7b-42a8-a216-5d49ff1a9f41	509af13e-86ce-436a-82fe-bb690ea7373f	21224160	Manajemen S1	-	+6281224793817	2026-08-09 04:27:58.903	2026-09-08 04:27:58.903	10	APPROVED	2026-08-09 04:27:58.904	2026-08-09 07:51:20.175	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
58332b18-03f3-43c8-81ee-ccb61a47d39a	7ae530d6-561c-4e74-9f68-146931fc3f24	21224135	Manajemen S1	-	+6282120101043	2026-08-09 04:27:59.488	2026-09-08 04:27:59.488	10	APPROVED	2026-08-09 04:27:59.489	2026-08-09 07:51:20.204	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
76e5414d-4249-41a4-805a-290d846889c0	979e6c6a-29da-4902-b165-5b7363f037d6	21224126	Manajemen S1	-	+6281285394545	2026-08-09 04:28:00.016	2026-09-08 04:28:00.016	10	APPROVED	2026-08-09 04:28:00.017	2026-08-09 07:51:20.251	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
b0611966-1e86-472a-a02d-ff72eee60d77	45cae693-b023-480e-9c4d-9702aa23cf18	21224127	Manajemen S1	-	+6285212928423	2026-08-09 04:28:00.236	2026-09-08 04:28:00.236	10	APPROVED	2026-08-09 04:28:00.237	2026-08-09 07:51:20.276	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
aea6b143-cba4-4fa0-885c-af511a62e4e6	6cdd8491-5e2a-43bc-add7-59abb010c05f	21224802	Manajemen S1	-	+6282219910112	2026-08-09 04:28:00.427	2026-09-08 04:28:00.427	10	APPROVED	2026-08-09 04:28:00.427	2026-08-09 07:51:20.302	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
2eb394e1-3d9a-489f-b47b-8ee7d899f5ad	fd0b06a4-f104-4cdd-8a18-3766826f146a	21224141	Manajemen S1	-	+62882002534835	2026-08-09 04:28:00.623	2026-09-08 04:28:00.623	10	APPROVED	2026-08-09 04:28:00.624	2026-08-09 07:51:20.335	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
4f650100-84e2-4ece-8944-d564ecec1969	8a4e81a4-aa83-4a7f-87a5-cc3af69a4d08	21224161	Manajemen S1	-	+6282262872564	2026-08-09 04:28:00.814	2026-09-08 04:28:00.814	10	APPROVED	2026-08-09 04:28:00.815	2026-08-09 07:51:20.362	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
c350ef7b-7a4a-49e2-9996-806ea91c0a6f	9975d08a-4190-42e3-9067-3b670a724d7e	10420053	S1 Teknik Arsitektur	-	+6285283427117	2026-08-09 04:28:01.044	2026-09-08 04:28:01.044	47	APPROVED	2026-08-09 04:28:01.045	2026-08-09 07:51:20.383	cca8d808-a7d6-4218-8232-0138b2fef1a8	0.00	f
42f5fa3f-a394-423c-86d8-f3de32ddc1cf	487550e9-fb2a-4ed2-a32c-bdd2b84ff243	51923209	S1 Desain Komunikasi Visual	-	+6282215880071	2026-08-09 04:28:01.249	2026-09-08 04:28:01.249	47	APPROVED	2026-08-09 04:28:01.25	2026-08-09 07:51:20.406	cca8d808-a7d6-4218-8232-0138b2fef1a8	0.00	f
2efbbe03-e1e6-4f8b-beac-50dc395cd2d3	85a48445-d7a0-4bf1-8d36-e8fb8ad53c91	31624009	S1 Ilmu Hukum	-	+62895622055669	2026-08-09 04:28:01.477	2026-09-08 04:28:01.477	47	APPROVED	2026-08-09 04:28:01.478	2026-08-09 07:51:20.424	cca8d808-a7d6-4218-8232-0138b2fef1a8	0.00	f
b851a003-ce8a-4c29-bdfc-0a600e45ad6a	142a9cf3-b788-4935-baf8-705f1dc4eec2	10523071	S1 Sistem Informasi	-	+6282126043577	2026-08-09 04:28:01.688	2026-09-08 04:28:01.688	47	APPROVED	2026-08-09 04:28:01.689	2026-08-09 07:51:20.443	cca8d808-a7d6-4218-8232-0138b2fef1a8	0.00	f
e4772088-811c-4d57-8ed2-827b8fd68bdf	b8ab62ba-9722-4c8b-9f52-0b6576bb014c	10523080	S1 Sistem Informasi	-	+6285700334921	2026-08-09 04:28:01.899	2026-09-08 04:28:01.899	47	APPROVED	2026-08-09 04:28:01.9	2026-08-09 07:51:20.463	cca8d808-a7d6-4218-8232-0138b2fef1a8	0.00	f
6494efb4-c9fc-45ce-938e-5d5e2a99e773	c623ab6d-93b2-4ca3-a7e2-7cb175f3b496	10524003	S1 Sistem Informasi	-	+6281809679880	2026-08-09 04:28:02.107	2026-09-08 04:28:02.107	47	APPROVED	2026-08-09 04:28:02.108	2026-08-09 07:51:20.492	cca8d808-a7d6-4218-8232-0138b2fef1a8	0.00	f
407f789a-bf08-4137-9516-e3971e3d973b	c98e3196-7144-42e3-9ef7-9998874ad8b4	10323009	S1 Teknik Industri	-	+6282360763837	2026-08-09 04:28:02.541	2026-09-08 04:28:02.541	47	APPROVED	2026-08-09 04:28:02.543	2026-08-09 07:51:20.545	cca8d808-a7d6-4218-8232-0138b2fef1a8	0.00	f
e982d721-22bb-437e-b205-00c9f0c3a7ff	1dc92216-abb0-457a-9b98-91867fc49345	13022002	S1 Teknik Sipil	-	+6281276746732	2026-08-09 04:28:02.751	2026-09-08 04:28:02.751	47	APPROVED	2026-08-09 04:28:02.752	2026-08-09 07:51:20.585	cca8d808-a7d6-4218-8232-0138b2fef1a8	0.00	f
adcba2a9-9b31-4b4c-bbd7-282373eb2b51	18619d59-4460-4309-ad29-853f00a1e3cb	10123024	S1 Teknik Informatika	-	+6283159700340	2026-08-09 04:28:02.977	2026-09-08 04:28:02.977	47	APPROVED	2026-08-09 04:28:02.978	2026-08-09 07:51:20.615	cca8d808-a7d6-4218-8232-0138b2fef1a8	0.00	f
d84174fe-ae28-457d-a788-bce24f2baabe	8d703fc0-18c1-407a-a897-23455a7c8c7e	10123042	S1 Teknik Informatika	-	+6281235533185	2026-08-09 04:28:03.151	2026-09-08 04:28:03.151	47	APPROVED	2026-08-09 04:28:03.152	2026-08-09 07:51:20.633	cca8d808-a7d6-4218-8232-0138b2fef1a8	0.00	f
efd858c5-3a57-4bda-b540-d0da2af0a3b2	8604cd79-ff2e-4a99-9406-388e963fc9ef	10123053	S1 Teknik Informatika	-	+6281383827707	2026-08-09 04:28:03.338	2026-09-08 04:28:03.338	47	APPROVED	2026-08-09 04:28:03.339	2026-08-09 07:51:20.653	cca8d808-a7d6-4218-8232-0138b2fef1a8	0.00	f
5a68b03d-6d0a-4dc6-b35d-493e692ed2df	a11a7c82-1a7c-4f92-9be1-4cfd40825b65	10123064	S1 Teknik Informatika	-	+6288222143008	2026-08-09 04:28:03.541	2026-09-08 04:28:03.541	47	APPROVED	2026-08-09 04:28:03.542	2026-08-09 07:51:20.674	cca8d808-a7d6-4218-8232-0138b2fef1a8	0.00	f
443e0710-42a6-4f05-bd38-f06e53044323	568e9b5e-09db-43f2-92ff-68da9b5be7d5	10123080	S1 Teknik Informatika	-	+6285199218729	2026-08-09 04:28:03.717	2026-09-08 04:28:03.717	47	APPROVED	2026-08-09 04:28:03.718	2026-08-09 07:51:20.694	cca8d808-a7d6-4218-8232-0138b2fef1a8	0.00	f
89c6be49-5859-4ab0-b223-5e93232b3aa7	949fa6d4-53a7-41c2-b0e0-6d50685c0a3d	10123106	S1 Teknik Informatika	-	+6285718105773	2026-08-09 04:28:03.91	2026-09-08 04:28:03.91	47	APPROVED	2026-08-09 04:28:03.911	2026-08-09 07:51:20.713	cca8d808-a7d6-4218-8232-0138b2fef1a8	0.00	f
7f132b5b-d25a-4dd1-84a1-5ea70438b5ee	e1366b4a-c314-4513-b22f-df0ce1ea7cfa	21124038	S1 Akuntansi	-	+6289675367080	2026-08-09 04:28:04.329	2026-09-08 04:28:04.329	\N	APPROVED	2026-08-09 04:28:04.329	2026-08-09 07:51:20.747	d744db10-4706-4687-9d0b-79bebcc5d99a	0.00	f
13481bfe-0dfa-4a05-9207-5b5b3d04ed3a	9690f0c2-ce3d-4753-8840-df3ae7db7d4e	10423026	S1 Teknik Arsitektur	-	+628882340292	2026-08-09 04:28:04.531	2026-09-08 04:28:04.531	\N	APPROVED	2026-08-09 04:28:04.532	2026-08-09 07:51:20.769	d744db10-4706-4687-9d0b-79bebcc5d99a	0.00	f
a14f295a-d52c-402d-918c-1f735e0647ce	0dce8470-30b0-4aec-b5c9-59257e434a2a	44324064	S1 Hubungan Internasional	-	+6282130925558	2026-08-09 04:28:04.715	2026-09-08 04:28:04.715	\N	APPROVED	2026-08-09 04:28:04.715	2026-08-09 07:51:20.782	d744db10-4706-4687-9d0b-79bebcc5d99a	0.00	f
df92dbfc-7334-42ca-acd8-b78c3472b9e5	8655f822-cc43-4005-8461-47eed7125588	41824064	S1 Ilmu Komunikasi	-	+6282120971897	2026-08-09 04:28:04.913	2026-09-08 04:28:04.913	\N	APPROVED	2026-08-09 04:28:04.914	2026-08-09 07:51:20.813	d744db10-4706-4687-9d0b-79bebcc5d99a	0.00	f
a5e785db-a0f1-4816-a5f6-41cf11e11d70	0b8c6877-f5b3-46ce-826e-7a2c20e57817	10523072	S1 Sistem Informasi	-	+6283839706455	2026-08-09 04:28:05.139	2026-09-08 04:28:05.139	\N	APPROVED	2026-08-09 04:28:05.14	2026-08-09 07:51:20.847	d744db10-4706-4687-9d0b-79bebcc5d99a	0.00	f
eb6551c5-ff82-4bfe-b7fb-c5b8ce43220a	36f6d215-15b2-424b-8894-ac91a158a8a8	10523161	S1 Sistem Informasi	-	+6285117604737	2026-08-09 04:28:05.347	2026-09-08 04:28:05.347	\N	APPROVED	2026-08-09 04:28:05.348	2026-08-09 07:51:20.866	d744db10-4706-4687-9d0b-79bebcc5d99a	0.00	f
ed692ff3-86da-4d44-96e6-54f2a91b12e8	285907b2-73a6-40d5-851c-538ec4ae7db3	10524011	S1 Sistem Informasi	-	+6281292888274	2026-08-09 04:28:05.559	2026-09-08 04:28:05.559	\N	APPROVED	2026-08-09 04:28:05.56	2026-08-09 07:51:20.888	d744db10-4706-4687-9d0b-79bebcc5d99a	0.00	f
58da4320-acd1-4021-8da8-1543bfe81e88	85b2cfa1-9719-40a2-8875-c82179eb8fa0	63824016	S1 Sastra Jepang	-	+6289612144030	2026-08-09 04:28:05.737	2026-09-08 04:28:05.737	\N	APPROVED	2026-08-09 04:28:05.738	2026-08-09 07:51:20.917	d744db10-4706-4687-9d0b-79bebcc5d99a	0.00	f
9e6f0096-292d-49e5-bfa1-f041a7ae17ba	c204ad50-227b-411b-9884-6b13c9f76a9e	13124004	S1 Teknik Elektro	-	+62895402902781	2026-08-09 04:28:05.927	2026-09-08 04:28:05.927	\N	APPROVED	2026-08-09 04:28:05.928	2026-08-09 07:51:20.951	d744db10-4706-4687-9d0b-79bebcc5d99a	0.00	f
afb47fe6-827a-4e86-ab60-280100494f78	ae98ad22-e341-4113-8596-c8ab02d53956	10323018	S1 Teknik Industri	-	+6283821737676	2026-08-09 04:28:06.115	2026-09-08 04:28:06.115	\N	APPROVED	2026-08-09 04:28:06.116	2026-08-09 07:51:20.967	d744db10-4706-4687-9d0b-79bebcc5d99a	0.00	f
5565cbe1-c20e-44c1-81b5-4e36da4a2d61	246cd5c1-ea72-4f30-bfe0-3d2138da24c6	10123014	S1 Teknik Informatika	-	+6281394784696	2026-08-09 04:28:06.318	2026-09-08 04:28:06.319	\N	APPROVED	2026-08-09 04:28:06.319	2026-08-09 07:51:20.992	d744db10-4706-4687-9d0b-79bebcc5d99a	0.00	f
fbba5913-e31b-4dc4-bed4-0996507c8960	cf0fbe66-d436-4c5d-a40c-76db250278bd	10123039	S1 Teknik Informatika	-	+628983743989	2026-08-09 04:28:06.524	2026-09-08 04:28:06.524	\N	APPROVED	2026-08-09 04:28:06.525	2026-08-09 07:51:21.011	d744db10-4706-4687-9d0b-79bebcc5d99a	0.00	f
9ba03555-c187-4c4b-9bf2-a0a435faa9fd	c1255723-50b9-4f51-8b46-b87302893aa4	123123123	-	-	+628111111118	2026-08-10 12:07:46.608	2026-10-09 12:07:46.608	\N	APPROVED	2026-08-10 12:07:46.61	2026-08-10 12:15:48.848	\N	0.00	f
f140a8bd-4c89-458b-aa5d-febfef99bbd0	60cfb7f7-79b2-4330-a553-440a36286a04	10123065	S1 Teknik Informatika	-	+6281221610620	2026-08-09 04:28:07.124	2026-09-08 04:28:07.124	\N	APPROVED	2026-08-09 04:28:07.125	2026-08-09 07:51:21.051	d744db10-4706-4687-9d0b-79bebcc5d99a	0.00	f
db48d434-5c4c-43b7-979d-8863082d70fd	8818ddce-8082-4ffb-bf62-b86635b98993	52124001	D3 Desain Grafis	-	+6282215325293	2026-08-09 04:28:07.74	2026-09-08 04:28:07.74	\N	APPROVED	2026-08-09 04:28:07.741	2026-08-09 07:51:21.095	487d33d3-3bbb-498d-b845-7825106beb28	0.00	f
b4c8a4eb-bf20-44db-a2b8-a46758fef50b	4a9a325c-7f5f-4357-aca7-f860029d810b	41823074	S1 Ilmu Komunikasi	-	+6285794226717	2026-08-09 04:28:08.127	2026-09-08 04:28:08.127	\N	APPROVED	2026-08-09 04:28:08.128	2026-08-09 07:51:21.119	487d33d3-3bbb-498d-b845-7825106beb28	0.00	f
95587f9a-6d51-4a33-abc3-5a62cec8770b	13aac86a-3e73-4b6b-b3c2-db3afab2ad86	10523076	S1 Sistem Informasi	-	+6285872214755	2026-08-09 04:28:08.308	2026-09-08 04:28:08.308	\N	APPROVED	2026-08-09 04:28:08.309	2026-08-09 07:51:21.137	487d33d3-3bbb-498d-b845-7825106beb28	0.00	f
33551165-3ebc-424f-8fd8-41861fc92a74	261cdf49-f942-4969-8792-0ec079e5a5b3	10523193	S1 Sistem Informasi	-	+62895806307527	2026-08-09 04:28:08.53	2026-09-08 04:28:08.53	\N	APPROVED	2026-08-09 04:28:08.531	2026-08-09 07:51:21.159	487d33d3-3bbb-498d-b845-7825106beb28	0.00	f
02a3d49b-f3bd-4e7f-9ac1-7994cd950401	d9743a5d-9e3e-42f4-b0e7-20910ee58781	10924003	D3 Manajemen Informatika	-	+6283190777713	2026-08-09 04:28:08.725	2026-09-08 04:28:08.725	\N	APPROVED	2026-08-09 04:28:08.726	2026-08-09 07:51:21.176	487d33d3-3bbb-498d-b845-7825106beb28	0.00	f
f74c8eab-fa72-473d-b5a9-6d48b4f07358	12b09bd9-3edf-44fb-87ac-96905a785765	52024013	S1 Desain Interior	-	+6289699945266	2026-08-09 04:28:10.946	2026-09-08 04:28:10.946	\N	APPROVED	2026-08-09 04:28:10.946	2026-08-09 07:51:21.191	5407a6a1-c436-4db8-9757-cec1426f5f4d	0.00	f
c63fafa8-d4cf-4013-9a13-2bcad00af4b4	d2bcc4f1-e54e-4837-bb74-2ef2d9714149	31624019	S1 Ilmu Hukum	-	+62895338789991	2026-08-09 04:28:11.157	2026-09-08 04:28:11.157	\N	APPROVED	2026-08-09 04:28:11.158	2026-08-09 07:51:21.219	5407a6a1-c436-4db8-9757-cec1426f5f4d	0.00	f
85246088-8a0a-4c16-8904-1e6e89048c7b	83892502-e36e-4037-8079-ccd14525b985	41823031	S1 Ilmu Komunikasi	-	+6281298102636	2026-08-09 04:28:11.353	2026-09-08 04:28:11.353	\N	APPROVED	2026-08-09 04:28:11.354	2026-08-09 07:51:21.237	5407a6a1-c436-4db8-9757-cec1426f5f4d	0.00	f
2e4d0ddf-5628-4125-9f41-a141da0c7ad0	c8cdd213-a7c3-4441-8c27-73446d0d0a99	10523077	S1 Sistem Informasi	-	+62895422735599	2026-08-09 04:28:11.576	2026-09-08 04:28:11.576	\N	APPROVED	2026-08-09 04:28:11.577	2026-08-09 07:51:21.26	5407a6a1-c436-4db8-9757-cec1426f5f4d	0.00	f
cad0aaa8-9059-4c4e-ab03-28198ec58db5	2bf136de-0bf4-4142-a838-79e961ba075a	63724011	Sastra Inggris	-	+62895326526550	2026-08-09 04:28:11.952	2026-09-08 04:28:11.952	\N	APPROVED	2026-08-09 04:28:11.952	2026-08-09 07:51:21.278	5407a6a1-c436-4db8-9757-cec1426f5f4d	0.00	f
b54762e1-bf14-425e-9d6f-fe7fac6d5dfd	36991da6-dab1-41f8-a285-33d05fe62878	10224020	S1 Sistem Komputer	-	+6281546894967	2026-08-09 04:28:12.149	2026-09-08 04:28:12.149	\N	APPROVED	2026-08-09 04:28:12.15	2026-08-09 07:51:21.302	5407a6a1-c436-4db8-9757-cec1426f5f4d	0.00	f
0854c38e-9403-4683-be20-1e0db398eece	403096e5-7771-4f7e-b34c-90fd8ce3d5e3	13124005	S1 Teknik Elektro	-	+6283813319980	2026-08-09 04:28:12.355	2026-09-08 04:28:12.355	\N	APPROVED	2026-08-09 04:28:12.358	2026-08-09 07:51:21.32	5407a6a1-c436-4db8-9757-cec1426f5f4d	0.00	f
fa5a11b6-b26a-433b-a6e2-e78ba7f9138d	e38dc614-38b4-4eba-8137-11f663fb05fc	10123062	S1 Teknik Informatika	-	+6281290808347	2026-08-09 04:28:13.127	2026-09-08 04:28:13.127	\N	APPROVED	2026-08-09 04:28:13.128	2026-08-09 07:51:21.342	5407a6a1-c436-4db8-9757-cec1426f5f4d	0.00	f
1c120c26-f737-4345-8624-df2bd3c13be5	ab3a7aef-25e3-4743-b448-cdd7cf347941	44324026	S1 Hubungan Internasional	-	+6281253638240	2026-08-09 04:28:14.341	2026-09-08 04:28:14.341	32	APPROVED	2026-08-09 04:28:14.341	2026-08-09 07:51:21.37	ca0f1b98-a9b2-46c0-850d-089570350af0	0.00	f
b1ff14b5-379e-4909-a72a-a365a9183e9e	569ddb39-d63d-4d0c-98a5-0bd0b1d24ba9	41824054	S1 Ilmu Komunikasi	-	+6282128111807	2026-08-09 04:28:14.535	2026-09-08 04:28:14.535	32	APPROVED	2026-08-09 04:28:14.536	2026-08-09 07:51:21.393	ca0f1b98-a9b2-46c0-850d-089570350af0	0.00	f
acda556d-59e1-4c76-98f1-56418d490114	f6014e72-a3c6-4772-b20a-2f6a2c85e3f4	10524032	S1 Sistem Informasi	-	+6281286174969	2026-08-09 04:28:14.749	2026-09-08 04:28:14.749	32	APPROVED	2026-08-09 04:28:14.751	2026-08-09 07:51:21.426	ca0f1b98-a9b2-46c0-850d-089570350af0	0.00	f
63f75809-bae1-4240-bc3a-689e6b686437	d36431b1-8ce9-4d84-8db7-3f81bbb6c122	13022008	S1 Teknik Sipil	-	+6281222761737	2026-08-09 04:28:15.689	2026-09-08 04:28:15.689	32	APPROVED	2026-08-09 04:28:15.69	2026-08-09 07:51:21.443	ca0f1b98-a9b2-46c0-850d-089570350af0	0.00	f
0ef17bd9-8a66-49d7-9b04-18b1cd12b946	ada4e687-a69d-4a72-9973-bdf002301a82	10123136	S1 Teknik Informatika	-	+6285624709908	2026-08-09 04:28:15.864	2026-09-08 04:28:15.864	32	APPROVED	2026-08-09 04:28:15.865	2026-08-09 07:51:21.465	ca0f1b98-a9b2-46c0-850d-089570350af0	0.00	f
a8a91c1f-a48c-40f2-a294-6818df858954	e7d22429-699c-46c1-adab-a979ddcfa1b8	10123433	S1 Teknik Informatika	-	+6283892668197	2026-08-09 04:28:16.701	2026-09-08 04:28:16.701	32	APPROVED	2026-08-09 04:28:16.702	2026-08-09 07:51:21.493	ca0f1b98-a9b2-46c0-850d-089570350af0	0.00	f
ed8fac7b-e688-4cfc-a67c-5056b70ec0c6	b0e17308-d8fc-400f-82a8-c9394d56fc3b	21124808	S1 Akuntansi	-	+6285182327492	2026-08-09 04:28:16.951	2026-09-08 04:28:16.951	\N	APPROVED	2026-08-09 04:28:16.952	2026-08-09 07:51:21.524	bb4928cf-a3f7-41c3-a62d-03b62500a3de	0.00	f
4283ff93-a268-497c-8b96-99ff30bb7f6d	07a06dbf-4d11-49ee-a2a1-6a4a137aa3c9	10421060	S1 Teknik Arsitektur	-	+6289527237309	2026-08-09 04:28:17.142	2026-09-08 04:28:17.142	\N	APPROVED	2026-08-09 04:28:17.143	2026-08-09 07:51:21.55	bb4928cf-a3f7-41c3-a62d-03b62500a3de	0.00	f
5f3e6917-9ec2-4346-a295-20bcc9793e57	808a89bc-6ba0-4887-a442-484e6e42058b	10224017	S1 Sistem Komputer	-	+6281324514350	2026-08-09 04:28:18.344	2026-09-08 04:28:18.344	\N	APPROVED	2026-08-09 04:28:18.346	2026-08-09 07:51:21.569	bb4928cf-a3f7-41c3-a62d-03b62500a3de	0.00	f
c0ff1232-6ea8-4249-b410-8210ec2240e6	cb069575-f69c-4cf8-a375-051751aae366	10123328	S1 Teknik Informatika	-	+6281320387478	2026-08-09 04:28:18.913	2026-09-08 04:28:18.913	\N	APPROVED	2026-08-09 04:28:18.914	2026-08-09 07:51:21.58	bb4928cf-a3f7-41c3-a62d-03b62500a3de	0.00	f
c7b9f90a-a55f-408e-bab1-d00c4a240c4b	d910be09-1bb3-478a-9452-2f1335a5b26f	10123436	S1 Teknik Informatika	-	+6283173277565	2026-08-09 04:28:19.315	2026-09-08 04:28:19.315	\N	APPROVED	2026-08-09 04:28:19.316	2026-08-09 07:51:21.621	bb4928cf-a3f7-41c3-a62d-03b62500a3de	0.00	f
1d7e82a8-2e27-4259-a41c-8552593c05fa	2833bf56-d7f0-4dd4-b544-1e8784e5b638	10124058	S1 Teknik Informatika	-	+6289527514308	2026-08-09 04:28:19.508	2026-09-08 04:28:19.508	\N	APPROVED	2026-08-09 04:28:19.508	2026-08-09 07:51:21.655	bb4928cf-a3f7-41c3-a62d-03b62500a3de	0.00	f
bd7a1796-3fb4-483b-b213-4d53e79654f5	c0cdc125-636a-44f9-9139-f1bc18d8791e	21124806	S1 Akuntansi	-	+6287821641891	2026-08-09 04:28:19.73	2026-09-08 04:28:19.73	\N	APPROVED	2026-08-09 04:28:19.731	2026-08-09 07:51:21.677	b1165842-ae6c-4a8e-b115-cb8f695aae84	0.00	f
aacad83a-abff-4e33-b027-91981ebbb6b2	d2bc4de3-a4cd-483c-bda8-c177ff4c1a20	51924064	S1 Desain Komunikasi Visual	-	+6281223532154	2026-08-09 04:28:19.922	2026-09-08 04:28:19.922	\N	APPROVED	2026-08-09 04:28:19.923	2026-08-09 07:51:21.696	b1165842-ae6c-4a8e-b115-cb8f695aae84	0.00	f
e5371d18-abc6-43a4-9629-ee788022fc53	21994162-63f3-4b89-8765-7e5f68d68cb7	31624015	S1 Ilmu Hukum	-	+6285862005434	2026-08-09 04:28:20.104	2026-09-08 04:28:20.104	\N	APPROVED	2026-08-09 04:28:20.105	2026-08-09 07:51:21.715	b1165842-ae6c-4a8e-b115-cb8f695aae84	0.00	f
ef5ad338-a1e7-4757-a168-8f3106dde4d4	91cc7dea-d290-4ff6-a44d-45d690dc6b39	41824058	S1 Ilmu Komunikasi	-	+6285798428562	2026-08-09 04:28:20.307	2026-09-08 04:28:20.307	\N	APPROVED	2026-08-09 04:28:20.308	2026-08-09 07:51:21.732	b1165842-ae6c-4a8e-b115-cb8f695aae84	0.00	f
93553c9f-d41c-42e3-92d9-415eaf83704e	de876ac2-568e-4901-8349-63d49e9a14dc	10123081	S1 Teknik Informatika	-	+6281224026414	2026-08-09 04:28:07.318	2026-09-08 04:28:07.318	\N	APPROVED	2026-08-09 04:28:07.319	2026-08-09 07:51:21.772	d744db10-4706-4687-9d0b-79bebcc5d99a	0.00	f
a044f81b-d225-4c69-a2d1-4e20d48a7203	9cb2d04f-cbbb-439d-bf40-251b8f04554a	44324041	S1 Hubungan Internasional	-	+6283896685944	2026-08-09 04:28:07.935	2026-09-08 04:28:07.935	\N	APPROVED	2026-08-09 04:28:07.936	2026-08-09 07:51:21.793	487d33d3-3bbb-498d-b845-7825106beb28	0.00	f
c981543f-6fc8-4052-ad45-752b19f8fbd5	3b952f73-2422-4c3d-bb4e-9775e151bdc0	10224007	S1 Sistem Komputer	-	+6281382278042	2026-08-09 04:28:08.919	2026-09-08 04:28:08.919	\N	APPROVED	2026-08-09 04:28:08.92	2026-08-09 07:51:21.81	487d33d3-3bbb-498d-b845-7825106beb28	0.00	f
396a8d29-e070-41b7-8ecd-1938953badc3	f039ee01-9df9-44ad-9835-8c97509d8a0d	13022018	S1 Teknik Sipil	-	+6285624208958	2026-08-09 04:28:09.131	2026-09-08 04:28:09.131	\N	APPROVED	2026-08-09 04:28:09.132	2026-08-09 07:51:21.833	487d33d3-3bbb-498d-b845-7825106beb28	0.00	f
c38f4338-e06a-49df-af2e-cd17c770c917	4d151cf1-09dd-4a66-9c34-773ff7349364	10123015	S1 Teknik Informatika	-	+6281953171433	2026-08-09 04:28:09.355	2026-09-08 04:28:09.355	\N	APPROVED	2026-08-09 04:28:09.356	2026-08-09 07:51:21.848	487d33d3-3bbb-498d-b845-7825106beb28	0.00	f
63c9ca5e-737e-4827-b71d-5eed87b2699f	3c949ec0-4e0b-4d76-a23e-6da56b933f2a	10123040	S1 Teknik Informatika	-	+6282123419510	2026-08-09 04:28:09.568	2026-09-08 04:28:09.568	\N	APPROVED	2026-08-09 04:28:09.569	2026-08-09 07:51:21.862	487d33d3-3bbb-498d-b845-7825106beb28	0.00	f
08eb9913-3739-4cc1-a794-273de1968c63	939f14bf-8c17-4f41-b2b2-3e8ed389bc8e	10123047	S1 Teknik Informatika	-	+6281221909802	2026-08-09 04:28:09.757	2026-09-08 04:28:09.757	\N	APPROVED	2026-08-09 04:28:09.758	2026-08-09 07:51:21.885	487d33d3-3bbb-498d-b845-7825106beb28	0.00	f
932178dd-f4af-437d-8e2d-a72c8a01b23a	e98210a9-75e3-4b6e-9456-2b6d2e39107a	10123057	S1 Teknik Informatika	-	+6281210820209	2026-08-09 04:28:09.965	2026-09-08 04:28:09.965	\N	APPROVED	2026-08-09 04:28:09.966	2026-08-09 07:51:21.91	487d33d3-3bbb-498d-b845-7825106beb28	0.00	f
e5910932-281e-4e17-813f-bc0dc60ab6ae	7729ddde-6af8-41c9-b4ae-ad2d5a06e994	10123073	S1 Teknik Informatika	-	+6282368036106	2026-08-09 04:28:10.163	2026-09-08 04:28:10.163	\N	APPROVED	2026-08-09 04:28:10.165	2026-08-09 07:51:21.937	487d33d3-3bbb-498d-b845-7825106beb28	0.00	f
0a53c1a6-9a3a-4abb-9a5f-c6df759f8f4f	eba872a0-2901-4820-8265-f419060e5a07	10123099	S1 Teknik Informatika	-	+6281910452162	2026-08-09 04:28:10.362	2026-09-08 04:28:10.362	\N	APPROVED	2026-08-09 04:28:10.363	2026-08-09 07:51:21.955	487d33d3-3bbb-498d-b845-7825106beb28	0.00	f
2d939f34-a8af-431f-887f-cb6b9b4b8364	a01e6ca5-2e10-4437-86d9-95022b1db1fa	10422038	S1 Teknik Arsitektur	-	+6287747934281	2026-08-09 04:28:10.752	2026-09-08 04:28:10.752	\N	APPROVED	2026-08-09 04:28:10.753	2026-08-09 07:51:21.977	5407a6a1-c436-4db8-9757-cec1426f5f4d	0.00	f
00230fe5-bf55-4e22-bf5f-07d3f6fe5dbe	3020be89-6795-4bbd-a49d-b40223b2d72b	10524002	S1 Sistem Informasi	-	+6285846221380	2026-08-09 04:28:11.76	2026-09-08 04:28:11.76	\N	APPROVED	2026-08-09 04:28:11.761	2026-08-09 07:51:21.992	5407a6a1-c436-4db8-9757-cec1426f5f4d	0.00	f
6007a4f8-8650-4e04-959a-78d87a58419a	19712eff-65c3-4e51-ae83-1b4547b95954	13022009	S1 Teknik Sipil	-	+6282117244607	2026-08-09 04:28:12.534	2026-09-08 04:28:12.534	\N	APPROVED	2026-08-09 04:28:12.535	2026-08-09 07:51:22.01	5407a6a1-c436-4db8-9757-cec1426f5f4d	0.00	f
0c20ef23-53d7-4534-867a-cff069464de0	163b5bd2-6b5b-4c74-8414-13f158e4652e	10123041	S1 Teknik Informatika	-	+6287829623083	2026-08-09 04:28:12.717	2026-09-08 04:28:12.717	\N	APPROVED	2026-08-09 04:28:12.718	2026-08-09 07:51:22.03	5407a6a1-c436-4db8-9757-cec1426f5f4d	0.00	f
12a2c11a-2e9a-4863-8484-4f23f8b46ea6	3e50e197-ba00-4291-a3e9-ae4d809ba41b	10123049	S1 Teknik Informatika	-	+6283133926574	2026-08-09 04:28:12.921	2026-09-08 04:28:12.921	\N	APPROVED	2026-08-09 04:28:12.922	2026-08-09 07:51:22.054	5407a6a1-c436-4db8-9757-cec1426f5f4d	0.00	f
79f9bb28-da9d-44f4-805b-57eaf49850fb	04de6551-b588-4655-a64d-2dcdc5f976f3	10123076	S1 Teknik Informatika	-	+6287817066930	2026-08-09 04:28:13.326	2026-09-08 04:28:13.326	\N	APPROVED	2026-08-09 04:28:13.328	2026-08-09 07:51:22.074	5407a6a1-c436-4db8-9757-cec1426f5f4d	0.00	f
0059cea6-de6d-4116-8473-9be2760f6476	d62a922a-2fb9-41bc-b677-b2466961d855	10123105	S1 Teknik Informatika	-	+6283145310967	2026-08-09 04:28:13.524	2026-09-08 04:28:13.524	\N	APPROVED	2026-08-09 04:28:13.524	2026-08-09 07:51:22.093	5407a6a1-c436-4db8-9757-cec1426f5f4d	0.00	f
d9308c82-0266-42bb-9a6e-774f9a7a8d9e	9c4d6870-13b5-46a3-b145-4b122ea95009	21124802	S1 Akuntansi	-	+6283143224685	2026-08-09 04:28:13.953	2026-09-08 04:28:13.953	32	APPROVED	2026-08-09 04:28:13.954	2026-08-09 07:51:22.128	ca0f1b98-a9b2-46c0-850d-089570350af0	0.00	f
0cb38ef3-dae4-4b9e-b562-33e3a33ee631	422d60cd-d768-4eb3-91af-6f0297d03388	10421023	S1 Teknik Arsitektur	-	+6282125725966	2026-08-09 04:28:14.142	2026-09-08 04:28:14.142	32	APPROVED	2026-08-09 04:28:14.143	2026-08-09 07:51:22.148	ca0f1b98-a9b2-46c0-850d-089570350af0	0.00	f
5705b467-5676-484b-b234-d3b204231243	f55459b6-4210-4639-aae1-31f5b2371e38	10524056	S1 Sistem Informasi	-	+6282120468245	2026-08-09 04:28:14.969	2026-09-08 04:28:14.969	32	APPROVED	2026-08-09 04:28:14.97	2026-08-09 07:51:22.17	ca0f1b98-a9b2-46c0-850d-089570350af0	0.00	f
7a16573c-bdaa-405a-87c2-5406c42ca164	0645a00d-bf99-404d-a52f-cc9e56e835b1	10923007	D3 Manajemen Informatika	-	+6283197727852	2026-08-09 04:28:15.162	2026-09-08 04:28:15.162	32	APPROVED	2026-08-09 04:28:15.164	2026-08-09 07:51:22.195	ca0f1b98-a9b2-46c0-850d-089570350af0	0.00	f
86feeaf6-038a-4649-ba45-a6b7c382215e	66ab80ee-d12f-47f2-b50b-cf578e539a1e	10224011	S1 Sistem Komputer	-	+6283835782323	2026-08-09 04:28:15.339	2026-09-08 04:28:15.339	32	APPROVED	2026-08-09 04:28:15.34	2026-08-09 07:51:22.217	ca0f1b98-a9b2-46c0-850d-089570350af0	0.00	f
d876963e-b0da-4098-bbf5-c882b02afeac	1a23280c-8d2d-45fb-bade-a5e4dfd22752	13124010	S1 Teknik Elektro	-	+6289687976529	2026-08-09 04:28:15.519	2026-09-08 04:28:15.519	32	APPROVED	2026-08-09 04:28:15.52	2026-08-09 07:51:22.233	ca0f1b98-a9b2-46c0-850d-089570350af0	0.00	f
d06cc493-b63a-4ae3-baaf-3707c69dbd2c	601707c3-f82f-4548-8891-002a9c492cc1	10123239	S1 Teknik Informatika	-	+6285782116995	2026-08-09 04:28:16.069	2026-09-08 04:28:16.069	32	APPROVED	2026-08-09 04:28:16.07	2026-08-09 07:51:22.255	ca0f1b98-a9b2-46c0-850d-089570350af0	0.00	f
af23c2a3-64ea-4fe5-94a9-af7ef1180b5b	12b04111-14bb-4795-bf72-d39cda2d24cb	10123292	S1 Teknik Informatika	-	+6285156804076	2026-08-09 04:28:16.278	2026-09-08 04:28:16.278	32	APPROVED	2026-08-09 04:28:16.279	2026-08-09 07:51:22.275	ca0f1b98-a9b2-46c0-850d-089570350af0	0.00	f
a84373e3-ea16-4eb9-9c94-6392c1ce002e	8b25b8d9-3100-461f-82fa-45f702066cd0	10123367	S1 Teknik Informatika	-	+6281461173586	2026-08-09 04:28:16.481	2026-09-08 04:28:16.481	32	APPROVED	2026-08-09 04:28:16.481	2026-08-09 07:51:22.298	ca0f1b98-a9b2-46c0-850d-089570350af0	0.00	f
a202c5a2-e647-4b0e-9004-d2b41cf16766	4c77daa9-73cc-4558-b99c-13b48c21dcd6	44324015	S1 Hubungan Internasional	-	+6285220590156	2026-08-09 04:28:17.357	2026-09-08 04:28:17.357	\N	APPROVED	2026-08-09 04:28:17.358	2026-08-09 07:51:22.34	bb4928cf-a3f7-41c3-a62d-03b62500a3de	0.00	f
c497e751-0ed1-40f2-a5c8-cd2143f4bb7f	be32cd95-3f35-444b-9220-14280cf4d0b9	41822157	S1 Ilmu Komunikasi	-	+6281312923808	2026-08-09 04:28:17.555	2026-09-08 04:28:17.555	\N	APPROVED	2026-08-09 04:28:17.556	2026-08-09 07:51:22.355	bb4928cf-a3f7-41c3-a62d-03b62500a3de	0.00	f
ea006874-6c06-4a5f-839d-6fae7ced199c	55cbf9c9-8044-44bb-bb97-06804e26d62a	10524034	S1 Sistem Informasi	-	+6281297531268	2026-08-09 04:28:17.768	2026-09-08 04:28:17.768	\N	APPROVED	2026-08-09 04:28:17.769	2026-08-09 07:51:22.381	bb4928cf-a3f7-41c3-a62d-03b62500a3de	0.00	f
73977e35-02f2-4181-bd3e-8b9769b623f5	a97ae1e3-231b-484f-a388-0b878ea33132	10524057	S1 Sistem Informasi	-	+6281314692013	2026-08-09 04:28:17.953	2026-09-08 04:28:17.953	\N	APPROVED	2026-08-09 04:28:17.954	2026-08-09 07:51:22.407	bb4928cf-a3f7-41c3-a62d-03b62500a3de	0.00	f
c870c90f-dc55-4984-a69a-baeccb46af9b	4d1e7633-d01f-4480-a2f1-443773ab2252	13025031	S1 Teknik Sipil	-	+6289607789635	2026-08-09 04:28:18.546	2026-09-08 04:28:18.546	\N	APPROVED	2026-08-09 04:28:18.547	2026-08-09 07:51:22.449	bb4928cf-a3f7-41c3-a62d-03b62500a3de	0.00	f
039fd2b1-7960-45bb-b649-24ea18754790	0eefffdc-9e94-4acc-bc27-f5c7677a9798	10123157	S1 Teknik Informatika	-	+6282119678835	2026-08-09 04:28:18.723	2026-09-08 04:28:18.723	\N	APPROVED	2026-08-09 04:28:18.724	2026-08-09 07:51:22.469	bb4928cf-a3f7-41c3-a62d-03b62500a3de	0.00	f
1dc15803-342c-477d-8440-722c0450d2fd	de03ae5f-ba9b-4d01-a08b-c6db8025e6bf	10524035	S1 Sistem Informasi	-	+6282217891422	2026-08-09 04:28:20.491	2026-09-08 04:28:20.491	\N	APPROVED	2026-08-09 04:28:20.492	2026-08-09 07:51:22.489	b1165842-ae6c-4a8e-b115-cb8f695aae84	0.00	f
3024ffda-c78f-4ff8-8dd3-d1d51067f1d8	9105178d-bfbd-4001-b4d0-528e49f2f196	10524063	S1 Sistem Informasi	-	+6287887851769	2026-08-09 04:28:20.685	2026-09-08 04:28:20.685	\N	APPROVED	2026-08-09 04:28:20.686	2026-08-09 07:51:22.519	b1165842-ae6c-4a8e-b115-cb8f695aae84	0.00	f
98afc936-552a-4456-a516-edc793d783ab	ea022b6e-862b-44c9-977f-8730de2074f8	63823036	S1 Sastra Jepang	-	+628813083287	2026-08-09 04:28:20.868	2026-09-08 04:28:20.868	\N	APPROVED	2026-08-09 04:28:20.869	2026-08-09 07:51:22.537	b1165842-ae6c-4a8e-b115-cb8f695aae84	0.00	f
f589f413-ccf5-4972-a2e0-ef6cf2838d30	7e5a9409-1aca-44f4-a1bb-32b0013a0f99	13124016	S1 Teknik Elektro	-	+6288223220280	2026-08-09 04:28:21.055	2026-09-08 04:28:21.055	\N	APPROVED	2026-08-09 04:28:21.056	2026-08-09 07:51:22.555	b1165842-ae6c-4a8e-b115-cb8f695aae84	0.00	f
6e59c93c-41c0-4fec-a3fc-b79ed5602827	bd4dc443-8500-4530-8fdd-2e67b510d101	11024013	D3 Akuntansi (Komputerisasi Akuntansi)	-	+6285642178320	2026-08-09 04:28:22.639	2026-09-08 04:28:22.639	\N	APPROVED	2026-08-09 04:28:22.64	2026-08-09 07:51:22.59	4c6f7f84-f021-45b7-94ae-27237ac348bc	0.00	f
63cf29f3-b5e8-487e-aa93-a561ba28b7ec	4f19e0c6-ac83-4e85-9e40-18cec476e6a4	52024009	S1 Desain Interior	-	+6281398458958	2026-08-09 04:28:22.884	2026-09-08 04:28:22.884	\N	APPROVED	2026-08-09 04:28:22.885	2026-08-09 07:51:22.618	4c6f7f84-f021-45b7-94ae-27237ac348bc	0.00	f
8869a993-b90c-44ed-a4f9-9cf8918fb3d4	592894a2-68ef-4c91-a493-17bf3051433f	41724008	S1 Ilmu Pemerintahan	-	+6281919966556	2026-08-09 04:28:23.363	2026-09-08 04:28:23.363	\N	APPROVED	2026-08-09 04:28:23.364	2026-08-09 07:51:22.645	4c6f7f84-f021-45b7-94ae-27237ac348bc	0.00	f
3e73c30b-54c6-4595-9f54-eb54a497f0fb	e07f32af-ed17-4a93-8932-0f8b4ba023d5	10524048	S1 Sistem Informasi	-	+6289991392279	2026-08-09 04:28:23.604	2026-09-08 04:28:23.604	\N	APPROVED	2026-08-09 04:28:23.605	2026-08-09 07:51:22.671	4c6f7f84-f021-45b7-94ae-27237ac348bc	0.00	f
5d078c69-5872-4ac6-a7cc-8c3cc91ffa02	9718b096-b11f-488b-9000-e1ed66c42f4a	10524065	S1 Sistem Informasi	-	+6283153709000	2026-08-09 04:28:23.81	2026-09-08 04:28:23.81	\N	APPROVED	2026-08-09 04:28:23.811	2026-08-09 07:51:22.692	4c6f7f84-f021-45b7-94ae-27237ac348bc	0.00	f
3332f1c8-a479-41b3-b274-a5e5c0a60365	bddabbcc-ed36-4293-9c05-c262a4162131	63824025	S1 Sastra Jepang	-	+6281319699159	2026-08-09 04:28:24.043	2026-09-08 04:28:24.043	\N	APPROVED	2026-08-09 04:28:24.044	2026-08-09 07:51:22.721	4c6f7f84-f021-45b7-94ae-27237ac348bc	0.00	f
398b67c7-03cc-4a32-bd55-6f6ccfbac650	8a016503-ea32-41f8-b17f-331464479544	10123217	S1 Teknik Informatika	-	+6281906589606	2026-08-09 04:28:24.883	2026-09-08 04:28:24.883	\N	APPROVED	2026-08-09 04:28:24.884	2026-08-09 07:51:22.743	4c6f7f84-f021-45b7-94ae-27237ac348bc	0.00	f
c54a68a4-b34e-48b5-bc97-eb42f25f635b	b2fbfd6f-13c6-4a85-8d6e-edaf46c44d38	10123415	S1 Teknik Informatika	-	+6281293357879	2026-08-09 04:28:25.581	2026-09-08 04:28:25.581	\N	APPROVED	2026-08-09 04:28:25.582	2026-08-09 07:51:22.765	4c6f7f84-f021-45b7-94ae-27237ac348bc	0.00	f
f8bbbcef-6390-4744-9652-dd2d5f947194	6990ab16-78ae-4110-bd96-bd44e1334183	10123470	S1 Teknik Informatika	-	+6282336702004	2026-08-09 04:28:25.78	2026-09-08 04:28:25.78	\N	APPROVED	2026-08-09 04:28:25.781	2026-08-09 07:51:22.785	4c6f7f84-f021-45b7-94ae-27237ac348bc	0.00	f
46eaeea0-78f9-468a-b9cb-5cdb2162c441	ea186cb7-bcb1-4168-9023-feb421ce7eb4	10423024	S1 Teknik Arsitektur	-	+6282164092648	2026-08-09 04:28:26.018	2026-09-08 04:28:26.018	33	APPROVED	2026-08-09 04:28:26.019	2026-08-09 07:51:22.805	19f594a5-7d50-4560-a9d5-5841201295ea	0.00	f
910cefe4-5f56-4eaa-a433-4024b266c99b	4f08e0bc-7913-4505-b559-470d54f710fa	10524018	S1 Sistem Informasi	-	+6282128790630	2026-08-09 04:28:26.419	2026-09-08 04:28:26.419	33	APPROVED	2026-08-09 04:28:26.42	2026-08-09 07:51:22.827	19f594a5-7d50-4560-a9d5-5841201295ea	0.00	f
84adabb0-9c17-41d8-abd8-42937f7a211f	4f2f746c-ee14-4481-a60d-38977fdb3298	10524050	S1 Sistem Informasi	-	+6289991392293	2026-08-09 04:28:26.622	2026-09-08 04:28:26.622	33	APPROVED	2026-08-09 04:28:26.623	2026-08-09 07:51:22.851	19f594a5-7d50-4560-a9d5-5841201295ea	0.00	f
d74b62dd-8705-464c-a20e-bf1a7fe5a38f	3f8958d6-ff2d-4e24-a0ca-a8b2ca13da70	63824026	S1 Sastra Jepang	-	+6287771375516	2026-08-09 04:28:27.057	2026-09-08 04:28:27.057	33	APPROVED	2026-08-09 04:28:27.058	2026-08-09 07:51:22.87	19f594a5-7d50-4560-a9d5-5841201295ea	0.00	f
a63ffa9e-5337-45e7-94da-51bf6c4f7a7b	ab2780e9-9666-4640-a6b7-43eb489e1edf	10123115	S1 Teknik Informatika	-	+6282117778311	2026-08-09 04:28:27.654	2026-09-08 04:28:27.654	33	APPROVED	2026-08-09 04:28:27.655	2026-08-09 07:51:22.889	19f594a5-7d50-4560-a9d5-5841201295ea	0.00	f
af7de500-2fc3-48f4-b415-222575d6fbed	3d251dc9-92a6-4ee1-b04d-099ab1c2d622	10123915	S1 Teknik Informatika	-	+62895322050705	2026-08-09 04:28:28.428	2026-09-08 04:28:28.428	33	APPROVED	2026-08-09 04:28:28.429	2026-08-09 07:51:22.918	19f594a5-7d50-4560-a9d5-5841201295ea	0.00	f
32d36388-2c66-44fc-9bdf-437ddd499d3f	1941ae1b-3426-4922-ab7e-7c1267d3bcfd	10423035	S1 Teknik Arsitektur	-	+6281288102229	2026-08-09 04:28:29.172	2026-09-08 04:28:29.172	36	APPROVED	2026-08-09 04:28:29.173	2026-08-09 07:51:22.949	cc5677e8-37b4-409d-9bca-2bb21a7fc0ce	0.00	f
5ad7e726-0336-42c7-8819-40e0c05fb021	c67fc44a-9449-4627-8c72-b8b0c16e1e95	10123366	S1 Teknik Informatika	-	+6289670447000	2026-08-09 04:28:31.323	2026-09-08 04:28:31.323	36	APPROVED	2026-08-09 04:28:31.324	2026-08-09 07:51:22.994	cc5677e8-37b4-409d-9bca-2bb21a7fc0ce	0.00	f
0c13cfa2-2791-47ab-a835-2450cdd74ef7	415ca0b8-8cb9-4cb7-90e9-60554e31957b	10123005	S1 Teknik Informatika	-	+62895339601932	2026-08-09 04:28:31.968	2026-09-08 04:28:31.968	\N	APPROVED	2026-08-09 04:28:31.969	2026-08-09 07:51:23.191	251534d8-fc11-4b89-8a17-cb510e4c6821	0.00	f
66bef071-66a3-4519-9b3a-6760a35963cc	ec5dd756-3a15-444c-aa4a-c26ebd0b4fd0	10123020	S1 Teknik Informatika	-	+6285624705371	2026-08-09 04:28:32.155	2026-09-08 04:28:32.155	\N	APPROVED	2026-08-09 04:28:32.156	2026-08-09 07:51:23.231	251534d8-fc11-4b89-8a17-cb510e4c6821	0.00	f
fd24f466-cd51-4a26-8ec4-8a4d8663949b	14a5bc4d-6749-460a-ab08-fb556690ad53	10123021	S1 Teknik Informatika	-	+6281221515809	2026-08-09 04:28:32.352	2026-09-08 04:28:32.352	\N	APPROVED	2026-08-09 04:28:32.353	2026-08-09 07:51:23.257	251534d8-fc11-4b89-8a17-cb510e4c6821	0.00	f
b40fb8b0-3354-4831-92a7-ead44c194d44	e849736a-4da5-4317-8900-d810d973ac76	10123022	S1 Teknik Informatika	-	+62895330583940	2026-08-09 04:28:32.546	2026-09-08 04:28:32.546	\N	APPROVED	2026-08-09 04:28:32.546	2026-08-09 07:51:23.288	251534d8-fc11-4b89-8a17-cb510e4c6821	0.00	f
44b47556-f25d-4eb6-9854-dbcf71f6e07c	72d37a73-3d2d-47ff-b4d0-d9d6246ef3a7	10523016	S1 Sistem Informasi	-	+6281324800622	2026-08-09 04:28:32.741	2026-09-08 04:28:32.741	\N	APPROVED	2026-08-09 04:28:32.742	2026-08-09 07:51:23.305	251534d8-fc11-4b89-8a17-cb510e4c6821	0.00	f
512a88df-e486-46a7-98b5-3025c8a3bcfb	29a1e339-bd90-4bf1-8ed2-b2fb894fd0fe	10523036	S1 Sistem Informasi	-	+628882285069	2026-08-09 04:28:32.941	2026-09-08 04:28:32.941	\N	APPROVED	2026-08-09 04:28:32.942	2026-08-09 07:51:23.324	251534d8-fc11-4b89-8a17-cb510e4c6821	0.00	f
b033a2de-cf6d-4b24-ae66-d10df0661125	b80a771d-ff79-4f1b-aafb-400c7781bfac	52124011	D3 Desain Grafis	-	+62895367880041	2026-08-09 04:28:33.123	2026-09-08 04:28:33.123	\N	APPROVED	2026-08-09 04:28:33.124	2026-08-09 07:51:23.358	251534d8-fc11-4b89-8a17-cb510e4c6821	0.00	f
5800c3ba-3bda-437e-9eab-726012a186dc	40ce3cef-773d-491e-abfb-9eeecce8eb06	13022019	S1 Teknik Sipil	-	+6285641638629	2026-08-09 04:28:21.432	2026-09-08 04:28:21.432	\N	APPROVED	2026-08-09 04:28:21.433	2026-08-09 07:51:23.416	b1165842-ae6c-4a8e-b115-cb8f695aae84	0.00	f
c14d9312-cece-480f-91a8-4bf782f1d9f2	a34180af-afd7-4f32-b179-49c96ce70e16	10123163	S1 Teknik Informatika	-	+6281321250689	2026-08-09 04:28:21.621	2026-09-08 04:28:21.621	\N	APPROVED	2026-08-09 04:28:21.622	2026-08-09 07:51:23.445	b1165842-ae6c-4a8e-b115-cb8f695aae84	0.00	f
4f094a6e-5f35-4b9e-bdb0-de51efcdb102	926c9696-5945-4965-b97e-c8528cc52e83	10123345	S1 Teknik Informatika	-	+6288270987096	2026-08-09 04:28:21.814	2026-09-08 04:28:21.814	\N	APPROVED	2026-08-09 04:28:21.815	2026-08-09 07:51:23.463	b1165842-ae6c-4a8e-b115-cb8f695aae84	0.00	f
c0348d1d-565c-4820-b87d-96254e8d10e3	dc26309d-e702-45dd-87e0-3badc578fe02	10123385	S1 Teknik Informatika	-	+6283169942795	2026-08-09 04:28:22.018	2026-09-08 04:28:22.018	\N	APPROVED	2026-08-09 04:28:22.019	2026-08-09 07:51:23.486	b1165842-ae6c-4a8e-b115-cb8f695aae84	0.00	f
08e85d0e-3d7e-489e-83a4-581e3b58c669	21d29aab-3804-4137-99d8-3877f349729d	10123442	S1 Teknik Informatika	-	+6289508900031	2026-08-09 04:28:22.257	2026-09-08 04:28:22.257	\N	APPROVED	2026-08-09 04:28:22.258	2026-08-09 07:51:23.505	b1165842-ae6c-4a8e-b115-cb8f695aae84	0.00	f
559fab05-4007-46e0-8515-a459c1fb4749	3180bf1e-1fc4-44d2-b292-2496f8e69d63	10124060	S1 Teknik Informatika	-	+62895412955532	2026-08-09 04:28:22.438	2026-09-08 04:28:22.438	\N	APPROVED	2026-08-09 04:28:22.439	2026-08-09 07:51:23.521	b1165842-ae6c-4a8e-b115-cb8f695aae84	0.00	f
d8bd2da5-3704-4960-b637-a2af6d358f21	85fb23a3-85fd-4d14-962a-cb54c1565e6a	31624001	S1 Ilmu Hukum	-	+6282294699273	2026-08-09 04:28:23.137	2026-09-08 04:28:23.137	\N	APPROVED	2026-08-09 04:28:23.137	2026-08-09 07:51:23.537	4c6f7f84-f021-45b7-94ae-27237ac348bc	0.00	f
68029a8f-0600-404b-9b41-543997c8fc8b	40fbd482-3b3a-4634-918e-724b117206fb	13124007	S1 Teknik Elektro	-	+6287880854805	2026-08-09 04:28:24.27	2026-09-08 04:28:24.27	\N	APPROVED	2026-08-09 04:28:24.271	2026-08-09 07:51:23.581	4c6f7f84-f021-45b7-94ae-27237ac348bc	0.00	f
63fc5cdd-1d16-4efa-9f0e-05892ccbd0df	2f5c5418-2016-4fb6-a386-5999de1ee99b	10323023	S1 Teknik Industri	-	+6282118217775	2026-08-09 04:28:24.459	2026-09-08 04:28:24.459	\N	APPROVED	2026-08-09 04:28:24.46	2026-08-09 07:51:23.606	4c6f7f84-f021-45b7-94ae-27237ac348bc	0.00	f
96603e8f-b46c-4b7d-b31d-c3719eac83c7	2e3b3b51-40bc-476f-a980-4d3eae7e70a9	13022016	S1 Teknik Sipil	-	+6285624049306	2026-08-09 04:28:24.658	2026-09-08 04:28:24.658	\N	APPROVED	2026-08-09 04:28:24.659	2026-08-09 07:51:23.626	4c6f7f84-f021-45b7-94ae-27237ac348bc	0.00	f
76e73242-74cc-40b2-878b-78665a2d0822	bc56e210-0cef-4bc6-b78d-4d83d0ecb52d	10123255	S1 Teknik Informatika	-	+6281223189894	2026-08-09 04:28:25.097	2026-09-08 04:28:25.097	\N	APPROVED	2026-08-09 04:28:25.098	2026-08-09 07:51:23.646	4c6f7f84-f021-45b7-94ae-27237ac348bc	0.00	f
b60dcbef-8238-43cc-92ce-c9b02d97c65c	193c146c-61be-4b5a-8bcc-d37a72c61839	10123353	S1 Teknik Informatika	-	+6285524435339	2026-08-09 04:28:25.313	2026-09-08 04:28:25.313	\N	APPROVED	2026-08-09 04:28:25.314	2026-08-09 07:51:23.665	4c6f7f84-f021-45b7-94ae-27237ac348bc	0.00	f
fb195b8e-9e1b-4ef7-93a7-fc62266b5533	62580126-a3b4-42c4-9c4f-f9b1284d42d4	41823072	S1 Ilmu Komunikasi	-	+628996977312	2026-08-09 04:28:26.213	2026-09-08 04:28:26.213	33	APPROVED	2026-08-09 04:28:26.214	2026-08-09 07:51:23.688	19f594a5-7d50-4560-a9d5-5841201295ea	0.00	f
8c714f1c-c796-4f4f-a715-aa2d796191fc	1eaa7d42-0af1-4bfb-a0b4-b859621802b4	10524067	S1 Sistem Informasi	-	+6282115134061	2026-08-09 04:28:26.842	2026-09-08 04:28:26.842	33	APPROVED	2026-08-09 04:28:26.843	2026-08-09 07:51:23.715	19f594a5-7d50-4560-a9d5-5841201295ea	0.00	f
cc80ecd2-6503-40dc-895d-7d384625b835	81f76deb-21bb-43ae-866f-2b51af11ad5a	13124702	S1 Teknik Elektro	-	+6281214581208	2026-08-09 04:28:27.252	2026-09-08 04:28:27.252	33	APPROVED	2026-08-09 04:28:27.253	2026-08-09 07:51:23.745	19f594a5-7d50-4560-a9d5-5841201295ea	0.00	f
55a75830-074b-4f04-a13f-ffbe0e9a1998	2e783b1c-fa2f-46e1-998d-dfd53b2045c2	10824011	D3 Teknik Komputer	-	+6282216838241	2026-08-09 04:28:27.457	2026-09-08 04:28:27.457	33	APPROVED	2026-08-09 04:28:27.458	2026-08-09 07:51:23.76	19f594a5-7d50-4560-a9d5-5841201295ea	0.00	f
a09e4ae7-6b3a-4883-b68b-b21a66149d97	005e079a-6839-4545-9c3b-a808444a85ce	10123224	S1 Teknik Informatika	-	+6285591331132	2026-08-09 04:28:27.857	2026-09-08 04:28:27.857	33	APPROVED	2026-08-09 04:28:27.859	2026-08-09 07:51:23.779	19f594a5-7d50-4560-a9d5-5841201295ea	0.00	f
0940de56-abca-487a-a74d-4d0ef08ba593	1943722e-d751-46b9-a388-c82a47f3e420	10123357	S1 Teknik Informatika	-	+6281313256843	2026-08-09 04:28:28.048	2026-09-08 04:28:28.048	33	APPROVED	2026-08-09 04:28:28.049	2026-08-09 07:51:23.798	19f594a5-7d50-4560-a9d5-5841201295ea	0.00	f
1565a48a-98af-4265-872b-a1e8e92e1aff	54cbb452-51ee-44f2-aeb6-8cd1607b50fe	10123421	S1 Teknik Informatika	-	+6285893250407	2026-08-09 04:28:28.232	2026-09-08 04:28:28.232	33	APPROVED	2026-08-09 04:28:28.233	2026-08-09 07:51:23.819	19f594a5-7d50-4560-a9d5-5841201295ea	0.00	f
663d23c2-3d8e-4e2d-8e89-f4c1fb925a97	3f88b16f-ea4f-4511-b8c3-744d6e0c1ac3	10124052	S1 Teknik Informatika	-	+6282217066573	2026-08-09 04:28:28.603	2026-09-08 04:28:28.603	33	APPROVED	2026-08-09 04:28:28.604	2026-08-09 07:51:23.838	19f594a5-7d50-4560-a9d5-5841201295ea	0.00	f
5aba9e2a-54ab-465e-bde5-533fbf10c125	d4f971df-0610-4d08-8879-b082b2a37e08	10124063	S1 Teknik Informatika	-	+6282135183580	2026-08-09 04:28:28.795	2026-09-08 04:28:28.795	33	APPROVED	2026-08-09 04:28:28.796	2026-08-09 07:51:23.857	19f594a5-7d50-4560-a9d5-5841201295ea	0.00	f
31cac050-65fa-46aa-b4a6-00432e59fe1b	dee19cde-344e-4d8c-8fb8-3f38b2fa3a87	51924013	S1 Desain Komunikasi Visual	-	+628882000819146	2026-08-09 04:28:29.373	2026-09-08 04:28:29.373	36	APPROVED	2026-08-09 04:28:29.374	2026-08-09 07:51:23.888	cc5677e8-37b4-409d-9bca-2bb21a7fc0ce	0.00	f
13a19768-25fa-4e32-b628-97f0e0a4d30a	ab6a944c-a66a-4d87-af83-56a62a887681	44324078	S1 Hubungan Internasional	-	+62881023654486	2026-08-09 04:28:29.561	2026-09-08 04:28:29.561	36	APPROVED	2026-08-09 04:28:29.562	2026-08-09 07:51:23.921	cc5677e8-37b4-409d-9bca-2bb21a7fc0ce	0.00	f
cdd3ad44-f5a6-43fb-b45b-34f465d1d037	1cfc9ffb-0381-4640-be2c-0801adf48f33	10524024	S1 Sistem Informasi	-	+6289991392308	2026-08-09 04:28:29.772	2026-09-08 04:28:29.772	36	APPROVED	2026-08-09 04:28:29.773	2026-08-09 07:51:23.947	cc5677e8-37b4-409d-9bca-2bb21a7fc0ce	0.00	f
5c3acf5a-ede7-426c-94ac-9c45fddc841b	286a96c6-1790-425c-98ab-5eec1a3f3768	10524053	S1 Sistem Informasi	-	+62895411926401	2026-08-09 04:28:29.973	2026-09-08 04:28:29.973	36	APPROVED	2026-08-09 04:28:29.974	2026-08-09 07:51:23.967	cc5677e8-37b4-409d-9bca-2bb21a7fc0ce	0.00	f
ca0ed590-13f9-488e-9b42-69299af86b66	75a9704e-98a7-4776-abe4-c2eb8e82abee	10524075	S1 Sistem Informasi	-	+6282343456058	2026-08-09 04:28:30.157	2026-09-08 04:28:30.157	36	APPROVED	2026-08-09 04:28:30.158	2026-08-09 07:51:24.004	cc5677e8-37b4-409d-9bca-2bb21a7fc0ce	0.00	f
689bc206-9950-4100-b3b9-1f9539b007e8	d22c7cc0-a0fc-4639-b459-25675bcb223b	10224006	S1 Sistem Komputer	-	+62881023612165	2026-08-09 04:28:30.344	2026-09-08 04:28:30.344	36	APPROVED	2026-08-09 04:28:30.345	2026-08-09 07:51:24.024	cc5677e8-37b4-409d-9bca-2bb21a7fc0ce	0.00	f
3bace106-f32b-4647-af15-1c9903194fec	c093feb8-5f7f-4fd2-9481-a768f392877a	13025027	S1 Teknik Sipil	-	+6285765163177	2026-08-09 04:28:30.548	2026-09-08 04:28:30.548	36	APPROVED	2026-08-09 04:28:30.549	2026-08-09 07:51:24.862	cc5677e8-37b4-409d-9bca-2bb21a7fc0ce	0.00	f
61dd1c0f-127e-4edf-8361-284e87b1d502	bb3d07d0-8970-4602-aa63-ccae0ed9e0b4	10123265	S1 Teknik Informatika	-	+6282113079402	2026-08-09 04:28:31.134	2026-09-08 04:28:31.134	36	APPROVED	2026-08-09 04:28:31.135	2026-08-09 07:51:24.911	cc5677e8-37b4-409d-9bca-2bb21a7fc0ce	0.00	f
71af5f22-0255-43eb-ade6-84724ca1c080	de5d7974-9e42-4b85-b217-04376c9c1f4e	10123425	S1 Teknik Informatika	-	+628782395724	2026-08-09 04:28:31.519	2026-09-08 04:28:31.519	36	APPROVED	2026-08-09 04:28:31.52	2026-08-09 07:51:24.944	cc5677e8-37b4-409d-9bca-2bb21a7fc0ce	0.00	f
83bd5c30-3dd9-41a2-81c5-98c82e5a2359	f05c714e-2fee-463d-a2f4-c9028c972879	21124803	S1 Akuntansi	-	+6282319759917	2026-08-09 04:28:33.327	2026-09-08 04:28:33.327	\N	APPROVED	2026-08-09 04:28:33.328	2026-08-09 07:51:24.994	251534d8-fc11-4b89-8a17-cb510e4c6821	0.00	f
a679151d-a124-42de-86ed-83c5af268ce3	e0ca302a-ad36-4913-995d-ba8990f46c1c	63824024	S1 Sastra Jepang	-	+6282111146907	2026-08-09 04:28:34.27	2026-09-08 04:28:34.27	\N	APPROVED	2026-08-09 04:28:34.272	2026-08-09 07:51:25.014	251534d8-fc11-4b89-8a17-cb510e4c6821	0.00	f
1af295de-8b37-4a0f-a690-1a73533a2129	866395c7-2f70-4ad1-b839-d4c43126aa0c	10123028	S1 Teknik Informatika	-	+6287884667371	2026-08-09 04:28:34.677	2026-09-08 04:28:34.677	\N	APPROVED	2026-08-09 04:28:34.678	2026-08-09 07:51:25.034	f1a25933-bf2b-4921-8b04-4f22ef233131	0.00	f
1e90da67-6e3d-4cde-af54-c4db22decd11	0e61baed-c6a5-46b9-8081-36d349f0103f	10123030	S1 Teknik Informatika	-	+6282121730722	2026-08-09 04:28:34.873	2026-09-08 04:28:34.873	\N	APPROVED	2026-08-09 04:28:34.874	2026-08-09 07:51:25.055	f1a25933-bf2b-4921-8b04-4f22ef233131	0.00	f
e79d2b59-3817-476a-825b-35896bb0dcce	2eb67e22-12b1-4242-af97-5356f7700fdd	10422046	S1 Teknik Arsitektur	-	+6287764627819	2026-08-09 04:28:36.889	2026-09-08 04:28:36.889	\N	APPROVED	2026-08-09 04:28:36.89	2026-08-09 07:51:25.077	f1a25933-bf2b-4921-8b04-4f22ef233131	0.00	f
550f0364-e6f1-4084-8922-6fbe2b8b809d	ea7dd519-3323-4c56-84da-8a66ff44f181	10223012	S1 Sistem Komputer	-	+6283895107436	2026-08-09 04:28:37.601	2026-09-08 04:28:37.601	\N	APPROVED	2026-08-09 04:28:37.602	2026-08-09 07:51:25.126	f1a25933-bf2b-4921-8b04-4f22ef233131	0.00	f
ded16400-a79f-439e-a2f1-dbdf1d23657e	08c54bfd-b770-466a-8b7f-9e85e58a3fb5	13124023	Teknik Elektro	-	+6285722143518	2026-08-09 04:28:40.129	2026-09-08 04:28:40.129	\N	APPROVED	2026-08-09 04:28:40.13	2026-08-09 07:51:25.146	fd030909-9d36-4f8d-8ce7-ca808ab7f88c	0.00	f
13fe60d6-c9cb-4f03-bea5-d3e2da312693	a3dda951-6a56-4323-9526-124b4bfa45e0	41824153	Ilmu Komunikasi	-	+6283897010513	2026-08-09 04:28:40.329	2026-09-08 04:28:40.329	\N	APPROVED	2026-08-09 04:28:40.33	2026-08-09 07:51:25.163	fd030909-9d36-4f8d-8ce7-ca808ab7f88c	0.00	f
24d95760-80f3-43fc-9dd7-921b9a63ef46	4c6702fa-06e7-4eeb-a43b-55ae8d08b353	10324003	Teknik Industri	-	+6289637331211	2026-08-09 04:28:40.511	2026-09-08 04:28:40.511	\N	APPROVED	2026-08-09 04:28:40.512	2026-08-09 07:51:25.185	fd030909-9d36-4f8d-8ce7-ca808ab7f88c	0.00	f
15b2d0ea-5c8b-42e4-903e-982ff9b6f5a4	9901977a-2c48-4235-b429-acdf010a3fd8	10123027	Teknik Informatika	-	+6287798960157	2026-08-09 04:28:40.696	2026-09-08 04:28:40.696	\N	APPROVED	2026-08-09 04:28:40.697	2026-08-09 07:51:25.211	fd030909-9d36-4f8d-8ce7-ca808ab7f88c	0.00	f
106be28f-feb8-49a0-b502-c34bb29b4443	72c9032a-fe36-4fa1-99d7-29082745ae6a	13024002	Teknik Sipil	-	+6289668117678	2026-08-09 04:28:40.878	2026-09-08 04:28:40.878	\N	APPROVED	2026-08-09 04:28:40.879	2026-08-09 07:51:25.283	fd030909-9d36-4f8d-8ce7-ca808ab7f88c	0.00	f
93c0b24f-b01e-450d-aaf8-55de72f89b54	01adf45f-c72b-4192-89dd-2a46392c56b9	10421028	Teknik Arsitektur	-	+6282126144109	2026-08-09 04:28:41.072	2026-09-08 04:28:41.072	\N	APPROVED	2026-08-09 04:28:41.073	2026-08-09 07:51:25.308	fd030909-9d36-4f8d-8ce7-ca808ab7f88c	0.00	f
6a2d9cb7-7c5d-426c-b85e-1f11c0e5a503	5e7ebff9-1e5c-4118-b9cf-a0092877a885	10624008	Teknik Perencanaan Wilayah dan Kota	-	+6287882731641	2026-08-09 04:28:41.284	2026-09-08 04:28:41.284	\N	APPROVED	2026-08-09 04:28:41.285	2026-08-09 07:51:25.323	fd030909-9d36-4f8d-8ce7-ca808ab7f88c	0.00	f
78771486-5fc4-4289-9c60-8dcccd32b290	5ee0bd0b-b3c3-4049-9f5b-8de9856e6d9c	21124805	S1 Akuntansi	-	+6289517607195	2026-08-09 04:28:41.678	2026-09-08 04:28:41.678	120	APPROVED	2026-08-09 04:28:41.679	2026-08-09 07:51:25.342	549f7a5e-c2cf-4dab-b484-08554156f5ff	0.00	f
88b491a0-6576-443b-a8e8-bd4c74e43b09	a90949e7-2066-457f-a3b0-622c4dc3fa9e	41724012	S1 Ilmu Pemerintahan	-	+6281574454957	2026-08-09 04:28:42.266	2026-09-08 04:28:42.266	120	APPROVED	2026-08-09 04:28:42.267	2026-08-09 07:51:25.358	549f7a5e-c2cf-4dab-b484-08554156f5ff	0.00	f
3d5d2f81-5db2-481c-963a-120822f1666e	5119796d-6a6b-4b97-8926-009ab4f8373e	10524132	S1 Sistem Informasi	-	+6281586336263	2026-08-09 04:28:42.46	2026-09-08 04:28:42.46	120	APPROVED	2026-08-09 04:28:42.461	2026-08-09 07:51:25.38	549f7a5e-c2cf-4dab-b484-08554156f5ff	0.00	f
edfd0abf-1800-47af-b592-b09e196ae879	fd08e0b1-9396-4cb7-ac8c-e41aa9874063	10923004	D3 Manajemen Informatika	-	+6282217417415	2026-08-09 04:28:42.644	2026-09-08 04:28:42.644	120	APPROVED	2026-08-09 04:28:42.645	2026-08-09 07:51:25.4	549f7a5e-c2cf-4dab-b484-08554156f5ff	0.00	f
8e652ddf-67d6-4b9e-ba57-f0025a35ba0d	66a36c9c-6efa-4080-b925-997925de0dd8	10224009	S1 Sistem Komputer	-	+6285603374592	2026-08-09 04:28:42.818	2026-09-08 04:28:42.818	120	APPROVED	2026-08-09 04:28:42.819	2026-08-09 07:51:25.424	549f7a5e-c2cf-4dab-b484-08554156f5ff	0.00	f
7bb7344c-94e4-442f-b3bb-b6e1f74deb1d	860ba5e5-1b3b-466c-836e-329b25845ba0	10324013	S1 Teknik Industri	-	+6281312658717	2026-08-09 04:28:42.992	2026-09-08 04:28:42.992	120	APPROVED	2026-08-09 04:28:42.993	2026-08-09 07:51:25.447	549f7a5e-c2cf-4dab-b484-08554156f5ff	0.00	f
30a65fd7-7937-47b3-a551-58cdfac738cf	f4a4ce93-ceb3-43dc-a350-7695a893fb02	10124225	S1 Teknik Informatika	-	+62895606173928	2026-08-09 04:28:43.605	2026-09-08 04:28:43.605	120	APPROVED	2026-08-09 04:28:43.606	2026-08-09 07:51:25.478	549f7a5e-c2cf-4dab-b484-08554156f5ff	0.00	f
032c9499-a50a-40fe-bab8-154358755802	8328affd-86d8-4828-8e5d-b5914051ecfe	10124324	S1 Teknik Informatika	-	+6282315261498	2026-08-09 04:28:43.799	2026-09-08 04:28:43.799	120	APPROVED	2026-08-09 04:28:43.8	2026-08-09 07:51:25.504	549f7a5e-c2cf-4dab-b484-08554156f5ff	0.00	f
46ded14e-f5c9-499b-b191-c826e01ed0f1	b70a207c-2fec-4c41-b9cc-5d1a7d092cff	21225111	S1 Akuntansi	-	+6282118959063	2026-08-09 04:28:44.244	2026-09-08 04:28:44.244	114	APPROVED	2026-08-09 04:28:44.247	2026-08-09 07:51:25.523	f3fd64e5-312a-4d9b-94c9-4007eab5c7b9	0.00	f
e3d9686c-0fd3-457f-9a26-aab199697c8c	83cbad70-037d-4697-98ee-acdac9bbd4ec	10423032	S1 Teknik Arsitektur	-	+6287786555511	2026-08-09 04:28:44.463	2026-09-08 04:28:44.463	114	APPROVED	2026-08-09 04:28:44.464	2026-08-09 07:51:25.542	f3fd64e5-312a-4d9b-94c9-4007eab5c7b9	0.00	f
1bee5fad-e7ec-47b4-9ade-d118af7ba616	181394fe-f4ec-4880-854a-e222387e9c5b	31624018	S1 Ilmu Hukum	-	+6282130120101	2026-08-09 04:28:44.654	2026-09-08 04:28:44.654	114	APPROVED	2026-08-09 04:28:44.655	2026-08-09 07:51:25.562	f3fd64e5-312a-4d9b-94c9-4007eab5c7b9	0.00	f
12f2cb10-52d0-4ca7-a2d8-1862b27e991e	803de4b7-d467-42cf-900f-83b8661832fe	10524112	S1 Sistem Informasi	-	+6281222144698	2026-08-09 04:28:44.867	2026-09-08 04:28:44.867	114	APPROVED	2026-08-09 04:28:44.868	2026-08-09 07:51:25.596	f3fd64e5-312a-4d9b-94c9-4007eab5c7b9	0.00	f
2dc9f568-86d1-4a6e-86e4-358b5a8bfb89	225dd904-6831-413d-a7bc-48fb0ec27bca	10524134	S1 Sistem Informasi	-	+6285706204879	2026-08-09 04:28:45.057	2026-09-08 04:28:45.057	114	APPROVED	2026-08-09 04:28:45.057	2026-08-09 07:51:25.621	f3fd64e5-312a-4d9b-94c9-4007eab5c7b9	0.00	f
a9b5c590-784a-4b20-bfb8-f6cea8e8f854	56e818b1-302e-4dc8-80cd-abbf8675f317	10624005	S1 Teknik PWK	-	+6285830402767	2026-08-09 04:28:45.257	2026-09-08 04:28:45.257	114	APPROVED	2026-08-09 04:28:45.258	2026-08-09 07:51:25.637	f3fd64e5-312a-4d9b-94c9-4007eab5c7b9	0.00	f
4b8c9b08-ba0d-4ec6-8a67-18f0b1c0b609	49d87bb7-7058-4298-bffd-9be19cf3ba0e	10223002	S1 Sistem Komputer	-	+6289516085578	2026-08-09 04:28:45.468	2026-09-08 04:28:45.468	114	APPROVED	2026-08-09 04:28:45.469	2026-08-09 07:51:25.654	f3fd64e5-312a-4d9b-94c9-4007eab5c7b9	0.00	f
883aa299-2863-4a06-b13a-ce13e2eb7115	a83235f8-105c-48d3-844f-f1f2cd5b3079	10124233	S1 Teknik Informatika	-	+6283174565723	2026-08-09 04:28:46.295	2026-09-08 04:28:46.295	114	APPROVED	2026-08-09 04:28:46.296	2026-08-09 07:51:25.675	f3fd64e5-312a-4d9b-94c9-4007eab5c7b9	0.00	f
b85cb198-0ef1-4ad4-b29f-aeac9c11a3ab	4d7594a0-e876-4f5c-9102-73073406fc8c	10124387	S1 Teknik Informatika	-	+6285789014173	2026-08-09 04:28:46.716	2026-09-08 04:28:46.716	114	APPROVED	2026-08-09 04:28:46.717	2026-08-09 07:51:25.691	f3fd64e5-312a-4d9b-94c9-4007eab5c7b9	0.00	f
4fb7d695-963f-40fd-a02f-c3c02e6baafb	1baba2cf-9b98-40e9-b4b5-a12491395fc1	10422009	S1 Teknik Arsitektur	-	+6281910596936	2026-08-09 04:28:47.645	2026-09-08 04:28:47.645	117	APPROVED	2026-08-09 04:28:47.646	2026-08-09 07:51:25.707	1d514151-d77c-4b8e-bf5c-67a8316bdb92	0.00	f
9c2bd6e1-ef96-4376-b558-e14139edb309	c234c18b-6abb-401b-bdc4-04e1b4f94aa4	44324061	S1 Hubungan Internasional	-	+6289527901171	2026-08-09 04:28:33.699	2026-09-08 04:28:33.699	\N	APPROVED	2026-08-09 04:28:33.7	2026-08-09 07:51:25.751	251534d8-fc11-4b89-8a17-cb510e4c6821	0.00	f
ffa8def3-1665-4746-b5c2-1f06a6176089	37fe0380-d570-42d3-8644-115835748565	31624005	S1 Ilmu Hukum	-	+6282121373288	2026-08-09 04:28:33.882	2026-09-08 04:28:33.882	\N	APPROVED	2026-08-09 04:28:33.883	2026-08-09 07:51:25.77	251534d8-fc11-4b89-8a17-cb510e4c6821	0.00	f
823362e5-a754-4f33-8806-b66dbd8ebccc	da6e3cce-8589-4fca-9017-f5384016c462	41824048	S1 Ilmu Komunikasi	-	+6285924808433	2026-08-09 04:28:34.081	2026-09-08 04:28:34.081	\N	APPROVED	2026-08-09 04:28:34.083	2026-08-09 07:51:25.79	251534d8-fc11-4b89-8a17-cb510e4c6821	0.00	f
64cee581-26ab-4e01-9b20-3a122c7a7265	6c586b4f-45e7-4400-8b8f-c110f0591c82	10123036	S1 Teknik Informatika	-	+6282129566829	2026-08-09 04:28:35.062	2026-09-08 04:28:35.062	\N	APPROVED	2026-08-09 04:28:35.063	2026-08-09 07:51:25.827	f1a25933-bf2b-4921-8b04-4f22ef233131	0.00	f
e9a6e749-1ab8-4f8d-b305-0cac58594d6f	6985e3cb-8f4c-45a1-a502-1d730c650ff8	10123038	S1 Teknik Informatika	-	+6282315347187	2026-08-09 04:28:35.25	2026-09-08 04:28:35.25	\N	APPROVED	2026-08-09 04:28:35.251	2026-08-09 07:51:25.852	f1a25933-bf2b-4921-8b04-4f22ef233131	0.00	f
e729fd9a-cda2-4ad1-a949-3ca26a9814cc	dd1c994d-ef24-4bad-94b7-66cdc73e8bd3	10924010	D3 Manajemen Informatika	-	+6288802293356	2026-08-09 04:28:35.437	2026-09-08 04:28:35.437	\N	APPROVED	2026-08-09 04:28:35.438	2026-08-09 07:51:25.868	f1a25933-bf2b-4921-8b04-4f22ef233131	0.00	f
590811fd-ff87-4c44-8f11-01cdca94025a	e5b224da-4c4f-42c0-b2db-6170714cd5e2	21124804	S1 Akuntansi	-	+6289658155892	2026-08-09 04:28:35.626	2026-09-08 04:28:35.626	\N	APPROVED	2026-08-09 04:28:35.627	2026-08-09 07:51:25.888	f1a25933-bf2b-4921-8b04-4f22ef233131	0.00	f
e2e55276-b201-4bf6-8f7b-c41deda1269e	3ba07760-101e-4fb7-a7f9-98ae03132e39	52023013	S1 Desain Interior	-	+6285800135813	2026-08-09 04:28:35.808	2026-09-08 04:28:35.808	\N	APPROVED	2026-08-09 04:28:35.809	2026-08-09 07:51:25.912	f1a25933-bf2b-4921-8b04-4f22ef233131	0.00	f
c9e9c54f-650f-4a43-af18-68c2fb102602	64847fc3-b9d9-47aa-9f9a-c47de71133f0	41724013	S1 Ilmu Pemerintahan	-	+6281228906205	2026-08-09 04:28:35.999	2026-09-08 04:28:35.999	\N	APPROVED	2026-08-09 04:28:36	2026-08-09 07:51:25.928	f1a25933-bf2b-4921-8b04-4f22ef233131	0.00	f
f449a403-43c7-42b0-99c9-e0c586a4acdc	e04eafcf-c491-4459-abf0-e660577d36b3	10523050	S1 Sistem Informasi	-	+6282214003063	2026-08-09 04:28:36.211	2026-09-08 04:28:36.211	\N	APPROVED	2026-08-09 04:28:36.212	2026-08-09 07:51:25.946	f1a25933-bf2b-4921-8b04-4f22ef233131	0.00	f
d94a4f96-9967-45b4-85dc-3e3063926620	1776bbdf-ec51-4711-a8fb-bda8a2ec8b21	10524005	Sistem Informasi	-	+6283805225393	2026-08-09 04:28:38.105	2026-09-08 04:28:38.105	\N	APPROVED	2026-08-09 04:28:38.106	2026-08-09 07:51:25.967	fd030909-9d36-4f8d-8ce7-ca808ab7f88c	0.00	f
5dba94c1-1ed8-4a32-924f-9df88c41c4e6	95c03cd5-4949-4bee-a012-190859a27000	10524010	Sistem Informasi	-	+6281320368738	2026-08-09 04:28:38.88	2026-09-08 04:28:38.88	\N	APPROVED	2026-08-09 04:28:38.881	2026-08-09 07:51:26.001	fd030909-9d36-4f8d-8ce7-ca808ab7f88c	0.00	f
9850f0ca-0ec5-408e-b9bd-48342a921930	61d91121-a976-459a-a70b-1cf166ddd16a	10223022	Sistem komputer	-	+6285863730151	2026-08-09 04:28:39.114	2026-09-08 04:28:39.114	\N	APPROVED	2026-08-09 04:28:39.115	2026-08-09 07:51:26.023	fd030909-9d36-4f8d-8ce7-ca808ab7f88c	0.00	f
b957c5a2-8d0e-48ab-9ef0-124e3bcd9fff	3c31d6d7-ab5d-4573-b915-17bea0e19fed	63724015	Sastra Inggris S1	-	+6288299491714	2026-08-09 04:28:39.726	2026-09-08 04:28:39.726	\N	APPROVED	2026-08-09 04:28:39.727	2026-08-09 07:51:26.044	fd030909-9d36-4f8d-8ce7-ca808ab7f88c	0.00	f
628e3409-6934-493d-a025-8cfa877790ad	4a2d8abc-715b-4dd7-9161-a09a0dbb03b4	13124012	Teknik Elektro	-	+6285723024117	2026-08-09 04:28:39.92	2026-09-08 04:28:39.92	\N	APPROVED	2026-08-09 04:28:39.921	2026-08-09 07:51:26.062	fd030909-9d36-4f8d-8ce7-ca808ab7f88c	0.00	f
68a24ce2-8aa4-424a-9fa9-ac6cae53de28	a4d869ba-d863-425b-a9f3-9a737e156a34	10422035	S1 Teknik Arsitektur	-	+6283802480630	2026-08-09 04:28:41.891	2026-09-08 04:28:41.891	120	APPROVED	2026-08-09 04:28:41.892	2026-08-09 07:51:26.078	549f7a5e-c2cf-4dab-b484-08554156f5ff	0.00	f
12729fdb-3584-46e2-928b-1286aa661fb1	6198792a-e425-4b18-849a-1195b2eca70d	44324071	S1 Hubungan Internasional	-	+6285715546672	2026-08-09 04:28:42.076	2026-09-08 04:28:42.076	120	APPROVED	2026-08-09 04:28:42.077	2026-08-09 07:51:26.103	549f7a5e-c2cf-4dab-b484-08554156f5ff	0.00	f
42e60295-af5a-4d4d-a7c3-e21c9d74dabd	9c9f4977-2fdb-4e02-bad0-77d105d37d51	13024009	S1 Teknik Sipil	-	+6285174230539	2026-08-09 04:28:43.193	2026-09-08 04:28:43.193	120	APPROVED	2026-08-09 04:28:43.195	2026-08-09 07:51:26.125	549f7a5e-c2cf-4dab-b484-08554156f5ff	0.00	f
d34481fd-9c91-41c6-8a94-be4f1122dc4d	a9c96d2d-3d7a-4991-a822-2a06c8160c23	10124157	S1 Teknik Informatika	-	+6282280795516	2026-08-09 04:28:43.417	2026-09-08 04:28:43.417	120	APPROVED	2026-08-09 04:28:43.418	2026-08-09 07:51:26.148	549f7a5e-c2cf-4dab-b484-08554156f5ff	0.00	f
7450269d-4fcd-407b-bafb-3fbb9773a01a	046fb108-7a45-4965-881b-f9c589e86063	10124384	S1 Teknik Informatika	-	+6285718158861	2026-08-09 04:28:43.994	2026-09-08 04:28:43.994	120	APPROVED	2026-08-09 04:28:43.995	2026-08-09 07:51:26.171	549f7a5e-c2cf-4dab-b484-08554156f5ff	0.00	f
de9e7b01-f6dd-46c3-b1c6-72ba5870129f	4576859a-e645-4515-b7f1-1358b94e289d	10323006	S1 Teknik Industri	-	+62813873873140	2026-08-09 04:28:45.674	2026-09-08 04:28:45.674	114	APPROVED	2026-08-09 04:28:45.675	2026-08-09 07:51:26.194	f3fd64e5-312a-4d9b-94c9-4007eab5c7b9	0.00	f
eac101a7-aacb-4e54-a2f5-b392fbf60467	fd3ce577-2b0e-4572-8a9a-372802e19753	10124115	S1 Teknik Informatika	-	+6281211536756	2026-08-09 04:28:45.877	2026-09-08 04:28:45.877	114	APPROVED	2026-08-09 04:28:45.878	2026-08-09 07:51:26.211	f3fd64e5-312a-4d9b-94c9-4007eab5c7b9	0.00	f
aa064afd-4b5e-4932-9ce1-a8333a14a28e	b006dcc2-417d-4454-b66b-d545f65e10dd	10124168	S1 Teknik Informatika	-	+6285162992393	2026-08-09 04:28:46.09	2026-09-08 04:28:46.09	114	APPROVED	2026-08-09 04:28:46.091	2026-08-09 07:51:26.235	f3fd64e5-312a-4d9b-94c9-4007eab5c7b9	0.00	f
79734cc1-f5e3-41fb-ad9a-029b4eea204e	e07df197-f516-427f-99ec-cdacc9a43b48	10124333	S1 Teknik Informatika	-	+6282278497034	2026-08-09 04:28:46.528	2026-09-08 04:28:46.528	114	APPROVED	2026-08-09 04:28:46.528	2026-08-09 07:51:26.255	f3fd64e5-312a-4d9b-94c9-4007eab5c7b9	0.00	f
8b65355d-92a6-497e-ab21-0aebc64ca774	cd4a7e2f-c598-4de6-ab3e-57acef90f2dc	21124807	S1 Akuntansi	-	+62881022275815	2026-08-09 04:28:47.453	2026-09-08 04:28:47.453	117	APPROVED	2026-08-09 04:28:47.455	2026-08-09 07:51:26.281	1d514151-d77c-4b8e-bf5c-67a8316bdb92	0.00	f
8f8dd398-fad9-4cee-8719-99b8d8d9f24b	3dd23164-097d-4a16-8453-e107b3532d34	10524136	S1 Sistem Informasi	-	+6285797950518	2026-08-09 04:28:48.441	2026-09-08 04:28:48.441	117	APPROVED	2026-08-09 04:28:48.442	2026-08-09 07:51:26.316	1d514151-d77c-4b8e-bf5c-67a8316bdb92	0.00	f
31297a15-2682-4edf-b5d3-c6f7f9834441	0d89606e-363d-47c4-adf0-c3a4dfa5dc2e	63724017	Sastra Inggris	-	+6285862529929	2026-08-09 04:28:48.626	2026-09-08 04:28:48.626	117	APPROVED	2026-08-09 04:28:48.627	2026-08-09 07:51:26.356	1d514151-d77c-4b8e-bf5c-67a8316bdb92	0.00	f
055849f0-b57c-4459-92e1-c25f435abd37	f1bc8080-9a74-4f26-835d-abc9f39bd02c	10124336	S1 Teknik Informatika	-	+6281916460333	2026-08-09 04:28:49.814	2026-09-08 04:28:49.814	117	APPROVED	2026-08-09 04:28:49.815	2026-08-09 07:51:26.382	1d514151-d77c-4b8e-bf5c-67a8316bdb92	0.00	f
82694475-87ff-40b5-914b-098f8ae44f78	64ec8e15-7eed-4996-b07c-7c5305e7bf1c	31624012	S1 Ilmu Hukum	-	+6283897996269	2026-08-09 04:28:50.404	2026-09-08 04:28:50.404	\N	APPROVED	2026-08-09 04:28:50.405	2026-08-09 07:51:26.404	7891549c-76ec-48c2-af08-10c8d2a8e8c5	0.00	f
7a6655d0-53e0-4eb3-950d-25fd3bdccd27	63a8061f-2557-4b46-8424-0a9b1d3e6d59	10524143	S1 Sistem Informasi	-	+6281220917393	2026-08-09 04:28:50.796	2026-09-08 04:28:50.796	\N	APPROVED	2026-08-09 04:28:50.797	2026-08-09 07:51:26.446	7891549c-76ec-48c2-af08-10c8d2a8e8c5	0.00	f
aa355504-e984-4962-9b8d-741de014a698	26110b4a-8428-4913-a27c-119b091679d7	31624006	S1 Ilmu Hukum	-	+6289655323410	2026-08-09 04:28:48.039	2026-09-08 04:28:48.039	117	APPROVED	2026-08-09 04:28:48.04	2026-08-09 07:51:26.479	1d514151-d77c-4b8e-bf5c-67a8316bdb92	0.00	f
77540af7-25e6-499c-ac90-1e03057d7d3c	49e30cee-366e-410e-985f-f40fcddc7cea	10524113	S1 Sistem Informasi	-	+6281224110867	2026-08-09 04:28:48.254	2026-09-08 04:28:48.254	117	APPROVED	2026-08-09 04:28:48.255	2026-08-09 07:51:26.497	1d514151-d77c-4b8e-bf5c-67a8316bdb92	0.00	f
bcc0f873-4ff8-49de-a9fc-c3128af95b97	30f703df-69c4-4fe1-8329-c448543fd9f3	13123015	S1 Teknik Elektro	-	+6287774076941	2026-08-09 04:28:48.82	2026-09-08 04:28:48.82	117	APPROVED	2026-08-09 04:28:48.821	2026-08-09 07:51:26.51	1d514151-d77c-4b8e-bf5c-67a8316bdb92	0.00	f
8d45ced0-c4b2-47fe-950a-2c203bb84b30	467147f0-f409-4b35-a75a-6243ca1832a2	10323001	S1 Teknik Industri	-	+6283822577218	2026-08-09 04:28:49.02	2026-09-08 04:28:49.02	117	APPROVED	2026-08-09 04:28:49.022	2026-08-09 07:51:26.545	1d514151-d77c-4b8e-bf5c-67a8316bdb92	0.00	f
66425f21-39eb-456c-a719-a17d34cc326e	9f4b1236-4e90-46fe-bc74-5260dfa62b25	10124175	S1 Teknik Informatika	-	+6285199528097	2026-08-09 04:28:49.414	2026-09-08 04:28:49.414	117	APPROVED	2026-08-09 04:28:49.414	2026-08-09 07:51:26.596	1d514151-d77c-4b8e-bf5c-67a8316bdb92	0.00	f
f5e5fa2f-5e01-4752-a79c-49edb0cf9392	36d907b3-a9fa-4fda-96cb-1b4a66853d93	10124239	S1 Teknik Informatika	-	+6281382968508	2026-08-09 04:28:49.607	2026-09-08 04:28:49.607	117	APPROVED	2026-08-09 04:28:49.608	2026-08-09 07:51:26.613	1d514151-d77c-4b8e-bf5c-67a8316bdb92	0.00	f
734f1b02-d6fa-4777-a36c-7b2800a49020	af97201d-d4d6-40ce-84e6-21c2e3200c1c	21124018	S1 Akuntansi	-	+6287834711845	2026-08-09 04:28:50.204	2026-09-08 04:28:50.204	\N	APPROVED	2026-08-09 04:28:50.205	2026-08-09 07:51:26.647	7891549c-76ec-48c2-af08-10c8d2a8e8c5	0.00	f
158a2ba9-442d-4c6e-ad44-cfa7c14dc318	53d2ca5e-1ded-4a96-a47e-d585df181b05	10824010	D3 Teknik Komputer	-	+6285156157114	2026-08-09 04:28:51.18	2026-09-08 04:28:51.18	\N	APPROVED	2026-08-09 04:28:51.181	2026-08-09 07:51:26.667	7891549c-76ec-48c2-af08-10c8d2a8e8c5	0.00	f
5f08652f-a742-4920-b329-7b483953135b	28deb6c1-8dd8-48f4-988d-e444e1f85cdb	10124123	S1 Teknik Informatika	-	+6281290468757	2026-08-09 04:28:51.388	2026-09-08 04:28:51.388	\N	APPROVED	2026-08-09 04:28:51.389	2026-08-09 07:51:26.69	7891549c-76ec-48c2-af08-10c8d2a8e8c5	0.00	f
3225c570-d574-4deb-af75-08cbf9d0e727	6fd1fbda-0dbd-4671-97e6-4d64481ea2b4	52124002	D3 Desain Grafis	-	+6285295877936	2026-08-09 04:28:52.798	2026-09-08 04:28:52.798	\N	APPROVED	2026-08-09 04:28:52.799	2026-08-09 07:51:26.713	7148b819-b5b9-46ab-a2ad-405f5c2cd0cb	0.00	f
a9464d43-4b2a-4c1f-86fc-e8150ce0a1ad	8526c39d-723a-40de-bac9-0930e42d9be2	51924103	S1 Desain Komunikasi Visual	-	+6281223993761	2026-08-09 04:28:52.989	2026-09-08 04:28:52.989	\N	APPROVED	2026-08-09 04:28:52.99	2026-08-09 07:51:26.731	7148b819-b5b9-46ab-a2ad-405f5c2cd0cb	0.00	f
c0e95093-0963-4f0f-887c-6c4a58a1807a	3d13d886-5b16-40b3-a23c-608d56cdc4ff	10524144	S1 Sistem Informasi	-	+6281257320600	2026-08-09 04:28:53.579	2026-09-08 04:28:53.579	\N	APPROVED	2026-08-09 04:28:53.579	2026-08-09 07:51:26.751	7148b819-b5b9-46ab-a2ad-405f5c2cd0cb	0.00	f
777dd18c-f9d8-43a6-9d89-531e15036d34	af47f0c0-9787-4d41-a977-4a408e9642e9	13124019	S1 Teknik Elektro	-	+6285951801914	2026-08-09 04:28:53.967	2026-09-08 04:28:53.967	\N	APPROVED	2026-08-09 04:28:53.968	2026-08-09 07:51:26.774	7148b819-b5b9-46ab-a2ad-405f5c2cd0cb	0.00	f
a86a792d-145b-48d6-918f-1b849952000c	c5b30864-2de3-4d37-b6a0-55cb81dc71d6	13024012	S1 Teknik Sipil	-	+6287822897263	2026-08-09 04:28:54.158	2026-09-08 04:28:54.158	\N	APPROVED	2026-08-09 04:28:54.159	2026-08-09 07:51:26.799	7148b819-b5b9-46ab-a2ad-405f5c2cd0cb	0.00	f
dfeadb80-8258-496f-afc8-6fcb53a12198	73f31b17-b86a-49a9-abc8-83c098c94add	10124129	S1 Teknik Informatika	-	+6281323813632	2026-08-09 04:28:54.355	2026-09-08 04:28:54.355	\N	APPROVED	2026-08-09 04:28:54.356	2026-08-09 07:51:26.823	7148b819-b5b9-46ab-a2ad-405f5c2cd0cb	0.00	f
59510ef1-9ba8-49b4-b946-3b5a01337e2f	2a229a3e-ea44-45ee-a43b-7260a05e1e59	10124341	S1 Teknik Informatika	-	+6282320397605	2026-08-09 04:28:54.914	2026-09-08 04:28:54.914	\N	APPROVED	2026-08-09 04:28:54.915	2026-08-09 07:51:26.846	7148b819-b5b9-46ab-a2ad-405f5c2cd0cb	0.00	f
fabe754f-902e-41c8-b655-9f5f3448227d	7c553003-7fae-4cfd-99b5-5dfa77d93dea	52024015	S1 Desain Interior	-	+6283107409486	2026-08-09 04:28:55.546	2026-09-08 04:28:55.546	109	APPROVED	2026-08-09 04:28:55.548	2026-08-09 07:51:26.864	481ed30e-c1eb-45fa-a376-5196a91e7b45	0.00	f
8d1b2bec-b283-4ef6-98a6-c0be131ca0c1	a768a066-022e-4e68-96e0-bcaa8101ae2a	51923096	S1 Desain Komunikasi Visual	-	+6287875713449	2026-08-09 04:28:55.739	2026-09-08 04:28:55.739	109	APPROVED	2026-08-09 04:28:55.74	2026-08-09 07:51:26.882	481ed30e-c1eb-45fa-a376-5196a91e7b45	0.00	f
2d40be73-03fd-4b5f-88a9-8fd46eaf5202	35102d9a-f86f-4156-9f28-ae58a6d11b57	10524145	S1 Sistem Informasi	-	+62895806585554	2026-08-09 04:28:56.325	2026-09-08 04:28:56.325	109	APPROVED	2026-08-09 04:28:56.326	2026-08-09 07:51:26.909	481ed30e-c1eb-45fa-a376-5196a91e7b45	0.00	f
61b69dab-c7ed-45f3-b621-a59181ded6fa	78809bcd-69a1-4dc6-ad22-81be3b8c1a56	10124139	S1 Teknik Informatika	-	+628812076070	2026-08-09 04:28:56.918	2026-09-08 04:28:56.918	109	APPROVED	2026-08-09 04:28:56.919	2026-08-09 07:51:26.928	481ed30e-c1eb-45fa-a376-5196a91e7b45	0.00	f
1966d310-7e7b-4fd3-8058-8111d97e7d40	c4fce9d4-88b4-4c02-8a4d-b74783e1ef83	10124286	S1 Teknik Informatika	-	+6281315150602	2026-08-09 04:28:57.309	2026-09-08 04:28:57.309	109	APPROVED	2026-08-09 04:28:57.31	2026-08-09 07:51:26.948	481ed30e-c1eb-45fa-a376-5196a91e7b45	0.00	f
15b2b88f-1fcf-486e-9751-06b9684cee03	58c8feca-f4d0-4f76-99cc-5468c1326334	10124347	S1 Teknik Informatika	-	+6282277924502	2026-08-09 04:28:57.492	2026-09-08 04:28:57.492	109	APPROVED	2026-08-09 04:28:57.493	2026-08-09 07:51:26.969	481ed30e-c1eb-45fa-a376-5196a91e7b45	0.00	f
c2a56259-d505-4da5-b684-ead532579c4b	27056381-b0ef-4f9e-96eb-76726a95474b	10124445	S1 Teknik Informatika	-	+6281313509451	2026-08-09 04:28:57.697	2026-09-08 04:28:57.697	109	APPROVED	2026-08-09 04:28:57.698	2026-08-09 07:51:26.99	481ed30e-c1eb-45fa-a376-5196a91e7b45	0.00	f
f47a423e-bdde-404c-a384-bb50abd3a69e	dd41e3df-0ad7-4f88-a04f-faede2b51214	52023006	S1 Desain Interior	-	+6287780786466	2026-08-09 04:28:58.273	2026-09-08 04:28:58.273	111	APPROVED	2026-08-09 04:28:58.274	2026-08-09 07:51:27.016	dba5754c-2452-488a-9c9c-bd31d5de80c3	0.00	f
6f219464-ace9-4602-b9fa-f596bbc95480	3a33ab6d-52c7-4cad-9ade-c9bd7f929245	51923197	S1 Desain Komunikasi Visual	-	+6282239290335	2026-08-09 04:28:58.467	2026-09-08 04:28:58.467	111	APPROVED	2026-08-09 04:28:58.468	2026-08-09 07:51:27.033	dba5754c-2452-488a-9c9c-bd31d5de80c3	0.00	f
12ad9dcf-8db4-4da9-9667-31b3a6303c07	bb514859-3830-4fbb-b5f3-577991ed186d	41824169	S1 Ilmu Komunikasi	-	+628999235712	2026-08-09 04:28:58.667	2026-09-08 04:28:58.667	111	APPROVED	2026-08-09 04:28:58.668	2026-08-09 07:51:27.052	dba5754c-2452-488a-9c9c-bd31d5de80c3	0.00	f
b598649c-0348-4132-9763-7510c1f7e851	12030710-dff9-49ea-8a95-0eec96e4d99b	10524121	S1 Sistem Informasi	-	+6281398147718	2026-08-09 04:28:58.859	2026-09-08 04:28:58.859	111	APPROVED	2026-08-09 04:28:58.86	2026-08-09 07:51:27.076	dba5754c-2452-488a-9c9c-bd31d5de80c3	0.00	f
9ac04652-b5dc-43be-af8a-ad672b5da89c	aea2ad89-7913-488a-a6e6-10fbc336e03c	10524157	S1 Sistem Informasi	-	+6283833936383	2026-08-09 04:28:59.049	2026-09-08 04:28:59.049	111	APPROVED	2026-08-09 04:28:59.05	2026-08-09 07:51:27.095	dba5754c-2452-488a-9c9c-bd31d5de80c3	0.00	f
39464fe1-c9f9-44a2-89f4-b265213aa6db	e88646ba-d9be-47c3-b73c-59dcaea1b7f3	63824036	S1 Sastra Jepang	-	+6282285017405	2026-08-09 04:28:59.237	2026-09-08 04:28:59.237	111	APPROVED	2026-08-09 04:28:59.238	2026-08-09 07:51:27.126	dba5754c-2452-488a-9c9c-bd31d5de80c3	0.00	f
71a27e1f-3967-4a3d-8aad-b5b1e1882195	781e7a37-e436-4208-a5fe-8212b542d569	13025028	S1 Teknik Sipil	-	+6281384200878	2026-08-09 04:28:59.605	2026-09-08 04:28:59.605	111	APPROVED	2026-08-09 04:28:59.606	2026-08-09 07:51:27.158	dba5754c-2452-488a-9c9c-bd31d5de80c3	0.00	f
0bc50fd4-94c8-42eb-86a7-a60585ddd02d	800e1c51-ef4b-46f5-803a-14fa8a321cc1	10124141	S1 Teknik Informatika	-	+6282110666905	2026-08-09 04:28:59.783	2026-09-08 04:28:59.783	111	APPROVED	2026-08-09 04:28:59.784	2026-08-09 07:51:27.182	dba5754c-2452-488a-9c9c-bd31d5de80c3	0.00	f
02086b35-f0ad-440d-9d35-6158cb912056	88a184e2-7070-4de0-ac1c-fd36178cfd5b	63824038	S1 Sastra Jepang	-	+6285189950361	2026-08-09 04:28:50.986	2026-09-08 04:28:50.986	\N	APPROVED	2026-08-09 04:28:50.987	2026-08-09 07:51:27.198	7891549c-76ec-48c2-af08-10c8d2a8e8c5	0.00	f
3a515076-e907-4905-94cf-4f503e1de152	8a030fe3-e7a0-4fdf-aa8b-3558ec559c25	10124178	S1 Teknik Informatika	-	+6282260923780	2026-08-09 04:28:51.592	2026-09-08 04:28:51.592	\N	APPROVED	2026-08-09 04:28:51.593	2026-08-09 07:51:27.223	7891549c-76ec-48c2-af08-10c8d2a8e8c5	0.00	f
7336c6d8-07ac-4ce3-bfe2-01655842fba9	37138046-4ef0-40ff-9272-b66f2ad35973	10124262	S1 Teknik Informatika	-	+6285722574462	2026-08-09 04:28:51.791	2026-09-08 04:28:51.791	\N	APPROVED	2026-08-09 04:28:51.791	2026-08-09 07:51:27.239	7891549c-76ec-48c2-af08-10c8d2a8e8c5	0.00	f
ba2e33be-716b-4c0e-bb57-c9e0b2cc82e6	f78e4ebc-528b-490b-9d71-9d562b5bfe8c	10124339	S1 Teknik Informatika	-	+62881023359218	2026-08-09 04:28:51.996	2026-09-08 04:28:51.996	\N	APPROVED	2026-08-09 04:28:51.996	2026-08-09 07:51:27.256	7891549c-76ec-48c2-af08-10c8d2a8e8c5	0.00	f
972b0749-6c2d-4f69-8c22-01638d67b349	35db03fb-6842-450f-b062-60b1f499987f	10124398	S1 Teknik Informatika	-	+6282118920881	2026-08-09 04:28:52.179	2026-09-08 04:28:52.179	\N	APPROVED	2026-08-09 04:28:52.18	2026-08-09 07:51:27.281	7891549c-76ec-48c2-af08-10c8d2a8e8c5	0.00	f
99ea714c-d316-4629-89f9-6aa07ab93e9b	56971f16-7818-4f6f-866d-b27cf4b76da4	10124390	S1 Teknik Informatika	-	+628996093081	2026-08-09 04:28:52.363	2026-09-08 04:28:52.363	\N	APPROVED	2026-08-09 04:28:52.364	2026-08-09 07:51:27.309	7891549c-76ec-48c2-af08-10c8d2a8e8c5	0.00	f
1add1a77-b40a-4541-9543-951cb9fc5ce1	09be075d-5ee6-40e1-bdaf-cc48271fc559	21124002	S1 Akuntansi	-	+628176531899	2026-08-09 04:28:52.591	2026-09-08 04:28:52.591	\N	APPROVED	2026-08-09 04:28:52.592	2026-08-09 07:51:27.334	7148b819-b5b9-46ab-a2ad-405f5c2cd0cb	0.00	f
207beb21-564f-4cc5-9e14-4401a59f4300	1af98c84-c1a1-4afe-9904-59ff7eecd015	41823078	S1 Ilmu Komunikasi	-	+6285722435449	2026-08-09 04:28:53.187	2026-09-08 04:28:53.187	\N	APPROVED	2026-08-09 04:28:53.188	2026-08-09 07:51:27.365	7148b819-b5b9-46ab-a2ad-405f5c2cd0cb	0.00	f
594fa85d-330f-4469-a052-e8cf13137800	07e25c94-3d71-41b4-95af-76268ecf5867	10524117	S1 Sistem Informasi	-	+6285295275593	2026-08-09 04:28:53.373	2026-09-08 04:28:53.373	\N	APPROVED	2026-08-09 04:28:53.374	2026-08-09 07:51:27.385	7148b819-b5b9-46ab-a2ad-405f5c2cd0cb	0.00	f
687a98c3-c111-4868-af23-b29c95e3dd73	84ec6c24-733b-44bc-b92d-5f77d8896096	63824028	S1 Sastra Jepang	-	+628814090320	2026-08-09 04:28:53.767	2026-09-08 04:28:53.767	\N	APPROVED	2026-08-09 04:28:53.767	2026-08-09 07:51:27.406	7148b819-b5b9-46ab-a2ad-405f5c2cd0cb	0.00	f
77ba6bf1-8d36-47ea-a9b7-686415ef0b5a	df65fca9-46d0-434c-a99c-57cf709a23bb	10124180	S1 Teknik Informatika	-	+6282129647814	2026-08-09 04:28:54.548	2026-09-08 04:28:54.548	\N	APPROVED	2026-08-09 04:28:54.549	2026-08-09 07:51:27.426	7148b819-b5b9-46ab-a2ad-405f5c2cd0cb	0.00	f
8c766821-15d1-4aa7-9f19-1cd45de305d0	3f5531a4-bb7d-4658-9cbc-3d84bce8d4e4	10124274	S1 Teknik Informatika	-	+6285925727279	2026-08-09 04:28:54.738	2026-09-08 04:28:54.738	\N	APPROVED	2026-08-09 04:28:54.739	2026-08-09 07:51:27.458	7148b819-b5b9-46ab-a2ad-405f5c2cd0cb	0.00	f
d81fb23c-0575-4f60-8a53-4bb73507222b	bc76f581-99bb-4025-b50c-183137b663f6	10124439	S1 Teknik Informatika	-	+6282118388672	2026-08-09 04:28:55.14	2026-09-08 04:28:55.14	\N	APPROVED	2026-08-09 04:28:55.142	2026-08-09 07:51:27.479	7148b819-b5b9-46ab-a2ad-405f5c2cd0cb	0.00	f
5006214e-9c11-4a12-859c-56e4dc912db3	fe9bbb7a-acb6-47a0-bbf1-a54b60f3bb15	11024007	D3 Akuntansi (Komputerisasi Akuntansi)	-	+6282230884065	2026-08-09 04:28:55.354	2026-09-08 04:28:55.354	109	APPROVED	2026-08-09 04:28:55.356	2026-08-09 07:51:27.499	481ed30e-c1eb-45fa-a376-5196a91e7b45	0.00	f
08f34e43-9090-4886-864a-6b2667d1c0ad	f09cb6bf-8c3f-4d41-8c21-ccd21f2a505a	41823005	S1 Ilmu Komunikasi	-	+6281916667550	2026-08-09 04:28:55.917	2026-09-08 04:28:55.917	109	APPROVED	2026-08-09 04:28:55.918	2026-08-09 07:51:27.524	481ed30e-c1eb-45fa-a376-5196a91e7b45	0.00	f
ab0f78e5-2572-4309-bd0d-644ec01fbf73	60889810-7bb9-4918-bbc3-b919de4ed9ab	10524120	S1 Sistem Informasi	-	+6289991393428	2026-08-09 04:28:56.125	2026-09-08 04:28:56.125	109	APPROVED	2026-08-09 04:28:56.126	2026-08-09 07:51:27.541	481ed30e-c1eb-45fa-a376-5196a91e7b45	0.00	f
35fd2018-8df5-4f0e-a791-f523cc45279f	0e97c09f-dfa9-4911-bba1-222e14edf909	63824039	S1 Sastra Jepang	-	+6285640391031	2026-08-09 04:28:56.515	2026-09-08 04:28:56.515	109	APPROVED	2026-08-09 04:28:56.516	2026-08-09 07:51:27.562	481ed30e-c1eb-45fa-a376-5196a91e7b45	0.00	f
41f0d9f3-975a-493f-af7c-393f537a3f78	bbe1bfab-a239-462c-8ba7-540df648a58d	13024020	S1 Teknik Sipil	-	+6287819432735	2026-08-09 04:28:56.713	2026-09-08 04:28:56.713	109	APPROVED	2026-08-09 04:28:56.714	2026-08-09 07:51:27.595	481ed30e-c1eb-45fa-a376-5196a91e7b45	0.00	f
5148d3ef-07cf-4259-9ed5-91f82a6fee5f	f289614d-5263-4564-83be-3f4ed34a26ea	10124189	S1 Teknik Informatika	-	+62895355205081	2026-08-09 04:28:57.132	2026-09-08 04:28:57.132	109	APPROVED	2026-08-09 04:28:57.132	2026-08-09 07:51:27.621	481ed30e-c1eb-45fa-a376-5196a91e7b45	0.00	f
1950dc68-4196-4eab-9ea1-f52f363d92b5	9b7eaa7b-3501-484b-80ac-c77e3e23ef94	21324004	D3 Akuntansi	-	+6289516171044	2026-08-09 04:28:58.084	2026-09-08 04:28:58.084	111	APPROVED	2026-08-09 04:28:58.085	2026-08-09 07:51:27.664	dba5754c-2452-488a-9c9c-bd31d5de80c3	0.00	f
de13e45b-4525-4eba-9e90-a4f2399df20b	b9ed71e5-4af2-453a-be0a-81941031c179	13124021	S1 Teknik Elektro	-	+6282298255474	2026-08-09 04:28:59.422	2026-09-08 04:28:59.422	111	APPROVED	2026-08-09 04:28:59.423	2026-08-09 07:51:27.689	dba5754c-2452-488a-9c9c-bd31d5de80c3	0.00	f
8de1a24f-b5fa-47e7-8e5f-e1d6b5b78f6b	5d1084f5-d0e3-4a3f-b61e-a1e1ed088239	10124452	S1 Teknik Informatika	-	+6282117279601	2026-08-09 04:29:00.576	2026-09-08 04:29:00.576	111	APPROVED	2026-08-09 04:29:00.577	2026-08-09 07:51:27.709	dba5754c-2452-488a-9c9c-bd31d5de80c3	0.00	f
827d87c9-b0e2-479e-b3c8-a00a649289d4	0d7d5e2d-ceba-4592-bc0a-bf43c5957e54	10423005	S1 Teknik Arsitektur	-	+62895331171595	2026-08-09 04:29:00.94	2026-09-08 04:29:00.94	\N	APPROVED	2026-08-09 04:29:00.94	2026-08-09 07:51:27.724	9257a0b0-16fe-4419-a070-d3cf9eefd714	0.00	f
c4155de8-2689-4c6d-bc14-c60d1e2d35b0	82ad7bb7-dfe7-46b8-97d9-c6e64efe08c3	10124288	S1 Teknik Informatika	-	+6282223414588	2026-08-09 04:29:00.188	2026-09-08 04:29:00.188	111	APPROVED	2026-08-09 04:29:00.189	2026-08-09 07:51:27.768	dba5754c-2452-488a-9c9c-bd31d5de80c3	0.00	f
af91e948-a129-4eda-bb01-b756f4f64e91	69ad8051-1794-483f-803f-2269eaca4c2c	10124349	S1 Teknik Informatika	-	+6285523994165	2026-08-09 04:29:00.405	2026-09-08 04:29:00.405	111	APPROVED	2026-08-09 04:29:00.406	2026-08-09 07:51:27.789	dba5754c-2452-488a-9c9c-bd31d5de80c3	0.00	f
bfc1a78d-1795-4372-a503-7fc06bdc1ade	9ef3a1d8-b8fa-494a-aef3-35b0fd51d21c	44324016	S1 Hubungan Internasional	-	+6287717319320	2026-08-09 04:29:01.157	2026-09-08 04:29:01.157	\N	APPROVED	2026-08-09 04:29:01.158	2026-08-09 07:51:27.815	9257a0b0-16fe-4419-a070-d3cf9eefd714	0.00	f
c516a9da-fd84-45ca-9db5-1e1665ecae36	e9e1ccb8-1924-4f68-b5f5-7a6476116412	41824056	S1 Ilmu Komunikasi	-	+6281903971730	2026-08-09 04:29:01.399	2026-09-08 04:29:01.399	\N	APPROVED	2026-08-09 04:29:01.4	2026-08-09 07:51:27.847	9257a0b0-16fe-4419-a070-d3cf9eefd714	0.00	f
4eb49503-ad48-4bb0-adbb-a82903cc90b9	0d09ec2e-9de7-4373-a228-d16f3cc4929c	10524123	S1 Sistem Informasi	-	+6283142940023	2026-08-09 04:29:01.588	2026-09-08 04:29:01.588	\N	APPROVED	2026-08-09 04:29:01.589	2026-08-09 07:51:27.868	9257a0b0-16fe-4419-a070-d3cf9eefd714	0.00	f
69a45ed5-11b2-486f-b169-8d8c7289db66	324fc301-f134-4911-824a-6550f3c5440c	10524180	S1 Sistem Informasi	-	+6287778067916	2026-08-09 04:29:01.793	2026-09-08 04:29:01.793	\N	APPROVED	2026-08-09 04:29:01.794	2026-08-09 07:51:27.885	9257a0b0-16fe-4419-a070-d3cf9eefd714	0.00	f
2ca16701-cd67-48eb-81b3-15c3ce94665a	e7df9733-9382-4818-bed1-1e0c8f5a7dfb	63824015	S1 Sastra Jepang	-	+6287774922001	2026-08-09 04:29:01.993	2026-09-08 04:29:01.993	\N	APPROVED	2026-08-09 04:29:01.994	2026-08-09 07:51:27.903	9257a0b0-16fe-4419-a070-d3cf9eefd714	0.00	f
5af3faf5-27df-4387-a6b6-372f3d02ab16	aefa200b-95c5-4f59-ba69-e7ed84bcf948	13124013	S1 Teknik Elektro	-	+6287735289557	2026-08-09 04:29:02.279	2026-09-08 04:29:02.279	\N	APPROVED	2026-08-09 04:29:02.28	2026-08-09 07:51:27.926	9257a0b0-16fe-4419-a070-d3cf9eefd714	0.00	f
279ab3eb-e3cf-48a7-85fa-edc100196285	3dfab1b6-7877-4f2b-a920-a126dbb36ba8	13022001	S1 Teknik Sipil	-	+6285934587972	2026-08-09 04:29:02.52	2026-09-08 04:29:02.52	\N	APPROVED	2026-08-09 04:29:02.521	2026-08-09 07:51:27.95	9257a0b0-16fe-4419-a070-d3cf9eefd714	0.00	f
295aa592-9f9b-46d1-a019-1bc012e9943e	1cdf76b5-965e-44e7-9aad-0bdae7182f3b	10124142	S1 Teknik Informatika	-	+6282145468148	2026-08-09 04:29:02.698	2026-09-08 04:29:02.698	\N	APPROVED	2026-08-09 04:29:02.699	2026-08-09 07:51:27.973	9257a0b0-16fe-4419-a070-d3cf9eefd714	0.00	f
4359d53b-bb4b-486e-b66a-c02826010a97	71563867-660b-41f6-8fd4-644a5ffa4f11	10124199	S1 Teknik Informatika	-	+6281271927712	2026-08-09 04:29:02.902	2026-09-08 04:29:02.902	\N	APPROVED	2026-08-09 04:29:02.902	2026-08-09 07:51:27.992	9257a0b0-16fe-4419-a070-d3cf9eefd714	0.00	f
5fd05f5e-3e86-4c27-9f97-eb04c584db11	45f00960-ad74-4187-9828-48427dce7377	10124296	S1 Teknik Informatika	-	+6285715943251	2026-08-09 04:29:03.084	2026-09-08 04:29:03.084	\N	APPROVED	2026-08-09 04:29:03.085	2026-08-09 07:51:28.016	9257a0b0-16fe-4419-a070-d3cf9eefd714	0.00	f
ea0c1680-db35-41d3-ba55-3f6e2094a180	52eac8bd-3381-4b32-b0a3-4fefac1f0aea	10124350	S1 Teknik Informatika	-	+6282262930148	2026-08-09 04:29:03.265	2026-09-08 04:29:03.265	\N	APPROVED	2026-08-09 04:29:03.266	2026-08-09 07:51:28.039	9257a0b0-16fe-4419-a070-d3cf9eefd714	0.00	f
5bc8ce32-12a2-4d1b-9c5d-ba5c8a2838d5	6f419bec-1991-424b-af3e-57490036fa4a	10124465	S1 Teknik Informatika	-	+6285732078194	2026-08-09 04:29:03.462	2026-09-08 04:29:03.462	\N	APPROVED	2026-08-09 04:29:03.463	2026-08-09 07:51:28.062	9257a0b0-16fe-4419-a070-d3cf9eefd714	0.00	f
62379f73-0894-40b5-8db0-f24574bbff8d	216615a5-520b-4237-81f5-5ee02c75dd63	21424017	Manajemen Pemasaran D3	-	+6289991393464	2026-08-09 04:29:03.735	2026-09-08 04:29:03.735	\N	APPROVED	2026-08-09 04:29:03.736	2026-08-09 07:51:28.086	9257a0b0-16fe-4419-a070-d3cf9eefd714	0.00	f
cbb771ff-7acb-4e8f-8b3d-ec4fe9b7baf9	ff32b408-edcc-4b66-8686-42aadc6ece8f	10421001	S1 Teknik Arsitektur	-	+6282217258956	2026-08-09 04:29:04.109	2026-09-08 04:29:04.109	118	APPROVED	2026-08-09 04:29:04.11	2026-08-09 07:51:28.105	62985ab4-50ee-4a49-a294-b6e0eb6611f9	0.00	f
4bc0914a-d7cf-4de7-ba38-c67bff4063d8	43127aeb-7b43-49bd-a01e-ea8c8e24c954	44324022	S1 Hubungan Internasional	-	+62895603407311	2026-08-09 04:29:04.32	2026-09-08 04:29:04.32	118	APPROVED	2026-08-09 04:29:04.321	2026-08-09 07:51:28.122	62985ab4-50ee-4a49-a294-b6e0eb6611f9	0.00	f
bab3a294-34d6-486f-8e0c-6fb3882d4640	eaae94a0-7fdd-43c5-a5f6-2895c595d48c	41824111	S1 Ilmu Komunikasi	-	+6282118447939	2026-08-09 04:29:04.508	2026-09-08 04:29:04.508	118	APPROVED	2026-08-09 04:29:04.508	2026-08-09 07:51:28.146	62985ab4-50ee-4a49-a294-b6e0eb6611f9	0.00	f
834e61fa-c7ab-493c-a2e5-a39ecf0691c3	004ee873-f8b8-4e83-9964-d461a44279dc	10524125	S1 Sistem Informasi	-	+6289626360843	2026-08-09 04:29:04.693	2026-09-08 04:29:04.693	118	APPROVED	2026-08-09 04:29:04.702	2026-08-09 07:51:28.176	62985ab4-50ee-4a49-a294-b6e0eb6611f9	0.00	f
330ffd88-4a60-4da8-96c7-d4f76710b8d5	a6d4c584-8c7b-42ab-871b-079d2f8c27ce	10524186	S1 Sistem Informasi	-	+6281384336722	2026-08-09 04:29:04.896	2026-09-08 04:29:04.896	118	APPROVED	2026-08-09 04:29:04.897	2026-08-09 07:51:28.203	62985ab4-50ee-4a49-a294-b6e0eb6611f9	0.00	f
2099677a-e107-4df0-9d58-e6276d1cfb2e	c6d77f0f-61d1-436f-ad3e-cdbecc1f7267	10224014	S1 Sistem Komputer	-	+6285158026652	2026-08-09 04:29:05.128	2026-09-08 04:29:05.128	118	APPROVED	2026-08-09 04:29:05.131	2026-08-09 07:51:28.224	62985ab4-50ee-4a49-a294-b6e0eb6611f9	0.00	f
7d1d1724-90d0-404a-918f-2f4d03dfa1f4	6a1f035f-fcc7-496e-9ea9-ef90e0ed33f9	13123013	S1 Teknik Elektro	-	+6283101183602	2026-08-09 04:29:05.335	2026-09-08 04:29:05.335	118	APPROVED	2026-08-09 04:29:05.336	2026-08-09 07:51:28.254	62985ab4-50ee-4a49-a294-b6e0eb6611f9	0.00	f
de5eae3a-a429-41fa-b70c-18244e72d203	fae7f644-4d07-41d4-b692-e6e6eea25ab5	13024014	S1 Teknik Sipil	-	+6282113741298	2026-08-09 04:29:05.538	2026-09-08 04:29:05.538	118	APPROVED	2026-08-09 04:29:05.539	2026-08-09 07:51:28.288	62985ab4-50ee-4a49-a294-b6e0eb6611f9	0.00	f
0bd8d83b-a330-4a54-8a6b-4044e12e2dc1	81e218cb-dc33-4ce2-b4e9-6b1384d057f3	10124143	S1 Teknik Informatika	-	+628818239716	2026-08-09 04:29:05.745	2026-09-08 04:29:05.745	118	APPROVED	2026-08-09 04:29:05.746	2026-08-09 07:51:28.326	62985ab4-50ee-4a49-a294-b6e0eb6611f9	0.00	f
135ab358-9f48-4fd9-b04b-d7e038ab7b63	7e875e25-6772-4681-9def-1167eb2c7633	10124201	S1 Teknik Informatika	-	+6289648354570	2026-08-09 04:29:05.943	2026-09-08 04:29:05.943	118	APPROVED	2026-08-09 04:29:05.944	2026-08-09 07:51:28.348	62985ab4-50ee-4a49-a294-b6e0eb6611f9	0.00	f
c913ede6-ff41-4e7a-8e47-e553c2522fe9	94fdecde-e29f-415f-97e0-a0ba6215fe0e	10124304	S1 Teknik Informatika	-	+6281312977873	2026-08-09 04:29:06.458	2026-09-08 04:29:06.458	118	APPROVED	2026-08-09 04:29:06.459	2026-08-09 07:51:28.368	62985ab4-50ee-4a49-a294-b6e0eb6611f9	0.00	f
45344b9a-0675-465a-991f-4bf7b4cb035f	f270f778-a49c-4c50-9468-266b49260612	10124351	S1 Teknik Informatika	-	+6281320317855	2026-08-09 04:29:06.648	2026-09-08 04:29:06.648	118	APPROVED	2026-08-09 04:29:06.649	2026-08-09 07:51:28.395	62985ab4-50ee-4a49-a294-b6e0eb6611f9	0.00	f
3d6ba89d-62e7-4859-a48c-dfb0dc4bab46	60327647-14b2-4106-8d97-ad4c9cd58dd7	10124467	S1 Teknik Informatika	-	+6281219739130	2026-08-09 04:29:06.834	2026-09-08 04:29:06.834	118	APPROVED	2026-08-09 04:29:06.835	2026-08-09 07:51:28.418	62985ab4-50ee-4a49-a294-b6e0eb6611f9	0.00	f
e1dd96c6-7472-4a98-8d4c-d4bb89641210	c6f99bdf-3071-4e02-b669-4c6645ac4dbd	44324072	S1 Hubungan Internasional	-	+6289682326222	2026-08-09 04:29:07.599	2026-09-08 04:29:07.599	116	APPROVED	2026-08-09 04:29:07.6	2026-08-09 07:51:28.489	9cc60fce-4ca1-4c3e-a790-06d3b4beba12	0.00	f
944e3eb6-b826-45e2-9493-831cbb0c44a7	395408b8-fc8e-472a-a243-1835785fc9a0	41824141	S1 Ilmu Komunikasi	-	+6285211307737	2026-08-09 04:29:07.787	2026-09-08 04:29:07.787	116	APPROVED	2026-08-09 04:29:07.789	2026-08-09 07:51:28.514	9cc60fce-4ca1-4c3e-a790-06d3b4beba12	0.00	f
4d7d17ec-7fd2-450d-9790-61e0e327d6b7	33361471-f165-4992-b73d-e3602fac57a9	10524200	S1 Sistem Informasi	-	+6285694740755	2026-08-09 04:29:08.173	2026-09-08 04:29:08.173	116	APPROVED	2026-08-09 04:29:08.174	2026-08-09 07:51:28.563	9cc60fce-4ca1-4c3e-a790-06d3b4beba12	0.00	f
46d61865-5354-4aa3-a8f1-a0863a1e1545	1c489b62-66f8-4540-b68d-7ad1b615bf2e	13024004	S1 Teknik Sipil	-	+6288220375399	2026-08-09 04:29:08.593	2026-09-08 04:29:08.593	116	APPROVED	2026-08-09 04:29:08.594	2026-08-09 07:51:28.587	9cc60fce-4ca1-4c3e-a790-06d3b4beba12	0.00	f
f6c787e9-4ba8-497d-afad-cc0b5f0016d7	d6091fb3-c389-4794-98e8-5bb51e4075b7	10124150	S1 Teknik Informatika	-	+628950998860	2026-08-09 04:29:08.822	2026-09-08 04:29:08.822	116	APPROVED	2026-08-09 04:29:08.823	2026-08-09 07:51:28.607	9cc60fce-4ca1-4c3e-a790-06d3b4beba12	0.00	f
a6240e83-4471-43cb-afcb-9073aeefda4e	43f1dcc6-bbae-427a-8f8c-eae86100e2be	10422032	S1 Teknik Arsitektur	-	+6285720301033	2026-08-09 04:29:09.888	2026-09-08 04:29:09.888	113	APPROVED	2026-08-09 04:29:09.889	2026-08-09 07:51:28.66	101f8ca9-56b3-4c58-b7c4-18a001d6220c	0.00	f
60381c1b-e250-47c7-a3b6-9e7a33f7753e	30684fad-0aa2-4d43-80ef-97f846acf639	44324018	S1 Hubungan Internasional	-	+6282130876806	2026-08-09 04:29:10.073	2026-09-08 04:29:10.073	113	APPROVED	2026-08-09 04:29:10.074	2026-08-09 07:51:28.683	101f8ca9-56b3-4c58-b7c4-18a001d6220c	0.00	f
dd2a768d-c783-4314-9e9c-e608b237cebb	de421387-6c2f-4611-830b-a30ae8c4f1aa	10524131	S1 Sistem Informasi	-	+6287752463618	2026-08-09 04:29:10.473	2026-09-08 04:29:10.473	113	APPROVED	2026-08-09 04:29:10.474	2026-08-09 07:51:28.706	101f8ca9-56b3-4c58-b7c4-18a001d6220c	0.00	f
f2b67cc5-74b6-46b6-bbca-699a9584a3f3	f0e6c222-8abd-48ef-8daa-50ba764df49a	10524201	S1 Sistem Informasi	-	+6285183166183	2026-08-09 04:29:10.653	2026-09-08 04:29:10.653	113	APPROVED	2026-08-09 04:29:10.654	2026-08-09 07:51:28.726	101f8ca9-56b3-4c58-b7c4-18a001d6220c	0.00	f
cf43e04e-0de2-47d3-8eff-430e72725ce2	0fba820f-f981-4051-b603-fcd99051e58b	13024016	S1 Teknik Sipil	-	+6283816767482	2026-08-09 04:29:11.143	2026-09-08 04:29:11.143	113	APPROVED	2026-08-09 04:29:11.145	2026-08-09 07:51:28.746	101f8ca9-56b3-4c58-b7c4-18a001d6220c	0.00	f
27d7dadf-c892-4c8d-b62b-ced32650c081	a099631c-1529-4567-a56b-f44fb057d7bb	10124151	S1 Teknik Informatika	-	+628882347758	2026-08-09 04:29:11.329	2026-09-08 04:29:11.329	113	APPROVED	2026-08-09 04:29:11.33	2026-08-09 07:51:28.763	101f8ca9-56b3-4c58-b7c4-18a001d6220c	0.00	f
8113cdfb-5592-4291-bd21-3495558839eb	4fa22934-5ae2-46b2-a24a-79d71aba76c4	10124322	S1 Teknik Informatika	-	+6282262403045	2026-08-09 04:29:11.724	2026-09-08 04:29:11.724	113	APPROVED	2026-08-09 04:29:11.725	2026-08-09 07:51:28.783	101f8ca9-56b3-4c58-b7c4-18a001d6220c	0.00	f
28e22a73-44d4-4142-89dc-2fc74133b2e4	4315205d-93c3-4437-adf9-ddd028d66761	41824168	S1 Ilmu Komunikasi	-	+6282190465563	2026-08-09 04:29:12.903	2026-09-08 04:29:12.903	67	APPROVED	2026-08-09 04:29:12.904	2026-08-09 07:51:28.805	3ce3582b-5158-4171-85f8-ac0219986829	0.00	f
c708bd95-9501-4a13-a158-039056617fb9	7745b6f5-464d-43bf-8677-e6d0061cf134	10524098	S1 Sistem Informasi	-	+6289991393507	2026-08-09 04:29:13.364	2026-09-08 04:29:13.364	67	APPROVED	2026-08-09 04:29:13.365	2026-08-09 07:51:28.837	3ce3582b-5158-4171-85f8-ac0219986829	0.00	f
5354b6b0-a958-4e0d-99eb-f9e7b3c6c761	038f4cb9-06d0-4a16-aba2-f5e37e4d4e10	10524104	S1 Sistem Informasi	-	+6281320357232	2026-08-09 04:29:13.79	2026-09-08 04:29:13.79	67	APPROVED	2026-08-09 04:29:13.791	2026-08-09 07:51:28.869	3ce3582b-5158-4171-85f8-ac0219986829	0.00	f
38bd3dd2-bd8d-4de6-910d-2f1886c424fa	1ffeab02-e0c8-45b1-884c-b3c6ab4d6023	10524110	S1 Sistem Informasi	-	+6282210202546	2026-08-09 04:29:14.137	2026-09-08 04:29:14.137	67	APPROVED	2026-08-09 04:29:14.138	2026-08-09 07:51:28.891	3ce3582b-5158-4171-85f8-ac0219986829	0.00	f
3ca612b0-3220-495b-be07-bd40135fd5a1	27b30313-861d-44af-bd44-0df99fa51c0f	63824011	S1 Sastra Jepang	-	+6285710279506	2026-08-09 04:29:14.406	2026-09-08 04:29:14.406	67	APPROVED	2026-08-09 04:29:14.409	2026-08-09 07:51:28.908	3ce3582b-5158-4171-85f8-ac0219986829	0.00	f
6ba9a516-9b57-4230-bd3b-8dbdbc84983b	8d7fdcf3-05d5-4fbc-bed6-ebe8e01d35dd	13124018	S1 Teknik Elektro	-	+6285724110038	2026-08-09 04:29:14.632	2026-09-08 04:29:14.632	67	APPROVED	2026-08-09 04:29:14.632	2026-08-09 07:51:28.943	3ce3582b-5158-4171-85f8-ac0219986829	0.00	f
1736455b-556e-4709-845d-f4c8ca1d9a3e	96feda31-d9ae-4661-bee8-0be172a77de2	10324025	S1 Teknik Industri	-	+10324015	2026-08-09 04:29:14.862	2026-09-08 04:29:14.862	67	APPROVED	2026-08-09 04:29:14.863	2026-08-09 07:51:28.961	3ce3582b-5158-4171-85f8-ac0219986829	0.00	f
a1954d6f-fdae-43a1-86ae-c5ba27cae250	2384833f-7a03-42cb-bd25-429e0af54083	13024023	S1 Teknik Sipil	-	+6285861041608	2026-08-09 04:29:15.084	2026-09-08 04:29:15.084	67	APPROVED	2026-08-09 04:29:15.085	2026-08-09 07:51:28.982	3ce3582b-5158-4171-85f8-ac0219986829	0.00	f
c61b1a40-6348-4a76-ad05-78df3cd8fb24	842a41fe-05e0-4e8b-b87d-d1c0ff1af2aa	10124071	S1 Teknik Informatika	-	+6282126577575	2026-08-09 04:29:15.302	2026-09-08 04:29:15.302	67	APPROVED	2026-08-09 04:29:15.304	2026-08-09 07:51:28.998	3ce3582b-5158-4171-85f8-ac0219986829	0.00	f
33bd672d-15f8-4fe7-9d7b-74b9517dea97	793962d6-6328-4951-bf40-4dda996e7fb5	10124088	S1 Teknik Informatika	-	+6289517832715	2026-08-09 04:29:15.739	2026-09-08 04:29:15.739	67	APPROVED	2026-08-09 04:29:15.74	2026-08-09 07:51:29.028	3ce3582b-5158-4171-85f8-ac0219986829	0.00	f
11036f30-0eb8-406c-86bf-4299eb1b2325	7d3ef619-50c5-46bc-b07f-7d6fa156f03e	10420020	S1 Teknik Arsitektur	-	+6282134330763	2026-08-09 04:29:16.679	2026-09-08 04:29:16.679	\N	APPROVED	2026-08-09 04:29:16.68	2026-08-09 07:51:29.053	37657e2b-16f8-4e8d-8140-ab7bb2725bd9	0.00	f
f4a667fb-3718-428b-a48e-0c5867885479	4416ac81-2034-4278-851e-a92d9770ed7c	44324024	S1 Hubungan Internasional	-	+6287724298110	2026-08-09 04:29:16.98	2026-09-08 04:29:16.98	\N	APPROVED	2026-08-09 04:29:16.981	2026-08-09 07:51:29.075	37657e2b-16f8-4e8d-8140-ab7bb2725bd9	0.00	f
1bf55f0d-b959-4538-955b-a9aa0cb597c4	c5565fda-dbba-4440-ae90-226591c3a6b3	31624010	S1 Ilmu Hukum	-	+6282126628491	2026-08-09 04:29:17.22	2026-09-08 04:29:17.22	\N	APPROVED	2026-08-09 04:29:17.221	2026-08-09 07:51:29.099	37657e2b-16f8-4e8d-8140-ab7bb2725bd9	0.00	f
69a2a876-61d3-473f-8d12-d39aa0dd231b	e481beba-65e1-4d8e-9556-f888f67cbadf	41823004	S1 Ilmu Komunikasi	-	+6281315207870	2026-08-09 04:29:17.456	2026-09-08 04:29:17.456	\N	APPROVED	2026-08-09 04:29:17.457	2026-08-09 07:51:29.118	37657e2b-16f8-4e8d-8140-ab7bb2725bd9	0.00	f
17bc7b05-529e-4aa1-aa2a-9d6cc6d43986	841bab65-e23d-47ef-afc3-0d8e28418ae4	10924004	D3 Manajemen Informatika	-	+628813002848	2026-08-09 04:29:18.171	2026-09-08 04:29:18.171	\N	APPROVED	2026-08-09 04:29:18.172	2026-08-09 07:51:29.136	37657e2b-16f8-4e8d-8140-ab7bb2725bd9	0.00	f
a7449703-e8e7-4c77-aa77-94bc7834b11b	2f902cd3-edd5-4b04-9e94-7b426a6d0c7f	63824040	S1 Sastra Jepang	-	+6283838724468	2026-08-09 04:29:18.421	2026-09-08 04:29:18.421	\N	APPROVED	2026-08-09 04:29:18.423	2026-08-09 07:51:29.159	37657e2b-16f8-4e8d-8140-ab7bb2725bd9	0.00	f
453e764f-e019-40a7-a73a-17e62ebf7cd3	5e527d4b-f487-4e44-a5c1-a666d013872c	13024019	S1 Teknik Sipil	-	+6285189951040	2026-08-09 04:29:19.459	2026-09-08 04:29:19.459	\N	APPROVED	2026-08-09 04:29:19.46	2026-08-09 07:51:29.18	37657e2b-16f8-4e8d-8140-ab7bb2725bd9	0.00	f
53bba47a-960a-4450-ae84-4bab15fedae5	0a748925-addf-4110-92ad-2d110e5cfbf6	10124072	S1 Teknik Informatika	-	+6285697292897	2026-08-09 04:29:19.704	2026-09-08 04:29:19.704	\N	APPROVED	2026-08-09 04:29:19.705	2026-08-09 07:51:29.21	37657e2b-16f8-4e8d-8140-ab7bb2725bd9	0.00	f
1fdf0a65-64e5-4ea1-8535-bf0e8541ae16	3ea069df-66be-449b-9f73-d75d790313dc	10124082	S1 Teknik Informatika	-	+6283829920145	2026-08-09 04:29:20.003	2026-09-08 04:29:20.003	\N	APPROVED	2026-08-09 04:29:20.004	2026-08-09 07:51:29.245	37657e2b-16f8-4e8d-8140-ab7bb2725bd9	0.00	f
831b8e4a-fa97-4578-a91d-0c2400c5697d	3a485ee8-0721-4171-8a02-bbbe9a46888c	10124090	S1 Teknik Informatika	-	+6281224576473	2026-08-09 04:29:21.673	2026-09-08 04:29:21.673	\N	APPROVED	2026-08-09 04:29:21.673	2026-08-09 07:51:29.305	37657e2b-16f8-4e8d-8140-ab7bb2725bd9	0.00	f
aae749c6-2f98-4601-8518-d171d5874458	b527121e-7b52-48da-b637-061c9edabb09	10124097	S1 Teknik Informatika	-	+62895636866796	2026-08-09 04:29:21.91	2026-09-08 04:29:21.91	\N	APPROVED	2026-08-09 04:29:21.911	2026-08-09 07:51:29.326	37657e2b-16f8-4e8d-8140-ab7bb2725bd9	0.00	f
50808b9d-a9cd-47df-96af-36f7970c50f0	59d4caf7-4abd-4570-9f43-15d3c97684dc	10124307	S1 Teknik Informatika	-	+6285703723540	2026-08-09 04:29:09.259	2026-09-08 04:29:09.259	116	APPROVED	2026-08-09 04:29:09.26	2026-08-09 07:51:29.397	9cc60fce-4ca1-4c3e-a790-06d3b4beba12	0.00	f
97a4e369-eaf0-4634-9d5a-09a5ac849aa8	43987e4a-f162-4158-88b3-26fecca835be	10124352	S1 Teknik Informatika	-	+62895411964698	2026-08-09 04:29:09.45	2026-09-08 04:29:09.45	116	APPROVED	2026-08-09 04:29:09.451	2026-08-09 07:51:29.422	9cc60fce-4ca1-4c3e-a790-06d3b4beba12	0.00	f
2b1ec582-76a3-4167-b630-39710b72c4c3	5ac4a4ad-d948-42b2-8a32-33427067fd72	41823003	S1 Ilmu Komunikasi	-	+6285175239753	2026-08-09 04:29:10.273	2026-09-08 04:29:10.273	113	APPROVED	2026-08-09 04:29:10.274	2026-08-09 07:51:29.445	101f8ca9-56b3-4c58-b7c4-18a001d6220c	0.00	f
db351f39-e354-4145-a154-99abef03f89a	86880069-22e5-4097-a1d5-432a3c5761f3	10223015	S1 Sistem Komputer	-	+6285862286700	2026-08-09 04:29:10.86	2026-09-08 04:29:10.86	113	APPROVED	2026-08-09 04:29:10.862	2026-08-09 07:51:29.468	101f8ca9-56b3-4c58-b7c4-18a001d6220c	0.00	f
62338a68-cee2-4a61-9fc9-717e5f83435c	3ed6d002-c589-432c-88f6-76875449826a	10124215	S1 Teknik Informatika	-	+6281312459367	2026-08-09 04:29:11.532	2026-09-08 04:29:11.532	113	APPROVED	2026-08-09 04:29:11.533	2026-08-09 07:51:29.488	101f8ca9-56b3-4c58-b7c4-18a001d6220c	0.00	f
d78cf7dc-7b70-415d-902c-b4f25e825451	82097e1a-8883-492f-858e-b2b1b5447a6d	10124354	S1 Teknik Informatika	-	+628988248277	2026-08-09 04:29:11.925	2026-09-08 04:29:11.925	113	APPROVED	2026-08-09 04:29:11.926	2026-08-09 07:51:29.51	101f8ca9-56b3-4c58-b7c4-18a001d6220c	0.00	f
cdb3f1ef-1906-4915-a84c-83de0132e95d	c4101919-f38b-4dc7-aa27-63add825d7db	10124707	S1 Teknik Informatika	-	+6289524863162	2026-08-09 04:29:12.109	2026-09-08 04:29:12.109	113	APPROVED	2026-08-09 04:29:12.109	2026-08-09 07:51:29.528	101f8ca9-56b3-4c58-b7c4-18a001d6220c	0.00	f
f43e46c9-39fd-46d2-8846-1f795c647bd9	ed01884e-41e1-45a9-8133-0fb2aa6689ba	21124020	S1 Akuntansi	-	+62881022759682	2026-08-09 04:29:12.321	2026-09-08 04:29:12.321	67	APPROVED	2026-08-09 04:29:12.323	2026-08-09 07:51:29.547	3ce3582b-5158-4171-85f8-ac0219986829	0.00	f
e239bef0-bd36-4da9-8614-d9e1417632aa	8dbb381f-d4ab-4256-ad99-4377dfd1dee3	10422024	S1 Teknik Arsitektur	-	+6285700669767	2026-08-09 04:29:12.526	2026-09-08 04:29:12.526	67	APPROVED	2026-08-09 04:29:12.526	2026-08-09 07:51:29.573	3ce3582b-5158-4171-85f8-ac0219986829	0.00	f
3ef7eae3-5407-4071-8c7e-043f378d26bc	7ff6a70b-a2cf-4286-aa58-d1a20c968fba	31624002	S1 Ilmu Hukum	-	+6285954452051	2026-08-09 04:29:12.713	2026-09-08 04:29:12.713	67	APPROVED	2026-08-09 04:29:12.714	2026-08-09 07:51:29.591	3ce3582b-5158-4171-85f8-ac0219986829	0.00	f
cead2160-2146-4384-907c-ba61bad17434	819140ef-3277-41c4-9499-b65b429ce1b6	10124079	S1 Teknik Informatika	-	+6287777081360	2026-08-09 04:29:15.529	2026-09-08 04:29:15.529	67	APPROVED	2026-08-09 04:29:15.53	2026-08-09 07:51:29.617	3ce3582b-5158-4171-85f8-ac0219986829	0.00	f
703179cc-072d-43ce-b3b9-4619b731285a	a5f344f5-ea3e-4e2e-aa11-b51c8281c554	10124096	S1 Teknik Informatika	-	+6285695522173	2026-08-09 04:29:15.963	2026-09-08 04:29:15.963	67	APPROVED	2026-08-09 04:29:15.964	2026-08-09 07:51:29.648	3ce3582b-5158-4171-85f8-ac0219986829	0.00	f
bbc05053-20bc-40eb-8d89-a238d0de2877	01f87165-fd52-46e5-acc1-44c72b839102	10124110	S1 Teknik Informatika	-	+6281224017174	2026-08-09 04:29:16.184	2026-09-08 04:29:16.184	67	APPROVED	2026-08-09 04:29:16.185	2026-08-09 07:51:29.68	3ce3582b-5158-4171-85f8-ac0219986829	0.00	f
1956e90e-b104-456c-8066-e6edb2ea9760	636e0f28-9f55-4cc5-8286-80ad7b2e1bf5	21124801	S1 Akuntansi	-	+62895346193872	2026-08-09 04:29:16.454	2026-09-08 04:29:16.454	\N	APPROVED	2026-08-09 04:29:16.455	2026-08-09 07:51:29.708	37657e2b-16f8-4e8d-8140-ab7bb2725bd9	0.00	f
aee86f00-3f28-432d-9689-be9c648ce2d1	d98daaab-6626-4f9b-8e97-d42068fae34c	10524099	S1 Sistem Informasi	-	+6282391069343	2026-08-09 04:29:17.67	2026-09-08 04:29:17.67	\N	APPROVED	2026-08-09 04:29:17.67	2026-08-09 07:51:29.731	37657e2b-16f8-4e8d-8140-ab7bb2725bd9	0.00	f
0cec6269-7e96-47a5-a634-83ad554124fb	f543af29-e36c-4473-8577-2105a7ba580a	10524106	S1 Sistem Informasi	-	+6281915331929	2026-08-09 04:29:17.881	2026-09-08 04:29:17.881	\N	APPROVED	2026-08-09 04:29:17.881	2026-08-09 07:51:29.751	37657e2b-16f8-4e8d-8140-ab7bb2725bd9	0.00	f
3b69e29d-aa39-4c86-8a35-3f2e36fa71cd	8f6a5f55-a58d-4859-a9f7-2fae2b782c80	13124031	S1 Teknik Elektro	-	+6281318443400	2026-08-09 04:29:18.973	2026-09-08 04:29:18.973	\N	APPROVED	2026-08-09 04:29:18.974	2026-08-09 07:51:29.776	37657e2b-16f8-4e8d-8140-ab7bb2725bd9	0.00	f
79c29c8e-ae9d-48ae-b6b0-62649ffa655b	9bc8b125-5e27-4323-880d-497598bb4276	10324014	S1 Teknik Industri	-	+6287771298254	2026-08-09 04:29:19.225	2026-09-08 04:29:19.225	\N	APPROVED	2026-08-09 04:29:19.226	2026-08-09 07:51:29.811	37657e2b-16f8-4e8d-8140-ab7bb2725bd9	0.00	f
58acfd71-139a-414a-8ab5-ff255a014ebe	0bf3bfe4-5f67-47f1-92cf-b18baae6b67a	10124111	S1 Teknik Informatika	-	+6282219421703	2026-08-09 04:29:22.123	2026-09-08 04:29:22.123	\N	APPROVED	2026-08-09 04:29:22.124	2026-08-09 07:51:29.832	37657e2b-16f8-4e8d-8140-ab7bb2725bd9	0.00	f
87a6de21-127a-4cea-93e4-83c3fcaa1840	a67cb59d-bb8b-4ec1-9c27-fd66358841a4	11024016	D3 Akuntansi (Komputerisasi Akuntansi)	-	+6289525438941	2026-08-09 04:29:22.403	2026-09-08 04:29:22.403	\N	APPROVED	2026-08-09 04:29:22.404	2026-08-09 07:51:29.85	ba4a1b83-a0e9-40a2-8a19-9965908f5ce3	0.00	f
e94b2538-a4a4-4d46-9690-44b740ad7984	af5da11a-eaeb-4734-9e68-0ae18b950e4f	52124005	D3 Desain Grafis	-	+6285220183273	2026-08-09 04:29:22.673	2026-09-08 04:29:22.673	\N	APPROVED	2026-08-09 04:29:22.674	2026-08-09 07:51:29.872	ba4a1b83-a0e9-40a2-8a19-9965908f5ce3	0.00	f
1c504de5-6ab4-4bca-9cdf-0659a9a8f226	96473f7e-a4fa-4179-a122-566836904482	10524108	S1 Sistem Informasi	-	+6281910588356	2026-08-09 04:29:23.856	2026-09-08 04:29:23.856	\N	APPROVED	2026-08-09 04:29:23.857	2026-08-09 07:51:29.888	ba4a1b83-a0e9-40a2-8a19-9965908f5ce3	0.00	f
219ba26a-e13b-4a99-a19c-e57a6b03da2a	6532208b-97b9-4c6b-aaf2-1db1b857df8b	10224019	S1 Sistem Komputer	-	+6281389026123	2026-08-09 04:29:24.333	2026-09-08 04:29:24.333	\N	APPROVED	2026-08-09 04:29:24.334	2026-08-09 07:51:29.93	ba4a1b83-a0e9-40a2-8a19-9965908f5ce3	0.00	f
2f1ee8c3-da91-431f-90fb-6cee0247bac1	e7d4749b-5507-44e1-8012-d30b4c368740	13124028	S1 Teknik Elektro	-	+6285794439285	2026-08-09 04:29:24.586	2026-09-08 04:29:24.586	\N	APPROVED	2026-08-09 04:29:24.586	2026-08-09 07:51:29.958	ba4a1b83-a0e9-40a2-8a19-9965908f5ce3	0.00	f
d6018804-a464-4ab1-8c89-0871049bb728	0713924f-ec18-4b2f-bfec-701c0f03237c	10824007	D3 Teknik Komputer	-	+628976423365	2026-08-09 04:29:24.893	2026-09-08 04:29:24.893	\N	APPROVED	2026-08-09 04:29:24.894	2026-08-09 07:51:29.977	ba4a1b83-a0e9-40a2-8a19-9965908f5ce3	0.00	f
ece50846-f1f4-47ef-ab04-938103f46de4	f2098260-fb08-4ad5-a0bf-294ea70cf283	13024021	S1 Teknik Sipil	-	+6283808786513	2026-08-09 04:29:25.137	2026-09-08 04:29:25.137	\N	APPROVED	2026-08-09 04:29:25.138	2026-08-09 07:51:29.997	ba4a1b83-a0e9-40a2-8a19-9965908f5ce3	0.00	f
2b179464-f625-403c-8418-3ccbac493445	b0ad9afb-0b83-45df-acf1-017080d13779	10124074	S1 Teknik Informatika	-	+6285723785340	2026-08-09 04:29:25.406	2026-09-08 04:29:25.406	\N	APPROVED	2026-08-09 04:29:25.408	2026-08-09 07:51:30.02	ba4a1b83-a0e9-40a2-8a19-9965908f5ce3	0.00	f
5f4023bf-02e9-4fc1-84c2-f1c9cbb2a285	ea0144cc-71d3-4b31-af85-3b266fb2136b	10524088	S1 Sistem Informasi	-	+6282247445835	2026-08-09 04:29:27.503	2026-09-08 04:29:27.503	\N	APPROVED	2026-08-09 04:29:27.504	2026-08-09 07:51:30.061	b5c8eaf3-bc56-4219-99cf-de2230e00e20	0.00	f
c569a061-64b2-4eee-b381-b9dbfef6e690	cd86aa1c-c0ec-4a83-8505-1ff0090b5204	10524103	S1 Sistem Informasi	-	+6285364067510	2026-08-09 04:29:27.719	2026-09-08 04:29:27.719	\N	APPROVED	2026-08-09 04:29:27.72	2026-08-09 07:51:30.081	b5c8eaf3-bc56-4219-99cf-de2230e00e20	0.00	f
d22a78d5-3127-4f55-84d4-8601d35510d3	ac6d104a-8cba-4e1b-be0d-cb6befbf6ec4	10524109	S1 Sistem Informasi	-	+6281312184479	2026-08-09 04:29:27.943	2026-09-08 04:29:27.943	\N	APPROVED	2026-08-09 04:29:27.944	2026-08-09 07:51:30.115	b5c8eaf3-bc56-4219-99cf-de2230e00e20	0.00	f
bd8ef75f-1905-4bc3-9665-255a10e98194	e2e1db56-ea52-4b26-9009-4c157be02955	44324042	S1 Hubungan Internasional	-	+6289610555335	2026-08-09 04:29:22.964	2026-09-08 04:29:22.964	\N	APPROVED	2026-08-09 04:29:22.965	2026-08-09 07:51:30.152	ba4a1b83-a0e9-40a2-8a19-9965908f5ce3	0.00	f
1b5ef530-8d11-4d2b-9c8a-a67cb137715d	98243d5e-f9bb-42e3-92a5-4f817ba4c6f5	41824073	S1 Ilmu Komunikasi	-	+62895377624090	2026-08-09 04:29:23.189	2026-09-08 04:29:23.189	\N	APPROVED	2026-08-09 04:29:23.19	2026-08-09 07:51:30.17	ba4a1b83-a0e9-40a2-8a19-9965908f5ce3	0.00	f
4fdb22fa-1f4d-4a7d-83ae-84a83898fc1e	2595afff-4baf-45de-9385-645db9e3f93b	41724004	S1 Ilmu Pemerintahan	-	+6282347758517	2026-08-09 04:29:23.408	2026-09-08 04:29:23.408	\N	APPROVED	2026-08-09 04:29:23.409	2026-08-09 07:51:30.191	ba4a1b83-a0e9-40a2-8a19-9965908f5ce3	0.00	f
068a39b6-e7cb-43e6-b3b3-6b5ce806be04	5a5f2b96-4ee1-4aa5-8b4c-c6848846001a	10524101	S1 Sistem Informasi	-	+6281285882506	2026-08-09 04:29:23.663	2026-09-08 04:29:23.663	\N	APPROVED	2026-08-09 04:29:23.664	2026-08-09 07:51:30.211	ba4a1b83-a0e9-40a2-8a19-9965908f5ce3	0.00	f
2e9f6de1-2d42-49e9-8eac-9b06d2bdd55e	d300db2f-951c-4591-9300-a97c89de5c00	63724010	Sastra Inggris	-	+6285723401744	2026-08-09 04:29:24.085	2026-09-08 04:29:24.085	\N	APPROVED	2026-08-09 04:29:24.085	2026-08-09 07:51:30.236	ba4a1b83-a0e9-40a2-8a19-9965908f5ce3	0.00	f
1bc9e508-3776-4b3a-ba90-c3b1bd26b375	7c1e02df-62c1-4419-8749-f3abcf2a484a	10124085	S1 Teknik Informatika	-	+6289662121307	2026-08-09 04:29:25.685	2026-09-08 04:29:25.685	\N	APPROVED	2026-08-09 04:29:25.686	2026-08-09 07:51:30.256	ba4a1b83-a0e9-40a2-8a19-9965908f5ce3	0.00	f
fc0d63e3-80f4-4168-af48-8f02b801329b	34a3f6d4-61ce-4237-aa2f-8357b420e5a6	10124098	S1 Teknik Informatika	-	+6285659876076	2026-08-09 04:29:26.125	2026-09-08 04:29:26.125	\N	APPROVED	2026-08-09 04:29:26.125	2026-08-09 07:51:30.28	ba4a1b83-a0e9-40a2-8a19-9965908f5ce3	0.00	f
7094e909-299f-4df0-8713-85d8b0b9f716	03e48c84-91b6-47c6-a1de-de1207c60c7f	10124112	S1 Teknik Informatika	-	+6285399897151	2026-08-09 04:29:26.343	2026-09-08 04:29:26.343	\N	APPROVED	2026-08-09 04:29:26.344	2026-08-09 07:51:30.299	ba4a1b83-a0e9-40a2-8a19-9965908f5ce3	0.00	f
7a624eba-d780-4b3d-9e1b-1aec0c97b992	ce00528a-0c30-473b-8252-06bb7bb96ccf	10420054	S1 Teknik Arsitektur	-	+6282120806607	2026-08-09 04:29:26.591	2026-09-08 04:29:26.591	\N	APPROVED	2026-08-09 04:29:26.592	2026-08-09 07:51:30.32	b5c8eaf3-bc56-4219-99cf-de2230e00e20	0.00	f
7526d775-6038-4aaf-9854-19e5b6bf7740	0f3472c3-ecbc-4968-ac94-717c6fd74b90	52023005	S1 Desain Interior	-	+6287819013182	2026-08-09 04:29:26.816	2026-09-08 04:29:26.816	\N	APPROVED	2026-08-09 04:29:26.817	2026-08-09 07:51:30.339	b5c8eaf3-bc56-4219-99cf-de2230e00e20	0.00	f
905bbf9c-c7b6-47e1-a9a8-139db8c23809	8d5b18a4-f55f-4634-8a97-06f067fe3702	44324038	S1 Hubungan Internasional	-	+62881023686354	2026-08-09 04:29:27.057	2026-09-08 04:29:27.057	\N	APPROVED	2026-08-09 04:29:27.058	2026-08-09 07:51:30.359	b5c8eaf3-bc56-4219-99cf-de2230e00e20	0.00	f
d666b919-23d5-4682-a036-0c753bca2c57	d37e1e12-cc71-49eb-b443-bc96877ba54b	41824063	S1 Ilmu Komunikasi	-	+6285624531503	2026-08-09 04:29:27.283	2026-09-08 04:29:27.283	\N	APPROVED	2026-08-09 04:29:27.284	2026-08-09 07:51:30.385	b5c8eaf3-bc56-4219-99cf-de2230e00e20	0.00	f
2cccb2f2-8577-45c7-a3a2-f5cf011fab03	d7eb2185-8eac-4f22-9fcc-301ef3e93dbe	13124022	S1 Teknik Elektro	-	+6285559116440	2026-08-09 04:29:28.609	2026-09-08 04:29:28.609	\N	APPROVED	2026-08-09 04:29:28.61	2026-08-09 07:51:30.403	b5c8eaf3-bc56-4219-99cf-de2230e00e20	0.00	f
d0e22f49-3f1a-4e5b-91d9-830cca255c8e	80423133-da4c-4344-9d84-b1780eda5245	13024010	S1 Teknik Sipil	-	+6281342797309	2026-08-09 04:29:28.858	2026-09-08 04:29:28.858	\N	APPROVED	2026-08-09 04:29:28.859	2026-08-09 07:51:30.438	b5c8eaf3-bc56-4219-99cf-de2230e00e20	0.00	f
bba6c5ed-6fd3-4d73-8b48-bd6ad28fd5a4	90529bc5-892d-42f9-a21d-eeee92d81af4	21224041	Manajemen S1	-	+6285759973751	2026-08-09 04:27:25.116	2026-09-08 04:27:25.116	11	APPROVED	2026-08-09 04:27:25.117	2026-08-09 07:51:15.833	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
842c99d5-73cc-4b2a-8da8-7c722f89c38b	8ee64765-5e45-46cd-a890-b238115ca710	21224024	Manajemen S1	-	+6283849025045	2026-08-09 04:27:29.117	2026-09-08 04:27:29.117	11	APPROVED	2026-08-09 04:27:29.118	2026-08-09 07:51:16.281	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
b4bf8169-eb90-48d9-b347-0e414582893f	9593bc17-89ac-4966-b93b-c590bd22b427	21224083	Manajemen S1	-	+6283895345440	2026-08-09 04:27:36.779	2026-09-08 04:27:36.779	\N	APPROVED	2026-08-09 04:27:36.78	2026-08-09 07:51:16.645	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
c095357c-ba1c-4564-98ca-9a938f5434f4	98cd0f03-5b93-4878-b94b-f9ee68f8ebf3	21224051	Manajemen S1	-	+62857975191	2026-08-09 04:27:42.777	2026-09-08 04:27:42.777	\N	APPROVED	2026-08-09 04:27:42.778	2026-08-09 07:51:16.996	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
05290ce8-f1fb-416d-a9cc-98cd5e587415	4ab19bc5-8659-4dbd-ab55-c673e955db4f	21224001	Manajemen S1	-	+62895617526772	2026-08-09 04:27:29.305	2026-09-08 04:27:29.305	11	APPROVED	2026-08-09 04:27:29.306	2026-08-09 07:51:17.219	0eb46cb1-b00b-4715-b8c8-5e3c874c9715	0.00	f
68aa0285-0c80-4c5e-a4b5-fb8ffa9e9714	51eddfb6-de2b-4bfb-90c3-d78b8b2f20d8	21224173	Manajemen S1	-	+6283890542228	2026-08-09 04:27:35.921	2026-09-08 04:27:35.921	\N	APPROVED	2026-08-09 04:27:35.922	2026-08-09 07:51:17.426	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
84696108-4db8-4845-ba32-c0c72861c7cf	7fb2039e-bb90-4d28-bbd2-aeb560e1f119	21224049	Manajemen S1	-	+6283851785523	2026-08-09 04:27:41.545	2026-09-08 04:27:41.545	\N	APPROVED	2026-08-09 04:27:41.546	2026-08-09 07:51:17.744	801f18bd-72d4-4303-a964-b9e5aae0fc82	0.00	f
8132522b-c27a-43e8-b3ed-935b5409e4cb	f8a503b3-4934-468d-ad0c-d815e47f49de	21224109	Manajemen S1	-	+6282116321702	2026-08-09 04:27:49.148	2026-09-08 04:27:49.148	\N	APPROVED	2026-08-09 04:27:49.149	2026-08-09 07:51:19.408	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
704dbf28-64b7-49c4-abae-bfc21e131213	0977cf86-5e43-4471-b920-ea34ace918fa	21222088	Manajemen S1	-	+6281547620005	2026-08-09 04:27:50.899	2026-09-08 04:27:50.899	\N	APPROVED	2026-08-09 04:27:50.9	2026-08-09 07:51:19.586	80d3e068-512d-40a4-9fc5-ed8b1d77d0fe	0.00	f
f2a8ae4c-16af-4309-8137-ae19c5ec89f3	06087251-d16e-4141-85be-60bb3e03dbfb	21224125	Manajemen S1	-	+62895338661228	2026-08-09 04:27:57.525	2026-09-08 04:27:57.525	10	APPROVED	2026-08-09 04:27:57.526	2026-08-09 07:51:20.043	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
950a08ae-0a53-4e9a-9e80-64fe2fb60296	f05d652d-7eb5-4073-a848-e05c58cea828	21224133	Manajemen S1	-	+6285864421367	2026-08-09 04:27:59.835	2026-09-08 04:27:59.835	10	APPROVED	2026-08-09 04:27:59.836	2026-08-09 07:51:20.227	a23595a6-a0c1-4988-a665-29b091cc9dbb	0.00	f
70e76b2d-f14a-4e7d-b0ff-79a663d2e774	1ed9e0b3-8956-4215-9856-97a361468d95	63824012	S1 Sastra Jepang	-	+6282130567689	2026-08-09 04:28:02.321	2026-09-08 04:28:02.321	47	APPROVED	2026-08-09 04:28:02.322	2026-08-09 07:51:20.525	cca8d808-a7d6-4218-8232-0138b2fef1a8	0.00	f
36d29f6c-aaf9-4411-ac7b-0792be3287c7	ae4eefff-8407-4e38-8d5d-97fff9709ebf	10123044	S1 Teknik Informatika	-	+6281770459643	2026-08-09 04:28:06.726	2026-09-08 04:28:06.726	\N	APPROVED	2026-08-09 04:28:06.727	2026-08-09 07:51:21.032	d744db10-4706-4687-9d0b-79bebcc5d99a	0.00	f
c55fe88d-61ae-4be2-bbee-ce893fcdc45d	c6b70e9f-b5e5-4e46-8a8a-d6ad1a0ef274	11024006	D3 Akuntansi (Komputerisasi Akuntansi)	-	+6283111296074	2026-08-09 04:28:07.537	2026-09-08 04:28:07.537	\N	APPROVED	2026-08-09 04:28:07.538	2026-08-09 07:51:21.076	487d33d3-3bbb-498d-b845-7825106beb28	0.00	f
0edfe19f-0c55-4605-a3ba-cf32eeda637c	eee0fb8e-f2fe-45ed-b48a-588e2a070976	10123373	S1 Teknik Informatika	-	+62895707867060	2026-08-09 04:28:19.11	2026-09-08 04:28:19.11	\N	APPROVED	2026-08-09 04:28:19.111	2026-08-09 07:51:21.595	bb4928cf-a3f7-41c3-a62d-03b62500a3de	0.00	f
a78720bf-9e1d-408f-bdba-e44135a290e3	e64f7b09-73ae-44d1-b70d-be93dd0cb80f	10123056	S1 Teknik Informatika	-	+6281221999138	2026-08-09 04:28:06.928	2026-09-08 04:28:06.928	\N	APPROVED	2026-08-09 04:28:06.928	2026-08-09 07:51:21.752	d744db10-4706-4687-9d0b-79bebcc5d99a	0.00	f
e90de525-912c-463c-838d-c202885e0c7c	c9d15e62-0eb7-4cfe-8933-6dc96d54dd37	10124114	S1 Teknik Informatika	-	+6289526490236	2026-08-09 04:28:13.735	2026-09-08 04:28:13.735	\N	APPROVED	2026-08-09 04:28:13.736	2026-08-09 07:51:22.108	5407a6a1-c436-4db8-9757-cec1426f5f4d	0.00	f
981307b0-ab6b-4100-ba3f-bb587008f51b	022a71c7-6f63-4766-acbf-df58dfffbc7b	63724014	Sastra Inggris	-	+6282127617060	2026-08-09 04:28:18.139	2026-09-08 04:28:18.139	\N	APPROVED	2026-08-09 04:28:18.14	2026-08-09 07:51:22.427	bb4928cf-a3f7-41c3-a62d-03b62500a3de	0.00	f
efad0298-1e1d-4992-bbd4-7d026b05c961	13c2e113-1475-4acd-87a3-32404a32e871	10123237	S1 Teknik Informatika	-	+6285797040347	2026-08-09 04:28:30.935	2026-09-08 04:28:30.935	36	APPROVED	2026-08-09 04:28:30.937	2026-08-09 07:51:22.973	cc5677e8-37b4-409d-9bca-2bb21a7fc0ce	0.00	f
1a03ad26-8852-4b31-a448-afd6885ee95f	7886e508-3b41-42ef-aee2-9b353c858978	10324009	S1 Teknik Industri	-	+6285775011750	2026-08-09 04:28:21.253	2026-09-08 04:28:21.253	\N	APPROVED	2026-08-09 04:28:21.254	2026-08-09 07:51:23.38	b1165842-ae6c-4a8e-b115-cb8f695aae84	0.00	f
102f14b4-c609-4090-9737-b0e66322edeb	1116d010-e3bd-444e-a015-384cd92adc96	10123133	S1 Teknik Informatika	-	+6281222191512	2026-08-09 04:28:30.761	2026-09-08 04:28:30.761	36	APPROVED	2026-08-09 04:28:30.762	2026-08-09 07:51:24.889	cc5677e8-37b4-409d-9bca-2bb21a7fc0ce	0.00	f
5546d671-b5e4-457c-ba6a-fd1899d5ee19	c40c04c8-6ac1-49bb-b73c-8e258f066ce3	10124045	S1 Teknik Informatika	-	+6281313043411	2026-08-09 04:28:31.729	2026-09-08 04:28:31.729	36	APPROVED	2026-08-09 04:28:31.73	2026-08-09 07:51:24.965	cc5677e8-37b4-409d-9bca-2bb21a7fc0ce	0.00	f
2b1c837b-f0ee-43d3-9995-f00880f521ba	57005bc7-8852-4cea-be11-2b75c41a549b	13024003	S1 Teknik Sipil	-	+6289517214700	2026-08-09 04:28:37.088	2026-09-08 04:28:37.088	\N	APPROVED	2026-08-09 04:28:37.089	2026-08-09 07:51:25.099	f1a25933-bf2b-4921-8b04-4f22ef233131	0.00	f
4236f525-c45b-471d-a912-a72bd1f8f6f0	c6a76d78-0723-4a5f-8318-db5ac22c3026	51923704	S1 Desain Komunikasi Visual	-	+6285359945775	2026-08-09 04:28:33.514	2026-09-08 04:28:33.514	\N	APPROVED	2026-08-09 04:28:33.515	2026-08-09 07:51:25.731	251534d8-fc11-4b89-8a17-cb510e4c6821	0.00	f
f8e83e38-792a-4391-80ea-6d9ad648dd43	0434c4f4-9261-44a4-9747-c811b9b17559	63824023	S1 Sastra Jepang	-	+6281224821553	2026-08-09 04:28:34.464	2026-09-08 04:28:34.464	\N	APPROVED	2026-08-09 04:28:34.465	2026-08-09 07:51:25.813	251534d8-fc11-4b89-8a17-cb510e4c6821	0.00	f
01401f1c-0bb1-4447-bdcd-383fd7f1eb2a	481efbed-6967-4747-a08e-46bb0a531736	10224005	S1 Sistem Komputer	-	+62858361129510	2026-08-09 04:29:28.384	2026-09-08 04:29:28.384	\N	APPROVED	2026-08-09 04:29:28.385	2026-08-09 07:51:30.476	b5c8eaf3-bc56-4219-99cf-de2230e00e20	0.00	f
5bc7cc56-f71b-4171-9e41-d07e8198f03e	29e753bd-945b-4b35-8cb5-abedcbb7fd75	10124067	S1 Teknik Informatika	-	+6288297202815	2026-08-09 04:29:29.09	2026-09-08 04:29:29.09	\N	APPROVED	2026-08-09 04:29:29.091	2026-08-09 07:51:30.506	b5c8eaf3-bc56-4219-99cf-de2230e00e20	0.00	f
3b8f51cb-e2fb-43c9-a954-314a61192562	6fca15ff-aa1d-40d4-87ce-92994bd2dc7e	10124077	S1 Teknik Informatika	-	+6285814411633	2026-08-09 04:29:29.31	2026-09-08 04:29:29.31	\N	APPROVED	2026-08-09 04:29:29.311	2026-08-09 07:51:30.527	b5c8eaf3-bc56-4219-99cf-de2230e00e20	0.00	f
d98636cc-76e6-462c-a87f-753e5362a53e	0cfd0eca-e840-4318-932e-2f5a2e3a9182	10124086	S1 Teknik Informatika	-	+6283168059329	2026-08-09 04:29:29.522	2026-09-08 04:29:29.522	\N	APPROVED	2026-08-09 04:29:29.523	2026-08-09 07:51:30.541	b5c8eaf3-bc56-4219-99cf-de2230e00e20	0.00	f
aa7fff42-852d-47a3-ae6e-d07a90295268	df7169ee-c895-482e-a3f9-ece6afeaf934	10124095	S1 Teknik Informatika	-	+6281320241715	2026-08-09 04:29:29.73	2026-09-08 04:29:29.73	\N	APPROVED	2026-08-09 04:29:29.731	2026-08-09 07:51:30.565	b5c8eaf3-bc56-4219-99cf-de2230e00e20	0.00	f
2ba401b0-6dda-4651-96a8-481a3d6c31c1	89fa09d9-da61-4db2-b378-3d7249d71d12	10124107	S1 Teknik Informatika	-	+6287744480152	2026-08-09 04:29:29.952	2026-09-08 04:29:29.952	\N	APPROVED	2026-08-09 04:29:29.953	2026-08-09 07:51:30.596	b5c8eaf3-bc56-4219-99cf-de2230e00e20	0.00	f
08622d18-85a6-41d5-9964-e183c1554d54	06523d6b-54bd-4301-ac53-d68d994487a1	10524114	S1 Sistem Informasi	-	+628217037621	2026-08-09 04:28:50.596	2026-09-08 04:28:50.596	\N	APPROVED	2026-08-09 04:28:50.597	2026-08-09 07:51:26.426	7891549c-76ec-48c2-af08-10c8d2a8e8c5	0.00	f
6d04934f-6a86-48f9-84c8-a8ae6acd83a6	590e7065-9b12-4174-ab7b-bcbd2cf286a3	10124119	S1 Teknik Informatika	-	+6289531515716	2026-08-09 04:28:49.216	2026-09-08 04:28:49.216	117	APPROVED	2026-08-09 04:28:49.217	2026-08-09 07:51:26.576	1d514151-d77c-4b8e-bf5c-67a8316bdb92	0.00	f
21e7fe63-d227-4aa4-8e95-9f72291e1f01	a4230a80-4540-4ff2-9199-8781290f634a	10124196	S1 Teknik Informatika	-	+6283126162164	2026-08-09 04:28:59.977	2026-09-08 04:28:59.977	111	APPROVED	2026-08-09 04:28:59.978	2026-08-09 07:51:27.748	dba5754c-2452-488a-9c9c-bd31d5de80c3	0.00	f
40585d80-5001-4097-8554-584c5c1cfcd3	0473aebd-f66a-437e-9d89-c485dd9b3809	10422005	S1 Teknik Arsitektur	-	+6285167799326	2026-08-09 04:29:07.386	2026-09-08 04:29:07.386	116	APPROVED	2026-08-09 04:29:07.387	2026-08-09 07:51:28.443	9cc60fce-4ca1-4c3e-a790-06d3b4beba12	0.00	f
3f731731-d78b-4fc3-baa7-b455d24e0563	a1ac132f-170d-447c-b09c-b1a37fc37bbf	63823023	S1 Sastra Jepang	-	+6281318416305	2026-08-09 04:29:28.162	2026-09-08 04:29:28.162	\N	APPROVED	2026-08-09 04:29:28.162	2026-08-09 07:51:30.458	b5c8eaf3-bc56-4219-99cf-de2230e00e20	0.00	f
d1e83b1a-de38-49b6-98d8-23c3e05ba1ce	9e4363d1-05b4-4739-87b3-eb25aeff736e	51924029	S1 Desain Komunikasi Visual	-	+6285183497702	2026-08-09 04:28:47.845	2026-09-08 04:28:47.845	117	APPROVED	2026-08-09 04:28:47.846	2026-08-09 07:51:26.458	1d514151-d77c-4b8e-bf5c-67a8316bdb92	0.00	f
5127eb18-65a3-4daa-8182-bd939a33ed4b	7069b59f-770c-4933-b22d-7a435760dcc1	10524127	S1 Sistem Informasi	-	+6285294845952	2026-08-09 04:29:07.979	2026-09-08 04:29:07.979	116	APPROVED	2026-08-09 04:29:07.98	2026-08-09 07:51:28.535	9cc60fce-4ca1-4c3e-a790-06d3b4beba12	0.00	f
4b393c59-e993-41c1-8077-a92d2e3a686b	6d89df81-ae57-4c09-b544-3d5c3dcf232c	10124469	S1 Teknik Informatika	-	+6282217849130	2026-08-09 04:29:09.654	2026-09-08 04:29:09.654	116	APPROVED	2026-08-09 04:29:09.655	2026-08-09 07:51:28.628	9cc60fce-4ca1-4c3e-a790-06d3b4beba12	0.00	f
35128574-c08f-4eb6-b76b-27f7383160f0	642a9704-997f-4877-867b-9049bf35863a	10224001	S1 Sistem Komputer	-	+6285189951001	2026-08-09 04:29:08.399	2026-09-08 04:29:08.399	116	APPROVED	2026-08-09 04:29:08.4	2026-08-09 07:51:29.347	9cc60fce-4ca1-4c3e-a790-06d3b4beba12	0.00	f
d51e21b3-d48e-4c3c-878b-f8b0a854fcdb	0afc8681-e459-471a-a521-81e3fdc93edd	10124206	S1 Teknik Informatika	-	+62881025320264	2026-08-09 04:29:09.023	2026-09-08 04:29:09.023	116	APPROVED	2026-08-09 04:29:09.024	2026-08-09 07:51:29.368	9cc60fce-4ca1-4c3e-a790-06d3b4beba12	0.00	f
81e000ee-abf1-4fda-9031-acade63c9e23	e94f5b28-8fd9-4864-bee3-c6e4a66d29bf	10124094	S1 Teknik Informatika	-	+6282115758800	2026-08-09 04:29:25.897	2026-09-08 04:29:25.897	\N	APPROVED	2026-08-09 04:29:25.898	2026-08-09 07:51:30.042	ba4a1b83-a0e9-40a2-8a19-9965908f5ce3	0.00	f
\.


--
-- Data for Name: notifikasi; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.notifikasi (id, id_pengguna, title, message, sudah_dibaca, dibuat_pada) FROM stdin;
3ac3b1f8-2d8e-4d6f-9895-622c0d8315ed	ff942b12-ffa4-4def-8b31-59c1e7768d93	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 06:00:00.137
c5ee8ff4-5ea5-4b37-9187-fac3191c3a16	19137ea5-3de7-4087-a14f-ff5e2121de3a	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 06:00:00.162
4835cb2e-5671-4c58-bc2a-cec3f603318d	09b1c954-ded5-44e4-9936-f5fb8a7ceb30	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 06:00:00.19
f21b56ec-5df3-4d8d-adf8-5f0de9e64719	03034143-3f39-4f15-85c8-c6068a3b61fc	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 06:00:00.208
fddbe122-ec54-4cd2-a26b-de5c75d6311f	7afced49-1972-4d1b-bf17-218b94a6640f	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 06:00:00.232
fa16288f-9316-4625-a595-e55aa2504fcd	be2e297e-2425-4aff-a038-9a8a3bd13fc7	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 06:00:00.251
a304b588-087c-436d-a558-aadbf6596a9e	11ee0bf0-059a-4ec1-a0c5-795b333b849c	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 06:00:00.271
5bb8f71e-fe68-44f8-8fa5-b27217f3b80f	d8444feb-ed90-4f49-97d1-89286dd09f72	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 06:00:00.292
73faf104-8540-4a03-b92f-f8c490b775cb	f1de46d1-2116-468c-90e8-da197d5722ee	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 06:00:00.314
6e92f1dc-f125-4c8e-a14a-ae52d0f3f58d	e144de11-8305-499a-9aa8-5e9841a07868	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 06:00:00.343
e5c06e42-26b0-4df6-bb0d-fd2b318164fa	66388f0a-c061-4b8b-9a1a-3cd836a0078c	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 06:00:00.385
d1013169-ee36-47ee-97c8-b7a434872dad	90cc8eba-a957-4a5b-a58a-7811de59f45d	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 06:00:00.403
5b7dd30f-d646-484e-842b-7e58960b57ad	17da275f-02b5-450c-9d84-f4bd845bc6c5	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 06:00:00.432
675bb75b-a24c-401c-99b3-986952d6db7c	183b288d-0384-458c-a45f-326be0ec1d59	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 06:00:00.451
82e9ea2f-b064-4a2d-a255-8c82ee62a10b	d30b32c2-0ea5-468c-93d0-e61a4fc60253	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 06:00:00.469
fad71f94-0607-4552-9557-d0b4e0e08f06	b6c11876-66f6-4d16-b17b-e6fc5f0d5aaa	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 06:00:00.488
57af4fcc-9361-41ff-86af-0ba9ee4e804c	e3802e31-c467-4e45-a1d0-7b247491eef7	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 06:00:00.51
17f141ec-4696-42ec-9c39-ba18b332a256	bc37fca4-855d-492e-8f0a-39698ba5bccf	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 06:00:00.535
3ec29b69-e1c3-439b-b50f-d9cfed32c4f3	ff942b12-ffa4-4def-8b31-59c1e7768d93	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 16:00:00.102
b0780438-f140-4f0c-a4ed-b717b89031b6	19137ea5-3de7-4087-a14f-ff5e2121de3a	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 16:00:00.133
ff42b0a3-e809-4ee8-afde-361fa4d6b4ee	09b1c954-ded5-44e4-9936-f5fb8a7ceb30	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 16:00:00.164
496e9f11-dec7-4349-83ef-5aad25528c16	03034143-3f39-4f15-85c8-c6068a3b61fc	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 16:00:00.196
834929e1-6822-4329-9c3e-a254d5422d81	7afced49-1972-4d1b-bf17-218b94a6640f	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 16:00:00.229
cbc8ec04-ded7-4bb8-ad3c-5a3281c26be7	be2e297e-2425-4aff-a038-9a8a3bd13fc7	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 16:00:00.251
58586155-06f2-40a7-b078-940b73cfe143	11ee0bf0-059a-4ec1-a0c5-795b333b849c	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 16:00:00.282
13d39e93-b244-4ad6-a220-b8db2910c57d	d8444feb-ed90-4f49-97d1-89286dd09f72	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 16:00:00.316
6f73c8ea-d206-4e03-b0af-791866225c0d	f1de46d1-2116-468c-90e8-da197d5722ee	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 16:00:00.359
fd45cc15-0abf-4950-b834-fd6e2df6d36f	e144de11-8305-499a-9aa8-5e9841a07868	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 16:00:00.398
fc905d06-8598-4ba1-8612-cab846f2097d	66388f0a-c061-4b8b-9a1a-3cd836a0078c	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 16:00:00.434
bc71a63a-d395-4288-84cd-53db854e7f42	90cc8eba-a957-4a5b-a58a-7811de59f45d	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 16:00:00.47
6aee6492-d01c-4ab3-9a2a-e70b84511068	17da275f-02b5-450c-9d84-f4bd845bc6c5	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 16:00:00.508
fa3673ea-93c3-4e5d-8925-76681db4910d	183b288d-0384-458c-a45f-326be0ec1d59	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 16:00:00.541
310b3d51-861f-4412-b71f-b1a29f265c53	d30b32c2-0ea5-468c-93d0-e61a4fc60253	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 16:00:00.573
7b3f85bc-13e7-4e31-be86-7eec60be6517	b6c11876-66f6-4d16-b17b-e6fc5f0d5aaa	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 16:00:00.606
b93c58a6-8dc8-4177-85b9-c9606dfc73ff	e3802e31-c467-4e45-a1d0-7b247491eef7	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 16:00:00.643
56fe5bde-5608-411a-b075-13790288853c	bc37fca4-855d-492e-8f0a-39698ba5bccf	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-09 16:00:00.673
42762c77-dda5-4856-9277-907677e95704	d9d2a059-8f73-42e7-9c63-b6724be70efa	Pengajuan Pengosongan Baru	Warga (WargaTester) mengajukan pengosongan tempat sampah ANORG00012026 di RW 01 (Dago).	f	2026-08-09 19:28:03.201
ca03d587-2817-4704-8cf1-768315055c9b	c2088ba1-0ba4-48fb-8b33-760892f72095	Pengajuan Pengosongan Baru	Warga (WargaTester) mengajukan pengosongan tempat sampah ANORG00012026 di RW 01 (Dago).	f	2026-08-09 19:28:03.238
3702c0f6-7a50-4abc-a3eb-aed782ff79b3	ff942b12-ffa4-4def-8b31-59c1e7768d93	Pengajuan Pengosongan Baru	Warga (WargaTester) mengajukan pengosongan tempat sampah ANORG00012026 di RW 01 (Dago).	f	2026-08-09 19:28:03.273
3ce641fd-6a99-4373-b4a6-42343c817dff	3751704c-c631-4217-920a-ccda56bae879	Pencatatan Berhasil	Sampah seberat 0.69 kg berhasil dicatat. Anda mendapatkan 102 poin!	t	2026-08-09 19:13:47.029
67c243d1-430b-4ee8-809d-24a8ad289ef5	3751704c-c631-4217-920a-ccda56bae879	Pencatatan Berhasil	Sampah seberat 0.35 kg berhasil dicatat. Anda mendapatkan 53 poin!	t	2026-08-09 19:14:39.974
9984798d-f565-46c2-8c29-9892fedc96ac	3751704c-c631-4217-920a-ccda56bae879	Pencatatan Berhasil	Sampah seberat 0.78 kg berhasil dicatat. Anda mendapatkan 107 poin!	t	2026-08-09 19:14:52.979
2cd84b6e-10a5-48d0-8ddf-e0a5def27a91	3751704c-c631-4217-920a-ccda56bae879	Pencatatan Berhasil	Sampah seberat 0.65 kg berhasil dicatat. Anda mendapatkan 85 poin!	t	2026-08-09 19:15:09.949
a097c716-f1d8-48a1-93e4-67c704d9b975	3751704c-c631-4217-920a-ccda56bae879	Pencatatan Berhasil	Sampah seberat 0.6 kg berhasil dicatat. Anda mendapatkan 83 poin!	t	2026-08-09 19:15:26.564
0a218150-f843-41c9-97d4-69afba968559	3751704c-c631-4217-920a-ccda56bae879	Pencatatan Berhasil	Sampah seberat 0.8 kg berhasil dicatat. Anda mendapatkan 119 poin!	t	2026-08-09 19:15:34.912
1eaa325d-223c-4b57-add3-4ea93d973cc1	3751704c-c631-4217-920a-ccda56bae879	Pencatatan Berhasil	Sampah seberat 0.79 kg berhasil dicatat. Anda mendapatkan 95 poin!	t	2026-08-09 19:16:04.989
00f9f388-f932-4263-bc2f-0c5758a05f3d	3751704c-c631-4217-920a-ccda56bae879	Pengajuan Pengosongan Dikirim	Pengajuan pengosongan tempat sampah ANORG00012026 berhasil dikirim ke petugas RT/RW.	t	2026-08-09 19:28:03.306
cfcd3074-b83c-453b-85d1-e64f61a97e72	3751704c-c631-4217-920a-ccda56bae879	Pengangkutan Sedang Berlangsung	Petugas sedang menuju lokasi Anda untuk mengosongkan tempat sampah ANORG00012026.	t	2026-08-09 19:33:06.959
452dc8a9-1f0a-435c-a420-f5dd11a9d432	3751704c-c631-4217-920a-ccda56bae879	Pengajuan Disetujui	Petugas telah memverifikasi foto bukti Anda dan mereset kapasitas tempat sampah ANORG00012026 menjadi 0%.	t	2026-08-09 19:33:34.816
6e68418a-b6c2-4c51-b99b-59ed82ef39f7	ff942b12-ffa4-4def-8b31-59c1e7768d93	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 06:00:00.118
8c41f99f-4b3e-40f8-8dd9-03575d0e38d0	19137ea5-3de7-4087-a14f-ff5e2121de3a	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 06:00:00.141
0e9b1a0a-fd85-4ce4-9519-8c234445edf4	09b1c954-ded5-44e4-9936-f5fb8a7ceb30	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 06:00:00.157
31eccd13-aad4-4942-b5a1-6fd23e0c5a32	03034143-3f39-4f15-85c8-c6068a3b61fc	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 06:00:00.189
838fb4b6-5862-4bc9-b04e-404e37cbeed4	7afced49-1972-4d1b-bf17-218b94a6640f	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 06:00:00.213
174ac62b-91cf-484e-a69e-a4298d608610	be2e297e-2425-4aff-a038-9a8a3bd13fc7	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 06:00:00.225
c8c4f61d-6f2c-431b-ac1d-36bc5c6c5b7d	11ee0bf0-059a-4ec1-a0c5-795b333b849c	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 06:00:00.24
e92c1c0d-882d-4feb-8a72-abdddf3e3d2b	d8444feb-ed90-4f49-97d1-89286dd09f72	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 06:00:00.257
0469d45f-2859-4856-b84b-3fce003e9511	f1de46d1-2116-468c-90e8-da197d5722ee	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 06:00:00.269
a55702ae-53dd-4791-a0fc-f9840768f68e	e144de11-8305-499a-9aa8-5e9841a07868	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 06:00:00.286
a104d384-aa3a-4b1f-8a20-ab34831c47e6	66388f0a-c061-4b8b-9a1a-3cd836a0078c	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 06:00:00.302
ee19842d-122f-4dd0-b91a-89c1f6173363	90cc8eba-a957-4a5b-a58a-7811de59f45d	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 06:00:00.318
e52cfcad-274d-4aa6-bc9a-7ac6b97d7116	17da275f-02b5-450c-9d84-f4bd845bc6c5	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 06:00:00.339
b625cd4a-7811-4eed-8ac7-a4ed06ec549d	183b288d-0384-458c-a45f-326be0ec1d59	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 06:00:00.371
c206524f-87a9-4a55-899e-c3250e6e99f2	d30b32c2-0ea5-468c-93d0-e61a4fc60253	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 06:00:00.39
ff61090f-9d7d-4769-b944-57511384341b	b6c11876-66f6-4d16-b17b-e6fc5f0d5aaa	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 06:00:00.404
cb05db39-0945-4697-934c-a55cdd8af0ce	e3802e31-c467-4e45-a1d0-7b247491eef7	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 06:00:00.433
1008bafa-b16d-4af9-beef-a0d5e856d1af	bc37fca4-855d-492e-8f0a-39698ba5bccf	Jadwal Jemput Pagi	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 06:00:00.455
16e2ad9c-e3d7-4896-b73b-56f0d20177cc	3751704c-c631-4217-920a-ccda56bae879	Jadwal Buang Sampah Terlewat (Pagi)	Anda tidak memindai sampah pada jadwal pagi (06:00-08:00). Poin Anda dikurangi -5.	f	2026-08-10 08:05:00.062
88afddc5-ca2a-4784-b3c4-c53edf903a7e	ff942b12-ffa4-4def-8b31-59c1e7768d93	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.135
127516e7-7335-494e-a8e3-dad3f50d2370	19137ea5-3de7-4087-a14f-ff5e2121de3a	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.159
d52c600a-1d9c-4016-9169-69c6f4f0560d	09b1c954-ded5-44e4-9936-f5fb8a7ceb30	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.179
e0a6c3d5-f256-4b55-95b9-51a0da80de6a	03034143-3f39-4f15-85c8-c6068a3b61fc	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.189
06e773fb-ce7c-4623-b557-9dec339f03f5	7afced49-1972-4d1b-bf17-218b94a6640f	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.203
6ba89241-1a52-418f-aa39-f1d255c3782e	be2e297e-2425-4aff-a038-9a8a3bd13fc7	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.225
9d4ffe5a-abbb-48cc-96ec-69edb75efa64	11ee0bf0-059a-4ec1-a0c5-795b333b849c	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.239
ad837a82-3683-4775-a058-815b9d905630	d8444feb-ed90-4f49-97d1-89286dd09f72	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.258
b7da38c8-d967-4ed3-8fc9-77ce17527aa5	f1de46d1-2116-468c-90e8-da197d5722ee	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.288
6c6e6665-f7f8-4032-83d6-b0838bbcc741	e144de11-8305-499a-9aa8-5e9841a07868	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.307
32fdd961-9bf4-441b-bb76-6ed8357be6eb	66388f0a-c061-4b8b-9a1a-3cd836a0078c	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.326
efe5c2a5-8ddb-4acd-a138-5c544244093b	90cc8eba-a957-4a5b-a58a-7811de59f45d	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.34
83f78c66-a2d2-4e91-b3c5-fa78e0e51187	17da275f-02b5-450c-9d84-f4bd845bc6c5	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.354
3e0f20f6-15c3-4550-8c31-995cff41c3ea	183b288d-0384-458c-a45f-326be0ec1d59	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.365
eae6a209-ceb0-4f08-a269-4bf9c78ee2f9	d30b32c2-0ea5-468c-93d0-e61a4fc60253	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.384
fa90badd-99f8-4f10-81a9-3894014e3d82	b6c11876-66f6-4d16-b17b-e6fc5f0d5aaa	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.398
c0f6c378-c4af-4705-ad22-0353c4246b3b	e3802e31-c467-4e45-a1d0-7b247491eef7	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.413
774ade71-e781-49cd-a64d-bbf009641bea	bc37fca4-855d-492e-8f0a-39698ba5bccf	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.427
200bfbd0-4046-46c3-98f9-ba8349054c3f	531fbe2d-0a91-4bcc-9b4f-de2997904c9c	Jadwal Jemput Sore	Terdapat 0 tempat sampah yang perlu diangkut.	f	2026-08-10 16:00:00.439
\.


--
-- Data for Name: pelanggaran; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.pelanggaran (id, id_pengguna, id_tempat_sampah, id_pengguna_petugas, type, severity, url_foto_bukti, notes, poin_dikurangi, dibuat_pada) FROM stdin;
\.


--
-- Data for Name: pemanfaatan_sampah; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.pemanfaatan_sampah (id, id_rw, nomor_cara_pemanfaatan, program, teknologi, bahan_baku, volume_bahan_baku, unit_bahan_baku, hasil, unit_hasil, foto_dokumentasi_url, tanggal_pencatatan, jenis_komoditas, luas_lahan_m2, volume_pupuk_dipakai_kg, bibit_telur_gram, hasil_kasgot_kg, volume_bioaktivator_liter, masa_fermentasi_hari, dibuat_pada) FROM stdin;
\.


--
-- Data for Name: pengajuan_aktivasi_tempat_sampah; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.pengajuan_aktivasi_tempat_sampah (id, id_tempat_sampah, id_pengguna, url_foto_bukti, status, id_pereview, dibuat_pada, diperbarui_pada) FROM stdin;
14bed9b2-e52e-44d0-90fb-47304b1eea63	db85f898-98fb-432b-89ab-4e75a2d667aa	3751704c-c631-4217-920a-ccda56bae879	http://trashcare.id/uploads/1786303683080-19bf2e8a-e5c3-4645-968f-948858ba80c1.jpg	COMPLETED	cbc24ca2-1db8-4569-981e-445c081dc38b	2026-08-09 19:28:03.096	2026-08-09 19:33:34.775
8005d324-cf66-4d37-944e-82bcd70739a8	f5d26c6e-c047-4e16-9445-217b4cc1cd06	3751704c-c631-4217-920a-ccda56bae879	reactivated_by_admin	APPROVED	cbc24ca2-1db8-4569-981e-445c081dc38b	2026-08-10 09:18:57.866	2026-08-10 09:18:57.866
\.


--
-- Data for Name: pengajuan_izin_mahasiswa; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.pengajuan_izin_mahasiswa (id, id_mahasiswa, tipe, alasan, url_bukti, tanggal_mulai, tanggal_selesai, status, id_pereview, direview_pada, alasan_penolakan, dibuat_pada, diperbarui_pada) FROM stdin;
\.


--
-- Data for Name: pengguna; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.pengguna (id, nama, kata_sandi, token_fcm, id_peran, dibuat_pada, diperbarui_pada, foto_profil, id_rw, id_rt, status, alamat, no_telepon, harus_ganti_password, subtipe_warga) FROM stdin;
92681fad-31b8-4c76-9806-6c69057eb0ae	Drs. H. Ahmad Sudrajat, M.Si (Camat Coblong)	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	3	2026-08-08 16:56:58.699	2026-08-08 16:56:58.699	\N	\N	\N	Aktif	Kantor Kecamatan Coblong, Jl. Ir. H. Juanda No. 154, Bandung	+6281200000001	f	\N
eb4e5567-55d1-4a1a-af74-c2163a6047cd	Ir. Bambang Triyono (Admin DLH Kota Bandung)	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	2	2026-08-08 16:56:58.745	2026-08-08 16:56:58.745	\N	\N	\N	Aktif	Dinas Lingkungan Hidup Kota Bandung, Jl. Sadang Serang	+6281200000002	f	\N
e54f5290-434a-4f0a-b6fd-0a57f23adf8d	Lurah Dago (Bpk. M. Ridwan)	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	4	2026-08-08 16:56:58.875	2026-08-08 16:56:58.875	\N	\N	\N	Aktif	Kantor Kelurahan Dago, Coblong	+6281200991001	f	\N
d9d2a059-8f73-42e7-9c63-b6724be70efa	Bpk. Budi Santoso	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	5	2026-08-08 16:56:59.118	2026-08-08 16:56:59.118	\N	1	\N	Aktif	Jl. Wilayah RW 01, Kel. Dago, Coblong	+628129991002	f	\N
c2088ba1-0ba4-48fb-8b33-760892f72095	Bpk. Bambang Pamungkas	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	6	2026-08-08 16:56:59.182	2026-08-08 16:56:59.182	\N	1	\N	Aktif	RT 01 / RW 01, Kel. Dago, Coblong	+628129991003	f	\N
ff942b12-ffa4-4def-8b31-59c1e7768d93	Petugas Residu RW 01 Dago	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	10	2026-08-08 16:56:59.234	2026-08-08 16:56:59.234	\N	1	\N	Aktif	Pos Residu RW 01, Kel. Dago, Coblong	+628129991004	f	\N
74d7412e-58aa-48df-ab92-3e39b0b90ff0	Bpk. Cecep Hidayat	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	5	2026-08-08 16:56:59.364	2026-08-08 16:56:59.364	\N	2	\N	Aktif	Jl. Wilayah RW 02, Kel. Dago, Coblong	+628129991005	f	\N
5d4d50fe-4950-49e0-bfbc-ac436c648bff	Bpk. Caca Handika	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	6	2026-08-08 16:56:59.41	2026-08-08 16:56:59.41	\N	2	\N	Aktif	RT 01 / RW 02, Kel. Dago, Coblong	+628129991006	f	\N
19137ea5-3de7-4087-a14f-ff5e2121de3a	Petugas Residu RW 02 Dago	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	10	2026-08-08 16:56:59.452	2026-08-08 16:56:59.452	\N	2	\N	Aktif	Pos Residu RW 02, Kel. Dago, Coblong	+628129991007	f	\N
e12b3b2c-1910-4600-a72e-2d2f3a448eee	Bpk. Dadang Suherman	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	5	2026-08-08 16:56:59.559	2026-08-08 16:56:59.559	\N	3	\N	Aktif	Jl. Wilayah RW 03, Kel. Dago, Coblong	+628129991008	f	\N
f8736b24-6724-4f61-8ffe-c64821c8f757	Bpk. Dedi Mulyadi	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	6	2026-08-08 16:56:59.593	2026-08-08 16:56:59.593	\N	3	\N	Aktif	RT 01 / RW 03, Kel. Dago, Coblong	+628129991009	f	\N
09b1c954-ded5-44e4-9936-f5fb8a7ceb30	Petugas Residu RW 03 Dago	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	10	2026-08-08 16:56:59.646	2026-08-08 16:56:59.646	\N	3	\N	Aktif	Pos Residu RW 03, Kel. Dago, Coblong	+628129991010	f	\N
fb1ec065-b803-4f90-bd44-9063c1fe1de2	Lurah Sadang Serang (Bpk. M. Ridwan)	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	4	2026-08-08 16:57:00.138	2026-08-08 16:57:00.138	\N	\N	\N	Aktif	Kantor Kelurahan Sadang Serang, Coblong	+6281200991011	f	\N
4e65c772-44fe-4a14-9ed9-c791086c1b76	Bpk. Oman Sukmana	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	5	2026-08-08 16:57:00.229	2026-08-08 16:57:00.229	\N	14	\N	Aktif	Jl. Wilayah RW 01, Kel. Sadang Serang, Coblong	+628129991012	f	\N
28b83ad0-1c91-4135-ad6d-273b06211561	Bpk. Otong Lalo	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	6	2026-08-08 16:57:00.263	2026-08-08 16:57:00.263	\N	14	\N	Aktif	RT 01 / RW 01, Kel. Sadang Serang, Coblong	+628129991013	f	\N
03034143-3f39-4f15-85c8-c6068a3b61fc	Petugas Residu RW 01 Sadang Serang	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	10	2026-08-08 16:57:00.298	2026-08-08 16:57:00.298	\N	14	\N	Aktif	Pos Residu RW 01, Kel. Sadang Serang, Coblong	+628129991014	f	\N
8815a1d3-5408-464e-9fdc-fd540c980b8c	Bpk. Popon Sutarman	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	5	2026-08-08 16:57:00.823	2026-08-08 16:57:00.823	\N	15	\N	Aktif	Jl. Wilayah RW 02, Kel. Sadang Serang, Coblong	+628129991015	f	\N
39f7b5b8-6d90-4767-8615-5ebc9d840b93	Bpk. Pamungkas	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	6	2026-08-08 16:57:00.86	2026-08-08 16:57:00.86	\N	15	\N	Aktif	RT 01 / RW 02, Kel. Sadang Serang, Coblong	+628129991016	f	\N
7afced49-1972-4d1b-bf17-218b94a6640f	Petugas Residu RW 02 Sadang Serang	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	10	2026-08-08 16:57:00.903	2026-08-08 16:57:00.903	\N	15	\N	Aktif	Pos Residu RW 02, Kel. Sadang Serang, Coblong	+628129991017	f	\N
4ac17b66-23c5-47b5-932b-b7ca04ed21bc	Bpk. Rahmat Hidayat	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	5	2026-08-08 16:57:01.017	2026-08-08 16:57:01.017	\N	16	\N	Aktif	Jl. Wilayah RW 03, Kel. Sadang Serang, Coblong	+628129991018	f	\N
f34a9ba0-47c9-4e1a-b578-c235104b4e94	Bpk. Ridwan Kamil	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	6	2026-08-08 16:57:01.057	2026-08-08 16:57:01.057	\N	16	\N	Aktif	RT 01 / RW 03, Kel. Sadang Serang, Coblong	+628129991019	f	\N
be2e297e-2425-4aff-a038-9a8a3bd13fc7	Petugas Residu RW 03 Sadang Serang	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	10	2026-08-08 16:57:01.097	2026-08-08 16:57:01.097	\N	16	\N	Aktif	Pos Residu RW 03, Kel. Sadang Serang, Coblong	+628129991020	f	\N
17b7fdea-a70f-40b6-90d8-7e8a2d31e586	Lurah Sekeloa (Bpk. M. Ridwan)	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	4	2026-08-08 16:57:01.556	2026-08-08 16:57:01.556	\N	\N	\N	Aktif	Kantor Kelurahan Sekeloa, Coblong	+6281200991021	f	\N
f495c997-a82f-4223-b0cc-0926bbbbc8ea	Bpk. Asep Hendra	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	5	2026-08-08 16:57:01.705	2026-08-08 16:57:01.705	\N	23	\N	Aktif	Jl. Wilayah RW 01, Kel. Sekeloa, Coblong	+628129991022	f	\N
90b73e18-a2d6-4f80-883d-964982b5dbe8	Bpk. Agum Gumelar	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	6	2026-08-08 16:57:01.741	2026-08-08 16:57:01.741	\N	23	\N	Aktif	RT 01 / RW 01, Kel. Sekeloa, Coblong	+628129991023	f	\N
11ee0bf0-059a-4ec1-a0c5-795b333b849c	Petugas Residu RW 01 Sekeloa	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	10	2026-08-08 16:57:02.557	2026-08-08 16:57:02.557	\N	23	\N	Aktif	Pos Residu RW 01, Kel. Sekeloa, Coblong	+628129991024	f	\N
e9854762-800a-41a0-ad7e-a6f2c1de2317	Bpk. Budi Santoso	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	5	2026-08-08 16:57:02.688	2026-08-08 16:57:02.688	\N	24	\N	Aktif	Jl. Wilayah RW 02, Kel. Sekeloa, Coblong	+628129991025	f	\N
050f8b1b-b66c-421d-8e98-dfbd912d1129	Bpk. Bambang Pamungkas	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	6	2026-08-08 16:57:02.752	2026-08-08 16:57:02.752	\N	24	\N	Aktif	RT 01 / RW 02, Kel. Sekeloa, Coblong	+628129991026	f	\N
d8444feb-ed90-4f49-97d1-89286dd09f72	Petugas Residu RW 02 Sekeloa	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	10	2026-08-08 16:57:02.803	2026-08-08 16:57:02.803	\N	24	\N	Aktif	Pos Residu RW 02, Kel. Sekeloa, Coblong	+628129991027	f	\N
2cee18bc-8366-41fc-9e1c-2b08187a8f99	Bpk. Cecep Hidayat	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	5	2026-08-08 16:57:03.043	2026-08-08 16:57:03.043	\N	25	\N	Aktif	Jl. Wilayah RW 03, Kel. Sekeloa, Coblong	+628129991028	f	\N
ce6dc432-b2c1-4edd-a90c-b9a161bb06db	Bpk. Caca Handika	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	6	2026-08-08 16:57:03.088	2026-08-08 16:57:03.088	\N	25	\N	Aktif	RT 01 / RW 03, Kel. Sekeloa, Coblong	+628129991029	f	\N
f1de46d1-2116-468c-90e8-da197d5722ee	Petugas Residu RW 03 Sekeloa	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	10	2026-08-08 16:57:03.134	2026-08-08 16:57:03.134	\N	25	\N	Aktif	Pos Residu RW 03, Kel. Sekeloa, Coblong	+628129991030	f	\N
4e27b290-66b5-4b13-b9d9-e9dc4d30bb6b	Lurah Lebak Gede (Bpk. M. Ridwan)	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	4	2026-08-08 16:57:04.3	2026-08-08 16:57:04.3	\N	\N	\N	Aktif	Kantor Kelurahan Lebak Gede, Coblong	+6281200991031	f	\N
183f4a14-2497-4604-a53d-9855b605a6cc	Bpk. Popon Sutarman	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	5	2026-08-08 16:57:04.384	2026-08-08 16:57:04.384	\N	38	\N	Aktif	Jl. Wilayah RW 01, Kel. Lebak Gede, Coblong	+628129991032	f	\N
df0e087a-8f4c-4bbf-a9d8-3fec2054187a	Bpk. Pamungkas	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	6	2026-08-08 16:57:04.417	2026-08-08 16:57:04.417	\N	38	\N	Aktif	RT 01 / RW 01, Kel. Lebak Gede, Coblong	+628129991033	f	\N
e144de11-8305-499a-9aa8-5e9841a07868	Petugas Residu RW 01 Lebak Gede	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	10	2026-08-08 16:57:04.463	2026-08-08 16:57:04.463	\N	38	\N	Aktif	Pos Residu RW 01, Kel. Lebak Gede, Coblong	+628129991034	f	\N
927aba2e-92d1-420f-83e2-e861c6a5b032	Bpk. Rahmat Hidayat	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	5	2026-08-08 16:57:04.607	2026-08-08 16:57:04.607	\N	39	\N	Aktif	Jl. Wilayah RW 02, Kel. Lebak Gede, Coblong	+628129991035	f	\N
fff16779-2ed6-4ea9-a623-ef1533aeefb6	Bpk. Ridwan Kamil	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	6	2026-08-08 16:57:04.648	2026-08-08 16:57:04.648	\N	39	\N	Aktif	RT 01 / RW 02, Kel. Lebak Gede, Coblong	+628129991036	f	\N
a93c3d9b-efc6-4cf8-857f-1f2e49efe99d	Bpk. Suryana	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	5	2026-08-08 16:57:04.832	2026-08-08 16:57:04.832	\N	40	\N	Aktif	Jl. Wilayah RW 03, Kel. Lebak Gede, Coblong	+628129991038	f	\N
66388f0a-c061-4b8b-9a1a-3cd836a0078c	Petugas Residu RW 03 Lebak Gede	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	10	2026-08-08 16:57:04.902	2026-08-08 16:57:04.902	\N	40	\N	Aktif	Pos Residu RW 03, Kel. Lebak Gede, Coblong	+628129991040	f	\N
2a9e5408-bc45-45f2-a842-781ba857f5df	Bpk. Hendra Setiawan	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	5	2026-08-08 16:57:05.881	2026-08-08 16:57:05.881	\N	53	\N	Aktif	Jl. Wilayah RW 03, Kel. Lebak Siliwangi, Coblong	+628129991048	f	\N
dfd4db26-b251-4d62-a60d-3ebc94573a5f	Bpk. Haji Oding	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	6	2026-08-08 16:57:05.908	2026-08-08 16:57:05.908	\N	53	\N	Aktif	RT 01 / RW 03, Kel. Lebak Siliwangi, Coblong	+628129991049	f	\N
90cc8eba-a957-4a5b-a58a-7811de59f45d	Petugas Residu RW 03 Lebak Siliwangi	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	10	2026-08-08 16:57:05.94	2026-08-08 16:57:05.94	\N	53	\N	Aktif	Pos Residu RW 03, Kel. Lebak Siliwangi, Coblong	+628129991050	f	\N
3bfb8ca0-2f3c-4b64-a6f0-5e943fe051c0	Lurah Cipaganti (Bpk. M. Ridwan)	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	4	2026-08-08 16:57:06.244	2026-08-08 16:57:06.244	\N	\N	\N	Aktif	Kantor Kelurahan Cipaganti, Coblong	+6281200991051	f	\N
6abae50b-0a35-4b72-9bd5-edce03fa967e	Bpk. Maman Abdurrahman	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	5	2026-08-08 16:57:06.331	2026-08-08 16:57:06.331	\N	58	\N	Aktif	Jl. Wilayah RW 01, Kel. Cipaganti, Coblong	+628129991052	f	\N
3a2d7e6f-bb51-4fb0-abd0-304293df0ee8	Bpk. Mulyadi	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	6	2026-08-08 16:57:06.366	2026-08-08 16:57:06.366	\N	58	\N	Aktif	RT 01 / RW 01, Kel. Cipaganti, Coblong	+628129991053	f	\N
17da275f-02b5-450c-9d84-f4bd845bc6c5	Petugas Residu RW 01 Cipaganti	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	10	2026-08-08 16:57:06.395	2026-08-08 16:57:06.395	\N	58	\N	Aktif	Pos Residu RW 01, Kel. Cipaganti, Coblong	+628129991054	f	\N
eebfbdae-d2cc-4e0c-852e-ec95ce0440a4	Bpk. Nana Sumarna	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	5	2026-08-08 16:57:06.491	2026-08-08 16:57:06.491	\N	59	\N	Aktif	Jl. Wilayah RW 02, Kel. Cipaganti, Coblong	+628129991055	f	\N
69de6956-0f75-4eff-a2ea-a7928ed4607b	Bpk. Nuryadi	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	6	2026-08-08 16:57:06.519	2026-08-08 16:57:06.519	\N	59	\N	Aktif	RT 01 / RW 02, Kel. Cipaganti, Coblong	+628129991056	f	\N
183b288d-0384-458c-a45f-326be0ec1d59	Petugas Residu RW 02 Lebak Gede	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	10	2026-08-08 16:57:04.691	2026-08-08 16:57:04.691	\N	39	\N	Aktif	Pos Residu RW 02, Kel. Lebak Gede, Coblong	+628129991037	f	\N
6f0a3ea6-1bf8-433d-af94-f8d31834fe54	Bpk. Syafruddin	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	6	2026-08-08 16:57:04.867	2026-08-08 16:57:04.867	\N	40	\N	Aktif	RT 01 / RW 03, Kel. Lebak Gede, Coblong	+628129991039	f	\N
517d95b1-18dc-46e2-95f4-e8af3bbd6805	Lurah Lebak Siliwangi (Bpk. M. Ridwan)	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	4	2026-08-08 16:57:05.399	2026-08-08 16:57:05.399	\N	\N	\N	Aktif	Kantor Kelurahan Lebak Siliwangi, Coblong	+6281200991041	f	\N
62eb79c4-1b37-4dd1-ba23-a9a37693ff4a	Bpk. Firman Utina	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	5	2026-08-08 16:57:05.482	2026-08-08 16:57:05.482	\N	51	\N	Aktif	Jl. Wilayah RW 01, Kel. Lebak Siliwangi, Coblong	+628129991042	f	\N
35f13df8-f874-4cb3-8944-6d9b4da49e25	Bpk. Farid Husain	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	6	2026-08-08 16:57:05.523	2026-08-08 16:57:05.523	\N	51	\N	Aktif	RT 01 / RW 01, Kel. Lebak Siliwangi, Coblong	+628129991043	f	\N
d30b32c2-0ea5-468c-93d0-e61a4fc60253	Petugas Residu RW 01 Lebak Siliwangi	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	10	2026-08-08 16:57:05.55	2026-08-08 16:57:05.55	\N	51	\N	Aktif	Pos Residu RW 01, Kel. Lebak Siliwangi, Coblong	+628129991044	f	\N
4dc7c3fa-5f63-47bb-80f1-08c13c3f98ae	Bpk. Gunawan Hidayat	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	5	2026-08-08 16:57:05.706	2026-08-08 16:57:05.706	\N	52	\N	Aktif	Jl. Wilayah RW 02, Kel. Lebak Siliwangi, Coblong	+628129991045	f	\N
97b6dc94-8aa7-41be-a114-79f19b5a5233	Bpk. Ganjar Pranowo	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	6	2026-08-08 16:57:05.737	2026-08-08 16:57:05.737	\N	52	\N	Aktif	RT 01 / RW 02, Kel. Lebak Siliwangi, Coblong	+628129991046	f	\N
b6c11876-66f6-4d16-b17b-e6fc5f0d5aaa	Petugas Residu RW 02 Lebak Siliwangi	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	10	2026-08-08 16:57:05.776	2026-08-08 16:57:05.776	\N	52	\N	Aktif	Pos Residu RW 02, Kel. Lebak Siliwangi, Coblong	+628129991047	f	\N
e3802e31-c467-4e45-a1d0-7b247491eef7	Petugas Residu RW 02 Cipaganti	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	10	2026-08-08 16:57:06.55	2026-08-08 16:57:06.55	\N	59	\N	Aktif	Pos Residu RW 02, Kel. Cipaganti, Coblong	+628129991057	f	\N
73b55851-db59-4007-9724-e810a6a11c3c	Bpk. Oman Sukmana	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	5	2026-08-08 16:57:06.657	2026-08-08 16:57:06.657	\N	60	\N	Aktif	Jl. Wilayah RW 03, Kel. Cipaganti, Coblong	+628129991058	f	\N
b04b6cde-2c98-4f66-9191-175f5982336e	Bpk. Otong Lalo	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	6	2026-08-08 16:57:06.694	2026-08-08 16:57:06.694	\N	60	\N	Aktif	RT 01 / RW 03, Kel. Cipaganti, Coblong	+628129991059	f	\N
bc37fca4-855d-492e-8f0a-39698ba5bccf	Petugas Residu RW 03 Cipaganti	$2a$10$H25MQKhY2I.feoPYGp7d/OjuJ2r1eZbpLu9mf4dTdozbU2KLWl6SS	\N	10	2026-08-08 16:57:06.728	2026-08-08 16:57:06.728	\N	60	\N	Aktif	Pos Residu RW 03, Kel. Cipaganti, Coblong	+628129991060	f	\N
83bf2c8c-0982-4a51-9044-4abebb0abc61	Prof. Dr. Hj. Umi Narimawati, .Dra.,S.E., M.Si.,M.Pd.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:12.098	2026-08-08 16:57:12.098	\N	\N	\N	Aktif	S1 Manajemen	4127.34.02.015	f	\N
0cebb027-7e76-46ea-a9fa-f5329a211a84	Dr. Linna Ismawati, S.E., M.Si.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:12.391	2026-08-08 16:57:12.391	\N	\N	\N	Aktif	S1 Manajemen	4127.34.02.008	f	\N
61054176-d0e1-44be-a33b-1e724aab8eff	Adam Mukharil Bachtiar, S.Kom., M.T., Ph.D	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:12.443	2026-08-08 16:57:12.443	\N	\N	\N	Aktif	S1 Teknik Informatika	4127.70.06.024	f	\N
82979f6f-ace2-4254-b316-f64511c44d29	Hanhan Maulana, M.Kom., Ph.D.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:12.493	2026-08-08 16:57:12.493	\N	\N	\N	Aktif	S1 Teknik Informatika	4127.70.06.134	f	\N
e6101c87-ec31-4417-8871-84d8ad015353	Alif Finandhita, S.Kom., M.T.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:12.537	2026-08-08 16:57:12.537	\N	\N	\N	Aktif	S1 Teknik Informatika	4127.70.06.025	f	\N
10eb9de9-84ce-4cb2-927f-c8d1b47c175e	Richi Dwi Agustia, S.Kom., M.Kom.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:12.588	2026-08-08 16:57:12.588	\N	\N	\N	Aktif	S1 Teknik Informatika	4127.70.06.132	f	\N
f050198c-94ed-41f1-b307-acf6bf10e790	Assoc. Prof. Dr. Wartika S.Kom., MT.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:12.646	2026-08-08 16:57:12.646	\N	\N	\N	Aktif	S1 Sistem Informasi	4127.70.26.002	f	\N
74e8f605-b1c2-44e9-bf46-e3c718eb1cf3	Rangga Sidik, S.Kom., M.Kom., M.Eng.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:12.691	2026-08-08 16:57:12.691	\N	\N	\N	Aktif	S1 Sistem Informasi	4127.70.26.113	f	\N
841b6f5f-96db-4acb-9f03-5948eaf6e602	Dr. Wendi Zarman, M.Si	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:12.742	2026-08-08 16:57:12.742	\N	\N	\N	Aktif	S1 Sistem Komputer	4127.70.05.010	f	\N
8f19fdca-9ed8-4c6f-9ac1-a94cba5039c9	Iyan Andriana, S.T., M.T.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:12.788	2026-08-08 16:57:12.788	\N	\N	\N	Aktif	S1 Teknik Industri	4127.70.03.009	f	\N
bdbd9144-7ea6-4549-8afe-c491f2b46e5b	Amilia Widya, S.Pd., M.T.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:12.84	2026-08-08 16:57:12.84	\N	\N	\N	Aktif	S1 Teknik Perencanaan Wilayah dan Kota	4127.70.17.015	f	\N
adc9be9e-e66d-44f1-a650-fc1bdf5589a3	Ayub Subandi, S.Si., M.T., Ph.D.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:12.901	2026-08-08 16:57:12.901	\N	\N	\N	Aktif	S1 Teknik Elektro	4127.70.05.030	f	\N
9cd56f9f-4a97-476d-896f-7a41f5949a27	Dr. Eng. Siswanti Zuraida, S.Pd., M.T.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:12.967	2026-08-08 16:57:12.967	\N	\N	\N	Aktif	S1 Teknik Arsitektur	4127.88.80.717	f	\N
9ba241a3-0dcd-44c0-bbb7-c63f07b33e50	Muhammad Aksan Ipaenin, S.T., M.Sc.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:13.024	2026-08-08 16:57:13.024	\N	\N	\N	Aktif	S1 Teknik Sipil	4127.99.90.268	f	\N
b2416008-71f5-4f54-88fc-a5fa19a9bb67	Hery Dwi Yulianto, S.T., M.Kom.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:13.072	2026-08-08 16:57:13.072	\N	\N	\N	Aktif	D3 Komputerisasi Akuntansi	4127.70.67.004	f	\N
123a7397-c0c5-461b-8e98-e427f4303fa9	Myrna Dwi Rahmatya, S.Kom., M.Kom.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:13.13	2026-08-08 16:57:13.13	\N	\N	\N	Aktif	D3 Manajemen Informatika	4127.70.26.111	f	\N
6d5efd45-719e-4a63-ac69-5e70fc4fc23b	John Adler, S.Si., M.Si.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:13.161	2026-08-08 16:57:13.161	\N	\N	\N	Aktif	D3 Teknik Komputer	4127.70.05.007	f	\N
0d56ca89-d13a-42e4-81a9-1d9af8e98b6b	Dr. Agus Mulyana, S.Kom.,M.T.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:13.202	2026-08-08 16:57:13.202	\N	\N	\N	Aktif	D3 Teknik Komputer	4127.70.05.017	f	\N
b4e3d113-63cd-470a-aeea-1fe9e371244e	Dr. H. Tatang Supriyadi, S.E., M.M.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:13.375	2026-08-08 16:57:13.375	\N	\N	\N	Aktif	D3 Manajemen Pemasaran	4127.34.02.075	f	\N
00502ca2-71f5-41ad-a7d7-ad32ff695970	Dr. Tatik Fidowaty, S.IP., M.Si.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:13.78	2026-08-08 16:57:13.78	\N	\N	\N	Aktif	S1 Ilmu Pemerintahan	4127.35.31.009	f	\N
802e4b3e-e560-496b-9f21-8fdda755f67a	Assoc. Prof. Dr. Sri Dewi Anggadini, S.E., M.Si., Ak., CA.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:13.242	2026-08-08 16:57:13.242	\N	\N	\N	Aktif	S1 Akuntansi	4127.34.03.003	f	\N
fb2e8f0f-6eae-4455-9369-23d2d7a4cb86	Prof. Dr. Raeni Dwi Santy, S.E., M.Si., CIMA, CDMP.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:12.335	2026-08-08 16:57:13.294	\N	\N	\N	Aktif	S1 Manajemen	4127.34.02.006.2	f	\N
aa30fe7d-e4b3-45dc-b6b2-e74c4679c5fb	Dr. Henike Primawati, S.IP., M.I.Pol.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:13.572	2026-08-08 16:57:13.572	\N	\N	\N	Aktif	S1 Hubungan Internasional	4127.35.32.011	f	\N
d9eac2ce-1c60-4c3c-a92a-f7afc771acbf	Assoc. Prof., Dr. Manap Solihat, Drs., M.Si.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:12.214	2026-08-08 16:57:13.681	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	4127.35.30.007	f	\N
bb9d7c0c-5507-4f33-9ee5-656d86514523	Dr. Olih Solihin, S.Sos., M.I.Kom.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:13.735	2026-08-08 16:57:13.735	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	4127.35.30.016	f	\N
5841a306-1a5c-4b71-a554-e78567de1775	Dr. Nungki Heriyati, M.A.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:14.077	2026-08-08 16:57:14.077	\N	\N	\N	Aktif	S1 Sastra Inggris	4127.20.03.020	f	\N
eeea02ec-cfd4-4ce2-b3b3-610415828e77	Wahyudi, S.H., M.H.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:13.821	2026-08-08 16:57:13.821	\N	\N	\N	Aktif	S1 Ilmu Hukum	4127.33.00.019	f	\N
60d3aa8a-993e-4678-83e5-0630b4ec2b90	Arif Try Cahyadi, S.Ds., M.Ds.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:13.851	2026-08-08 16:57:13.851	\N	\N	\N	Aktif	S1 Desain Komunikasi Visual	4127.32.06.087	f	\N
61a0d2fd-93db-41e1-9deb-73be9e7f5bd4	Cherry Dharmawan, S.Sn., M.Sn.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:13.886	2026-08-08 16:57:13.886	\N	\N	\N	Aktif	S1 Desain Interior	4127.32.04.002	f	\N
1e9e26dc-5c28-45f2-b795-5818783d8e7c	Assoc. Prof. Dr. Rini Maulina, S.Sn., M.Sn.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:13.93	2026-08-08 16:57:13.93	\N	\N	\N	Aktif	D3 Desain Grafis	4127.32.06.011	f	\N
9f0ee84e-da7a-49c9-b172-44e626cc32fc	Fenny Febrianty, S.S. M.Pd.	$2a$10$Ef./6OInqu5brVU0omjnJO9knYjWIintDYoJMZqRwpB9jcD8QIUEq	\N	9	2026-08-08 16:57:14.124	2026-08-08 16:57:14.124	\N	\N	\N	Aktif	S1 Sastra Jepang	4127.20.04.004	f	\N
4ad54b24-6ee9-4ce2-8ce7-98cceca7fb8d	Drs. H. M. Yasin	$2a$10$/SGffSGG4eoEZBuda/D0uuElwuwibvdNynTSl/tpbAuTd5NgnNtXO	\N	5	2026-08-09 04:27:04.476	2026-08-09 04:27:04.476	\N	69	\N	Aktif	RW 02, Kel. Dago, Kec. Coblong	+62822000102	f	\N
b6296df5-5e1f-4cd9-a654-3500031da4b9	H. Asep Sunandar	$2a$10$ThZetv8m99yjP1xjxytaM.M/y4veFKlIuhB2sRp8a1n6OSf2sHonm	\N	5	2026-08-09 04:27:04.694	2026-08-09 04:27:04.694	\N	70	\N	Aktif	RW 03, Kel. Dago, Kec. Coblong	+62822000103	f	\N
74e6b398-1b00-48a2-b182-c5a75f20f533	Ir. Dadang Iskandar	$2a$10$FoFBMLT6N.ImfRBNRKeNnuR78Op09sRg75ysRNriAtuMm3EQmenhu	\N	5	2026-08-09 04:27:04.885	2026-08-09 04:27:04.885	\N	71	\N	Aktif	RW 04, Kel. Dago, Kec. Coblong	+62822000104	f	\N
eb6d3a99-2c90-4439-a191-830cb54ee127	Hj. Ratna Juwita	$2a$10$zHELU92KHwyuE7JgNlti7.rdDvf76mqytCPtswpnA3dvopz/DWH/2	\N	5	2026-08-09 04:27:05.086	2026-08-09 04:27:05.086	\N	72	\N	Aktif	RW 05, Kel. Dago, Kec. Coblong	+62822000105	f	\N
b2dffddd-64ee-43e7-b18b-ca8785b8babb	Deden Supriatna	$2a$10$9WAcLxeT50FsrlMAphgLHeHzhT73Gg5e7hP3Y3SP3JAvKRbO5rScu	\N	5	2026-08-09 04:27:05.267	2026-08-09 04:27:05.267	\N	73	\N	Aktif	RW 06, Kel. Dago, Kec. Coblong	+62822000106	f	\N
a6765ac3-982b-4d8a-8405-3b456c6b7f94	H. Cecep Hidayat	$2a$10$0BU8iWzpayVisrt1canp4u3Un4ein5YkNqjS2PlDeOSGZeECRNIsC	\N	5	2026-08-09 04:27:05.458	2026-08-09 04:27:05.458	\N	74	\N	Aktif	RW 07, Kel. Dago, Kec. Coblong	+62822000107	f	\N
af6bf1ef-4197-4899-a669-cd49c23d700c	Endang Sutisna	$2a$10$ily7fDe0TxJTtpMlzuVUnecTnfQkYXWGRwk6MtdS2AJoYoXt7H6va	\N	5	2026-08-09 04:27:05.64	2026-08-09 04:27:05.64	\N	75	\N	Aktif	RW 08, Kel. Dago, Kec. Coblong	+62822000108	f	\N
c0389938-2281-445d-894f-29ced77238ed	H. Budi Santoso	$2a$10$CV5WS2sfYXnqC0S/aJoqFeOvAkwfJ2Hs3aJBWNJsV2Pr7VeBfPvYG	\N	5	2026-08-09 04:27:05.831	2026-08-09 04:27:05.831	\N	76	\N	Aktif	RW 09, Kel. Dago, Kec. Coblong	+62822000109	f	\N
e991895a-fd0d-446b-94c4-7ca85bfae7ce	Eko Prasetyo	$2a$10$IaNpnnuVe5v0Tlo3mNTPzOCwkc9HoWVf7ljVz49OkXfZpeexb0g92	\N	5	2026-08-09 04:27:04.252	2026-08-09 04:27:05.996	\N	10	\N	Aktif	RW 10, Kel. Dago, Kec. Coblong	+62822000101	f	\N
9c9a1c36-c828-4652-9aa7-f854c5268702	Drs. H. Rahmat Hidayat	$2a$10$vTPhsWHMmPqziA31M0ZnT.0fppYIN3jrN.IcAjJrg8ZfZGLcRqpOe	\N	5	2026-08-09 04:27:06.169	2026-08-09 04:27:06.169	\N	11	\N	Aktif	RW 11, Kel. Dago, Kec. Coblong	+62822000111	f	\N
534eca47-d3e0-490f-b23c-a319595fb0c9	H. Agus Suhendar	$2a$10$XuZTDUdDfL44tcTnNtpTVuQiIeB6ZzB/hBq6KTD2cWCDl6VIEp0se	\N	5	2026-08-09 04:27:06.331	2026-08-09 04:27:06.331	\N	12	\N	Aktif	RW 12, Kel. Dago, Kec. Coblong	+62822000112	f	\N
45473d59-5473-43f6-84b0-5096b517f326	Tedi Setiadi	$2a$10$mduDlde5gG4/qg4b2xdl7OTbsZ2yXUEsP5/u10J17QIC6xBEYEC0S	\N	5	2026-08-09 04:27:06.501	2026-08-09 04:27:06.501	\N	13	\N	Aktif	RW 13, Kel. Dago, Kec. Coblong	+62822000113	f	\N
9d2f1736-2ecd-4a88-b8fa-1b6727041373	Drs. H. M. Yasin	$2a$10$lF6ntXuPtWvncaGyfB4dZO9MAe4I6/cieYO2ZCLgbqlpYQ1BgZLC6	\N	5	2026-08-09 04:27:06.841	2026-08-09 04:27:06.841	\N	77	\N	Aktif	RW 02, Kel. Sekeloa, Kec. Coblong	+62822000202	f	\N
5638afe9-61d2-49a2-8d33-65cd0256b7b5	H. Asep Sunandar	$2a$10$JjSyn8IpqIVcgBVxAaV0su/Vi6J5LcXzNOmywWn6uN/1htPPgrSIu	\N	5	2026-08-09 04:27:07.043	2026-08-09 04:27:07.043	\N	78	\N	Aktif	RW 03, Kel. Sekeloa, Kec. Coblong	+62822000203	f	\N
f6c712ff-6107-4d5e-8329-a806159b692b	Ir. Dadang Iskandar	$2a$10$sShhrE1x/5XTnWp4ZUcOxOIpfo.JC2KnA3RnpXR5F0hoqlA3uwGGC	\N	5	2026-08-09 04:27:07.243	2026-08-09 04:27:07.243	\N	79	\N	Aktif	RW 04, Kel. Sekeloa, Kec. Coblong	+62822000204	f	\N
6bb6a321-7552-46de-8636-e8339ac1d904	Hj. Ratna Juwita	$2a$10$Hw47tDFOM4OO.nNwlyj39OKASunvq7YZxYxYRQzPw2QzbEEouLUQO	\N	5	2026-08-09 04:27:07.45	2026-08-09 04:27:07.45	\N	80	\N	Aktif	RW 05, Kel. Sekeloa, Kec. Coblong	+62822000205	f	\N
3eef0eee-9837-477a-a75b-5c32a22b2ce4	Deden Supriatna	$2a$10$5WxqyFWssuVCrgJ4He0fGOsGz7RDG5XnMFsjeV4iLhSwaPY5iiOeu	\N	5	2026-08-09 04:27:07.649	2026-08-09 04:27:07.649	\N	81	\N	Aktif	RW 06, Kel. Sekeloa, Kec. Coblong	+62822000206	f	\N
86991284-5692-4fdc-83be-b92b2d984ca2	H. Cecep Hidayat	$2a$10$Dx4B3J14oQHmj55hX46HxubzxZ5ZpUBy9qI3iS29rr2ocow4m.JJO	\N	5	2026-08-09 04:27:07.847	2026-08-09 04:27:07.847	\N	82	\N	Aktif	RW 07, Kel. Sekeloa, Kec. Coblong	+62822000207	f	\N
a6e8fab2-81d1-4fdd-941a-b4259820afdc	Endang Sutisna	$2a$10$YwfEkH45/D7ARdwTY0XkTeywmPVFEI21pGzEJRHRLbte4yGFUU6Rm	\N	5	2026-08-09 04:27:08.065	2026-08-09 04:27:08.065	\N	83	\N	Aktif	RW 08, Kel. Sekeloa, Kec. Coblong	+62822000208	f	\N
edfce664-31ac-4663-9c86-4463a61868c0	H. Budi Santoso	$2a$10$iLpzdEzGbBEYiRo5gjrFnu5WgZ9qYAXGaxK9kgqY9XZI1Ucd1X7q.	\N	5	2026-08-09 04:27:08.254	2026-08-09 04:27:08.254	\N	84	\N	Aktif	RW 09, Kel. Sekeloa, Kec. Coblong	+62822000209	f	\N
ddcd3f16-ff2f-4f28-8640-3595a4a8278d	Eko Prasetyo	$2a$10$DdFGlx5aueHNQitEas15/ebjNQZYUZIsVsF68.07ex6j6ED/.ciBK	\N	5	2026-08-09 04:27:06.663	2026-08-09 04:27:08.426	\N	32	\N	Aktif	RW 10, Kel. Sekeloa, Kec. Coblong	+62822000201	f	\N
6665edb3-8ae6-4a2a-90af-a843a0daae77	Drs. H. Rahmat Hidayat	$2a$10$IpGNu55UZwt9pCICoVDrB.5iEJXBQyW5B6lWsjlVBKvLXXFVpJe42	\N	5	2026-08-09 04:27:08.586	2026-08-09 04:27:08.586	\N	33	\N	Aktif	RW 11, Kel. Sekeloa, Kec. Coblong	+62822000211	f	\N
77363ee7-2b48-4eb4-a256-080894b4c406	H. Agus Suhendar	$2a$10$2ZG2bTJHAAAUJgtlf1nmJuTIcopsK9jQPb.B7481JApGI0l1BZbki	\N	5	2026-08-09 04:27:08.757	2026-08-09 04:27:08.757	\N	34	\N	Aktif	RW 12, Kel. Sekeloa, Kec. Coblong	+62822000212	f	\N
7e1457aa-3f6b-4fdc-a79d-ac9122b31c73	Tedi Setiadi	$2a$10$ZuyNnZZAn/Jn4TErsRpiSeljb5uf1U0KXEHWtlq0adxyW1AirhLYm	\N	5	2026-08-09 04:27:08.915	2026-08-09 04:27:08.915	\N	35	\N	Aktif	RW 13, Kel. Sekeloa, Kec. Coblong	+62822000213	f	\N
98f4ad29-5585-44e4-91b1-e95123496ce4	H. Mulyadi Usman	$2a$10$//01QCln1OWFVwuTn8BVrODEZ85DnGpy9/k81OCxWhAcn/nYW1VnS	\N	5	2026-08-09 04:27:09.083	2026-08-09 04:27:09.083	\N	36	\N	Aktif	RW 14, Kel. Sekeloa, Kec. Coblong	+62822000214	f	\N
bd1b891e-61e5-4b92-9ee5-8897b6a7b07c	Hj. Siti Maryam	$2a$10$xCuPk8d6S.MtMwkRKPdOCOXI91ZdRkF.wJOUw1ptKbDUHHWwbgoIO	\N	5	2026-08-09 04:27:09.255	2026-08-09 04:27:09.255	\N	37	\N	Aktif	RW 15, Kel. Sekeloa, Kec. Coblong	+62822000215	f	\N
58c48a86-a433-40dd-a3e5-b8f44dd5cd34	Drs. H. M. Yasin	$2a$10$MvH3C7/u/gPT7gPAsX6QUO2ztvbLJHB/7qkJWl/RjJ/XgJM2OJOMa	\N	5	2026-08-09 04:27:09.637	2026-08-09 04:27:09.637	\N	85	\N	Aktif	RW 02, Kel. Lebak Gede, Kec. Coblong	+62822000302	f	\N
3f5159f0-c5df-4797-9229-9b9160d0b747	Ida, A.KS.	$2a$10$urnMEyt/0fSUKbGflFyFf.mU2kiltPiL3/RbqCxhVxuqsxyOzENeS	\N	4	2026-08-10 07:16:49.87	2026-08-10 12:09:53.24	\N	\N	\N	Aktif	\N	+628111111121	f	\N
33da4c68-34d0-459f-bb47-99f510ce1faf	Usman Adireja, S.Sos.	$2a$10$h.nV6b0.NiK7bOoCkVaJM.VHhw61zO3yre0ux6RGimHQ52TYA2Sde	\N	4	2026-08-10 07:16:50.03	2026-08-10 12:09:53.411	\N	\N	\N	Aktif	\N	+628111111122	f	\N
1ed4f329-932d-4045-bb1e-bb29471b9883	H. Asep Sunandar	$2a$10$mJ66f/OBkUnztRej/dYhN.fXubZY7PPpT.ze8AJPCGcEwG.L0t4pC	\N	5	2026-08-09 04:27:09.812	2026-08-09 04:27:09.812	\N	86	\N	Aktif	RW 03, Kel. Lebak Gede, Kec. Coblong	+62822000303	f	\N
40f26307-e23a-4d0d-b852-a7d58a7a1bc9	Ir. Dadang Iskandar	$2a$10$IToSmhgItXAihPTLsZzMz.kbyKcnShVcQ8pfSVF2yPYVHMoMcQbBa	\N	5	2026-08-09 04:27:10.008	2026-08-09 04:27:10.008	\N	87	\N	Aktif	RW 04, Kel. Lebak Gede, Kec. Coblong	+62822000304	f	\N
35cb9716-7da7-4884-a596-7a5181e3c9fa	H. Cecep Hidayat	$2a$10$1IdSkrekKHzqMO/Ipz7s2.Bv1wV4uD940aUFligC.RYccLskt85uu	\N	5	2026-08-09 04:27:10.591	2026-08-09 04:27:10.591	\N	90	\N	Aktif	RW 07, Kel. Lebak Gede, Kec. Coblong	+62822000307	f	\N
5e35ea49-b6db-436c-b9b4-1be7c845c20b	Endang Sutisna	$2a$10$XRBUm3ERB14m8qhV5sgwJeDS.Dh8Rw88McXxy3J3lo4agGdLOIQ0u	\N	5	2026-08-09 04:27:10.766	2026-08-09 04:27:10.766	\N	91	\N	Aktif	RW 08, Kel. Lebak Gede, Kec. Coblong	+62822000308	f	\N
af79de6f-49a4-40bf-9fac-adb0e7ac5032	H. Budi Santoso	$2a$10$i80W5VLP52YdlC.3nrUTk.1Gm4ACtNJxBudObYhlJc7dEL2rkorZu	\N	5	2026-08-09 04:27:10.955	2026-08-09 04:27:10.955	\N	92	\N	Aktif	RW 09, Kel. Lebak Gede, Kec. Coblong	+62822000309	f	\N
011ac443-4afe-4c0e-9e85-8ecce5d587bd	Eko Prasetyo	$2a$10$zaVbJZbgIsJrUdY9niD09.hEYNjTZTTCUqwLgQ5zGZ8kqEwK/CLvK	\N	5	2026-08-09 04:27:09.439	2026-08-09 04:27:11.143	\N	47	\N	Aktif	RW 10, Kel. Lebak Gede, Kec. Coblong	+62822000301	f	\N
04891b81-c56a-4b70-8c42-c257b53e7b95	Tedi Setiadi	$2a$10$IAFlbXE9Z8TmkEtfOxWMsOX6OOgyD79tktmHmddwNx23j.V923hDO	\N	5	2026-08-09 04:27:11.693	2026-08-09 04:27:11.693	\N	50	\N	Aktif	RW 13, Kel. Lebak Gede, Kec. Coblong	+62822000313	f	\N
ccb104e6-80e1-48fa-92c1-c5343267f82d	H. Bambang Suherman, S.T.	$2a$10$AMdLMVwsUib9NoSB1Ue6eee4/K35gRQeQ1jkF9QTsbXuXAdvImb0G	\N	5	2026-08-09 04:27:11.898	2026-08-09 04:27:11.898	\N	93	\N	Aktif	RW 01, Kel. Lebak Siliwangi, Kec. Coblong	+62822000401	f	\N
2697927f-835f-4ab8-8c69-f54518461d04	Drs. H. M. Yasin	$2a$10$ySHC8cjZjV9jwElcsuuaXu9QrBrErG/tmtJ1KFTSSrNo5DUpBn5TW	\N	5	2026-08-09 04:27:12.07	2026-08-09 04:27:12.07	\N	94	\N	Aktif	RW 02, Kel. Lebak Siliwangi, Kec. Coblong	+62822000402	f	\N
b752f3de-41cf-4dac-93cc-0832f2193668	H. Asep Sunandar	$2a$10$uiY39h3jXdbsgpxNclijo.afQoGnjCLixPDTHX/1LMeZaQZCogsvK	\N	5	2026-08-09 04:27:12.282	2026-08-09 04:27:12.282	\N	95	\N	Aktif	RW 03, Kel. Lebak Siliwangi, Kec. Coblong	+62822000403	f	\N
0ad96168-dc21-4a02-b765-9acdae3673c8	Ir. Dadang Iskandar	$2a$10$jr1xPSZD9JIfBeQeT06Fbu1HSoHGyAW.cx0RD3mXkcn8SMDBtlEBG	\N	5	2026-08-09 04:27:12.487	2026-08-09 04:27:12.487	\N	96	\N	Aktif	RW 04, Kel. Lebak Siliwangi, Kec. Coblong	+62822000404	f	\N
8fd52046-bfff-435e-a3b8-e036e97038b1	Hj. Ratna Juwita	$2a$10$jzkdBf3prHellDTcj7AiOOml//qIdDTmt6YG9jiYa5POjgD1Uq6nG	\N	5	2026-08-09 04:27:12.682	2026-08-09 04:27:12.682	\N	97	\N	Aktif	RW 05, Kel. Lebak Siliwangi, Kec. Coblong	+62822000405	f	\N
51c8dac5-98c9-4ab8-879e-9f118117c69a	Deden Supriatna	$2a$10$OKoYcEMRQ1IBmAjRXZ13beYGguVvW7uMPYgH5du2EcTiuTMQ/.Jle	\N	5	2026-08-09 04:27:12.861	2026-08-09 04:27:12.861	\N	98	\N	Aktif	RW 06, Kel. Lebak Siliwangi, Kec. Coblong	+62822000406	f	\N
e0603cac-2695-4be9-a64b-121833f3daf9	H. Cecep Hidayat	$2a$10$R6VeZDcZbk9Lc/5mESKs3ef5WDl2Tg0CrFQ7uqtWHMHU66YSuUgiK	\N	5	2026-08-09 04:27:13.035	2026-08-09 04:27:13.035	\N	99	\N	Aktif	RW 07, Kel. Lebak Siliwangi, Kec. Coblong	+62822000407	f	\N
e87364a9-d460-4fbd-beee-f36d4473972e	H. Bambang Suherman, S.T.	$2a$10$KNIJgxIj8V5NCiqfIfbrQuHlHvx9iXFfgTU/fJvAcsrAYKqkAjJbG	\N	5	2026-08-09 04:27:13.207	2026-08-09 04:27:13.207	\N	100	\N	Aktif	RW 01, Kel. Sadang Serang, Kec. Coblong	+62822000501	f	\N
aff99553-a460-4b79-aa6d-5156ff5431de	H. Cecep Hidayat	$2a$10$26tLlCfXzegmDCrMjelrQe/O/qtzMZdjjEJck/NRYaHASLB7pWaSK	\N	5	2026-08-09 04:27:14.364	2026-08-09 04:27:14.364	\N	106	\N	Aktif	RW 07, Kel. Sadang Serang, Kec. Coblong	+62822000507	f	\N
20cac7c4-8985-46d2-99dd-25463c343a42	Endang Sutisna	$2a$10$ncemgmWsCCZioQmasXyfHeA5hMlu9eYGNUNb10zLRPQWZdigf70eu	\N	5	2026-08-09 04:27:14.533	2026-08-09 04:27:14.533	\N	107	\N	Aktif	RW 08, Kel. Sadang Serang, Kec. Coblong	+62822000508	f	\N
754ff6d5-ee85-480e-9eeb-95bcbe14b0b9	H. Budi Santoso	$2a$10$KDOyHKjzK8ijHoqyaR0x7u.KOajTQRNdvS6MYg81IzDVUNpPb5TXO	\N	5	2026-08-09 04:27:14.72	2026-08-09 04:27:14.72	\N	108	\N	Aktif	RW 09, Kel. Sadang Serang, Kec. Coblong	+62822000509	f	\N
11ece3ab-19ae-4279-9695-c49cff0cd395	Eko Prasetyo	$2a$10$53sIQBdGACFlDkW2dARfWelDC2XibAEXY3N6XRNM2qRPUop9zYoPa	\N	5	2026-08-09 04:27:14.902	2026-08-09 04:27:14.902	\N	109	\N	Aktif	RW 10, Kel. Sadang Serang, Kec. Coblong	+62822000510	f	\N
56c4d96f-b5d2-46e4-a943-5beb7077008f	H. Agus Suhendar	$2a$10$aHQHIMru9iCsgU40QzEU1eSxCw1Kn8awFSv66t1d71sHgJ2Mj7J4K	\N	5	2026-08-09 04:27:15.273	2026-08-09 04:27:15.273	\N	111	\N	Aktif	RW 12, Kel. Sadang Serang, Kec. Coblong	+62822000512	f	\N
e29ab9d1-47be-4966-ac83-5dbaabc8d5aa	Tedi Setiadi	$2a$10$IuvwUQJjcuVB5EUTHSqgwOHO9fRUeJp4vpaG4HWqwwmXCdpTwLoCy	\N	5	2026-08-09 04:27:15.447	2026-08-09 04:27:15.447	\N	112	\N	Aktif	RW 13, Kel. Sadang Serang, Kec. Coblong	+62822000513	f	\N
7c233cb6-ed67-4208-8721-01a811eca39a	H. Mulyadi Usman	$2a$10$gq5wM7lXxSxf41AhriAsTOfb.MOtDnXMhlH1ZbVde45h8GHPE6cSS	\N	5	2026-08-09 04:27:15.629	2026-08-09 04:27:15.629	\N	113	\N	Aktif	RW 14, Kel. Sadang Serang, Kec. Coblong	+62822000514	f	\N
b47092c7-82be-4248-8c17-75635d29dd32	H. Bambang Suherman, S.T.	$2a$10$vVK/1M0LO7LQkGbJCRGhy.xlZHdpx2hSlBjfZLdZckI5p4Sd5vn2m	\N	5	2026-08-09 04:27:16.004	2026-08-09 04:27:16.004	\N	115	\N	Aktif	RW 16, Kel. Sadang Serang, Kec. Coblong	+62822000516	f	\N
29c2e393-bc29-4a09-807c-002480a499e1	Drs. H. M. Yasin	$2a$10$bIxm6Sjibqfsnv2IJ5sKNuKsDXpHtHmYH1eNw9KurC/r5VJKYBQ6y	\N	5	2026-08-09 04:27:16.183	2026-08-09 04:27:16.183	\N	116	\N	Aktif	RW 17, Kel. Sadang Serang, Kec. Coblong	+62822000517	f	\N
126e35af-8ae8-48b3-9483-3bb9e7105bfd	Ir. Dadang Iskandar	$2a$10$33oSR0UydGM2FnrqGLk3C.JMsRGwc2eyY4E3UAV5lIkGgIlz3lxx6	\N	5	2026-08-09 04:27:16.557	2026-08-09 04:27:16.557	\N	118	\N	Aktif	RW 19, Kel. Sadang Serang, Kec. Coblong	+62822000519	f	\N
23c4b079-fc8e-4b4a-a6b0-5d4bbc29cd13	Hj. Ratna Juwita	$2a$10$g5WmhCKyDVqopefoCb9XuuCgZdmSNd0Paw5FxxO./u0Zaa3iRyO..	\N	5	2026-08-09 04:27:16.731	2026-08-09 04:27:16.731	\N	119	\N	Aktif	RW 20, Kel. Sadang Serang, Kec. Coblong	+62822000520	f	\N
3ea1c657-c06e-46fe-9e78-98552b6b147a	Deden Supriatna	$2a$10$NlwfyEH.P4mqa6o0gq9kRu1LJetdX25sxKhB.yYIXXGmqgXmqaU2G	\N	5	2026-08-09 04:27:16.907	2026-08-09 04:27:16.907	\N	120	\N	Aktif	RW 21, Kel. Sadang Serang, Kec. Coblong	+62822000521	f	\N
742a6f2d-8fd7-49f9-94a9-6956b733ca38	Ir. Dadang Iskandar	$2a$10$kRXZJWEuxOqpfKg8W9sgQ.XQ5lv31HCtBWkb19/YNl7CY7zion.ri	\N	5	2026-08-09 04:27:17.649	2026-08-09 04:27:17.649	\N	123	\N	Aktif	RW 04, Kel. Cipaganti, Kec. Coblong	+62822000604	f	\N
a914a0fe-88f3-4613-9853-37db23016644	Eko Prasetyo	$2a$10$zSMw5AgqqQvFhEC2CC3gQOrjYP1y1iCwI1X38sBbCbkhs8NrGmYAi	\N	5	2026-08-09 04:27:17.08	2026-08-09 04:27:18.803	\N	67	\N	Aktif	RW 10, Kel. Cipaganti, Kec. Coblong	+62822000601	f	\N
c7d25145-8168-4b05-8386-5621e46bdf3f	Hj. Ratna Juwita	$2a$10$fP6LVe3afrw0WXq8xlGGAOKWhTLXASX5bf0H6abfng4y8x/iPYL5m	\N	5	2026-08-09 04:27:10.207	2026-08-09 04:27:10.207	\N	88	\N	Aktif	RW 05, Kel. Lebak Gede, Kec. Coblong	+62822000305	f	\N
e588739d-bcba-4371-a92a-7517b3527aa8	Deden Supriatna	$2a$10$b5JPtTa1vbVVFFNXpjUolOhgJBgqLO8bAC/omDBXblk1Qrkp6chtu	\N	5	2026-08-09 04:27:10.388	2026-08-09 04:27:10.388	\N	89	\N	Aktif	RW 06, Kel. Lebak Gede, Kec. Coblong	+62822000306	f	\N
1b308675-69ee-4f98-b435-3322d5bf146d	Drs. H. Rahmat Hidayat	$2a$10$QimHA3QF556skEY1T6Hz7OzL0Plthe.uAoqkuhIUrqNDUc.mg7aGy	\N	5	2026-08-09 04:27:11.317	2026-08-09 04:27:11.317	\N	48	\N	Aktif	RW 11, Kel. Lebak Gede, Kec. Coblong	+62822000311	f	\N
24f17993-df71-404e-8824-e8e616acc8b0	H. Agus Suhendar	$2a$10$83zUxx.Aban7dcvi3zbEWusjwtqXKUBuutvjOrtL3i3RxFis/vUuC	\N	5	2026-08-09 04:27:11.476	2026-08-09 04:27:11.476	\N	49	\N	Aktif	RW 12, Kel. Lebak Gede, Kec. Coblong	+62822000312	f	\N
21fec8fc-ac71-4af3-b295-e84aae3248d5	Drs. H. M. Yasin	$2a$10$DA8FUNUanWHC5ouZlXyW/u5k8irH9TeaMbqXjoYhbyOugc2Iep9gm	\N	5	2026-08-09 04:27:13.393	2026-08-09 04:27:13.393	\N	101	\N	Aktif	RW 02, Kel. Sadang Serang, Kec. Coblong	+62822000502	f	\N
ca311c1a-d82c-4dfe-b93b-65405771a63c	H. Asep Sunandar	$2a$10$MgpLt6y72gqQmmSv2TdKmepgFEueCLp1G7MTsbsb80jA97eU/Msk6	\N	5	2026-08-09 04:27:13.586	2026-08-09 04:27:13.586	\N	102	\N	Aktif	RW 03, Kel. Sadang Serang, Kec. Coblong	+62822000503	f	\N
6631dda8-7fbd-4d47-b104-fb56d7c74c58	Ir. Dadang Iskandar	$2a$10$o2XIE9WyjT.zaENw8JavqumSdUlN7F1cQZENDSio9KbToA8b5UFK.	\N	5	2026-08-09 04:27:13.798	2026-08-09 04:27:13.798	\N	103	\N	Aktif	RW 04, Kel. Sadang Serang, Kec. Coblong	+62822000504	f	\N
547f16b2-0583-4a4b-88e8-ea12b1859e90	Hj. Ratna Juwita	$2a$10$NX/4hOXxCNuYKIdLYltBvuxjcHKBj3Tu1gsWdrfJ.mqiplePSoF6W	\N	5	2026-08-09 04:27:13.985	2026-08-09 04:27:13.985	\N	104	\N	Aktif	RW 05, Kel. Sadang Serang, Kec. Coblong	+62822000505	f	\N
cf0251d8-55f4-40bd-ab51-2306dc98d875	Deden Supriatna	$2a$10$HK6a8PgtEwa4JMwGkIFa9eM.YzhVVYeogZMFDsTVmjr4A/Ky8e.LW	\N	5	2026-08-09 04:27:14.171	2026-08-09 04:27:14.171	\N	105	\N	Aktif	RW 06, Kel. Sadang Serang, Kec. Coblong	+62822000506	f	\N
fbad82c7-cef0-4208-b0f7-6755c2d0d3b0	Drs. H. Rahmat Hidayat	$2a$10$K1X3Lvtj0jBXwjhv1gtOEOEavAe0GfvDskGEmOz9PuzNPdFMmgj3a	\N	5	2026-08-09 04:27:15.084	2026-08-09 04:27:15.084	\N	110	\N	Aktif	RW 11, Kel. Sadang Serang, Kec. Coblong	+62822000511	f	\N
4f72bfe7-ad01-444d-a53f-6a8f7eb748e5	Hj. Siti Maryam	$2a$10$kToNlj1OdfIoFgLoHidY8uXMxFRQa3GI9ayvOUUam.r351AywcpZq	\N	5	2026-08-09 04:27:15.822	2026-08-09 04:27:15.822	\N	114	\N	Aktif	RW 15, Kel. Sadang Serang, Kec. Coblong	+62822000515	f	\N
f5f95d68-1fa5-43c3-91a0-7ede8eb2ee2e	H. Asep Sunandar	$2a$10$llp7X1ZNwT1GxoMMmkUoyefzOxqfYabgWC.7uvuYObXGW2NUVHe2G	\N	5	2026-08-09 04:27:16.368	2026-08-09 04:27:16.368	\N	117	\N	Aktif	RW 18, Kel. Sadang Serang, Kec. Coblong	+62822000518	f	\N
952411ed-9c3a-4f02-99e3-b968fa6c56cb	Drs. H. M. Yasin	$2a$10$P416.jgMLBDnNz9uLN53tuSZ0NxASpDpvvBA2GPilv5Uh6xR8RPrC	\N	5	2026-08-09 04:27:17.27	2026-08-09 04:27:17.27	\N	121	\N	Aktif	RW 02, Kel. Cipaganti, Kec. Coblong	+62822000602	f	\N
a1ecaa65-d0cf-4cd9-ab8c-1935c244c50a	H. Asep Sunandar	$2a$10$.//Pb200cJU2PLHgiHWqeOsKlrbP3uD3keciYxxBhkRT7G2eVY8Q6	\N	5	2026-08-09 04:27:17.457	2026-08-09 04:27:17.457	\N	122	\N	Aktif	RW 03, Kel. Cipaganti, Kec. Coblong	+62822000603	f	\N
ff70706f-187b-4d4e-8200-c109c890ce2c	Hj. Ratna Juwita	$2a$10$yme1L15dUsNcEmEPa1FH/u161W6HnLAsny8/FE5WKSTTUTnsCmaVu	\N	5	2026-08-09 04:27:17.87	2026-08-09 04:27:17.87	\N	124	\N	Aktif	RW 05, Kel. Cipaganti, Kec. Coblong	+62822000605	f	\N
f1c126c6-f52b-45ce-b5be-d3d3a21e42d3	Deden Supriatna	$2a$10$q9INGYgQcU/oKg4ZwQGLv.qFHDDVf8Co.phEmQz7q8V4gHtePnO1K	\N	5	2026-08-09 04:27:18.063	2026-08-09 04:27:18.063	\N	125	\N	Aktif	RW 06, Kel. Cipaganti, Kec. Coblong	+62822000606	f	\N
917a4507-5662-45a4-91f9-d9ee47864f91	H. Cecep Hidayat	$2a$10$/wNVOTW6gyr3ua92vtyYWOfCetEdgaDMcjNp5kDkV8DxVa7DQLj5C	\N	5	2026-08-09 04:27:18.262	2026-08-09 04:27:18.262	\N	126	\N	Aktif	RW 07, Kel. Cipaganti, Kec. Coblong	+62822000607	f	\N
ee162448-3802-46e6-8918-27894bcc2b3d	Endang Sutisna	$2a$10$ZdAGWQEW/l3djPJYxP8mP.9GTjdSWF16P.YVAtMjLoFMCPaGbvBxO	\N	5	2026-08-09 04:27:18.441	2026-08-09 04:27:18.441	\N	127	\N	Aktif	RW 08, Kel. Cipaganti, Kec. Coblong	+62822000608	f	\N
54c27bd8-a2c4-4c8b-b935-4e10e139316c	H. Budi Santoso	$2a$10$j0DTMxUvrTQ8gsgwbdL7uuY59mKWD7zyo0cDR/72FtLsvA4FpcnCm	\N	5	2026-08-09 04:27:18.638	2026-08-09 04:27:18.638	\N	128	\N	Aktif	RW 09, Kel. Cipaganti, Kec. Coblong	+62822000609	f	\N
6dff64cc-2b94-4f5f-9060-56f44f6de20f	Pengurus RW 11 - Kel. Dago	$2a$10$0WJRyUoBDG1.PelXaOCncOie9tYvQv006mZ3DSKfLe5LIcU2W6AEC	\N	5	2026-08-09 04:27:21.846	2026-08-09 04:27:21.846	\N	\N	\N	Aktif	\N	+628380011	f	\N
21179e23-ea4f-449c-a014-392e06b3d014	Pengurus RW 12 - Kel. Dago	$2a$10$thIjwSeB4NPwmyPpiHXNb.0eSylmdo6YOQ6gFWSTPjR3KyEPjiNFG	\N	5	2026-08-09 04:27:22.019	2026-08-09 04:27:22.019	\N	\N	\N	Aktif	\N	+628380012	f	\N
c1355868-d981-43e2-b803-ac3782d5373c	Pengurus RW 13 - Kel. Dago	$2a$10$YA7izM2z/vwoRx52eFphdOOOYEkEOTW6w69zwophF4kJ5DgD42L4i	\N	5	2026-08-09 04:27:22.173	2026-08-09 04:27:22.173	\N	\N	\N	Aktif	\N	+628380013	f	\N
cd383f45-f701-4ec6-8b9d-d9d68b144208	Amelya Rizqi Rachmadani	$2a$10$wTtiJlOV80xHGozOl/8iMeUTXtaA4uUUm5zWD/WlQlrzMF3bwGImC	\N	11	2026-08-09 04:27:22.373	2026-08-09 04:27:22.373	\N	\N	\N	Aktif	Manajemen S1	+6282115280051	t	\N
59060933-9f84-4e7c-9906-ad3f2dd387fd	Novia Sri Wahyuni	$2a$10$si3RSsKurnjmyvrwCTKk9uaJPpCSxJFB.3T/RTuUr.54aroLxdXB.	\N	11	2026-08-09 04:27:22.631	2026-08-09 04:27:22.631	\N	\N	\N	Aktif	Manajemen S1	+6283897917262	t	\N
bf9ee1e2-7ec4-49f1-a3d0-966778423e71	Rizka Rahma Kamila	$2a$10$5.2u.zqhraeGfbG4c1yxo.N4amvDgm9bl30Pi5wiDYs6QKjxEylle	\N	11	2026-08-09 04:27:22.83	2026-08-09 04:27:22.83	\N	\N	\N	Aktif	Manajemen S1	+6283844209035	t	\N
5798e9da-8220-4bb8-9e5d-af5817010fb8	Zahra Puteri Qintara	$2a$10$VzpN/jSPofusAiHOyW87H.Ue6ZMTU/KjTgEn0RD78kpYDbN8pynCq	\N	11	2026-08-09 04:27:23.012	2026-08-09 04:27:23.012	\N	\N	\N	Aktif	Manajemen S1	+628979745547	t	\N
a8e41d57-91bb-46ab-8090-bf86d2e9c432	Aldrin Juandika	$2a$10$wnp//hSeO/JVRokuIlgyK.nuxK29KtfAz4M/Ps09qUuOB2PMJKoeO	\N	11	2026-08-09 04:27:23.2	2026-08-09 04:27:23.2	\N	\N	\N	Aktif	Manajemen S1	+6281511722253	t	\N
36e2c2fb-9b8b-4de6-9b21-b791e6a39e7c	NAAILA RIZKY KURNIAWAN	$2a$10$NWO6WxDmaSZSZxZlxeoSHeEs4ByI5QlxRGS8yio0m4K1RjU8vIRbi	\N	11	2026-08-09 04:27:23.39	2026-08-09 04:27:23.39	\N	\N	\N	Aktif	Manajemen S1	+6281803930324	t	\N
2c68c4c6-d7f2-4ce4-ba12-704b98a055b7	Ahmad Shadiq	$2a$10$cfKc94XcAwfJZQPGGtHao.l6Ha1Qr1i/2Q0jtksiAdI6gkB9mcrNe	\N	11	2026-08-09 04:27:23.602	2026-08-09 04:27:23.602	\N	\N	\N	Aktif	Manajemen S1	+628978123352	t	\N
035be5af-5643-4562-8d16-e16f831d82ab	Rika Yuseliana	$2a$10$uuRUcxLyp1aLvC6XWbtseuVk/SK5j5fdAmLI0Pgan2529gYLlKCta	\N	11	2026-08-09 04:27:23.802	2026-08-09 04:27:23.802	\N	\N	\N	Aktif	Manajemen S1	+6283823067530	t	\N
0b570caa-7be0-412c-afbd-dcaedc8b5bd7	Kesya Putri Fibrianto	$2a$10$zFiZ95eTzpltVmXVqF9I3uey3N9fiDzdvynKg6f95RDnSQqGlQ7r.	\N	11	2026-08-09 04:27:24.031	2026-08-09 04:27:24.031	\N	\N	\N	Aktif	Manajemen S1	+6281386759563	t	\N
ca752f5c-2c2f-4029-ac0c-7d1a0b079270	Juan Morgan Pakpahan	$2a$10$1zb8Pr1Rfcl/yM4s3BZlz.q0qFmiVny4I3Tt.qwpFS7ojhsUTc8QW	\N	11	2026-08-09 04:27:24.223	2026-08-09 04:27:24.223	\N	\N	\N	Aktif	Manajemen S1	+62895388814138	t	\N
9706aca6-d367-4a4f-8823-88495fc69477	MUHAMMAD RENDI ANSARI	$2a$10$ofvmd/L5GLhBTDmTln/6Z./Q46bUbKHps/PGOpNWlEuQFQAVwPEOG	\N	11	2026-08-09 04:27:24.441	2026-08-09 04:27:24.441	\N	\N	\N	Aktif	Manajemen S1	+6281563500163	t	\N
45763743-02ff-4319-8193-9e114f0e7e22	Reynaldi Pasha Nugraha	$2a$10$w5HiO7dlSngdsa6SZ2AeEeAPWknIq1klnXFMYivbw9D3La1UVX8Lu	\N	11	2026-08-09 04:27:24.638	2026-08-09 04:27:24.638	\N	\N	\N	Aktif	Manajemen S1	+6289516528208	t	\N
97e96275-7dbd-4850-b002-541c5593e7b9	Dimas Aditiya	$2a$10$IjhGUliIkTEhLnwaGsjS7ukbTifkbF6U.tWtHA31iKetfo083tkdG	\N	11	2026-08-09 04:27:24.855	2026-08-09 04:27:24.855	\N	\N	\N	Aktif	Manajemen S1	+6284898521015	t	\N
90529bc5-892d-42f9-a21d-eeee92d81af4	Dwi Anggeria Maulana	$2a$10$TrGxNXuQ3hqVhjVpKZh.pelnCJ61AkVC7mYqJH5xvT6pfqllZlU0O	\N	11	2026-08-09 04:27:25.056	2026-08-09 04:27:25.056	\N	\N	\N	Aktif	Manajemen S1	+6285759973751	t	\N
1aecede4-f769-4b9a-b600-73407f2af897	Bunga Sefrizanti	$2a$10$dn1NKHCFzJ1Kda1yy9vaEOmCQQV35q6BuYTQ8AAflbmlM5e1Wy2/.	\N	11	2026-08-09 04:27:25.296	2026-08-09 04:27:25.296	\N	\N	\N	Aktif	Manajemen S1	+6283839324380	t	\N
f94d59ad-0996-49ea-a06a-342a61ce02ae	EVANIA SALSABILA	$2a$10$UoW9k4v2xpVfJaR7/LnCceqUYfOCnF1xlS5Lj.qmvBXB7SWCY4zOW	\N	11	2026-08-09 04:27:25.489	2026-08-09 04:27:25.489	\N	\N	\N	Aktif	Manajemen S1	+628886002536	t	\N
e224714a-8aab-442e-8edf-48bff04a1122	Virginia Putri Andeida	$2a$10$ag5Vh5zy.GvfGvDvyABIduMdDMVRBa4qW5RUHDYdK6n/ooBk0KFXm	\N	11	2026-08-09 04:27:26.37	2026-08-09 04:27:26.37	\N	\N	\N	Aktif	Manajemen S1	+6285189951218	t	\N
700a2b4d-2280-448e-8bb5-05a6c80816a7	Riky wildan hepyliyadi	$2a$10$d.9bJqhCxgX26gaNLasfb.1/vAZ2rvgPhdHhu8qWEX9C7SqsxEbqC	\N	11	2026-08-09 04:27:26.585	2026-08-09 04:27:26.585	\N	\N	\N	Aktif	Manajemen S1	+628985506581	t	\N
dca932a0-e6b1-47ce-8e5d-55a6aa18c658	DEVITASARI	$2a$10$DMEPlj7ZDKcG9QjDukLye.5BAkamwdauOhn3PEHlDrlov1VhZwYey	\N	11	2026-08-09 04:27:27.065	2026-08-09 04:27:27.065	\N	\N	\N	Aktif	Manajemen S1	+6285769680649	t	\N
7a557c0b-9786-4eb8-8eca-1e1c2a25b41a	Maryam Agatha Islami	$2a$10$uVYtCZrn0eKWwA7hGgqZEuHozGeJ79UrgdktmdlYuqT35EUV0FHwW	\N	11	2026-08-09 04:27:27.274	2026-08-09 04:27:27.274	\N	\N	\N	Aktif	Manajemen S1	+6287717774587	t	\N
2a52664c-af37-483c-b8c1-53e00037762c	risa marseliana	$2a$10$nH0kU7XvVR8j8R1SY810aeG6k.h73FHCT6E60r4fuzPXf7lPS8WOG	\N	11	2026-08-09 04:27:27.501	2026-08-09 04:27:27.501	\N	\N	\N	Aktif	Manajemen S1	+6281511687598	t	\N
9f561f32-b784-4b46-989f-b70b7c05dcfe	Rajnan khairul akhyar	$2a$10$.FmsZuB9IHKFYyBM./01MuTJWERnqBkanouKnftARmhCfAWjTO0w.	\N	11	2026-08-09 04:27:27.735	2026-08-09 04:27:27.735	\N	\N	\N	Aktif	Manajemen S1	+6281220505575	t	\N
1634ab34-536e-437f-b1f5-0697e3ee359b	Cicy Fauzzyah Rifqi Iskandar Sunu Saranani	$2a$10$G4OzPoRCDg7urumXzSKxCuXd/vjCevcvX1w5UoI6o6U9bih6RuZGi	\N	11	2026-08-09 04:27:27.932	2026-08-09 04:27:27.932	\N	\N	\N	Aktif	Manajemen S1	+6281323194418	t	\N
c29fe1f6-9925-41a9-8ebb-8ff7f247cb02	Ana Alailla	$2a$10$oLvKKvk6e569Z2MpsVWJieiiG9b5HvGeFI7bEacffEeLWz/4bY8xC	\N	11	2026-08-09 04:27:28.128	2026-08-09 04:27:28.128	\N	\N	\N	Aktif	Manajemen S1	+6289506697457	t	\N
99b1d623-62cd-470a-b3a7-1a4f6a314694	⁠Mochamad mir’an kholid	$2a$10$qCQOLlgxnSUGcmDUWEAj4.wYDMyWYpBRwobxIt3Ydu308g/vrYMXm	\N	11	2026-08-09 04:27:29.471	2026-08-09 04:27:29.471	\N	\N	\N	Aktif	Manajemen S1	+6281321384239	t	\N
4c84871b-b20c-4ded-9b7c-3592439d7e5b	M Ghassan Rabbani H	$2a$10$hR5wW7j6Jw623UluEilTFeBL1/vWrNwslTO7PbIhjvtM1CR5c/F3K	\N	11	2026-08-09 04:27:29.652	2026-08-09 04:27:29.652	\N	\N	\N	Aktif	Manajemen S1	+628990054657	t	\N
383f9695-c5bb-4043-b200-32c51b7e4b5c	⁠Yazdaniar Alfaathir	$2a$10$0s66mSoK7ORHKsoi.0/nn.XWRvr8x7evkaoSTEWrh.edMSDJmJdBO	\N	11	2026-08-09 04:27:30.551	2026-08-09 04:27:30.551	\N	\N	\N	Aktif	Manajemen S1	+62895370305522	t	\N
9ed49870-1478-4e4b-9a43-025cc9529974	Muhammad Rachil Tri Gusti	$2a$10$gwQQ6PIjp4Ti2xk3sBq8Ee.KptTL1yu6mBvsu1xfhawD5.z/S2l0u	\N	11	2026-08-09 04:27:30.988	2026-08-09 04:27:30.988	\N	\N	\N	Aktif	Manajemen S1	+6281219521365	t	\N
91a153e1-12ab-47ca-85ed-16c3e5e83a86	kaesya Prasetya gandhi	$2a$10$hcUmZfYY0IcSItd/ljnncOaTEBMiGaoayZKcXw0T6hC5EQczSyV0e	\N	11	2026-08-09 04:27:31.21	2026-08-09 04:27:31.21	\N	\N	\N	Aktif	Manajemen S1	+6287775676469	t	\N
2f7ad761-ce8c-4288-8783-8dd85be679aa	Pengurus RW 05 - Kel. Dago	$2a$10$BDmmQJjzsg0chh.nhUhz2.bxkg6p.ZjbX7ODdU/LD6mhDruHsOXKO	\N	5	2026-08-09 04:27:31.412	2026-08-09 04:27:31.412	\N	\N	\N	Aktif	\N	+628380005	f	\N
49b43b3c-0161-4bd9-b30e-7b479833c791	Pengurus RW 06 - Kel. Dago	$2a$10$yGIiaoqx4iohbHt4AN0lHO.XRD1tRyaIBNiFTYYKoyK3vLgKycuZm	\N	5	2026-08-09 04:27:31.586	2026-08-09 04:27:31.586	\N	\N	\N	Aktif	\N	+628380006	f	\N
a717fa7e-0e1b-4273-91fb-73ac7be11a2f	Ivana Agustin Ragil Ayomi	$2a$10$e9AP45RAqX5.P5gAYtwUKOgEKRj94wA0BxovPVTlWKP4Ti0lk5ySG	\N	11	2026-08-09 04:27:31.786	2026-08-09 04:27:31.786	\N	\N	\N	Aktif	Manajemen S1	+6282195176008	t	\N
f2aedc1f-fcd5-45b4-9cee-d60870357662	Gaberiela Br Bangun	$2a$10$w7uE8LDmL0tR2RUOowxL8OSxerBXGf/YSxpzLZOSrRvW6WpPro0pO	\N	11	2026-08-09 04:27:31.99	2026-08-09 04:27:31.99	\N	\N	\N	Aktif	Manajemen S1	+628817877256	t	\N
a6f756de-c210-4b59-8447-91b30f053adf	Devina Mutiara Aghisna	$2a$10$FEkUkv8qhYD2KBd5agUVou8nB33XqTrZtzMxc9HH.GrFNERDEBlXy	\N	11	2026-08-09 04:27:32.425	2026-08-09 04:27:32.425	\N	\N	\N	Aktif	Manajemen S1	+6281224790197	t	\N
38e59a8c-96a4-4f64-a682-bedf2fb32af2	Naira Azzahra	$2a$10$v1RqdCbxJzK.MLBbCZ3U7uU0.w7PxmKXHiNJzCa0bGONTtrslCjXm	\N	11	2026-08-09 04:27:35.622	2026-08-09 04:27:35.622	\N	\N	\N	Aktif	Manajemen S1	+6281917113086	t	\N
51eddfb6-de2b-4bfb-90c3-d78b8b2f20d8	Dewi Azra Tami	$2a$10$g.y.huOUe1iFHqkw6dBrYuc5YZwF9l.sMh1MHTG2sTmFYFyRp2b7.	\N	11	2026-08-09 04:27:35.844	2026-08-09 04:27:35.844	\N	\N	\N	Aktif	Manajemen S1	+6283890542228	t	\N
1e9e17d4-a4e0-4391-a175-2f5b5cc3b51c	Salma Nur Fadilah	$2a$10$eh9oxjR6Ofb6OuugxY94MOI2ZWt1es7BF3vePUALxJSu4lDCNG.Be	\N	11	2026-08-09 04:27:36.329	2026-08-09 04:27:36.329	\N	\N	\N	Aktif	Manajemen S1	+6285846160400	t	\N
e19cce72-154b-478c-acfe-aa91d9ebffb3	Melinda	$2a$10$TJ1PJIT0Jcf4VPrz1Q/r6OC2/gWzsTMPNc9Fcih.8rVuYUgIVzRO.	\N	11	2026-08-09 04:27:36.54	2026-08-09 04:27:36.54	\N	\N	\N	Aktif	Manajemen S1	+628987830220	t	\N
ef43c9c5-f0dd-4aa9-a886-7c8a16aa02c1	Hirani Zahra Febriyanti	$2a$10$xGgJSY7hk.5NxpPdfAMGOeCSEiH9fts/K6wfiW9ZnF1CVEGXMlca2	\N	11	2026-08-09 04:27:37.199	2026-08-09 04:27:37.199	\N	\N	\N	Aktif	Manajemen S1	+6281324831783	t	\N
c5ff96f5-4541-4843-9656-5d30fc776679	Cantika Putri Felisha	$2a$10$SWvgsxO9lMXrQY6K2S7GOOvXueNl0EvXVcQIjV6l1xi3z/otUyGTm	\N	11	2026-08-09 04:27:37.65	2026-08-09 04:27:37.65	\N	\N	\N	Aktif	Manajemen S1	+62859113375004	t	\N
e10be224-75b1-4ec3-bb15-041774ff6277	sultan nurzamzam	$2a$10$MQyyCJFKXrVeXe.b6myz2OQgW9c1s.QkXa7nRr5Dcd8l0L2Wb.qkO	\N	11	2026-08-09 04:27:38.449	2026-08-09 04:27:38.449	\N	\N	\N	Aktif	Manajemen S1	+6281320760468	t	\N
5d646a2d-1a3c-46ff-b694-117cbdec22b5	Maranatha Jaya Nainggolan	$2a$10$BV/cTk6Iq0YM280gnLDxB.A1X1olDfUscobGOUw41ZvpXbQuuo3yq	\N	11	2026-08-09 04:27:39.657	2026-08-09 04:27:39.657	\N	\N	\N	Aktif	Manajemen S1	+6282118971151	t	\N
93e891b3-0e90-4d4d-936e-f05745c2890d	Livia Dhayang Rifani	$2a$10$hySifqDWd1/nXiVfjiA6OOAI77RTB86Hy6utvATfuJ7glZ6jiVMYC	\N	11	2026-08-09 04:27:39.862	2026-08-09 04:27:39.862	\N	\N	\N	Aktif	Manajemen S1	+6285158668915	t	\N
69028391-346d-4e23-aee4-46cd6e3e900c	Rizki Maulana	$2a$10$egT1iFS0COqcUpTEg4tcN./svVte7yK9mgw8h7Oo11q9Fz07w8Eau	\N	11	2026-08-09 04:27:40.098	2026-08-09 04:27:40.098	\N	\N	\N	Aktif	Manajemen S1	+628211500633	t	\N
81407b96-688b-40f8-b0e0-32707bec5200	Muhammad Novan Maulana	$2a$10$YPOsfSPRyGo6viemAkpSZud6pKO9Ic6JFMAcVrAWyyfKq5EnzpQDe	\N	11	2026-08-09 04:27:40.354	2026-08-09 04:27:40.354	\N	\N	\N	Aktif	Manajemen S1	+6282119393893	t	\N
9fed464f-2af9-49f2-ac07-f17164074b51	Rafliano Putra Purnama	$2a$10$w9zNDifHITnzOzBK0zvnKeWsXP4girzEf2dXqYRCYIG24BbYjah7S	\N	11	2026-08-09 04:27:40.574	2026-08-09 04:27:40.574	\N	\N	\N	Aktif	Manajemen S1	+6289525033833	t	\N
7fb2039e-bb90-4d28-bbd2-aeb560e1f119	Ahmad Faisal	$2a$10$3PqNTeQp5JcEF5C8vb3JheWgYOjTSZAhwq.X7tSTUtaE2xZMXfZcq	\N	11	2026-08-09 04:27:41.5	2026-08-09 04:27:41.5	\N	\N	\N	Aktif	Manajemen S1	+6283851785523	t	\N
2698da11-7446-4ec3-824c-1fa715b3fdd6	Ailsha Azka SN	$2a$10$0UvDE1SHeR24Z4JatjAHwuLKYiWclsLvVKECCNi6yc59Tvn1fdo4q	\N	11	2026-08-09 04:27:41.735	2026-08-09 04:27:41.735	\N	\N	\N	Aktif	Manajemen S1	+6288706317498	t	\N
9a773bdd-fc6e-4fae-9fcc-37213d36689b	Rafli Nugroho	$2a$10$fVa0sVhzY9yE3FcdkwTnpOiFvILLJzazQKL7ncmYc8rt3dPTAbhaC	\N	11	2026-08-09 04:27:43.402	2026-08-09 04:27:43.402	\N	\N	\N	Aktif	Manajemen S1	+6289991390087	t	\N
1683ece4-f947-4f11-87bf-56887e8bc839	Rosinta Hutauruk	$2a$10$.xosOVTncSK/WvszmcQX.uiHPDkj0PIrI59MfD8/2hRHCWt6WhDh2	\N	11	2026-08-09 04:27:45.662	2026-08-09 04:27:45.662	\N	\N	\N	Aktif	Manajemen S1	+6282120844233	t	\N
2583f6a5-4e73-42d4-9316-0ada70fc9144	Nanda Puspita Dewi	$2a$10$OjHS9ySlGVhZGJdHLdipy.kyshQYrl0vEi0i8Napn3RZi.FgAIi/K	\N	11	2026-08-09 04:27:25.694	2026-08-09 04:27:25.694	\N	\N	\N	Aktif	Manajemen S1	+62895700887431	t	\N
ca07c3b7-e56d-4298-a618-de31d6671169	Anindia Geisya Lauria	$2a$10$f97.2EbDjj5poL6jWOZ8/.4kZoNnYR0JQVIobwn4NvHlTsf0iEhTi	\N	11	2026-08-09 04:27:25.93	2026-08-09 04:27:25.93	\N	\N	\N	Aktif	Manajemen S1	+6285189951204	t	\N
17bf5aaa-8216-4fe3-955e-1a1a1522f920	Laila Nazifa Sanjaya	$2a$10$STZngj1jDAMnxaN6UX37XOb4bP.rjPTdiFU6Brpm3ImW7zO81lXSq	\N	11	2026-08-09 04:27:26.141	2026-08-09 04:27:26.141	\N	\N	\N	Aktif	Manajemen S1	+6285759177652	t	\N
7c8c1b9c-f8d6-4024-92b2-4cae6e6aa8b5	Saepul anwar	$2a$10$03N5iHBTF7S4BwjMxgQPCe34BJeeMqKXnadIfhMEx8/LhZqEur/K.	\N	11	2026-08-09 04:27:26.857	2026-08-09 04:27:26.857	\N	\N	\N	Aktif	Manajemen S1	+628561404113	t	\N
3cebe196-81a6-4da8-8d2b-deaeb834c81e	Salma Fauziyyah Firdaus	$2a$10$TZcdk79ihGV6rcLeCf2mxOpUkk6LphcpuFNc8zDc9shCy5dneIjOi	\N	11	2026-08-09 04:27:28.316	2026-08-09 04:27:28.316	\N	\N	\N	Aktif	Manajemen S1	+6285797295168	t	\N
9d55d39f-7c6d-4619-ab8d-ca71ce7db705	Lukman Hakim	$2a$10$eJGyzMp5JAkBxd3HgvqUwuZQK96yq2quGsfPLQU18e22QI.W3iuAy	\N	11	2026-08-09 04:27:28.534	2026-08-09 04:27:28.534	\N	\N	\N	Aktif	Manajemen S1	+6282119092783	t	\N
cd8c68e6-1063-468f-aa85-a55ec27ec598	Mesya siti nuralia	$2a$10$rdf/i.0BkzcKNE/YXNe5dOEXDtfD2BbM1F51E/uoxwdGm4GNtgsES	\N	11	2026-08-09 04:27:28.727	2026-08-09 04:27:28.727	\N	\N	\N	Aktif	Manajemen S1	+6282219712650	t	\N
a6986884-d5d3-4986-ae8e-a0fcd080e095	Melisa Febrianty Effendi	$2a$10$xhc6WKQgKrN/QtdxebkU5.OOA5nBP2ETFx2dtdoqLCZ8KGgWlAgzS	\N	11	2026-08-09 04:27:28.91	2026-08-09 04:27:28.91	\N	\N	\N	Aktif	Manajemen S1	+6289646841703	t	\N
8ee64765-5e45-46cd-a890-b238115ca710	Bilhaqqi Kitabullah	$2a$10$B0TSZ9gGdPAiN8mgkqrTLen3YrMbw1H.68Fgw8cpJGqTpFhkzb8fy	\N	11	2026-08-09 04:27:29.1	2026-08-09 04:27:29.1	\N	\N	\N	Aktif	Manajemen S1	+6283849025045	t	\N
4ab19bc5-8659-4dbd-ab55-c673e955db4f	Muhamad Rizkal Jatnika	$2a$10$/URLh8fRsDogSsFxvPkzrOG1LJlbhpGBxacrHT1x8ylRPPRsNzIzy	\N	11	2026-08-09 04:27:29.287	2026-08-09 04:27:29.287	\N	\N	\N	Aktif	Manajemen S1	+62895617526772	t	\N
4b97dadc-cf58-420f-99b2-a90b2bab165b	Rio Islami Pasha	$2a$10$ddDd/3OypYVd8gjBSCzGfOU1CxMp1zLbtSuhvKVryUX4onUVjH1p6	\N	11	2026-08-09 04:27:29.963	2026-08-09 04:27:29.963	\N	\N	\N	Aktif	Manajemen S1	+6285872823913	t	\N
e2b40693-e209-4087-bbb1-3c5a667de896	⁠Devan Elka Raihansyah	$2a$10$lCfu.I3ky5PKpDKWeXrnEOBYziL5SucDku3tla6qXfrHdiWWhcXa2	\N	11	2026-08-09 04:27:30.157	2026-08-09 04:27:30.157	\N	\N	\N	Aktif	Manajemen S1	+628973142285	t	\N
4f8216e0-09cc-4505-8f1b-2ecf0db52061	Darrell Rafif Rizky Ramadhan	$2a$10$TppzYq0n5kzz1S05cFnEOO6/TWR7Be9ukknP22fBKg.yYzKzVEQvm	\N	11	2026-08-09 04:27:30.343	2026-08-09 04:27:30.343	\N	\N	\N	Aktif	Manajemen S1	+628818366327	t	\N
4f69506c-f213-4452-96f4-0be070f697fc	Giandhika Bambang Supriatna	$2a$10$b/pAdV08IC1TU7obI1QW3O/WMoAfXdtLmhJolRfVa.lolW4bJn07e	\N	11	2026-08-09 04:27:30.76	2026-08-09 04:27:30.76	\N	\N	\N	Aktif	Manajemen S1	+6281395481402	t	\N
ea12a835-76a9-4746-ad29-f30dbceba2a2	Vera Cornelia	$2a$10$QzPY3tZ9MZT0IRBFWJSs4ur.kAw5KnnROZk7Go8llCFidn69FWYha	\N	11	2026-08-09 04:27:32.2	2026-08-09 04:27:32.2	\N	\N	\N	Aktif	Manajemen S1	+6282158665230	t	\N
d5204a7b-5e1b-4558-867b-7bcf10ab259f	Afifatul khasanah	$2a$10$/1Q7sfqerZps/JOXD2UT1ePoNDQQPtfB5i17crKuJMW7XzuWM2fRm	\N	11	2026-08-09 04:27:33.435	2026-08-09 04:27:33.435	\N	\N	\N	Aktif	Manajemen S1	+6287754486452	t	\N
b3921bb0-c5e8-4143-b105-606e94b58ae1	Sofia Dafa Fadhilah	$2a$10$T8dBFz75WaQwFubCQrkd8uzTlvoGzv6Ii4Qfr.AdONcsiHD8C3vLm	\N	11	2026-08-09 04:27:34.097	2026-08-09 04:27:34.097	\N	\N	\N	Aktif	Manajemen S1	+6285174164181	t	\N
600bdde0-6555-4511-a2de-1c2794af1601	Annisa Octavia	$2a$10$VFnXESZas1c.GnNkgp1rtusSCJ5ZF1Mz08WiZElIShDEHKmrwX6q6	\N	11	2026-08-09 04:27:34.35	2026-08-09 04:27:34.35	\N	\N	\N	Aktif	Manajemen S1	+6285795181569	t	\N
294f2855-73fa-4e3f-823a-69556f619a51	Salwa Nur Fadilah	$2a$10$UtiP2e2uzGnlHTfai00vZug26fijEU1zBbdVlPzIB7TmC9fdMmvp6	\N	11	2026-08-09 04:27:36.116	2026-08-09 04:27:36.116	\N	\N	\N	Aktif	Manajemen S1	+62895358490228	t	\N
9593bc17-89ac-4966-b93b-c590bd22b427	Ester Intan Sinurat	$2a$10$7R8gQf/dxqiGCvfP6v2DA.J2loGfs4cKKrs4RjuhK7PHxm0Z7h/bO	\N	11	2026-08-09 04:27:36.75	2026-08-09 04:27:36.75	\N	\N	\N	Aktif	Manajemen S1	+6283895345440	t	\N
fe10b4f8-68f7-42a0-b3c6-a4d3fb886d11	Nadiya Nur Fauziyah	$2a$10$0CS1IQ.PsIon7hAiu3oE/.AveDC69fRAGt9SNtbTIiqjU7f42J4ti	\N	11	2026-08-09 04:27:36.953	2026-08-09 04:27:36.953	\N	\N	\N	Aktif	Manajemen S1	+6281313804028	t	\N
c2bc6957-9816-4cf7-a33a-82ba436f813e	Nasya Destianti	$2a$10$aZEJZgFE1LDv7SG3jj4nKOUQTkt1t9noayXvlpcbFkqAQD6BQrg2O	\N	11	2026-08-09 04:27:37.433	2026-08-09 04:27:37.433	\N	\N	\N	Aktif	Manajemen S1	+6285795533802	t	\N
0900bdbd-11b2-409b-ac43-789664288b2d	Naillah Izzaf Rahadatul Aissy Gultom	$2a$10$HREPR1esV7vGJW7v3ThPQu4snvmVtXFLI6fZS5LlDvZlyO96hTste	\N	11	2026-08-09 04:27:37.894	2026-08-09 04:27:37.894	\N	\N	\N	Aktif	Manajemen S1	+6281319030001	t	\N
11e4d026-9c1d-4301-88ab-8ead9c712656	Farhan Musthopa	$2a$10$QsLzqMakIVhfxLIBlbpUkuufILQuciBuuy8w1q83Ny2wrhXHjZPCC	\N	11	2026-08-09 04:27:38.15	2026-08-09 04:27:38.15	\N	\N	\N	Aktif	Manajemen S1	+6281223670035	t	\N
41020309-15f8-4339-a214-da900e3c71e0	Alma Sri Maharani	$2a$10$ApaogAdb4sNUJIOUgoiEwuLuNhQujSevdXggf2V1m04kaJGbEcRaa	\N	11	2026-08-09 04:27:38.723	2026-08-09 04:27:38.723	\N	\N	\N	Aktif	Manajemen S1	+6285722154395	t	\N
2020b648-5724-4156-ab23-6cab4ebea46c	Rasyidah wardani	$2a$10$syWZN59UuAIpcCZUxa2pJepxPrz/d0p9NUMBr6Wk9dHhN8lFVbmAa	\N	11	2026-08-09 04:27:38.974	2026-08-09 04:27:38.974	\N	\N	\N	Aktif	Manajemen S1	+628996064729	t	\N
f6dea3d2-61de-4da8-8b57-585135ab5e4a	Eva Nurmah Salsabilla	$2a$10$xR9Ifo2Baqkh7xOCBd64L.WxakrcCosxoeFbIKmGCFoL3LTNXVQW6	\N	11	2026-08-09 04:27:39.214	2026-08-09 04:27:39.214	\N	\N	\N	Aktif	Manajemen S1	+628889368346	t	\N
678e6e47-65b3-4760-bbc4-b7338d0eb03e	virgi triharyandri	$2a$10$TK8y78LNwQh5kfQEzbFfmebKO7prKzJipukGk6VTwxesChp.Rul62	\N	11	2026-08-09 04:27:39.45	2026-08-09 04:27:39.45	\N	\N	\N	Aktif	Manajemen S1	+6288291330000	t	\N
64e3b91d-4c58-41ab-8d59-72775e76a048	Ariq Ghassan Fadhillah	$2a$10$PIM8jm9uT9jdjxWoJpbOCOFNDLOTtoIVhS10R3LXW5XIY0sHvmgPe	\N	11	2026-08-09 04:27:40.807	2026-08-09 04:27:40.807	\N	\N	\N	Aktif	Manajemen S1	+6285795196508	t	\N
e4866a88-9060-4002-9496-462cefe6692e	Muhammad Rizqi Ramadhani	$2a$10$pnojWGpKGyNvbN5i.0o4qOe10FJJPR8LRagzxJwqDEcckMC1ipnr6	\N	11	2026-08-09 04:27:41.035	2026-08-09 04:27:41.035	\N	\N	\N	Aktif	Manajemen S1	+628995125554	t	\N
221d9274-2358-4e81-8a13-06bd97494bf8	AMPRI PRINGGO W	$2a$10$zbfgoOvx0seCRjJbGXvam.1PiX89vZgKxenvXd7uroGuzWsWYk3nK	\N	11	2026-08-09 04:27:41.276	2026-08-09 04:27:41.276	\N	\N	\N	Aktif	Manajemen S1	+6282258665540	t	\N
10790eac-b6df-4679-a529-21ea7dd33854	Fani Andini	$2a$10$hHnqhNnooLZttM5ZhPvw5OfWeZShWjGCd/BZRUPkQhUuSt7nErVdC	\N	11	2026-08-09 04:27:41.997	2026-08-09 04:27:41.997	\N	\N	\N	Aktif	Manajemen S1	+6282318183722	t	\N
e5a6e324-3325-4573-9901-184aa1889eb3	Sukma Cahaya M	$2a$10$GFZKp3IV0UrMHrVzK89vZ.WlRjJ3KHyyqkdjZ1pIGchTgg0GAVAkS	\N	11	2026-08-09 04:27:42.24	2026-08-09 04:27:42.24	\N	\N	\N	Aktif	Manajemen S1	+6288220934370	t	\N
c45f150d-b509-4dc1-92a9-399764f2e470	Maylia Kristiviani S	$2a$10$M4fbQOPyCaMT78OEoJReqOxyU32.5XRsyAGbDj5kaaKVDTryxCw8G	\N	11	2026-08-09 04:27:42.463	2026-08-09 04:27:42.463	\N	\N	\N	Aktif	Manajemen S1	+6282319283427	t	\N
98cd0f03-5b93-4878-b94b-f9ee68f8ebf3	Willyam Immanuel	$2a$10$cnRfPRDUam2zlUMqy8usQOrlL6uVDZ9IbfZkSEkXC4idCm3288M9O	\N	11	2026-08-09 04:27:42.726	2026-08-09 04:27:42.726	\N	\N	\N	Aktif	Manajemen S1	+62857975191	t	\N
446d8c14-49a2-495d-9e7e-cf45054ae0ef	Annisa Rafa	$2a$10$wgjqO6nQ1wX.fh7NkRPYQOvbLJvNSQsm1osh5sOuTBjJwX84YoAjG	\N	11	2026-08-09 04:27:42.982	2026-08-09 04:27:42.982	\N	\N	\N	Aktif	Manajemen S1	+6285863001647	t	\N
2b9a95e4-71ba-44ed-a03a-7c15715c9713	⁠Azwal Dimas	$2a$10$IFIfuvECBl/ChQ/CwI8zsuHTd6siak8MVaMol4cgAM.NkW/KVZEuC	\N	11	2026-08-09 04:27:43.188	2026-08-09 04:27:43.188	\N	\N	\N	Aktif	Manajemen S1	+6283156658230	t	\N
532d0e29-6dad-411b-8cf9-f86bdeccbb88	Pengurus RW 04 - Kel. Dago	$2a$10$IrYzXor5ILy8GfN37IgjKOvcZbsP8f.nxSEn7xvKEPhP3yDuiiAhq	\N	5	2026-08-09 04:27:43.62	2026-08-09 04:27:43.62	\N	\N	\N	Aktif	\N	+628380004	f	\N
af9d7538-4002-4a86-9172-afad1967f47d	Pengurus RW 09 - Kel. Dago	$2a$10$Z9Y4Of9.QOf3Hk5jQwmy.O8U7LFXkfeJQ3Z0Amen5iAmq/Ea4whx2	\N	5	2026-08-09 04:27:43.796	2026-08-09 04:27:43.796	\N	\N	\N	Aktif	\N	+628380009	f	\N
787de5bc-8837-4b47-8012-80a823a8b068	Pengurus RW 10 - Kel. Dago	$2a$10$AfsjLoRYBSnmm6d3ozp32OnRRdzJ2PvgEk1g9Dh.O7MfS58Zoh8ce	\N	5	2026-08-09 04:27:43.962	2026-08-09 04:27:43.962	\N	\N	\N	Aktif	\N	+628380010	f	\N
88d50d98-da69-43e7-ac7f-39609ac8cbf7	NAZWAIASHA ASYURA	$2a$10$V0lRIcUtUSVpY9mFo.X6jeRgzKW8nghhiGmzpIcarGUpiXO/gbPoe	\N	11	2026-08-09 04:27:44.19	2026-08-09 04:27:44.19	\N	\N	\N	Aktif	Manajemen S1	+6283116984764	t	\N
9aecde92-7e04-41bf-95b3-dbd8d68b7bdc	Dewan Noel Jonatan S	$2a$10$WpPX0bX/z.5sU4.gXBYMr.K3A.490GLaz3f88e5uzli6tc3GikZTW	\N	11	2026-08-09 04:27:44.407	2026-08-09 04:27:44.407	\N	\N	\N	Aktif	Manajemen S1	+6281282645771	t	\N
f173cb53-34f0-42b6-84e6-abf26d938cc0	Didan Nugraha	$2a$10$cubCHwGc8NW1CTe8cPPjYOoxWPkFN83yDH8jmgA36kPy21/P1KY4.	\N	11	2026-08-09 04:27:44.617	2026-08-09 04:27:44.617	\N	\N	\N	Aktif	Manajemen S1	+6281224153036	t	\N
4451b020-8ef6-4b65-b17f-a6cc399b198f	Najma Mutiara Jasmine	$2a$10$FXkbAYiRDgo8OByEm3ssCOz3/RVGOaTDylYEEoE9wP2ivN5ib6o3C	\N	11	2026-08-09 04:27:44.823	2026-08-09 04:27:44.823	\N	\N	\N	Aktif	Manajemen S1	+62881022832251	t	\N
3f18ee5e-f027-40cf-bfd1-b79f4e5a48bb	Olivia Pebrianti Sihombing	$2a$10$/Yi6MF29wm/ayiIr2/uysOuLdENXfEvDimOHiazkt1f/rupUhgYbG	\N	11	2026-08-09 04:27:45.037	2026-08-09 04:27:45.037	\N	\N	\N	Aktif	Manajemen S1	+6287827619437	t	\N
b4cd0b79-de3f-443c-975d-a49b9f01deff	Litan Mardian Saparini	$2a$10$fNOIchbjGbex/cbrpSEdQe9unEiHhXQWlYHDHxDTx5k6eKvC9eSi2	\N	11	2026-08-09 04:27:45.247	2026-08-09 04:27:45.247	\N	\N	\N	Aktif	Manajemen S1	+6283148289991	t	\N
9dec4a83-3e4c-42d5-9339-a61c3fc8195f	Sianipar Rianti Debora	$2a$10$WFpL/9SgYUZBGKakZHLbBeuYhz7fbp8p1tJe0rH0/Z7vtrFMguCYS	\N	11	2026-08-09 04:27:45.447	2026-08-09 04:27:45.447	\N	\N	\N	Aktif	Manajemen S1	+‪087711796723‬	t	\N
f1cbc227-975b-4d9b-b30f-e33eb8afa49a	Suci Alpi Yanti	$2a$10$np.m7EnVFDqHLhhFkkCpNuUvWzCt5GqVDSTXyAK7FrwCa4chTXISK	\N	11	2026-08-09 04:27:46.52	2026-08-09 04:27:46.52	\N	\N	\N	Aktif	Manajemen S1	+6289507903585	t	\N
ec3b3984-f470-45fb-9f20-29b7c34c346a	Nabila Cecillia Putri	$2a$10$T4pKQzOHK/bq7SFNknUH9OLjDaoK0ZVPXjcDfwNlmG1K8R/SQqqBO	\N	11	2026-08-09 04:27:46.745	2026-08-09 04:27:46.745	\N	\N	\N	Aktif	Manajemen S1	+6282353630640	t	\N
8987c28a-7d72-4305-93f8-31bf363e2263	Nabilul Kafi	$2a$10$VcSw5LnoYdqrqf7pE47I9.OnZxJ6rUtX7.LfG6eVNFzHT5OuvCNWq	\N	11	2026-08-09 04:27:46.961	2026-08-09 04:27:46.961	\N	\N	\N	Aktif	Manajemen S1	+6285189951112	t	\N
726fb640-d2d2-4024-bb5d-412f548f3a2d	Melly Amelia	$2a$10$FndtKpbqnRkxGz6CcgO7zOokG1W90R89g9KHteYr9A4.3bx28gt9W	\N	11	2026-08-09 04:27:47.181	2026-08-09 04:27:47.181	\N	\N	\N	Aktif	Manajemen S1	+6281311800184	t	\N
34430fca-95f0-44d7-9390-5a128ed7a135	Muhammad Faiz Gunawan	$2a$10$YTSH5qreWjCrvELeRkidq.CI3aMyU/9XDCDSB4/aDHbrVBl7W2yTi	\N	11	2026-08-09 04:27:47.922	2026-08-09 04:27:47.922	\N	\N	\N	Aktif	Manajemen S1	+6281293136429	t	\N
9bea2ea5-2991-4bfb-a1d7-f3c7a82b13e8	Reihan Razaka Permana	$2a$10$MQ.ShKDBCjpXfjWXHCBYLOdI9Lc.Fl0eQNWCD5FylzYQhRi22vyrG	\N	11	2026-08-09 04:27:48.41	2026-08-09 04:27:48.41	\N	\N	\N	Aktif	Manajemen S1	+6287717798568	t	\N
44159a5e-e8c5-4e34-9859-5640fc5c02c5	Vallent Ferdinand	$2a$10$O8Qn5.65CgMC77cdad5Jq.KLkaaNf2RE8AOEfddg1WULLEBz/CsZ2	\N	11	2026-08-09 04:27:48.889	2026-08-09 04:27:48.889	\N	\N	\N	Aktif	Manajemen S1	+6287715776714	t	\N
6b29aa62-edfd-45e1-80ea-c04643f3cea7	Imanuel Steven Djauhari	$2a$10$VXYWRlKhL4D3bzRdy8HdSeLkkJVozAPqsyFlVOQRnD25sOZmdljzq	\N	11	2026-08-09 04:27:50.48	2026-08-09 04:27:50.48	\N	\N	\N	Aktif	Manajemen S1	+6285945315016	t	\N
92bde298-1ee2-4b6b-9b46-ccb16c54c2b2	Fadhil Ghoufar	$2a$10$48u31aLMfSIqrWkr9YysQ.ZC9WmC23tt1dA.V7giSWsgJegFOr7uy	\N	11	2026-08-09 04:27:51.883	2026-08-09 04:27:51.883	\N	\N	\N	Aktif	Manajemen S1	+6285755985220	t	\N
45176547-be23-4293-b94a-994d9dc29ef8	Nayla Irdiana Pratiwi	$2a$10$8s.CBKs5tTy1XOmiNe7xj.nI4v7RTgKsKtKyDPtP4bMTb//93AA36	\N	11	2026-08-09 04:27:52.097	2026-08-09 04:27:52.097	\N	\N	\N	Aktif	Manajemen S1	+6281224533255	t	\N
d6860353-f1ae-47e3-aaec-bb19a29496e1	⁠Alfira Ramadhaniar Diniyati	$2a$10$ps345vzVzfGfEoUib3Cw8OB36K8YT2LQez5ZKAwx85SpXI9BaWzSm	\N	11	2026-08-09 04:27:52.308	2026-08-09 04:27:52.308	\N	\N	\N	Aktif	Manajemen S1	+6282246474166	t	\N
5935ae0b-1dfa-43eb-9305-c35d2fc169eb	Muhammad Reyhan Abdulgani	$2a$10$rgcQU5YrXwuPTntl/CAWD.XrjoqOhDHP2lmYQ3/4V1P7q7JwYu0.K	\N	11	2026-08-09 04:27:52.535	2026-08-09 04:27:52.535	\N	\N	\N	Aktif	Manajemen S1	+6285692830244	t	\N
0556f503-96ad-4a44-9cb1-252b66532712	Tubagus Azman Pauzan	$2a$10$/chBcDwWD22Ewtm/EzEwxug3ADpXv0QTuGifiajTv4gSTjftduDe2	\N	11	2026-08-09 04:27:52.72	2026-08-09 04:27:52.72	\N	\N	\N	Aktif	Manajemen S1	+6285155375885	t	\N
341737c3-1026-4477-bc3e-02978b7c3932	Fadhilah Aisya Nabila	$2a$10$b8QPi2KYyOVLVtiTZW2NnOkFUnMSNnWKDb2Eo2sHtbXhDmeYee9DS	\N	11	2026-08-09 04:27:52.944	2026-08-09 04:27:52.944	\N	\N	\N	Aktif	Manajemen S1	+6281276236978	t	\N
c4406dd2-d87f-4a62-98ed-8e633fb26791	AKBAR	$2a$10$15Pc3DJ9V0gVR4ke2OnjbOFhQKeRlUEJu4yuEc7TdxOcFkqo/f9LC	\N	11	2026-08-09 04:27:53.138	2026-08-09 04:27:53.138	\N	\N	\N	Aktif	Manajemen S1	+6285757487725	t	\N
ca74466b-ce74-4aa8-979c-fd3a2d8cf316	Pengurus RW 07 - Kel. Dago	$2a$10$xyR.mU/77/xfRpbRiFGKq.RDQHW44fpiXITbKj0Us3xw65.1cEQWO	\N	5	2026-08-09 04:27:53.334	2026-08-09 04:27:53.334	\N	\N	\N	Aktif	\N	+628380007	f	\N
9447318b-1c9f-4436-a89c-a397f8d1fa65	Pengurus RW 08 - Kel. Dago	$2a$10$fp3/3o0Rpjp.W.XtelF0dumgJIli3wL3xnVzXZ9UyWthZmOUGsN9O	\N	5	2026-08-09 04:27:53.5	2026-08-09 04:27:53.5	\N	\N	\N	Aktif	\N	+628380008	f	\N
4217872e-83be-48e9-a2e5-c9f58eb8d22b	Ahmad Morenno suliawan	$2a$10$7R1Py0Fr4EwBghB0KPjWneU4ScewiQRlgYxpSMJK4OXSR4lTmyFlG	\N	11	2026-08-09 04:27:53.899	2026-08-09 04:27:53.899	\N	\N	\N	Aktif	Manajemen S1	+6281293072550	t	\N
204fe0e1-cfbe-48f7-a00e-8a4a411dccdc	Ester Hasianna	$2a$10$T0uCBMYT.eKMt3n6uDo13u0iQmMa68a85Gzu8Iq5out4hQcyE9Elm	\N	11	2026-08-09 04:27:54.082	2026-08-09 04:27:54.082	\N	\N	\N	Aktif	Manajemen S1	+6282219556950	t	\N
742eb361-1fd8-4cc7-b6d1-d3d82dc5a72f	Bellamida amanda putri	$2a$10$VzzR795oKoIzHGab.zXLnOo6I8gcjI0D8w/Tw24YGOcNZIy/WAAuG	\N	11	2026-08-09 04:27:54.326	2026-08-09 04:27:54.326	\N	\N	\N	Aktif	Manajemen S1	+6281372526217	t	\N
f47d1167-0bd1-4486-9ee5-3971c8f97753	YESSIKA VITRIA WATI	$2a$10$hD1UeuWn3iNZTVY13cGUwOmN69LHZ7HVbRkm0N36XusEE/rW8WynG	\N	11	2026-08-09 04:27:54.524	2026-08-09 04:27:54.524	\N	\N	\N	Aktif	Manajemen S1	+6285654051690	t	\N
680e3deb-7938-4cfb-ae2e-c5b48a1c41c6	Hasna Putri Fadhilah	$2a$10$bvhINH1hB3kF6mk1QU5KPOl/VnsEnEcwlo5eBq3iYrtlTWnWbi6kq	\N	11	2026-08-09 04:27:56.274	2026-08-09 04:27:56.274	\N	\N	\N	Aktif	Manajemen S1	+62881022108729	t	\N
47043722-a76d-42f7-a62e-2738a6dc81ab	Rafly Isyandie	$2a$10$.u1Vc2atSbJvclMJ2OXU3Oc495mnJlXOwlpo61KypHk1AGnS.xHkW	\N	11	2026-08-09 04:27:56.469	2026-08-09 04:27:56.469	\N	\N	\N	Aktif	Manajemen S1	+6282246461248	t	\N
59ab1e52-d003-406f-a131-b7db3dbdb5a5	janet nur afifah	$2a$10$j7g0qoBkNtgnLEto.GLWI.tpAamriuGtWRaaKLoqr99Hv2hG/Tudq	\N	11	2026-08-09 04:27:56.659	2026-08-09 04:27:56.659	\N	\N	\N	Aktif	Manajemen S1	+62881023218517	t	\N
7b3e997f-1f27-4f9d-b5fe-d3086818d436	Sofie Aprilia Putri	$2a$10$92j8yCeJk4KpLC/3Mk/vLug/lIISNp5q7U9ONV5lQXzRVwChKV16S	\N	11	2026-08-09 04:27:57.296	2026-08-09 04:27:57.296	\N	\N	\N	Aktif	Manajemen S1	+6285722573334	t	\N
06087251-d16e-4141-85be-60bb3e03dbfb	Zahra Akhrian Widiani	$2a$10$xmOuA2k2l3cYgMOB/VfW.eoDkwug4J8uA9CkjpffxeKqhNmr7pn0a	\N	11	2026-08-09 04:27:57.496	2026-08-09 04:27:57.496	\N	\N	\N	Aktif	Manajemen S1	+62895338661228	t	\N
6cb73847-5822-4d72-929b-db5ec4f9e13b	Meisya Triphosa	$2a$10$ncIzDjLfD.xrqyaVINMGsumN8.cfq1y0SPXS0TmWqe.YSlXg4LsRC	\N	11	2026-08-09 04:27:58.692	2026-08-09 04:27:58.692	\N	\N	\N	Aktif	Manajemen S1	+6285862845702	t	\N
4fc23037-0685-4dcc-87fc-0790cadea767	Dea Syafira	$2a$10$4bH5oXqV7.VKVW5N0AW36OeWyA3Gwe6OwwbWalLkteHuZDOTCanqy	\N	11	2026-08-09 04:27:45.888	2026-08-09 04:27:45.888	\N	\N	\N	Aktif	Manajemen S1	+6287717192033	t	\N
d5dad548-bbce-41b9-83c0-ddbbe51f6ee3	Desi Rahmawati	$2a$10$ZDjQREDzfoRj9Exmdfbdt./MK5uj2rHTKrOg7iiVzp1BQgAZPflmi	\N	11	2026-08-09 04:27:46.108	2026-08-09 04:27:46.108	\N	\N	\N	Aktif	Manajemen S1	+6282111139288	t	\N
a2a8389a-2df7-4238-890b-95c8f247bf48	ghevania ramadhani	$2a$10$ND2B3/wYBmhqdnRE5zOtQ..1ve5FEJGwhS09ve4oaQy/Qt6SodXuG	\N	11	2026-08-09 04:27:46.312	2026-08-09 04:27:46.312	\N	\N	\N	Aktif	Manajemen S1	+6285703177882	t	\N
4ce33363-620f-4807-a9f5-4459b0e530e4	FERDI RIZKY RAMADHAN	$2a$10$3AJfOHwWYQ7VI4qY2waTfeNmm9Nfth4v7D0HkV5QT2G/fXF0GiM1i	\N	11	2026-08-09 04:27:47.438	2026-08-09 04:27:47.438	\N	\N	\N	Aktif	Manajemen S1	+6281220625671	t	\N
b0f0a80a-aec1-40f2-8a68-54a44e9dd734	Andhika Putra	$2a$10$aMJXg9xRcBmMvat8i2Oi9.YkTzGbgWzRukZK46quIYfNGQ0.EUmWO	\N	11	2026-08-09 04:27:47.672	2026-08-09 04:27:47.672	\N	\N	\N	Aktif	Manajemen S1	+6282240299206	t	\N
eeec278a-558b-4abf-b117-af10d4ba5595	Natasha Greciella Rahma Zahira	$2a$10$LvzO3W7RmqGBbmoA3GPcfuHDyue9sHE1oaDMQ6Hjce.TO77MPBdIa	\N	11	2026-08-09 04:27:48.168	2026-08-09 04:27:48.168	\N	\N	\N	Aktif	Manajemen S1	+6289678280308	t	\N
0a22831f-f769-4a5c-9037-9b42ad7ecbf7	Hafidz Dwi Putra	$2a$10$DZn8mS9LYA8DB3JyhdVkfO.JnKNWFrzo2WMlGjV4mGi4kOTRaIhJe	\N	11	2026-08-09 04:27:48.664	2026-08-09 04:27:48.664	\N	\N	\N	Aktif	Manajemen S1	+6281462216348	t	\N
f8a503b3-4934-468d-ad0c-d815e47f49de	Abyan putra	$2a$10$rQ5NZlS/UfbYU1W7dggH5uNDAoqoSKO7MIBCKD0oZWAI4DV2ZKbFy	\N	11	2026-08-09 04:27:49.112	2026-08-09 04:27:49.112	\N	\N	\N	Aktif	Manajemen S1	+6282116321702	t	\N
2dd08e49-1cdf-411b-b286-a6e0f35696e7	DIMAS ABIMANYU	$2a$10$4RosUtFT3R2dICAz3wd46ueV7omZBA6O.3cKLqoZiKQWPaHflTjwS	\N	11	2026-08-09 04:27:49.347	2026-08-09 04:27:49.347	\N	\N	\N	Aktif	Manajemen S1	+6282176610429	t	\N
ae528518-357d-4425-b628-7a1199a51708	Lutfi Bahtiar	$2a$10$PJpr1mtRzSQiCyr4AGqhsemYFa5Yn/zZA9TNnRYIbXZzjZ2C4lXcK	\N	11	2026-08-09 04:27:49.614	2026-08-09 04:27:49.614	\N	\N	\N	Aktif	Manajemen S1	+6283165567309	t	\N
70113d02-686b-4f38-8c67-bfa6b0c1410d	Fira sabrina setiawan putri	$2a$10$76ovl4WVfY83SdNzSshWHu7UXM0Ds6NH.lvQPx9aKibFYZ1TS9Wgu	\N	11	2026-08-09 04:27:49.84	2026-08-09 04:27:49.84	\N	\N	\N	Aktif	Manajemen S1	+6285351014171	t	\N
2402065d-e490-4e42-a3db-c703f22b9297	Varel Yosephin	$2a$10$lgXEWA0IDqkqvqSwcM2ZxuvaIrObQIsU.x4qVNDj1eEUtn/5GvmnS	\N	11	2026-08-09 04:27:50.051	2026-08-09 04:27:50.051	\N	\N	\N	Aktif	Manajemen S1	+6283101438384	t	\N
12dde950-15ed-49ac-8f71-5b38324170ad	Marcellino Gerrard	$2a$10$HKZbx8JB0OQMQycgQh5vrOgWLrCAEhwVC2mIITn3H4wF2FQYdbFN.	\N	11	2026-08-09 04:27:50.287	2026-08-09 04:27:50.287	\N	\N	\N	Aktif	Manajemen S1	+62895422514414	t	\N
52d6b1a7-a447-40c6-bfc9-8f2717857190	Ananda Daffa Fauzan Hendayana	$2a$10$y9r2yAO3Ea058Ulk3wsP5erduEwYDQGDRGWLtV8.fqIsxur3RA5t2	\N	11	2026-08-09 04:27:50.678	2026-08-09 04:27:50.678	\N	\N	\N	Aktif	Manajemen S1	+6285624036958	t	\N
0977cf86-5e43-4471-b920-ea34ace918fa	Farrel Aulia daniswara	$2a$10$PCF1Wsx75RJkol4UVyOqEez6kM3DCHQg8GpwiYd4jao0/tavSUxyy	\N	11	2026-08-09 04:27:50.88	2026-08-09 04:27:50.88	\N	\N	\N	Aktif	Manajemen S1	+6281547620005	t	\N
e2e5f3ca-b3cb-41f1-a9eb-c4fd8025389d	Wanda Shaumia Muthmainnah	$2a$10$Nv7ICUzq7qi2iA0iMUWxueq/GMAwSpGNRqL3YL/6SUXSqJNv9A5YS	\N	11	2026-08-09 04:27:51.069	2026-08-09 04:27:51.069	\N	\N	\N	Aktif	Manajemen S1	+6289604552149	t	\N
f9701643-e4ab-43ad-9b96-6056b5dfd999	Trimay sarah	$2a$10$6Bv6jSG399BocwCW.Q17KeDMxh9xh8Bm//1xRC7xKQ/1ifoinWcr6	\N	11	2026-08-09 04:27:51.274	2026-08-09 04:27:51.274	\N	\N	\N	Aktif	Manajemen S1	+628131675694	t	\N
41356cf7-ee8c-4524-88c2-e658b5abfebb	Adinda Aulia	$2a$10$hEYLyk4GrfJE61v4je5e7.Gd5Sw7ALV89qhNUUAn1B3KbPScP16d.	\N	11	2026-08-09 04:27:51.472	2026-08-09 04:27:51.472	\N	\N	\N	Aktif	Manajemen S1	+6289517043643	t	\N
32f72df1-18df-4184-8c0f-34230c944dca	Robyansyah	$2a$10$yisUXyItbJwnVjbbn6HC/eVOrk.A3V6OmKwS40XT2BLA2Hhml6VV.	\N	11	2026-08-09 04:27:51.672	2026-08-09 04:27:51.672	\N	\N	\N	Aktif	Manajemen S1	+6282297452725	t	\N
0e87e15a-7b9c-4762-a9dd-f885ae47353b	NABIL RAHMA PUTRA SUHENDI	$2a$10$eLJCKtYP3OShxYFIzq9JSeDU4vdyahXd47xbP2MPMnZ/7HWgw8Qt2	\N	11	2026-08-09 04:27:53.71	2026-08-09 04:27:53.71	\N	\N	\N	Aktif	Manajemen S1	+6281775467166	t	\N
3be55267-4247-48d5-8d10-3d5224f69557	Ilyas daud sirojul huda	$2a$10$IY2yIVMqC/JM1wEO8KOCdu2D/Ay122RN8bG46DCBz2YqOgUk1JkSS	\N	11	2026-08-09 04:27:54.728	2026-08-09 04:27:54.728	\N	\N	\N	Aktif	Manajemen S1	+6281394934993	t	\N
2f35dac8-e164-4134-9f97-1fbd08edf5b6	JAENUDIN SOPIYAN SANI	$2a$10$jNMAKtQtDfUaoiNL9eko6uNA3VMI5xDsByCkyu4D3BNBEaAl7BjBy	\N	11	2026-08-09 04:27:54.921	2026-08-09 04:27:54.921	\N	\N	\N	Aktif	Manajemen S1	+6283874417569	t	\N
b7880357-350a-4eba-8cd1-9fab07f089fd	bani haykal permana	$2a$10$3Eo9EakHxmyz6SyGUVXVJe5yTFls07KTqi5MNrS2GUb1ddSadfh2m	\N	11	2026-08-09 04:27:55.103	2026-08-09 04:27:55.103	\N	\N	\N	Aktif	Manajemen S1	+6283824585228	t	\N
8b3c8ccf-fdce-438b-8ddf-47f29de15730	RAYHAN DEANCARINDA SUPARDI	$2a$10$AwdsGq4CxCBAXbSTvT8t2ufL5BEbuHns195c5kl3Jr5ISve5Wn7jy	\N	11	2026-08-09 04:27:55.298	2026-08-09 04:27:55.298	\N	\N	\N	Aktif	Manajemen S1	+6281931712757	t	\N
04efc2f9-adcf-4351-acd2-78966953b508	Naufal Rabani	$2a$10$kXspPl48r43N1TFZQmX5deAC.TO6eUZHBeN3UOhgXYdMc9L.2Lvqe	\N	11	2026-08-09 04:27:55.48	2026-08-09 04:27:55.48	\N	\N	\N	Aktif	Manajemen S1	+6285934462167	t	\N
f0b22d26-6ec1-4718-a137-336d9b78014f	Launa Shafa Nadira	$2a$10$8Mw5PXJQ0YAU0YETnp8U1O9xea89YUsi3FzKTe/NaDgUSXdHkIeNm	\N	11	2026-08-09 04:27:55.69	2026-08-09 04:27:55.69	\N	\N	\N	Aktif	Manajemen S1	+6282128014219	t	\N
a14fc6d9-db8b-4c1f-970d-fcf0b34a27b3	Shofia Afiyatunnisa	$2a$10$w.I/hnWrX41HU.TthaPEeOcOolXkD1NcHMqziaR5M8zOvs3dtAfqu	\N	11	2026-08-09 04:27:55.88	2026-08-09 04:27:55.88	\N	\N	\N	Aktif	Manajemen S1	+6289636456272	t	\N
45548570-6fc0-4ef0-83ca-8b748ff835d0	NUR SYIFA MARYAM	$2a$10$Cqn68tCK6wq9HYwhhWYrN.JurabJ4yMEkRRzvSju7pTC3DpGqoHQi	\N	11	2026-08-09 04:27:56.073	2026-08-09 04:27:56.073	\N	\N	\N	Aktif	Manajemen S1	+6282126490757	t	\N
eadb9275-a2c7-436b-b95c-37c16f21ad13	Ajeng Eka Rahmawati	$2a$10$vpCCtq29bggepBDUqTWKtuXomPgfJJ9oRJ.9ziQ.ZSK5eKgxOeoDy	\N	11	2026-08-09 04:27:56.869	2026-08-09 04:27:56.869	\N	\N	\N	Aktif	Manajemen S1	+62895703172150	t	\N
9600fda8-cbe9-4b8a-bdf9-7eb1620ef92f	Najhani Farhatani Ats Tsaniyah	$2a$10$9RIF/y378ox4sljJ5MkR1e6eYBSRYnqQmUczGCc.1PhfXOnPTKSxe	\N	11	2026-08-09 04:27:57.07	2026-08-09 04:27:57.07	\N	\N	\N	Aktif	Manajemen S1	+6282126329827	t	\N
2bfdabfc-41ed-4c96-b09e-fa11617964c8	Raji Rafsanjani	$2a$10$t0o78vbZpz.fuGjf6qwty.jp5WYUw0SmBBZLHRFy/E4Uz7aLP0LBK	\N	11	2026-08-09 04:27:57.699	2026-08-09 04:27:57.699	\N	\N	\N	Aktif	Manajemen S1	+6285722401125	t	\N
4d953e54-ad68-4383-bcde-6d6d942f88bc	Ajang Gunawan	$2a$10$mdJb.iCn917hQtKJV9LSsu7FLSx9CFsdgSuJkcZctWlFESU4PxNUS	\N	11	2026-08-09 04:27:57.962	2026-08-09 04:27:57.962	\N	\N	\N	Aktif	Manajemen S1	+6281292690092	t	\N
46020e67-5598-49bc-96a8-ed0756c53718	Septian Muhammad Saputra	$2a$10$8rffG6uXrPclvA4RAXoINeTemzfKnGy7Ir1MBFZ9z.f7yLY7HA6AC	\N	11	2026-08-09 04:27:58.158	2026-08-09 04:27:58.158	\N	\N	\N	Aktif	Manajemen S1	+6282218910613	t	\N
a4d19f94-4cdd-4e75-9610-92178d3506a9	bintang syahruuramadhan	$2a$10$HATAoT9ksSuy9Ju.Q.4OZO7bIhMZf6s4.jZCdiIEbqQpv0TSVaaRy	\N	11	2026-08-09 04:27:58.334	2026-08-09 04:27:58.334	\N	\N	\N	Aktif	Manajemen S1	+6281214421750	t	\N
f8b3c0dc-d4bf-46dd-b799-237e7b47e223	Nayla Malva Manika	$2a$10$i.53MRAOyGIVRR68gU5mOeFWnXmzeb4kQaNPMw.IFUEAeobaR9S86	\N	11	2026-08-09 04:27:58.509	2026-08-09 04:27:58.509	\N	\N	\N	Aktif	Manajemen S1	+6287735522636	t	\N
509af13e-86ce-436a-82fe-bb690ea7373f	Revitha Lestari	$2a$10$BHu33AI1JjGBWEfmEG/uKeJhtXRgGOvCnh6gIHGyVUzmNZvTNyc6O	\N	11	2026-08-09 04:27:58.884	2026-08-09 04:27:58.884	\N	\N	\N	Aktif	Manajemen S1	+6281224793817	t	\N
7e104bb0-85a3-47db-bbd0-b7f13d41d1b4	Vira Nazwa Rianti	$2a$10$dxCrGt4tQoUfBTyleHR2le1nyobUvABrvgDiI9vLQ/TcXhthnPVJ2	\N	11	2026-08-09 04:27:59.071	2026-08-09 04:27:59.071	\N	\N	\N	Aktif	Manajemen S1	+6285603679106	t	\N
7b9206eb-ff83-4b66-8a2b-b421cb89a5c2	Ghaida Nur Qolbi	$2a$10$eZrNXZR5Ft3y2e102uB6AOmG3VecKja6oveereRGhdGFKX4TwfgKa	\N	11	2026-08-09 04:27:59.266	2026-08-09 04:27:59.266	\N	\N	\N	Aktif	Manajemen S1	+6281220084181	t	\N
7ae530d6-561c-4e74-9f68-146931fc3f24	Vanka Aulia Alfanda	$2a$10$Cks7cxcQ3z5RIIV9IU9D..dVYl/PAEI3Z8JittSQmScQRgB60rkUi	\N	11	2026-08-09 04:27:59.457	2026-08-09 04:27:59.457	\N	\N	\N	Aktif	Manajemen S1	+6282120101043	t	\N
9bbfccfc-8389-41f0-9d36-f4c922fbbeed	Enjel Cheriyl Ruitha	$2a$10$3ZcHvr/nX.AcHjqCqbR2S.tIbIuedwr7IRopMTzpcJ4fJeZBFLZju	\N	11	2026-08-09 04:27:59.65	2026-08-09 04:27:59.65	\N	\N	\N	Aktif	Manajemen S1	+6285759336603	t	\N
f05d652d-7eb5-4073-a848-e05c58cea828	DIKI HERDIANA	$2a$10$IIuIzIXJ.3GWv4Y7xb1Oje5.OAvie2fTWJinR4oGJSHChNKwmOb0K	\N	11	2026-08-09 04:27:59.824	2026-08-09 04:27:59.824	\N	\N	\N	Aktif	Manajemen S1	+6285864421367	t	\N
979e6c6a-29da-4902-b165-5b7363f037d6	HAGIA SOPHIA PUTRI SHANDY	$2a$10$nFSY/KUjZhAQJIBOflRbnOCr7ydTMxjaSt9TSTMT4K5YTypC5ih5G	\N	11	2026-08-09 04:27:59.994	2026-08-09 04:27:59.994	\N	\N	\N	Aktif	Manajemen S1	+6281285394545	t	\N
45cae693-b023-480e-9c4d-9702aa23cf18	Lexa Indriyani Sitorus	$2a$10$fcyxQ6lt1IFtFoXXJcbgIe4ijxrMoSMhDEGDtWx0mgRCWHIBtFsN.	\N	11	2026-08-09 04:28:00.204	2026-08-09 04:28:00.204	\N	\N	\N	Aktif	Manajemen S1	+6285212928423	t	\N
6cdd8491-5e2a-43bc-add7-59abb010c05f	Muhammad Ihsan Muttaqien	$2a$10$0GMlm6ffVAgHbfca2DDLOu31crh.RdQwnselq8Qp3YMrvE.ptqCQW	\N	11	2026-08-09 04:28:00.406	2026-08-09 04:28:00.406	\N	\N	\N	Aktif	Manajemen S1	+6282219910112	t	\N
fd0b06a4-f104-4cdd-8a18-3766826f146a	ARVIA ARDHIVA MAHARANI	$2a$10$ChJey.jicgFnXsRgtLG8aeqfyAm5NsA4lXl0HlEIpUwQH17OxN1E6	\N	11	2026-08-09 04:28:00.602	2026-08-09 04:28:00.602	\N	\N	\N	Aktif	Manajemen S1	+62882002534835	t	\N
8a4e81a4-aa83-4a7f-87a5-cc3af69a4d08	Ajeng Nur Fatimah	$2a$10$2826ey96SueOLMQ5v6uA.OqnHDEpG9JI8HWbd8er1EVgHBeukbTGK	\N	11	2026-08-09 04:28:00.785	2026-08-09 04:28:00.785	\N	\N	\N	Aktif	Manajemen S1	+6282262872564	t	\N
9975d08a-4190-42e3-9067-3b670a724d7e	PAGUH SANTOSO	$2a$10$LPcKEMYNZ2e8is6.YnpbLeqr9TCwBYjx6xr2LfHdMCCjLZ1rUau5m	\N	11	2026-08-09 04:28:01.01	2026-08-09 04:28:01.01	\N	\N	\N	Aktif	S1 Teknik Arsitektur	+6285283427117	t	\N
487550e9-fb2a-4ed2-a32c-bdd2b84ff243	Steven Cornelius	$2a$10$/YRt4cKCe8MC.vY1eG.nDu508PsyuKy8M7fSMS0/Z58IaKxnmX8uC	\N	11	2026-08-09 04:28:01.228	2026-08-09 04:28:01.228	\N	\N	\N	Aktif	S1 Desain Komunikasi Visual	+6282215880071	t	\N
85a48445-d7a0-4bf1-8d36-e8fb8ad53c91	Dewi Handayani	$2a$10$EiypXbSw8Kqb0H.D.VulE.P6tjhuwrDPBOFcc3hH.BjaoY1nBJX9.	\N	11	2026-08-09 04:28:01.446	2026-08-09 04:28:01.446	\N	\N	\N	Aktif	S1 Ilmu Hukum	+62895622055669	t	\N
142a9cf3-b788-4935-baf8-705f1dc4eec2	Muhammad Azmi Munadi	$2a$10$JgfrPcnmOtFK8WCChDILd.2JRj7VLGbglS987FJHBBDjgEAokhpzK	\N	11	2026-08-09 04:28:01.67	2026-08-09 04:28:01.67	\N	\N	\N	Aktif	S1 Sistem Informasi	+6282126043577	t	\N
b8ab62ba-9722-4c8b-9f52-0b6576bb014c	Theo bagus sofyan	$2a$10$zqbNUXNNt.sOD48NAzLzlOVUQ4hiFkUDftARTvwxkG4IerhaShdMC	\N	11	2026-08-09 04:28:01.86	2026-08-09 04:28:01.86	\N	\N	\N	Aktif	S1 Sistem Informasi	+6285700334921	t	\N
c623ab6d-93b2-4ca3-a7e2-7cb175f3b496	Harun arrosyd	$2a$10$l7wVKOahFf47r31q9qf97uVVxu8gVKc.c/yDYW4TENQmyKyPvcic6	\N	11	2026-08-09 04:28:02.084	2026-08-09 04:28:02.084	\N	\N	\N	Aktif	S1 Sistem Informasi	+6281809679880	t	\N
1ed9e0b3-8956-4215-9856-97a361468d95	Hana Husniyah	$2a$10$cj5WRuLc8j3Iabm2eDuEDez9gJ1vb12DHm7IvYzoiZ1OqcG8PrEWu	\N	11	2026-08-09 04:28:02.297	2026-08-09 04:28:02.297	\N	\N	\N	Aktif	S1 Sastra Jepang	+6282130567689	t	\N
c98e3196-7144-42e3-9ef7-9998874ad8b4	Ahmad Faiz arfan	$2a$10$e0jJh5P/xK0lCXXimzscaeWkSoRvgqNKDV8pw4.Cqr6qb44nRtUDK	\N	11	2026-08-09 04:28:02.518	2026-08-09 04:28:02.518	\N	\N	\N	Aktif	S1 Teknik Industri	+6282360763837	t	\N
1dc92216-abb0-457a-9b98-91867fc49345	Raja Maudia Farhan	$2a$10$ZpI3ZO4nYGxv6prghk0EAuxZgN8fqN3hw3op13D1nVYi1mEteqcZK	\N	11	2026-08-09 04:28:02.725	2026-08-09 04:28:02.725	\N	\N	\N	Aktif	S1 Teknik Sipil	+6281276746732	t	\N
18619d59-4460-4309-ad29-853f00a1e3cb	Ananda Fityan Syakur	$2a$10$9XhM8Q4D3JGS7E9wcqA2COBHjxshkqLydgQSJaYtYQLC1kJLoE6AS	\N	11	2026-08-09 04:28:02.961	2026-08-09 04:28:02.961	\N	\N	\N	Aktif	S1 Teknik Informatika	+6283159700340	t	\N
8d703fc0-18c1-407a-a897-23455a7c8c7e	Arif Hardyansyah	$2a$10$ktemjUfddT7ij7qMsjTb/OS3DLq6AKjNIguX5Gd/6yd5lWJcUUCgm	\N	11	2026-08-09 04:28:03.134	2026-08-09 04:28:03.134	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281235533185	t	\N
8604cd79-ff2e-4a99-9406-388e963fc9ef	Tias Nurrohman Hidayat	$2a$10$X/g15RAcEBAqg6F5Ts7TO.WzHrurU7o1/Ym/H9n/uiuJjGyAznwey	\N	11	2026-08-09 04:28:03.316	2026-08-09 04:28:03.316	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281383827707	t	\N
a11a7c82-1a7c-4f92-9be1-4cfd40825b65	Maulana Saputra	$2a$10$2DsbwAJbUly0sD7i77E95uVLHDPx89U8ixNG6zHGapsa6Jm/cXy7K	\N	11	2026-08-09 04:28:03.524	2026-08-09 04:28:03.524	\N	\N	\N	Aktif	S1 Teknik Informatika	+6288222143008	t	\N
568e9b5e-09db-43f2-92ff-68da9b5be7d5	Mufti Alhamdani	$2a$10$.VYj2xrx8PLef1I32lUcB.S3ECvOI8NUDhY3Mit01e71PQoqaotuy	\N	11	2026-08-09 04:28:03.7	2026-08-09 04:28:03.7	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285199218729	t	\N
949fa6d4-53a7-41c2-b0e0-6d50685c0a3d	Randy Fawwaz Aditya	$2a$10$dAva6WisGFtaG6VZVGlCROT/9CPK2Tw9CrPvakIfO1yqK24glTs3C	\N	11	2026-08-09 04:28:03.887	2026-08-09 04:28:03.887	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285718105773	t	\N
1429fbbf-bc98-4bd6-a35a-ac77c689d362	Pengurus RW 14 - Kel. Lebak Gede	$2a$10$cMpa0a0I.vEXBpmu1JN8tOzTEmiURzYF1AHgaSnalB6X/Gc4zAhyO	\N	5	2026-08-09 04:28:04.095	2026-08-09 04:28:04.095	\N	\N	\N	Aktif	\N	+628800014	f	\N
e1366b4a-c314-4513-b22f-df0ce1ea7cfa	Subhan Kurnia Rohman	$2a$10$di0r.ArsksAGqXJxT3RSJOQwiSVwOMz7oHPDw9nseex5s0nEyeFqS	\N	11	2026-08-09 04:28:04.311	2026-08-09 04:28:04.311	\N	\N	\N	Aktif	S1 Akuntansi	+6289675367080	t	\N
9690f0c2-ce3d-4753-8840-df3ae7db7d4e	Naufal Nashshar Fahlevy	$2a$10$nnbVfAAIY.yceaj3B6cTr.mRtTNz4TwdcItU4P2wDLuiDU00xc45K	\N	11	2026-08-09 04:28:04.517	2026-08-09 04:28:04.517	\N	\N	\N	Aktif	S1 Teknik Arsitektur	+628882340292	t	\N
0dce8470-30b0-4aec-b5c9-59257e434a2a	Mochammad Mujib Abdillah	$2a$10$xmC6OpyECYgCzQ5.EsmuCuDu5mK6q0jPkWvvkHLqJ/fucu3y3IT7i	\N	11	2026-08-09 04:28:04.698	2026-08-09 04:28:04.698	\N	\N	\N	Aktif	S1 Hubungan Internasional	+6282130925558	t	\N
8655f822-cc43-4005-8461-47eed7125588	Siti Selma Artanti	$2a$10$QRvmf1Bb1LaDb.RA4RzV4ulrZlKr3ErS2Tb82avSUSZFkwYOucn4K	\N	11	2026-08-09 04:28:04.888	2026-08-09 04:28:04.888	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+6282120971897	t	\N
0b8c6877-f5b3-46ce-826e-7a2c20e57817	Muhammad ervan daffa wardana	$2a$10$b1ZG7N7IqvUEvwv/RBNnxuNO90C/40s7UG/BwIo2Fo0fcZbKWpEZe	\N	11	2026-08-09 04:28:05.115	2026-08-09 04:28:05.115	\N	\N	\N	Aktif	S1 Sistem Informasi	+6283839706455	t	\N
36f6d215-15b2-424b-8894-ac91a158a8a8	Septian muqtiyana	$2a$10$npFdxXkFCc..tvSwrHgXAOGxGbHVdkPmTwEjwfQMZaWp3s/qb1oV2	\N	11	2026-08-09 04:28:05.321	2026-08-09 04:28:05.321	\N	\N	\N	Aktif	S1 Sistem Informasi	+6285117604737	t	\N
285907b2-73a6-40d5-851c-538ec4ae7db3	Aldha Febriyani	$2a$10$hhW/dZz/evYMlh30NzlTOeYPu.CzNv6hl.hTv8WLM4Nb7ISL1E4zW	\N	11	2026-08-09 04:28:05.521	2026-08-09 04:28:05.521	\N	\N	\N	Aktif	S1 Sistem Informasi	+6281292888274	t	\N
85b2cfa1-9719-40a2-8875-c82179eb8fa0	Nabil Al-Ghifari	$2a$10$QcP9dYJVxcKWBzuEq0xIjOT6rPfqeSYgubxp4epOEtk/uJd3ZA3re	\N	11	2026-08-09 04:28:05.723	2026-08-09 04:28:05.723	\N	\N	\N	Aktif	S1 Sastra Jepang	+6289612144030	t	\N
c204ad50-227b-411b-9884-6b13c9f76a9e	Deli Riyana Putra	$2a$10$yYfV8NanI98Ve1pDpk2HCOwfqWqYA.lcspUM05tEUeU5KlAKxNVZq	\N	11	2026-08-09 04:28:05.908	2026-08-09 04:28:05.908	\N	\N	\N	Aktif	S1 Teknik Elektro	+62895402902781	t	\N
ae98ad22-e341-4113-8596-c8ab02d53956	Rahil Septian	$2a$10$6XYjwXlyFYrefY3NVBEauOrPTb.4Bd2y6SscFuSN.suDri5IK1qB.	\N	11	2026-08-09 04:28:06.095	2026-08-09 04:28:06.095	\N	\N	\N	Aktif	S1 Teknik Industri	+6283821737676	t	\N
246cd5c1-ea72-4f30-bfe0-3d2138da24c6	Muhammad Murfid Nurhadi	$2a$10$H7pjLU0IHwAHhvyvQHteweanCEdFsB6D7K3sae5EE6Pt0dmmMeGS.	\N	11	2026-08-09 04:28:06.294	2026-08-09 04:28:06.294	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281394784696	t	\N
cf0fbe66-d436-4c5d-a40c-76db250278bd	Rizky Nugraha Kadar	$2a$10$fn9.ip8cL48cISuOOYTNqOTyKmnE92GpRRdOYl0tPFt9/XCCUzqoy	\N	11	2026-08-09 04:28:06.495	2026-08-09 04:28:06.495	\N	\N	\N	Aktif	S1 Teknik Informatika	+628983743989	t	\N
ae4eefff-8407-4e38-8d5d-97fff9709ebf	Fikri Taufiqurrahman Suryaman	$2a$10$UOtmBKgtTq4451Z3slknpOkVVKah2PXl9JeXOLCvs0enuvKMkVVV2	\N	11	2026-08-09 04:28:06.709	2026-08-09 04:28:06.709	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281770459643	t	\N
60cfb7f7-79b2-4330-a553-440a36286a04	Surya Muhammad Atallah	$2a$10$.lttgwf.lfcCDnYhkXV.HuQVtfwzLPinH6nSVZxy6rCfedvexLdBy	\N	11	2026-08-09 04:28:07.1	2026-08-09 04:28:07.1	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281221610620	t	\N
c6b70e9f-b5e5-4e46-8a8a-d6ad1a0ef274	Fakhry Arief Rahman	$2a$10$W2FFLl508YMvUPKRf/rMhe2f5Tmt4986VY9Me2Vln3Epznxd79Uzi	\N	11	2026-08-09 04:28:07.522	2026-08-09 04:28:07.522	\N	\N	\N	Aktif	D3 Akuntansi (Komputerisasi Akuntansi)	+6283111296074	t	\N
8818ddce-8082-4ffb-bf62-b86635b98993	ArbyAzhali	$2a$10$BjYpaiVjP3NdC0BVlDiseePFe8FnyUA4.x6biLZiOIqJw4c9DiqJC	\N	11	2026-08-09 04:28:07.717	2026-08-09 04:28:07.717	\N	\N	\N	Aktif	D3 Desain Grafis	+6282215325293	t	\N
13aac86a-3e73-4b6b-b3c2-db3afab2ad86	Muhammad Ikram Fathan Yasmkn	$2a$10$rQLSx800RB9QAwnt1U/EzelI9cfXYMwomuBafcxayHYk0ansQc/c6	\N	11	2026-08-09 04:28:08.292	2026-08-09 04:28:08.292	\N	\N	\N	Aktif	S1 Sistem Informasi	+6285872214755	t	\N
261cdf49-f942-4969-8792-0ec079e5a5b3	Sucipto Makalalag	$2a$10$Kd/Cd5uXwh7SFHQi5XIxFOD9JuaHy27QGsLey6Bxxt2aBsgSqUU.S	\N	11	2026-08-09 04:28:08.489	2026-08-09 04:28:08.489	\N	\N	\N	Aktif	S1 Sistem Informasi	+62895806307527	t	\N
d9743a5d-9e3e-42f4-b0e7-20910ee58781	Alif Muhammad Rama Jungjunan	$2a$10$B4N.iJsNeyuffnSnHDT0o.qUgNEyEZa3Kvn.kTHI3soMnRYtgIFLC	\N	11	2026-08-09 04:28:08.698	2026-08-09 04:28:08.698	\N	\N	\N	Aktif	D3 Manajemen Informatika	+6283190777713	t	\N
12b09bd9-3edf-44fb-87ac-96905a785765	Okan Dwi Ramdani	$2a$10$KztYjv43RgM99vyCOHigp.qex8Q2kEs3v6bTTkt40IOJuz7wLUDiG	\N	11	2026-08-09 04:28:10.914	2026-08-09 04:28:10.914	\N	\N	\N	Aktif	S1 Desain Interior	+6289699945266	t	\N
d2bcc4f1-e54e-4837-bb74-2ef2d9714149	Chandra Nur Mulyani	$2a$10$2S53UYQJ0DpkneOIKDJ4c.tIkCZyGuxSg1zEaEhyZerS59Ak3KrNq	\N	11	2026-08-09 04:28:11.131	2026-08-09 04:28:11.131	\N	\N	\N	Aktif	S1 Ilmu Hukum	+62895338789991	t	\N
83892502-e36e-4037-8079-ccd14525b985	Najwa Intan Putri Permata	$2a$10$hbn9LcijF3ckC492HpTrN.OxLWcPHmU43K7mLieUm2KWpUjlo8xHW	\N	11	2026-08-09 04:28:11.335	2026-08-09 04:28:11.335	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+6281298102636	t	\N
c8cdd213-a7c3-4441-8c27-73446d0d0a99	Muhammad Rizqi Maulidani	$2a$10$6s9nKUvacXnFlGdHHh5c8eGhJ97oXDxQKmkjIgzHkcYQUx37yVSR.	\N	11	2026-08-09 04:28:11.551	2026-08-09 04:28:11.551	\N	\N	\N	Aktif	S1 Sistem Informasi	+62895422735599	t	\N
2bf136de-0bf4-4142-a838-79e961ba075a	Naqiyya Ufaira	$2a$10$4ZdEWGPWSMXtac5kDzXJquOgAy0V/pR7YBaI13uxjlqZ2lbUmFop2	\N	11	2026-08-09 04:28:11.927	2026-08-09 04:28:11.927	\N	\N	\N	Aktif	Sastra Inggris	+62895326526550	t	\N
36991da6-dab1-41f8-a285-33d05fe62878	Rafi Madani	$2a$10$HJrY.Dw5BCbAhqOD0ZmYJu3X0GSAOglYZoh37fAR.phQMTfna7VYS	\N	11	2026-08-09 04:28:12.122	2026-08-09 04:28:12.122	\N	\N	\N	Aktif	S1 Sistem Komputer	+6281546894967	t	\N
403096e5-7771-4f7e-b34c-90fd8ce3d5e3	Argi Hasya Prasetya	$2a$10$YmYueTjgfYyVVnOPGpP70.xwUyr8geo2hTIvNZjk8mcuZyWTbW/EW	\N	11	2026-08-09 04:28:12.331	2026-08-09 04:28:12.331	\N	\N	\N	Aktif	S1 Teknik Elektro	+6283813319980	t	\N
04de6551-b588-4655-a64d-2dcdc5f976f3	Dani Nurhalim	$2a$10$RuxHIuuhxFZ4pDeFfTSi1eQlDpLETu1l/RZ.gIwVAK.PW3BjpLf36	\N	11	2026-08-09 04:28:13.304	2026-08-09 04:28:13.304	\N	\N	\N	Aktif	S1 Teknik Informatika	+6287817066930	t	\N
ab3a7aef-25e3-4743-b448-cdd7cf347941	Nabil Makarim	$2a$10$dLEtiHpUUl7eJZ4d4G88EOU5ShKbHQQVhn/89YKNJ/KVV.67uY7oW	\N	11	2026-08-09 04:28:14.306	2026-08-09 04:28:14.306	\N	\N	\N	Aktif	S1 Hubungan Internasional	+6281253638240	t	\N
569ddb39-d63d-4d0c-98a5-0bd0b1d24ba9	kayla zahra	$2a$10$8/zwRPsUCQDdsZV66MJu8eH4iibkgibJYNKdX.zDZskWw4i8sxwwW	\N	11	2026-08-09 04:28:14.513	2026-08-09 04:28:14.513	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+6282128111807	t	\N
f6014e72-a3c6-4772-b20a-2f6a2c85e3f4	Zelgi Raidansyah	$2a$10$XqLEgZ/u3BjtpiGdQ0Npkea0LRIZ0thOCqEK6ICkfoMZ6Kofp1EWa	\N	11	2026-08-09 04:28:14.725	2026-08-09 04:28:14.725	\N	\N	\N	Aktif	S1 Sistem Informasi	+6281286174969	t	\N
f55459b6-4210-4639-aae1-31f5b2371e38	ANIS WIDYA	$2a$10$32FlMOPQHl7tZsR0v459H.KvHy/IFLlt7PTpmA8dADlmCycv.Q3z.	\N	11	2026-08-09 04:28:14.942	2026-08-09 04:28:14.942	\N	\N	\N	Aktif	S1 Sistem Informasi	+6282120468245	t	\N
1a23280c-8d2d-45fb-bade-a5e4dfd22752	Muhammad Adnan Firmansyah	$2a$10$ujU1gp9wj7r.eDKc2WlFQuLMCcJ89mtIA1uWpNplWqbknegCzqotK	\N	11	2026-08-09 04:28:15.504	2026-08-09 04:28:15.504	\N	\N	\N	Aktif	S1 Teknik Elektro	+6289687976529	t	\N
d36431b1-8ce9-4d84-8db7-3f81bbb6c122	Davy Pardomuan	$2a$10$CZVZLNp2ba/PgVdXv93E9eIhoBZivfKvj1STkLGLoCAbD/d7CmaAW	\N	11	2026-08-09 04:28:15.674	2026-08-09 04:28:15.674	\N	\N	\N	Aktif	S1 Teknik Sipil	+6281222761737	t	\N
ada4e687-a69d-4a72-9973-bdf002301a82	Muhammad Zaidan Azhari	$2a$10$6SpR3CG9p068dv5m3ugrXu8eTiu2b9W6eRxZQd/I/mIBzgDf8Btn6	\N	11	2026-08-09 04:28:15.843	2026-08-09 04:28:15.843	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285624709908	t	\N
e7d22429-699c-46c1-adab-a979ddcfa1b8	Muhammad Denish Kafaulloh Arasyid	$2a$10$iBfMksri/GOW.eUCmonyA.RzjfnFxyioWwrFl8/OQIocPA8kLoHj.	\N	11	2026-08-09 04:28:16.662	2026-08-09 04:28:16.662	\N	\N	\N	Aktif	S1 Teknik Informatika	+6283892668197	t	\N
07a06dbf-4d11-49ee-a2a1-6a4a137aa3c9	Fahmi syahrul romdhoni	$2a$10$b5/JdAoTrl2Y9RAkL2PTlOzHSnvk.4nOhmWokCAhQLIw4QEww7YLy	\N	11	2026-08-09 04:28:17.124	2026-08-09 04:28:17.124	\N	\N	\N	Aktif	S1 Teknik Arsitektur	+6289527237309	t	\N
4c77daa9-73cc-4558-b99c-13b48c21dcd6	Nur Shalehatun Nisa	$2a$10$rSnnHlQvgNvXE2HwOrjp7eUpLQ11Sw/ZJSZTV7emGT7.wKQb9eqmW	\N	11	2026-08-09 04:28:17.334	2026-08-09 04:28:17.334	\N	\N	\N	Aktif	S1 Hubungan Internasional	+6285220590156	t	\N
808a89bc-6ba0-4887-a442-484e6e42058b	Mochammad Dava Somadyana	$2a$10$uTjFdhCpggPOscUFpGowpueNKTBR3f8erb7liuwqEEKQjev5L0YJC	\N	11	2026-08-09 04:28:18.32	2026-08-09 04:28:18.32	\N	\N	\N	Aktif	S1 Sistem Komputer	+6281324514350	t	\N
4d1e7633-d01f-4480-a2f1-443773ab2252	Maulana Rimba Zhansasi Anugrah	$2a$10$YC9p/21CIoN4vfu2XdBcRu0mvrEvNVUdLaM7pQIv/IUgyHqWRv2vi	\N	11	2026-08-09 04:28:18.51	2026-08-09 04:28:18.51	\N	\N	\N	Aktif	S1 Teknik Sipil	+6289607789635	t	\N
eee0fb8e-f2fe-45ed-b48a-588e2a070976	Muhammad Satria Jalalludin	$2a$10$9FT4o6q6Vhk/Skg5NHf/ju5GnbYmneDNMga2a/NtUMbvbOiiFhKou	\N	11	2026-08-09 04:28:19.087	2026-08-09 04:28:19.087	\N	\N	\N	Aktif	S1 Teknik Informatika	+62895707867060	t	\N
d910be09-1bb3-478a-9452-2f1335a5b26f	Mochamad Syabill Putra Ramadhan	$2a$10$f.PY/iDbLdGotuLSQb3KC.zjzzc/tWBJhtHp5XTyOx29up4sj0hGO	\N	11	2026-08-09 04:28:19.277	2026-08-09 04:28:19.277	\N	\N	\N	Aktif	S1 Teknik Informatika	+6283173277565	t	\N
2833bf56-d7f0-4dd4-b544-1e8784e5b638	Reyhan Pratama	$2a$10$YNXuL0TNMdmcdSuJt1kct./9hcOznjDg1udhHJym4bwnCdF3uUNlS	\N	11	2026-08-09 04:28:19.487	2026-08-09 04:28:19.487	\N	\N	\N	Aktif	S1 Teknik Informatika	+6289527514308	t	\N
c0cdc125-636a-44f9-9139-f1bc18d8791e	Viki Ayu Armaita	$2a$10$q1QVGqv8GrkUmRS/VjaLi.srKdnJzxEZcrZ4ch6/Oqr67.jGKmSJO	\N	11	2026-08-09 04:28:19.7	2026-08-09 04:28:19.7	\N	\N	\N	Aktif	S1 Akuntansi	+6287821641891	t	\N
d2bc4de3-a4cd-483c-bda8-c177ff4c1a20	Mohammad farhan Alif Akbar	$2a$10$aMB44/3lh3i5sf3E5AMEmusQBC6u008HwxEzxGwZXb76E0MxE.qZu	\N	11	2026-08-09 04:28:19.9	2026-08-09 04:28:19.9	\N	\N	\N	Aktif	S1 Desain Komunikasi Visual	+6281223532154	t	\N
21994162-63f3-4b89-8765-7e5f68d68cb7	Esmenia Maria Ximenes Pereira	$2a$10$eQ4ZcyTZl9092vWm0fZs0uu9T.lGDgcD37CG821vyMwvTVj1FPAIi	\N	11	2026-08-09 04:28:20.083	2026-08-09 04:28:20.083	\N	\N	\N	Aktif	S1 Ilmu Hukum	+6285862005434	t	\N
91cc7dea-d290-4ff6-a44d-45d690dc6b39	Vernanda Zahra Nurrachman	$2a$10$vc1MRKeQjWyhkB3qFPxXguv7lzBXWQxSvuTLws59uBYbBgOuu0972	\N	11	2026-08-09 04:28:20.287	2026-08-09 04:28:20.287	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+6285798428562	t	\N
9105178d-bfbd-4001-b4d0-528e49f2f196	Ramzi Fitrah	$2a$10$CTJ.bIKuYlZnZjYe3oVA4emzl0xE3SfJdbsKMBcxhdr2ooXLPiKii	\N	11	2026-08-09 04:28:20.662	2026-08-09 04:28:20.662	\N	\N	\N	Aktif	S1 Sistem Informasi	+6287887851769	t	\N
7886e508-3b41-42ef-aee2-9b353c858978	Muhammad Irfan Fadhilah	$2a$10$5wC5qwE4cwN7HKFvigHZVuS.hNGiOg7nt4kkOWGXrtL38V9yVxJeG	\N	11	2026-08-09 04:28:21.231	2026-08-09 04:28:21.231	\N	\N	\N	Aktif	S1 Teknik Industri	+6285775011750	t	\N
e64f7b09-73ae-44d1-b70d-be93dd0cb80f	Yusuf Ardiansyah	$2a$10$XBRhIKOa8qWapblFeGSCk.RPCp18KZ8cBl4FbFKXJLaMMBLrVOX.y	\N	11	2026-08-09 04:28:06.903	2026-08-09 04:28:06.903	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281221999138	t	\N
de876ac2-568e-4901-8349-63d49e9a14dc	Rangga Arya Daffa Putra Kusdiana	$2a$10$dlOfqK7x/hGC.3.MRoo27.UNJ0y4fTKX/U5IXhwVejMkh5k10l5MW	\N	11	2026-08-09 04:28:07.296	2026-08-09 04:28:07.296	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281224026414	t	\N
9cb2d04f-cbbb-439d-bf40-251b8f04554a	Nauval Dzikri Gofari	$2a$10$jzA08FYSyMCGUYZjxEZS1uyRB7P.V2Th9dYnfbrU5B7GSKfl8UFk.	\N	11	2026-08-09 04:28:07.917	2026-08-09 04:28:07.917	\N	\N	\N	Aktif	S1 Hubungan Internasional	+6283896685944	t	\N
4a9a325c-7f5f-4357-aca7-f860029d810b	Khansa Zulfa Nurhaibah	$2a$10$yTEgk2r.l9V/mDTvJNgJbu8XNgzru7zKM4ZEGRgNlSmM65rZ0MfOu	\N	11	2026-08-09 04:28:08.105	2026-08-09 04:28:08.105	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+6285794226717	t	\N
3b952f73-2422-4c3d-bb4e-9775e151bdc0	Kautsar Akbar Rasyi	$2a$10$rwkGion71YUzJaDeeq1qPOrtPyn/PPGCb5xwHdRICjclpDyXnYMSa	\N	11	2026-08-09 04:28:08.9	2026-08-09 04:28:08.9	\N	\N	\N	Aktif	S1 Sistem Komputer	+6281382278042	t	\N
f039ee01-9df9-44ad-9835-8c97509d8a0d	ilham fathurrahman	$2a$10$ht4cbFp.bV26gzSRDjsixe8rWiHtyd9KxXuyVCd/WfWoIkcb9XZ9K	\N	11	2026-08-09 04:28:09.096	2026-08-09 04:28:09.096	\N	\N	\N	Aktif	S1 Teknik Sipil	+6285624208958	t	\N
4d151cf1-09dd-4a66-9c34-773ff7349364	Yoan Ready Syavera	$2a$10$XEl6pYzN4KvLfWApD6dhney85y5uApG7yXMZiiO4NlwaEH69kpq4S	\N	11	2026-08-09 04:28:09.296	2026-08-09 04:28:09.296	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281953171433	t	\N
3c949ec0-4e0b-4d76-a23e-6da56b933f2a	Rikza Danan Irdian	$2a$10$UZdPZ/aW.tv22ODZoGijQeWHec3Z8Au09z0D3OE1vn/sBpHwAB9PK	\N	11	2026-08-09 04:28:09.538	2026-08-09 04:28:09.538	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282123419510	t	\N
939f14bf-8c17-4f41-b2b2-3e8ed389bc8e	Adira Radzan Badriana	$2a$10$c1mfII/tu0ma4/lx4Axsy.LliwEPyecVyeDaFSJTwtL1/IAnIFGm.	\N	11	2026-08-09 04:28:09.733	2026-08-09 04:28:09.733	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281221909802	t	\N
e98210a9-75e3-4b6e-9456-2b6d2e39107a	Muhammad Rifqi Adiyuwana	$2a$10$0LhVuLJNsDb3wLOPAunTYuQqfrint/FK4HIf64xKnyowlYNRenmuG	\N	11	2026-08-09 04:28:09.931	2026-08-09 04:28:09.931	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281210820209	t	\N
7729ddde-6af8-41c9-b4ae-ad2d5a06e994	Tongku Nevin Federico	$2a$10$xeDx2OWCZy2mjK8RsHaao.ssi57ZoEPglX6DNJVOpOApf1GDg1lZu	\N	11	2026-08-09 04:28:10.143	2026-08-09 04:28:10.143	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282368036106	t	\N
eba872a0-2901-4820-8265-f419060e5a07	Asri Nurfadilah Azzahra	$2a$10$pXuVN05Y9Inbnlwa/vL1j.2idii1NfvddCDibUROW.DPtOXUYIobG	\N	11	2026-08-09 04:28:10.343	2026-08-09 04:28:10.343	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281910452162	t	\N
41fce06f-b303-42c2-a022-86334b01bf2d	Pengurus RW 15 - Kel. Lebak Gede	$2a$10$rW4R021UJWi7zmoOrOMM1eyMpx68emCwlW0lLJTrQXUXqmyvGXlUe	\N	5	2026-08-09 04:28:10.532	2026-08-09 04:28:10.532	\N	\N	\N	Aktif	\N	+628800015	f	\N
a01e6ca5-2e10-4437-86d9-95022b1db1fa	Farhan Ramadhan Riyadhul Hanan	$2a$10$AVFunPk0OTAUoE2HJUhAM.AdbgLbAUg8R1vgqnGXB4E4Ww5S6bOMS	\N	11	2026-08-09 04:28:10.721	2026-08-09 04:28:10.721	\N	\N	\N	Aktif	S1 Teknik Arsitektur	+6287747934281	t	\N
3020be89-6795-4bbd-a49d-b40223b2d72b	Febrian Ardianto	$2a$10$bTMVZMXxri9G3OAe9vliMOaV4t/CEj68kb8N4bhavSV6tQngT87hm	\N	11	2026-08-09 04:28:11.746	2026-08-09 04:28:11.746	\N	\N	\N	Aktif	S1 Sistem Informasi	+6285846221380	t	\N
19712eff-65c3-4e51-ae83-1b4547b95954	mitsaal sallih	$2a$10$.HwUigbL65HC43NfiHP0MeKZCFKm6uMLR4yJuRYzrVz2oxZmYXe6u	\N	11	2026-08-09 04:28:12.518	2026-08-09 04:28:12.518	\N	\N	\N	Aktif	S1 Teknik Sipil	+6282117244607	t	\N
163b5bd2-6b5b-4c74-8414-13f158e4652e	Muhammad Rizki Aliansyah	$2a$10$Y9RvXaYu4qrD1OQ1moFCUeZwUJ2OXmo.VDynEHbELlhx6xBXfrYIC	\N	11	2026-08-09 04:28:12.693	2026-08-09 04:28:12.693	\N	\N	\N	Aktif	S1 Teknik Informatika	+6287829623083	t	\N
3e50e197-ba00-4291-a3e9-ae4d809ba41b	Nur Ain Salimah	$2a$10$B031cVF0w5BFcnaBHDERiu0.fWkojYVwJ0.hMMIA4eszfv3d3HXWm	\N	11	2026-08-09 04:28:12.895	2026-08-09 04:28:12.895	\N	\N	\N	Aktif	S1 Teknik Informatika	+6283133926574	t	\N
e38dc614-38b4-4eba-8137-11f663fb05fc	Wa Ode Syahwa Salsabilah	$2a$10$7/GtoUxaskaFLbvdm7rr0u4q3afWwf0r2LO7VpBNeAwo54eXVDCgG	\N	11	2026-08-09 04:28:13.106	2026-08-09 04:28:13.106	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281290808347	t	\N
d62a922a-2fb9-41bc-b677-b2466961d855	Nurhayati	$2a$10$p.iZ4.GeO/1QqBVZdJxc5e5xQLubgWlCdrIi5TQEsnAX9bhLTp5/u	\N	11	2026-08-09 04:28:13.503	2026-08-09 04:28:13.503	\N	\N	\N	Aktif	S1 Teknik Informatika	+6283145310967	t	\N
c9d15e62-0eb7-4cfe-8933-6dc96d54dd37	Muhammad Fikri Faizul Haq	$2a$10$dwYirKknJwbnoQxlCTDkhOCi9yhm8kXcLTUd64Cwtc3hM1eAw.DjG	\N	11	2026-08-09 04:28:13.711	2026-08-09 04:28:13.711	\N	\N	\N	Aktif	S1 Teknik Informatika	+6289526490236	t	\N
9c4d6870-13b5-46a3-b145-4b122ea95009	Nita Triana	$2a$10$RMHzqN5i47F.rEUVyhoxUeg8wtJHrb4xUs96DH551ujCiox3zRb1C	\N	11	2026-08-09 04:28:13.924	2026-08-09 04:28:13.924	\N	\N	\N	Aktif	S1 Akuntansi	+6283143224685	t	\N
422d60cd-d768-4eb3-91af-6f0297d03388	Habib sidiq mauluddin	$2a$10$VVKHgS4rLs8pbQpJMDZ6GeX63h2d.HW8YGioXjNhx46T5xV1eMn4y	\N	11	2026-08-09 04:28:14.123	2026-08-09 04:28:14.123	\N	\N	\N	Aktif	S1 Teknik Arsitektur	+6282125725966	t	\N
0645a00d-bf99-404d-a52f-cc9e56e835b1	Rizki Firmansyah	$2a$10$ncvPuIJt/0NU9wa/lH/S1uTDW9hWZAs5bt3/3tisNmwMULQwBZfy6	\N	11	2026-08-09 04:28:15.142	2026-08-09 04:28:15.142	\N	\N	\N	Aktif	D3 Manajemen Informatika	+6283197727852	t	\N
66ab80ee-d12f-47f2-b50b-cf578e539a1e	ADEN ADHYAKSA WASTIKA	$2a$10$z7mhaILu99eomFZzgIrcU.K48n2H8bd4oRI60c365Er9cdYAdaMWy	\N	11	2026-08-09 04:28:15.326	2026-08-09 04:28:15.326	\N	\N	\N	Aktif	S1 Sistem Komputer	+6283835782323	t	\N
601707c3-f82f-4548-8891-002a9c492cc1	Benyamin Benedecthus Nikolaus Maryen	$2a$10$DEwbvYbKcTvutxuJvf8qVO4eWBebVFagsBRTiRrYsiWiqFVAV2oGe	\N	11	2026-08-09 04:28:16.046	2026-08-09 04:28:16.046	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285782116995	t	\N
12b04111-14bb-4795-bf72-d39cda2d24cb	Muhamad Iqbal Reza	$2a$10$QLFUwdoYP8aJ6QPG80kj/e3j6hbeHdMSkGituqkEcQ5qb8fWSPYjC	\N	11	2026-08-09 04:28:16.244	2026-08-09 04:28:16.244	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285156804076	t	\N
8b25b8d9-3100-461f-82fa-45f702066cd0	Achmad Chasanuddin	$2a$10$ag6BHu8oamcBmkxPVhfZvulaKs5K.aMZziPjlt51TxZruON4B.C7.	\N	11	2026-08-09 04:28:16.451	2026-08-09 04:28:16.451	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281461173586	t	\N
b0e17308-d8fc-400f-82a8-c9394d56fc3b	Akmal Al Jihad	$2a$10$e2urxmClizhzZCHrXoFFGeUoJFiFUNwq4d5Xro0j3jDRx1IkKEOnC	\N	11	2026-08-09 04:28:16.914	2026-08-09 04:28:16.914	\N	\N	\N	Aktif	S1 Akuntansi	+6285182327492	t	\N
be32cd95-3f35-444b-9220-14280cf4d0b9	Alya Rachel	$2a$10$ctBCUOrR892yMs7.vjdJj.pFCDJo9nnXVULVugsNOLpECVBDLCl4e	\N	11	2026-08-09 04:28:17.531	2026-08-09 04:28:17.531	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+6281312923808	t	\N
55cbf9c9-8044-44bb-bb97-06804e26d62a	Raka Bintang Syahputra	$2a$10$4YrK5KvcgO4MpLZ624Flf.ClITXDvRJ5Urst5XOwR3oo7j.TEBSbq	\N	11	2026-08-09 04:28:17.725	2026-08-09 04:28:17.725	\N	\N	\N	Aktif	S1 Sistem Informasi	+6281297531268	t	\N
a97ae1e3-231b-484f-a388-0b878ea33132	Lucky Lazuardi	$2a$10$75mTLKOfod2eeilA1YVsbeQ8QYDzmUDfyTD2OoxjrAm.cL2EfqHOW	\N	11	2026-08-09 04:28:17.93	2026-08-09 04:28:17.93	\N	\N	\N	Aktif	S1 Sistem Informasi	+6281314692013	t	\N
022a71c7-6f63-4766-acbf-df58dfffbc7b	ADINDA DWI ZALKIA	$2a$10$CyRjDfuG7gOGmUYPASXVhuyyMJebP.fDObVEfbKI0INbIe0tIa5km	\N	11	2026-08-09 04:28:18.12	2026-08-09 04:28:18.12	\N	\N	\N	Aktif	Sastra Inggris	+6282127617060	t	\N
0eefffdc-9e94-4acc-bc27-f5c7677a9798	Idin Naufal Hakim	$2a$10$Gwn1EUltWCujirDcqk/YyuqhpVGw1NSId2o89M0OBvgZZE35VWrC.	\N	11	2026-08-09 04:28:18.706	2026-08-09 04:28:18.706	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282119678835	t	\N
cb069575-f69c-4cf8-a375-051751aae366	Ananda Fadhilah Putra	$2a$10$BZPtRXxwJmt8ej4ZnDNuauwUz6D/K0ox8JMRZwZ8QJrfUl9JRAXYG	\N	11	2026-08-09 04:28:18.89	2026-08-09 04:28:18.89	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281320387478	t	\N
de03ae5f-ba9b-4d01-a08b-c6db8025e6bf	Muhammad Farhan Rasyad	$2a$10$lKOUecyiKqG5GE7qwcA99O9svJAkhP8cyygfwBfHQ4/EhnjBECr3m	\N	11	2026-08-09 04:28:20.475	2026-08-09 04:28:20.475	\N	\N	\N	Aktif	S1 Sistem Informasi	+6282217891422	t	\N
ea022b6e-862b-44c9-977f-8730de2074f8	Moch. Fadzar Wahiddin	$2a$10$oAzfe1K2sXI85VZqaa86x.St1Q25cOEulFyqZEb1MR.beUIUHLMka	\N	11	2026-08-09 04:28:20.851	2026-08-09 04:28:20.851	\N	\N	\N	Aktif	S1 Sastra Jepang	+628813083287	t	\N
7e5a9409-1aca-44f4-a1bb-32b0013a0f99	Muhammad Raihan Nur Yusup	$2a$10$PitFO7uSRpgig7B4krhpdOj6k5kDHlj0pNeHU.dnILUCkiIsmZ1US	\N	11	2026-08-09 04:28:21.037	2026-08-09 04:28:21.037	\N	\N	\N	Aktif	S1 Teknik Elektro	+6288223220280	t	\N
bd4dc443-8500-4530-8fdd-2e67b510d101	Ghazwan Rifat Al-Faris	$2a$10$56PaJN0Yf8JQdF2KsJ/9LO0sKefph6SACtwC2heGGoH1JwZlbTL5q	\N	11	2026-08-09 04:28:22.622	2026-08-09 04:28:22.622	\N	\N	\N	Aktif	D3 Akuntansi (Komputerisasi Akuntansi)	+6285642178320	t	\N
4f19e0c6-ac83-4e85-9e40-18cec476e6a4	REIHAN RENALDI	$2a$10$h0Xap2yzNdhF58CLOXpDjuaYeK5MdunFrr6myoqXBG3RggmpMNPpa	\N	11	2026-08-09 04:28:22.821	2026-08-09 04:28:22.821	\N	\N	\N	Aktif	S1 Desain Interior	+6281398458958	t	\N
592894a2-68ef-4c91-a493-17bf3051433f	Ferdinan Pasaribu	$2a$10$AYwWrxFVJkEIkeHSu55LO.wcJFzkjDerlG6JDrLktZcku/GUKMGC6	\N	11	2026-08-09 04:28:23.324	2026-08-09 04:28:23.324	\N	\N	\N	Aktif	S1 Ilmu Pemerintahan	+6281919966556	t	\N
e07f32af-ed17-4a93-8932-0f8b4ba023d5	Ahmad Suud Huzaemi	$2a$10$HI0.0rGuLrCH2GzoZi5vuub1bvVFPpzYUm6LdwUpLovvXLIFoNQ5i	\N	11	2026-08-09 04:28:23.556	2026-08-09 04:28:23.556	\N	\N	\N	Aktif	S1 Sistem Informasi	+6289991392279	t	\N
9718b096-b11f-488b-9000-e1ed66c42f4a	Danus Rosan	$2a$10$1WHVyjhiGiJI6ZiUIPvOCedtn.oKGCKdcIf1Uz4tPCrlc0mUcwL7q	\N	11	2026-08-09 04:28:23.787	2026-08-09 04:28:23.787	\N	\N	\N	Aktif	S1 Sistem Informasi	+6283153709000	t	\N
bddabbcc-ed36-4293-9c05-c262a4162131	Neval melyuko soedarmasto	$2a$10$RyUvYdDu21d/QoOwDlkZVuSsZ4dRVED0ZDbhXV9PQKFBpVVFoo.o6	\N	11	2026-08-09 04:28:23.995	2026-08-09 04:28:23.995	\N	\N	\N	Aktif	S1 Sastra Jepang	+6281319699159	t	\N
2f5c5418-2016-4fb6-a386-5999de1ee99b	Cepi Muhamad Faisal	$2a$10$o0E18St04ve7ksUDFzC2wuzfzGeiMxbU1RAWjKsDJRhh8ljuzvYhO	\N	11	2026-08-09 04:28:24.432	2026-08-09 04:28:24.432	\N	\N	\N	Aktif	S1 Teknik Industri	+6282118217775	t	\N
2e3b3b51-40bc-476f-a980-4d3eae7e70a9	Restu Harry Lugina	$2a$10$1l1QFjZHitOt6tERtpRb7eGVt4uIgkOv7pGnym/PGJpmqgx1Uj24W	\N	11	2026-08-09 04:28:24.636	2026-08-09 04:28:24.636	\N	\N	\N	Aktif	S1 Teknik Sipil	+6285624049306	t	\N
8a016503-ea32-41f8-b17f-331464479544	Muhammad Fathan Fadilah Ihsan	$2a$10$uSYA1KXJz3vxADb/mHjoL.KM.4tVcLO26t8mYL7C/pfRo3NHy3Xk.	\N	11	2026-08-09 04:28:24.846	2026-08-09 04:28:24.846	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281906589606	t	\N
b2fbfd6f-13c6-4a85-8d6e-edaf46c44d38	Haifa Afina	$2a$10$03Jpk0tUpx7Ml./rOSXAROCzne0QSOZvnnXbiFsReK8z3sSK0XQ6m	\N	11	2026-08-09 04:28:25.479	2026-08-09 04:28:25.479	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281293357879	t	\N
6990ab16-78ae-4110-bd96-bd44e1334183	Farhan Nawwafal Pramudia	$2a$10$h9bwQtL5WfQvgWmwwmUFnujkGiz6pmKrSJtGOlH8Bd6qKCpt0ZQ1C	\N	11	2026-08-09 04:28:25.756	2026-08-09 04:28:25.756	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282336702004	t	\N
ea186cb7-bcb1-4168-9023-feb421ce7eb4	SAN DIVANTRI SINAGA	$2a$10$joSmPHnLJLPerl1sPkxmqOq/38j.StHA0WDaNUBfQNXDjyF4DNVaq	\N	11	2026-08-09 04:28:25.988	2026-08-09 04:28:25.988	\N	\N	\N	Aktif	S1 Teknik Arsitektur	+6282164092648	t	\N
4f2f746c-ee14-4481-a60d-38977fdb3298	ALEXA ROCHMAN	$2a$10$g86PxdZMPbwHBNEcoW/XIOWyZ2NUlf1xSDiuy7nr862GeKsg1jWhW	\N	11	2026-08-09 04:28:26.596	2026-08-09 04:28:26.596	\N	\N	\N	Aktif	S1 Sistem Informasi	+6289991392293	t	\N
1eaa7d42-0af1-4bfb-a0b4-b859621802b4	Ghazwan Jabbar Khairullah	$2a$10$L1lkaMJYqR/XXyNm.qgn.eH/tJnpIDxdScN4Rq/EGN9rFPqiAjSOS	\N	11	2026-08-09 04:28:26.808	2026-08-09 04:28:26.808	\N	\N	\N	Aktif	S1 Sistem Informasi	+6282115134061	t	\N
ab2780e9-9666-4640-a6b7-43eb489e1edf	Muhammad Favian Jiwani	$2a$10$QdF4osuorIMxGlbwva.Un.mdM/JC7.JBsqPOrcNlzWiDJsgJmmHqO	\N	11	2026-08-09 04:28:27.629	2026-08-09 04:28:27.629	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282117778311	t	\N
286a96c6-1790-425c-98ab-5eec1a3f3768	Muhamad irsyad fajar	$2a$10$jH9HwdON1PjtvoWfs0jXCu0hRTex/fCGwdNYQ2ChRbpiR3ZQ588/W	\N	11	2026-08-09 04:28:29.941	2026-08-09 04:28:29.941	\N	\N	\N	Aktif	S1 Sistem Informasi	+62895411926401	t	\N
75a9704e-98a7-4776-abe4-c2eb8e82abee	Reisya Fricilla Achmad	$2a$10$qAG4K0IW3f9ZUe17eKnXS.eWi0CwjDMrizKBCcduXXWEQkZA8oYDy	\N	11	2026-08-09 04:28:30.137	2026-08-09 04:28:30.137	\N	\N	\N	Aktif	S1 Sistem Informasi	+6282343456058	t	\N
13c2e113-1475-4acd-87a3-32404a32e871	Hasbi Arsyan Anugrah Firdaus	$2a$10$rVfP1FBBhWtSWa68OweX3.CtUGHfq36uFCz/Zwcc0PlfjAf3k3sUm	\N	11	2026-08-09 04:28:30.917	2026-08-09 04:28:30.917	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285797040347	t	\N
bb3d07d0-8970-4602-aa63-ccae0ed9e0b4	Rafael Rangga	$2a$10$U4RMaQRI7iZpOqcUtwaW6OyucnrQi/BCkhpPpmF85nmAKrPHM/K8i	\N	11	2026-08-09 04:28:31.108	2026-08-09 04:28:31.108	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282113079402	t	\N
c67fc44a-9449-4627-8c72-b8b0c16e1e95	Muhammad Iqbal Noor Iskandar	$2a$10$QBUwSNbLEBxhT1bfCtML8OzHBEPzYUsbJoF5CIn.3YqHNuAyUuA/.	\N	11	2026-08-09 04:28:31.298	2026-08-09 04:28:31.298	\N	\N	\N	Aktif	S1 Teknik Informatika	+6289670447000	t	\N
415ca0b8-8cb9-4cb7-90e9-60554e31957b	Edi Junaedi	$2a$10$V8lbiWl1s2gTe4xEWn5DRujkQ5cj8jfm00KJLff16gjONSUKsMURC	\N	11	2026-08-09 04:28:31.943	2026-08-09 04:28:31.943	\N	\N	\N	Aktif	S1 Teknik Informatika	+62895339601932	t	\N
14a5bc4d-6749-460a-ab08-fb556690ad53	Irfan Putra Hendari	$2a$10$1d8aQR1SiWwZSw2zKfgNn.JlPF77N3zoga.9OntFD6rhVz5M.jc82	\N	11	2026-08-09 04:28:32.33	2026-08-09 04:28:32.33	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281221515809	t	\N
e849736a-4da5-4317-8900-d810d973ac76	Muhamad Nauval Pamungkas	$2a$10$Eio6Hl15864tjsQQiiNgB.WbMtSipANkoNrsG18B29uZ1r9t0khQO	\N	11	2026-08-09 04:28:32.527	2026-08-09 04:28:32.527	\N	\N	\N	Aktif	S1 Teknik Informatika	+62895330583940	t	\N
72d37a73-3d2d-47ff-b4d0-d9d6246ef3a7	Fadhil Muhammad Akram	$2a$10$Wc1A9B3RlFgsXIEF8FTic.WZXJLbE8ufz4E2e7L05we8QiFvn7x5S	\N	11	2026-08-09 04:28:32.724	2026-08-09 04:28:32.724	\N	\N	\N	Aktif	S1 Sistem Informasi	+6281324800622	t	\N
29a1e339-bd90-4bf1-8ed2-b2fb894fd0fe	Raffi Revanza	$2a$10$662JS6jOVOVliVlmRIZPEuGlXb32ELLG7Kpd76rywXXjBbTjUMPMi	\N	11	2026-08-09 04:28:32.913	2026-08-09 04:28:32.913	\N	\N	\N	Aktif	S1 Sistem Informasi	+628882285069	t	\N
b80a771d-ff79-4f1b-aafb-400c7781bfac	Ardiansyah permana sidiq	$2a$10$JsEiqEAe54CYZsIdYVpVMuoARQQyyyGBFfqgbp/bR1few48qbS.xC	\N	11	2026-08-09 04:28:33.102	2026-08-09 04:28:33.102	\N	\N	\N	Aktif	D3 Desain Grafis	+62895367880041	t	\N
f05c714e-2fee-463d-a2f4-c9028c972879	Angga Prasetyo	$2a$10$zTPzaV1qA.5PCqt8CeZ4ou8ifHXjZ5lsj8s0F0Udoys0/oMrj6kKa	\N	11	2026-08-09 04:28:33.307	2026-08-09 04:28:33.307	\N	\N	\N	Aktif	S1 Akuntansi	+6282319759917	t	\N
c6a76d78-0723-4a5f-8318-db5ac22c3026	Shafira Nurazizah Baeha	$2a$10$3Qb/Vc1/5AHvrtImBh9H2eyyu6fYW3KdnYVNbKnl47HRXRKdRwNi2	\N	11	2026-08-09 04:28:33.494	2026-08-09 04:28:33.494	\N	\N	\N	Aktif	S1 Desain Komunikasi Visual	+6285359945775	t	\N
c234c18b-6abb-401b-bdc4-04e1b4f94aa4	Iqbal Hapidin Febrian	$2a$10$h0fc7CYVZ4EeuT9MrIatr.h.CaPwRNChUhvE1g/ADjTiWSjX5nMBm	\N	11	2026-08-09 04:28:33.676	2026-08-09 04:28:33.676	\N	\N	\N	Aktif	S1 Hubungan Internasional	+6289527901171	t	\N
da6e3cce-8589-4fca-9017-f5384016c462	Putri Andini	$2a$10$22meDm92IGd6gb6p/NL0aeLOJ3HNi1R5gOqbdzCm9KWPm8EG.mJz2	\N	11	2026-08-09 04:28:34.043	2026-08-09 04:28:34.043	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+6285924808433	t	\N
0434c4f4-9261-44a4-9747-c811b9b17559	Aufa Fauzan	$2a$10$gNmBoYV2DcnrBqQTmZqzu.U5Z5l0urG.B/E3QUOhZzVv3v1iZ3Ql2	\N	11	2026-08-09 04:28:34.436	2026-08-09 04:28:34.436	\N	\N	\N	Aktif	S1 Sastra Jepang	+6281224821553	t	\N
866395c7-2f70-4ad1-b839-d4c43126aa0c	Rizky Al Farid Hafizh	$2a$10$ULY2n5QIZ.pSvFVbyY50ye2hmQdtg0V7TQXnkZwazCXXsMMP2gM7O	\N	11	2026-08-09 04:28:34.657	2026-08-09 04:28:34.657	\N	\N	\N	Aktif	S1 Teknik Informatika	+6287884667371	t	\N
6985e3cb-8f4c-45a1-a502-1d730c650ff8	Muhamad Irsad Assopi	$2a$10$Mt5.KjPME1itOmSFdfiPneT089hi2sV.CBeZqK1P1XLXu.Ae3B0Qa	\N	11	2026-08-09 04:28:35.23	2026-08-09 04:28:35.23	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282315347187	t	\N
dd1c994d-ef24-4bad-94b7-66cdc73e8bd3	Rimo Saptazi	$2a$10$.OBC9NuBxIMCYCyQ6VXrPOo/.u4up.jdTkT/AFIqxeib09kI2keB2	\N	11	2026-08-09 04:28:35.422	2026-08-09 04:28:35.422	\N	\N	\N	Aktif	D3 Manajemen Informatika	+6288802293356	t	\N
40ce3cef-773d-491e-abfb-9eeecce8eb06	Salman Alfarizzi	$2a$10$CLYYxO0H/H9b.rbQQHyFLewBMthDb.uda0vwfNUiU7x178Dclc9zC	\N	11	2026-08-09 04:28:21.413	2026-08-09 04:28:21.413	\N	\N	\N	Aktif	S1 Teknik Sipil	+6285641638629	t	\N
a34180af-afd7-4f32-b179-49c96ce70e16	Aldo Revaldo	$2a$10$RaRZtrLg737ui2Y.Z21HbOAuT2/Yu3QxBEQnWLG0h/CJ6qlRyLZxq	\N	11	2026-08-09 04:28:21.592	2026-08-09 04:28:21.592	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281321250689	t	\N
926c9696-5945-4965-b97e-c8528cc52e83	Muthia Andini	$2a$10$EQVwIakKW8GX.smxBuUW.u4Gka7drznrslOJRNb/K4cWQ0VMBYRH.	\N	11	2026-08-09 04:28:21.792	2026-08-09 04:28:21.792	\N	\N	\N	Aktif	S1 Teknik Informatika	+6288270987096	t	\N
dc26309d-e702-45dd-87e0-3badc578fe02	Abdul Mujib Mubarok	$2a$10$kznLBo0Meoxv3i6uZZ5XP.SrY2kWuH5dRWx.k73uGgH2bPbXSOw4W	\N	11	2026-08-09 04:28:21.998	2026-08-09 04:28:21.998	\N	\N	\N	Aktif	S1 Teknik Informatika	+6283169942795	t	\N
21d29aab-3804-4137-99d8-3877f349729d	Muhammad Nazriel Alfarizi	$2a$10$hWs7z54GqvU5k03XqFUdo.8Rb8xuCD1GXVlN4xHJ8N2OPsOddYT8K	\N	11	2026-08-09 04:28:22.232	2026-08-09 04:28:22.232	\N	\N	\N	Aktif	S1 Teknik Informatika	+6289508900031	t	\N
3180bf1e-1fc4-44d2-b292-2496f8e69d63	Muhammad Bilal	$2a$10$iaoxJtyVzeIH5IxzQVLzsecI5ccpxrei6pz4aYPwbljrXrJfdcxca	\N	11	2026-08-09 04:28:22.417	2026-08-09 04:28:22.417	\N	\N	\N	Aktif	S1 Teknik Informatika	+62895412955532	t	\N
85fb23a3-85fd-4d14-962a-cb54c1565e6a	Dean Amando Mendrofa	$2a$10$2Se.PJhiMQh3p3e2VtIVTu7AZ6c7GiPuDpiwZ.bibCg3sS.19tAUW	\N	11	2026-08-09 04:28:23.11	2026-08-09 04:28:23.11	\N	\N	\N	Aktif	S1 Ilmu Hukum	+6282294699273	t	\N
40fbd482-3b3a-4634-918e-724b117206fb	Surya Willy Syahputra	$2a$10$mjIc0x.z32oJuiBT7/9Z4.FFR17lOn/LTrFG7eFwomYekaT9/1a7q	\N	11	2026-08-09 04:28:24.238	2026-08-09 04:28:24.238	\N	\N	\N	Aktif	S1 Teknik Elektro	+6287880854805	t	\N
bc56e210-0cef-4bc6-b78d-4d83d0ecb52d	Raditya Reskyananta Saputra	$2a$10$Ij2FvzjAy9M/nioWaoAKzuQ8rYMehiuMTzPJoE1Mv4m.tRAv7cdwu	\N	11	2026-08-09 04:28:25.058	2026-08-09 04:28:25.058	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281223189894	t	\N
193c146c-61be-4b5a-8bcc-d37a72c61839	Desta Adi Nugraha	$2a$10$nH411ahztd6mR7lk.PqcmOmSDr17.VT76F8Dsvk/U4yCtjKyI1gMO	\N	11	2026-08-09 04:28:25.294	2026-08-09 04:28:25.294	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285524435339	t	\N
62580126-a3b4-42c4-9c4f-f9b1284d42d4	Haifa Azalia Dzulkarnaen	$2a$10$UlNTGtpRQCj9CpdGYPSg3OoOmTHS/EryueU5hi7BUCCJoeDlyouSS	\N	11	2026-08-09 04:28:26.187	2026-08-09 04:28:26.187	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+628996977312	t	\N
4f08e0bc-7913-4505-b559-470d54f710fa	AMIRULSAMSU SAN	$2a$10$yr5MHcYsKAM538JUN/8zPuL7utGohwHO45iE6PlzLeRN3mP/h8jzy	\N	11	2026-08-09 04:28:26.383	2026-08-09 04:28:26.383	\N	\N	\N	Aktif	S1 Sistem Informasi	+6282128790630	t	\N
3f8958d6-ff2d-4e24-a0ca-a8b2ca13da70	Farrel Deryl Herwansyah	$2a$10$X/IQqOAd4k9M/UrXE5.wROyQKvyID2nssDwZIJmdUxVQwT/5vUiVa	\N	11	2026-08-09 04:28:27.02	2026-08-09 04:28:27.02	\N	\N	\N	Aktif	S1 Sastra Jepang	+6287771375516	t	\N
81f76deb-21bb-43ae-866f-2b51af11ad5a	Doni enda barus	$2a$10$pj40ioLioQa5sIg1t.7rY.nhtjFDlQyLA2XInCDWd1N5SOXuQp3du	\N	11	2026-08-09 04:28:27.227	2026-08-09 04:28:27.227	\N	\N	\N	Aktif	S1 Teknik Elektro	+6281214581208	t	\N
2e783b1c-fa2f-46e1-998d-dfd53b2045c2	Keandra Indraputra	$2a$10$01tGLaH4BzgETDbEIqexUOaR8x8I5ljhIilYI5dJ/sK1nZGpgnI0W	\N	11	2026-08-09 04:28:27.427	2026-08-09 04:28:27.427	\N	\N	\N	Aktif	D3 Teknik Komputer	+6282216838241	t	\N
005e079a-6839-4545-9c3b-a808444a85ce	Diaz Garcia Pratama	$2a$10$LADMOjjCKXHqJpC5ZbeF2OYn.tV.B.OHH7Oer4Wr4rGv./2LxESI2	\N	11	2026-08-09 04:28:27.839	2026-08-09 04:28:27.839	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285591331132	t	\N
1943722e-d751-46b9-a388-c82a47f3e420	Muhammad Faris Yuda Putra	$2a$10$6HQlCaKFw2T/5UaqAIJZu.5KgCQzSbNtZFdtFeuFAqzj7JzdPe7Ru	\N	11	2026-08-09 04:28:28.027	2026-08-09 04:28:28.027	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281313256843	t	\N
54cbb452-51ee-44f2-aeb6-8cd1607b50fe	Muhamad Alif	$2a$10$se1NOIlly7WVOeOHJPhJWe2qJKoZfASdaQVCH.ObTFYbh3C.iBnUO	\N	11	2026-08-09 04:28:28.212	2026-08-09 04:28:28.212	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285893250407	t	\N
3d251dc9-92a6-4ee1-b04d-099ab1c2d622	Sierly Putri Anjani	$2a$10$onpF2pxC8966TVgcnpY8Q.IyH4YCt/H.1quTW6Lizx1Tx9DZOQTAG	\N	11	2026-08-09 04:28:28.408	2026-08-09 04:28:28.408	\N	\N	\N	Aktif	S1 Teknik Informatika	+62895322050705	t	\N
3f88b16f-ea4f-4511-b8c3-744d6e0c1ac3	Reza Alam	$2a$10$xFqgkXT/boRW5mZLEIgBU.up5PyPX4u8bPFa5FAl82yoESIGFEUEW	\N	11	2026-08-09 04:28:28.589	2026-08-09 04:28:28.589	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282217066573	t	\N
d4f971df-0610-4d08-8879-b082b2a37e08	Egi Nugraha	$2a$10$HYd2rffW0mux6VZ7tDTlweLVUYdN0zAu8YEFpNKIqslD9eMkd2RAS	\N	11	2026-08-09 04:28:28.772	2026-08-09 04:28:28.772	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282135183580	t	\N
497f98e2-51b4-4436-a4a0-9e675fd76aaf	Pengurus RW 16 - Kel. Sekeloa	$2a$10$8Gbwrq8TBAEotOLm5P1XAO3KDdFIbdHxTxJLZG/YR8slepjU.kFpq	\N	5	2026-08-09 04:28:28.964	2026-08-09 04:28:28.964	\N	\N	\N	Aktif	\N	+628590016	f	\N
1941ae1b-3426-4922-ab7e-7c1267d3bcfd	Arnold Jaya Daeli	$2a$10$9t1kgf8jJiocYvHX/VAi4eMXmvqXPRYkMv9gkhht/RaViOXWhMxUK	\N	11	2026-08-09 04:28:29.154	2026-08-09 04:28:29.154	\N	\N	\N	Aktif	S1 Teknik Arsitektur	+6281288102229	t	\N
dee19cde-344e-4d8c-8fb8-3f38b2fa3a87	Farsha Bilqis NurulHusna	$2a$10$JZQKi6Ou3bhvYfOtzQsi6.3Iz.cTQJGLIQKU/KSi83qQ.zhAM4Uu.	\N	11	2026-08-09 04:28:29.347	2026-08-09 04:28:29.347	\N	\N	\N	Aktif	S1 Desain Komunikasi Visual	+628882000819146	t	\N
ab6a944c-a66a-4d87-af83-56a62a887681	Renata Rufaidah	$2a$10$nuo2k6LLY9jWJG/wduZMu.F9PVWx/HzOlZxUorVZVW0G7HVjO39Cm	\N	11	2026-08-09 04:28:29.542	2026-08-09 04:28:29.542	\N	\N	\N	Aktif	S1 Hubungan Internasional	+62881023654486	t	\N
1cfc9ffb-0381-4640-be2c-0801adf48f33	Agung Utama Kusuma	$2a$10$TDim/.Tt0wsASvnD2AMR4e6GF0WNPqOFxJ5fNCleavUUeyCF9Ac1a	\N	11	2026-08-09 04:28:29.748	2026-08-09 04:28:29.748	\N	\N	\N	Aktif	S1 Sistem Informasi	+6289991392308	t	\N
d22c7cc0-a0fc-4639-b459-25675bcb223b	Gilang Bayu Pratama	$2a$10$ubawznkXw3vtAi4DnFY7EeuoF01Cer65kxl8y9FOn25TWwKJkDHKy	\N	11	2026-08-09 04:28:30.321	2026-08-09 04:28:30.321	\N	\N	\N	Aktif	S1 Sistem Komputer	+62881023612165	t	\N
c093feb8-5f7f-4fd2-9481-a768f392877a	Khairul	$2a$10$wz64NYuc2uM5QbjuXknytesOx2J5CgVRlAq6biwyQH1O.qpU.kH.i	\N	11	2026-08-09 04:28:30.524	2026-08-09 04:28:30.524	\N	\N	\N	Aktif	S1 Teknik Sipil	+6285765163177	t	\N
1116d010-e3bd-444e-a015-384cd92adc96	Dimas Perkasa Agung Putra	$2a$10$mTdXqsCL5bXDsu0AAAXtX.8XyoBi3d0HDnKzWLWGh/XmZBi5nJKly	\N	11	2026-08-09 04:28:30.74	2026-08-09 04:28:30.74	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281222191512	t	\N
de5d7974-9e42-4b85-b217-04376c9c1f4e	Nadhira Aprillia	$2a$10$W4XNXRJdoyCCv7gbJGslS.ia9x5e8TBOBrUw0rORbplJWZSwZcNte	\N	11	2026-08-09 04:28:31.496	2026-08-09 04:28:31.496	\N	\N	\N	Aktif	S1 Teknik Informatika	+628782395724	t	\N
c40c04c8-6ac1-49bb-b73c-8e258f066ce3	Fikri Sofyansyah	$2a$10$nyL0TMbmvFoJPa8WAqcZDOYRQ4rmRrTbprc6nXMaYeal3De26tVkG	\N	11	2026-08-09 04:28:31.691	2026-08-09 04:28:31.691	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281313043411	t	\N
ec5dd756-3a15-444c-aa4a-c26ebd0b4fd0	Hizkia Imanuel Edho	$2a$10$a4iqsjwh.bOkGlUDXssTaO16dLwy46Soanya55hM.jmiClKqigd5m	\N	11	2026-08-09 04:28:32.135	2026-08-09 04:28:32.135	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285624705371	t	\N
37fe0380-d570-42d3-8644-115835748565	Fitri Najla Salsabila	$2a$10$HUBIONN6Uw7yyJ3c/AVUcue8b3MVVhpZrCoiR4jvCyd59QUzQo31C	\N	11	2026-08-09 04:28:33.864	2026-08-09 04:28:33.864	\N	\N	\N	Aktif	S1 Ilmu Hukum	+6282121373288	t	\N
e0ca302a-ad36-4913-995d-ba8990f46c1c	Aulia Zahwa Putri	$2a$10$eIexsCMLWiIvhotAYsstcetMk2lCxHNB2lLr0N9hZ5ajzf0UDoBsm	\N	11	2026-08-09 04:28:34.256	2026-08-09 04:28:34.256	\N	\N	\N	Aktif	S1 Sastra Jepang	+6282111146907	t	\N
0e61baed-c6a5-46b9-8081-36d349f0103f	Muhammad Rizki	$2a$10$Pya6tnR4FlOZW.IWpiREL.TLwbRjVpu4dc4ggb.gWpDPdp2m4sf0e	\N	11	2026-08-09 04:28:34.851	2026-08-09 04:28:34.851	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282121730722	t	\N
6c586b4f-45e7-4400-8b8f-c110f0591c82	Naufal Putra Firmansyah	$2a$10$8P41zy2mZKEroK6YlMnDqO3oN3vsurhn8wD8UmDpjGOz6baYI.vzy	\N	11	2026-08-09 04:28:35.04	2026-08-09 04:28:35.04	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282129566829	t	\N
e5b224da-4c4f-42c0-b2db-6170714cd5e2	Novi Fitriani	$2a$10$9Ad1PJSwRnNXdQSBugCaxOwtQrBmRZEQu0ed6.mmRgXY7/YTuqdZy	\N	11	2026-08-09 04:28:35.598	2026-08-09 04:28:35.598	\N	\N	\N	Aktif	S1 Akuntansi	+6289658155892	t	\N
3ba07760-101e-4fb7-a7f9-98ae03132e39	Muhammad Luthfi Berlian	$2a$10$0u1wQcT8eMXxsVFvaAw2.OFIO5fS/LQBjDtRd51C639X/pugEX2cG	\N	11	2026-08-09 04:28:35.786	2026-08-09 04:28:35.786	\N	\N	\N	Aktif	S1 Desain Interior	+6285800135813	t	\N
e04eafcf-c491-4459-abf0-e660577d36b3	Muhammad Marcello Meilano	$2a$10$s6h3wRNczI5iLFTi2q9mDu/61TE8/1cIBVsg735KbV5PqBmi55Fq.	\N	11	2026-08-09 04:28:36.168	2026-08-09 04:28:36.168	\N	\N	\N	Aktif	S1 Sistem Informasi	+6282214003063	t	\N
2eb67e22-12b1-4242-af97-5356f7700fdd	Fadilah Aulia Rahman	$2a$10$Ewu3vo6fksJIalL/TqEDBOT3ZIkUXoq2Ee64dGs6xyj7o0orw/Iy6	\N	11	2026-08-09 04:28:36.4	2026-08-09 04:28:36.4	\N	\N	\N	Aktif	S1 Teknik Arsitektur	+6287764627819	t	\N
95c03cd5-4949-4bee-a012-190859a27000	Rayhana Aqila Gefira	$2a$10$1.ZKCVPIiZpwe9XQv3QBeOKHkO2abfCYcFt4xzPK9ljBC8q9l2FHy	\N	11	2026-08-09 04:28:38.828	2026-08-09 04:28:38.828	\N	\N	\N	Aktif	Sistem Informasi	+6281320368738	t	\N
61d91121-a976-459a-a70b-1cf166ddd16a	Salma Fahrezi	$2a$10$2Zoe5X7OGUXJZoI4/s1GW.obfq/0igNa5dzVTsROuHarPyPGf7qy6	\N	11	2026-08-09 04:28:39.075	2026-08-09 04:28:39.075	\N	\N	\N	Aktif	Sistem komputer	+6285863730151	t	\N
3c31d6d7-ab5d-4573-b915-17bea0e19fed	Hilma Humaeroh	$2a$10$o/K3YAzJCfLmF1Tnt/cu.O/boHEmVZYkEzcj9NK1.X.hSTyUJ7dWO	\N	11	2026-08-09 04:28:39.319	2026-08-09 04:28:39.319	\N	\N	\N	Aktif	Sastra Inggris S1	+6288299491714	t	\N
4a2d8abc-715b-4dd7-9161-a09a0dbb03b4	Raffa Muhammed Arridho	$2a$10$IUgTKjtpnEgZjPqL/zduT.Lwwnp42ObBR2Yi.aBim3WQT4hBtpPw6	\N	11	2026-08-09 04:28:39.909	2026-08-09 04:28:39.909	\N	\N	\N	Aktif	Teknik Elektro	+6285723024117	t	\N
a4d869ba-d863-425b-a9f3-9a737e156a34	Miko Pratama	$2a$10$hK830CPqqGPJ8eu0Bi0hY.yojmrWGYQnn1Lwcz2gPGedVJsspY4A.	\N	11	2026-08-09 04:28:41.875	2026-08-09 04:28:41.875	\N	\N	\N	Aktif	S1 Teknik Arsitektur	+6283802480630	t	\N
6198792a-e425-4b18-849a-1195b2eca70d	Zhanifa Meluna Fatiha	$2a$10$4xryCd8tq1lWBMTFi060rem0VbWYhfGasm6T7Ivhz7wTAMLmGNpmi	\N	11	2026-08-09 04:28:42.057	2026-08-09 04:28:42.057	\N	\N	\N	Aktif	S1 Hubungan Internasional	+6285715546672	t	\N
9c9f4977-2fdb-4e02-bad0-77d105d37d51	faisal syahrul gufron	$2a$10$BJVTHcMCBnSomFtXYZFV9.KCUjTx5qQzrLnrIxubbDUDFDs47QFtS	\N	11	2026-08-09 04:28:43.16	2026-08-09 04:28:43.16	\N	\N	\N	Aktif	S1 Teknik Sipil	+6285174230539	t	\N
a9c96d2d-3d7a-4991-a822-2a06c8160c23	Khoirunnisa Arpandi	$2a$10$RrlG8BcrCOLopo4b2Rkqe.TpZDO8TQeH64yc2H5twyw/s3nLx0a82	\N	11	2026-08-09 04:28:43.396	2026-08-09 04:28:43.396	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282280795516	t	\N
046fb108-7a45-4965-881b-f9c589e86063	Muhammad Ihsan	$2a$10$mvXJSEg780ubfLw2x/2cketeiMQadTgYJOD310GtOuYSQZaA5Qta6	\N	11	2026-08-09 04:28:43.972	2026-08-09 04:28:43.972	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285718158861	t	\N
fd3ce577-2b0e-4572-8a9a-372802e19753	Arya Yaga Rafi' Azaria	$2a$10$vOasKpkLLU.si16VkbmUPuDZEITLS2aY6raDHuoBVQWvPHKtSQ6Gm	\N	11	2026-08-09 04:28:45.854	2026-08-09 04:28:45.854	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281211536756	t	\N
b006dcc2-417d-4454-b66b-d545f65e10dd	Wa Ode Calisyah Anastasya	$2a$10$3aN6lugjGwaen4F9DB5BzelTUzZFARrvNY1ixCzW2kO2qBCzHQk0q	\N	11	2026-08-09 04:28:46.061	2026-08-09 04:28:46.061	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285162992393	t	\N
4d7594a0-e876-4f5c-9102-73073406fc8c	Diwa	$2a$10$o8PcBI1FTJZEGbf9suquXOCFd/aaxOW2H7GbMlRB9DPyWV9qVDDZC	\N	11	2026-08-09 04:28:46.702	2026-08-09 04:28:46.702	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285789014173	t	\N
cd4a7e2f-c598-4de6-ab3e-57acef90f2dc	Dea Michelya Alba	$2a$10$jiyImsw0vfTUBo9sWTeSeOGn3YAo.eIyLDfhVBJT6Zbr1hdQoMQKy	\N	11	2026-08-09 04:28:47.422	2026-08-09 04:28:47.422	\N	\N	\N	Aktif	S1 Akuntansi	+62881022275815	t	\N
3dd23164-097d-4a16-8453-e107b3532d34	Lisa Putri Maharani	$2a$10$/BxOPNTwuTThhr9e3mNBE.s6pRCB9W.GmwAVCMa6MCBr/7ICaHIly	\N	11	2026-08-09 04:28:48.422	2026-08-09 04:28:48.422	\N	\N	\N	Aktif	S1 Sistem Informasi	+6285797950518	t	\N
0d89606e-363d-47c4-adf0-c3a4dfa5dc2e	Riska Aprilia	$2a$10$LkETSh.W.iUKngJBz5rj/efzhTCn1HNAWlNN6wr3E8KEIyOo.n3jG	\N	11	2026-08-09 04:28:48.603	2026-08-09 04:28:48.603	\N	\N	\N	Aktif	Sastra Inggris	+6285862529929	t	\N
30f703df-69c4-4fe1-8329-c448543fd9f3	Addin Ramadhan	$2a$10$C3uroJqDkHY2g9jg7LiUUuJwhrtJXgGvNXkl0RQWSg7AewP2HcdG2	\N	11	2026-08-09 04:28:48.8	2026-08-09 04:28:48.8	\N	\N	\N	Aktif	S1 Teknik Elektro	+6287774076941	t	\N
f1bc8080-9a74-4f26-835d-abc9f39bd02c	Muhammad Rakha Ikhsan	$2a$10$kCSGIRpt2crsmI7vG9coZOSMkaiKlVelDdRaTxCxAiFbdefaB8qXa	\N	11	2026-08-09 04:28:49.785	2026-08-09 04:28:49.785	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281916460333	t	\N
e8f93b0d-f4a6-407e-a602-99bb1ca9677c	Pengurus RW 40 - Kel. Sadang Serang	$2a$10$JAJMFpMlS6WjP0b9cae8LuWemPvaSnfL2KhKW4M.297fIgYfjUJi6	\N	5	2026-08-09 04:28:49.979	2026-08-09 04:28:49.979	\N	\N	\N	Aktif	\N	+628120040	f	\N
af97201d-d4d6-40ce-84e6-21c2e3200c1c	Teguh Muhammad Iqbal	$2a$10$p.kpD4RBj2M84SUjTx4yMuySVdvgnlLIt2qQh2NPVj4UO08MNk18W	\N	11	2026-08-09 04:28:50.179	2026-08-09 04:28:50.179	\N	\N	\N	Aktif	S1 Akuntansi	+6287834711845	t	\N
64ec8e15-7eed-4996-b07c-7c5305e7bf1c	Rully Aditia Ramadan	$2a$10$s9OUNJzqY/ufmmxeKwMx4.3zquh6V721eEgcCdVCLyGpfKVXVa05.	\N	11	2026-08-09 04:28:50.374	2026-08-09 04:28:50.374	\N	\N	\N	Aktif	S1 Ilmu Hukum	+6283897996269	t	\N
06523d6b-54bd-4301-ac53-d68d994487a1	SISKA LESTARI	$2a$10$Ak7HlXASl7qx64IFl70d1udURJ6LTY496ucMiROQWSrosNxg26ljy	\N	11	2026-08-09 04:28:50.571	2026-08-09 04:28:50.571	\N	\N	\N	Aktif	S1 Sistem Informasi	+628217037621	t	\N
63a8061f-2557-4b46-8424-0a9b1d3e6d59	Deliyanti Aprilia	$2a$10$6lPzyKiWUvzQJJWc3/uK4e.LWhsfNTv7ZQkMIjfW1TA28Bkkwe1uG	\N	11	2026-08-09 04:28:50.778	2026-08-09 04:28:50.778	\N	\N	\N	Aktif	S1 Sistem Informasi	+6281220917393	t	\N
88a184e2-7070-4de0-ac1c-fd36178cfd5b	Robi Zoelfahmi	$2a$10$T68C2DIPS.1ioFIop0Q7iuUH4OAbJhTn9pP/ZGT1/01PxNnQrw7DS	\N	11	2026-08-09 04:28:50.965	2026-08-09 04:28:50.965	\N	\N	\N	Aktif	S1 Sastra Jepang	+6285189950361	t	\N
37138046-4ef0-40ff-9272-b66f2ad35973	Iviani Gerbian	$2a$10$dNfvExbxEzGloR0R2Az6v.mFC4aj6YcDJR46pG/kyqAuMmw1nzYs2	\N	11	2026-08-09 04:28:51.76	2026-08-09 04:28:51.76	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285722574462	t	\N
35db03fb-6842-450f-b062-60b1f499987f	Rifki Audzikri Nurwahid	$2a$10$4w4c6sSvE2YiFXFde9jGientLChgwToxAN0HPhWQNievpAu7OeAo.	\N	11	2026-08-09 04:28:52.163	2026-08-09 04:28:52.163	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282118920881	t	\N
56971f16-7818-4f6f-866d-b27cf4b76da4	Haky Jawwad Al Hakim Effendi	$2a$10$.jmQGgo406kUGoZ71/Lr/e.3qDEDDsDWOhY8UIrWyQBwb31PGVWbO	\N	11	2026-08-09 04:28:52.348	2026-08-09 04:28:52.348	\N	\N	\N	Aktif	S1 Teknik Informatika	+628996093081	t	\N
09be075d-5ee6-40e1-bdaf-cc48271fc559	Dhafa bagas nurfaisal	$2a$10$pT4xDtRnmdHXseJCvgLRiejQ8INrYwUpwgZZZLXQyZYGsoT.axXU2	\N	11	2026-08-09 04:28:52.565	2026-08-09 04:28:52.565	\N	\N	\N	Aktif	S1 Akuntansi	+628176531899	t	\N
6fd1fbda-0dbd-4671-97e6-4d64481ea2b4	Muhammad Syidik Hidayattuloh	$2a$10$Dega/aQK3Bkcfdl.HzD1Ku2pS52Xp/knqWDFd7klpphcZxpoQ1zeG	\N	11	2026-08-09 04:28:52.766	2026-08-09 04:28:52.766	\N	\N	\N	Aktif	D3 Desain Grafis	+6285295877936	t	\N
1af98c84-c1a1-4afe-9904-59ff7eecd015	Afifah Dwi Puspita	$2a$10$8IL3B0vCiQu2crGaqsaTn.22sOdD7rEP9x/aKqh1XSsAz.GjMf54.	\N	11	2026-08-09 04:28:53.171	2026-08-09 04:28:53.171	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+6285722435449	t	\N
c5b30864-2de3-4d37-b6a0-55cb81dc71d6	MUHAMMAD IHRAM NOOR RASYAD	$2a$10$AtN.xXsWNCnkY/NcP7LEZ.8LSEHv5t6OuMszoIg7yzoHVYZ2V0pnG	\N	11	2026-08-09 04:28:54.136	2026-08-09 04:28:54.136	\N	\N	\N	Aktif	S1 Teknik Sipil	+6287822897263	t	\N
3f5531a4-bb7d-4658-9cbc-3d84bce8d4e4	Ginda Nugraha Pratama	$2a$10$WaDU1yheEfm8Qi6nP5rD3eanBE/BG6B5qVHeoJqzqhRRwuQnCd5Qi	\N	11	2026-08-09 04:28:54.71	2026-08-09 04:28:54.71	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285925727279	t	\N
2a229a3e-ea44-45ee-a43b-7260a05e1e59	Akbar Taupiq Alamsyah	$2a$10$Nuyn7AZqIl2F0PHxaOz12uJ11eWebBiAE0Ldl.8diSDK.RQQi8fuu	\N	11	2026-08-09 04:28:54.903	2026-08-09 04:28:54.903	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282320397605	t	\N
64847fc3-b9d9-47aa-9f9a-c47de71133f0	Lion star sabolo gaho	$2a$10$vQfdwZGSl.elANaSRHZEdemY1hH/NCb4.pYM43AA3tL6k3Di9u/yK	\N	11	2026-08-09 04:28:35.972	2026-08-09 04:28:35.972	\N	\N	\N	Aktif	S1 Ilmu Pemerintahan	+6281228906205	t	\N
57005bc7-8852-4cea-be11-2b75c41a549b	Arasya Melandri Winardi	$2a$10$/CfjUIlY222RqlL.B9MMI.cEFshCGH7RBk.eMcssDFd0HeYYIORQm	\N	11	2026-08-09 04:28:37.06	2026-08-09 04:28:37.06	\N	\N	\N	Aktif	S1 Teknik Sipil	+6289517214700	t	\N
ea7dd519-3323-4c56-84da-8a66ff44f181	Pebi Pitra Rahman	$2a$10$XwCGhw5PZ37uVTqSEgFfzOa0Tbvt0CZGa.ez/vYXhXJriK61rbFr2	\N	11	2026-08-09 04:28:37.265	2026-08-09 04:28:37.265	\N	\N	\N	Aktif	S1 Sistem Komputer	+6283895107436	t	\N
1776bbdf-ec51-4711-a8fb-bda8a2ec8b21	Fikar wiguna nugraha	$2a$10$2uA7Tcta4pXtaicHXNP0W.YOs9exQhnXgARbdOsChWs3TOo2Kno16	\N	11	2026-08-09 04:28:37.942	2026-08-09 04:28:37.942	\N	\N	\N	Aktif	Sistem Informasi	+6283805225393	t	\N
08c54bfd-b770-466a-8b7f-9e85e58a3fb5	Naufal Akbar Subarna	$2a$10$ADL6yS4d53jTmehsu/xN6ea2X49wVYbbLMngLhnmX6rB30flZXRam	\N	11	2026-08-09 04:28:40.096	2026-08-09 04:28:40.096	\N	\N	\N	Aktif	Teknik Elektro	+6285722143518	t	\N
a3dda951-6a56-4323-9526-124b4bfa45e0	Widia Rizqi Gusti Amandani	$2a$10$pDNtPpB0oAkMnATPn7ilLuDExnVjCOpicr59hE8nkS92bGt07.N.q	\N	11	2026-08-09 04:28:40.31	2026-08-09 04:28:40.31	\N	\N	\N	Aktif	Ilmu Komunikasi	+6283897010513	t	\N
4c6702fa-06e7-4eeb-a43b-55ae8d08b353	Muhamad Azhwar Aji Kurnia	$2a$10$FbHsLdp4k05ehIEcsQEqiOFnFOo6kSOEKSDMSHGz4lxNkLihREMrO	\N	11	2026-08-09 04:28:40.497	2026-08-09 04:28:40.497	\N	\N	\N	Aktif	Teknik Industri	+6289637331211	t	\N
9901977a-2c48-4235-b429-acdf010a3fd8	M. Ilyas Fachrezy Nur'ichsan	$2a$10$7YIctP9ebc1mU1y1YmZ58.4Eoj54aPET1eRY2Pwzs0rW0dVfEAUru	\N	11	2026-08-09 04:28:40.672	2026-08-09 04:28:40.672	\N	\N	\N	Aktif	Teknik Informatika	+6287798960157	t	\N
72c9032a-fe36-4fa1-99d7-29082745ae6a	Lalu Dias Permana Grigis	$2a$10$eSxNGxk35E7xwBL2BUpz../sS8HR90/l2/rxIuQLOHSGBT9s5Yw9u	\N	11	2026-08-09 04:28:40.856	2026-08-09 04:28:40.856	\N	\N	\N	Aktif	Teknik Sipil	+6289668117678	t	\N
01adf45f-c72b-4192-89dd-2a46392c56b9	MUHAMMAD ARKAN GIFARI	$2a$10$BMMM6yD1R1hCofW.ITHvn.SFoUm2UGfyWtkISZqY9sztjJuzGFqfS	\N	11	2026-08-09 04:28:41.052	2026-08-09 04:28:41.052	\N	\N	\N	Aktif	Teknik Arsitektur	+6282126144109	t	\N
5e7ebff9-1e5c-4118-b9cf-a0092877a885	Lidya Anjani	$2a$10$tJNg8kGBlDs1Kh7Bcu1yjuRrwY94ZK4HzrZgGpyciHH0NV.Ll8PMq	\N	11	2026-08-09 04:28:41.255	2026-08-09 04:28:41.255	\N	\N	\N	Aktif	Teknik Perencanaan Wilayah dan Kota	+6287882731641	t	\N
fa089128-29de-4d74-b2f1-1a39767a4708	Pengurus RW 21 - Kel. Sadang Serang	$2a$10$zzshTQaxONHNUZqS8xY.muzqkCuIbIP9LF4n6.GsOYAzN/XSw08G6	\N	5	2026-08-09 04:28:41.458	2026-08-09 04:28:41.458	\N	\N	\N	Aktif	\N	+628120021	f	\N
5ee0bd0b-b3c3-4049-9f5b-8de9856e6d9c	Anugrah Rizky Agustian	$2a$10$.1W5ZaCkkBpdri/WHQbGxuCsbCgGJNIUoKM2zReziEsq/pOei8iNy	\N	11	2026-08-09 04:28:41.656	2026-08-09 04:28:41.656	\N	\N	\N	Aktif	S1 Akuntansi	+6289517607195	t	\N
a90949e7-2066-457f-a3b0-622c4dc3fa9e	RIZKI ADITIA RIFALDI	$2a$10$SOM96W3tsUHlVYBYVCJFAeD0xdNpc2QQ/cTFoNsQYV5fZorOL8bcG	\N	11	2026-08-09 04:28:42.248	2026-08-09 04:28:42.248	\N	\N	\N	Aktif	S1 Ilmu Pemerintahan	+6281574454957	t	\N
5119796d-6a6b-4b97-8926-009ab4f8373e	Muhammad Hafidz Zidan Sukri	$2a$10$3ShSHNvXrwCkakS0L5Y90OWZJ/a28BShs0/qseocDVsmJVwPobqf6	\N	11	2026-08-09 04:28:42.437	2026-08-09 04:28:42.437	\N	\N	\N	Aktif	S1 Sistem Informasi	+6281586336263	t	\N
fd08e0b1-9396-4cb7-ac8c-e41aa9874063	muhammad dafa ikhlashul amal	$2a$10$5sFcaIMBiA79hZ/eLFHbP.kP8n5hMsvo6oRh3yPKNl2WaFBn5EbHm	\N	11	2026-08-09 04:28:42.624	2026-08-09 04:28:42.624	\N	\N	\N	Aktif	D3 Manajemen Informatika	+6282217417415	t	\N
66a36c9c-6efa-4080-b925-997925de0dd8	Parid Anwarhana	$2a$10$NrqYMrM/Bm5kunHn.LxUqu9pgbPdb8LD93LZS15ujkctq3Dxss1n6	\N	11	2026-08-09 04:28:42.802	2026-08-09 04:28:42.802	\N	\N	\N	Aktif	S1 Sistem Komputer	+6285603374592	t	\N
860ba5e5-1b3b-466c-836e-329b25845ba0	RIZKI SAPUTRA	$2a$10$VpY6o8Awot5eNKyOIVQE9OLojZSsGoEtWGIHqQtkEEdEs6g6vRZi2	\N	11	2026-08-09 04:28:42.977	2026-08-09 04:28:42.977	\N	\N	\N	Aktif	S1 Teknik Industri	+6281312658717	t	\N
f4a4ce93-ceb3-43dc-a350-7695a893fb02	Malfin Jaffan Inggil Waskito	$2a$10$7tXM5OxagmsaojH5rNs60.lgTAVbxotY3SEvJuBQDEKXHoU3AbnzS	\N	11	2026-08-09 04:28:43.581	2026-08-09 04:28:43.581	\N	\N	\N	Aktif	S1 Teknik Informatika	+62895606173928	t	\N
8328affd-86d8-4828-8e5d-b5914051ecfe	Asep Saepul	$2a$10$3AUOzhEiZRGCU8o1HMt/tuFVZHQRyg4db7H9bSDhiFkAcsjutmvHi	\N	11	2026-08-09 04:28:43.773	2026-08-09 04:28:43.773	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282315261498	t	\N
b70a207c-2fec-4c41-b9cc-5d1a7d092cff	Livia syakira	$2a$10$8eEDzzwUm6upxa3WD1cRoeb3M9Vh5PqsbXjNoKrHQOQeok2b5q2AS	\N	11	2026-08-09 04:28:44.203	2026-08-09 04:28:44.203	\N	\N	\N	Aktif	S1 Akuntansi	+6282118959063	t	\N
83cbad70-037d-4697-98ee-acdac9bbd4ec	diaz mahram	$2a$10$YDTnwXuFmW.SKV3n2luU8efmsgUOdiHhO1olzsGhdbSZTTrrn481m	\N	11	2026-08-09 04:28:44.427	2026-08-09 04:28:44.427	\N	\N	\N	Aktif	S1 Teknik Arsitektur	+6287786555511	t	\N
181394fe-f4ec-4880-854a-e222387e9c5b	zazkya bunga pratiwi	$2a$10$LdMp308BBdK.YktXTi.xWuizHj/pB/DRjfxNSSLfTDthYeVDCLqD6	\N	11	2026-08-09 04:28:44.632	2026-08-09 04:28:44.632	\N	\N	\N	Aktif	S1 Ilmu Hukum	+6282130120101	t	\N
803de4b7-d467-42cf-900f-83b8661832fe	SITI MARYAM HOPIYAH	$2a$10$nUGi5ZuMVJFo47mEXCEf2O7gbdqtiWDaSeiDaAzdqWnOrX4fliSTy	\N	11	2026-08-09 04:28:44.837	2026-08-09 04:28:44.837	\N	\N	\N	Aktif	S1 Sistem Informasi	+6281222144698	t	\N
225dd904-6831-413d-a7bc-48fb0ec27bca	Furqon potabuga	$2a$10$6mLuwZLUurBdIJTNM84qUOrfaUCJr2ig8gcgOs3T4m6zklRPHvNQm	\N	11	2026-08-09 04:28:45.038	2026-08-09 04:28:45.038	\N	\N	\N	Aktif	S1 Sistem Informasi	+6285706204879	t	\N
56e818b1-302e-4dc8-80cd-abbf8675f317	GHAZIALGHIFARI	$2a$10$WpEGSCt/p.11q6hhCyac0eoek0D/vtqWbnEEGSbIe/0PnzXWysYLO	\N	11	2026-08-09 04:28:45.239	2026-08-09 04:28:45.239	\N	\N	\N	Aktif	S1 Teknik PWK	+6285830402767	t	\N
49d87bb7-7058-4298-bffd-9be19cf3ba0e	Moch. Zaini Miftah	$2a$10$FyhYfCnunsq2.bCSHl9MNuIH1n8Ic4d2ZObZz7xjTLE1g2f1aUaMq	\N	11	2026-08-09 04:28:45.436	2026-08-09 04:28:45.436	\N	\N	\N	Aktif	S1 Sistem Komputer	+6289516085578	t	\N
4576859a-e645-4515-b7f1-1358b94e289d	Ibnu Achsan Taqwim	$2a$10$ZxvFjbR73rj3lMQonq8F3uOwRm3608mv0szbSfnNn0dcseADs2LN2	\N	11	2026-08-09 04:28:45.646	2026-08-09 04:28:45.646	\N	\N	\N	Aktif	S1 Teknik Industri	+62813873873140	t	\N
a83235f8-105c-48d3-844f-f1f2cd5b3079	Valyza Safina Zoia Azzura	$2a$10$rIVHhaGaaePK32YCsdaH0e7WqDbgujNn.GQ/4MXBE3SYpVxE.2R4C	\N	11	2026-08-09 04:28:46.271	2026-08-09 04:28:46.271	\N	\N	\N	Aktif	S1 Teknik Informatika	+6283174565723	t	\N
e07df197-f516-427f-99ec-cdacc9a43b48	Talitha Vania	$2a$10$644CL45GL/4es8nF4U6aKuJtrTsD3Z/Ifnnp6YoofMNctfNEv2Luy	\N	11	2026-08-09 04:28:46.493	2026-08-09 04:28:46.493	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282278497034	t	\N
11385302-e8cc-4c4e-807d-1146b2b87a49	Pengurus RW 18 - Kel. Sadang Serang	$2a$10$XVk1m3Izya/JHqDPbuoYmO9I2Srhh1v/bRXGUdL//r523RIi3p9s6	\N	5	2026-08-09 04:28:46.886	2026-08-09 04:28:46.886	\N	\N	\N	Aktif	\N	+628120018	f	\N
9e5f70a8-88a2-4efe-9b50-e3508245b76a	Pengurus RW 19 - Kel. Sadang Serang	$2a$10$4hmatfc/prord/bQ5h8G2e0zuqNw1BZt8oKpoDDxjjCOBlJo7K896	\N	5	2026-08-09 04:28:47.072	2026-08-09 04:28:47.072	\N	\N	\N	Aktif	\N	+628120019	f	\N
73f99e41-e826-4eb7-ba94-00381034304c	Pengurus RW 20 - Kel. Sadang Serang	$2a$10$gmarB0LfiApNLHiDWzpx3ugRP5zCmX13v4SeV2LBzH8Uu3/xwwZ4C	\N	5	2026-08-09 04:28:47.243	2026-08-09 04:28:47.243	\N	\N	\N	Aktif	\N	+628120020	f	\N
1baba2cf-9b98-40e9-b4b5-a12491395fc1	Muhammad Rizky Laksana	$2a$10$nnnlAm9zX5pjVsLChEi/Q.3KNLD.bNqqle3v4xpnHMJJoovcXLvq2	\N	11	2026-08-09 04:28:47.622	2026-08-09 04:28:47.622	\N	\N	\N	Aktif	S1 Teknik Arsitektur	+6281910596936	t	\N
9e4363d1-05b4-4739-87b3-eb25aeff736e	Raka Habibi	$2a$10$NWOHm0wLMvr.quNVXuBSw.8jCnEG4I8ZUb8uApBv7PCiVyxmEhN5u	\N	11	2026-08-09 04:28:47.823	2026-08-09 04:28:47.823	\N	\N	\N	Aktif	S1 Desain Komunikasi Visual	+6285183497702	t	\N
26110b4a-8428-4913-a27c-119b091679d7	cindy mega amelia	$2a$10$BYc8VZdDMSQ58Xt1bYD36.8gJ9vbZ/J0KhEErOuwYXAswhcVlvwb2	\N	11	2026-08-09 04:28:48.011	2026-08-09 04:28:48.011	\N	\N	\N	Aktif	S1 Ilmu Hukum	+6289655323410	t	\N
49e30cee-366e-410e-985f-f40fcddc7cea	Fazlie Mawla Al Ammarik	$2a$10$9c1Ged.Npe8t3/ZlXQ8bReBoXUGNfySjBNYizvu0FiAIN9Ufw5peG	\N	11	2026-08-09 04:28:48.215	2026-08-09 04:28:48.215	\N	\N	\N	Aktif	S1 Sistem Informasi	+6281224110867	t	\N
467147f0-f409-4b35-a75a-6243ca1832a2	Rilva Muhammad Akbar	$2a$10$wpnePBJ4rwjaKRI7nnugAepG4NDodD1vaJ.OHsMjqYUaaEEsW.c4a	\N	11	2026-08-09 04:28:48.997	2026-08-09 04:28:48.997	\N	\N	\N	Aktif	S1 Teknik Industri	+6283822577218	t	\N
590e7065-9b12-4174-ab7b-bcbd2cf286a3	Angga Adhya Pratama	$2a$10$MSXzothF9Hlmwcaq.A59sOJdYQILqiM7TTRkPV3kDw108/O0rZ5rS	\N	11	2026-08-09 04:28:49.191	2026-08-09 04:28:49.191	\N	\N	\N	Aktif	S1 Teknik Informatika	+6289531515716	t	\N
9f4b1236-4e90-46fe-bc74-5260dfa62b25	Siti Marhamah	$2a$10$cFVS0yQjsoS0.J1Fjatd0OOPXn0q3yTNSpLAb0tQFYqnmstpnZByS	\N	11	2026-08-09 04:28:49.393	2026-08-09 04:28:49.393	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285199528097	t	\N
36d907b3-a9fa-4fda-96cb-1b4a66853d93	Regita Setiani	$2a$10$pSk7LmWf6dg4I2T/rSmEHus7uVcy5svQWW1lKMZNDVhvDFpui1d4q	\N	11	2026-08-09 04:28:49.581	2026-08-09 04:28:49.581	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281382968508	t	\N
53d2ca5e-1ded-4a96-a47e-d585df181b05	Muhammad Tauriq Khairy	$2a$10$Fj4J.eujohv/oAIpUwpKue4CY7.ifk2uyqGFgw9TYJ1QyDiCvJgIu	\N	11	2026-08-09 04:28:51.157	2026-08-09 04:28:51.157	\N	\N	\N	Aktif	D3 Teknik Komputer	+6285156157114	t	\N
28deb6c1-8dd8-48f4-988d-e444e1f85cdb	Sayyid Putra Ardano	$2a$10$XcdbRS9QqVR3.brZLFPcKelHUSIQwpX9xDQKann6O.G0o.2pXDp82	\N	11	2026-08-09 04:28:51.355	2026-08-09 04:28:51.355	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281290468757	t	\N
8a030fe3-e7a0-4fdf-aa8b-3558ec559c25	Siti Nurhaliza	$2a$10$AIPVjIvoLXSLVrkMzE9gcO9AxYfHBALWlJe62XBgSOVUzT4iIfoEG	\N	11	2026-08-09 04:28:51.566	2026-08-09 04:28:51.566	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282260923780	t	\N
f78e4ebc-528b-490b-9d71-9d562b5bfe8c	Salma Syarifah Muthi	$2a$10$MxH4qx1SxVMR0FB3NnMWcOhPzzDC8vx5eMAQLYOHOMdFW0btfKZuW	\N	11	2026-08-09 04:28:51.981	2026-08-09 04:28:51.981	\N	\N	\N	Aktif	S1 Teknik Informatika	+62881023359218	t	\N
8526c39d-723a-40de-bac9-0930e42d9be2	Khalisa Mugia Rahayu	$2a$10$fazjGneBqb.53bt0P4cdhu90w8..ShktUgJ3aeQzFapd5.PSlYGuy	\N	11	2026-08-09 04:28:52.971	2026-08-09 04:28:52.971	\N	\N	\N	Aktif	S1 Desain Komunikasi Visual	+6281223993761	t	\N
07e25c94-3d71-41b4-95af-76268ecf5867	Nadia Ramadhani Maulana	$2a$10$rglpoFpUR9k2.OJ/D2D7RenL19CTKuVvd3WZf1qbnjoiXipKDf7ri	\N	11	2026-08-09 04:28:53.355	2026-08-09 04:28:53.355	\N	\N	\N	Aktif	S1 Sistem Informasi	+6285295275593	t	\N
3d13d886-5b16-40b3-a23c-608d56cdc4ff	Muhammad Palda Satrio	$2a$10$35nZU84uclvVEz64.irwY.kM1bjRuizcZm9RMG2Sp8MKJHd5Dkn..	\N	11	2026-08-09 04:28:53.559	2026-08-09 04:28:53.559	\N	\N	\N	Aktif	S1 Sistem Informasi	+6281257320600	t	\N
84ec6c24-733b-44bc-b92d-5f77d8896096	Muzna Mazandarani Sabian	$2a$10$7vlnFoAp5F1rKPkCkR57JuhwVGuVTsox8DPyCa1dOQQOzWxDwr232	\N	11	2026-08-09 04:28:53.743	2026-08-09 04:28:53.743	\N	\N	\N	Aktif	S1 Sastra Jepang	+628814090320	t	\N
af47f0c0-9787-4d41-a977-4a408e9642e9	REZA APRIANSYAH	$2a$10$QUVm1O00X.0yxhI3arRqIuNwutQNlOUzkJDoOA606FzzCgRnCI6Pa	\N	11	2026-08-09 04:28:53.938	2026-08-09 04:28:53.938	\N	\N	\N	Aktif	S1 Teknik Elektro	+6285951801914	t	\N
73f31b17-b86a-49a9-abc8-83c098c94add	Wildan Madani	$2a$10$C6TgZjRR7US8yetsDlle3eDJlFKOnDiejkIOYa6/c5zh47lFQiHoC	\N	11	2026-08-09 04:28:54.318	2026-08-09 04:28:54.318	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281323813632	t	\N
df65fca9-46d0-434c-a99c-57cf709a23bb	Genta Nugraha	$2a$10$IbQ0Cwyl3oU1ry9KaO/WjuRO4X61LL9Utr0of6u4bczsZYbt8f2zu	\N	11	2026-08-09 04:28:54.527	2026-08-09 04:28:54.527	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282129647814	t	\N
7c553003-7fae-4cfd-99b5-5dfa77d93dea	Faris Farhan Al Fauzi	$2a$10$9U70B8WoqRdsiVbt5L7AIO607SxdL9oHbxKbDR4ylgxS6pCD7nVH.	\N	11	2026-08-09 04:28:55.531	2026-08-09 04:28:55.531	\N	\N	\N	Aktif	S1 Desain Interior	+6283107409486	t	\N
a768a066-022e-4e68-96e0-bcaa8101ae2a	Naila Zefanya	$2a$10$KXFu2Gd8pDSMorhhmMF...gNIqSrtTIeMxgc5C1u6ZsqbkyDMmr6C	\N	11	2026-08-09 04:28:55.72	2026-08-09 04:28:55.72	\N	\N	\N	Aktif	S1 Desain Komunikasi Visual	+6287875713449	t	\N
0e97c09f-dfa9-4911-bba1-222e14edf909	Sintya Ramadani	$2a$10$pmQehou4IGydJ9DEPNLzhOB2iu87ZTCYo6TxiCmNhPJ6uCgkTVf1W	\N	11	2026-08-09 04:28:56.493	2026-08-09 04:28:56.493	\N	\N	\N	Aktif	S1 Sastra Jepang	+6285640391031	t	\N
bbe1bfab-a239-462c-8ba7-540df648a58d	Muhammad Raffi Sauki Rifani	$2a$10$JgO9FfUTxP8fO8L86xAh.OrzOdrja9fdSQVUA6JNOe1KPge.nIfSe	\N	11	2026-08-09 04:28:56.695	2026-08-09 04:28:56.695	\N	\N	\N	Aktif	S1 Teknik Sipil	+6287819432735	t	\N
78809bcd-69a1-4dc6-ad22-81be3b8c1a56	Muhammad Raffi Nurragi	$2a$10$Al3gjfYrXlS5jJPf4JXu1uZH2PnfCFleoLKsPU2X4dOlZ4GTUjO42	\N	11	2026-08-09 04:28:56.895	2026-08-09 04:28:56.895	\N	\N	\N	Aktif	S1 Teknik Informatika	+628812076070	t	\N
27056381-b0ef-4f9e-96eb-76726a95474b	Rd. Fariz Nur Syawaluddin	$2a$10$Rixq2J5X2TUN7n7MuZc2WOQZpwR9jNsyjdTJ55QURrfqKSXPxiEVq	\N	11	2026-08-09 04:28:57.67	2026-08-09 04:28:57.67	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281313509451	t	\N
6996060e-7bd0-4445-b72e-b9ea3149f256	Pengurus RW 70 - Kel. Sadang Serang	$2a$10$gRiBSbnrEKxO4.gNxWYlDetLEaWAlOWajq7xZTWHyVEl0WRPuTnW2	\N	5	2026-08-09 04:28:57.872	2026-08-09 04:28:57.872	\N	\N	\N	Aktif	\N	+628120070	f	\N
dd41e3df-0ad7-4f88-a04f-faede2b51214	Ahmad Rusydan As Shidqi	$2a$10$OHmAqIjXTRg/q9/YGst/Ee/Edv8WM7s90A85zf43xFYpZN.FdT1He	\N	11	2026-08-09 04:28:58.255	2026-08-09 04:28:58.255	\N	\N	\N	Aktif	S1 Desain Interior	+6287780786466	t	\N
bb514859-3830-4fbb-b5f3-577991ed186d	Denara Anindita	$2a$10$EOj5oXGdILfZSE6mcZ7pUOncNvgX6eU8jHvNDhr5NSYb475V.4htm	\N	11	2026-08-09 04:28:58.644	2026-08-09 04:28:58.644	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+628999235712	t	\N
12030710-dff9-49ea-8a95-0eec96e4d99b	Zahra Orva Lannisa	$2a$10$5U/H4kcVTE24e9yIqbwHfu9Hq6IyzwA2vbPIb93OTjC4IwoWgA9oO	\N	11	2026-08-09 04:28:58.84	2026-08-09 04:28:58.84	\N	\N	\N	Aktif	S1 Sistem Informasi	+6281398147718	t	\N
e88646ba-d9be-47c3-b73c-59dcaea1b7f3	Serena Indriani	$2a$10$xmGW0DuMUUBNKZUEgbT4GOmWRbLQAJX0O8NLyO2KsBcGVFboyrXQe	\N	11	2026-08-09 04:28:59.216	2026-08-09 04:28:59.216	\N	\N	\N	Aktif	S1 Sastra Jepang	+6282285017405	t	\N
781e7a37-e436-4208-a5fe-8212b542d569	Niko Adrian Farizi	$2a$10$.zB033EZZbu/DOBZ3UP4leENOgZBWVteVsQXk5hfmvls.UmnFDw1u	\N	11	2026-08-09 04:28:59.587	2026-08-09 04:28:59.587	\N	\N	\N	Aktif	S1 Teknik Sipil	+6281384200878	t	\N
800e1c51-ef4b-46f5-803a-14fa8a321cc1	Redho Aljabar	$2a$10$YuHy6iAp67hHf7IGsW8AlOsgvvredYerMqQ4/SbyP2lTj28wLUBM6	\N	11	2026-08-09 04:28:59.767	2026-08-09 04:28:59.767	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282110666905	t	\N
a4230a80-4540-4ff2-9199-8781290f634a	Rania	$2a$10$XwFRwox968m9tkglW4esNOYFQTkC8aplYIihjsVl5CcRPkoyLTa.C	\N	11	2026-08-09 04:28:59.949	2026-08-09 04:28:59.949	\N	\N	\N	Aktif	S1 Teknik Informatika	+6283126162164	t	\N
82ad7bb7-dfe7-46b8-97d9-c6e64efe08c3	Farid Maulana Yusuf	$2a$10$DrYSGWJvFoYjdAnpFLttxO8Ig0Dah2ODYyo.yof0BjhCWIYfXjZRC	\N	11	2026-08-09 04:29:00.155	2026-08-09 04:29:00.155	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282223414588	t	\N
69ad8051-1794-483f-803f-2269eaca4c2c	Raida Layla Safa	$2a$10$gS0GJ6XOv6jjX0ehfJ1VaO8vl/Rw8byjhTJrmOI1jAfpsAKR0Ev7S	\N	11	2026-08-09 04:29:00.374	2026-08-09 04:29:00.374	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285523994165	t	\N
bc76f581-99bb-4025-b50c-183137b663f6	Dimas Rizki Nugraha	$2a$10$lnoa6WvyvAzbpQ8HBToIkOQdehZhRAyN1Wpp80BRdNacVpr9UYgPm	\N	11	2026-08-09 04:28:55.108	2026-08-09 04:28:55.108	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282118388672	t	\N
fe9bbb7a-acb6-47a0-bbf1-a54b60f3bb15	Adjie Muhammad Iqbal	$2a$10$Mv4HxGlJY/k9Wv9BuhPxtOugUdBSz8Ah9bC9KT7CbNlNEPz/rG52i	\N	11	2026-08-09 04:28:55.331	2026-08-09 04:28:55.331	\N	\N	\N	Aktif	D3 Akuntansi (Komputerisasi Akuntansi)	+6282230884065	t	\N
f09cb6bf-8c3f-4d41-8c21-ccd21f2a505a	Ni Luh Lina Susanti	$2a$10$ugPsWV9uwFy5LoBWjU5lXewhldIJzFl7/pNAo9FCnxHCcjphWaBJm	\N	11	2026-08-09 04:28:55.899	2026-08-09 04:28:55.899	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+6281916667550	t	\N
60889810-7bb9-4918-bbc3-b919de4ed9ab	Rifqi Mukhtarullah Azzaki	$2a$10$djfEvgZykeHtGg57Nl4JjelMvUmoVj2A665lb5qZNI0yBKpXrDMFy	\N	11	2026-08-09 04:28:56.094	2026-08-09 04:28:56.094	\N	\N	\N	Aktif	S1 Sistem Informasi	+6289991393428	t	\N
35102d9a-f86f-4156-9f28-ae58a6d11b57	Muhammad Nadhif Fawwaz	$2a$10$a4OcWqAoT/giGZsTe7QOKu0A2rq4JVPUfTbZVtjLYhmBlJcXnb2Fu	\N	11	2026-08-09 04:28:56.3	2026-08-09 04:28:56.3	\N	\N	\N	Aktif	S1 Sistem Informasi	+62895806585554	t	\N
f289614d-5263-4564-83be-3f4ed34a26ea	Febri Kurniawan	$2a$10$5sS0Gii/92LEOu7a1dWPhOJGX0yTyeqbDncFNY0s6oUS2cIQM54gu	\N	11	2026-08-09 04:28:57.103	2026-08-09 04:28:57.103	\N	\N	\N	Aktif	S1 Teknik Informatika	+62895355205081	t	\N
c4fce9d4-88b4-4c02-8a4d-b74783e1ef83	Zaki Imamul Umam	$2a$10$d1N9wt4El4wzGdLhTrEXVO1CNpWHFRXAZKVfd19LJLEnxAADdm1au	\N	11	2026-08-09 04:28:57.294	2026-08-09 04:28:57.294	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281315150602	t	\N
58c8feca-f4d0-4f76-99cc-5468c1326334	Farhan Farel Nauli Tanjung	$2a$10$LazYKR9FtRboSrha.hXafOOrCgUNiGFSX1KdZPRQAcL5x4sAi7hCS	\N	11	2026-08-09 04:28:57.471	2026-08-09 04:28:57.471	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282277924502	t	\N
9b7eaa7b-3501-484b-80ac-c77e3e23ef94	Mohammad Agung Arrifai	$2a$10$qeAofjo3bva6fIazO.icRuj7FyWQ3YKRrX8KZxGWPchLGHno6mnOO	\N	11	2026-08-09 04:28:58.06	2026-08-09 04:28:58.06	\N	\N	\N	Aktif	D3 Akuntansi	+6289516171044	t	\N
3a33ab6d-52c7-4cad-9ade-c9bd7f929245	Aristyan Akhsan	$2a$10$udCwd/C/DbQCRuMYm.Wv6.HS0hzYNN.EcWYOcrIMlR1GaZdRWGNKe	\N	11	2026-08-09 04:28:58.447	2026-08-09 04:28:58.447	\N	\N	\N	Aktif	S1 Desain Komunikasi Visual	+6282239290335	t	\N
aea2ad89-7913-488a-a6e6-10fbc336e03c	Rindu Syurga	$2a$10$dIZ29Zlv8NdEWiIU9qX4SuQZzCmn3xYE4x60DD.OwBYY7ritecWyy	\N	11	2026-08-09 04:28:59.03	2026-08-09 04:28:59.03	\N	\N	\N	Aktif	S1 Sistem Informasi	+6283833936383	t	\N
b9ed71e5-4af2-453a-be0a-81941031c179	Angga Nugraha	$2a$10$69vE8cuN0mfihWbCLJmDPOUdes8nmtlkZ8Uocp3BlWedwfkL3AwWG	\N	11	2026-08-09 04:28:59.4	2026-08-09 04:28:59.4	\N	\N	\N	Aktif	S1 Teknik Elektro	+6282298255474	t	\N
5d1084f5-d0e3-4a3f-b61e-a1e1ed088239	Arya Bisma Hartono	$2a$10$anMsrm.gEo6ahCUJ.329yuozcsYC3mpCHCqTRHbKxmiQH8QtpLsn2	\N	11	2026-08-09 04:29:00.557	2026-08-09 04:29:00.557	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282117279601	t	\N
96f567cb-7370-4b3d-aeb4-59dd464ccfbe	Pengurus RW 60 - Kel. Sadang Serang	$2a$10$ie6tiXdMo99CpIRKjIrscuFi9Lagh/mompHPvF43g28G.3B.d36/q	\N	5	2026-08-09 04:29:00.733	2026-08-09 04:29:00.733	\N	\N	\N	Aktif	\N	+628120060	f	\N
0d7d5e2d-ceba-4592-bc0a-bf43c5957e54	DAVID SETIAWAN	$2a$10$I7jGlVmyaW4wRjDhI9l5mez00ree9Pc8fpaN.HsNa7kbhp4ktSCbS	\N	11	2026-08-09 04:29:00.911	2026-08-09 04:29:00.911	\N	\N	\N	Aktif	S1 Teknik Arsitektur	+62895331171595	t	\N
9ef3a1d8-b8fa-494a-aef3-35b0fd51d21c	Zahira Nandhifa Syifarany	$2a$10$Gd.q.dnOsKdc1zyOz2K/aO8S9nAUR3jQ/vJALMoALiLdP4gFceG9e	\N	11	2026-08-09 04:29:01.133	2026-08-09 04:29:01.133	\N	\N	\N	Aktif	S1 Hubungan Internasional	+6287717319320	t	\N
e9e1ccb8-1924-4f68-b5f5-7a6476116412	Mohammad fiqri rizky permana	$2a$10$we4v9r7JGsZrknkHESs74uNYgNgeJpq9JX.Zi2KDc0934JRlE3P9u	\N	11	2026-08-09 04:29:01.381	2026-08-09 04:29:01.381	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+6281903971730	t	\N
0d09ec2e-9de7-4373-a228-d16f3cc4929c	Anindya Nusa Kalimah Syahadah	$2a$10$hpCS5bWuik0HsZ0uEBCLfe.KTq0f8ZzLWJ/4BNyoMvKrehhaaBMH2	\N	11	2026-08-09 04:29:01.564	2026-08-09 04:29:01.564	\N	\N	\N	Aktif	S1 Sistem Informasi	+6283142940023	t	\N
324fc301-f134-4911-824a-6550f3c5440c	ANANDA SHAFA FADIYAH	$2a$10$4SnazcF5RxfaqeZEG0j1r.jQQAhaiF6Wa.esF07DC82EoTHnDdD5C	\N	11	2026-08-09 04:29:01.761	2026-08-09 04:29:01.761	\N	\N	\N	Aktif	S1 Sistem Informasi	+6287778067916	t	\N
e7df9733-9382-4818-bed1-1e0c8f5a7dfb	Renadiya Amelinda	$2a$10$838TqyAmOYotIbQ.NQnY2uPHHYhrOhxau/kiIPMp8pi9B2zeGGzQ6	\N	11	2026-08-09 04:29:01.971	2026-08-09 04:29:01.971	\N	\N	\N	Aktif	S1 Sastra Jepang	+6287774922001	t	\N
aefa200b-95c5-4f59-ba69-e7ed84bcf948	Muhammad Fauzi Al-Ghifari	$2a$10$/cZ6ZV9gwerjwUAFggRU.eO5sgUJ.SuBRcMR5m9LGFgrMenZojw3a	\N	11	2026-08-09 04:29:02.178	2026-08-09 04:29:02.178	\N	\N	\N	Aktif	S1 Teknik Elektro	+6287735289557	t	\N
3dfab1b6-7877-4f2b-a920-a126dbb36ba8	Nur Handayani	$2a$10$nyXaHKC2uq5gkiBpL0KEaeomUHGvfogUUiopJVlSCMpu62Pp.6YF2	\N	11	2026-08-09 04:29:02.504	2026-08-09 04:29:02.504	\N	\N	\N	Aktif	S1 Teknik Sipil	+6285934587972	t	\N
1cdf76b5-965e-44e7-9aad-0bdae7182f3b	Muhammad Muflih Izdihar	$2a$10$mehCcee57eyblaiEBVLf1eUkO0216.5.QTDUP1Zv89dKCdsC.sSma	\N	11	2026-08-09 04:29:02.683	2026-08-09 04:29:02.683	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282145468148	t	\N
71563867-660b-41f6-8fd4-644a5ffa4f11	Reyga Reynaldi	$2a$10$00WP7E612tect1UANZTCseGIZ3gsQEKhurImkGKrsFEL3.dQ/DP3e	\N	11	2026-08-09 04:29:02.862	2026-08-09 04:29:02.862	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281271927712	t	\N
45f00960-ad74-4187-9828-48427dce7377	Rani Amaliyah	$2a$10$7mwtDHglLiub3izn6VHgGO5DfcHvn54wmyLGFmDZalwrcUS0xSbcy	\N	11	2026-08-09 04:29:03.07	2026-08-09 04:29:03.07	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285715943251	t	\N
52eac8bd-3381-4b32-b0a3-4fefac1f0aea	Ibda Muhafid Romdoni	$2a$10$n9TpsoAVwpmDJ6wsYoCkAeaNoVeK7vLnMuFVm995RkiZgrXyTRAxa	\N	11	2026-08-09 04:29:03.25	2026-08-09 04:29:03.25	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282262930148	t	\N
6f419bec-1991-424b-af3e-57490036fa4a	Salsabila Khoirunnisa	$2a$10$Nra2jMTANEYzC0iOMOuAqO9fhgq4bK550sfCRic9fWaF0P2pzygAe	\N	11	2026-08-09 04:29:03.439	2026-08-09 04:29:03.439	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285732078194	t	\N
216615a5-520b-4237-81f5-5ee02c75dd63	Fahrian Ahsan	$2a$10$LDah9Zkh0ELv8AKSh9O0suQGI5tEfisHHYzgEz.HNoNtSMLmpP3Om	\N	11	2026-08-09 04:29:03.708	2026-08-09 04:29:03.708	\N	\N	\N	Aktif	Manajemen Pemasaran D3	+6289991393464	t	\N
dbf80fd1-0eaf-4d2a-a0e4-bb3c6b8a541e	Pengurus RW 30 - Kel. Sadang Serang	$2a$10$KhOF8yRO1l6Iok1TcXwmRuj1jJlR7dEW386WFWvCwBC67S4WvJt7i	\N	5	2026-08-09 04:29:03.893	2026-08-09 04:29:03.893	\N	\N	\N	Aktif	\N	+628120030	f	\N
ff32b408-edcc-4b66-8686-42aadc6ece8f	ABDUL GOFUR SAEPUDIN	$2a$10$mAqS6MC2hO6q.FJNXU0iiu8iZ3lKOdbG/TNv5vMlo.oyd/iQCO/4C	\N	11	2026-08-09 04:29:04.087	2026-08-09 04:29:04.087	\N	\N	\N	Aktif	S1 Teknik Arsitektur	+6282217258956	t	\N
43127aeb-7b43-49bd-a01e-ea8c8e24c954	Audry Rafi Setiawan	$2a$10$qOXo4aAxCcH0nXi7ha3XTukKUYKYQNVNEeDSHHdxUdFKSPcV36HO.	\N	11	2026-08-09 04:29:04.293	2026-08-09 04:29:04.293	\N	\N	\N	Aktif	S1 Hubungan Internasional	+62895603407311	t	\N
eaae94a0-7fdd-43c5-a5f6-2895c595d48c	Naisya Salsabila	$2a$10$D0MicTBtiaVHZxpGxz5rq.xBTRAJb3H5CYpLy.zcaCSQKaBO8D8ue	\N	11	2026-08-09 04:29:04.485	2026-08-09 04:29:04.485	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+6282118447939	t	\N
004ee873-f8b8-4e83-9964-d461a44279dc	Sofia Nur Putri	$2a$10$fDRvfzASVlOsvH9KHukjqefFza0j8A1HH9ttNWobCys89on.MwTka	\N	11	2026-08-09 04:29:04.676	2026-08-09 04:29:04.676	\N	\N	\N	Aktif	S1 Sistem Informasi	+6289626360843	t	\N
a6d4c584-8c7b-42ab-871b-079d2f8c27ce	Muhammad Rizqi Amirudin	$2a$10$Hnw7fcr9WaaHf61ZNGWP1OGqxKuuibVQklPLhP/qOowBiI66w9WH6	\N	11	2026-08-09 04:29:04.864	2026-08-09 04:29:04.864	\N	\N	\N	Aktif	S1 Sistem Informasi	+6281384336722	t	\N
c6d77f0f-61d1-436f-ad3e-cdbecc1f7267	Devanka Musaqeena	$2a$10$jeAVGYZ5MEOafGSwlDxXvuISIlftG8tEnkeHWMo3fRE/5OO9gmCIi	\N	11	2026-08-09 04:29:05.104	2026-08-09 04:29:05.104	\N	\N	\N	Aktif	S1 Sistem Komputer	+6285158026652	t	\N
6a1f035f-fcc7-496e-9ea9-ef90e0ed33f9	Angga Adittya lrawan	$2a$10$mc9RXzAasLU0IuyJloq40OPdsaU9ImiDAd0R.GLm.1gqKC.5R0wQy	\N	11	2026-08-09 04:29:05.306	2026-08-09 04:29:05.306	\N	\N	\N	Aktif	S1 Teknik Elektro	+6283101183602	t	\N
fae7f644-4d07-41d4-b692-e6e6eea25ab5	mutiara nurul hidayah	$2a$10$Die1sxEpq.uLqDZgPK0na.1nE91qH3dyFKE2wYiu1k9sDzFLylQyW	\N	11	2026-08-09 04:29:05.516	2026-08-09 04:29:05.516	\N	\N	\N	Aktif	S1 Teknik Sipil	+6282113741298	t	\N
81e218cb-dc33-4ce2-b4e9-6b1384d057f3	Alya Rahmawati	$2a$10$YuIzpxINFjZuIZ2aMHupze2DvsyXUYiUmeVQGImqcn/5nUoT1FZwi	\N	11	2026-08-09 04:29:05.719	2026-08-09 04:29:05.719	\N	\N	\N	Aktif	S1 Teknik Informatika	+628818239716	t	\N
7e875e25-6772-4681-9def-1167eb2c7633	Hafidh Tedi Setiawan	$2a$10$/nAZ1pEvF4KAVCj7clrmP.ve5W8OAuXasvoykpdfkqN.gyXtvZz.W	\N	11	2026-08-09 04:29:05.925	2026-08-09 04:29:05.925	\N	\N	\N	Aktif	S1 Teknik Informatika	+6289648354570	t	\N
94fdecde-e29f-415f-97e0-a0ba6215fe0e	Amanda Maretha Putri Lestari	$2a$10$RTS4BWkoKoNpDRYu96L4KuoX0IzcTjuM3UFxpBgw36PSTQi6X5XYK	\N	11	2026-08-09 04:29:06.121	2026-08-09 04:29:06.121	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281312977873	t	\N
395408b8-fc8e-472a-a243-1835785fc9a0	Rivan Kurniawan	$2a$10$hQJkOzB1uN.Q6C7fEim7nOPb2j9nXrqYeQWR5fpKwVHhKbTHUNt3q	\N	11	2026-08-09 04:29:07.764	2026-08-09 04:29:07.764	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+6285211307737	t	\N
642a9704-997f-4877-867b-9049bf35863a	Yusuf Arif Pramadani	$2a$10$MeEIS4gcLeuANwGLcZbcIOv2Zn7geZAX86Tju3Hej7i/d8sjZsAbG	\N	11	2026-08-09 04:29:08.377	2026-08-09 04:29:08.377	\N	\N	\N	Aktif	S1 Sistem Komputer	+6285189951001	t	\N
1c489b62-66f8-4540-b68d-7ad1b615bf2e	Shifa khairiyah	$2a$10$whay.B0cdYJGQ3FQuGHeCeUS74DbMuXHGceVvIsj9AazW5Ja.dQfG	\N	11	2026-08-09 04:29:08.565	2026-08-09 04:29:08.565	\N	\N	\N	Aktif	S1 Teknik Sipil	+6288220375399	t	\N
0afc8681-e459-471a-a521-81e3fdc93edd	Muhammad Ubaidah Akbar	$2a$10$LoZ2RbF5oz3yFJMCMbPupe4OsmEe8xS7CFNvOdN75QwweUsFVgpKS	\N	11	2026-08-09 04:29:08.997	2026-08-09 04:29:08.997	\N	\N	\N	Aktif	S1 Teknik Informatika	+62881025320264	t	\N
59d4caf7-4abd-4570-9f43-15d3c97684dc	Amelia Vega	$2a$10$zqRZlqE7oCgyAXBX2LmPJuI1.nRpZMHnwduR9rVV6X9Koxf4lPvxO	\N	11	2026-08-09 04:29:09.208	2026-08-09 04:29:09.208	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285703723540	t	\N
5ac4a4ad-d948-42b2-8a32-33427067fd72	Reyhan Ahmad Firdaus	$2a$10$To9uXeYQiH/jpgiCmSxc4uLrZRkBfi2a/zXF9W/MmynAh6H3e/FPW	\N	11	2026-08-09 04:29:10.248	2026-08-09 04:29:10.248	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+6285175239753	t	\N
de421387-6c2f-4611-830b-a30ae8c4f1aa	Selfy Oktapiani Permana	$2a$10$/399RXXD4Wevnv4r/pOGVeMNyXrYQUeMfeC8moa3LwbPM8RNTdJ/q	\N	11	2026-08-09 04:29:10.447	2026-08-09 04:29:10.447	\N	\N	\N	Aktif	S1 Sistem Informasi	+6287752463618	t	\N
86880069-22e5-4097-a1d5-432a3c5761f3	Rendy Kusuma	$2a$10$mdA3Xol/XmvJKARhFTdoiOTccFhiZIxH12FxWfugGOogfOzPsH1eq	\N	11	2026-08-09 04:29:10.838	2026-08-09 04:29:10.838	\N	\N	\N	Aktif	S1 Sistem Komputer	+6285862286700	t	\N
0fba820f-f981-4051-b603-fcd99051e58b	Dini Novalia Fitriani	$2a$10$H4kqX430nG/NjhEoKx7hP.Zdb9otxQBUhp5kxlWvbG92dRBMN9cfi	\N	11	2026-08-09 04:29:11.112	2026-08-09 04:29:11.112	\N	\N	\N	Aktif	S1 Teknik Sipil	+6283816767482	t	\N
4fa22934-5ae2-46b2-a24a-79d71aba76c4	Repi Saepul Milah	$2a$10$J20VGxO7PvvvR7x2gDTq2OADGN7L9ukS84lBYPeY3DeXPsaGU1RnG	\N	11	2026-08-09 04:29:11.696	2026-08-09 04:29:11.696	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282262403045	t	\N
82097e1a-8883-492f-858e-b2b1b5447a6d	Radja Alkahfi Siregar	$2a$10$YF6kKibGrBEeLjd60mC6k.qRLEvIMvup8Aheags5n8hraHxdOgUtC	\N	11	2026-08-09 04:29:11.905	2026-08-09 04:29:11.905	\N	\N	\N	Aktif	S1 Teknik Informatika	+628988248277	t	\N
c4101919-f38b-4dc7-aa27-63add825d7db	Ragil Yuni Wulandari	$2a$10$YVcOKXdUIM8LobiRr7lmoOzbCwjtc2BY5TapIEyqat6BojSHQ3Cai	\N	11	2026-08-09 04:29:12.093	2026-08-09 04:29:12.093	\N	\N	\N	Aktif	S1 Teknik Informatika	+6289524863162	t	\N
ed01884e-41e1-45a9-8133-0fb2aa6689ba	Yosan Suparman	$2a$10$nI/a5hbWN1ulmbJH4RcybOgtYdjQRGnZYwPaQNyWO4rBSUhPNU8NW	\N	11	2026-08-09 04:29:12.296	2026-08-09 04:29:12.296	\N	\N	\N	Aktif	S1 Akuntansi	+62881022759682	t	\N
8dbb381f-d4ab-4256-ad99-4377dfd1dee3	ILYAS FATURAHMAN	$2a$10$M8kfCHNRnm8ISzCzJjdpaeEIGJOFwTd.MVij8zmKf8Fwc4tCFYM1C	\N	11	2026-08-09 04:29:12.502	2026-08-09 04:29:12.502	\N	\N	\N	Aktif	S1 Teknik Arsitektur	+6285700669767	t	\N
7ff6a70b-a2cf-4286-aa58-d1a20c968fba	Elga Aulia Zamita Damopolii	$2a$10$EjEb9F6MlvXO3ZsrwxAeg.WjRmSOZLNkD0qz/6wZJ6SLreyCUFg6u	\N	11	2026-08-09 04:29:12.691	2026-08-09 04:29:12.691	\N	\N	\N	Aktif	S1 Ilmu Hukum	+6285954452051	t	\N
819140ef-3277-41c4-9499-b65b429ce1b6	Andi Muhamad Hakim Ramadhan Mangussara	$2a$10$zAwc2W3qo9PLwybqs2I4AeJncTiVQrAR1REU74wm75/JrTMyCo3mm	\N	11	2026-08-09 04:29:15.499	2026-08-09 04:29:15.499	\N	\N	\N	Aktif	S1 Teknik Informatika	+6287777081360	t	\N
a5f344f5-ea3e-4e2e-aa11-b51c8281c554	Nico Luthfiano Santoso	$2a$10$NlatrkUxCd56SOBkH5L9hOTVXsbE232upXnTvBzpVnSHlT0XGRUXq	\N	11	2026-08-09 04:29:15.935	2026-08-09 04:29:15.935	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285695522173	t	\N
01f87165-fd52-46e5-acc1-44c72b839102	Faisal Hawari	$2a$10$Xt.mmd4f0Yrt..u23Vp60eiQ50F1Almnm2y8x.oiwxLc.kXbKuKOq	\N	11	2026-08-09 04:29:16.147	2026-08-09 04:29:16.147	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281224017174	t	\N
636e0f28-9f55-4cc5-8286-80ad7b2e1bf5	Nova fitriana	$2a$10$jdv0lVhe0ToDLK0wNV3u7ujw.jG2YV5Jqmb8gObW.2.83yVZmcYGW	\N	11	2026-08-09 04:29:16.415	2026-08-09 04:29:16.415	\N	\N	\N	Aktif	S1 Akuntansi	+62895346193872	t	\N
d98daaab-6626-4f9b-8e97-d42068fae34c	Nova Tri Hapsari	$2a$10$gqfwYB9P6Mv2AwwMvNg1oOqtGd9vtUExFGgpFnfzNkXEQOK5DsO52	\N	11	2026-08-09 04:29:17.638	2026-08-09 04:29:17.638	\N	\N	\N	Aktif	S1 Sistem Informasi	+6282391069343	t	\N
f543af29-e36c-4473-8577-2105a7ba580a	Regan Pradiva Kusuma Wijaya	$2a$10$3el80Zd/f6Fvucx4OmPaHeoV2.fEU/dFtDDSyEkZKG32hOC/f5yNO	\N	11	2026-08-09 04:29:17.849	2026-08-09 04:29:17.849	\N	\N	\N	Aktif	S1 Sistem Informasi	+6281915331929	t	\N
0bf3bfe4-5f67-47f1-92cf-b18baae6b67a	Fahrossi Azra	$2a$10$pLeLY0xIuTAcF8k0ztSmx.boMXz6fc3O3SZmKPh52LFx2DDQi.P7a	\N	11	2026-08-09 04:29:22.088	2026-08-09 04:29:22.088	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282219421703	t	\N
a67cb59d-bb8b-4ec1-9c27-fd66358841a4	Oki Ramdani	$2a$10$UOmErSmgV9/Orb7x7Rgk1u1vVeHunfTNSeg9zm0SWsMLVOagUAru2	\N	11	2026-08-09 04:29:22.356	2026-08-09 04:29:22.356	\N	\N	\N	Aktif	D3 Akuntansi (Komputerisasi Akuntansi)	+6289525438941	t	\N
af5da11a-eaeb-4734-9e68-0ae18b950e4f	Naila Nurfaiza Hasibuan	$2a$10$aetlj5SvMf5QXeJyPLjLbOVyQ3kNcsPX8CGv6hUgulFPU1hjl0Aly	\N	11	2026-08-09 04:29:22.572	2026-08-09 04:29:22.572	\N	\N	\N	Aktif	D3 Desain Grafis	+6285220183273	t	\N
e7d4749b-5507-44e1-8012-d30b4c368740	Muhamad Gilang Ramadhan	$2a$10$fG9hUZlIk1YTqXDWqJnJ6OeNmvegVqpsEIKckMV2OjUK8PPDCGi62	\N	11	2026-08-09 04:29:24.535	2026-08-09 04:29:24.535	\N	\N	\N	Aktif	S1 Teknik Elektro	+6285794439285	t	\N
0713924f-ec18-4b2f-bfec-701c0f03237c	Azriel Al Khafidz	$2a$10$5KTg.KqnKAkv/F0Sxu2fi.KslwiEuiyRu.YUVgpCdzwfl8DvyGRzy	\N	11	2026-08-09 04:29:24.814	2026-08-09 04:29:24.814	\N	\N	\N	Aktif	D3 Teknik Komputer	+628976423365	t	\N
f2098260-fb08-4ad5-a0bf-294ea70cf283	Firjill Shyfazzarqy Cleverst Sampouw	$2a$10$39uiyDSlHS0rWdo9Juhph.vZ5BKb2JTdeFBpwhA5WrNc7386MUnqW	\N	11	2026-08-09 04:29:25.099	2026-08-09 04:29:25.099	\N	\N	\N	Aktif	S1 Teknik Sipil	+6283808786513	t	\N
b0ad9afb-0b83-45df-acf1-017080d13779	Muhammad Rigan Marezka Permana	$2a$10$8lxrakSqQhZ.G1dGPjrLcezvDwR6DgZc3yC6DFxwvS0.W/KOslKnC	\N	11	2026-08-09 04:29:25.357	2026-08-09 04:29:25.357	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285723785340	t	\N
34a3f6d4-61ce-4237-aa2f-8357b420e5a6	Lingga Pasya Raifansyah	$2a$10$gFErnmHyrtaDtNYA3U8ryuYbt1d3n6EqOQzskm6sgcN.omdf1tmW6	\N	11	2026-08-09 04:29:26.082	2026-08-09 04:29:26.082	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285659876076	t	\N
0f3472c3-ecbc-4968-ac94-717c6fd74b90	Muhammad Fathan Rizky	$2a$10$Y9.a/C.WFeqTRi65FdQyA.VoapacAvF2vOZnngF.I8cZHWKuVwN3q	\N	11	2026-08-09 04:29:26.783	2026-08-09 04:29:26.783	\N	\N	\N	Aktif	S1 Desain Interior	+6287819013182	t	\N
ea0144cc-71d3-4b31-af85-3b266fb2136b	Aditya Indra Rahman	$2a$10$UZ7OmBcznY9E/weM5pb6.OpBg8ljns5g6Hebq0zZIcFkrURAiOMg.	\N	11	2026-08-09 04:29:27.473	2026-08-09 04:29:27.473	\N	\N	\N	Aktif	S1 Sistem Informasi	+6282247445835	t	\N
cd86aa1c-c0ec-4a83-8505-1ff0090b5204	RHADITH EKA ERLANGGA SHAPUTRA	$2a$10$e9fU42N3KiQRJAzY08xYw.9l0citwMOGHgJzVJLcXyhXQFSphFPlS	\N	11	2026-08-09 04:29:27.67	2026-08-09 04:29:27.67	\N	\N	\N	Aktif	S1 Sistem Informasi	+6285364067510	t	\N
f270f778-a49c-4c50-9468-266b49260612	Muhammad Alif Abdul Latif	$2a$10$Be8SF1rqUylkwz/qu9sGMOfsSGdH0CPYwtOjWtweHzWK./x5nrygG	\N	11	2026-08-09 04:29:06.627	2026-08-09 04:29:06.627	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281320317855	t	\N
60327647-14b2-4106-8d97-ad4c9cd58dd7	M Farrel Chandrawijaya	$2a$10$cnAkNg4rz2EkUt/4VX7FQ.s18DEhCiyGtDYw/5VJ1G55fHZMjNn36	\N	11	2026-08-09 04:29:06.814	2026-08-09 04:29:06.814	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281219739130	t	\N
77237da6-ddc4-4d90-89ea-0215bcf423da	Pengurus RW 17 - Kel. Sadang Serang	$2a$10$gRM1e0gFJRd65pzxALk5vO29SHOZlDMCchsq7DNX6ogaObMyE.B.y	\N	5	2026-08-09 04:29:07.006	2026-08-09 04:29:07.006	\N	\N	\N	Aktif	\N	+628120017	f	\N
7ec4c5d3-cbc9-47a7-a0e3-54fe7c3fda58	Pengurus RW 50 - Kel. Sadang Serang	$2a$10$2xMVEK4wyelQYvKDsgV/2u913yYT/4nA57NK.Y8lECWKaUn7XzaVK	\N	5	2026-08-09 04:29:07.175	2026-08-09 04:29:07.175	\N	\N	\N	Aktif	\N	+628120050	f	\N
0473aebd-f66a-437e-9d89-c485dd9b3809	Rahi Sultani Rohman Roshan	$2a$10$x9v29Ojj3NDKPykkRZFF8uFd28Uz/PgdJClZZ3Ot8TIwgRN8Dw.2m	\N	11	2026-08-09 04:29:07.361	2026-08-09 04:29:07.361	\N	\N	\N	Aktif	S1 Teknik Arsitektur	+6285167799326	t	\N
c6f99bdf-3071-4e02-b669-4c6645ac4dbd	Chistya Lamisa Balqis	$2a$10$EFAPLv7JzOqEoYkv27Ss1ub3ytGAKILITBRFPcX3cYND8fFy2MVJi	\N	11	2026-08-09 04:29:07.57	2026-08-09 04:29:07.57	\N	\N	\N	Aktif	S1 Hubungan Internasional	+6289682326222	t	\N
7069b59f-770c-4933-b22d-7a435760dcc1	Javiersa Naufal Algani	$2a$10$F44.A3NkUZV8sXquqoqMi.vKfddxChdszRxCEQ2v5GHB0pFvI4dSq	\N	11	2026-08-09 04:29:07.955	2026-08-09 04:29:07.955	\N	\N	\N	Aktif	S1 Sistem Informasi	+6285294845952	t	\N
33361471-f165-4992-b73d-e3602fac57a9	Robi Nugraha Fadilah	$2a$10$7mLtK5SvvrzHXpUTosicQO/N/X693X7HPCpnzv8Vwfo/U5l5wsAtS	\N	11	2026-08-09 04:29:08.153	2026-08-09 04:29:08.153	\N	\N	\N	Aktif	S1 Sistem Informasi	+6285694740755	t	\N
d6091fb3-c389-4794-98e8-5bb51e4075b7	Raditya Muhammad Alghifary	$2a$10$oiipDBqw5LHqafV356/Etu37NtsjbFwz7dVFR8RO52yg1v/JcPOga	\N	11	2026-08-09 04:29:08.798	2026-08-09 04:29:08.798	\N	\N	\N	Aktif	S1 Teknik Informatika	+628950998860	t	\N
43987e4a-f162-4158-88b3-26fecca835be	Halki Nurhakim	$2a$10$VCaD3KnqPANkiYJ21nuojOTJuLLmprPni6fJgsF7kwG8G3ErQLYZu	\N	11	2026-08-09 04:29:09.432	2026-08-09 04:29:09.432	\N	\N	\N	Aktif	S1 Teknik Informatika	+62895411964698	t	\N
6d89df81-ae57-4c09-b544-3d5c3dcf232c	Ernest Tristan Rafael Siringoringo	$2a$10$.DuIJ8tdM70Y8GvDAKGrYOGF8bHtVJxzTzaiJS/d0bBT.vg1Wqeu.	\N	11	2026-08-09 04:29:09.637	2026-08-09 04:29:09.637	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282217849130	t	\N
43f1dcc6-bbae-427a-8f8c-eae86100e2be	TIAN TARDIANSAH	$2a$10$3OEpOTqHkywtfyvdKbJiJe9FqzanS36XLMCF.joUIp6IVNlSqta.y	\N	11	2026-08-09 04:29:09.864	2026-08-09 04:29:09.864	\N	\N	\N	Aktif	S1 Teknik Arsitektur	+6285720301033	t	\N
30684fad-0aa2-4d43-80ef-97f846acf639	Salma Khaerunissa	$2a$10$1yMOIqI0CYfF2aKcCjoz3emkEhU80ZVHxjoEXfdSWKIdxHsML4aVC	\N	11	2026-08-09 04:29:10.058	2026-08-09 04:29:10.058	\N	\N	\N	Aktif	S1 Hubungan Internasional	+6282130876806	t	\N
f0e6c222-8abd-48ef-8daa-50ba764df49a	Dede Sutarjo	$2a$10$VoYizoPMoeqMWXjPZLk/tuC/3Rh/Bjs4FiKWYZ288F9dNbNnxFOUi	\N	11	2026-08-09 04:29:10.636	2026-08-09 04:29:10.636	\N	\N	\N	Aktif	S1 Sistem Informasi	+6285183166183	t	\N
a099631c-1529-4567-a56b-f44fb057d7bb	Zilky Azriel Ramadhan	$2a$10$6q2rGAV8J2zywkNxmsP2hevg4FCKgvp.n.xqep0qsh4vfNVKl/WgW	\N	11	2026-08-09 04:29:11.318	2026-08-09 04:29:11.318	\N	\N	\N	Aktif	S1 Teknik Informatika	+628882347758	t	\N
3ed6d002-c589-432c-88f6-76875449826a	Harits Ramdhani Nugraha	$2a$10$XHSyqaG4AhkF.qTb5LbVHO0vnBed5l2pbSt9meQkZTY5I3INs2Mwm	\N	11	2026-08-09 04:29:11.511	2026-08-09 04:29:11.511	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281312459367	t	\N
4315205d-93c3-4437-adf9-ddd028d66761	Salma Khairunnisa	$2a$10$pBmXrMcBy/nwX6Y4BYnKlOSmX9awflQihxOlKiubuhIgrs7LS05fy	\N	11	2026-08-09 04:29:12.885	2026-08-09 04:29:12.885	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+6282190465563	t	\N
7745b6f5-464d-43bf-8677-e6d0061cf134	Fauzan Ahmad Dhani	$2a$10$Mqv0RhKst4CVum3PFamX6u4nO2CKQEk5WdFUKTwG5gGgMg7OTiExm	\N	11	2026-08-09 04:29:13.292	2026-08-09 04:29:13.292	\N	\N	\N	Aktif	S1 Sistem Informasi	+6289991393507	t	\N
038f4cb9-06d0-4a16-aba2-f5e37e4d4e10	Sahrul Muhamad	$2a$10$HApnpur2Bg36WqXKU1jsgOowM5N4MFIbjPVYE57f.bW3JiiWMWrUW	\N	11	2026-08-09 04:29:13.744	2026-08-09 04:29:13.744	\N	\N	\N	Aktif	S1 Sistem Informasi	+6281320357232	t	\N
1ffeab02-e0c8-45b1-884c-b3c6ab4d6023	Ameldio Furqon	$2a$10$fwoBwBdkx7XLr7NQW8NlXObQQ0F6hCuLasc./KVKQ74P3kM7VDqeO	\N	11	2026-08-09 04:29:14.06	2026-08-09 04:29:14.06	\N	\N	\N	Aktif	S1 Sistem Informasi	+6282210202546	t	\N
27b30313-861d-44af-bd44-0df99fa51c0f	Dzaki Ghufron RahmanDanu Putra	$2a$10$8Dp7sZa98xp8mzKNwTGSK.STkKzy1cZ8ja5qSV6JSYwYdnQEk1h.i	\N	11	2026-08-09 04:29:14.371	2026-08-09 04:29:14.371	\N	\N	\N	Aktif	S1 Sastra Jepang	+6285710279506	t	\N
8d7fdcf3-05d5-4fbc-bed6-ebe8e01d35dd	Bariq Syauqi Fathulloh	$2a$10$KcL0T/wFdcnh09y8/gUZ5OW4aKJF11x6VZ03LMOf9FYcDYe5l7khm	\N	11	2026-08-09 04:29:14.593	2026-08-09 04:29:14.593	\N	\N	\N	Aktif	S1 Teknik Elektro	+6285724110038	t	\N
96feda31-d9ae-4661-bee8-0be172a77de2	Azhar Sayyid Ramadhan	$2a$10$cuNloTFVFjDiT8JDwOuhauxDsA4Vqt3PuAVteueo52qtt34Pii4ky	\N	11	2026-08-09 04:29:14.815	2026-08-09 04:29:14.815	\N	\N	\N	Aktif	S1 Teknik Industri	+10324015	t	\N
2384833f-7a03-42cb-bd25-429e0af54083	Risna Dwi Putera	$2a$10$EGlWg9XQN4ukWQuViXiKpu5a24zMdmlIkMjMqBeGKEIC4a3wleIE.	\N	11	2026-08-09 04:29:15.056	2026-08-09 04:29:15.056	\N	\N	\N	Aktif	S1 Teknik Sipil	+6285861041608	t	\N
842a41fe-05e0-4e8b-b87d-d1c0ff1af2aa	Panji Gumilang	$2a$10$QVa8CpUWIaBddZdhJXGPbOC3Hm4KdgsHG4YooAO4I1/URpd7zdIH2	\N	11	2026-08-09 04:29:15.276	2026-08-09 04:29:15.276	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282126577575	t	\N
793962d6-6328-4951-bf40-4dda996e7fb5	Abdhika Maestra Harmonasora	$2a$10$qhgXULRzuJjhfQU/KCDgl.DWlUiuKmnay95h/WT8GaPY2/8nfv9SS	\N	11	2026-08-09 04:29:15.71	2026-08-09 04:29:15.71	\N	\N	\N	Aktif	S1 Teknik Informatika	+6289517832715	t	\N
7d3ef619-50c5-46bc-b07f-7d6fa156f03e	ANSYARULLAH SYATHIR AL-ZAYTUNI	$2a$10$THINqiqe.eTnnxniUJZDGOxp1LL9JOAhLWQprfSN2nXXuy3auPcS6	\N	11	2026-08-09 04:29:16.644	2026-08-09 04:29:16.644	\N	\N	\N	Aktif	S1 Teknik Arsitektur	+6282134330763	t	\N
4416ac81-2034-4278-851e-a92d9770ed7c	Safira Oktaviani Fathimah	$2a$10$rH0LAbMNmIsRg1Nvsvu3..08qGOh7q5kOJS6QNjG2assqr70PK9Su	\N	11	2026-08-09 04:29:16.889	2026-08-09 04:29:16.889	\N	\N	\N	Aktif	S1 Hubungan Internasional	+6287724298110	t	\N
c5565fda-dbba-4440-ae90-226591c3a6b3	Renata Fatricia Oktaviani	$2a$10$dkJ9KPdZiO5eJaPPRHAUNu4DZO.teLuJjumbyQZp412oTBU4MAK66	\N	11	2026-08-09 04:29:17.187	2026-08-09 04:29:17.187	\N	\N	\N	Aktif	S1 Ilmu Hukum	+6282126628491	t	\N
e481beba-65e1-4d8e-9556-f888f67cbadf	Abiyu Ramadhan	$2a$10$WcfEiIxnrwSvFEaD3yCrNu45EiXAjcUhB5CZegVspVrFpFAD6/1nq	\N	11	2026-08-09 04:29:17.416	2026-08-09 04:29:17.416	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+6281315207870	t	\N
841bab65-e23d-47ef-afc3-0d8e28418ae4	Shandy Putra Pranoto	$2a$10$nuXbXe7ku20497g0Uq.gSuuFV8A9v67CCQLPNqrghTxSDZdW6s9Ue	\N	11	2026-08-09 04:29:18.089	2026-08-09 04:29:18.089	\N	\N	\N	Aktif	D3 Manajemen Informatika	+628813002848	t	\N
2f902cd3-edd5-4b04-9e94-7b426a6d0c7f	Ajeng Retno Handayani Wijatmoko	$2a$10$rlNljmFMQhFhqiWmmQ7I8OTrah/53jO6wNplCXj.gFrQ86.AG1wMu	\N	11	2026-08-09 04:29:18.375	2026-08-09 04:29:18.375	\N	\N	\N	Aktif	S1 Sastra Jepang	+6283838724468	t	\N
8f6a5f55-a58d-4859-a9f7-2fae2b782c80	Raihan Nur Zahran	$2a$10$m6XW5R0GnFU/jhDTTkZLuesaJnSB1uMZse2Mzp0Z3Lo1eDLJLvble	\N	11	2026-08-09 04:29:18.602	2026-08-09 04:29:18.602	\N	\N	\N	Aktif	S1 Teknik Elektro	+6281318443400	t	\N
9bc8b125-5e27-4323-880d-497598bb4276	Nazraansyah	$2a$10$2FvkVj3/41KGTxuD.gHP1ehSzECzr1BgSWcb//BNfZ9xww6Grs0aW	\N	11	2026-08-09 04:29:19.191	2026-08-09 04:29:19.191	\N	\N	\N	Aktif	S1 Teknik Industri	+6287771298254	t	\N
5e527d4b-f487-4e44-a5c1-a666d013872c	Mochammad Maliki Fadhlan Hasya	$2a$10$cUfTc6eB85pbXGZKpPGq9u7s6Btyh8QsGxJYnoLfWq856thlyuk0C	\N	11	2026-08-09 04:29:19.417	2026-08-09 04:29:19.417	\N	\N	\N	Aktif	S1 Teknik Sipil	+6285189951040	t	\N
0a748925-addf-4110-92ad-2d110e5cfbf6	Excel Al Kautsar	$2a$10$QMvB8zsC7JRFZBIg1K5JouX9Se2kBg7lLZeHO4dC/ctphvFoYNalG	\N	11	2026-08-09 04:29:19.665	2026-08-09 04:29:19.665	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285697292897	t	\N
3ea069df-66be-449b-9f73-d75d790313dc	Praditya Mahardika Ali A. K.	$2a$10$JDYq4myxCrW84cFtz57WO.rarx6ZKw3r5QkZ5uEz2D95D.7iBVW8O	\N	11	2026-08-09 04:29:19.89	2026-08-09 04:29:19.89	\N	\N	\N	Aktif	S1 Teknik Informatika	+6283829920145	t	\N
3a485ee8-0721-4171-8a02-bbbe9a46888c	Putrama Rahis Akbar Abdullah	$2a$10$hS/0xchOj2ZwXWz/LxhLo.zW7kakfavDU45lZF/1H.gtauLCL5AEa	\N	11	2026-08-09 04:29:21.629	2026-08-09 04:29:21.629	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281224576473	t	\N
b527121e-7b52-48da-b637-061c9edabb09	M. Maliq Firdaus	$2a$10$VY/UKD5iOAS.m.BsWA6CIO3UcJScYzcVODtsnu/AXKTcGnRZs5kLq	\N	11	2026-08-09 04:29:21.854	2026-08-09 04:29:21.854	\N	\N	\N	Aktif	S1 Teknik Informatika	+62895636866796	t	\N
e2e1db56-ea52-4b26-9009-4c157be02955	Dame rosalinda gurning	$2a$10$yPkPSDZn37UjkkwQyBlpJ.acHLBNvOlDgrewwyW4kgkKkr0Dg3kDK	\N	11	2026-08-09 04:29:22.857	2026-08-09 04:29:22.857	\N	\N	\N	Aktif	S1 Hubungan Internasional	+6289610555335	t	\N
98243d5e-f9bb-42e3-92a5-4f817ba4c6f5	Hasna Aliya Romani	$2a$10$WMnoKOv3QetIkKMQOR4hmuCrEujQU8FrmjqbhgCxj148YkJ5/T/R6	\N	11	2026-08-09 04:29:23.15	2026-08-09 04:29:23.15	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+62895377624090	t	\N
2595afff-4baf-45de-9385-645db9e3f93b	Musdalifa	$2a$10$Rupq4CTI8PYN5TWbuQ7qsOe82VQNpSLdnS7SzmrNEINKRKqduTIyq	\N	11	2026-08-09 04:29:23.383	2026-08-09 04:29:23.383	\N	\N	\N	Aktif	S1 Ilmu Pemerintahan	+6282347758517	t	\N
5a5f2b96-4ee1-4aa5-8b4c-c6848846001a	Naila Rahma Azzahra	$2a$10$UVhfQ3w2CieBSE17lOj5N.6vQoQ5pD1tLBmCiBvUy0sD.cE/Tl2sK	\N	11	2026-08-09 04:29:23.596	2026-08-09 04:29:23.596	\N	\N	\N	Aktif	S1 Sistem Informasi	+6281285882506	t	\N
96473f7e-a4fa-4179-a122-566836904482	Adri Ramadhan	$2a$10$sugrrWl96464A3VeNTE6sOOmASppHEL8wxvAo7DGK3KMvjBtuWTlq	\N	11	2026-08-09 04:29:23.833	2026-08-09 04:29:23.833	\N	\N	\N	Aktif	S1 Sistem Informasi	+6281910588356	t	\N
d300db2f-951c-4591-9300-a97c89de5c00	Naila hasna huwaida	$2a$10$SDgAKpkQ6ZAdc9R4SUQ7eucVORI9HB6Jsf6LoQv.0w1gDZKIAQZcu	\N	11	2026-08-09 04:29:24.046	2026-08-09 04:29:24.046	\N	\N	\N	Aktif	Sastra Inggris	+6285723401744	t	\N
6532208b-97b9-4c6b-aaf2-1db1b857df8b	Muhammad Riza Pahlevy	$2a$10$Ekozjp.sMa1WPh2mDAN8/uTVJBwodRCKxf/vBa3KGaWB0IUyxnzC.	\N	11	2026-08-09 04:29:24.3	2026-08-09 04:29:24.3	\N	\N	\N	Aktif	S1 Sistem Komputer	+6281389026123	t	\N
7c1e02df-62c1-4419-8749-f3abcf2a484a	Mochammad Syafiq Eka Prasetyo	$2a$10$mbp1aLT6NaYpX4zyzuy7FuKmuWOhuoeWNYkKDBTIVagAVYY3dGa3u	\N	11	2026-08-09 04:29:25.623	2026-08-09 04:29:25.623	\N	\N	\N	Aktif	S1 Teknik Informatika	+6289662121307	t	\N
e94f5b28-8fd9-4864-bee3-c6e4a66d29bf	Farrel Gusti Hakim	$2a$10$4bA0NzdvdvBb1MyMe5U3GOUlVaJiH/BLZo4YYIH6bstzm.cKu/hHa	\N	11	2026-08-09 04:29:25.856	2026-08-09 04:29:25.856	\N	\N	\N	Aktif	S1 Teknik Informatika	+6282115758800	t	\N
03e48c84-91b6-47c6-a1de-de1207c60c7f	Anna Alicya Padek	$2a$10$ke.AFFliIkfHnrMa/4Wzwes0pQ4N1FdyxgBHyR04e86WkoepEz7ey	\N	11	2026-08-09 04:29:26.305	2026-08-09 04:29:26.305	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285399897151	t	\N
ce00528a-0c30-473b-8252-06bb7bb96ccf	Fidlal Husna Fikri Fuadi	$2a$10$fgRKgaIohkJsHQv4J3WdLuYddtNWNVYsRPvfWct6jGX0/E7IzrIjm	\N	11	2026-08-09 04:29:26.565	2026-08-09 04:29:26.565	\N	\N	\N	Aktif	S1 Teknik Arsitektur	+6282120806607	t	\N
8d5b18a4-f55f-4634-8a97-06f067fe3702	Eva Natalia Br. Sinurat	$2a$10$ySMK7UgGxA08car5.Jo5SupEUw4jgbJz9f8iavguJqb82iUKY7mJy	\N	11	2026-08-09 04:29:27.011	2026-08-09 04:29:27.011	\N	\N	\N	Aktif	S1 Hubungan Internasional	+62881023686354	t	\N
d37e1e12-cc71-49eb-b443-bc96877ba54b	Hasanudin Abdullah	$2a$10$khAsk.bzkME7QvuSbXIuJOd3RvcZOzIAMTFkYu4U3ulzZYZqJzyGW	\N	11	2026-08-09 04:29:27.245	2026-08-09 04:29:27.245	\N	\N	\N	Aktif	S1 Ilmu Komunikasi	+6285624531503	t	\N
80423133-da4c-4344-9d84-b1780eda5245	AGIL	$2a$10$2wxe.V4RTIcKMrJnYl1Bl.mhXamiStZsqNWX15ZlgN5NnR91rKfVS	\N	11	2026-08-09 04:29:28.813	2026-08-09 04:29:28.813	\N	\N	\N	Aktif	S1 Teknik Sipil	+6281342797309	t	\N
29e753bd-945b-4b35-8cb5-abedcbb7fd75	Gifari Raya Shahizidan	$2a$10$2U90EItB0fmp9HPBpnatoeTHNr/5Qbp9MqU/634ZTjtoYbNOreNrK	\N	11	2026-08-09 04:29:29.053	2026-08-09 04:29:29.053	\N	\N	\N	Aktif	S1 Teknik Informatika	+6288297202815	t	\N
89fa09d9-da61-4db2-b378-3d7249d71d12	Defrianif1	$2a$10$8gLyFkJl70bPSIIOkeyiDOhd9DKOZ8Tz2SIH4OA6oQyEivnvjvTwK	\N	11	2026-08-09 04:29:29.917	2026-08-09 04:29:29.917	\N	\N	\N	Aktif	S1 Teknik Informatika	+6287744480152	t	\N
ac6d104a-8cba-4e1b-be0d-cb6befbf6ec4	Nayla Thalita Sabrina	$2a$10$4ogXV600NLfM5wcU3mjLqOV3L6cp9N5ztTY.iGVNnRdcJpcN8Kdn2	\N	11	2026-08-09 04:29:27.903	2026-08-09 04:29:27.903	\N	\N	\N	Aktif	S1 Sistem Informasi	+6281312184479	t	\N
a1ac132f-170d-447c-b09c-b1a37fc37bbf	Ivan Fuziyaman	$2a$10$483v/5BZqnhIYdKdikc53e8zhVeSm3ipknAlzcaQNY8VW9vl3.qiK	\N	11	2026-08-09 04:29:28.135	2026-08-09 04:29:28.135	\N	\N	\N	Aktif	S1 Sastra Jepang	+6281318416305	t	\N
481efbed-6967-4747-a08e-46bb0a531736	Salsa adila casandra	$2a$10$foxfm0s.BJQfwjo/NVf.rO0q.yQhTh4OytFt4q1GJBQOf8Hu8cufa	\N	11	2026-08-09 04:29:28.357	2026-08-09 04:29:28.357	\N	\N	\N	Aktif	S1 Sistem Komputer	+62858361129510	t	\N
d7eb2185-8eac-4f22-9fcc-301ef3e93dbe	Yusup budiman	$2a$10$SwuzHQ42iww451nEm5aQTuxuPVvypyE2AwXJ42YKwvxL1etUz0KSe	\N	11	2026-08-09 04:29:28.577	2026-08-09 04:29:28.577	\N	\N	\N	Aktif	S1 Teknik Elektro	+6285559116440	t	\N
6fca15ff-aa1d-40d4-87ce-92994bd2dc7e	Muhammad Nazib Al Qoys	$2a$10$.q/nNMDhpFRF7BRJcX8ul.vAIebBCedMy8xeN8iK9bU1l84ugKOa2	\N	11	2026-08-09 04:29:29.277	2026-08-09 04:29:29.277	\N	\N	\N	Aktif	S1 Teknik Informatika	+6285814411633	t	\N
0cfd0eca-e840-4318-932e-2f5a2e3a9182	Nabil Ma'ruf Basalamah	$2a$10$8QVt6AXCA7.yAq/A61FBBukJnoED478wEeUB.ePegebP.5yY3J91C	\N	11	2026-08-09 04:29:29.488	2026-08-09 04:29:29.488	\N	\N	\N	Aktif	S1 Teknik Informatika	+6283168059329	t	\N
df7169ee-c895-482e-a3f9-ece6afeaf934	Kayla Yusuf Sumantri	$2a$10$/4dM0NkoVdYI69iEslMPmuuUh/w72jXzTPqWc00pblkUjXFa4oxdu	\N	11	2026-08-09 04:29:29.692	2026-08-09 04:29:29.692	\N	\N	\N	Aktif	S1 Teknik Informatika	+6281320241715	t	\N
bea1049d-e035-499b-9997-6f78e4218b0b	Administrator Utama TrashCare	$2a$10$tfZzimebOz92d0nfTEbf8uSxFgXii1wkL/Xn7I3Lr3diRdWkGwVPu	\N	1	2026-08-09 07:49:59.138	2026-08-09 07:49:59.138	\N	\N	\N	Aktif	Pusat Komando TrashCare, Kota Bandung	+6281200000000	f	\N
3751704c-c631-4217-920a-ccda56bae879	WargaTester	$2a$10$jHJ4JXF69jGZiaAw2tMN1ugEvXPbzRcdYxV.6ejIK3x2sv47atKrW	\N	12	2026-08-09 18:42:35.744	2026-08-09 18:42:35.744	https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=256&h=256&q=80&sig=46	1	\N	Aktif	Dago	+62852822619552	f	UTAMA
14cadcdd-cf3d-4f40-8fd9-8c521418e8eb	QC Test Warga E2E	$2a$10$wi0lVZmkT/vfg/whtYSU8O/EmmPo2ZtN/UUyPvh8d6q.yfiJ/VAz.	\N	12	2026-08-09 07:53:31.793	2026-08-09 07:53:31.793	https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=256&h=256&q=80	1	\N	Aktif	Jl. Coblong QC No. 1	+6281299991111	f	UTAMA
f41f255f-aae5-460f-acbb-a058b64c16bb	QC Test Warga E2E	$2a$10$aXQQ7dF4Sek1aG7htFb4kucinXa6QA3NoEhs8NFU9zPA5WIP0hmXm	\N	12	2026-08-09 07:54:00.288	2026-08-09 07:54:00.288	https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=256&h=256&q=80	1	\N	Aktif	Jl. Coblong QC No. 1	+6281299992039	f	UTAMA
ae0bb2ae-3d98-4a32-b284-750ea2394da8	QC Test Warga E2E	$2a$10$0d9ZHykxIr7xJ6FcXklNJOafIcgcQ5di12LSftVRqSDwpKjEIq8h.	\N	12	2026-08-09 07:54:10.118	2026-08-09 07:54:10.118	https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=256&h=256&q=80	1	\N	Aktif	Jl. Coblong QC No. 1	+6281299992049	f	UTAMA
67578020-47be-4b83-a822-7d6cc714b3d2	Asep Herman	$2a$10$rLe8lEgolHO1ZnFqPMZ1gOt7BTYH4X5v3htGVuBbEYA6RQwFIqvbK	\N	12	2026-08-09 09:15:58.204	2026-08-09 09:15:58.204	https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=256&h=256&q=80	6	\N	Aktif	Jalan Utama Dago	+6282116871008	f	UTAMA
4fb2fc1f-ffb3-4b33-a0b6-403f454a2f89	testing QC	$2a$10$XhfgroOGI8w46/FO2faOIe78SrB4t7H/crUUUfXqrTbF0gSihbS1a	\N	1	2026-08-10 02:34:03.951	2026-08-10 02:55:50.852	/uploads/1786330550838-42e8ea70-78d2-49c8-ae36-cfb9cb5591a0.jpg	\N	\N	Aktif		+6285794774532	f	\N
398499af-4159-4dd4-ac70-67a3346491f8	Jusni Giri Susilowati, S.Sos., M.Si.	$2a$10$pADVE7av8k6WfChZLYFA8uxU1h5YdmVDOYlMXa.e2/0v.5WvqSoji	\N	4	2026-08-10 07:16:49.683	2026-08-10 12:09:53.083	\N	\N	\N	Aktif	\N	+628111111114	f	\N
8380ec46-6709-4018-9844-140af18b77fd	Tester Camat	$2a$10$EV9pQXBxrtBRfAcYpA4FPO69sYWdPYN9mq5mg1ptAtEvElTFWV/KG	\N	3	2026-08-09 18:25:25.148	2026-08-09 18:25:25.148	https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=256&h=256&q=80&sig=56	\N	\N	Aktif	\N	+6285282261957	f	\N
9f913157-8e6c-4cde-bce7-54a3c5cddf8e	Fajar Tester	$2a$10$glytYkDdeJWWhHo23Rer6eAmgm0iwaCoxu.jODTHCMoS4OEz8jpcK	\N	12	2026-08-10 02:52:58.115	2026-08-10 02:56:34.639	/uploads/1786330594630-13297fa0-2e86-4185-909e-65d61d67832f.jpg	1	\N	Aktif	Subang	+6285351181824	f	UTAMA
02ebe8bf-04d0-4ee1-8652-430954984d38	Super User	$2a$10$jsEXyFqbBXeuN9jTEtAGdu5xwIxlLTAvP1.qb7eeIEN8tCBkY6B/O	\N	1	2026-08-10 07:16:48.965	2026-08-10 12:09:52.427	\N	\N	\N	Aktif	\N	+6281000000001	f	\N
ab8becb4-a663-49f8-b413-a4e06c724346	Dosen Test	$2a$10$kUVmN.nar6mqi7mn/EdifubAtTiEZY4vjAH4BV4AvyPPIzloN.E6e	\N	9	2026-08-10 06:43:57.772	2026-08-10 09:09:13.692	https://images.unsplash.com/photo-1511497584788-876761465586?auto=format&fit=crop&w=256&h=256&q=80&sig=82	\N	\N	Aktif		+6285169713475	f	\N
617d7ae7-9cc9-4fd1-a810-cd0ab65d02d1	Darto, A.P., M.M.	$2a$10$bb8I5cJqmURbb.niHJecjuguSusXRlPEO0vkBDgGOoZnfUNVfzusS	\N	2	2026-08-10 07:16:49.334	2026-08-10 12:09:52.744		\N	\N	Aktif		+628111111112	f	\N
37da8ae7-1258-4968-bd8d-82a937905032	Ratna Rahayu Pitriyati, S.STP., M.Si.	$2a$10$gPu4wkbi5YTKXhsllz4yJuDvQA1Wam4n458aNZ1otgmrydo.UIgcu	\N	3	2026-08-10 07:16:49.497	2026-08-10 12:09:52.927	\N	\N	\N	Aktif	\N	+628111111113	f	\N
cbc24ca2-1db8-4569-981e-445c081dc38b	Super User	$2a$10$btF2gQr2EiAY1ZmbK/a3AOth8T5TxUKiy3W29y.qcXGjVWuiv8tom	\N	1	2026-08-09 07:49:58.766	2026-08-10 13:36:34.384	/uploads/1786368994374-080278e9-35bc-49d5-9656-39c4fe9f0858.png	1	\N	Aktif	Pusat Komando TrashCare, Kota Bandung	+628111111111	f	\N
cc23efb0-93c8-474b-9db0-80fa866075f1	Budi Rukmana, S.Sos., M.Si.	$2a$10$yAYU674xlhLjKBF7tedjEeFvp56Rsj2.o94KcGhBdo8wICU5j2r7O	\N	4	2026-08-10 07:16:50.223	2026-08-10 12:09:53.564	\N	\N	\N	Aktif	\N	+628111111123	f	\N
4d2d45ad-43d7-4eeb-96ec-d89087dff248	Leny Mariana, S.Sos., M.AP.	$2a$10$H8N6V7oFMf.4gnQLivKyYeGuTUseI8/XoLMsBF13dyo2DrXNxh7sC	\N	4	2026-08-10 07:16:50.387	2026-08-10 12:09:53.73	\N	\N	\N	Aktif	\N	+628111111124	f	\N
05c43626-263b-4914-bd13-f5a198350b3d	Tirta Gumelar, S.STP.	$2a$10$Il0DFc/lXhGLpIUS6/7vnetPtOVv6jn2ZiCWc94sSRWJ3gmzKkY6i	\N	4	2026-08-10 07:16:50.59	2026-08-10 12:09:53.885	\N	\N	\N	Aktif	\N	+628111111125	f	\N
56570bef-240e-4dc9-a36b-b92c02bf36ec	Pimpinan Test	$2a$10$WwHHC7vg1bgKZd5Csa2AtOIMtc7ozwsHOw0b1wQI6TBHrQ40KN8mW	\N	7	2026-08-10 09:47:48.12	2026-08-10 09:47:48.12	https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=256&h=256&q=80&sig=21	\N	\N	Aktif	\N	+6283821912359	f	\N
0dda4b98-816e-4496-a71b-bac04959fe0d	Prof. Dr. Ir. H. Eddy Soeryanto Soegoto, M.T.	$2a$10$eMIneVCtyt0da5sAy//vWucbgnK7zY8Mgvfdd4CgTqnUDleQR61Ri	\N	7	2026-08-10 07:16:50.782	2026-08-10 12:09:54.045	\N	\N	\N	Aktif	\N	+628111111126	f	\N
6787f695-c2e3-4453-a682-4285ee1d46b9	Task Force	$2a$10$s0iHRFP4WTPCRFy5.Qnpg./boj3GcdblAZ5kgwzP7r5ttHMWkqHMC	\N	8	2026-08-10 07:16:51.173	2026-08-10 12:09:54.227	\N	\N	\N	Aktif	\N	+628111111127	f	\N
11f4afb1-c172-42cd-a8ef-88b132d634ad	Dr. Budi Santoso, M.T.	$2a$10$A4K5U/MBULaACRSECiZtiej0mJ.RJDQaSZK/WPdE1DXQFGgxMN4b2	\N	9	2026-08-10 07:16:51.362	2026-08-10 12:09:54.389	\N	\N	\N	Aktif	\N	+6281300000001	f	\N
531fbe2d-0a91-4bcc-9b4f-de2997904c9c	Petugas Residu	$2a$10$MeKaD6CJQgbRQ/8jQOr68..658myNYsuAWk4xIkwQ.8cf0KnuKuTy	\N	10	2026-08-10 07:16:51.758	2026-08-10 12:09:54.765	\N	\N	\N	Aktif	\N	+628111111117	f	\N
a1981a97-1866-47d8-b09a-b0cf1ae5d43d	Warga	$2a$10$dZtyIr.2IGHefDLiEjGqXu6FqPjQjg05ORgclzqYsygUepWyCA/pK	\N	12	2026-08-10 07:16:52.082	2026-08-10 12:09:55.115	\N	\N	\N	Aktif	\N	+62812001001	f	\N
c1255723-50b9-4f51-8b46-b87302893aa4	Mahasiswa Testing	$2a$10$6QRm2AgU1aAcXZWtKDFk.e0/Zt8nEnFtxN5yw6U6kOaacQlKlxsLq	\N	11	2026-08-10 09:54:23.133	2026-08-10 12:15:48.839	\N	\N	\N	Aktif	\N	+628111111118	f	\N
01bedbc8-2ea8-4825-ac89-8aae328dbdc6	Ketua RW 06 Dago	$2a$10$3waANnmditgg8F/a6LCZhuGZD1Ky8VsTeKzkbATlVjeE2MivKzcOO	\N	5	2026-08-10 07:16:51.538	2026-08-10 14:20:28.614	\N	6	\N	Aktif	\N	+628111111115	f	\N
\.


--
-- Data for Name: peran; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.peran (id, nama, dibuat_pada, diperbarui_pada) FROM stdin;
1	SUPER_USER	2026-08-08 16:56:51.786	2026-08-08 16:56:51.786
2	ADMIN_DLH	2026-08-08 16:56:51.823	2026-08-08 16:56:51.823
3	CAMAT	2026-08-08 16:56:51.847	2026-08-08 16:56:51.847
4	LURAH	2026-08-08 16:56:51.868	2026-08-08 16:56:51.868
5	RW	2026-08-08 16:56:51.882	2026-08-08 16:56:51.882
6	RT	2026-08-08 16:56:51.902	2026-08-08 16:56:51.902
7	PEMIMPIN	2026-08-08 16:56:51.92	2026-08-08 16:56:51.92
8	PANITIA_TASKFORCE	2026-08-08 16:56:51.942	2026-08-08 16:56:51.942
9	DPL	2026-08-08 16:56:51.994	2026-08-08 16:56:51.994
10	PETUGAS_RESIDU	2026-08-08 16:56:52.024	2026-08-08 16:56:52.024
11	MAHASISWA_KKN	2026-08-08 16:56:52.1	2026-08-08 16:56:52.1
12	WARGA	2026-08-08 16:56:52.141	2026-08-08 16:56:52.141
\.


--
-- Data for Name: peternakan; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.peternakan (id, nama, pemilik, no_wa, populasi, hasil_panen_kg, dibuat_pada, diperbarui_pada) FROM stdin;
\.


--
-- Data for Name: petugas_residu; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.petugas_residu (id, id_pengguna, nama, no_wa, skor_kpi, zona_ditugaskan, dibuat_pada, diperbarui_pada, latitude, longitude, status_whitelist) FROM stdin;
4d3bc09e-704f-48d1-a1e6-235ace48b1fa	bc37fca4-855d-492e-8f0a-39698ba5bccf	Petugas Residu RW 03 Cipaganti	+628129991060	100.00	Semua Zona	2026-08-09 18:20:30.392	2026-08-09 18:20:30.392	\N	\N	APPROVED
55fa302f-4f59-47d3-9c40-49bcb90c1826	ff942b12-ffa4-4def-8b31-59c1e7768d93	Petugas Residu RW 01 Dago	+628129991004	100.00	Semua Zona	2026-08-09 19:00:18.239	2026-08-09 19:00:18.239	\N	\N	APPROVED
\.


--
-- Data for Name: provinsi; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.provinsi (id, nama, dibuat_pada, diperbarui_pada) FROM stdin;
1	Jawa Barat	2026-08-10 07:16:33.563	2026-08-10 07:16:33.563
\.


--
-- Data for Name: riwayat_poin; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.riwayat_poin (id, id_pengguna, points, description, dibuat_pada, kategori, redeemable) FROM stdin;
75805533-923f-480f-8c97-25fd390e390a	ff942b12-ffa4-4def-8b31-59c1e7768d93	50	Setoran timbangan residu global: 20 kg	2026-08-09 19:02:34.705	SUBMIT_RESIDU	f
11077486-9c6c-47c0-9607-e0fefcc859dc	3751704c-c631-4217-920a-ccda56bae879	10	Aktivasi Bin ORG00012026	2026-08-09 19:13:09.785	PARTISIPASI_STREAK	f
2b726305-a5ab-4771-b7a6-1cd15ca46eb6	3751704c-c631-4217-920a-ccda56bae879	10	Aktivasi Bin ANORG00012026	2026-08-09 19:13:09.813	PARTISIPASI_STREAK	f
deb9daa2-4e83-45eb-bee5-b34f1eab7a3c	3751704c-c631-4217-920a-ccda56bae879	102	Disetor sampah Anorganik seberat 0.69 kg.	2026-08-09 19:13:47.026	REDUKSI_TONASE	f
fe0519eb-f3e5-4f3d-84c0-f9630a380442	3751704c-c631-4217-920a-ccda56bae879	53	Disetor sampah Anorganik seberat 0.35 kg.	2026-08-09 19:14:39.972	REDUKSI_TONASE	f
312fe063-4d0b-4c82-9dd5-cc7e73f36de9	3751704c-c631-4217-920a-ccda56bae879	107	Disetor sampah Organik seberat 0.78 kg.	2026-08-09 19:14:52.978	REDUKSI_TONASE	f
228dca41-93a9-47f0-851a-78916cfcd7ee	3751704c-c631-4217-920a-ccda56bae879	85	Disetor sampah Anorganik seberat 0.65 kg.	2026-08-09 19:15:09.947	REDUKSI_TONASE	f
9d6268e7-6f9f-42fd-80c2-edd15721cf53	3751704c-c631-4217-920a-ccda56bae879	83	Disetor sampah Anorganik seberat 0.6 kg.	2026-08-09 19:15:26.561	REDUKSI_TONASE	f
5eaae3ab-5a5f-410e-95cd-ed3ce913f877	3751704c-c631-4217-920a-ccda56bae879	119	Disetor sampah Anorganik seberat 0.8 kg.	2026-08-09 19:15:34.909	REDUKSI_TONASE	f
ff160755-409d-4272-91ca-11c065e49aeb	3751704c-c631-4217-920a-ccda56bae879	95	Disetor sampah Anorganik seberat 0.79 kg.	2026-08-09 19:16:04.987	REDUKSI_TONASE	f
f0166517-c3a5-4b5c-9bd6-e366f4b1327f	3751704c-c631-4217-920a-ccda56bae879	-5	Penalti melewatkan jadwal buang sampah Pagi	2026-08-10 08:05:00.041	REDUKSI_TONASE	f
612df18a-fe60-47cc-afe5-3f824fec47ff	ff942b12-ffa4-4def-8b31-59c1e7768d93	50	Setoran timbangan residu global: 20 kg	2026-08-10 10:00:50.199	SUBMIT_RESIDU	f
\.


--
-- Data for Name: riwayat_serah_terima_kkn; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.riwayat_serah_terima_kkn (id, id_pengguna_dari, id_pengguna_ke, id_rw, notes, tanggal_serah_terima) FROM stdin;
\.


--
-- Data for Name: rt; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.rt (id, id_rw, nama, dibuat_pada, diperbarui_pada) FROM stdin;
1	129	RT 01	2026-08-10 07:16:33.998	2026-08-10 07:16:33.998
2	129	RT 02	2026-08-10 07:16:34.024	2026-08-10 07:16:34.024
3	129	RT 03	2026-08-10 07:16:34.038	2026-08-10 07:16:34.038
4	129	RT 04	2026-08-10 07:16:34.05	2026-08-10 07:16:34.05
5	129	RT 05	2026-08-10 07:16:34.064	2026-08-10 07:16:34.064
6	69	RT 01	2026-08-10 07:16:34.085	2026-08-10 07:16:34.085
7	69	RT 02	2026-08-10 07:16:34.107	2026-08-10 07:16:34.107
8	69	RT 03	2026-08-10 07:16:34.119	2026-08-10 07:16:34.119
9	69	RT 04	2026-08-10 07:16:34.135	2026-08-10 07:16:34.135
10	69	RT 05	2026-08-10 07:16:34.153	2026-08-10 07:16:34.153
11	70	RT 01	2026-08-10 07:16:34.181	2026-08-10 07:16:34.181
12	70	RT 02	2026-08-10 07:16:34.202	2026-08-10 07:16:34.202
13	70	RT 03	2026-08-10 07:16:34.218	2026-08-10 07:16:34.218
14	70	RT 04	2026-08-10 07:16:34.232	2026-08-10 07:16:34.232
15	70	RT 05	2026-08-10 07:16:34.244	2026-08-10 07:16:34.244
16	71	RT 01	2026-08-10 07:16:34.268	2026-08-10 07:16:34.268
17	71	RT 02	2026-08-10 07:16:34.29	2026-08-10 07:16:34.29
18	71	RT 03	2026-08-10 07:16:34.31	2026-08-10 07:16:34.31
19	71	RT 04	2026-08-10 07:16:34.322	2026-08-10 07:16:34.322
20	71	RT 05	2026-08-10 07:16:34.347	2026-08-10 07:16:34.347
21	72	RT 01	2026-08-10 07:16:34.369	2026-08-10 07:16:34.369
22	72	RT 02	2026-08-10 07:16:34.386	2026-08-10 07:16:34.386
23	72	RT 03	2026-08-10 07:16:34.401	2026-08-10 07:16:34.401
24	72	RT 04	2026-08-10 07:16:34.415	2026-08-10 07:16:34.415
25	72	RT 05	2026-08-10 07:16:34.428	2026-08-10 07:16:34.428
26	73	RT 01	2026-08-10 07:16:34.448	2026-08-10 07:16:34.448
27	73	RT 02	2026-08-10 07:16:34.464	2026-08-10 07:16:34.464
28	73	RT 03	2026-08-10 07:16:34.482	2026-08-10 07:16:34.482
29	73	RT 04	2026-08-10 07:16:34.499	2026-08-10 07:16:34.499
30	73	RT 05	2026-08-10 07:16:34.511	2026-08-10 07:16:34.511
31	74	RT 01	2026-08-10 07:16:34.535	2026-08-10 07:16:34.535
32	74	RT 02	2026-08-10 07:16:34.547	2026-08-10 07:16:34.547
33	74	RT 03	2026-08-10 07:16:34.563	2026-08-10 07:16:34.563
34	74	RT 04	2026-08-10 07:16:34.577	2026-08-10 07:16:34.577
35	74	RT 05	2026-08-10 07:16:34.588	2026-08-10 07:16:34.588
36	75	RT 01	2026-08-10 07:16:34.605	2026-08-10 07:16:34.605
37	75	RT 02	2026-08-10 07:16:34.619	2026-08-10 07:16:34.619
38	75	RT 03	2026-08-10 07:16:34.632	2026-08-10 07:16:34.632
39	75	RT 04	2026-08-10 07:16:34.656	2026-08-10 07:16:34.656
40	75	RT 05	2026-08-10 07:16:34.668	2026-08-10 07:16:34.668
41	76	RT 01	2026-08-10 07:16:34.688	2026-08-10 07:16:34.688
42	76	RT 02	2026-08-10 07:16:34.702	2026-08-10 07:16:34.702
43	76	RT 03	2026-08-10 07:16:34.714	2026-08-10 07:16:34.714
44	76	RT 04	2026-08-10 07:16:34.73	2026-08-10 07:16:34.73
45	76	RT 05	2026-08-10 07:16:34.742	2026-08-10 07:16:34.742
46	130	RT 01	2026-08-10 07:16:34.778	2026-08-10 07:16:34.778
47	130	RT 02	2026-08-10 07:16:34.792	2026-08-10 07:16:34.792
48	130	RT 03	2026-08-10 07:16:34.805	2026-08-10 07:16:34.805
49	130	RT 04	2026-08-10 07:16:34.819	2026-08-10 07:16:34.819
50	130	RT 05	2026-08-10 07:16:34.834	2026-08-10 07:16:34.834
51	131	RT 01	2026-08-10 07:16:34.872	2026-08-10 07:16:34.872
52	131	RT 02	2026-08-10 07:16:34.888	2026-08-10 07:16:34.888
53	131	RT 03	2026-08-10 07:16:34.901	2026-08-10 07:16:34.901
54	131	RT 04	2026-08-10 07:16:34.915	2026-08-10 07:16:34.915
55	131	RT 05	2026-08-10 07:16:34.928	2026-08-10 07:16:34.928
56	132	RT 01	2026-08-10 07:16:34.954	2026-08-10 07:16:34.954
57	132	RT 02	2026-08-10 07:16:34.97	2026-08-10 07:16:34.97
58	132	RT 03	2026-08-10 07:16:34.99	2026-08-10 07:16:34.99
59	132	RT 04	2026-08-10 07:16:35.005	2026-08-10 07:16:35.005
60	132	RT 05	2026-08-10 07:16:35.025	2026-08-10 07:16:35.025
61	133	RT 01	2026-08-10 07:16:35.056	2026-08-10 07:16:35.056
62	133	RT 02	2026-08-10 07:16:35.072	2026-08-10 07:16:35.072
63	133	RT 03	2026-08-10 07:16:35.086	2026-08-10 07:16:35.086
64	133	RT 04	2026-08-10 07:16:35.103	2026-08-10 07:16:35.103
65	133	RT 05	2026-08-10 07:16:35.119	2026-08-10 07:16:35.119
66	134	RT 01	2026-08-10 07:16:35.163	2026-08-10 07:16:35.163
67	134	RT 02	2026-08-10 07:16:35.194	2026-08-10 07:16:35.194
68	134	RT 03	2026-08-10 07:16:35.23	2026-08-10 07:16:35.23
69	134	RT 04	2026-08-10 07:16:35.27	2026-08-10 07:16:35.27
70	134	RT 05	2026-08-10 07:16:35.285	2026-08-10 07:16:35.285
71	85	RT 01	2026-08-10 07:16:35.304	2026-08-10 07:16:35.304
72	85	RT 02	2026-08-10 07:16:35.321	2026-08-10 07:16:35.321
73	85	RT 03	2026-08-10 07:16:35.334	2026-08-10 07:16:35.334
74	85	RT 04	2026-08-10 07:16:35.351	2026-08-10 07:16:35.351
75	85	RT 05	2026-08-10 07:16:35.363	2026-08-10 07:16:35.363
76	86	RT 01	2026-08-10 07:16:35.389	2026-08-10 07:16:35.389
77	86	RT 02	2026-08-10 07:16:35.402	2026-08-10 07:16:35.402
78	86	RT 03	2026-08-10 07:16:35.457	2026-08-10 07:16:35.457
79	86	RT 04	2026-08-10 07:16:35.489	2026-08-10 07:16:35.489
80	86	RT 05	2026-08-10 07:16:35.505	2026-08-10 07:16:35.505
81	87	RT 01	2026-08-10 07:16:35.53	2026-08-10 07:16:35.53
82	87	RT 02	2026-08-10 07:16:35.541	2026-08-10 07:16:35.541
83	87	RT 03	2026-08-10 07:16:35.556	2026-08-10 07:16:35.556
84	87	RT 04	2026-08-10 07:16:35.572	2026-08-10 07:16:35.572
85	87	RT 05	2026-08-10 07:16:35.593	2026-08-10 07:16:35.593
86	88	RT 01	2026-08-10 07:16:35.614	2026-08-10 07:16:35.614
87	88	RT 02	2026-08-10 07:16:35.629	2026-08-10 07:16:35.629
88	88	RT 03	2026-08-10 07:16:35.643	2026-08-10 07:16:35.643
89	88	RT 04	2026-08-10 07:16:35.656	2026-08-10 07:16:35.656
90	88	RT 05	2026-08-10 07:16:35.667	2026-08-10 07:16:35.667
91	89	RT 01	2026-08-10 07:16:35.69	2026-08-10 07:16:35.69
92	89	RT 02	2026-08-10 07:16:35.709	2026-08-10 07:16:35.709
93	89	RT 03	2026-08-10 07:16:35.726	2026-08-10 07:16:35.726
94	89	RT 04	2026-08-10 07:16:35.746	2026-08-10 07:16:35.746
95	89	RT 05	2026-08-10 07:16:35.762	2026-08-10 07:16:35.762
96	90	RT 01	2026-08-10 07:16:35.789	2026-08-10 07:16:35.789
97	90	RT 02	2026-08-10 07:16:35.806	2026-08-10 07:16:35.806
98	90	RT 03	2026-08-10 07:16:35.825	2026-08-10 07:16:35.825
99	90	RT 04	2026-08-10 07:16:35.851	2026-08-10 07:16:35.851
100	90	RT 05	2026-08-10 07:16:35.869	2026-08-10 07:16:35.869
101	91	RT 01	2026-08-10 07:16:35.896	2026-08-10 07:16:35.896
102	91	RT 02	2026-08-10 07:16:35.915	2026-08-10 07:16:35.915
103	91	RT 03	2026-08-10 07:16:35.935	2026-08-10 07:16:35.935
104	91	RT 04	2026-08-10 07:16:35.948	2026-08-10 07:16:35.948
105	91	RT 05	2026-08-10 07:16:35.962	2026-08-10 07:16:35.962
106	92	RT 01	2026-08-10 07:16:35.98	2026-08-10 07:16:35.98
107	92	RT 02	2026-08-10 07:16:35.991	2026-08-10 07:16:35.991
108	92	RT 03	2026-08-10 07:16:36.006	2026-08-10 07:16:36.006
109	92	RT 04	2026-08-10 07:16:36.021	2026-08-10 07:16:36.021
110	92	RT 05	2026-08-10 07:16:36.039	2026-08-10 07:16:36.039
111	135	RT 01	2026-08-10 07:16:36.069	2026-08-10 07:16:36.069
112	135	RT 02	2026-08-10 07:16:36.089	2026-08-10 07:16:36.089
113	135	RT 03	2026-08-10 07:16:36.102	2026-08-10 07:16:36.102
114	135	RT 04	2026-08-10 07:16:36.121	2026-08-10 07:16:36.121
115	135	RT 05	2026-08-10 07:16:36.139	2026-08-10 07:16:36.139
116	136	RT 01	2026-08-10 07:16:36.166	2026-08-10 07:16:36.166
117	136	RT 02	2026-08-10 07:16:36.18	2026-08-10 07:16:36.18
118	136	RT 03	2026-08-10 07:16:36.198	2026-08-10 07:16:36.198
119	136	RT 04	2026-08-10 07:16:36.223	2026-08-10 07:16:36.223
120	136	RT 05	2026-08-10 07:16:36.238	2026-08-10 07:16:36.238
121	137	RT 01	2026-08-10 07:16:36.272	2026-08-10 07:16:36.272
122	137	RT 02	2026-08-10 07:16:36.29	2026-08-10 07:16:36.29
123	137	RT 03	2026-08-10 07:16:36.306	2026-08-10 07:16:36.306
124	137	RT 04	2026-08-10 07:16:36.32	2026-08-10 07:16:36.32
125	137	RT 05	2026-08-10 07:16:36.335	2026-08-10 07:16:36.335
126	138	RT 01	2026-08-10 07:16:36.37	2026-08-10 07:16:36.37
127	138	RT 02	2026-08-10 07:16:36.387	2026-08-10 07:16:36.387
128	138	RT 03	2026-08-10 07:16:36.402	2026-08-10 07:16:36.402
129	138	RT 04	2026-08-10 07:16:36.415	2026-08-10 07:16:36.415
130	138	RT 05	2026-08-10 07:16:36.434	2026-08-10 07:16:36.434
131	93	RT 01	2026-08-10 07:16:36.455	2026-08-10 07:16:36.455
132	93	RT 02	2026-08-10 07:16:36.471	2026-08-10 07:16:36.471
133	93	RT 03	2026-08-10 07:16:36.494	2026-08-10 07:16:36.494
134	93	RT 04	2026-08-10 07:16:36.511	2026-08-10 07:16:36.511
135	93	RT 05	2026-08-10 07:16:36.527	2026-08-10 07:16:36.527
136	94	RT 01	2026-08-10 07:16:36.55	2026-08-10 07:16:36.55
137	94	RT 02	2026-08-10 07:16:36.564	2026-08-10 07:16:36.564
138	94	RT 03	2026-08-10 07:16:36.587	2026-08-10 07:16:36.587
148	96	RT 03	2026-08-10 07:16:36.83	2026-08-10 07:16:36.83
149	96	RT 04	2026-08-10 07:16:36.85	2026-08-10 07:16:36.85
150	96	RT 05	2026-08-10 07:16:36.883	2026-08-10 07:16:36.883
151	97	RT 01	2026-08-10 07:16:36.906	2026-08-10 07:16:36.906
152	97	RT 02	2026-08-10 07:16:36.919	2026-08-10 07:16:36.919
153	97	RT 03	2026-08-10 07:16:36.932	2026-08-10 07:16:36.932
154	97	RT 04	2026-08-10 07:16:36.948	2026-08-10 07:16:36.948
155	97	RT 05	2026-08-10 07:16:36.964	2026-08-10 07:16:36.964
156	98	RT 01	2026-08-10 07:16:36.986	2026-08-10 07:16:36.986
157	98	RT 02	2026-08-10 07:16:37.006	2026-08-10 07:16:37.006
158	98	RT 03	2026-08-10 07:16:37.029	2026-08-10 07:16:37.029
159	98	RT 04	2026-08-10 07:16:37.055	2026-08-10 07:16:37.055
160	98	RT 05	2026-08-10 07:16:37.069	2026-08-10 07:16:37.069
161	100	RT 01	2026-08-10 07:16:37.089	2026-08-10 07:16:37.089
162	100	RT 02	2026-08-10 07:16:37.112	2026-08-10 07:16:37.112
163	100	RT 03	2026-08-10 07:16:37.136	2026-08-10 07:16:37.136
164	100	RT 04	2026-08-10 07:16:37.239	2026-08-10 07:16:37.239
176	103	RT 01	2026-08-10 07:16:37.74	2026-08-10 07:16:37.74
177	103	RT 02	2026-08-10 07:16:37.762	2026-08-10 07:16:37.762
178	103	RT 03	2026-08-10 07:16:37.789	2026-08-10 07:16:37.789
179	103	RT 04	2026-08-10 07:16:37.806	2026-08-10 07:16:37.806
180	103	RT 05	2026-08-10 07:16:37.822	2026-08-10 07:16:37.822
211	110	RT 01	2026-08-10 07:16:38.409	2026-08-10 07:16:38.409
212	110	RT 02	2026-08-10 07:16:38.429	2026-08-10 07:16:38.429
213	110	RT 03	2026-08-10 07:16:38.443	2026-08-10 07:16:38.443
214	110	RT 04	2026-08-10 07:16:38.456	2026-08-10 07:16:38.456
215	110	RT 05	2026-08-10 07:16:38.467	2026-08-10 07:16:38.467
216	111	RT 01	2026-08-10 07:16:38.488	2026-08-10 07:16:38.488
217	111	RT 02	2026-08-10 07:16:38.504	2026-08-10 07:16:38.504
218	111	RT 03	2026-08-10 07:16:38.517	2026-08-10 07:16:38.517
219	111	RT 04	2026-08-10 07:16:38.532	2026-08-10 07:16:38.532
220	111	RT 05	2026-08-10 07:16:38.545	2026-08-10 07:16:38.545
221	112	RT 01	2026-08-10 07:16:38.57	2026-08-10 07:16:38.57
222	112	RT 02	2026-08-10 07:16:38.585	2026-08-10 07:16:38.585
223	112	RT 03	2026-08-10 07:16:38.601	2026-08-10 07:16:38.601
224	112	RT 04	2026-08-10 07:16:38.625	2026-08-10 07:16:38.625
225	112	RT 05	2026-08-10 07:16:38.64	2026-08-10 07:16:38.64
226	113	RT 01	2026-08-10 07:16:38.662	2026-08-10 07:16:38.662
227	113	RT 02	2026-08-10 07:16:38.679	2026-08-10 07:16:38.679
228	113	RT 03	2026-08-10 07:16:38.695	2026-08-10 07:16:38.695
229	113	RT 04	2026-08-10 07:16:38.711	2026-08-10 07:16:38.711
230	113	RT 05	2026-08-10 07:16:38.723	2026-08-10 07:16:38.723
231	114	RT 01	2026-08-10 07:16:38.746	2026-08-10 07:16:38.746
232	114	RT 02	2026-08-10 07:16:38.762	2026-08-10 07:16:38.762
233	114	RT 03	2026-08-10 07:16:38.776	2026-08-10 07:16:38.776
234	114	RT 04	2026-08-10 07:16:38.788	2026-08-10 07:16:38.788
235	114	RT 05	2026-08-10 07:16:38.802	2026-08-10 07:16:38.802
236	115	RT 01	2026-08-10 07:16:38.828	2026-08-10 07:16:38.828
237	115	RT 02	2026-08-10 07:16:38.851	2026-08-10 07:16:38.851
238	115	RT 03	2026-08-10 07:16:38.866	2026-08-10 07:16:38.866
239	115	RT 04	2026-08-10 07:16:38.884	2026-08-10 07:16:38.884
252	118	RT 02	2026-08-10 07:16:39.184	2026-08-10 07:16:39.184
253	118	RT 03	2026-08-10 07:16:39.199	2026-08-10 07:16:39.199
254	118	RT 04	2026-08-10 07:16:39.214	2026-08-10 07:16:39.214
255	118	RT 05	2026-08-10 07:16:39.23	2026-08-10 07:16:39.23
256	119	RT 01	2026-08-10 07:16:39.246	2026-08-10 07:16:39.246
257	119	RT 02	2026-08-10 07:16:39.258	2026-08-10 07:16:39.258
258	119	RT 03	2026-08-10 07:16:39.273	2026-08-10 07:16:39.273
259	119	RT 04	2026-08-10 07:16:39.295	2026-08-10 07:16:39.295
264	120	RT 04	2026-08-10 07:16:39.394	2026-08-10 07:16:39.394
265	120	RT 05	2026-08-10 07:16:39.415	2026-08-10 07:16:39.415
266	139	RT 01	2026-08-10 07:16:39.447	2026-08-10 07:16:39.447
267	139	RT 02	2026-08-10 07:16:39.466	2026-08-10 07:16:39.466
268	139	RT 03	2026-08-10 07:16:39.481	2026-08-10 07:16:39.481
269	139	RT 04	2026-08-10 07:16:39.494	2026-08-10 07:16:39.494
270	139	RT 05	2026-08-10 07:16:39.543	2026-08-10 07:16:39.543
271	77	RT 01	2026-08-10 07:16:39.56	2026-08-10 07:16:39.56
272	77	RT 02	2026-08-10 07:16:39.573	2026-08-10 07:16:39.573
273	77	RT 03	2026-08-10 07:16:39.592	2026-08-10 07:16:39.592
274	77	RT 04	2026-08-10 07:16:39.604	2026-08-10 07:16:39.604
275	77	RT 05	2026-08-10 07:16:39.615	2026-08-10 07:16:39.615
276	78	RT 01	2026-08-10 07:16:39.633	2026-08-10 07:16:39.633
277	78	RT 02	2026-08-10 07:16:39.649	2026-08-10 07:16:39.649
278	78	RT 03	2026-08-10 07:16:39.663	2026-08-10 07:16:39.663
279	78	RT 04	2026-08-10 07:16:39.676	2026-08-10 07:16:39.676
280	78	RT 05	2026-08-10 07:16:39.69	2026-08-10 07:16:39.69
281	79	RT 01	2026-08-10 07:16:39.716	2026-08-10 07:16:39.716
282	79	RT 02	2026-08-10 07:16:39.732	2026-08-10 07:16:39.732
283	79	RT 03	2026-08-10 07:16:39.749	2026-08-10 07:16:39.749
284	79	RT 04	2026-08-10 07:16:39.764	2026-08-10 07:16:39.764
285	79	RT 05	2026-08-10 07:16:39.778	2026-08-10 07:16:39.778
286	80	RT 01	2026-08-10 07:16:39.796	2026-08-10 07:16:39.796
287	80	RT 02	2026-08-10 07:16:39.808	2026-08-10 07:16:39.808
288	80	RT 03	2026-08-10 07:16:39.822	2026-08-10 07:16:39.822
289	80	RT 04	2026-08-10 07:16:39.834	2026-08-10 07:16:39.834
290	80	RT 05	2026-08-10 07:16:39.849	2026-08-10 07:16:39.849
293	81	RT 03	2026-08-10 07:16:39.894	2026-08-10 07:16:39.894
294	81	RT 04	2026-08-10 07:16:39.914	2026-08-10 07:16:39.914
295	81	RT 05	2026-08-10 07:16:39.929	2026-08-10 07:16:39.929
296	82	RT 01	2026-08-10 07:16:39.947	2026-08-10 07:16:39.947
297	82	RT 02	2026-08-10 07:16:39.961	2026-08-10 07:16:39.961
298	82	RT 03	2026-08-10 07:16:39.973	2026-08-10 07:16:39.973
299	82	RT 04	2026-08-10 07:16:39.987	2026-08-10 07:16:39.987
300	82	RT 05	2026-08-10 07:16:40.004	2026-08-10 07:16:40.004
301	83	RT 01	2026-08-10 07:16:40.024	2026-08-10 07:16:40.024
302	83	RT 02	2026-08-10 07:16:40.066	2026-08-10 07:16:40.066
303	83	RT 03	2026-08-10 07:16:40.087	2026-08-10 07:16:40.087
304	83	RT 04	2026-08-10 07:16:40.099	2026-08-10 07:16:40.099
305	83	RT 05	2026-08-10 07:16:40.114	2026-08-10 07:16:40.114
306	84	RT 01	2026-08-10 07:16:40.135	2026-08-10 07:16:40.135
307	84	RT 02	2026-08-10 07:16:40.152	2026-08-10 07:16:40.152
340	145	RT 05	2026-08-10 07:16:40.783	2026-08-10 07:16:40.783
341	146	RT 01	2026-08-10 07:16:40.811	2026-08-10 07:16:40.811
342	146	RT 02	2026-08-10 07:16:40.83	2026-08-10 07:16:40.83
343	146	RT 03	2026-08-10 07:16:40.844	2026-08-10 07:16:40.844
344	146	RT 04	2026-08-10 07:16:40.865	2026-08-10 07:16:40.865
345	146	RT 05	2026-08-10 07:16:40.879	2026-08-10 07:16:40.879
346	147	RT 01	2026-08-10 07:16:40.906	2026-08-10 07:16:40.906
347	147	RT 02	2026-08-10 07:16:40.918	2026-08-10 07:16:40.918
348	147	RT 03	2026-08-10 07:16:40.937	2026-08-10 07:16:40.937
349	147	RT 04	2026-08-10 07:16:40.956	2026-08-10 07:16:40.956
350	147	RT 05	2026-08-10 07:16:40.968	2026-08-10 07:16:40.968
351	121	RT 01	2026-08-10 07:16:40.987	2026-08-10 07:16:40.987
352	121	RT 02	2026-08-10 07:16:41.001	2026-08-10 07:16:41.001
353	121	RT 03	2026-08-10 07:16:41.018	2026-08-10 07:16:41.018
354	121	RT 04	2026-08-10 07:16:41.03	2026-08-10 07:16:41.03
355	121	RT 05	2026-08-10 07:16:41.042	2026-08-10 07:16:41.042
356	122	RT 01	2026-08-10 07:16:41.061	2026-08-10 07:16:41.061
357	122	RT 02	2026-08-10 07:16:41.075	2026-08-10 07:16:41.075
358	122	RT 03	2026-08-10 07:16:41.089	2026-08-10 07:16:41.089
359	122	RT 04	2026-08-10 07:16:41.103	2026-08-10 07:16:41.103
360	122	RT 05	2026-08-10 07:16:41.114	2026-08-10 07:16:41.114
361	123	RT 01	2026-08-10 07:16:41.13	2026-08-10 07:16:41.13
362	123	RT 02	2026-08-10 07:16:41.143	2026-08-10 07:16:41.143
363	123	RT 03	2026-08-10 07:16:41.156	2026-08-10 07:16:41.156
364	123	RT 04	2026-08-10 07:16:41.169	2026-08-10 07:16:41.169
365	123	RT 05	2026-08-10 07:16:41.184	2026-08-10 07:16:41.184
366	124	RT 01	2026-08-10 07:16:41.202	2026-08-10 07:16:41.202
367	124	RT 02	2026-08-10 07:16:41.217	2026-08-10 07:16:41.217
368	124	RT 03	2026-08-10 07:16:41.229	2026-08-10 07:16:41.229
369	124	RT 04	2026-08-10 07:16:41.244	2026-08-10 07:16:41.244
370	124	RT 05	2026-08-10 07:16:41.259	2026-08-10 07:16:41.259
371	125	RT 01	2026-08-10 07:16:41.277	2026-08-10 07:16:41.277
372	125	RT 02	2026-08-10 07:16:41.295	2026-08-10 07:16:41.295
139	94	RT 04	2026-08-10 07:16:36.605	2026-08-10 07:16:36.605
140	94	RT 05	2026-08-10 07:16:36.632	2026-08-10 07:16:36.632
141	95	RT 01	2026-08-10 07:16:36.657	2026-08-10 07:16:36.657
142	95	RT 02	2026-08-10 07:16:36.689	2026-08-10 07:16:36.689
143	95	RT 03	2026-08-10 07:16:36.722	2026-08-10 07:16:36.722
144	95	RT 04	2026-08-10 07:16:36.743	2026-08-10 07:16:36.743
145	95	RT 05	2026-08-10 07:16:36.762	2026-08-10 07:16:36.762
146	96	RT 01	2026-08-10 07:16:36.796	2026-08-10 07:16:36.796
147	96	RT 02	2026-08-10 07:16:36.812	2026-08-10 07:16:36.812
165	100	RT 05	2026-08-10 07:16:37.288	2026-08-10 07:16:37.288
166	101	RT 01	2026-08-10 07:16:37.317	2026-08-10 07:16:37.317
167	101	RT 02	2026-08-10 07:16:37.371	2026-08-10 07:16:37.371
168	101	RT 03	2026-08-10 07:16:37.438	2026-08-10 07:16:37.438
169	101	RT 04	2026-08-10 07:16:37.513	2026-08-10 07:16:37.513
170	101	RT 05	2026-08-10 07:16:37.611	2026-08-10 07:16:37.611
171	102	RT 01	2026-08-10 07:16:37.642	2026-08-10 07:16:37.642
172	102	RT 02	2026-08-10 07:16:37.661	2026-08-10 07:16:37.661
173	102	RT 03	2026-08-10 07:16:37.678	2026-08-10 07:16:37.678
174	102	RT 04	2026-08-10 07:16:37.697	2026-08-10 07:16:37.697
175	102	RT 05	2026-08-10 07:16:37.713	2026-08-10 07:16:37.713
181	104	RT 01	2026-08-10 07:16:37.844	2026-08-10 07:16:37.844
182	104	RT 02	2026-08-10 07:16:37.857	2026-08-10 07:16:37.857
183	104	RT 03	2026-08-10 07:16:37.896	2026-08-10 07:16:37.896
184	104	RT 04	2026-08-10 07:16:37.944	2026-08-10 07:16:37.944
185	104	RT 05	2026-08-10 07:16:37.961	2026-08-10 07:16:37.961
186	105	RT 01	2026-08-10 07:16:37.986	2026-08-10 07:16:37.986
187	105	RT 02	2026-08-10 07:16:38.001	2026-08-10 07:16:38.001
188	105	RT 03	2026-08-10 07:16:38.018	2026-08-10 07:16:38.018
189	105	RT 04	2026-08-10 07:16:38.032	2026-08-10 07:16:38.032
190	105	RT 05	2026-08-10 07:16:38.048	2026-08-10 07:16:38.048
191	106	RT 01	2026-08-10 07:16:38.076	2026-08-10 07:16:38.076
192	106	RT 02	2026-08-10 07:16:38.096	2026-08-10 07:16:38.096
193	106	RT 03	2026-08-10 07:16:38.11	2026-08-10 07:16:38.11
194	106	RT 04	2026-08-10 07:16:38.123	2026-08-10 07:16:38.123
195	106	RT 05	2026-08-10 07:16:38.135	2026-08-10 07:16:38.135
196	107	RT 01	2026-08-10 07:16:38.153	2026-08-10 07:16:38.153
197	107	RT 02	2026-08-10 07:16:38.166	2026-08-10 07:16:38.166
198	107	RT 03	2026-08-10 07:16:38.18	2026-08-10 07:16:38.18
199	107	RT 04	2026-08-10 07:16:38.196	2026-08-10 07:16:38.196
200	107	RT 05	2026-08-10 07:16:38.211	2026-08-10 07:16:38.211
201	108	RT 01	2026-08-10 07:16:38.244	2026-08-10 07:16:38.244
202	108	RT 02	2026-08-10 07:16:38.259	2026-08-10 07:16:38.259
203	108	RT 03	2026-08-10 07:16:38.272	2026-08-10 07:16:38.272
204	108	RT 04	2026-08-10 07:16:38.291	2026-08-10 07:16:38.291
205	108	RT 05	2026-08-10 07:16:38.306	2026-08-10 07:16:38.306
206	109	RT 01	2026-08-10 07:16:38.326	2026-08-10 07:16:38.326
207	109	RT 02	2026-08-10 07:16:38.343	2026-08-10 07:16:38.343
208	109	RT 03	2026-08-10 07:16:38.357	2026-08-10 07:16:38.357
209	109	RT 04	2026-08-10 07:16:38.375	2026-08-10 07:16:38.375
210	109	RT 05	2026-08-10 07:16:38.39	2026-08-10 07:16:38.39
240	115	RT 05	2026-08-10 07:16:38.902	2026-08-10 07:16:38.902
241	116	RT 01	2026-08-10 07:16:38.928	2026-08-10 07:16:38.928
242	116	RT 02	2026-08-10 07:16:38.945	2026-08-10 07:16:38.945
243	116	RT 03	2026-08-10 07:16:38.958	2026-08-10 07:16:38.958
244	116	RT 04	2026-08-10 07:16:38.976	2026-08-10 07:16:38.976
245	116	RT 05	2026-08-10 07:16:38.988	2026-08-10 07:16:38.988
246	117	RT 01	2026-08-10 07:16:39.023	2026-08-10 07:16:39.023
247	117	RT 02	2026-08-10 07:16:39.074	2026-08-10 07:16:39.074
248	117	RT 03	2026-08-10 07:16:39.122	2026-08-10 07:16:39.122
249	117	RT 04	2026-08-10 07:16:39.135	2026-08-10 07:16:39.135
250	117	RT 05	2026-08-10 07:16:39.152	2026-08-10 07:16:39.152
251	118	RT 01	2026-08-10 07:16:39.172	2026-08-10 07:16:39.172
260	119	RT 05	2026-08-10 07:16:39.311	2026-08-10 07:16:39.311
261	120	RT 01	2026-08-10 07:16:39.33	2026-08-10 07:16:39.33
262	120	RT 02	2026-08-10 07:16:39.346	2026-08-10 07:16:39.346
263	120	RT 03	2026-08-10 07:16:39.36	2026-08-10 07:16:39.36
291	81	RT 01	2026-08-10 07:16:39.867	2026-08-10 07:16:39.867
292	81	RT 02	2026-08-10 07:16:39.88	2026-08-10 07:16:39.88
308	84	RT 03	2026-08-10 07:16:40.168	2026-08-10 07:16:40.168
309	84	RT 04	2026-08-10 07:16:40.186	2026-08-10 07:16:40.186
310	84	RT 05	2026-08-10 07:16:40.203	2026-08-10 07:16:40.203
311	140	RT 01	2026-08-10 07:16:40.238	2026-08-10 07:16:40.238
312	140	RT 02	2026-08-10 07:16:40.259	2026-08-10 07:16:40.259
313	140	RT 03	2026-08-10 07:16:40.276	2026-08-10 07:16:40.276
314	140	RT 04	2026-08-10 07:16:40.291	2026-08-10 07:16:40.291
315	140	RT 05	2026-08-10 07:16:40.305	2026-08-10 07:16:40.305
316	141	RT 01	2026-08-10 07:16:40.342	2026-08-10 07:16:40.342
317	141	RT 02	2026-08-10 07:16:40.366	2026-08-10 07:16:40.366
318	141	RT 03	2026-08-10 07:16:40.377	2026-08-10 07:16:40.377
319	141	RT 04	2026-08-10 07:16:40.39	2026-08-10 07:16:40.39
320	141	RT 05	2026-08-10 07:16:40.403	2026-08-10 07:16:40.403
321	142	RT 01	2026-08-10 07:16:40.45	2026-08-10 07:16:40.45
322	142	RT 02	2026-08-10 07:16:40.47	2026-08-10 07:16:40.47
323	142	RT 03	2026-08-10 07:16:40.488	2026-08-10 07:16:40.488
324	142	RT 04	2026-08-10 07:16:40.502	2026-08-10 07:16:40.502
325	142	RT 05	2026-08-10 07:16:40.521	2026-08-10 07:16:40.521
326	143	RT 01	2026-08-10 07:16:40.55	2026-08-10 07:16:40.55
327	143	RT 02	2026-08-10 07:16:40.563	2026-08-10 07:16:40.563
328	143	RT 03	2026-08-10 07:16:40.578	2026-08-10 07:16:40.578
329	143	RT 04	2026-08-10 07:16:40.592	2026-08-10 07:16:40.592
330	143	RT 05	2026-08-10 07:16:40.605	2026-08-10 07:16:40.605
331	144	RT 01	2026-08-10 07:16:40.638	2026-08-10 07:16:40.638
332	144	RT 02	2026-08-10 07:16:40.652	2026-08-10 07:16:40.652
333	144	RT 03	2026-08-10 07:16:40.665	2026-08-10 07:16:40.665
334	144	RT 04	2026-08-10 07:16:40.681	2026-08-10 07:16:40.681
335	144	RT 05	2026-08-10 07:16:40.693	2026-08-10 07:16:40.693
336	145	RT 01	2026-08-10 07:16:40.724	2026-08-10 07:16:40.724
337	145	RT 02	2026-08-10 07:16:40.741	2026-08-10 07:16:40.741
338	145	RT 03	2026-08-10 07:16:40.756	2026-08-10 07:16:40.756
339	145	RT 04	2026-08-10 07:16:40.77	2026-08-10 07:16:40.77
373	125	RT 03	2026-08-10 07:16:41.313	2026-08-10 07:16:41.313
374	125	RT 04	2026-08-10 07:16:41.327	2026-08-10 07:16:41.327
375	125	RT 05	2026-08-10 07:16:41.344	2026-08-10 07:16:41.344
376	126	RT 01	2026-08-10 07:16:41.367	2026-08-10 07:16:41.367
377	126	RT 02	2026-08-10 07:16:41.381	2026-08-10 07:16:41.381
378	126	RT 03	2026-08-10 07:16:41.407	2026-08-10 07:16:41.407
379	126	RT 04	2026-08-10 07:16:41.422	2026-08-10 07:16:41.422
380	126	RT 05	2026-08-10 07:16:41.895	2026-08-10 07:16:41.895
\.


--
-- Data for Name: rumah_tangga; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.rumah_tangga (id, id_pengguna, address, id_rw, latitude, longitude, dibuat_pada, diperbarui_pada) FROM stdin;
38c6145b-1a13-4dbd-b3c2-7cf4693d36d3	14cadcdd-cf3d-4f40-8fd9-8c521418e8eb	Jl. Coblong QC No. 1	1	0.00000000	0.00000000	2026-08-09 07:53:31.797	2026-08-09 07:53:31.797
97e55cba-d4a7-43a5-8ba6-81307038acae	f41f255f-aae5-460f-acbb-a058b64c16bb	Jl. Coblong QC No. 1	1	0.00000000	0.00000000	2026-08-09 07:54:00.29	2026-08-09 07:54:00.29
ea91289b-252a-4ce1-8cc0-fa9ca0cc7dbd	ae0bb2ae-3d98-4a32-b284-750ea2394da8	Jl. Coblong QC No. 1	1	0.00000000	0.00000000	2026-08-09 07:54:10.123	2026-08-09 07:54:10.123
f429b444-56a0-4f20-b9d6-cacdb01a0405	67578020-47be-4b83-a822-7d6cc714b3d2	Jalan Utama Dago	6	0.00000000	0.00000000	2026-08-09 09:15:58.21	2026-08-09 09:15:58.21
92323478-0922-44e4-926a-16eb3a498a30	3751704c-c631-4217-920a-ccda56bae879	Dago	1	0.00000000	0.00000000	2026-08-09 18:42:35.749	2026-08-09 18:42:35.749
318dbd0c-9d98-4376-9f37-3d6fd87300f7	9f913157-8e6c-4cde-bce7-54a3c5cddf8e	Subang	1	0.00000000	0.00000000	2026-08-10 02:52:58.13	2026-08-10 02:52:58.13
\.


--
-- Data for Name: rw; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.rw (id, id_kelurahan, nama, latitude, longitude, id_petugas_residu, dibuat_pada, diperbarui_pada) FROM stdin;
1	55251864-2d84-4452-a848-9b1c6b0e558a	RW 01 (Dago)	-6.87361370	107.61860850	ff942b12-ffa4-4def-8b31-59c1e7768d93	2026-08-08 16:56:59.013	2026-08-08 16:56:59.284
2	55251864-2d84-4452-a848-9b1c6b0e558a	RW 02 (Dago)	-6.87171600	107.61822440	19137ea5-3de7-4087-a14f-ff5e2121de3a	2026-08-08 16:56:59.327	2026-08-08 16:56:59.485
3	55251864-2d84-4452-a848-9b1c6b0e558a	RW 03 (Dago)	-6.87302250	107.61619320	09b1c954-ded5-44e4-9936-f5fb8a7ceb30	2026-08-08 16:56:59.523	2026-08-08 16:56:59.678
4	55251864-2d84-4452-a848-9b1c6b0e558a	RW 04 (Dago)	-6.87220290	107.61488830	\N	2026-08-08 16:56:59.715	2026-08-08 16:56:59.715
5	55251864-2d84-4452-a848-9b1c6b0e558a	RW 05 (Dago)	-6.87235540	107.61295810	\N	2026-08-08 16:56:59.745	2026-08-08 16:56:59.745
6	55251864-2d84-4452-a848-9b1c6b0e558a	RW 06 (Dago)	-6.87452930	107.61401020	\N	2026-08-08 16:56:59.776	2026-08-08 16:56:59.776
7	55251864-2d84-4452-a848-9b1c6b0e558a	RW 07 (Dago)	-6.87572580	107.61303930	\N	2026-08-08 16:56:59.804	2026-08-08 16:56:59.804
8	55251864-2d84-4452-a848-9b1c6b0e558a	RW 08 (Dago)	-6.87766040	107.61295810	\N	2026-08-08 16:56:59.837	2026-08-08 16:56:59.837
9	55251864-2d84-4452-a848-9b1c6b0e558a	RW 09 (Dago)	-6.87687790	107.61524290	\N	2026-08-08 16:56:59.873	2026-08-08 16:56:59.873
10	55251864-2d84-4452-a848-9b1c6b0e558a	RW 10 (Dago)	-6.87798600	107.61631370	\N	2026-08-08 16:56:59.908	2026-08-08 16:56:59.908
11	55251864-2d84-4452-a848-9b1c6b0e558a	RW 11 (Dago)	-6.87829980	107.61822440	\N	2026-08-08 16:56:59.96	2026-08-08 16:56:59.96
12	55251864-2d84-4452-a848-9b1c6b0e558a	RW 12 (Dago)	-6.87593730	107.61772300	\N	2026-08-08 16:57:00.04	2026-08-08 16:57:00.04
13	55251864-2d84-4452-a848-9b1c6b0e558a	RW 13 (Dago)	-6.87500790	107.61895210	\N	2026-08-08 16:57:00.072	2026-08-08 16:57:00.072
14	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 01 (Sadang Serang)	-6.88973870	107.62923510	03034143-3f39-4f15-85c8-c6068a3b61fc	2026-08-08 16:57:00.182	2026-08-08 16:57:00.333
15	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 02 (Sadang Serang)	-6.88772790	107.62763160	7afced49-1972-4d1b-bf17-218b94a6640f	2026-08-08 16:57:00.789	2026-08-08 16:57:00.956
16	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 03 (Sadang Serang)	-6.88993500	107.62593700	be2e297e-2425-4aff-a038-9a8a3bd13fc7	2026-08-08 16:57:00.986	2026-08-08 16:57:01.147
17	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 04 (Sadang Serang)	-6.89064100	107.62411790	\N	2026-08-08 16:57:01.189	2026-08-08 16:57:01.189
18	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 05 (Sadang Serang)	-6.89303520	107.62317820	\N	2026-08-08 16:57:01.23	2026-08-08 16:57:01.23
19	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 06 (Sadang Serang)	-6.89339920	107.62593700	\N	2026-08-08 16:57:01.299	2026-08-08 16:57:01.299
20	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 07 (Sadang Serang)	-6.89462150	107.62745790	\N	2026-08-08 16:57:01.361	2026-08-08 16:57:01.361
21	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 08 (Sadang Serang)	-6.89423830	107.63000120	\N	2026-08-08 16:57:01.397	2026-08-08 16:57:01.397
22	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 09 (Sadang Serang)	-6.89166710	107.62893700	\N	2026-08-08 16:57:01.472	2026-08-08 16:57:01.472
23	670632d6-a482-4aff-a128-a81f3821ce25	RW 01 (Sekeloa)	-6.88526390	107.62318760	11ee0bf0-059a-4ec1-a0c5-795b333b849c	2026-08-08 16:57:01.657	2026-08-08 16:57:02.617
24	670632d6-a482-4aff-a128-a81f3821ce25	RW 02 (Sekeloa)	-6.88351150	107.62312350	d8444feb-ed90-4f49-97d1-89286dd09f72	2026-08-08 16:57:02.657	2026-08-08 16:57:02.963
25	670632d6-a482-4aff-a128-a81f3821ce25	RW 03 (Sekeloa)	-6.88458200	107.62106500	f1de46d1-2116-468c-90e8-da197d5722ee	2026-08-08 16:57:03.001	2026-08-08 16:57:03.185
26	670632d6-a482-4aff-a128-a81f3821ce25	RW 04 (Sekeloa)	-6.88350050	107.62013340	\N	2026-08-08 16:57:03.228	2026-08-08 16:57:03.228
27	670632d6-a482-4aff-a128-a81f3821ce25	RW 05 (Sekeloa)	-6.88302000	107.61844700	\N	2026-08-08 16:57:03.272	2026-08-08 16:57:03.272
28	670632d6-a482-4aff-a128-a81f3821ce25	RW 06 (Sekeloa)	-6.88530850	107.61882900	\N	2026-08-08 16:57:03.468	2026-08-08 16:57:03.468
29	670632d6-a482-4aff-a128-a81f3821ce25	RW 07 (Sekeloa)	-6.88586040	107.61751260	\N	2026-08-08 16:57:03.542	2026-08-08 16:57:03.542
30	670632d6-a482-4aff-a128-a81f3821ce25	RW 08 (Sekeloa)	-6.88731570	107.61653440	\N	2026-08-08 16:57:03.624	2026-08-08 16:57:03.624
31	670632d6-a482-4aff-a128-a81f3821ce25	RW 09 (Sekeloa)	-6.88765970	107.61882900	\N	2026-08-08 16:57:03.671	2026-08-08 16:57:03.671
32	670632d6-a482-4aff-a128-a81f3821ce25	RW 10 (Sekeloa)	-6.88908220	107.61894700	\N	2026-08-08 16:57:03.708	2026-08-08 16:57:03.708
33	670632d6-a482-4aff-a128-a81f3821ce25	RW 11 (Sekeloa)	-6.89046220	107.62002890	\N	2026-08-08 16:57:03.835	2026-08-08 16:57:03.835
34	670632d6-a482-4aff-a128-a81f3821ce25	RW 12 (Sekeloa)	-6.88838620	107.62106500	\N	2026-08-08 16:57:04.048	2026-08-08 16:57:04.048
35	670632d6-a482-4aff-a128-a81f3821ce25	RW 13 (Sekeloa)	-6.88871350	107.62245440	\N	2026-08-08 16:57:04.084	2026-08-08 16:57:04.084
36	670632d6-a482-4aff-a128-a81f3821ce25	RW 14 (Sekeloa)	-6.88811100	107.62410120	\N	2026-08-08 16:57:04.138	2026-08-08 16:57:04.138
37	670632d6-a482-4aff-a128-a81f3821ce25	RW 15 (Sekeloa)	-6.88648410	107.62244700	\N	2026-08-08 16:57:04.209	2026-08-08 16:57:04.209
38	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 01 (Lebak Gede)	-6.89339650	107.61786690	e144de11-8305-499a-9aa8-5e9841a07868	2026-08-08 16:57:04.343	2026-08-08 16:57:04.499
39	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 02 (Lebak Gede)	-6.89149880	107.61748280	183b288d-0384-458c-a45f-326be0ec1d59	2026-08-08 16:57:04.559	2026-08-08 16:57:04.737
40	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 03 (Lebak Gede)	-6.89280530	107.61545160	66388f0a-c061-4b8b-9a1a-3cd836a0078c	2026-08-08 16:57:04.795	2026-08-08 16:57:04.934
41	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 04 (Lebak Gede)	-6.89198570	107.61414670	\N	2026-08-08 16:57:04.979	2026-08-08 16:57:04.979
42	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 05 (Lebak Gede)	-6.89213820	107.61221650	\N	2026-08-08 16:57:05.011	2026-08-08 16:57:05.011
43	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 06 (Lebak Gede)	-6.89431210	107.61326860	\N	2026-08-08 16:57:05.048	2026-08-08 16:57:05.048
44	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 07 (Lebak Gede)	-6.89550860	107.61229770	\N	2026-08-08 16:57:05.08	2026-08-08 16:57:05.08
45	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 08 (Lebak Gede)	-6.89744320	107.61221650	\N	2026-08-08 16:57:05.115	2026-08-08 16:57:05.115
46	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 09 (Lebak Gede)	-6.89666070	107.61450130	\N	2026-08-08 16:57:05.139	2026-08-08 16:57:05.139
47	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 10 (Lebak Gede)	-6.89776880	107.61557210	\N	2026-08-08 16:57:05.179	2026-08-08 16:57:05.179
48	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 11 (Lebak Gede)	-6.89808260	107.61748280	\N	2026-08-08 16:57:05.221	2026-08-08 16:57:05.221
49	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 12 (Lebak Gede)	-6.89572010	107.61698140	\N	2026-08-08 16:57:05.285	2026-08-08 16:57:05.285
50	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 13 (Lebak Gede)	-6.89479070	107.61821050	\N	2026-08-08 16:57:05.338	2026-08-08 16:57:05.338
51	f27ddb02-7df2-42ae-88d8-d1590800062b	RW 01 (Lebak Siliwangi)	-6.88966420	107.61220310	d30b32c2-0ea5-468c-93d0-e61a4fc60253	2026-08-08 16:57:05.447	2026-08-08 16:57:05.613
52	f27ddb02-7df2-42ae-88d8-d1590800062b	RW 02 (Lebak Siliwangi)	-6.88811000	107.60944250	b6c11876-66f6-4d16-b17b-e6fc5f0d5aaa	2026-08-08 16:57:05.647	2026-08-08 16:57:05.815
53	f27ddb02-7df2-42ae-88d8-d1590800062b	RW 03 (Lebak Siliwangi)	-6.89114190	107.60853070	90cc8eba-a957-4a5b-a58a-7811de59f45d	2026-08-08 16:57:05.857	2026-08-08 16:57:05.977
54	f27ddb02-7df2-42ae-88d8-d1590800062b	RW 04 (Lebak Siliwangi)	-6.89331140	107.60762970	\N	2026-08-08 16:57:06.019	2026-08-08 16:57:06.019
55	f27ddb02-7df2-42ae-88d8-d1590800062b	RW 05 (Lebak Siliwangi)	-6.89590940	107.60944250	\N	2026-08-08 16:57:06.063	2026-08-08 16:57:06.063
56	f27ddb02-7df2-42ae-88d8-d1590800062b	RW 06 (Lebak Siliwangi)	-6.89357340	107.61157960	\N	2026-08-08 16:57:06.104	2026-08-08 16:57:06.104
57	f27ddb02-7df2-42ae-88d8-d1590800062b	RW 07 (Lebak Siliwangi)	-6.89200970	107.61333260	\N	2026-08-08 16:57:06.149	2026-08-08 16:57:06.149
58	83d5f852-287b-492b-a260-87e50a76f1f2	RW 01 (Cipaganti)	-6.88505000	107.60546020	17da275f-02b5-450c-9d84-f4bd845bc6c5	2026-08-08 16:57:06.294	2026-08-08 16:57:06.423
59	83d5f852-287b-492b-a260-87e50a76f1f2	RW 02 (Cipaganti)	-6.88303340	107.60459810	e3802e31-c467-4e45-a1d0-7b247491eef7	2026-08-08 16:57:06.463	2026-08-08 16:57:06.59
62	83d5f852-287b-492b-a260-87e50a76f1f2	RW 05 (Cipaganti)	-6.88554500	107.59909840	\N	2026-08-08 16:57:06.838	2026-08-08 16:57:06.838
60	83d5f852-287b-492b-a260-87e50a76f1f2	RW 03 (Cipaganti)	-6.88469230	107.60265180	bc37fca4-855d-492e-8f0a-39698ba5bccf	2026-08-08 16:57:06.628	2026-08-08 16:57:06.758
61	83d5f852-287b-492b-a260-87e50a76f1f2	RW 04 (Cipaganti)	-6.88440470	107.60097180	\N	2026-08-08 16:57:06.8	2026-08-08 16:57:06.8
63	83d5f852-287b-492b-a260-87e50a76f1f2	RW 06 (Cipaganti)	-6.88723540	107.60101740	\N	2026-08-08 16:57:06.869	2026-08-08 16:57:06.869
64	83d5f852-287b-492b-a260-87e50a76f1f2	RW 07 (Cipaganti)	-6.88893910	107.60097180	\N	2026-08-08 16:57:06.925	2026-08-08 16:57:06.925
65	83d5f852-287b-492b-a260-87e50a76f1f2	RW 08 (Cipaganti)	-6.89063120	107.60236710	\N	2026-08-08 16:57:06.959	2026-08-08 16:57:06.959
66	83d5f852-287b-492b-a260-87e50a76f1f2	RW 09 (Cipaganti)	-6.88849120	107.60376720	\N	2026-08-08 16:57:06.991	2026-08-08 16:57:06.991
67	83d5f852-287b-492b-a260-87e50a76f1f2	RW 10 (Cipaganti)	-6.88829380	107.60546020	\N	2026-08-08 16:57:07.021	2026-08-08 16:57:07.021
68	83d5f852-287b-492b-a260-87e50a76f1f2	RW 11 (Cipaganti)	-6.88667190	107.60693640	\N	2026-08-08 16:57:07.062	2026-08-08 16:57:07.062
69	55251864-2d84-4452-a848-9b1c6b0e558a	RW 02	-6.88840000	107.61680000	\N	2026-08-09 04:27:04.294	2026-08-09 04:27:04.294
70	55251864-2d84-4452-a848-9b1c6b0e558a	RW 03	-6.88760000	107.61770000	\N	2026-08-09 04:27:04.525	2026-08-09 04:27:04.525
71	55251864-2d84-4452-a848-9b1c6b0e558a	RW 04	-6.88680000	107.61860000	\N	2026-08-09 04:27:04.728	2026-08-09 04:27:04.728
72	55251864-2d84-4452-a848-9b1c6b0e558a	RW 05	-6.88600000	107.61950000	\N	2026-08-09 04:27:04.911	2026-08-09 04:27:04.911
73	55251864-2d84-4452-a848-9b1c6b0e558a	RW 06	-6.88520000	107.62040000	\N	2026-08-09 04:27:05.11	2026-08-09 04:27:05.11
74	55251864-2d84-4452-a848-9b1c6b0e558a	RW 07	-6.88440000	107.62130000	\N	2026-08-09 04:27:05.297	2026-08-09 04:27:05.297
75	55251864-2d84-4452-a848-9b1c6b0e558a	RW 08	-6.88360000	107.62220000	\N	2026-08-09 04:27:05.48	2026-08-09 04:27:05.48
76	55251864-2d84-4452-a848-9b1c6b0e558a	RW 09	-6.88280000	107.62310000	\N	2026-08-09 04:27:05.661	2026-08-09 04:27:05.661
77	670632d6-a482-4aff-a128-a81f3821ce25	RW 02	-6.88840000	107.61680000	\N	2026-08-09 04:27:06.685	2026-08-09 04:27:06.685
78	670632d6-a482-4aff-a128-a81f3821ce25	RW 03	-6.88760000	107.61770000	\N	2026-08-09 04:27:06.869	2026-08-09 04:27:06.869
79	670632d6-a482-4aff-a128-a81f3821ce25	RW 04	-6.88680000	107.61860000	\N	2026-08-09 04:27:07.066	2026-08-09 04:27:07.066
80	670632d6-a482-4aff-a128-a81f3821ce25	RW 05	-6.88600000	107.61950000	\N	2026-08-09 04:27:07.266	2026-08-09 04:27:07.266
81	670632d6-a482-4aff-a128-a81f3821ce25	RW 06	-6.88520000	107.62040000	\N	2026-08-09 04:27:07.474	2026-08-09 04:27:07.474
82	670632d6-a482-4aff-a128-a81f3821ce25	RW 07	-6.88440000	107.62130000	\N	2026-08-09 04:27:07.671	2026-08-09 04:27:07.671
83	670632d6-a482-4aff-a128-a81f3821ce25	RW 08	-6.88360000	107.62220000	\N	2026-08-09 04:27:07.87	2026-08-09 04:27:07.87
84	670632d6-a482-4aff-a128-a81f3821ce25	RW 09	-6.88280000	107.62310000	\N	2026-08-09 04:27:08.089	2026-08-09 04:27:08.089
85	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 02	-6.88840000	107.61680000	\N	2026-08-09 04:27:09.466	2026-08-09 04:27:09.466
86	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 03	-6.88760000	107.61770000	\N	2026-08-09 04:27:09.661	2026-08-09 04:27:09.661
87	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 04	-6.88680000	107.61860000	\N	2026-08-09 04:27:09.842	2026-08-09 04:27:09.842
88	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 05	-6.88600000	107.61950000	\N	2026-08-09 04:27:10.038	2026-08-09 04:27:10.038
89	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 06	-6.88520000	107.62040000	\N	2026-08-09 04:27:10.225	2026-08-09 04:27:10.225
90	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 07	-6.88440000	107.62130000	\N	2026-08-09 04:27:10.424	2026-08-09 04:27:10.424
91	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 08	-6.88360000	107.62220000	\N	2026-08-09 04:27:10.614	2026-08-09 04:27:10.614
92	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 09	-6.88280000	107.62310000	\N	2026-08-09 04:27:10.784	2026-08-09 04:27:10.784
93	f27ddb02-7df2-42ae-88d8-d1590800062b	RW 01	-6.88920000	107.61590000	\N	2026-08-09 04:27:11.73	2026-08-09 04:27:11.73
94	f27ddb02-7df2-42ae-88d8-d1590800062b	RW 02	-6.88840000	107.61680000	\N	2026-08-09 04:27:11.92	2026-08-09 04:27:11.92
95	f27ddb02-7df2-42ae-88d8-d1590800062b	RW 03	-6.88760000	107.61770000	\N	2026-08-09 04:27:12.101	2026-08-09 04:27:12.101
96	f27ddb02-7df2-42ae-88d8-d1590800062b	RW 04	-6.88680000	107.61860000	\N	2026-08-09 04:27:12.308	2026-08-09 04:27:12.308
97	f27ddb02-7df2-42ae-88d8-d1590800062b	RW 05	-6.88600000	107.61950000	\N	2026-08-09 04:27:12.515	2026-08-09 04:27:12.515
98	f27ddb02-7df2-42ae-88d8-d1590800062b	RW 06	-6.88520000	107.62040000	\N	2026-08-09 04:27:12.706	2026-08-09 04:27:12.706
99	f27ddb02-7df2-42ae-88d8-d1590800062b	RW 07	-6.88440000	107.62130000	\N	2026-08-09 04:27:12.882	2026-08-09 04:27:12.882
100	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 01	-6.88920000	107.61590000	\N	2026-08-09 04:27:13.05	2026-08-09 04:27:13.05
101	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 02	-6.88840000	107.61680000	\N	2026-08-09 04:27:13.224	2026-08-09 04:27:13.224
102	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 03	-6.88760000	107.61770000	\N	2026-08-09 04:27:13.421	2026-08-09 04:27:13.421
103	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 04	-6.88680000	107.61860000	\N	2026-08-09 04:27:13.608	2026-08-09 04:27:13.608
104	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 05	-6.88600000	107.61950000	\N	2026-08-09 04:27:13.817	2026-08-09 04:27:13.817
105	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 06	-6.88520000	107.62040000	\N	2026-08-09 04:27:14.007	2026-08-09 04:27:14.007
106	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 07	-6.88440000	107.62130000	\N	2026-08-09 04:27:14.199	2026-08-09 04:27:14.199
107	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 08	-6.88360000	107.62220000	\N	2026-08-09 04:27:14.387	2026-08-09 04:27:14.387
108	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 09	-6.88280000	107.62310000	\N	2026-08-09 04:27:14.554	2026-08-09 04:27:14.554
109	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 10	-6.88200000	107.62400000	\N	2026-08-09 04:27:14.74	2026-08-09 04:27:14.74
110	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 11	-6.88120000	107.62490000	\N	2026-08-09 04:27:14.918	2026-08-09 04:27:14.918
111	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 12	-6.88040000	107.62580000	\N	2026-08-09 04:27:15.102	2026-08-09 04:27:15.102
112	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 13	-6.87960000	107.62670000	\N	2026-08-09 04:27:15.292	2026-08-09 04:27:15.292
113	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 14	-6.87880000	107.62760000	\N	2026-08-09 04:27:15.466	2026-08-09 04:27:15.466
114	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 15	-6.87800000	107.62850000	\N	2026-08-09 04:27:15.662	2026-08-09 04:27:15.662
115	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 16	-6.87720000	107.62940000	\N	2026-08-09 04:27:15.846	2026-08-09 04:27:15.846
116	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 17	-6.87640000	107.63030000	\N	2026-08-09 04:27:16.024	2026-08-09 04:27:16.024
117	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 18	-6.87560000	107.63120000	\N	2026-08-09 04:27:16.202	2026-08-09 04:27:16.202
118	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 19	-6.87480000	107.63210000	\N	2026-08-09 04:27:16.389	2026-08-09 04:27:16.389
119	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 20	-6.87400000	107.63300000	\N	2026-08-09 04:27:16.573	2026-08-09 04:27:16.573
120	f2af23d1-27db-4e83-91e9-6ae4586c311d	RW 21	-6.87320000	107.63390000	\N	2026-08-09 04:27:16.756	2026-08-09 04:27:16.756
121	83d5f852-287b-492b-a260-87e50a76f1f2	RW 02	-6.88840000	107.61680000	\N	2026-08-09 04:27:17.105	2026-08-09 04:27:17.105
122	83d5f852-287b-492b-a260-87e50a76f1f2	RW 03	-6.88760000	107.61770000	\N	2026-08-09 04:27:17.298	2026-08-09 04:27:17.298
123	83d5f852-287b-492b-a260-87e50a76f1f2	RW 04	-6.88680000	107.61860000	\N	2026-08-09 04:27:17.472	2026-08-09 04:27:17.472
124	83d5f852-287b-492b-a260-87e50a76f1f2	RW 05	-6.88600000	107.61950000	\N	2026-08-09 04:27:17.68	2026-08-09 04:27:17.68
125	83d5f852-287b-492b-a260-87e50a76f1f2	RW 06	-6.88520000	107.62040000	\N	2026-08-09 04:27:17.902	2026-08-09 04:27:17.902
126	83d5f852-287b-492b-a260-87e50a76f1f2	RW 07	-6.88440000	107.62130000	\N	2026-08-09 04:27:18.09	2026-08-09 04:27:18.09
127	83d5f852-287b-492b-a260-87e50a76f1f2	RW 08	-6.88360000	107.62220000	\N	2026-08-09 04:27:18.281	2026-08-09 04:27:18.281
128	83d5f852-287b-492b-a260-87e50a76f1f2	RW 09	-6.88280000	107.62310000	\N	2026-08-09 04:27:18.46	2026-08-09 04:27:18.46
129	55251864-2d84-4452-a848-9b1c6b0e558a	RW 01	-6.87500790	107.61595210	\N	2026-08-10 07:16:33.968	2026-08-10 07:16:33.968
130	55251864-2d84-4452-a848-9b1c6b0e558a	RW 10	-6.86780790	107.62045210	\N	2026-08-10 07:16:34.76	2026-08-10 07:16:34.76
131	55251864-2d84-4452-a848-9b1c6b0e558a	RW 11	-6.86700790	107.62095210	\N	2026-08-10 07:16:34.851	2026-08-10 07:16:34.851
132	55251864-2d84-4452-a848-9b1c6b0e558a	RW 12	-6.86620790	107.62145210	\N	2026-08-10 07:16:34.94	2026-08-10 07:16:34.94
133	55251864-2d84-4452-a848-9b1c6b0e558a	RW 13	-6.86540790	107.62195210	\N	2026-08-10 07:16:35.043	2026-08-10 07:16:35.043
134	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 01	-6.89479070	107.61521050	\N	2026-08-10 07:16:35.133	2026-08-10 07:16:35.133
135	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 10	-6.88759070	107.61971050	\N	2026-08-10 07:16:36.054	2026-08-10 07:16:36.054
136	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 11	-6.88679070	107.62021050	\N	2026-08-10 07:16:36.151	2026-08-10 07:16:36.151
137	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 12	-6.88599070	107.62071050	\N	2026-08-10 07:16:36.256	2026-08-10 07:16:36.256
138	5bdfcb1a-3256-42d3-9065-ec9215f33ce0	RW 13	-6.88519070	107.62121050	\N	2026-08-10 07:16:36.355	2026-08-10 07:16:36.355
140	670632d6-a482-4aff-a128-a81f3821ce25	RW 10	-6.87928410	107.62494700	\N	2026-08-10 07:16:40.218	2026-08-10 07:16:40.218
141	670632d6-a482-4aff-a128-a81f3821ce25	RW 11	-6.87848410	107.62544700	\N	2026-08-10 07:16:40.321	2026-08-10 07:16:40.321
142	670632d6-a482-4aff-a128-a81f3821ce25	RW 12	-6.87768410	107.62594700	\N	2026-08-10 07:16:40.418	2026-08-10 07:16:40.418
143	670632d6-a482-4aff-a128-a81f3821ce25	RW 13	-6.87688410	107.62644700	\N	2026-08-10 07:16:40.534	2026-08-10 07:16:40.534
144	670632d6-a482-4aff-a128-a81f3821ce25	RW 14	-6.87608410	107.62694700	\N	2026-08-10 07:16:40.623	2026-08-10 07:16:40.623
145	670632d6-a482-4aff-a128-a81f3821ce25	RW 15	-6.87528410	107.62744700	\N	2026-08-10 07:16:40.709	2026-08-10 07:16:40.709
139	670632d6-a482-4aff-a128-a81f3821ce25	RW 01	-6.88648410	107.62044700	\N	2026-08-10 07:16:39.431	2026-08-10 07:16:39.431
146	670632d6-a482-4aff-a128-a81f3821ce25	RW 16	-6.87448410	107.62794700	\N	2026-08-10 07:16:40.798	2026-08-10 07:16:40.798
147	83d5f852-287b-492b-a260-87e50a76f1f2	RW 01	-6.88667190	107.60293640	\N	2026-08-10 07:16:40.893	2026-08-10 07:16:40.893
\.


--
-- Data for Name: setoran_manual; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.setoran_manual (id, petugas_residu_id, diinput_oleh, rw_id, foto_residu_url, berat, unit, lokasi_gps, kategori, created_at) FROM stdin;
8a65f6de-05fd-4379-a174-7fe1384a8582	ff942b12-ffa4-4def-8b31-59c1e7768d93	Petugas Residu RW 01 Dago	1	/uploads/1786302154669-6ce7dc9b-444f-4ed4-b56e-0570fdaa6823.jpg	20.00	Kg	\N	Residu Non-B3	2026-08-09 19:02:34.681
c3029c0b-7dc4-4b95-87d5-0e03f634ca5d	ff942b12-ffa4-4def-8b31-59c1e7768d93	Petugas Residu RW 01 Dago	1	/uploads/1786356050130-ac1efa7a-be17-4a33-9621-5ff5591c4833.jpg	20.00	Kg	-6.9677134, 107.65906	Residu B3	2026-08-10 10:00:50.155
\.


--
-- Data for Name: setoran_otomatis; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.setoran_otomatis (id, warga_id, foto_sampah_url, hasil_klasifikasi_ai, confidence_ai, berat, unit, poin, qr_tempat_sampah_id, lokasi_gps, created_at) FROM stdin;
00c0a379-7111-49b7-a788-4222df14b20f	3751704c-c631-4217-920a-ccda56bae879	https://picsum.photos/400/300	organik	0.99	0.69	Kg	102.00	db85f898-98fb-432b-89ab-4e75a2d667aa	\N	2026-08-09 19:13:47.021
8aa57d20-86a6-4416-8ee3-482c93082470	3751704c-c631-4217-920a-ccda56bae879	https://picsum.photos/400/300	organik	0.99	0.35	Kg	53.00	db85f898-98fb-432b-89ab-4e75a2d667aa	\N	2026-08-09 19:14:39.969
841a2028-1c05-4fba-9c34-9a359b369dfd	3751704c-c631-4217-920a-ccda56bae879	https://picsum.photos/400/300	organik	0.91	0.78	Kg	107.00	f5d26c6e-c047-4e16-9445-217b4cc1cd06	\N	2026-08-09 19:14:52.975
cbd0170f-38df-41e8-ad0e-c3148d3e9c6d	3751704c-c631-4217-920a-ccda56bae879	https://picsum.photos/400/300	organik	0.87	0.65	Kg	85.00	db85f898-98fb-432b-89ab-4e75a2d667aa	\N	2026-08-09 19:15:09.945
479bce9f-0615-44e3-9cb5-ca8e806368b4	3751704c-c631-4217-920a-ccda56bae879	https://picsum.photos/400/300	organik	0.92	0.60	Kg	83.00	db85f898-98fb-432b-89ab-4e75a2d667aa	\N	2026-08-09 19:15:26.559
c748d367-1d97-498d-8f23-b59fd6c93a77	3751704c-c631-4217-920a-ccda56bae879	https://picsum.photos/400/300	organik	0.99	0.80	Kg	119.00	db85f898-98fb-432b-89ab-4e75a2d667aa	\N	2026-08-09 19:15:34.904
ca51aed8-28b8-4753-8996-7f422a7c77d4	3751704c-c631-4217-920a-ccda56bae879	https://picsum.photos/400/300	organik	0.80	0.79	Kg	95.00	db85f898-98fb-432b-89ab-4e75a2d667aa	\N	2026-08-09 19:16:04.985
\.


--
-- Data for Name: tempat_sampah; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.tempat_sampah (id, kode_qr, id_kategori, maks_kapasitas_liter, volume_sekarang_liter, id_rw, id_kelurahan, dibuat_pada, diperbarui_pada, latitude, longitude, id_gelombang_qr, status, id_pengguna, bentuk, diameter, id_mahasiswa_pendaftar, lebar, panjang, tinggi, tipe_wadah) FROM stdin;
db85f898-98fb-432b-89ab-4e75a2d667aa	ANORG00012026	f860877f-2f07-4972-9aab-61255facbfe1	25.00	0.00	1	\N	2026-08-09 19:12:51.328	2026-08-09 19:33:34.797	-6.97403990	107.65167190	e8e27b9e-da06-4ec8-b6f7-c5e6c0b292b2	ACTIVE_BOUND	3751704c-c631-4217-920a-ccda56bae879	\N	\N	\N	\N	\N	\N	NON_ORGANIC
f5d26c6e-c047-4e16-9445-217b4cc1cd06	ORG00012026	f74f270b-cee0-42ab-9696-85c721774b19	25.00	3.92	1	\N	2026-08-09 19:12:55.381	2026-08-10 09:19:02.97	-6.97403990	107.65167190	67acd4d5-b1a4-4946-9dc5-1a1e3ec1e5b4	INACTIVE	3751704c-c631-4217-920a-ccda56bae879	\N	\N	\N	\N	\N	\N	ORGANIC
\.


--
-- Data for Name: token_penyegar; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.token_penyegar (id, id_pengguna, token, kedaluwarsa_pada, dibuat_pada) FROM stdin;
7fe821f8-bb82-44bb-8368-36d80b7b0373	cbc24ca2-1db8-4569-981e-445c081dc38b	13b5d859-ee1c-4880-b0ba-aa48e3b6a732	2026-08-17 08:58:04.818	2026-08-10 08:58:04.819
6bfe4df6-e423-41e1-baa8-f6c4c0a40ef5	cbc24ca2-1db8-4569-981e-445c081dc38b	8bca34ee-76ab-482e-97bd-d7c24c68a8e0	2026-08-16 07:52:16.219	2026-08-09 07:52:16.221
b100ceea-ce7a-4648-a75b-1bc95a10e1b7	cbc24ca2-1db8-4569-981e-445c081dc38b	8e3237a0-c2da-49f9-aa1c-5d0eeb319e05	2026-08-16 07:52:16.434	2026-08-09 07:52:16.435
7089c586-7ba7-41d6-aedd-fb018eebd7a7	bea1049d-e035-499b-9997-6f78e4218b0b	9bcb7872-aa6c-4e14-9f31-fe4d0e2bb804	2026-08-16 07:52:16.647	2026-08-09 07:52:16.648
fb356e2a-55ee-4bb6-a8b9-bdf88bbb1042	cbc24ca2-1db8-4569-981e-445c081dc38b	3b7f0c5e-0524-43bf-904e-40fcd63dde3b	2026-08-16 07:53:31.113	2026-08-09 07:53:31.114
f65844ac-a425-45b9-bc47-d1abaaf893b1	cbc24ca2-1db8-4569-981e-445c081dc38b	e28d487b-5992-4075-982c-bf6fbc141dd3	2026-08-16 07:53:31.323	2026-08-09 07:53:31.324
68c240b2-5e78-4390-b95f-6f961a9350de	bea1049d-e035-499b-9997-6f78e4218b0b	26088a90-0c56-49eb-b398-031e6ce03005	2026-08-16 07:53:31.544	2026-08-09 07:53:31.545
c68611dc-a25a-49c4-8967-e04d112b700c	14cadcdd-cf3d-4f40-8fd9-8c521418e8eb	dac57906-eedc-4df3-ba9e-29702c553b4a	2026-08-16 07:53:31.87	2026-08-09 07:53:31.871
0f91150b-e0f3-4d76-91c6-6c87d02cb634	cbc24ca2-1db8-4569-981e-445c081dc38b	47333ef4-6133-4033-91fe-8b8334d0d527	2026-08-16 07:53:49.27	2026-08-09 07:53:49.271
e2a9f1ad-035f-4878-9f4a-9a14ae039589	cbc24ca2-1db8-4569-981e-445c081dc38b	9ce880f1-4f06-4ed9-adb9-69bb841625a1	2026-08-16 07:53:49.475	2026-08-09 07:53:49.476
331a9063-5a84-4beb-9c6c-f4d6df3aaabd	bea1049d-e035-499b-9997-6f78e4218b0b	c6f79896-95f7-4237-8241-bd8a23c660b1	2026-08-16 07:53:49.674	2026-08-09 07:53:49.675
c453a2cc-ae5d-4d5a-9bba-c8c8bc420e9f	cbc24ca2-1db8-4569-981e-445c081dc38b	a58eb6de-4a9c-4c70-8aaa-9c10e6fdaf15	2026-08-16 07:53:59.653	2026-08-09 07:53:59.656
836f193f-b4c0-4440-abdb-6e2a3411301d	cbc24ca2-1db8-4569-981e-445c081dc38b	d5aab96f-4cd9-4586-863a-b9599a00a5bd	2026-08-16 07:53:59.875	2026-08-09 07:53:59.876
63e89330-6f18-4be3-bfd1-67476e962f4d	bea1049d-e035-499b-9997-6f78e4218b0b	4eb0f9e5-f5e2-47b8-8d77-5eebcb0139d1	2026-08-16 07:54:00.08	2026-08-09 07:54:00.081
488eb4f9-cd12-4a1b-9a26-c404af349056	f41f255f-aae5-460f-acbb-a058b64c16bb	7e53d2db-8a64-4317-ae73-66574282b1bb	2026-08-16 07:54:00.317	2026-08-09 07:54:00.318
eb9cdb38-d685-413a-a4cf-8a6c17b20e76	cbc24ca2-1db8-4569-981e-445c081dc38b	ee7bef38-648a-47f3-af64-fed3430b27eb	2026-08-16 07:54:09.469	2026-08-09 07:54:09.471
96c403aa-2491-4408-9ecc-95022e460662	cbc24ca2-1db8-4569-981e-445c081dc38b	fe8fb49a-0c28-42d5-bff8-5c2c268105db	2026-08-16 07:54:09.68	2026-08-09 07:54:09.681
920c8c11-ee9f-4315-9eff-d93518cbc851	bea1049d-e035-499b-9997-6f78e4218b0b	a29028d6-7dbe-4e92-9681-ae0591e3b7d8	2026-08-16 07:54:09.883	2026-08-09 07:54:09.884
2d7c24fb-3506-4a84-a93e-90ab0df4f49d	ae0bb2ae-3d98-4a32-b284-750ea2394da8	1c0cb659-9118-48a3-aabd-b84fd3f0bdef	2026-08-16 07:54:10.137	2026-08-09 07:54:10.138
13277b7a-9693-407a-983e-032dd33b0b1b	cbc24ca2-1db8-4569-981e-445c081dc38b	71c80e45-de69-4537-8a0c-8cccf5082acb	2026-08-16 07:54:28.195	2026-08-09 07:54:28.196
5648cd84-a21a-4ba2-a530-8c708a7e419a	cbc24ca2-1db8-4569-981e-445c081dc38b	a16a7e10-773c-491a-80b7-e9e87acab877	2026-08-16 07:54:29.489	2026-08-09 07:54:29.49
57fba8cb-a8a3-4da8-9f9c-6d3d3d5d0b0c	bea1049d-e035-499b-9997-6f78e4218b0b	eae2df22-c696-49ea-8385-0b04f3709f15	2026-08-16 07:54:29.693	2026-08-09 07:54:29.694
849bdefd-a30a-4f08-a0ac-e75302b2940a	cbc24ca2-1db8-4569-981e-445c081dc38b	d551b86b-4a85-425a-beca-69e84bf41e61	2026-08-16 08:56:13.81	2026-08-09 08:56:13.811
43a6062a-de8a-4ffa-9110-b6b74d28bb93	67578020-47be-4b83-a822-7d6cc714b3d2	d5cc0b7b-615f-4d7f-a26d-3c58ebf998ea	2026-08-16 09:15:58.241	2026-08-09 09:15:58.249
259e0030-b095-4d0d-b489-6926bcc22188	67578020-47be-4b83-a822-7d6cc714b3d2	984e82e3-139a-47ec-bfd6-87b23aaa04bf	2026-08-16 09:19:34.367	2026-08-09 09:19:34.369
4336eb04-ccee-4302-9bcf-69974b156c9e	cbc24ca2-1db8-4569-981e-445c081dc38b	61bc1cbf-be44-4f64-ad85-50c74790a308	2026-08-16 09:21:54.778	2026-08-09 09:21:54.779
2c724ec6-62ac-4582-b9dc-5e6cabe91504	cbc24ca2-1db8-4569-981e-445c081dc38b	17b448c9-4174-4615-82d7-114272da3251	2026-08-16 09:38:37.67	2026-08-09 09:38:37.672
a17d18ab-6833-4d30-88a1-c6956e4ebf65	cbc24ca2-1db8-4569-981e-445c081dc38b	e6ff6336-bbc2-42d4-abbb-d504635229e5	2026-08-16 09:44:29.916	2026-08-09 09:44:29.917
07e9010d-cc0b-4150-91c1-c35472e37c2a	cbc24ca2-1db8-4569-981e-445c081dc38b	83a74f54-8d1b-4884-ab1c-dde0a7ae6af6	2026-08-16 11:07:34.062	2026-08-09 11:07:34.063
e231fdb3-abca-4afe-bea3-5b991642084d	cbc24ca2-1db8-4569-981e-445c081dc38b	e3df4d57-e079-46cc-b3d2-1665072e749d	2026-08-16 11:29:29.648	2026-08-09 11:29:29.649
9696a6ad-666d-4cb7-aab7-37e76c91176e	cbc24ca2-1db8-4569-981e-445c081dc38b	58e8a5d4-8489-4187-8313-8aa364cf5336	2026-08-16 11:46:15.078	2026-08-09 11:46:15.079
f84fd30e-e04b-4e3c-9e1c-3ff492d2e73f	eb4e5567-55d1-4a1a-af74-c2163a6047cd	bdee7037-e524-4019-9259-8b84be8c525a	2026-08-16 13:05:44.068	2026-08-09 13:05:44.07
c985b036-b6a8-4e79-b305-eff998c15e01	cbc24ca2-1db8-4569-981e-445c081dc38b	0ea050ec-c59a-4e3a-aace-19508774a03a	2026-08-16 18:49:13.144	2026-08-09 18:49:13.145
5cb28177-9d36-46a4-8a0b-f6a095643201	cbc24ca2-1db8-4569-981e-445c081dc38b	e5f50ab3-a6d6-4ffa-b1af-958cc555df22	2026-08-16 19:32:00.404	2026-08-09 19:32:00.405
4a386cb5-4941-4e21-8170-ea58d77afe6a	d9d2a059-8f73-42e7-9c63-b6724be70efa	1ad3cce7-3815-42f2-a966-be18100c0791	2026-08-16 19:43:15.538	2026-08-09 19:43:15.539
6b1d7987-af0b-47f0-8d90-4e180ac748b1	4fb2fc1f-ffb3-4b33-a0b6-403f454a2f89	7e9ad48a-e1be-4a88-aed3-e5f1e3870d7f	2026-08-17 02:40:19.978	2026-08-10 02:40:19.979
b72d44b2-b63f-420f-9857-422ed04c19a3	83bf2c8c-0982-4a51-9044-4abebb0abc61	574e22aa-688b-4765-ba81-3cbae37b1772	2026-08-17 02:46:24.804	2026-08-10 02:46:24.805
dd9c1b1d-e75f-4e6f-8a39-ba79fb19f3eb	9f913157-8e6c-4cde-bce7-54a3c5cddf8e	5f34ed47-94a5-49ad-ae39-24de83ecaa61	2026-08-17 02:53:26.633	2026-08-10 02:53:26.635
5b03888b-6dba-401d-9382-d4d8aa1f2a79	cbc24ca2-1db8-4569-981e-445c081dc38b	85d13dd1-69ba-482d-8ea4-2f8ae6153272	2026-08-17 03:35:49.622	2026-08-10 03:35:49.623
ae7ef150-2c9c-4e2e-85f4-da13d0cc296a	eb4e5567-55d1-4a1a-af74-c2163a6047cd	2db8fd6f-c6d2-4a4d-af8c-cc2c1bf6fd6e	2026-08-17 03:41:55.117	2026-08-10 03:41:55.12
5e24618d-a6e0-4fb6-b77c-4e072dfb0d88	cbc24ca2-1db8-4569-981e-445c081dc38b	53546914-9b58-44b8-a14e-0578e1c38b61	2026-08-17 03:50:00.862	2026-08-10 03:50:00.863
35701e2d-011c-42f8-b0e1-9fcc74b3ebde	cbc24ca2-1db8-4569-981e-445c081dc38b	b0dd79de-90de-4adf-a2f3-39d423bd529c	2026-08-17 09:06:55.512	2026-08-10 09:06:55.514
72251f87-23f4-4cb1-9e10-73231c03bcce	cbc24ca2-1db8-4569-981e-445c081dc38b	58ed1409-2a8d-4bcf-9c95-c509e6259a05	2026-08-17 09:16:20.044	2026-08-10 09:16:20.045
c3a827c1-24a1-4fb5-86a5-f4ade8d12670	eb4e5567-55d1-4a1a-af74-c2163a6047cd	b7c5983b-3912-42fb-b070-1fba053fc8a6	2026-08-17 04:46:36.937	2026-08-10 04:46:36.938
e35f9f61-7702-41de-9b00-0a40efac4460	eb4e5567-55d1-4a1a-af74-c2163a6047cd	b1bb161f-01ce-40a9-a2c6-bfdb381a7de3	2026-08-17 06:07:24.216	2026-08-10 06:07:24.217
a68efb76-0e1f-418b-ac88-bfcc346e4acd	9f913157-8e6c-4cde-bce7-54a3c5cddf8e	1e8bf1c7-5475-4b9e-9f24-82eaa23d39dc	2026-08-17 06:22:42.505	2026-08-10 06:22:42.509
28ce13f9-0df4-4187-a841-7f2718206602	3f5159f0-c5df-4797-9229-9b9160d0b747	0b735a77-57a8-4bc2-b4f6-01464f7b102b	2026-08-17 09:25:00.735	2026-08-10 09:25:00.737
7339c6b7-711d-44cd-b5fc-ed9b73b82d7b	cbc24ca2-1db8-4569-981e-445c081dc38b	07b2fb1e-a54b-4f83-aedf-68e0c7c6bde9	2026-08-17 09:42:16.518	2026-08-10 09:42:16.519
fc310df7-60b1-496c-bbd3-8a4db2e63af3	cbc24ca2-1db8-4569-981e-445c081dc38b	3165baa6-60da-454f-8f7a-ed7e0a914135	2026-08-17 06:39:16.827	2026-08-10 06:39:16.828
7f34356a-e9cc-4e2e-9702-1f5c4b3b61b7	cbc24ca2-1db8-4569-981e-445c081dc38b	77e1c532-72a1-4dd4-a775-106bbb359bfd	2026-08-17 06:39:21.658	2026-08-10 06:39:21.659
c3b9639c-5dc9-4980-a3ec-3a3d5cbdc95f	cbc24ca2-1db8-4569-981e-445c081dc38b	f4cc55e5-a9e4-4711-8fef-6b0a081eddde	2026-08-17 06:40:28.956	2026-08-10 06:40:28.957
ec5996b5-b04c-485c-9bdc-ff4b1766acb7	cbc24ca2-1db8-4569-981e-445c081dc38b	69b80335-9c6c-49f3-bb4f-4275701b8159	2026-08-17 06:42:14.702	2026-08-10 06:42:14.703
58b6779c-7fcc-47f6-9267-77487f877cad	56570bef-240e-4dc9-a36b-b92c02bf36ec	42f1cbcb-bb46-466b-b520-90a02b029c65	2026-08-17 09:48:13.338	2026-08-10 09:48:13.339
42647655-5ec4-4be4-8744-e52c320e6e3f	cbc24ca2-1db8-4569-981e-445c081dc38b	a1777159-b638-4f92-8f34-402d7aa52747	2026-08-17 10:12:11.956	2026-08-10 10:12:11.957
c7236e42-7dd5-483d-b5c9-549a24fa5c9c	ab8becb4-a663-49f8-b413-a4e06c724346	3952d92c-7294-492f-81fe-25a12107d0ac	2026-08-17 07:58:24.415	2026-08-10 07:58:24.416
ff7014e7-2850-4fc9-9b15-77e1b5504082	cbc24ca2-1db8-4569-981e-445c081dc38b	198e407b-e90a-4c71-bf2c-960cf73cd908	2026-08-17 10:59:42.64	2026-08-10 10:59:42.642
9fa6c394-db58-4654-bf2c-e2290d1ad584	617d7ae7-9cc9-4fd1-a810-cd0ab65d02d1	c289181e-7efa-4c03-b545-9473e8a9b5da	2026-08-17 08:44:30.397	2026-08-10 08:44:30.399
8a38b85e-ddfe-443a-9cb0-d873008236a4	cbc24ca2-1db8-4569-981e-445c081dc38b	d589bb26-7432-459b-9983-776e142dd9ba	2026-08-17 11:51:15.136	2026-08-10 11:51:15.138
9a24608f-119e-4bee-a7bd-6f6fee5d69c8	c1255723-50b9-4f51-8b46-b87302893aa4	75f1ea4f-151f-46bc-9954-0b6aa208b18f	2026-08-17 12:08:04.912	2026-08-10 12:08:04.914
a42fa5a0-6fad-4706-8594-1ce5d0af74ff	cbc24ca2-1db8-4569-981e-445c081dc38b	b412bb95-df54-4353-bd76-fef502167865	2026-08-17 12:22:40.534	2026-08-10 12:22:40.535
fa4570c8-83dc-4645-9761-754f594226f0	cbc24ca2-1db8-4569-981e-445c081dc38b	60dd531e-6631-4566-93eb-d45e83af3cb3	2026-08-17 12:58:13.496	2026-08-10 12:58:13.497
37095a2b-4e22-4b5b-a33b-a3f7f1fdb61b	cbc24ca2-1db8-4569-981e-445c081dc38b	5980adca-e708-49fc-9ae7-7c696cbfacd3	2026-08-17 13:32:09.302	2026-08-10 13:32:09.304
17d20813-0dbe-449c-b6a4-7c5466a71ac6	cbc24ca2-1db8-4569-981e-445c081dc38b	a127188c-2671-45e6-aef7-4118c76daee6	2026-08-17 13:34:44.22	2026-08-10 13:34:44.221
9f6e48d8-f4d7-4fb7-9ea8-252deafd5043	cbc24ca2-1db8-4569-981e-445c081dc38b	1910ee53-6ceb-43b3-ad34-754d8aae088a	2026-08-17 14:00:25.104	2026-08-10 14:00:25.105
1f46dee6-c602-4993-8d5b-1de9cf5f70f2	cbc24ca2-1db8-4569-981e-445c081dc38b	1571cc51-9676-4c18-a86d-6a535ce64157	2026-08-17 14:01:00.581	2026-08-10 14:01:00.583
4c88cdc6-9261-4db3-a997-b25135f941a0	cbc24ca2-1db8-4569-981e-445c081dc38b	67464af7-3b4a-4565-841a-452269d8a11f	2026-08-17 14:11:52.844	2026-08-10 14:11:52.846
8fb3bcd8-1e74-49a2-80ed-c4b9427a10b5	cbc24ca2-1db8-4569-981e-445c081dc38b	3864d209-2035-488e-8de3-abffce18ff42	2026-08-17 14:21:09.133	2026-08-10 14:21:09.134
\.


--
-- Data for Name: tugas_penjemputan; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.tugas_penjemputan (id, id_tempat_sampah, status, id_pengguna_mengklaim, dibuat_pada, diperbarui_pada) FROM stdin;
\.


--
-- Name: hak_akses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: psc_user
--

SELECT pg_catalog.setval('public.hak_akses_id_seq', 280, true);


--
-- Name: kabupaten_id_seq; Type: SEQUENCE SET; Schema: public; Owner: psc_user
--

SELECT pg_catalog.setval('public.kabupaten_id_seq', 1, true);


--
-- Name: kecamatan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: psc_user
--

SELECT pg_catalog.setval('public.kecamatan_id_seq', 6, true);


--
-- Name: peran_id_seq; Type: SEQUENCE SET; Schema: public; Owner: psc_user
--

SELECT pg_catalog.setval('public.peran_id_seq', 12, true);


--
-- Name: provinsi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: psc_user
--

SELECT pg_catalog.setval('public.provinsi_id_seq', 1, true);


--
-- Name: rt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: psc_user
--

SELECT pg_catalog.setval('public.rt_id_seq', 645, true);


--
-- Name: rw_id_seq; Type: SEQUENCE SET; Schema: public; Owner: psc_user
--

SELECT pg_catalog.setval('public.rw_id_seq', 200, true);


--
-- Name: aksi_drop_sampah aksi_drop_sampah_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.aksi_drop_sampah
    ADD CONSTRAINT aksi_drop_sampah_pkey PRIMARY KEY (id);


--
-- Name: buku_kas_bank_sampah buku_kas_bank_sampah_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.buku_kas_bank_sampah
    ADD CONSTRAINT buku_kas_bank_sampah_pkey PRIMARY KEY (id);


--
-- Name: catatan_distribusi_maggot catatan_distribusi_maggot_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.catatan_distribusi_maggot
    ADD CONSTRAINT catatan_distribusi_maggot_pkey PRIMARY KEY (id);


--
-- Name: catatan_notifikasi catatan_notifikasi_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.catatan_notifikasi
    ADD CONSTRAINT catatan_notifikasi_pkey PRIMARY KEY (id);


--
-- Name: catatan_permintaan_ai catatan_permintaan_ai_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.catatan_permintaan_ai
    ADD CONSTRAINT catatan_permintaan_ai_pkey PRIMARY KEY (id);


--
-- Name: catatan_produksi_fasilitas catatan_produksi_fasilitas_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.catatan_produksi_fasilitas
    ADD CONSTRAINT catatan_produksi_fasilitas_pkey PRIMARY KEY (id);


--
-- Name: fasilitas fasilitas_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.fasilitas
    ADD CONSTRAINT fasilitas_pkey PRIMARY KEY (id);


--
-- Name: gelombang_qr gelombang_qr_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.gelombang_qr
    ADD CONSTRAINT gelombang_qr_pkey PRIMARY KEY (id);


--
-- Name: hak_akses hak_akses_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.hak_akses
    ADD CONSTRAINT hak_akses_pkey PRIMARY KEY (id);


--
-- Name: ide_daur_ulang ide_daur_ulang_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.ide_daur_ulang
    ADD CONSTRAINT ide_daur_ulang_pkey PRIMARY KEY (id);


--
-- Name: jadwal jadwal_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.jadwal
    ADD CONSTRAINT jadwal_pkey PRIMARY KEY (id);


--
-- Name: jejak_audit jejak_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.jejak_audit
    ADD CONSTRAINT jejak_audit_pkey PRIMARY KEY (id);


--
-- Name: kabar_sosial kabar_sosial_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kabar_sosial
    ADD CONSTRAINT kabar_sosial_pkey PRIMARY KEY (id);


--
-- Name: kabupaten kabupaten_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kabupaten
    ADD CONSTRAINT kabupaten_pkey PRIMARY KEY (id);


--
-- Name: kategori_sampah kategori_sampah_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kategori_sampah
    ADD CONSTRAINT kategori_sampah_pkey PRIMARY KEY (id);


--
-- Name: kecamatan kecamatan_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kecamatan
    ADD CONSTRAINT kecamatan_pkey PRIMARY KEY (id);


--
-- Name: kehadiran_kegiatan kehadiran_kegiatan_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kehadiran_kegiatan
    ADD CONSTRAINT kehadiran_kegiatan_pkey PRIMARY KEY (id);


--
-- Name: kelompok_kkn kelompok_kkn_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kelompok_kkn
    ADD CONSTRAINT kelompok_kkn_pkey PRIMARY KEY (id);


--
-- Name: kelurahan kelurahan_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kelurahan
    ADD CONSTRAINT kelurahan_pkey PRIMARY KEY (id);


--
-- Name: kepemilikan_tempat_sampah kepemilikan_tempat_sampah_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kepemilikan_tempat_sampah
    ADD CONSTRAINT kepemilikan_tempat_sampah_pkey PRIMARY KEY (id);


--
-- Name: kode_otp kode_otp_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kode_otp
    ADD CONSTRAINT kode_otp_pkey PRIMARY KEY (id);


--
-- Name: konfigurasi_sistem konfigurasi_sistem_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.konfigurasi_sistem
    ADD CONSTRAINT konfigurasi_sistem_pkey PRIMARY KEY (key);


--
-- Name: lokasi_mahasiswa lokasi_mahasiswa_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.lokasi_mahasiswa
    ADD CONSTRAINT lokasi_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: mahasiswa_kkn mahasiswa_kkn_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.mahasiswa_kkn
    ADD CONSTRAINT mahasiswa_kkn_pkey PRIMARY KEY (id);


--
-- Name: notifikasi notifikasi_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.notifikasi
    ADD CONSTRAINT notifikasi_pkey PRIMARY KEY (id);


--
-- Name: pelanggaran pelanggaran_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pelanggaran
    ADD CONSTRAINT pelanggaran_pkey PRIMARY KEY (id);


--
-- Name: pemanfaatan_sampah pemanfaatan_sampah_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pemanfaatan_sampah
    ADD CONSTRAINT pemanfaatan_sampah_pkey PRIMARY KEY (id);


--
-- Name: pengajuan_aktivasi_tempat_sampah pengajuan_aktivasi_tempat_sampah_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pengajuan_aktivasi_tempat_sampah
    ADD CONSTRAINT pengajuan_aktivasi_tempat_sampah_pkey PRIMARY KEY (id);


--
-- Name: pengajuan_izin_mahasiswa pengajuan_izin_mahasiswa_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pengajuan_izin_mahasiswa
    ADD CONSTRAINT pengajuan_izin_mahasiswa_pkey PRIMARY KEY (id);


--
-- Name: pengguna pengguna_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pengguna
    ADD CONSTRAINT pengguna_pkey PRIMARY KEY (id);


--
-- Name: peran peran_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.peran
    ADD CONSTRAINT peran_pkey PRIMARY KEY (id);


--
-- Name: peternakan peternakan_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.peternakan
    ADD CONSTRAINT peternakan_pkey PRIMARY KEY (id);


--
-- Name: petugas_residu petugas_residu_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.petugas_residu
    ADD CONSTRAINT petugas_residu_pkey PRIMARY KEY (id);


--
-- Name: provinsi provinsi_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.provinsi
    ADD CONSTRAINT provinsi_pkey PRIMARY KEY (id);


--
-- Name: riwayat_poin riwayat_poin_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.riwayat_poin
    ADD CONSTRAINT riwayat_poin_pkey PRIMARY KEY (id);


--
-- Name: riwayat_serah_terima_kkn riwayat_serah_terima_kkn_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.riwayat_serah_terima_kkn
    ADD CONSTRAINT riwayat_serah_terima_kkn_pkey PRIMARY KEY (id);


--
-- Name: rt rt_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.rt
    ADD CONSTRAINT rt_pkey PRIMARY KEY (id);


--
-- Name: rumah_tangga rumah_tangga_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.rumah_tangga
    ADD CONSTRAINT rumah_tangga_pkey PRIMARY KEY (id);


--
-- Name: rw rw_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.rw
    ADD CONSTRAINT rw_pkey PRIMARY KEY (id);


--
-- Name: setoran_manual setoran_manual_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.setoran_manual
    ADD CONSTRAINT setoran_manual_pkey PRIMARY KEY (id);


--
-- Name: setoran_otomatis setoran_otomatis_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.setoran_otomatis
    ADD CONSTRAINT setoran_otomatis_pkey PRIMARY KEY (id);


--
-- Name: tempat_sampah tempat_sampah_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tempat_sampah
    ADD CONSTRAINT tempat_sampah_pkey PRIMARY KEY (id);


--
-- Name: token_penyegar token_penyegar_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.token_penyegar
    ADD CONSTRAINT token_penyegar_pkey PRIMARY KEY (id);


--
-- Name: tugas_penjemputan tugas_penjemputan_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tugas_penjemputan
    ADD CONSTRAINT tugas_penjemputan_pkey PRIMARY KEY (id);


--
-- Name: buku_kas_bank_sampah_id_pengguna_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX buku_kas_bank_sampah_id_pengguna_key ON public.buku_kas_bank_sampah USING btree (id_pengguna);


--
-- Name: catatan_permintaan_ai_id_permintaan_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX catatan_permintaan_ai_id_permintaan_key ON public.catatan_permintaan_ai USING btree (id_permintaan);


--
-- Name: gelombang_qr_kode_gelombang_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX gelombang_qr_kode_gelombang_key ON public.gelombang_qr USING btree (kode_gelombang);


--
-- Name: hak_akses_id_peran_resource_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX hak_akses_id_peran_resource_key ON public.hak_akses USING btree (id_peran, resource);


--
-- Name: kabupaten_id_provinsi_nama_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX kabupaten_id_provinsi_nama_key ON public.kabupaten USING btree (id_provinsi, nama);


--
-- Name: kategori_sampah_nama_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX kategori_sampah_nama_key ON public.kategori_sampah USING btree (nama);


--
-- Name: kecamatan_id_kabupaten_nama_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX kecamatan_id_kabupaten_nama_key ON public.kecamatan USING btree (id_kabupaten, nama);


--
-- Name: kehadiran_kegiatan_id_mahasiswa_id_jadwal_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX kehadiran_kegiatan_id_mahasiswa_id_jadwal_key ON public.kehadiran_kegiatan USING btree (id_mahasiswa, id_jadwal);


--
-- Name: kelompok_kkn_nama_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX kelompok_kkn_nama_key ON public.kelompok_kkn USING btree (nama);


--
-- Name: kelurahan_nama_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX kelurahan_nama_key ON public.kelurahan USING btree (nama);


--
-- Name: kepemilikan_tempat_sampah_id_tempat_sampah_id_pengguna_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX kepemilikan_tempat_sampah_id_tempat_sampah_id_pengguna_key ON public.kepemilikan_tempat_sampah USING btree (id_tempat_sampah, id_pengguna);


--
-- Name: lokasi_mahasiswa_direkam_pada_idx; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE INDEX lokasi_mahasiswa_direkam_pada_idx ON public.lokasi_mahasiswa USING btree (direkam_pada);


--
-- Name: mahasiswa_kkn_id_pengguna_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX mahasiswa_kkn_id_pengguna_key ON public.mahasiswa_kkn USING btree (id_pengguna);


--
-- Name: mahasiswa_kkn_nim_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX mahasiswa_kkn_nim_key ON public.mahasiswa_kkn USING btree (nim);


--
-- Name: pemanfaatan_sampah_nomor_cara_pemanfaatan_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX pemanfaatan_sampah_nomor_cara_pemanfaatan_key ON public.pemanfaatan_sampah USING btree (nomor_cara_pemanfaatan);


--
-- Name: pengguna_no_telepon_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX pengguna_no_telepon_key ON public.pengguna USING btree (no_telepon);


--
-- Name: peran_nama_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX peran_nama_key ON public.peran USING btree (nama);


--
-- Name: petugas_residu_id_pengguna_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX petugas_residu_id_pengguna_key ON public.petugas_residu USING btree (id_pengguna);


--
-- Name: provinsi_nama_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX provinsi_nama_key ON public.provinsi USING btree (nama);


--
-- Name: rt_id_rw_nama_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX rt_id_rw_nama_key ON public.rt USING btree (id_rw, nama);


--
-- Name: rw_id_kelurahan_nama_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX rw_id_kelurahan_nama_key ON public.rw USING btree (id_kelurahan, nama);


--
-- Name: rw_id_petugas_residu_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX rw_id_petugas_residu_key ON public.rw USING btree (id_petugas_residu);


--
-- Name: tempat_sampah_kode_qr_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX tempat_sampah_kode_qr_key ON public.tempat_sampah USING btree (kode_qr);


--
-- Name: token_penyegar_token_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX token_penyegar_token_key ON public.token_penyegar USING btree (token);


--
-- Name: buku_kas_bank_sampah buku_kas_bank_sampah_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.buku_kas_bank_sampah
    ADD CONSTRAINT buku_kas_bank_sampah_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: catatan_distribusi_maggot catatan_distribusi_maggot_id_peternakan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.catatan_distribusi_maggot
    ADD CONSTRAINT catatan_distribusi_maggot_id_peternakan_fkey FOREIGN KEY (id_peternakan) REFERENCES public.peternakan(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: catatan_permintaan_ai catatan_permintaan_ai_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.catatan_permintaan_ai
    ADD CONSTRAINT catatan_permintaan_ai_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: catatan_produksi_fasilitas catatan_produksi_fasilitas_id_fasilitas_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.catatan_produksi_fasilitas
    ADD CONSTRAINT catatan_produksi_fasilitas_id_fasilitas_fkey FOREIGN KEY (id_fasilitas) REFERENCES public.fasilitas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fasilitas fasilitas_id_rw_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.fasilitas
    ADD CONSTRAINT fasilitas_id_rw_fkey FOREIGN KEY (id_rw) REFERENCES public.rw(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: gelombang_qr gelombang_qr_id_pengguna_pic_ditugaskan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.gelombang_qr
    ADD CONSTRAINT gelombang_qr_id_pengguna_pic_ditugaskan_fkey FOREIGN KEY (id_pengguna_pic_ditugaskan) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: hak_akses hak_akses_id_peran_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.hak_akses
    ADD CONSTRAINT hak_akses_id_peran_fkey FOREIGN KEY (id_peran) REFERENCES public.peran(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ide_daur_ulang ide_daur_ulang_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.ide_daur_ulang
    ADD CONSTRAINT ide_daur_ulang_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jadwal jadwal_id_kelompok_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.jadwal
    ADD CONSTRAINT jadwal_id_kelompok_fkey FOREIGN KEY (id_kelompok) REFERENCES public.kelompok_kkn(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jejak_audit jejak_audit_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.jejak_audit
    ADD CONSTRAINT jejak_audit_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: kabupaten kabupaten_id_provinsi_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kabupaten
    ADD CONSTRAINT kabupaten_id_provinsi_fkey FOREIGN KEY (id_provinsi) REFERENCES public.provinsi(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kecamatan kecamatan_id_kabupaten_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kecamatan
    ADD CONSTRAINT kecamatan_id_kabupaten_fkey FOREIGN KEY (id_kabupaten) REFERENCES public.kabupaten(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kehadiran_kegiatan kehadiran_kegiatan_id_jadwal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kehadiran_kegiatan
    ADD CONSTRAINT kehadiran_kegiatan_id_jadwal_fkey FOREIGN KEY (id_jadwal) REFERENCES public.jadwal(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kehadiran_kegiatan kehadiran_kegiatan_id_mahasiswa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kehadiran_kegiatan
    ADD CONSTRAINT kehadiran_kegiatan_id_mahasiswa_fkey FOREIGN KEY (id_mahasiswa) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kelompok_kkn kelompok_kkn_id_dpl_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kelompok_kkn
    ADD CONSTRAINT kelompok_kkn_id_dpl_fkey FOREIGN KEY (id_dpl) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: kelurahan kelurahan_id_kecamatan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kelurahan
    ADD CONSTRAINT kelurahan_id_kecamatan_fkey FOREIGN KEY (id_kecamatan) REFERENCES public.kecamatan(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: kepemilikan_tempat_sampah kepemilikan_tempat_sampah_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kepemilikan_tempat_sampah
    ADD CONSTRAINT kepemilikan_tempat_sampah_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kepemilikan_tempat_sampah kepemilikan_tempat_sampah_id_tempat_sampah_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kepemilikan_tempat_sampah
    ADD CONSTRAINT kepemilikan_tempat_sampah_id_tempat_sampah_fkey FOREIGN KEY (id_tempat_sampah) REFERENCES public.tempat_sampah(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lokasi_mahasiswa lokasi_mahasiswa_id_mahasiswa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.lokasi_mahasiswa
    ADD CONSTRAINT lokasi_mahasiswa_id_mahasiswa_fkey FOREIGN KEY (id_mahasiswa) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mahasiswa_kkn mahasiswa_kkn_id_kelompok_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.mahasiswa_kkn
    ADD CONSTRAINT mahasiswa_kkn_id_kelompok_fkey FOREIGN KEY (id_kelompok) REFERENCES public.kelompok_kkn(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: mahasiswa_kkn mahasiswa_kkn_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.mahasiswa_kkn
    ADD CONSTRAINT mahasiswa_kkn_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mahasiswa_kkn mahasiswa_kkn_id_rw_ditugaskan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.mahasiswa_kkn
    ADD CONSTRAINT mahasiswa_kkn_id_rw_ditugaskan_fkey FOREIGN KEY (id_rw_ditugaskan) REFERENCES public.rw(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifikasi notifikasi_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.notifikasi
    ADD CONSTRAINT notifikasi_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pelanggaran pelanggaran_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pelanggaran
    ADD CONSTRAINT pelanggaran_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pelanggaran pelanggaran_id_pengguna_petugas_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pelanggaran
    ADD CONSTRAINT pelanggaran_id_pengguna_petugas_fkey FOREIGN KEY (id_pengguna_petugas) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pelanggaran pelanggaran_id_tempat_sampah_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pelanggaran
    ADD CONSTRAINT pelanggaran_id_tempat_sampah_fkey FOREIGN KEY (id_tempat_sampah) REFERENCES public.tempat_sampah(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pemanfaatan_sampah pemanfaatan_sampah_id_rw_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pemanfaatan_sampah
    ADD CONSTRAINT pemanfaatan_sampah_id_rw_fkey FOREIGN KEY (id_rw) REFERENCES public.rw(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pengajuan_aktivasi_tempat_sampah pengajuan_aktivasi_tempat_sampah_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pengajuan_aktivasi_tempat_sampah
    ADD CONSTRAINT pengajuan_aktivasi_tempat_sampah_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pengajuan_aktivasi_tempat_sampah pengajuan_aktivasi_tempat_sampah_id_pereview_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pengajuan_aktivasi_tempat_sampah
    ADD CONSTRAINT pengajuan_aktivasi_tempat_sampah_id_pereview_fkey FOREIGN KEY (id_pereview) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pengajuan_aktivasi_tempat_sampah pengajuan_aktivasi_tempat_sampah_id_tempat_sampah_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pengajuan_aktivasi_tempat_sampah
    ADD CONSTRAINT pengajuan_aktivasi_tempat_sampah_id_tempat_sampah_fkey FOREIGN KEY (id_tempat_sampah) REFERENCES public.tempat_sampah(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pengajuan_izin_mahasiswa pengajuan_izin_mahasiswa_id_mahasiswa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pengajuan_izin_mahasiswa
    ADD CONSTRAINT pengajuan_izin_mahasiswa_id_mahasiswa_fkey FOREIGN KEY (id_mahasiswa) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pengajuan_izin_mahasiswa pengajuan_izin_mahasiswa_id_pereview_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pengajuan_izin_mahasiswa
    ADD CONSTRAINT pengajuan_izin_mahasiswa_id_pereview_fkey FOREIGN KEY (id_pereview) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pengguna pengguna_id_peran_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pengguna
    ADD CONSTRAINT pengguna_id_peran_fkey FOREIGN KEY (id_peran) REFERENCES public.peran(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pengguna pengguna_id_rt_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pengguna
    ADD CONSTRAINT pengguna_id_rt_fkey FOREIGN KEY (id_rt) REFERENCES public.rt(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pengguna pengguna_id_rw_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pengguna
    ADD CONSTRAINT pengguna_id_rw_fkey FOREIGN KEY (id_rw) REFERENCES public.rw(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: petugas_residu petugas_residu_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.petugas_residu
    ADD CONSTRAINT petugas_residu_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: riwayat_poin riwayat_poin_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.riwayat_poin
    ADD CONSTRAINT riwayat_poin_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: riwayat_serah_terima_kkn riwayat_serah_terima_kkn_id_pengguna_dari_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.riwayat_serah_terima_kkn
    ADD CONSTRAINT riwayat_serah_terima_kkn_id_pengguna_dari_fkey FOREIGN KEY (id_pengguna_dari) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: riwayat_serah_terima_kkn riwayat_serah_terima_kkn_id_pengguna_ke_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.riwayat_serah_terima_kkn
    ADD CONSTRAINT riwayat_serah_terima_kkn_id_pengguna_ke_fkey FOREIGN KEY (id_pengguna_ke) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: riwayat_serah_terima_kkn riwayat_serah_terima_kkn_id_rw_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.riwayat_serah_terima_kkn
    ADD CONSTRAINT riwayat_serah_terima_kkn_id_rw_fkey FOREIGN KEY (id_rw) REFERENCES public.rw(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: rt rt_id_rw_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.rt
    ADD CONSTRAINT rt_id_rw_fkey FOREIGN KEY (id_rw) REFERENCES public.rw(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: rumah_tangga rumah_tangga_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.rumah_tangga
    ADD CONSTRAINT rumah_tangga_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rumah_tangga rumah_tangga_id_rw_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.rumah_tangga
    ADD CONSTRAINT rumah_tangga_id_rw_fkey FOREIGN KEY (id_rw) REFERENCES public.rw(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rw rw_id_kelurahan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.rw
    ADD CONSTRAINT rw_id_kelurahan_fkey FOREIGN KEY (id_kelurahan) REFERENCES public.kelurahan(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rw rw_id_petugas_residu_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.rw
    ADD CONSTRAINT rw_id_petugas_residu_fkey FOREIGN KEY (id_petugas_residu) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: setoran_manual setoran_manual_petugas_residu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.setoran_manual
    ADD CONSTRAINT setoran_manual_petugas_residu_id_fkey FOREIGN KEY (petugas_residu_id) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: setoran_manual setoran_manual_rw_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.setoran_manual
    ADD CONSTRAINT setoran_manual_rw_id_fkey FOREIGN KEY (rw_id) REFERENCES public.rw(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: setoran_otomatis setoran_otomatis_qr_tempat_sampah_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.setoran_otomatis
    ADD CONSTRAINT setoran_otomatis_qr_tempat_sampah_id_fkey FOREIGN KEY (qr_tempat_sampah_id) REFERENCES public.tempat_sampah(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: setoran_otomatis setoran_otomatis_warga_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.setoran_otomatis
    ADD CONSTRAINT setoran_otomatis_warga_id_fkey FOREIGN KEY (warga_id) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tempat_sampah tempat_sampah_id_gelombang_qr_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tempat_sampah
    ADD CONSTRAINT tempat_sampah_id_gelombang_qr_fkey FOREIGN KEY (id_gelombang_qr) REFERENCES public.gelombang_qr(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tempat_sampah tempat_sampah_id_kategori_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tempat_sampah
    ADD CONSTRAINT tempat_sampah_id_kategori_fkey FOREIGN KEY (id_kategori) REFERENCES public.kategori_sampah(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tempat_sampah tempat_sampah_id_kelurahan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tempat_sampah
    ADD CONSTRAINT tempat_sampah_id_kelurahan_fkey FOREIGN KEY (id_kelurahan) REFERENCES public.kelurahan(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tempat_sampah tempat_sampah_id_mahasiswa_pendaftar_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tempat_sampah
    ADD CONSTRAINT tempat_sampah_id_mahasiswa_pendaftar_fkey FOREIGN KEY (id_mahasiswa_pendaftar) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tempat_sampah tempat_sampah_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tempat_sampah
    ADD CONSTRAINT tempat_sampah_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tempat_sampah tempat_sampah_id_rw_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tempat_sampah
    ADD CONSTRAINT tempat_sampah_id_rw_fkey FOREIGN KEY (id_rw) REFERENCES public.rw(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: token_penyegar token_penyegar_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.token_penyegar
    ADD CONSTRAINT token_penyegar_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tugas_penjemputan tugas_penjemputan_id_pengguna_mengklaim_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tugas_penjemputan
    ADD CONSTRAINT tugas_penjemputan_id_pengguna_mengklaim_fkey FOREIGN KEY (id_pengguna_mengklaim) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tugas_penjemputan tugas_penjemputan_id_tempat_sampah_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tugas_penjemputan
    ADD CONSTRAINT tugas_penjemputan_id_tempat_sampah_fkey FOREIGN KEY (id_tempat_sampah) REFERENCES public.tempat_sampah(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: psc_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict uM8KDaTnM198CdUTUoVw8Np3Vg1nfKP404L5sStWqnydxQG3krwbb6H4IyP5rHM

