--
-- PostgreSQL database dump
--

\restrict dLZZAhHmmUIS0F3EeYSBH6pPeFG7PO6wARMrtcWodVNNuJ3kHOVBlIgAYk4yvtj

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
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO psc_user;

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
    id_rt_rw integer,
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
    radius integer DEFAULT 100
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
    nama text NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.kelurahan OWNER TO psc_user;

--
-- Name: kepemilikan_tong; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.kepemilikan_tong (
    id text NOT NULL,
    id_tong text NOT NULL,
    id_pengguna text NOT NULL,
    tipe_kepemilikan public."OwnershipType" NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.kepemilikan_tong OWNER TO psc_user;

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
    nim text NOT NULL,
    jurusan text NOT NULL,
    fakultas text NOT NULL,
    no_wa text NOT NULL,
    tanggal_mulai timestamp(3) without time zone NOT NULL,
    tanggal_selesai timestamp(3) without time zone NOT NULL,
    id_poligon_ditugaskan integer,
    status_whitelist text DEFAULT 'PENDING'::text NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL,
    id_kelompok text,
    skor_penilaian_dpl numeric(5,2) DEFAULT 0.0
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
    id_tong text,
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
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.pemanfaatan_sampah OWNER TO psc_user;

--
-- Name: pengajuan_aktivasi_tong; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.pengajuan_aktivasi_tong (
    id text NOT NULL,
    id_tong text NOT NULL,
    id_pengguna text NOT NULL,
    url_foto_bukti text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    id_pereview text,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pengajuan_aktivasi_tong OWNER TO psc_user;

--
-- Name: pengguna; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.pengguna (
    id text NOT NULL,
    nama text NOT NULL,
    surel text,
    kata_sandi text NOT NULL,
    token_fcm text,
    id_peran integer NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL,
    foto_profil text,
    nik text,
    id_rt_rw integer,
    status text DEFAULT 'Aktif'::text NOT NULL,
    alamat text,
    no_telepon text NOT NULL,
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
    id_rt_rw integer NOT NULL,
    notes text,
    tanggal_serah_terima timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.riwayat_serah_terima_kkn OWNER TO psc_user;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: psc_user
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roles_id_seq OWNER TO psc_user;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: psc_user
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.peran.id;


--
-- Name: wilayah_rt_rw; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.wilayah_rt_rw (
    id integer NOT NULL,
    id_kelurahan text NOT NULL,
    nama text NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL,
    id_petugas_residu text,
    latitude numeric(11,8),
    longitude numeric(11,8)
);


ALTER TABLE public.wilayah_rt_rw OWNER TO psc_user;

--
-- Name: rt_rw_areas_id_seq; Type: SEQUENCE; Schema: public; Owner: psc_user
--

CREATE SEQUENCE public.rt_rw_areas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rt_rw_areas_id_seq OWNER TO psc_user;

--
-- Name: rt_rw_areas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: psc_user
--

ALTER SEQUENCE public.rt_rw_areas_id_seq OWNED BY public.wilayah_rt_rw.id;


--
-- Name: rumah_tangga; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.rumah_tangga (
    id text NOT NULL,
    id_pengguna text NOT NULL,
    address text NOT NULL,
    id_rt_rw integer NOT NULL,
    latitude numeric(11,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.rumah_tangga OWNER TO psc_user;

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
-- Name: tong_sampah; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.tong_sampah (
    id text NOT NULL,
    kode_qr text NOT NULL,
    id_kategori text,
    maks_kapasitas_liter numeric(5,2) DEFAULT 25.0 NOT NULL,
    volume_sekarang_liter numeric(5,2) DEFAULT 0.0 NOT NULL,
    id_rt_rw integer,
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


ALTER TABLE public.tong_sampah OWNER TO psc_user;

--
-- Name: tugas_penjemputan; Type: TABLE; Schema: public; Owner: psc_user
--

CREATE TABLE public.tugas_penjemputan (
    id text NOT NULL,
    id_tong text NOT NULL,
    status public."DispatchStatus" DEFAULT 'PENDING'::public."DispatchStatus" NOT NULL,
    id_pengguna_mengklaim text,
    dibuat_pada timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    diperbarui_pada timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tugas_penjemputan OWNER TO psc_user;

--
-- Name: peran id; Type: DEFAULT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.peran ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: wilayah_rt_rw id; Type: DEFAULT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.wilayah_rt_rw ALTER COLUMN id SET DEFAULT nextval('public.rt_rw_areas_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
bbbde801-0dac-47df-ad61-7e00e8fdc0bd	9822ce154bc0d7ac522057228c9d01b001627cd31fc1592491f9a45eb89ac550	2026-07-29 02:46:30.477072+00	20260711142358_init_all	\N	\N	2026-07-29 02:46:30.041328+00	1
707ef8c8-4c30-4e45-a316-31b89eb324af	6103e761a67a938816d2dad156c6324795dade7a29a01e4ad143d10b2bda68d3	2026-07-29 02:46:30.50513+00	20260711143430_bin_coordinates	\N	\N	2026-07-29 02:46:30.483933+00	1
9cd6b4aa-fc56-48ea-afb9-71afa93e93ff	4518bd7221876a2eea4a923bb44a8263c97378bd2911100cd2470d5954c2dfcf	2026-07-29 02:46:30.567039+00	20260721071914_add_violations	\N	\N	2026-07-29 02:46:30.512224+00	1
4d276f0a-2d63-4d00-8e48-69c3df935481	8b7e86c800dcb0baee3480798f49f3043ee4550ccc2024d45dbf70903bc8f863	2026-07-29 02:46:30.949086+00	20260721130000_extend_schema_for_8_roles	\N	\N	2026-07-29 02:46:30.572935+00	1
74a6b440-7b20-4eb8-91a4-daad7d38b5b5	46afef74e4c597108cfb6fe4c23bdd2b1012e7d68f75be62e13465e7f36f2992	2026-07-29 02:46:31.032034+00	20260721140000_refactor_bin_ownerships	\N	\N	2026-07-29 02:46:30.956308+00	1
683fbb6e-7e58-41ec-853c-863f8783a301	39e3dd04ae25f92cff58eab278f2dd11421f52af1e7f9e404552860961ca43c5	2026-07-29 02:46:31.094035+00	20260721150000_extend_schema_for_batch_2	\N	\N	2026-07-29 02:46:31.039137+00	1
91ed158a-8e9e-46c7-9ca3-46f57fb87b44	2fe583bf306ab8b0c43040ba5318facca205e7dd1b5dbb99b3aeabfda68c628b	2026-07-29 02:46:31.173783+00	20260721160000_add_peternakan_and_maggot_distributions	\N	\N	2026-07-29 02:46:31.101121+00	1
c633a826-a51a-48f9-87e0-716beb592777	6426de009abdbb4b22c604265f2c50437f39c4493b5c5dd6183d9db28ff7ed4e	2026-07-29 02:46:31.29158+00	20260722045006_rw_portal_fields	\N	\N	2026-07-29 02:46:31.181171+00	1
c48195c5-fb49-42e1-b0ee-1c44a88c2412	cdb5b2f5992b5e07b1028be0278a727f6c94b511023f27e59298e42b108852f0	2026-07-29 02:46:34.376735+00	20260723034830_rename_tables_to_indonesian	\N	\N	2026-07-29 02:46:31.305326+00	1
f36f47f1-9239-487f-b28c-cfa71a004634	1a967561bf9abe9368d21dea70e2b5cce09d2f171a9638a295f0a2161cbbeda7	2026-07-29 02:46:34.487087+00	20260723040353_sync_db	\N	\N	2026-07-29 02:46:34.384516+00	1
\.


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
db522548-abcd-4681-aeaf-7cc9f9edf8fa	WA	+6281287132371	SUCCESS	ALERT	2026-07-29 02:58:31.769
e28b3017-3e3c-4861-83db-6060cf7a6d2b	WA	+6281245672573	SUCCESS	ALERT	2026-07-29 02:58:31.849
c680a553-ec4e-40fe-ab21-7016e54c883c	WA	+6281299340116	SUCCESS	ALERT	2026-07-29 02:59:16.232
1fdf0207-27c5-434c-86d0-a606437a08ec	WA	+6281269519194	SUCCESS	ALERT	2026-07-29 02:59:19.05
fe02abbf-4ee4-403f-ace9-6bd898ddf59f	WA	+6281215275111	SUCCESS	ALERT	2026-07-29 03:00:02.926
46aa2659-f335-4061-b89b-eb4ce82dd0d0	WA	+6281247976716	SUCCESS	ALERT	2026-07-29 03:00:20.835
00ae1572-49c5-4d32-923d-ca030a5ce395	WA	+6281215839696	SUCCESS	ALERT	2026-07-29 03:02:08.201
b828029b-cad6-4f5a-8fef-ea1abb6adacb	WA	+6281285693203	SUCCESS	ALERT	2026-07-29 03:03:34.985
8350a8d0-5bdc-487f-8d21-cc85fffc5f1f	WA	+6281251244348	SUCCESS	ALERT	2026-07-29 03:04:08.416
69d75e04-a4fd-4a8d-b79d-c5440d26998e	WA	+6281238442480	SUCCESS	ALERT	2026-07-29 03:17:24.913
2d4f05c8-13aa-45d0-a798-48100410c62f	WA	+6281280926275	SUCCESS	ALERT	2026-07-29 03:22:59.697
84bcdc39-8897-4fca-b358-62b150f9c08b	WA	+6281269020459	SUCCESS	ALERT	2026-07-29 03:26:47.074
6bb3d6d4-31d8-4dd2-ae7b-132ab72860f0	WA	+6281245130568	SUCCESS	ALERT	2026-07-29 03:30:17.707
144ebe67-31e7-462a-83f2-f72b76b2d505	WA	+6281268042355	SUCCESS	ALERT	2026-07-29 03:32:53.612
ece1fb7a-1283-4a04-a1c4-9456ac7d6f93	WA	+6281212797886	SUCCESS	ALERT	2026-07-29 03:41:07.344
c4c3267f-dab6-4363-9618-2f6631573a45	WA	+6281274995516	SUCCESS	ALERT	2026-07-29 03:42:57.891
0f103102-7004-4cfd-873d-f1d025e03501	WA	+6281263313244	SUCCESS	ALERT	2026-07-29 03:44:08.92
677a3c8a-d7af-40c1-a8a6-957411148c0b	WA	+6281261889773	SUCCESS	ALERT	2026-07-29 03:46:42.4
380243fa-5d79-44a9-94d5-ef05dffbd672	WA	+6281264728837	SUCCESS	ALERT	2026-07-29 03:52:11.981
9e45f649-fb17-4fc5-88ea-0d045539a429	WA	+6281216907990	SUCCESS	ALERT	2026-07-29 03:54:52.984
bb9faed0-ab2b-4d68-b330-95faa2fe2778	WA	+6281221436912	SUCCESS	ALERT	2026-07-29 03:59:06.928
\.


--
-- Data for Name: catatan_permintaan_ai; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.catatan_permintaan_ai (id, id_pengguna, id_permintaan, url_gambar, status_hasil, dibuat_pada) FROM stdin;
6f572880-2140-4857-a48b-4a81fd3834fe	2be71aba-1bf7-411e-b539-076e033dbc50	a8b70dc7-bd3e-41c4-aa13-38774da3a481	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-06 00:00:00
bec465a7-f5f8-4d4f-8233-f2fa0b8daad7	2be71aba-1bf7-411e-b539-076e033dbc50	0c11d668-4974-43a6-a81e-55f2bd2a182c	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-02 00:00:00
7e05d022-32b1-43ac-90bd-9819be2987f0	2be71aba-1bf7-411e-b539-076e033dbc50	a5d142ef-324f-4881-88d2-5361cf8819af	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-10 10:00:00
2b9ac6b8-e5b4-4800-8870-0bdd9065d697	2be71aba-1bf7-411e-b539-076e033dbc50	86c30b1c-e16b-47cb-a398-f8b7d450b60c	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-03 10:00:00
595e6823-0c7b-46a3-b4d3-cd5ab7ee3bfe	2be71aba-1bf7-411e-b539-076e033dbc50	06507c33-1425-4491-b761-2a39b5261156	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-05 09:00:00
f4d0a51d-2064-4368-b10d-0cc647864231	2be71aba-1bf7-411e-b539-076e033dbc50	29708afa-5368-484a-b184-27ec211d9b86	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-30 10:00:00
bb0d49d9-c291-4ebc-84f1-8cdd7d2940ea	2be71aba-1bf7-411e-b539-076e033dbc50	f29863fc-8604-4d85-9b84-eb5cb7274362	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-29 10:00:00
93b17302-6ea1-47f0-ba16-d09f75886f10	2be71aba-1bf7-411e-b539-076e033dbc50	e9847cbb-3911-4c26-bb39-b3bdfef3fb2b	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-23 23:00:00
3b691a0e-c61a-402e-8628-39cadbcc9b76	2be71aba-1bf7-411e-b539-076e033dbc50	6a57a59c-97ac-49a1-96f7-d289cd9e9ec7	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-25 10:00:00
118fa224-9e43-4876-b860-6db9a0d45eed	2be71aba-1bf7-411e-b539-076e033dbc50	0c07011e-2093-4507-b1e9-1d0ba60f1389	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-24 09:00:00
3e82fa61-ccc2-4dd8-bf24-ee33903bed32	2be71aba-1bf7-411e-b539-076e033dbc50	0b8d57ef-5477-4032-92e3-a962ca565e7c	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-03 23:00:00
9a28e3e6-5ad7-472f-97b3-019af95baa2f	2be71aba-1bf7-411e-b539-076e033dbc50	7468b8d6-6883-4118-b51e-9d8791c0e8c4	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-14 10:00:00
5e6d1a09-58fe-4e29-ac6f-c4966a3cc825	67996a97-6f02-47b0-8218-cb7760d5c9e4	ba8abe8d-2d66-4d75-857f-6ec7cc062ea5	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-12 00:00:00
6b4d4601-289e-4e5e-a29d-9404ccb4171d	67996a97-6f02-47b0-8218-cb7760d5c9e4	4938c77d-d143-4bad-8132-e64fdd84bd49	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-01 23:00:00
1aded041-82db-46a1-b4f3-5b9dc0c3169c	67996a97-6f02-47b0-8218-cb7760d5c9e4	526fb624-ef22-42d2-b989-464dd9015ec2	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-15 10:00:00
5b44bb2a-5de7-4da3-9106-7c0999cf25c9	67996a97-6f02-47b0-8218-cb7760d5c9e4	1498843b-1d15-4547-9295-fc904f60f51d	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-03 09:00:00
503a6f78-94ab-4ed3-b816-ba5fdb72b8ae	67996a97-6f02-47b0-8218-cb7760d5c9e4	3b6a91b5-e5e3-4149-a3d2-9a8550d49ea3	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-17 00:00:00
84ddf78d-4672-4903-8795-ad4bc571b87e	67996a97-6f02-47b0-8218-cb7760d5c9e4	97178468-3dfe-4bec-bbc5-d336d468d6c6	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-27 09:00:00
93df823f-55d2-4721-bb20-aee3cc9cd33b	67996a97-6f02-47b0-8218-cb7760d5c9e4	bc537354-d6d8-42a9-a34d-a6c8c5d73f6c	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-29 00:00:00
682e023e-3900-42af-b169-a64c05b7cdff	f8f351b8-1174-40d2-b107-988355cfac0d	94d44966-6c97-4183-b681-2ff64a10ca59	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-06 00:00:00
be6a929a-7632-474f-b988-82e69f57eb51	f8f351b8-1174-40d2-b107-988355cfac0d	c12a42fb-3406-4e16-bd6c-1fcc1183d5f0	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-17 09:00:00
7b449fad-68c8-4af5-8a7f-e0e28a17e161	f8f351b8-1174-40d2-b107-988355cfac0d	606faf4b-cacb-4e78-8ba2-46d2d95ea806	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-01 10:00:00
dce5369a-be94-42e5-866d-0e7f7a78142f	f8f351b8-1174-40d2-b107-988355cfac0d	0192601a-06a5-4d4c-8275-893330e487c6	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-13 23:00:00
126df1a1-c0de-4fac-996f-14d570ec51f9	f8f351b8-1174-40d2-b107-988355cfac0d	69c9ed56-f1e9-4dbb-bc01-09de69f2c89f	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-13 09:00:00
5d6a8a44-d09f-4b18-8a4f-8bea0304b01f	f8f351b8-1174-40d2-b107-988355cfac0d	a02a0664-b2b3-4ade-8068-b1926f93ab35	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-27 09:00:00
9376edca-6e33-4942-b5df-da4c2dfae181	f8f351b8-1174-40d2-b107-988355cfac0d	74afafad-af06-4959-baa2-34c81ac27d15	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-19 00:00:00
18e724b4-4827-4981-a30e-903f4f5b088c	f8f351b8-1174-40d2-b107-988355cfac0d	8bb49c32-d13a-4b37-a2c1-06f34ecd02ce	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-18 23:00:00
37321537-3613-4486-a6ae-8a4e103fe203	f8f351b8-1174-40d2-b107-988355cfac0d	7095b9b5-1ccb-43e0-ab23-21df9709cb6b	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-05-31 09:00:00
aa77b0e6-f51f-4187-b50a-fde181947bdc	f8f351b8-1174-40d2-b107-988355cfac0d	fc69f39f-b278-4288-9d21-d4f000af5e64	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-29 09:00:00
1dc2b69c-53bb-4bba-9ef6-e79907a8a462	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	121404be-7c50-40c8-a129-2f84309b889b	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-26 00:00:00
6fa6fb0e-222a-46c0-9078-03d00abccd86	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	57a126e2-afd9-498e-ad93-2dbc2cd204f8	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-01 23:00:00
53378893-ffe8-4c5e-8829-1d9a461e374f	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	1dceed1b-c445-461d-86b3-d06be5f6517a	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-27 23:00:00
eca3aba3-e62a-4a49-90bf-8c6ddbd7c0f4	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	b48daa33-ce6b-4257-843e-cb1a8f882751	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-21 09:00:00
c271e5a7-fdd2-486c-a868-699d4844b722	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	0e609e61-c10f-42c4-9249-1efa470cd30d	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-15 10:00:00
b13c8d68-5dc8-4f36-a0d7-36e84ce88c55	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	31a58910-d149-4faa-a1bc-ada52aecaf49	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-10 10:00:00
3508fc81-ceee-4f81-9121-c861e515d10b	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	8245b201-dda6-4fd9-85a3-1a9a2a85076f	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-14 10:00:00
f1909717-7bc2-4bbb-ab61-6ab63671d18b	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	71c47054-8757-4c0d-8432-4dd26ac9b8dd	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-08 10:00:00
16224f3f-b886-4035-bedc-82948ea99ff8	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	dbf21785-7ada-4fba-a614-96c4b28a7274	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-10 10:00:00
44c0948f-cbea-429d-afe1-17f1795e1250	6e65c7cb-2969-4483-be16-923f5dfc02b5	bc006a18-dfce-4df4-96ca-172c7aeaeebd	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-26 00:00:00
5eda845a-e220-4c69-a91e-379ef4ba888f	6e65c7cb-2969-4483-be16-923f5dfc02b5	71162cff-9897-4e88-a084-f9c1328ceef2	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-07 10:00:00
0b1015da-5e58-491b-9aac-ea5f8c99ca96	6e65c7cb-2969-4483-be16-923f5dfc02b5	0a6e6ca3-2df8-4359-8c4b-dc2b7139c3e6	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-04 09:00:00
1746706c-634e-4b59-97cc-fcf23474a407	6e65c7cb-2969-4483-be16-923f5dfc02b5	60304650-34dc-470a-9011-3b64d2eefc49	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-07 00:00:00
78b0cb44-57be-4356-b757-bdd5643b1072	6e65c7cb-2969-4483-be16-923f5dfc02b5	41d51960-49ef-4d98-aec1-0ca613d4ca7f	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-19 09:00:00
7451746e-7550-48a6-b35c-bb425ea07ad6	6e65c7cb-2969-4483-be16-923f5dfc02b5	993e7ee0-9532-4568-95bf-e742dce9c081	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-19 23:00:00
f801ed50-1b1b-40cf-ab87-08265f385508	6e65c7cb-2969-4483-be16-923f5dfc02b5	7ea72216-0cea-444d-989c-eb1df8466a01	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-22 09:00:00
11f1ab4a-83ff-4940-b4eb-6b8d654b021f	6e65c7cb-2969-4483-be16-923f5dfc02b5	a9706f0f-ef35-4101-b5e4-faaa0a750be2	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-22 10:00:00
62b0699b-556e-4640-b540-d57ff1f4d327	8265f3d5-9929-4810-9d35-8254c92b7161	48f79427-c784-4142-a084-06ef2d71eb4d	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-28 23:00:00
25c96807-0833-4fde-8850-c557244baedb	8265f3d5-9929-4810-9d35-8254c92b7161	bb608489-0b58-4a92-9d19-8b04063cca28	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-04 10:00:00
c4dd97bf-5a20-4538-917a-e2d95f4b27e3	8265f3d5-9929-4810-9d35-8254c92b7161	d527a212-d59e-4339-a5fa-b394686ab32b	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-25 09:00:00
18dc61de-3aca-47f3-b873-706f28a08ec2	8265f3d5-9929-4810-9d35-8254c92b7161	879b73cf-46d9-4bf6-a233-171128c6ea74	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-07 10:00:00
e2796cda-cdc8-4a5d-9fa1-680333a99064	8265f3d5-9929-4810-9d35-8254c92b7161	db2bcf02-86a1-42ea-ad9a-de1ec1d831ee	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-15 00:00:00
63f1cbda-5a86-4739-976b-dd8cf1a61c53	8265f3d5-9929-4810-9d35-8254c92b7161	95f591a4-5f51-47b4-8b0d-9b9a3c746067	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-04 09:00:00
41360f8f-3484-4748-b934-badc574376cb	6350bf55-763c-4db5-a60a-011fb84c6ef2	ca0d0d05-4e11-459d-8666-84ae29f4055e	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-01 10:00:00
1d7dda2c-88f0-42a6-9462-07e24b13a50b	6350bf55-763c-4db5-a60a-011fb84c6ef2	6ba65d9f-9e93-40a3-87c9-876605fd91b7	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-19 09:00:00
77ce845f-f086-4e43-ba06-b91e042e71d7	6350bf55-763c-4db5-a60a-011fb84c6ef2	356786c3-70c5-4254-9312-8061df9c7038	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-18 00:00:00
c94bb11a-393a-49c3-9d5a-fe551d77ab07	6350bf55-763c-4db5-a60a-011fb84c6ef2	1d8f9abf-8169-461f-811f-399d55bffa94	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-24 09:00:00
aa4ee4a2-81e4-4b62-be20-25c2241a48dc	6350bf55-763c-4db5-a60a-011fb84c6ef2	4b499e1b-0538-45d0-9640-d90c97dec848	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-01 00:00:00
4a6d3b38-fcf1-43dc-ab7a-103470b9f1f6	6350bf55-763c-4db5-a60a-011fb84c6ef2	de7efc80-d965-430f-911e-bd3c840603d2	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-21 09:00:00
1a1ab83b-edd5-40dc-aee1-9725984ab344	ece74bb6-33f1-4e23-b489-aedd0f91cbca	004790fe-1c56-47fa-9a69-88ae595286b8	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-28 09:00:00
bcc41ba8-b6e5-4979-9d8c-a30a259e9d08	ece74bb6-33f1-4e23-b489-aedd0f91cbca	f01eaf25-0015-4791-9223-a64f02e55244	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-06 23:00:00
4afc67fd-0a96-4d6f-86bc-fee48dfdeb06	ece74bb6-33f1-4e23-b489-aedd0f91cbca	c52fd1a1-a819-4177-be04-2df769d39f3e	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-22 23:00:00
9fd212d6-860e-4bd9-a3ea-f4b759793447	ece74bb6-33f1-4e23-b489-aedd0f91cbca	56845dc8-191a-4d3b-9504-20cada64440b	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-14 09:00:00
82e4c576-6619-458b-9265-6a39df9064f7	ece74bb6-33f1-4e23-b489-aedd0f91cbca	e1c1f4c6-cf7e-42ef-8adc-69156ebfbc65	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-08 23:00:00
d9f373b9-1650-4f6e-aa53-e7b79451de65	ece74bb6-33f1-4e23-b489-aedd0f91cbca	a5af4db4-8a70-4842-bd5c-2672156327f1	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-04 23:00:00
c258efff-ba9d-4d1d-8ab2-803d1c9917d2	ece74bb6-33f1-4e23-b489-aedd0f91cbca	c43981c4-0c98-4b80-9ef0-9c7b84864404	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-07 00:00:00
070c85ad-a4bf-4b48-9052-e73ba985bc07	ece74bb6-33f1-4e23-b489-aedd0f91cbca	15277aca-748c-4028-9cf0-8403e860e923	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-01 09:00:00
088b8211-0edd-4102-a08a-56cc6e6703b4	ece74bb6-33f1-4e23-b489-aedd0f91cbca	566706b3-e02b-4508-a0c4-87d8667cf663	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-27 00:00:00
0edf4f92-f29b-45d5-8288-77cacb659a7e	ece74bb6-33f1-4e23-b489-aedd0f91cbca	3cab3d9f-7e1b-49df-8ede-cce94e417dc7	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-12 23:00:00
5da0e998-543c-4cb0-9c49-dd7615292dbb	866e0066-e48e-4339-a2a5-40d06ba5c93e	f1c4c1c5-8ddf-403f-8acf-118ecccad90f	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-04 10:00:00
1fade560-e145-4901-b44e-5c7981f2ce43	866e0066-e48e-4339-a2a5-40d06ba5c93e	3c1c2c8b-2f0d-4010-b701-ba59472123c9	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-01 00:00:00
318309dd-806e-45fb-88cc-4dc542445067	866e0066-e48e-4339-a2a5-40d06ba5c93e	fcb31456-f464-4634-a149-b7d973ad0442	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-12 09:00:00
79339899-0be1-46f0-9e72-1e6404fed155	866e0066-e48e-4339-a2a5-40d06ba5c93e	4f58eea1-f0e6-40bd-a527-873b00c3b0f4	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-14 09:00:00
145642bf-fe80-4224-9503-8488e97983e8	866e0066-e48e-4339-a2a5-40d06ba5c93e	9e84d5bd-2b73-4766-b90b-f4b64a96a90d	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-15 23:00:00
ce5c159d-bc94-4aee-943f-1ebdb560d5ba	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	e6b93f30-7dde-40cb-aff4-8948279e77d8	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-18 10:00:00
c066f050-88dc-4e2a-a849-ef8fc4b8f18e	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	3d820f07-5017-436a-b6e8-f60cb0e2b8e3	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-14 09:00:00
1ecf1a79-a9d2-4ce9-b1ff-492aff8999b6	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	9e229eae-61e2-4138-ae5e-ac9e0e86912d	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-09 10:00:00
af12d9ba-ddba-4777-bcd4-fcb96ab6af24	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	cf1aa4a7-be17-4a27-bf75-07de88a21704	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-23 23:00:00
ecd5c343-14ee-4556-9dd9-2a4d342f1158	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	67cf209d-889a-4813-8832-4f785686c19c	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-20 23:00:00
ae0e850d-c17e-45c4-918c-9e9b4039649b	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	1ab678af-bcce-4e1e-91dd-677ccf42e6e7	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-07 00:00:00
8aa0b55f-7787-4765-a88d-75bde6dae27b	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	6b365ef2-d8c2-40d3-adf6-63f46be61741	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-20 23:00:00
60c600fc-561e-410c-8257-e7c748fd1869	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	a8aada27-d11e-4eb7-ba5a-421f74fff443	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-02 10:00:00
17431d21-5d9e-4b46-a43e-359791e04b8d	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	ac69eed8-0dee-4183-b354-a9ccd1f32d53	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-08 00:00:00
6518f04b-3d27-4a95-bb63-0243d210e10f	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	e350a318-1992-4584-b3db-43672ad5235b	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-11 09:00:00
dd9ba0cc-2596-4cc7-bedb-5ea09327cf1b	878f098e-6dc8-4860-ba8e-53bb9dc307bf	14956efd-948b-49ea-83de-61b1efb7291a	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-17 10:00:00
b76ef802-a797-449e-b09f-1fa89f999d48	878f098e-6dc8-4860-ba8e-53bb9dc307bf	9604cb94-b1a4-454d-ad55-08dae0f9ff12	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-20 23:00:00
c61c05cf-5c0d-483c-88a7-fff2cca8cbdf	878f098e-6dc8-4860-ba8e-53bb9dc307bf	333e3025-2153-47b3-8179-f36d3371a8dd	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-07 23:00:00
332f5e7f-612b-463a-8c0a-af7a12ea2866	878f098e-6dc8-4860-ba8e-53bb9dc307bf	2f9f40ee-8c65-4172-8e6c-53f0cbc89311	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-11 00:00:00
28a30886-b033-4424-ae4b-873732b4e63b	878f098e-6dc8-4860-ba8e-53bb9dc307bf	0a326784-c68b-4dc0-bd7a-0d0e01e32dfa	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-12 23:00:00
ddfc1aae-3ded-437d-a215-545d80a25f48	878f098e-6dc8-4860-ba8e-53bb9dc307bf	0c4fbb66-91a2-446c-8baa-9564c0def283	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-05 10:00:00
11e5fa2c-04f8-4daa-ac2e-5cecfa89690b	429797a7-76fc-4742-a802-e4cc532c85a9	ca1b3ccf-c4eb-4286-ada5-5af5bf57f510	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-21 09:00:00
8b3b2f60-c7e6-4f55-a52a-1ddcf691c602	429797a7-76fc-4742-a802-e4cc532c85a9	830ece3d-0083-4da0-a4ee-71a5666b88dd	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-04 00:00:00
0c7413ed-2021-4de3-b8e3-cddd5d0a1896	429797a7-76fc-4742-a802-e4cc532c85a9	e32d1030-f62d-46fc-8669-0c32221a17b0	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-14 00:00:00
b9c0d98b-d990-41fc-bdde-ebd96be6300c	429797a7-76fc-4742-a802-e4cc532c85a9	0e655f5c-93ce-47db-a40d-ec843137f410	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-01 23:00:00
33a7bdef-9683-4f46-8578-f14f70aeac32	429797a7-76fc-4742-a802-e4cc532c85a9	df010f4d-3f83-4d63-9cff-66b1f0cac501	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-16 00:00:00
047c707a-c211-41ea-9757-1ae6a1d0389b	429797a7-76fc-4742-a802-e4cc532c85a9	cea5a6c8-605e-4abc-84c1-687385498b15	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-21 23:00:00
d1004220-ef95-4b44-8b5b-faf15e6fb129	cc384148-25ef-43c2-8187-289865e697a5	6187305a-5ff5-4dd4-a043-49a93bb00ab5	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-26 10:00:00
3ac471cc-e738-44ae-88d0-418de6af5f6f	cc384148-25ef-43c2-8187-289865e697a5	537f5118-c980-4a25-bfca-030e77f4efc1	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-23 23:00:00
1a6a6252-fb8a-462c-89d3-929bc5fb5c7b	cc384148-25ef-43c2-8187-289865e697a5	24579ff5-c00f-40e9-a93e-5753bf45aaa1	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-09 00:00:00
b2019f62-8afd-42f0-bea9-5393988ae48b	cc384148-25ef-43c2-8187-289865e697a5	6d099ea2-cafc-4b1c-b4a6-2e516078fe15	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-06 09:00:00
0653d1bd-f7ad-46ce-a1f0-6d1e66426672	cc384148-25ef-43c2-8187-289865e697a5	e28bad37-abab-41a1-80d3-4e3b6884ab2d	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-09 00:00:00
7e1adb5b-e799-4df1-a998-ef66e3ff27c7	cc384148-25ef-43c2-8187-289865e697a5	69bdc472-9e41-4792-9c53-737646847d9b	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-19 09:00:00
6da3a3fd-f0e0-4813-b942-4b5c292c5d2a	cc384148-25ef-43c2-8187-289865e697a5	1427e113-e370-4918-9303-81679dd0560d	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-01 10:00:00
da63af0e-73a9-4b53-8be4-a40ac6527044	cc384148-25ef-43c2-8187-289865e697a5	92e9d097-229f-4c33-b383-6203017fbc52	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-27 00:00:00
43ab894f-8cb5-4f3f-afea-cb949208c74b	e9a5cb9c-3a99-4448-8bfa-6388378e52a5	546cfa2e-7cf4-40f4-95c1-a9ddfc4e9526	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-21 23:00:00
906c4e01-a0a5-48ee-b045-02167bfbbfd1	e9a5cb9c-3a99-4448-8bfa-6388378e52a5	ba5dd737-8517-4d9c-b5fb-baa6127e12f6	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-22 00:00:00
ee05db49-7596-47a1-a936-1c4ae2deac5b	e9a5cb9c-3a99-4448-8bfa-6388378e52a5	ac04f45c-5d57-4e4a-bdc0-35975e9db839	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-23 10:00:00
2cc6a3db-4783-4b75-816a-19daf6875a41	e9a5cb9c-3a99-4448-8bfa-6388378e52a5	7efc7574-201a-42bb-b3b3-dbcde147a482	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-28 09:00:00
d3090b42-98c0-45cf-acf2-e6e406b358b1	e9a5cb9c-3a99-4448-8bfa-6388378e52a5	146c30e7-9eeb-4260-9fdc-7ec00a1b6fe0	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-29 10:00:00
c5afa62e-2a40-4f04-98ea-a7a71cd1f9ca	d6db8325-10f5-45cb-a509-b0d284cb91f0	82fc011e-c28b-4a6e-bf58-6264d715e880	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-27 09:00:00
8d2c95bc-59b6-4e58-8548-4e67c553309c	d6db8325-10f5-45cb-a509-b0d284cb91f0	bc918541-8f82-44da-b58e-150d30705a62	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-16 23:00:00
b1a7f662-6062-4d61-a38b-f479ef62e8be	d6db8325-10f5-45cb-a509-b0d284cb91f0	3f58a589-e2b1-4993-9c30-f2c7ce6d235d	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-01 23:00:00
bf4473a3-c1de-4939-b2a7-0202fa5850a9	d6db8325-10f5-45cb-a509-b0d284cb91f0	52fcb5b2-a592-4f65-807b-86418710fa2a	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-08 10:00:00
60112f18-b648-4bb5-afa1-e008e892de41	d6db8325-10f5-45cb-a509-b0d284cb91f0	39946264-bb7e-4a54-8ad8-8064690140e8	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-08 09:00:00
9c53a49a-16b7-49fa-9013-e74e5cf21139	d6db8325-10f5-45cb-a509-b0d284cb91f0	4f2f3264-f468-4dcb-a92a-b84c18ca0010	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-10 23:00:00
83488f9a-c98e-49b5-826f-d4997cda6750	d6db8325-10f5-45cb-a509-b0d284cb91f0	15b64c18-8f2b-409c-8683-3b3a5f91e1bb	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-17 00:00:00
8698b10e-c832-4a9f-b44c-c75b2e959e02	54e9694d-7492-4543-9fe9-8fd7f4f5c921	d56c1167-0194-438d-8f75-6fc7e24c775d	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-21 00:00:00
e160066b-896a-4d34-8ed8-86c73e09a340	54e9694d-7492-4543-9fe9-8fd7f4f5c921	3c42a9b2-717a-490f-8478-7a07f8dc84a6	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-29 09:00:00
cb8360ce-6ffb-4f15-9ee9-1f91f1b62510	54e9694d-7492-4543-9fe9-8fd7f4f5c921	221f1463-bea7-4a01-adf8-72c32a9a75bf	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-05 09:00:00
436224d6-69ff-4f71-b231-ccbf78e6cfc5	54e9694d-7492-4543-9fe9-8fd7f4f5c921	efea5816-eca2-438a-9b93-249aad4e7eb1	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-25 00:00:00
03789f71-1c02-4c70-a62a-26fb66217afc	54e9694d-7492-4543-9fe9-8fd7f4f5c921	5297850a-0519-4b6c-afc2-f29ddb98601b	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-09 00:00:00
4543532a-3f12-477e-a4d0-153ef13ea94f	54e9694d-7492-4543-9fe9-8fd7f4f5c921	d7387b42-bc0a-4424-b272-d0ad75128e08	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-24 00:00:00
a447ecdc-6bf8-4abf-b528-a99a6bec56f8	54e9694d-7492-4543-9fe9-8fd7f4f5c921	1dc939d8-a450-438c-95f3-951f968d236f	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-06 09:00:00
b4cc8026-bd3a-44ad-884c-6b8d9d09504e	54e9694d-7492-4543-9fe9-8fd7f4f5c921	314d0425-7d46-467c-aeea-6a7788add9a9	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-05-30 23:00:00
ea2c5bba-b2e3-429b-b88b-b58de8f031dc	2a07a787-3e37-41c1-a052-ab2fea01f2d7	98c9b4c5-8ae1-4359-8161-f741cb2f7b29	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-06 10:00:00
20a09faf-4be0-47d5-841e-2333e987dc18	2a07a787-3e37-41c1-a052-ab2fea01f2d7	ab6f9619-d4a7-46df-a2dc-17d37308f18d	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-30 09:00:00
373162b0-2098-431b-b92b-b2c8a13211d3	2a07a787-3e37-41c1-a052-ab2fea01f2d7	957e0a46-7407-43e4-aa83-4a9c87b71a6b	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-06 23:00:00
0db6b770-722c-47ec-8c10-4708a0f5eced	2a07a787-3e37-41c1-a052-ab2fea01f2d7	62a67b8d-49d6-41a0-985f-dc78613cda94	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-28 09:00:00
8416cfba-ce14-4a32-8265-7a3a1f828794	2a07a787-3e37-41c1-a052-ab2fea01f2d7	43a6e33d-572d-483d-900f-415787b7b70b	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-28 23:00:00
1205860e-859b-45ee-9445-34f86ca21136	2a07a787-3e37-41c1-a052-ab2fea01f2d7	4b70797b-e4cd-42a6-9bfc-2d5c784812a6	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-13 00:00:00
6ada9b6e-5d9a-4675-9103-bfaba9fb1a48	2a07a787-3e37-41c1-a052-ab2fea01f2d7	93e91b72-18f5-4094-ba3e-e651778727a9	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-07 10:00:00
2c76fcf6-e449-4209-8689-7fabddafe9e1	2a07a787-3e37-41c1-a052-ab2fea01f2d7	1dd4ddfd-2883-498a-bf92-307aeb4402f1	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-07 10:00:00
b2a12028-3b6d-49a7-abfd-d31f7da3dad2	2a07a787-3e37-41c1-a052-ab2fea01f2d7	28011320-08a6-4b31-8ecb-d2c670fdf5a1	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-18 09:00:00
a3612627-7a9f-4ddd-88c9-73a176c8120e	2a07a787-3e37-41c1-a052-ab2fea01f2d7	b04c1e63-70bd-4f01-a8b0-6a3c5691a864	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-14 09:00:00
2e2b9834-ed70-4511-9273-d70911fdbd6d	2a07a787-3e37-41c1-a052-ab2fea01f2d7	1039b1d3-3085-4877-a68f-ab4a9566a181	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-03 00:00:00
725d7d53-0794-45ea-82f4-38b4a505f597	f2edfdc0-029b-46db-8710-968c19475c2e	aec6f52a-7536-43f7-9876-9c1e389f9657	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-21 09:00:00
5c49d549-3651-4642-8638-c8168b88ef89	f2edfdc0-029b-46db-8710-968c19475c2e	25c53734-277c-4823-a6ac-32e65395cdab	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-01 09:00:00
7a4af74d-ed30-421d-8638-1271fa6ba5cc	f2edfdc0-029b-46db-8710-968c19475c2e	08f5f773-28ed-44a1-af98-bbd55b040fab	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-09 09:00:00
acd86eb0-ff2b-44df-a934-8e2afb97a00c	f2edfdc0-029b-46db-8710-968c19475c2e	a3dbb071-5769-46c4-80b1-76e56ad9477f	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-22 10:00:00
08f6c4d2-eb3e-4288-a5e6-c6450be1f5a5	f2edfdc0-029b-46db-8710-968c19475c2e	2bf0cc89-528e-4700-a3eb-ab2865528abf	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-06 10:00:00
1d36bb6e-8508-419d-acca-05da799e78a2	f2edfdc0-029b-46db-8710-968c19475c2e	f11df692-e088-4193-b5dd-f7c5ad159c76	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-09 10:00:00
7b2d5c0f-ae92-4fa9-a38b-2cd29f596e5f	f2edfdc0-029b-46db-8710-968c19475c2e	45683503-9ea2-4f0b-ab3b-b84f23fc7bed	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-14 09:00:00
c56723f1-ba0e-47ff-b032-965bb706567f	f2edfdc0-029b-46db-8710-968c19475c2e	66f73a25-52af-45b3-a208-67e9b4208d7a	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-17 09:00:00
508c4a17-bfa9-4c15-b1de-7538daabaef6	f2edfdc0-029b-46db-8710-968c19475c2e	aee65b1f-ddc6-4340-9735-dacec161db94	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-05 23:00:00
ea52092c-1c14-4744-848d-0f9e128ad4b7	f2edfdc0-029b-46db-8710-968c19475c2e	8c39e804-3be7-4b87-882b-d145d34a95e5	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-07 10:00:00
e84bfe18-3a20-4dc7-bfaa-67f4e85de049	b0a65787-bac6-4fec-87ef-24db782044bd	9f59d7d1-db36-4ea0-943c-07618982ae51	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-26 09:00:00
bead6b4c-a526-4744-b7f6-958cedf865ca	b0a65787-bac6-4fec-87ef-24db782044bd	27b7c1a6-ea5f-4d9b-abd3-7919cc9fd123	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-18 09:00:00
3cd98fe2-b7bd-4dbb-8c13-cc17ab0a0725	b0a65787-bac6-4fec-87ef-24db782044bd	e8ba1a16-6406-48b3-b99e-ee14ea4537e7	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-20 10:00:00
a6603cb3-6d00-4ae6-9725-f5de484ff370	b0a65787-bac6-4fec-87ef-24db782044bd	e1fff2ef-1d6a-4264-aabb-6e377d0d766b	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-06 00:00:00
00d19e52-262d-4349-9eba-371be7df4ada	b0a65787-bac6-4fec-87ef-24db782044bd	2d22d155-b044-4d7a-b1e4-495acb57119b	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-24 09:00:00
e71011cb-2b4e-407c-8206-60d99ad826d4	b0a65787-bac6-4fec-87ef-24db782044bd	2e3bc76b-c20c-4b65-bb4c-d0b2b46f026c	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-14 10:00:00
e89961a5-95e7-4f4d-88b0-65e38f4c3ebb	b0a65787-bac6-4fec-87ef-24db782044bd	7f4797bc-d9dd-4232-8432-2106352ee98b	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-05 23:00:00
da01a89b-6bfd-47c1-acc1-7164dcab7424	b0a65787-bac6-4fec-87ef-24db782044bd	59feae29-d390-48d9-aaaf-c08f91b30239	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-13 10:00:00
38d21d04-5957-47d2-b1c1-4ceac214a72b	b0a65787-bac6-4fec-87ef-24db782044bd	7b4327e7-ffc1-4a1a-9477-2fe15239abf9	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-12 23:00:00
73a22aa0-2225-424b-811e-1f7dfa834385	b0a65787-bac6-4fec-87ef-24db782044bd	c8a8dfde-6f80-41de-aa93-66570a9d20f4	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-27 23:00:00
1975c518-18f7-4008-9f28-d7d21ff9fba7	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	ec173102-e2df-4d18-8965-9a53bfe22cd9	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-09 10:00:00
d43c08c5-7f5c-46c5-8b88-e6386c996b20	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	e0dafdf0-6ce5-45b9-ae73-4fa60bdba0fe	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-27 00:00:00
d877bd59-6c64-4460-894d-ed9455baf342	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	57a1c4d5-8fea-4faf-9300-e8db2032e6ce	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-17 09:00:00
e1408efa-295d-4c47-b359-f4bdbfd1d0d9	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	b2006777-5192-4b46-b680-c0b6d474f178	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-28 10:00:00
c8b39d14-4737-4a58-aab5-75319498a07e	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	cda327a1-3459-4ffc-8be6-eaa51701c17e	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-05-31 00:00:00
7e73aebb-5300-47b1-983f-f758a44407ed	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	a7f5211e-a61a-4879-878a-f71c161c7dca	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-20 00:00:00
c1f7b1d0-9c7c-4806-885f-98d356db3e3b	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	c347bfb0-d46f-473a-9eec-18219b72239f	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-04 23:00:00
f186bbbb-7c08-4d82-a5eb-9312f2504efe	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	d1192a05-8da0-4b88-b1d1-c2a6a817c3a1	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-22 23:00:00
1bcd2b88-293c-4b8c-a955-fb81b9dd275d	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	14a93d95-84b1-4afb-bae7-c0fab5860f43	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-01 23:00:00
0f246d45-6d92-46c6-a46d-dc8e7d120818	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	a5fa2262-20b5-4b65-8b4c-070c573ae3be	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-04 23:00:00
5efc4398-4498-4d02-88bf-a28a680a06a8	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	2362949b-c233-4368-8335-c7c9c326c6fa	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-13 09:00:00
8d2cac8c-0e67-46e5-ab3c-bf9b7ee875f5	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	e2bf8321-00de-4827-9acd-90373967ce86	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-26 09:00:00
2f5db04b-b201-4597-b78c-461a0d696b76	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	d01ade95-3c1d-4d4a-89e8-1caed9bfbeb1	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-08 23:00:00
75412dc3-25cc-4e27-9455-4a042e0b9943	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	2d8b21ec-bafa-494f-ab13-f79255e46a1b	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-26 23:00:00
6419ab52-feec-4a19-b14e-3c275aa53992	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	cef8ae36-0626-48c4-a6bb-8c5a3c14e9f1	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-11 00:00:00
8eb2eb80-b956-405d-8c71-4c438bcb773b	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	052e3e26-6298-486d-a12f-e924e9211986	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-20 23:00:00
08e63ea4-032c-4d07-9db9-e1b12232d823	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	f598ff0c-3b36-44f6-835b-c16cb34d6b1c	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-20 23:00:00
acbb7ad1-78d0-4747-9242-1a2eb8dfc848	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	c02e3386-63d4-4c04-a914-b74285528d3e	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-18 09:00:00
da9c618f-4ea3-4689-a684-d3e8d2b8c9e2	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	e46de11c-2f82-4f82-a075-ce3751f552a2	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-06 23:00:00
5de58b73-1b88-4820-8369-04b5bbd296c1	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	18417cba-983e-4d2e-8d38-5db80fc6a614	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-01 00:00:00
8824dac5-8f58-4596-b396-4c82b70da120	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	37454a6e-e8fa-420c-91a8-efb2c44b6acc	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-20 00:00:00
efacd209-2da7-4974-8afc-6ddd6abb469b	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	c53ae59e-e3fa-48c2-899b-ef07cb0f58e7	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-29 23:00:00
cfe1742c-9d1c-4173-9846-8e49094ffd0c	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	8b087327-f8e7-4652-963b-459ba3f652ca	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-09 00:00:00
1f489248-f7d3-45b0-b948-ca52c8d6f392	d32557cf-a420-438e-8d42-c8b3d35ecb08	015061f7-0af2-4a33-a476-0ebfbfff63d2	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-05 00:00:00
c643d482-5295-4195-a34f-f718d3c53c0a	d32557cf-a420-438e-8d42-c8b3d35ecb08	6894c7cb-fd20-4db0-9bb8-09ccae6e2fb2	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-12 00:00:00
f8ec5e69-1923-4b68-9af6-f060aef761c6	d32557cf-a420-438e-8d42-c8b3d35ecb08	50f28b67-b84a-4372-8667-974432d5e0fb	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-16 23:00:00
e325143b-7dd6-4f5c-8ac8-4020c86a15db	d32557cf-a420-438e-8d42-c8b3d35ecb08	1484ed25-eeb1-4626-8678-4cc55455c36f	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-02 09:00:00
3152dbee-9ec0-4db4-afd4-43242a005019	d32557cf-a420-438e-8d42-c8b3d35ecb08	76018fdd-2f24-45b5-bbe6-71a087912d13	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-06 10:00:00
ef59b9e8-3444-4c36-b258-60b3a033c3d3	d32557cf-a420-438e-8d42-c8b3d35ecb08	376b1f53-1b51-4d01-9c03-a124cecc9e26	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-05 10:00:00
ed9a2fbd-ab29-491e-864c-0c84bd1d7e80	d32557cf-a420-438e-8d42-c8b3d35ecb08	56298f67-70a0-48f6-addc-88e83d73e6f9	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-16 23:00:00
b9740bad-7972-49dd-b1e5-ec8ee330d1e1	d32557cf-a420-438e-8d42-c8b3d35ecb08	32b19fea-f6b0-410c-98d2-ebee6ab5217d	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-05 23:00:00
9c23df20-aec4-4151-89b5-3a3ba9371a3c	d32557cf-a420-438e-8d42-c8b3d35ecb08	e4f786ac-4eb5-4e1d-baa1-1fb88e298e23	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-26 23:00:00
52b08a90-d209-4906-93f1-65cb3d3afba3	d32557cf-a420-438e-8d42-c8b3d35ecb08	67deadef-0414-4c71-b51e-d3604c676160	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-06 10:00:00
c5d9657d-1ea2-4426-8450-f3552b6fd203	d32557cf-a420-438e-8d42-c8b3d35ecb08	40cacd3e-0421-4d3f-84ec-eb2343d218c7	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-15 23:00:00
47f86101-05e0-4746-a465-1c8661029baf	514e074f-d89a-4380-87d8-e91aef8ec350	b7783f2e-bd28-4305-a93e-bf74cdc35125	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-01 09:00:00
5df13fdf-478b-40af-978a-330fd84155e6	514e074f-d89a-4380-87d8-e91aef8ec350	12b3f251-c824-4ef0-b402-1498216fef6e	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-09 23:00:00
9db0f50f-8bce-42ae-bfcc-f87dcde70e2b	514e074f-d89a-4380-87d8-e91aef8ec350	4398b4bb-ae42-4d61-baf3-0c0d16882516	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-27 09:00:00
d798b425-1f99-4000-be97-9df412ad65bb	514e074f-d89a-4380-87d8-e91aef8ec350	95f4600d-312b-46ef-bacc-7f00ebc11375	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-22 09:00:00
608fefb2-cf93-45b1-ac8e-b0bff997131f	514e074f-d89a-4380-87d8-e91aef8ec350	e48c4365-9afa-4711-8b92-7b2870e0dca7	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-28 10:00:00
95d1eafc-cfa0-4a86-8087-321aca641415	514e074f-d89a-4380-87d8-e91aef8ec350	a88f711d-1d0b-497d-9bb9-4e71ac523b7a	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-01 09:00:00
db8f6e08-0ae4-40e4-833d-722211e71b87	514e074f-d89a-4380-87d8-e91aef8ec350	6420e5ba-29f5-4a1f-8ebb-f8b5e29ada0d	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-18 00:00:00
fb733e5c-b2d9-4167-9037-630bf6ab2de0	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	62ebb1f9-9fe8-41ff-80cd-f5863dbd2fa4	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-27 23:00:00
e44cf087-7b55-4847-956c-68e9c9dcb64d	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	e3bcb5f6-4740-4a5f-8d51-6afbecee78a6	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-18 23:00:00
e0783398-baa7-493d-bf1d-b69d96fb4054	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	2d2d4978-7f30-490b-9cd7-02db697506fb	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-19 23:00:00
84679487-95e9-4f32-9275-f5f3a9e8e1de	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	aab55577-33bc-4a7c-9142-7cc56e815fcd	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-04 23:00:00
268fd79a-2f6e-4fa2-bfdf-1b5ae3961c95	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	8a10f725-1e3c-43fb-aba8-5750336ebe29	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-05 10:00:00
3fb7e6ca-bef6-4826-b3d0-19d0b904db84	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	2d00dc7c-835f-4b76-956b-06fdde511d23	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-07 09:00:00
af1f570c-af7e-48b5-bacb-c8cc6076738b	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	1a0d5b33-2a17-4a2c-808e-48949554c1d4	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-26 09:00:00
a7452909-2f3e-426d-823e-88aa8def10ca	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	874e7e55-233d-4e3c-b03b-990ac4461002	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-17 10:00:00
e192be95-acbc-423d-b92d-ef0dc8bde580	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	a9cdfabe-c18b-41fb-acb9-5e7494159809	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-13 23:00:00
672b7ad0-01df-4adb-a435-e6c0793f600d	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	f305f164-9c20-4901-9abc-fa41761a49dd	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-23 00:00:00
b7be21ae-6db1-4f51-9693-b5c8bc0a1752	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	a5e8d4bc-8230-4330-ad8f-c44541438e19	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-17 00:00:00
33676a1d-5ae8-4725-b2c2-5f0db3cd85d0	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	d7bbbd03-2b7e-460e-b1c5-fa6116edfba5	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-04 00:00:00
57860f24-4ecf-4959-8535-5200c48d152b	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	88704779-ccd4-445b-9306-5e55f272c3d6	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-02 23:00:00
e7f527bf-fc7a-4c2b-8098-d5f6588cac23	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	f7d97bc3-d10e-47dd-ab86-9d325deb754b	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-27 10:00:00
936c65c2-783e-4df6-b865-bad20d8e77fc	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	79f8f4e4-8a01-4d55-8154-2547371bc374	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-23 23:00:00
81add0ea-14f7-4c03-99bc-0146ad9b5a0c	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	2f660f47-530a-402d-a030-df23b17a5c60	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-25 10:00:00
3a2e69dd-0209-48c1-943a-a917ae2963ea	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	20080d2a-a016-4b55-beff-c85ddcd8d79b	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-10 10:00:00
f695b952-dd12-43d8-94de-c799f888406d	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	57dc198a-3596-470e-ab42-013b6f7df796	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-18 10:00:00
8a5d4992-c6a4-4a6e-947e-7cdc68a64da0	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	9d2a7036-bf5b-4474-91da-d3e755fbf2a8	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-07 00:00:00
45c2be1c-23a8-430c-9d1e-7b403e7d0972	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	2d6c38b9-3c76-4692-a853-5a5f74b4082d	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-11 00:00:00
3e40e9ae-6aa8-4a0c-8392-6b2b7268a5da	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	a77895fa-2056-4524-ace4-9ca2c2f1cb39	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-07 00:00:00
9a6108ac-4909-4d66-ac17-5df85c64f5a9	e77f0e98-184a-411a-ae09-c5393acbc976	04704876-4d32-4d86-bf5a-67acf0beb147	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-18 00:00:00
0bba8d88-efa4-4527-949a-23247f5185cb	e77f0e98-184a-411a-ae09-c5393acbc976	888a5656-f016-456e-b56c-4af149a8882f	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-26 23:00:00
f420d62c-372a-4c52-a9b5-457d7b466418	e77f0e98-184a-411a-ae09-c5393acbc976	16ac8574-575d-4dc3-ad81-65b426e0c284	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-04 10:00:00
5b2ee17a-9774-46ac-93c1-87db1a63ed91	e77f0e98-184a-411a-ae09-c5393acbc976	f31a33da-2224-40e1-91de-53250fed3873	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-24 23:00:00
aa9a2dc8-c7ae-4088-91e3-b177523619fd	e77f0e98-184a-411a-ae09-c5393acbc976	36ecc60d-b99b-45a0-869f-8584c128ff41	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-19 09:00:00
97f8cbb0-2ca5-41a7-a53d-b624245f49b7	e77f0e98-184a-411a-ae09-c5393acbc976	fe5b5931-7577-4b69-9088-cf0a2c91fc3e	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-24 23:00:00
4d81c244-1f5b-40cc-8350-b6b0738a0fa9	e77f0e98-184a-411a-ae09-c5393acbc976	8b176644-8c7b-4326-9ab1-616f3471bd0d	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-19 23:00:00
6fcf8c86-1bfb-4b65-a17c-48ab09ff703a	e77f0e98-184a-411a-ae09-c5393acbc976	a6650f53-64d2-4885-bafd-54ab9fbe8399	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-12 00:00:00
2f307b63-6d51-49b6-b3de-93a9475f4da3	e77f0e98-184a-411a-ae09-c5393acbc976	45613d64-d1e1-4910-a0db-7ea9e41c42c5	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-01 09:00:00
a45528aa-0574-476b-ba00-aa8791bcc71c	e77f0e98-184a-411a-ae09-c5393acbc976	867a5a7c-087a-4fca-86a4-eddb2512536c	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-18 10:00:00
c4d45a70-90ec-44cf-b223-d766c600808f	e77f0e98-184a-411a-ae09-c5393acbc976	e7ac0587-aa9f-4909-bc9b-22cc95bc6fea	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-25 09:00:00
e2232841-2ec3-4997-b441-b4d9449cf09e	1cfba3ed-a354-4232-8d05-a35df134e95b	22933b43-a1d4-4c06-b1ec-73af47a37ce1	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-16 00:00:00
3c63dd75-99c2-40b7-8067-f73b7f2d8789	1cfba3ed-a354-4232-8d05-a35df134e95b	61baa498-cabd-4002-92b7-e71c3b17e465	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-03 23:00:00
829e5cfe-4840-4071-b09e-0de6fb33c5ad	1cfba3ed-a354-4232-8d05-a35df134e95b	f953462f-746d-4ed0-acf9-aaf0e517ed51	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-02 09:00:00
2892b481-5f11-4c6d-9b9c-2fd496a2439b	1cfba3ed-a354-4232-8d05-a35df134e95b	d65128e6-1e8c-4cc3-a546-7664cb1227b1	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-21 23:00:00
6c577691-90fc-48f0-b93c-43a2a6f62a2a	1cfba3ed-a354-4232-8d05-a35df134e95b	085cdd96-bfcb-4ed7-8608-5a47ff78a38a	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-27 10:00:00
9f1aac10-023a-4595-af8d-f15c6b929fa0	1cfba3ed-a354-4232-8d05-a35df134e95b	fdc52222-2d1a-41be-865f-eb2a3746d97e	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-28 23:00:00
d16c26c6-c360-4387-97f6-3daece43529d	1cfba3ed-a354-4232-8d05-a35df134e95b	18355972-7a16-44ca-9bf0-7b6ee4240d17	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-09 09:00:00
b57e85ef-19a0-49f0-90bb-b4dfd3050f05	1cfba3ed-a354-4232-8d05-a35df134e95b	656fcf7e-1363-4f3c-a7cf-a2c6b3d70f51	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-01 09:00:00
7328a998-3e56-405b-b746-0a3d772c62b1	1cfba3ed-a354-4232-8d05-a35df134e95b	5ecdfec4-6b87-42da-bb9f-091e3a1299c5	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-16 09:00:00
5f2f7836-08d5-4081-88b3-028b90135631	ae934d2f-e7ae-4471-ab73-6388951d3c2b	64a76e76-9263-4b6d-81e5-9d136f3da3dc	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-21 00:00:00
b97219e5-4ab2-4011-9736-1602d58221b9	ae934d2f-e7ae-4471-ab73-6388951d3c2b	959cc4b8-9de7-4d2b-91b4-d756c84029b2	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-06 10:00:00
a1705d4d-c659-4cf3-8aa4-e54abf450cae	ae934d2f-e7ae-4471-ab73-6388951d3c2b	5c2eaf73-f484-4697-8837-9349fada9465	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-22 23:00:00
0b6ebc2b-c24e-4691-a346-78d84d32d861	ae934d2f-e7ae-4471-ab73-6388951d3c2b	fa8b0977-cca2-4af8-be97-da1f7c91e2d8	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-18 09:00:00
17665f84-7a1b-442e-988b-fd3cbffaaf89	ae934d2f-e7ae-4471-ab73-6388951d3c2b	e59ca058-4291-401d-8cef-467debfd8363	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-19 23:00:00
3ba1a5d9-cc1c-4860-8f61-c486a268d1c7	ae934d2f-e7ae-4471-ab73-6388951d3c2b	ec7adefc-7ffc-45e8-b7af-052709881459	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-07 23:00:00
2db4403f-39ea-4750-ad21-8da8abba6f02	ae934d2f-e7ae-4471-ab73-6388951d3c2b	9fe0376d-5208-4fbb-9d39-015b132c0917	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-13 10:00:00
2864e817-0266-47fd-978f-2ba66afe9fae	ae934d2f-e7ae-4471-ab73-6388951d3c2b	03ba526c-3cad-400e-89ef-20e934255120	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-05 09:00:00
1bbe29c3-614b-49fc-9e02-7431d2961e01	ae934d2f-e7ae-4471-ab73-6388951d3c2b	2f03e141-c1d6-4840-a2be-5ce7a79abfea	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-16 10:00:00
20bfe7c3-4a9e-4ffe-a393-81b1cbf2c9f9	ae934d2f-e7ae-4471-ab73-6388951d3c2b	49bb281a-10cd-4545-abc8-986f319e1b3d	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-21 10:00:00
8fb6aadb-26cc-4a5f-8399-bafbeabad914	ae934d2f-e7ae-4471-ab73-6388951d3c2b	b82f190d-c6e4-4adc-be73-79ee23fdb353	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-01 09:00:00
91892a2a-e3c6-4c86-bdc4-eb24a5556324	13a8cc8d-80ad-4559-a301-ea7a8481f621	eee4f9fc-8cd9-4995-b636-5ca25616bc2e	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-12 23:00:00
30c5aea4-ba20-4c79-8d97-e92690414834	13a8cc8d-80ad-4559-a301-ea7a8481f621	5afc21e7-4600-4013-abb0-00eede23b73c	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-09 23:00:00
91185745-995f-4138-a227-976898e1113d	13a8cc8d-80ad-4559-a301-ea7a8481f621	0881f778-d57d-4eec-a99c-acebbbc0212a	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-02 23:00:00
5077d230-0e60-4d10-a7fe-d4f072817729	13a8cc8d-80ad-4559-a301-ea7a8481f621	71d954db-2c0f-4e07-ae1e-7c1d61c32b2d	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-26 10:00:00
3f626fc5-5b0d-4354-84b4-f49e38ca8056	13a8cc8d-80ad-4559-a301-ea7a8481f621	789a08a8-295d-43e5-a897-ebba990f9aa7	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-18 00:00:00
b387b68c-a15e-4586-a77c-1a232f70b2de	13a8cc8d-80ad-4559-a301-ea7a8481f621	df562019-e9bc-4f74-8076-459a127b1219	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-26 10:00:00
55a24db2-05fc-4709-a8ea-49fc2e56ae8c	13a8cc8d-80ad-4559-a301-ea7a8481f621	e47ce017-414e-4f5d-8248-a5f883191b6d	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-14 23:00:00
5b2bf03e-e18a-4c32-9a4d-5ff3218a0f5b	13a8cc8d-80ad-4559-a301-ea7a8481f621	9df644f3-7b1d-49ba-a54e-8340ea8a8f5a	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-20 23:00:00
6d20ef83-8401-4e36-8572-3b1f35b0d904	13a8cc8d-80ad-4559-a301-ea7a8481f621	7293b805-5469-4635-8b7c-a264f4bec4d9	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-05-30 23:00:00
44ca2516-6581-44b5-904f-ed13eb2de7ab	13a8cc8d-80ad-4559-a301-ea7a8481f621	04418a42-fb2f-4c00-bca7-e8e3429a27ba	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-03 23:00:00
357a6745-d386-4ff2-94b5-70cb08864d46	13a8cc8d-80ad-4559-a301-ea7a8481f621	929a68ad-dd97-4e8c-8f90-9104d7fdffc2	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-10 09:00:00
8679b6e7-5184-47cd-bd7f-92a1a11febfb	13a8cc8d-80ad-4559-a301-ea7a8481f621	de974aea-0927-4a04-8e81-2bb6daea17d1	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-08 00:00:00
c801f882-8594-4dc5-93f0-932aceda6f77	b8e9385a-6ed1-41b8-8b74-55123baa568a	028c0d71-4604-4484-b66a-a43023544ecb	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-07-23 09:00:00
6f738ede-1eb5-4f86-8d41-040ca111c6da	b8e9385a-6ed1-41b8-8b74-55123baa568a	f375359d-8975-4179-875d-f89987ae69f4	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-05 09:00:00
6826d509-d710-42d7-b934-62a13b2848ab	b8e9385a-6ed1-41b8-8b74-55123baa568a	de0ec25c-7680-4cfb-a4b1-f243b5f1056f	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-07-08 10:00:00
4b2f33db-0a8f-46d6-ae4f-52079d355ba7	b8e9385a-6ed1-41b8-8b74-55123baa568a	90863092-a0c1-4755-b81f-87a286c11400	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-15 09:00:00
17ac92e8-af65-4e5c-8fe4-e09a799b8894	b8e9385a-6ed1-41b8-8b74-55123baa568a	f9ea2f75-e61e-49b5-8c41-f0aead808ea0	https://dummyimage.com/600x400/000/fff&text=Trash	SUCCESS	2026-06-25 23:00:00
d8cec7cf-825d-49c8-8911-c6e1952b1136	b8e9385a-6ed1-41b8-8b74-55123baa568a	6697b85a-bf5e-4ea2-907c-eb0e3a466912	https://dummyimage.com/600x400/000/fff&text=Trash	PENDING_REVIEW	2026-06-30 23:00:00
\.


--
-- Data for Name: catatan_produksi_fasilitas; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.catatan_produksi_fasilitas (id, id_fasilitas, material_masuk_kg, output_kg, jenis_output, periode, dibuat_pada) FROM stdin;
\.


--
-- Data for Name: fasilitas; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.fasilitas (id, jenis, nama, pic, foto, kontak, kapasitas, latitude, longitude, dibuat_pada, diperbarui_pada, id_rt_rw, status_persetujuan) FROM stdin;
\.


--
-- Data for Name: gelombang_qr; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.gelombang_qr (id, kode_gelombang, status, id_pengguna_pic_ditugaskan, total_qr, dicetak_pada, dibuat_pada, diperbarui_pada) FROM stdin;
7991f863-d53d-48c3-9299-49d3ee1bb290	BATCH-EMERGENCY-01	PRINTED	\N	10	2026-07-29 02:57:44.676	2026-07-29 02:57:44.685	2026-07-29 02:57:44.685
ce10cccf-2ece-4a7a-bf38-7d3551d06cf2	BATCH-TEST-1785293910753	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 02:58:30.754	2026-07-29 02:58:30.754	2026-07-29 02:58:30.754
e4603ef2-aecd-4197-a021-8ec63abc88e2	BATCH-TEST-1785293910757	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 02:58:30.762	2026-07-29 02:58:30.762	2026-07-29 02:58:30.762
d5f0c322-c86d-4b63-8406-2966ac3307be	BATCH-TEST-1785293955368	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 02:59:15.37	2026-07-29 02:59:15.37	2026-07-29 02:59:15.37
e205ed4f-78e8-471e-81eb-85109e5b065f	BATCH-TEST-1785293958405	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 02:59:18.406	2026-07-29 02:59:18.406	2026-07-29 02:59:18.406
97788b71-ac84-480b-b647-0de2618181ff	BATCH-TEST-1785294001393	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 03:00:01.396	2026-07-29 03:00:01.396	2026-07-29 03:00:01.396
4c7de4ea-5159-4056-9cfe-8a813e21b16f	BATCH-TEST-1785294001609	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 03:00:01.612	2026-07-29 03:00:01.612	2026-07-29 03:00:01.612
4dda91b3-b6d2-4861-9ce5-a7a235e5d6da	BATCH-TEST-1785294020340	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 03:00:20.341	2026-07-29 03:00:20.341	2026-07-29 03:00:20.341
fa0ec35f-d446-4bd2-8792-26aa04f6c0f2	BATCH-TEST-1785294127759	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 03:02:07.761	2026-07-29 03:02:07.761	2026-07-29 03:02:07.761
edbf0c68-838d-4a19-a827-5241c0283237	BATCH-TEST-1785294214346	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 03:03:34.348	2026-07-29 03:03:34.348	2026-07-29 03:03:34.348
7b648e7b-3f4f-41e6-8f31-83a41453037e	BATCH-TEST-1785294247959	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 03:04:07.96	2026-07-29 03:04:07.96	2026-07-29 03:04:07.96
79880e92-3b4c-4d0b-85d8-8dad96790e49	BATCH-TEST-1785295044351	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 03:17:24.353	2026-07-29 03:17:24.353	2026-07-29 03:17:24.353
566daa7e-65dd-4a55-9410-baa10b7808b1	BATCH-TEST-1785295379204	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 03:22:59.207	2026-07-29 03:22:59.207	2026-07-29 03:22:59.207
dcf8fa55-4fd5-4daa-9a5c-32be2375a1d3	BATCH-TEST-1785295606516	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 03:26:46.519	2026-07-29 03:26:46.519	2026-07-29 03:26:46.519
b255ef5e-9f60-4fd5-b13c-90dd932e2245	BATCH-TEST-1785295816632	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 03:30:16.633	2026-07-29 03:30:16.633	2026-07-29 03:30:16.633
1cb9531b-eb28-43e7-a889-e630d85bd095	BATCH-TEST-1785295973071	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 03:32:53.072	2026-07-29 03:32:53.072	2026-07-29 03:32:53.072
73ecfc7f-5e1a-4f55-bb99-759b2fe07f10	BATCH-TEST-1785296466919	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 03:41:06.92	2026-07-29 03:41:06.92	2026-07-29 03:41:06.92
e30659bb-580d-4cad-bcf6-d889427e4e89	BATCH-TEST-1785296577262	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 03:42:57.264	2026-07-29 03:42:57.264	2026-07-29 03:42:57.264
30849986-4590-4e12-8e22-ea2814d03e5e	BATCH-TEST-1785296648110	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 03:44:08.112	2026-07-29 03:44:08.112	2026-07-29 03:44:08.112
d84485c8-fca1-44b8-9ecc-1289f475e52e	BATCH-TEST-1785296801784	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 03:46:41.785	2026-07-29 03:46:41.785	2026-07-29 03:46:41.785
33efe401-3b8e-4178-b8f5-9b665cd7cf73	BATCH-TEST-1785297131217	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 03:52:11.218	2026-07-29 03:52:11.218	2026-07-29 03:52:11.218
a092e5a6-d02f-48dc-8005-5ebf7de93b39	BATCH-TEST-1785297292362	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 03:54:52.374	2026-07-29 03:54:52.374	2026-07-29 03:54:52.374
9bb806b6-03f1-4a52-a2d3-121768c410c8	BATCH-TEST-1785297546452	ASSIGNED_TO_PIC	a92b2f4b-596d-44fe-a044-140f7989ae89	5	2026-07-29 03:59:06.459	2026-07-29 03:59:06.459	2026-07-29 03:59:06.459
\.


--
-- Data for Name: ide_daur_ulang; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.ide_daur_ulang (id, id_pengguna, judul, foto, material, status_persetujuan, disetujui_oleh, dibuat_pada, diperbarui_pada) FROM stdin;
9f33dd3e-3324-4f17-91a3-2794cf4b2fd8	2be71aba-1bf7-411e-b539-076e033dbc50	Ide Daur Ulang Warga RT 01 1 RW 01	\N	Anorganik	APPROVED	\N	2026-07-29 04:54:08.244	2026-07-29 04:54:08.244
4fd89f05-07f9-4e09-acdc-1a05a419436a	6e65c7cb-2969-4483-be16-923f5dfc02b5	Ide Daur Ulang Warga RT 02 2 RW 01	\N	Organik	APPROVED	\N	2026-07-29 04:54:08.995	2026-07-29 04:54:08.995
68981451-8cd6-4ea0-8dbe-5336ac5791fb	ece74bb6-33f1-4e23-b489-aedd0f91cbca	Ide Daur Ulang Warga RT 01 2 RW 02	\N	Organik	APPROVED	\N	2026-07-29 04:54:09.44	2026-07-29 04:54:09.44
6da90b2d-c691-44e5-b837-b1b1077f50a3	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	Ide Daur Ulang Warga RT 02 1 RW 02	\N	Organik	APPROVED	\N	2026-07-29 04:54:09.745	2026-07-29 04:54:09.745
136fedf0-48b1-4080-ad24-0c7c7d88baa1	429797a7-76fc-4742-a802-e4cc532c85a9	Ide Daur Ulang Warga RT 02 3 RW 02	\N	Organik	APPROVED	\N	2026-07-29 04:54:09.989	2026-07-29 04:54:09.989
cbd006ab-83c6-46af-b99a-d59fceec06e3	f2edfdc0-029b-46db-8710-968c19475c2e	Ide Daur Ulang Warga RT 02 3 RW 01	\N	Anorganik	APPROVED	\N	2026-07-29 04:54:10.77	2026-07-29 04:54:10.77
086714d7-c4f7-4c7d-9e7f-67c1c30af9a3	b0a65787-bac6-4fec-87ef-24db782044bd	Ide Daur Ulang Warga RT 01 1 RW 02	\N	Organik	APPROVED	\N	2026-07-29 04:54:10.95	2026-07-29 04:54:10.95
2e2ea1a3-6210-4790-969d-6d0367056c7a	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	Ide Daur Ulang Warga RT 01 2 RW 02	\N	Anorganik	APPROVED	\N	2026-07-29 04:54:11.16	2026-07-29 04:54:11.16
fdaf42cb-eb0c-438e-9a5d-f6692a4a4fe6	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	Ide Daur Ulang Warga RT 01 3 RW 02	\N	Anorganik	APPROVED	\N	2026-07-29 04:54:11.386	2026-07-29 04:54:11.386
f6cbc3e0-0181-45f7-b070-b6c34ef7d8c2	1cfba3ed-a354-4232-8d05-a35df134e95b	Ide Daur Ulang Warga RT 01 3 RW 01	\N	Organik	APPROVED	\N	2026-07-29 04:54:12.522	2026-07-29 04:54:12.522
cfb390a4-2a64-4d4e-be0b-0b9f005b8626	13a8cc8d-80ad-4559-a301-ea7a8481f621	Ide Daur Ulang Warga RT 02 2 RW 01	\N	Organik	APPROVED	\N	2026-07-29 04:54:12.973	2026-07-29 04:54:12.973
\.


--
-- Data for Name: jadwal; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.jadwal (id, title, date, "time", category, location, dibuat_pada, diperbarui_pada, latitude, longitude, polygon, radius) FROM stdin;
e24bc4a2-d1ea-45e2-8b0a-196254e2b823	Kegiatan Sosialisasi 1	2026-07-25 04:54:14.503	09:00	Sosialisasi	Balai RW	2026-07-29 04:54:14.504	2026-07-29 04:54:14.504	-6.87300000	107.61800000	\N	100
3d850100-5263-45f2-ba04-3feec9c3391c	Kegiatan Sosialisasi 2	2026-07-20 04:54:14.612	09:00	Sosialisasi	Balai RW	2026-07-29 04:54:14.613	2026-07-29 04:54:14.613	-6.87500000	107.61900000	\N	100
25cc7461-2bfe-4cf4-a482-62a668178615	Kegiatan Sosialisasi 3	2026-07-26 04:54:14.675	09:00	Sosialisasi	Balai RW	2026-07-29 04:54:14.676	2026-07-29 04:54:14.676	-6.88500000	107.61700000	\N	100
90b57894-55d4-49f0-a6cf-a3cbcb6a4229	Kegiatan Sosialisasi 4	2026-07-26 04:54:14.777	09:00	Sosialisasi	Balai RW	2026-07-29 04:54:14.778	2026-07-29 04:54:14.778	-6.88700000	107.61800000	\N	100
00f9c463-2372-4573-8fd1-65f56c0cc868	Kegiatan Sosialisasi 5	2026-07-27 04:54:14.881	09:00	Sosialisasi	Balai RW	2026-07-29 04:54:14.883	2026-07-29 04:54:14.883	-6.89200000	107.61500000	\N	100
\.


--
-- Data for Name: jejak_audit; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.jejak_audit (id, action, id_pengguna, "timestamp", nilai_lama, nilai_baru) FROM stdin;
92d7039e-ed08-4656-a112-f2f42879f8ee	REQUEST_ACTIVATE_BIN	\N	2026-07-29 02:58:31.425	{"id": "7bf21c30-43b6-4004-bbef-0231478a42f5", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785293910753", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T02:58:30.780Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T02:58:30.780Z", "id_gelombang_qr": "ce10cccf-2ece-4a7a-bf38-7d3551d06cf2", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "7bf21c30-43b6-4004-bbef-0231478a42f5", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785293910753", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "7c9dbf7d-df4d-482b-bd9c-8f93d94ce33f", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T02:58:30.780Z", "longitude": "107.6105", "qrBatchId": "ce10cccf-2ece-4a7a-bf38-7d3551d06cf2", "updatedAt": "2026-07-29T02:58:31.401Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
e6dfc495-69fd-46bf-a80b-771337c2d8de	REQUEST_ACTIVATE_BIN	\N	2026-07-29 02:58:31.473	{"id": "429a9c3b-9669-48d0-9dc2-432e3d79f9ce", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785293910757", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T02:58:30.783Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T02:58:30.783Z", "id_gelombang_qr": "e4603ef2-aecd-4197-a021-8ec63abc88e2", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "429a9c3b-9669-48d0-9dc2-432e3d79f9ce", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785293910757", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "1dcb4d0c-73fd-4d5b-b58a-b645470338f6", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T02:58:30.783Z", "longitude": "107.6105", "qrBatchId": "e4603ef2-aecd-4197-a021-8ec63abc88e2", "updatedAt": "2026-07-29T02:58:31.450Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
e8a8925a-45de-465e-8ef8-88df10e02263	REQUEST_ACTIVATE_BIN	\N	2026-07-29 02:59:15.9	{"id": "8645a77f-cbe2-44af-852f-d06a9c1465b3", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785293955368", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T02:59:15.390Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T02:59:15.390Z", "id_gelombang_qr": "d5f0c322-c86d-4b63-8406-2966ac3307be", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "8645a77f-cbe2-44af-852f-d06a9c1465b3", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785293955368", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "a5b61c95-ab77-419d-bb67-3d439242343c", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T02:59:15.390Z", "longitude": "107.6105", "qrBatchId": "d5f0c322-c86d-4b63-8406-2966ac3307be", "updatedAt": "2026-07-29T02:59:15.873Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
33e2322c-bfd2-454e-b7df-bf354fc5ab3d	REQUEST_ACTIVATE_BIN	\N	2026-07-29 02:59:18.81	{"id": "2262bbb0-75fd-4f1e-9eb3-ac0535a179a5", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785293958405", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T02:59:18.422Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T02:59:18.422Z", "id_gelombang_qr": "e205ed4f-78e8-471e-81eb-85109e5b065f", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "2262bbb0-75fd-4f1e-9eb3-ac0535a179a5", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785293958405", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "3c05fe0f-0dec-430b-b4eb-b8e0dd999a4e", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T02:59:18.422Z", "longitude": "107.6105", "qrBatchId": "e205ed4f-78e8-471e-81eb-85109e5b065f", "updatedAt": "2026-07-29T02:59:18.783Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
d01d03e2-2689-4cee-b127-25fc1afbd0a6	REQUEST_ACTIVATE_BIN	\N	2026-07-29 03:00:02.592	{"id": "90f9a349-7f05-4a36-a411-9ef65918a126", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785294001609", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T03:00:01.683Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T03:00:01.683Z", "id_gelombang_qr": "4c7de4ea-5159-4056-9cfe-8a813e21b16f", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "90f9a349-7f05-4a36-a411-9ef65918a126", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785294001609", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "b50c7fac-3c41-4f0f-8d0b-cab84efe8efd", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T03:00:01.683Z", "longitude": "107.6105", "qrBatchId": "4c7de4ea-5159-4056-9cfe-8a813e21b16f", "updatedAt": "2026-07-29T03:00:02.539Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
e5e19615-518b-4115-b821-ebcacdfb8f0d	REQUEST_ACTIVATE_BIN	\N	2026-07-29 03:00:20.689	{"id": "175260fb-406a-453f-abeb-a973d88d98ee", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785294020340", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T03:00:20.356Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T03:00:20.356Z", "id_gelombang_qr": "4dda91b3-b6d2-4861-9ce5-a7a235e5d6da", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "175260fb-406a-453f-abeb-a973d88d98ee", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785294020340", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "a04f760c-706d-4b08-a1ea-0a0b3ea057d5", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T03:00:20.356Z", "longitude": "107.6105", "qrBatchId": "4dda91b3-b6d2-4861-9ce5-a7a235e5d6da", "updatedAt": "2026-07-29T03:00:20.675Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
8aa563ee-a4c5-42fe-ba62-27e0d83e8203	REQUEST_ACTIVATE_BIN	\N	2026-07-29 03:02:08.059	{"id": "72cea7d7-1649-4b6e-9672-4e2211317725", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785294127759", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T03:02:07.775Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T03:02:07.775Z", "id_gelombang_qr": "fa0ec35f-d446-4bd2-8792-26aa04f6c0f2", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "72cea7d7-1649-4b6e-9672-4e2211317725", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785294127759", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "c2ade38f-8c18-4cf5-bca6-8a2a2c54d8e4", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T03:02:07.775Z", "longitude": "107.6105", "qrBatchId": "fa0ec35f-d446-4bd2-8792-26aa04f6c0f2", "updatedAt": "2026-07-29T03:02:08.046Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
723a03af-9013-4ef6-a73a-4692baa03693	REQUEST_ACTIVATE_BIN	\N	2026-07-29 03:03:34.831	{"id": "eac067fb-1ad9-450a-ba71-a8e9446d78a8", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785294214346", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T03:03:34.366Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T03:03:34.366Z", "id_gelombang_qr": "edbf0c68-838d-4a19-a827-5241c0283237", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "eac067fb-1ad9-450a-ba71-a8e9446d78a8", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785294214346", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "6bb01e6f-3c2b-465b-b71f-c48d4272845f", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T03:03:34.366Z", "longitude": "107.6105", "qrBatchId": "edbf0c68-838d-4a19-a827-5241c0283237", "updatedAt": "2026-07-29T03:03:34.809Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
80fc35fa-7d07-45cd-9267-873ec21f6a3e	REQUEST_ACTIVATE_BIN	\N	2026-07-29 03:04:08.259	{"id": "7818ccf7-b1d7-4e19-ba63-f78991a6a949", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785294247959", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T03:04:07.973Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T03:04:07.973Z", "id_gelombang_qr": "7b648e7b-3f4f-41e6-8f31-83a41453037e", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "7818ccf7-b1d7-4e19-ba63-f78991a6a949", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785294247959", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "e952c111-767e-4178-872a-3ddeacbd313d", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T03:04:07.973Z", "longitude": "107.6105", "qrBatchId": "7b648e7b-3f4f-41e6-8f31-83a41453037e", "updatedAt": "2026-07-29T03:04:08.245Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
335f1284-3aa4-4205-b9eb-b539ac7bb497	REQUEST_ACTIVATE_BIN	\N	2026-07-29 03:17:24.741	{"id": "5b3a46cb-755f-4028-aa94-7a17720d9b4b", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785295044351", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T03:17:24.369Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T03:17:24.369Z", "id_gelombang_qr": "79880e92-3b4c-4d0b-85d8-8dad96790e49", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "5b3a46cb-755f-4028-aa94-7a17720d9b4b", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785295044351", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "d3e17d54-1cba-49e8-abd6-7aaebdc666ab", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T03:17:24.369Z", "longitude": "107.6105", "qrBatchId": "79880e92-3b4c-4d0b-85d8-8dad96790e49", "updatedAt": "2026-07-29T03:17:24.722Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
b5c60d6c-d262-40f2-8fb4-dc49d1f20502	REQUEST_ACTIVATE_BIN	\N	2026-07-29 03:22:59.549	{"id": "aed81158-06bd-402b-81d9-95788ebdbb68", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785295379204", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T03:22:59.221Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T03:22:59.221Z", "id_gelombang_qr": "566daa7e-65dd-4a55-9410-baa10b7808b1", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "aed81158-06bd-402b-81d9-95788ebdbb68", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785295379204", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "98371ceb-a11a-4aad-9eb5-0cf4b5748fda", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T03:22:59.221Z", "longitude": "107.6105", "qrBatchId": "566daa7e-65dd-4a55-9410-baa10b7808b1", "updatedAt": "2026-07-29T03:22:59.535Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
a09d126d-c761-4984-9da7-48e046b9fe35	REQUEST_ACTIVATE_BIN	\N	2026-07-29 03:26:46.895	{"id": "be9dbe94-3119-41ba-ac09-21956066ddb9", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785295606516", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T03:26:46.533Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T03:26:46.533Z", "id_gelombang_qr": "dcf8fa55-4fd5-4daa-9a5c-32be2375a1d3", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "be9dbe94-3119-41ba-ac09-21956066ddb9", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785295606516", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "0e6ff658-93c0-4999-8312-7e11084049b7", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T03:26:46.533Z", "longitude": "107.6105", "qrBatchId": "dcf8fa55-4fd5-4daa-9a5c-32be2375a1d3", "updatedAt": "2026-07-29T03:26:46.879Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
4946dac3-262f-4318-b634-77f88c63200b	REQUEST_ACTIVATE_BIN	\N	2026-07-29 03:30:17.299	{"id": "955b878d-6c05-4a26-85cc-d6fb7a84e8a1", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785295816632", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T03:30:16.656Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T03:30:16.656Z", "id_gelombang_qr": "b255ef5e-9f60-4fd5-b13c-90dd932e2245", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "955b878d-6c05-4a26-85cc-d6fb7a84e8a1", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785295816632", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "994951ca-5d7c-42ea-aebf-9c77f28c7c80", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T03:30:16.656Z", "longitude": "107.6105", "qrBatchId": "b255ef5e-9f60-4fd5-b13c-90dd932e2245", "updatedAt": "2026-07-29T03:30:17.269Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
843dbfee-4674-41d2-a104-2d43b2181815	REQUEST_ACTIVATE_BIN	\N	2026-07-29 03:32:53.433	{"id": "e7c86bd5-f149-49d2-ac1d-fb7a8b9c430e", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785295973071", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T03:32:53.089Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T03:32:53.089Z", "id_gelombang_qr": "1cb9531b-eb28-43e7-a889-e630d85bd095", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "e7c86bd5-f149-49d2-ac1d-fb7a8b9c430e", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785295973071", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "15264690-3a4d-4976-a9df-9351830e0a11", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T03:32:53.089Z", "longitude": "107.6105", "qrBatchId": "1cb9531b-eb28-43e7-a889-e630d85bd095", "updatedAt": "2026-07-29T03:32:53.413Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
1d1762cf-e732-4f91-8279-d44ebc4333bb	REQUEST_ACTIVATE_BIN	\N	2026-07-29 03:41:07.212	{"id": "c1000d75-da36-4973-b0ca-576e7829979c", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785296466919", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T03:41:06.933Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T03:41:06.933Z", "id_gelombang_qr": "73ecfc7f-5e1a-4f55-bb99-759b2fe07f10", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "c1000d75-da36-4973-b0ca-576e7829979c", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785296466919", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "57c069fc-6c87-4d3a-a13e-dcd3b949656f", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T03:41:06.933Z", "longitude": "107.6105", "qrBatchId": "73ecfc7f-5e1a-4f55-bb99-759b2fe07f10", "updatedAt": "2026-07-29T03:41:07.199Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
cea11767-ec2e-4cc5-b833-0d051bf7f08d	REQUEST_ACTIVATE_BIN	\N	2026-07-29 03:42:57.675	{"id": "e9f13589-ef89-433d-a000-afda91d053a0", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785296577262", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T03:42:57.280Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T03:42:57.280Z", "id_gelombang_qr": "e30659bb-580d-4cad-bcf6-d889427e4e89", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "e9f13589-ef89-433d-a000-afda91d053a0", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785296577262", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "2bc99578-5571-4e2f-a63b-69d39a70cf92", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T03:42:57.280Z", "longitude": "107.6105", "qrBatchId": "e30659bb-580d-4cad-bcf6-d889427e4e89", "updatedAt": "2026-07-29T03:42:57.655Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
37cdb987-0b51-484b-92c4-4c587416b7f9	REQUEST_ACTIVATE_BIN	\N	2026-07-29 03:44:08.582	{"id": "4872dfa8-7397-4c0e-9af5-96a2a71357a0", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785296648110", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T03:44:08.124Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T03:44:08.124Z", "id_gelombang_qr": "30849986-4590-4e12-8e22-ea2814d03e5e", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "4872dfa8-7397-4c0e-9af5-96a2a71357a0", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785296648110", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "8cb95896-2912-4a19-97f4-f6e139dba5fb", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T03:44:08.124Z", "longitude": "107.6105", "qrBatchId": "30849986-4590-4e12-8e22-ea2814d03e5e", "updatedAt": "2026-07-29T03:44:08.500Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
bbc46c10-1ead-44f0-8be5-d44ee39f12d4	REQUEST_ACTIVATE_BIN	\N	2026-07-29 03:46:42.184	{"id": "ea28e55f-1514-44a9-a7d1-6b90c7b53294", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785296801784", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T03:46:41.800Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T03:46:41.800Z", "id_gelombang_qr": "d84485c8-fca1-44b8-9ecc-1289f475e52e", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "ea28e55f-1514-44a9-a7d1-6b90c7b53294", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785296801784", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "12f051d0-77f6-4268-9991-e9ba3cf3c407", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T03:46:41.800Z", "longitude": "107.6105", "qrBatchId": "d84485c8-fca1-44b8-9ecc-1289f475e52e", "updatedAt": "2026-07-29T03:46:42.168Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
42cafee7-6104-471a-8578-d481d178fd06	REQUEST_ACTIVATE_BIN	\N	2026-07-29 03:52:11.751	{"id": "b050788a-0840-49cf-be77-da52d25681dd", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785297131217", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T03:52:11.233Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T03:52:11.233Z", "id_gelombang_qr": "33efe401-3b8e-4178-b8f5-9b665cd7cf73", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "b050788a-0840-49cf-be77-da52d25681dd", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785297131217", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "ac2ff771-3e1a-4fcc-800d-d2aced9f150c", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T03:52:11.233Z", "longitude": "107.6105", "qrBatchId": "33efe401-3b8e-4178-b8f5-9b665cd7cf73", "updatedAt": "2026-07-29T03:52:11.726Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
a85aa25a-82ed-4c74-81f3-9b368289a36e	REQUEST_ACTIVATE_BIN	\N	2026-07-29 03:54:52.833	{"id": "2d2d784d-ed3f-48b8-96b7-427e3f70ca0c", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785297292362", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T03:54:52.389Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T03:54:52.389Z", "id_gelombang_qr": "a092e5a6-d02f-48dc-8005-5ebf7de93b39", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "2d2d784d-ed3f-48b8-96b7-427e3f70ca0c", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785297292362", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "87970434-d100-48f4-9444-477ed2714638", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T03:54:52.389Z", "longitude": "107.6105", "qrBatchId": "a092e5a6-d02f-48dc-8005-5ebf7de93b39", "updatedAt": "2026-07-29T03:54:52.818Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
eb68c595-f3b0-45bd-be21-04f08fca427a	REQUEST_ACTIVATE_BIN	e29ea3d7-5144-4f18-b798-893c5f508119	2026-07-29 03:59:06.798	{"id": "83eb9dd7-b586-447a-87e1-571e6fe2346d", "lebar": null, "bentuk": null, "status": "PRINTED", "tinggi": null, "kode_qr": "ORG-TEST-1785297546452", "panjang": null, "diameter": null, "id_rt_rw": 1, "latitude": null, "longitude": null, "tipe_wadah": null, "dibuat_pada": "2026-07-29T03:59:06.472Z", "id_kategori": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "id_pengguna": null, "id_kelurahan": null, "diperbarui_pada": "2026-07-29T03:59:06.472Z", "id_gelombang_qr": "9bb806b6-03f1-4a52-a2d3-121768c410c8", "maks_kapasitas_liter": "25", "volume_sekarang_liter": "0", "id_mahasiswa_pendaftar": null}	{"id": "83eb9dd7-b586-447a-87e1-571e6fe2346d", "shape": null, "width": null, "height": null, "length": null, "qrCode": "ORG-TEST-1785297546452", "rtRwId": 1, "status": "ACTIVE_BOUND", "userId": "e29ea3d7-5144-4f18-b798-893c5f508119", "binType": null, "diameter": null, "latitude": "-6.88923", "createdAt": "2026-07-29T03:59:06.472Z", "longitude": "107.6105", "qrBatchId": "9bb806b6-03f1-4a52-a2d3-121768c410c8", "updatedAt": "2026-07-29T03:59:06.784Z", "categoryId": "89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6", "kelurahanId": null, "maxCapacityLiter": "25", "currentVolumeLiter": "0", "registeredByStudentId": null}
\.


--
-- Data for Name: kabar_sosial; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.kabar_sosial (id, tipe, deskripsi, id_pengguna, id_entitas, "timestamp") FROM stdin;
\.


--
-- Data for Name: kategori_sampah; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.kategori_sampah (id, nama, poin_per_kg, description, dibuat_pada, diperbarui_pada) FROM stdin;
89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	Organik	10	Sisa makanan & organik basah	2026-07-29 02:57:44.483	2026-07-29 02:57:44.483
3132d7fe-07fb-4787-9857-c1e9f6602104	Anorganik	15	Plastik, kertas, logam, dll	2026-07-29 02:57:44.497	2026-07-29 02:57:44.497
198a35ad-0023-4410-9f39-aa01a321ec87	Residu	0	\N	2026-07-29 04:20:29.681	2026-07-29 04:20:29.681
\.


--
-- Data for Name: kehadiran_kegiatan; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.kehadiran_kegiatan (id, id_mahasiswa, id_jadwal, waktu_absen, metode, latitude, longitude, waktu_checkout, status) FROM stdin;
05213e78-c738-45b2-87c8-333c19e2775c	549e72c8-63c9-476a-b790-f2d253b57474	e24bc4a2-d1ea-45e2-8b0a-196254e2b823	2026-07-29 04:54:14.512	GPS	-6.87292691	107.61803779	\N	DALAM_RADIUS
708d7a47-2fb4-4710-85ad-b3b76d1592d8	83b09660-3137-4845-9d4c-83789cd9e001	e24bc4a2-d1ea-45e2-8b0a-196254e2b823	2026-07-29 04:54:14.523	GPS	-6.87293080	107.61807846	\N	DALAM_RADIUS
466748ca-91fd-4c8d-8682-a506eacefd0b	5d41a2e9-5d95-4d98-9b31-c87eb6a0a437	e24bc4a2-d1ea-45e2-8b0a-196254e2b823	2026-07-29 04:54:14.53	GPS	-6.87296689	107.61809138	\N	DALAM_RADIUS
6c4b804a-3b61-4049-a86c-5b326498a88e	cf200a2a-ff22-45f5-a2bc-e670f4b15c86	e24bc4a2-d1ea-45e2-8b0a-196254e2b823	2026-07-29 04:54:14.541	GPS	-6.87292793	107.61800905	\N	DALAM_RADIUS
3da093a6-ee04-4589-856a-f6899d2e40af	c26fc2fd-15c0-4288-b1cb-1455aca58314	e24bc4a2-d1ea-45e2-8b0a-196254e2b823	2026-07-29 04:54:14.551	GPS	-6.87299306	107.61805190	\N	DALAM_RADIUS
b7be436f-c9d8-4f17-be44-efa0f2e45faf	788ae2c4-6324-4eff-938e-64d844d8176f	e24bc4a2-d1ea-45e2-8b0a-196254e2b823	2026-07-29 04:54:14.561	GPS	-6.87290060	107.61808429	\N	DALAM_RADIUS
5c3e88d0-c210-4be7-881b-d081fb49309b	45f36c56-fa50-413e-9d3e-4d478279a348	e24bc4a2-d1ea-45e2-8b0a-196254e2b823	2026-07-29 04:54:14.569	GPS	-6.87293127	107.61809210	\N	DALAM_RADIUS
ff5c52e5-a7aa-43bb-b396-2f12404b238b	4fe7f457-6335-4192-b869-4e3b16e2c3f8	e24bc4a2-d1ea-45e2-8b0a-196254e2b823	2026-07-29 04:54:14.576	GPS	-6.87293633	107.61803848	\N	DALAM_RADIUS
da434dc8-882a-4fe1-8b64-3fa6fdfadce6	ccdac479-5fca-43bc-9adc-c47baa106f29	e24bc4a2-d1ea-45e2-8b0a-196254e2b823	2026-07-29 04:54:14.583	GPS	-6.87291842	107.61801229	\N	DALAM_RADIUS
1064b99d-7a4f-40cb-abdd-e3fda60b4b29	0df98491-a706-4304-910b-04994dad1d30	e24bc4a2-d1ea-45e2-8b0a-196254e2b823	2026-07-29 04:54:14.59	GPS	-6.87295944	107.61805780	\N	DALAM_RADIUS
255354f8-f815-4374-9028-51d6c628a28d	d6c83ff1-1b9d-4617-a603-ec16a407cb97	e24bc4a2-d1ea-45e2-8b0a-196254e2b823	2026-07-29 04:54:14.598	GPS	-6.87299825	107.61803504	\N	DALAM_RADIUS
7e384909-aebc-4e4a-a9c5-695da6c4cb12	a72e03f8-20b2-47e4-bce5-530eb6f81d0c	e24bc4a2-d1ea-45e2-8b0a-196254e2b823	2026-07-29 04:54:14.606	GPS	-6.87294962	107.61804105	\N	DALAM_RADIUS
48ffdec0-d08f-4a2b-9799-ad0d052e6c9d	549e72c8-63c9-476a-b790-f2d253b57474	3d850100-5263-45f2-ba04-3feec9c3391c	2026-07-29 04:54:14.621	GPS	-6.87499141	107.61906257	\N	DALAM_RADIUS
3a9b3069-e938-44f7-a238-d27112d6d97b	c26fc2fd-15c0-4288-b1cb-1455aca58314	3d850100-5263-45f2-ba04-3feec9c3391c	2026-07-29 04:54:14.629	GPS	-6.87491638	107.61905830	\N	DALAM_RADIUS
043d8a15-5641-4326-89e7-450fb8d50fd3	d431945f-6df0-48e4-b67d-5cfde21059ed	3d850100-5263-45f2-ba04-3feec9c3391c	2026-07-29 04:54:14.637	GPS	-6.87497396	107.61905055	\N	DALAM_RADIUS
7241b084-78b3-480e-9654-2b0feed97783	b630466b-dcea-4b96-9c13-46e2197b0f9c	3d850100-5263-45f2-ba04-3feec9c3391c	2026-07-29 04:54:14.643	GPS	-6.87498250	107.61907322	\N	DALAM_RADIUS
0c510d9e-115a-4675-85b5-ab0397b5399d	f5abb400-3f37-4e3e-9e13-8c79fd09cc1b	3d850100-5263-45f2-ba04-3feec9c3391c	2026-07-29 04:54:14.65	GPS	-6.87494262	107.61901084	\N	DALAM_RADIUS
4920d83d-918a-4c4e-bb8b-a95a1644e1e3	4fe7f457-6335-4192-b869-4e3b16e2c3f8	3d850100-5263-45f2-ba04-3feec9c3391c	2026-07-29 04:54:14.658	GPS	-6.87490306	107.61900823	\N	DALAM_RADIUS
c2606498-bba2-4ba8-847a-ce66764a2299	ccdac479-5fca-43bc-9adc-c47baa106f29	3d850100-5263-45f2-ba04-3feec9c3391c	2026-07-29 04:54:14.664	GPS	-6.87499256	107.61904784	\N	DALAM_RADIUS
f5d25bef-6dd4-4e1a-aed3-a05b01661f13	d6c83ff1-1b9d-4617-a603-ec16a407cb97	3d850100-5263-45f2-ba04-3feec9c3391c	2026-07-29 04:54:14.67	GPS	-6.87491576	107.61904328	\N	DALAM_RADIUS
c2976fca-dcc2-4163-a503-2c1e6e37c622	549e72c8-63c9-476a-b790-f2d253b57474	25cc7461-2bfe-4cf4-a482-62a668178615	2026-07-29 04:54:14.683	GPS	-6.88498800	107.61700416	\N	DALAM_RADIUS
858ff2c4-4360-4b26-adc6-430f75cfa7ec	fcc7bf14-8b4c-4893-9089-a35d9e8f3cff	25cc7461-2bfe-4cf4-a482-62a668178615	2026-07-29 04:54:14.689	GPS	-6.88491632	107.61709903	\N	DALAM_RADIUS
f1ce292d-1a04-40c2-b29c-02e64c2093a5	cf200a2a-ff22-45f5-a2bc-e670f4b15c86	25cc7461-2bfe-4cf4-a482-62a668178615	2026-07-29 04:54:14.695	GPS	-6.88498045	107.61703240	\N	DALAM_RADIUS
ff9bca24-693a-40c1-8ad2-d31bed84822a	788ae2c4-6324-4eff-938e-64d844d8176f	25cc7461-2bfe-4cf4-a482-62a668178615	2026-07-29 04:54:14.702	GPS	-6.88499188	107.61701535	\N	DALAM_RADIUS
1db92bd3-39d8-4a78-966f-c6bd3e2d5691	45f36c56-fa50-413e-9d3e-4d478279a348	25cc7461-2bfe-4cf4-a482-62a668178615	2026-07-29 04:54:14.71	GPS	-6.88497825	107.61709768	\N	DALAM_RADIUS
4c9118f8-170a-4744-9b80-6f20705791c3	967f0e9d-35d1-4b1e-9fc8-97f27e3ee3ab	25cc7461-2bfe-4cf4-a482-62a668178615	2026-07-29 04:54:14.716	GPS	-6.88496314	107.61701801	\N	DALAM_RADIUS
8bebc1ef-38d5-4474-b5a9-e2786fd9572f	5fa6b2fd-21c4-474c-8f79-088e1ffb1e96	25cc7461-2bfe-4cf4-a482-62a668178615	2026-07-29 04:54:14.722	GPS	-6.88493772	107.61706535	\N	DALAM_RADIUS
b002b0c4-b6bb-4bed-a162-3e5c7856085c	9ba9db61-7c43-4765-9f1b-7fa8b5e47d56	25cc7461-2bfe-4cf4-a482-62a668178615	2026-07-29 04:54:14.728	GPS	-6.88496720	107.61701150	\N	DALAM_RADIUS
254beee5-30aa-4f0b-81e1-17af6f704f17	f5abb400-3f37-4e3e-9e13-8c79fd09cc1b	25cc7461-2bfe-4cf4-a482-62a668178615	2026-07-29 04:54:14.734	GPS	-6.88493387	107.61705328	\N	DALAM_RADIUS
794f79bc-fecb-4891-9f43-f53190baee27	4fe7f457-6335-4192-b869-4e3b16e2c3f8	25cc7461-2bfe-4cf4-a482-62a668178615	2026-07-29 04:54:14.741	GPS	-6.88493893	107.61709678	\N	DALAM_RADIUS
bef64492-56a0-44b3-b7be-9144bec62788	ccdac479-5fca-43bc-9adc-c47baa106f29	25cc7461-2bfe-4cf4-a482-62a668178615	2026-07-29 04:54:14.749	GPS	-6.88493160	107.61702075	\N	DALAM_RADIUS
9726ad81-4e60-47f8-93cf-48febd4ead1e	0df98491-a706-4304-910b-04994dad1d30	25cc7461-2bfe-4cf4-a482-62a668178615	2026-07-29 04:54:14.755	GPS	-6.88492230	107.61703330	\N	DALAM_RADIUS
371d7067-2fb6-4b79-9ad7-cb3f059c0065	0e33475b-de22-4d41-890a-27bbf5494046	25cc7461-2bfe-4cf4-a482-62a668178615	2026-07-29 04:54:14.764	GPS	-6.88490341	107.61707921	\N	DALAM_RADIUS
128f368a-ae27-478d-a832-b0fa13521d9c	d6c83ff1-1b9d-4617-a603-ec16a407cb97	25cc7461-2bfe-4cf4-a482-62a668178615	2026-07-29 04:54:14.771	GPS	-6.88498155	107.61706310	\N	DALAM_RADIUS
a25f611e-5e6e-4c57-abc4-94fdac73ed35	549e72c8-63c9-476a-b790-f2d253b57474	90b57894-55d4-49f0-a6cf-a3cbcb6a4229	2026-07-29 04:54:14.786	GPS	-6.88692946	107.61806301	\N	DALAM_RADIUS
35832767-4709-449b-8e34-ee82d917b3c9	83b09660-3137-4845-9d4c-83789cd9e001	90b57894-55d4-49f0-a6cf-a3cbcb6a4229	2026-07-29 04:54:14.795	GPS	-6.88693500	107.61807254	\N	DALAM_RADIUS
9a9ee260-d430-4b87-8012-8b7eeb5188c9	5d41a2e9-5d95-4d98-9b31-c87eb6a0a437	90b57894-55d4-49f0-a6cf-a3cbcb6a4229	2026-07-29 04:54:14.803	GPS	-6.88699323	107.61804298	\N	DALAM_RADIUS
3ada361f-7e51-456a-af4b-ba70c0900acf	cf200a2a-ff22-45f5-a2bc-e670f4b15c86	90b57894-55d4-49f0-a6cf-a3cbcb6a4229	2026-07-29 04:54:14.81	GPS	-6.88697053	107.61808462	\N	DALAM_RADIUS
f137b4e0-4fef-44fd-9236-6ccfcbbe6393	c26fc2fd-15c0-4288-b1cb-1455aca58314	90b57894-55d4-49f0-a6cf-a3cbcb6a4229	2026-07-29 04:54:14.818	GPS	-6.88694022	107.61807701	\N	DALAM_RADIUS
d11daeaf-5476-4ffd-b212-de9320136ee0	45f36c56-fa50-413e-9d3e-4d478279a348	90b57894-55d4-49f0-a6cf-a3cbcb6a4229	2026-07-29 04:54:14.824	GPS	-6.88694739	107.61804980	\N	DALAM_RADIUS
562ed9f7-a8ac-48b7-bffd-3e69ca92f176	b630466b-dcea-4b96-9c13-46e2197b0f9c	90b57894-55d4-49f0-a6cf-a3cbcb6a4229	2026-07-29 04:54:14.83	GPS	-6.88693496	107.61806808	\N	DALAM_RADIUS
d797500d-fa3c-439d-b3f5-e1e6580b723c	967f0e9d-35d1-4b1e-9fc8-97f27e3ee3ab	90b57894-55d4-49f0-a6cf-a3cbcb6a4229	2026-07-29 04:54:14.836	GPS	-6.88696807	107.61802680	\N	DALAM_RADIUS
447e2b0b-cb30-4642-8487-af4b4bc8be5c	9ba9db61-7c43-4765-9f1b-7fa8b5e47d56	90b57894-55d4-49f0-a6cf-a3cbcb6a4229	2026-07-29 04:54:14.844	GPS	-6.88694993	107.61803396	\N	DALAM_RADIUS
9f30cc79-2487-4cad-86c1-773703adc3de	f5abb400-3f37-4e3e-9e13-8c79fd09cc1b	90b57894-55d4-49f0-a6cf-a3cbcb6a4229	2026-07-29 04:54:14.852	GPS	-6.88699453	107.61804456	\N	DALAM_RADIUS
80a99237-e253-4c08-b947-21be80a46faf	ccdac479-5fca-43bc-9adc-c47baa106f29	90b57894-55d4-49f0-a6cf-a3cbcb6a4229	2026-07-29 04:54:14.863	GPS	-6.88698434	107.61809487	\N	DALAM_RADIUS
0e0521a1-db77-492b-a217-7c0b9087c4b1	0e33475b-de22-4d41-890a-27bbf5494046	90b57894-55d4-49f0-a6cf-a3cbcb6a4229	2026-07-29 04:54:14.872	GPS	-6.88697176	107.61800719	\N	DALAM_RADIUS
948e563f-43d1-4af6-829a-0fe789f95042	549e72c8-63c9-476a-b790-f2d253b57474	00f9c463-2372-4573-8fd1-65f56c0cc868	2026-07-29 04:54:14.898	GPS	-6.89191454	107.61500767	\N	DALAM_RADIUS
f5e1f408-eea6-418b-a63b-e356e933f77d	5d41a2e9-5d95-4d98-9b31-c87eb6a0a437	00f9c463-2372-4573-8fd1-65f56c0cc868	2026-07-29 04:54:14.906	GPS	-6.89198168	107.61506249	\N	DALAM_RADIUS
0eaf1612-20f6-4737-8ab8-ad7e18b4e7f3	cf200a2a-ff22-45f5-a2bc-e670f4b15c86	00f9c463-2372-4573-8fd1-65f56c0cc868	2026-07-29 04:54:14.914	GPS	-6.89198310	107.61506820	\N	DALAM_RADIUS
77ee2838-dfb9-49c3-808b-efa1971f8639	c26fc2fd-15c0-4288-b1cb-1455aca58314	00f9c463-2372-4573-8fd1-65f56c0cc868	2026-07-29 04:54:14.921	GPS	-6.89194559	107.61504820	\N	DALAM_RADIUS
5f290cfc-c21d-4113-b9f4-65b09ab5bfef	d431945f-6df0-48e4-b67d-5cfde21059ed	00f9c463-2372-4573-8fd1-65f56c0cc868	2026-07-29 04:54:14.928	GPS	-6.89192830	107.61503886	\N	DALAM_RADIUS
b8e74cd4-564f-48f1-8f61-2ea427f68773	45f36c56-fa50-413e-9d3e-4d478279a348	00f9c463-2372-4573-8fd1-65f56c0cc868	2026-07-29 04:54:14.934	GPS	-6.89198941	107.61503486	\N	DALAM_RADIUS
8da1077a-b0f7-4891-b6a2-c88a08966ed1	967f0e9d-35d1-4b1e-9fc8-97f27e3ee3ab	00f9c463-2372-4573-8fd1-65f56c0cc868	2026-07-29 04:54:14.94	GPS	-6.89196227	107.61506910	\N	DALAM_RADIUS
cb9fc637-ee80-4c10-8436-67eaa5505f8b	9ba9db61-7c43-4765-9f1b-7fa8b5e47d56	00f9c463-2372-4573-8fd1-65f56c0cc868	2026-07-29 04:54:14.947	GPS	-6.89197959	107.61509967	\N	DALAM_RADIUS
b3234f7d-af4b-4366-a96b-9db493b8c9a5	ccdac479-5fca-43bc-9adc-c47baa106f29	00f9c463-2372-4573-8fd1-65f56c0cc868	2026-07-29 04:54:14.954	GPS	-6.89193820	107.61501680	\N	DALAM_RADIUS
6e3ef1f4-9d90-4052-b72d-49935dc7db6e	0df98491-a706-4304-910b-04994dad1d30	00f9c463-2372-4573-8fd1-65f56c0cc868	2026-07-29 04:54:14.96	GPS	-6.89199625	107.61507059	\N	DALAM_RADIUS
787e0e54-209b-481b-ac6a-c0c289d9eefc	d6c83ff1-1b9d-4617-a603-ec16a407cb97	00f9c463-2372-4573-8fd1-65f56c0cc868	2026-07-29 04:54:14.967	GPS	-6.89194049	107.61503826	\N	DALAM_RADIUS
0818bc2c-0f76-4548-93f2-59cea29ca0c2	a72e03f8-20b2-47e4-bce5-530eb6f81d0c	00f9c463-2372-4573-8fd1-65f56c0cc868	2026-07-29 04:54:14.974	GPS	-6.89198254	107.61503743	\N	DALAM_RADIUS
\.


--
-- Data for Name: kelompok_kkn; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.kelompok_kkn (id, nama, id_dpl, dibuat_pada, diperbarui_pada) FROM stdin;
\.


--
-- Data for Name: kelurahan; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.kelurahan (id, nama, dibuat_pada, diperbarui_pada) FROM stdin;
638442b9-98e9-40b2-8e69-dee107033fb9	Dago	2026-07-29 02:57:44.439	2026-07-29 02:57:44.439
9fc191ff-c633-4482-83b4-4ef16b909d33	Sadang Serang	2026-07-29 02:57:44.456	2026-07-29 02:57:44.456
52097faa-3960-45a6-88d3-976cf944c20d	Sekeloa	2026-07-29 04:20:29.717	2026-07-29 04:20:29.717
b8e7fa19-03fa-4a5c-989d-f9b07cb5898a	Lebak Gede	2026-07-29 04:20:29.733	2026-07-29 04:20:29.733
b6ae63ae-2da0-401b-b653-2ded1781e71c	Lebak Siliwangi	2026-07-29 04:20:29.745	2026-07-29 04:20:29.745
fc1f906d-fb00-45cb-8cb2-532859af4328	Cipaganti	2026-07-29 04:20:29.765	2026-07-29 04:20:29.765
\.


--
-- Data for Name: kepemilikan_tong; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.kepemilikan_tong (id, id_tong, id_pengguna, tipe_kepemilikan, dibuat_pada) FROM stdin;
\.


--
-- Data for Name: kode_otp; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.kode_otp (id, phone, code, kedaluwarsa_pada, dibuat_pada, used) FROM stdin;
\.


--
-- Data for Name: konfigurasi_sistem; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.konfigurasi_sistem (key, value, tipe, deskripsi, diperbarui_oleh, diperbarui_pada) FROM stdin;
ai_confidence_threshold	90	number	Threshold AI confidence score (0-100)	\N	2026-07-29 02:46:30.965
bin_fullness_trigger_wa	80	number	Threshold persentase kapasitas tong penuh untuk trigger notifikasi	\N	2026-07-29 02:46:30.965
organic_point_multiplier	2.0	number	Multiplier poin untuk sampah organik	\N	2026-07-29 02:46:30.965
nonorganic_point_multiplier	1.5	number	Multiplier poin untuk sampah non-organik	\N	2026-07-29 02:46:30.965
residu_penalty_multiplier	-1.0	number	Penalty multiplier untuk residu campur	\N	2026-07-29 02:46:30.965
reporting_window_morning_start	06:00	string	Mulai window pelaporan pagi petugas	\N	2026-07-29 02:46:30.965
reporting_window_morning_end	08:00	string	Selesai window pelaporan pagi petugas	\N	2026-07-29 02:46:30.965
reporting_window_evening_start	16:00	string	Mulai window pelaporan sore petugas	\N	2026-07-29 02:46:30.965
reporting_window_evening_end	18:00	string	Selesai window pelaporan sore petugas	\N	2026-07-29 02:46:30.965
late_report_kpi_penalty_percent	15	number	Persentase potongan skor KPI jika telat melapor	\N	2026-07-29 02:46:30.965
kkn_max_assignment_per_student	20	number	Batas maksimal rumah tangga per mahasiswa KKN	\N	2026-07-29 02:46:30.965
dispatch_radius_km	2	number	Radius penugasan on-demand petugas residu (KM)	\N	2026-07-29 02:46:30.965
streak_bonus_days	5	number	Jumlah hari berturut-turut untuk bonus streak	\N	2026-07-29 02:46:30.965
streak_bonus_points	10	number	Bonus poin streak warga tambahan	\N	2026-07-29 02:46:30.965
idea_approval_points	50	number	Poin untuk ide daur ulang yang disetujui	\N	2026-07-29 02:46:30.965
emission_factor_metana	0.05	number	Faktor emisi metana yang dihindari (kgCO2e per kg)	\N	2026-07-29 02:46:30.965
DEFAULT_BIN_CAPACITY	25.0	number	Default bin capacity in liters	\N	2026-07-29 02:57:44.761
\.


--
-- Data for Name: lokasi_mahasiswa; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.lokasi_mahasiswa (id, id_mahasiswa, latitude, longitude, direkam_pada) FROM stdin;
\.


--
-- Data for Name: mahasiswa_kkn; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.mahasiswa_kkn (id, id_pengguna, nim, jurusan, fakultas, no_wa, tanggal_mulai, tanggal_selesai, id_poligon_ditugaskan, status_whitelist, dibuat_pada, diperbarui_pada, id_kelompok, skor_penilaian_dpl) FROM stdin;
5ed1360b-0913-4dfe-8af9-e6eeb01b0670	549e72c8-63c9-476a-b790-f2d253b57474	NIM1005	Pembangunan	ITB	0812001005	2026-07-29 04:54:06.927	2026-08-28 04:54:06.927	3	APPROVED	2026-07-29 04:54:06.93	2026-07-29 04:54:06.93	\N	0.00
c14d69b9-4fe3-4501-9dc1-d3620f224bf8	83b09660-3137-4845-9d4c-83789cd9e001	NIM1006	Pembangunan	ITB	0812001006	2026-07-29 04:54:06.954	2026-08-28 04:54:06.954	3	APPROVED	2026-07-29 04:54:06.955	2026-07-29 04:54:06.955	\N	0.00
9a5aea2e-931c-4c5b-8f49-74836cab8d6b	fcc7bf14-8b4c-4893-9089-a35d9e8f3cff	NIM1011	Pembangunan	ITB	0812001011	2026-07-29 04:54:07.009	2026-08-28 04:54:07.009	4	APPROVED	2026-07-29 04:54:07.01	2026-07-29 04:54:07.01	\N	0.00
f27beb7d-16cc-480b-96f7-ddd26f983e0a	5d41a2e9-5d95-4d98-9b31-c87eb6a0a437	NIM1012	Pembangunan	ITB	0812001012	2026-07-29 04:54:07.029	2026-08-28 04:54:07.029	4	APPROVED	2026-07-29 04:54:07.03	2026-07-29 04:54:07.03	\N	0.00
70d0d158-aad3-4a82-9945-c7ed8c150b66	cf200a2a-ff22-45f5-a2bc-e670f4b15c86	NIM1017	Pembangunan	ITB	0812001017	2026-07-29 04:54:07.086	2026-08-28 04:54:07.086	5	APPROVED	2026-07-29 04:54:07.087	2026-07-29 04:54:07.087	\N	0.00
09b629ed-54bb-4629-a4fc-b10a1bda5177	c26fc2fd-15c0-4288-b1cb-1455aca58314	NIM1018	Pembangunan	ITB	0812001018	2026-07-29 04:54:07.11	2026-08-28 04:54:07.11	5	APPROVED	2026-07-29 04:54:07.111	2026-07-29 04:54:07.111	\N	0.00
432f37e5-f999-4fc9-a2c5-baee885d73d1	d431945f-6df0-48e4-b67d-5cfde21059ed	NIM1023	Pembangunan	ITB	0812001023	2026-07-29 04:54:07.196	2026-08-28 04:54:07.196	6	APPROVED	2026-07-29 04:54:07.197	2026-07-29 04:54:07.197	\N	0.00
fc39aa00-942c-478d-b1e9-c62ec9d28608	788ae2c4-6324-4eff-938e-64d844d8176f	NIM1024	Pembangunan	ITB	0812001024	2026-07-29 04:54:07.304	2026-08-28 04:54:07.304	6	APPROVED	2026-07-29 04:54:07.305	2026-07-29 04:54:07.305	\N	0.00
8ab549a8-613c-440f-8161-c6e2f059cc7f	45f36c56-fa50-413e-9d3e-4d478279a348	NIM1029	Pembangunan	ITB	0812001029	2026-07-29 04:54:07.386	2026-08-28 04:54:07.386	7	APPROVED	2026-07-29 04:54:07.387	2026-07-29 04:54:07.387	\N	0.00
36afef8e-d57b-4f57-9cb4-fd112d01522c	b630466b-dcea-4b96-9c13-46e2197b0f9c	NIM1030	Pembangunan	ITB	0812001030	2026-07-29 04:54:07.411	2026-08-28 04:54:07.411	7	APPROVED	2026-07-29 04:54:07.412	2026-07-29 04:54:07.412	\N	0.00
b5da6e6a-0b36-4411-8f74-30c643f1cf2f	967f0e9d-35d1-4b1e-9fc8-97f27e3ee3ab	NIM1035	Pembangunan	ITB	0812001035	2026-07-29 04:54:07.477	2026-08-28 04:54:07.477	8	APPROVED	2026-07-29 04:54:07.478	2026-07-29 04:54:07.478	\N	0.00
0ffe9676-bd09-45d3-bbfe-51bd39d5c67e	5fa6b2fd-21c4-474c-8f79-088e1ffb1e96	NIM1036	Pembangunan	ITB	0812001036	2026-07-29 04:54:07.501	2026-08-28 04:54:07.501	8	APPROVED	2026-07-29 04:54:07.502	2026-07-29 04:54:07.502	\N	0.00
126df83b-4858-4a33-bc4e-b942720e8d2c	9ba9db61-7c43-4765-9f1b-7fa8b5e47d56	NIM1041	Pembangunan	ITB	0812001041	2026-07-29 04:54:07.574	2026-08-28 04:54:07.574	9	APPROVED	2026-07-29 04:54:07.576	2026-07-29 04:54:07.576	\N	0.00
0e93407d-7161-4ab6-af31-f0cffa784ec6	f5abb400-3f37-4e3e-9e13-8c79fd09cc1b	NIM1042	Pembangunan	ITB	0812001042	2026-07-29 04:54:07.598	2026-08-28 04:54:07.598	9	APPROVED	2026-07-29 04:54:07.599	2026-07-29 04:54:07.599	\N	0.00
b86a98fd-2aaa-499f-9fa7-b6f5fc4d910b	4fe7f457-6335-4192-b869-4e3b16e2c3f8	NIM1047	Pembangunan	ITB	0812001047	2026-07-29 04:54:07.669	2026-08-28 04:54:07.669	10	APPROVED	2026-07-29 04:54:07.671	2026-07-29 04:54:07.671	\N	0.00
4181e614-3564-46d8-8a26-a865722fc280	ccdac479-5fca-43bc-9adc-c47baa106f29	NIM1048	Pembangunan	ITB	0812001048	2026-07-29 04:54:07.694	2026-08-28 04:54:07.694	10	APPROVED	2026-07-29 04:54:07.695	2026-07-29 04:54:07.695	\N	0.00
288713eb-ebbb-4ff2-a8f8-3050749d4e11	0df98491-a706-4304-910b-04994dad1d30	NIM1053	Pembangunan	ITB	0812001053	2026-07-29 04:54:07.762	2026-08-28 04:54:07.762	11	APPROVED	2026-07-29 04:54:07.763	2026-07-29 04:54:07.763	\N	0.00
c0276f5f-7b6d-4364-86c4-9d55655e2ec7	0e33475b-de22-4d41-890a-27bbf5494046	NIM1054	Pembangunan	ITB	0812001054	2026-07-29 04:54:07.795	2026-08-28 04:54:07.795	11	APPROVED	2026-07-29 04:54:07.796	2026-07-29 04:54:07.796	\N	0.00
ab1f34c3-b853-42dd-aed8-9bc6c16f0a8d	d6c83ff1-1b9d-4617-a603-ec16a407cb97	NIM1059	Pembangunan	ITB	0812001059	2026-07-29 04:54:07.875	2026-08-28 04:54:07.875	12	APPROVED	2026-07-29 04:54:07.876	2026-07-29 04:54:07.876	\N	0.00
82a9d639-2fbd-4f1f-a560-fb68c948146f	a72e03f8-20b2-47e4-bce5-530eb6f81d0c	NIM1060	Pembangunan	ITB	0812001060	2026-07-29 04:54:07.9	2026-08-28 04:54:07.9	12	APPROVED	2026-07-29 04:54:07.901	2026-07-29 04:54:07.901	\N	0.00
\.


--
-- Data for Name: notifikasi; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.notifikasi (id, id_pengguna, title, message, sudah_dibaca, dibuat_pada) FROM stdin;
0c5556d9-74b4-45e5-bf6f-fba0ae436ed0	e29ea3d7-5144-4f18-b798-893c5f508119	Peringatan Pemilahan Sampah	Ditemukan ketidakpatuhan pemilahan sampah (RESIDU_MIXED_ORGANIC) dengan tingkat keparahan MEDIUM. Poin Anda dipotong 2. Harap pilah sampah dengan benar demi kelestarian lingkungan.	f	2026-07-29 03:59:06.899
\.


--
-- Data for Name: pelanggaran; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.pelanggaran (id, id_pengguna, id_tong, id_pengguna_petugas, type, severity, url_foto_bukti, notes, poin_dikurangi, dibuat_pada) FROM stdin;
b3adebc4-cd7d-4db8-a273-dc1bdc4e9f1e	e29ea3d7-5144-4f18-b798-893c5f508119	\N	4bf677e7-92f2-4ff4-9dd7-0f68f1b8cd09	RESIDU_MIXED_ORGANIC	MEDIUM	/uploads/violation_test.jpg	Ditemukan plastik tercampur dalam tong organik	2	2026-07-29 03:59:06.89
\.


--
-- Data for Name: pemanfaatan_sampah; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.pemanfaatan_sampah (id, id_rw, nomor_cara_pemanfaatan, program, teknologi, bahan_baku, volume_bahan_baku, unit_bahan_baku, hasil, unit_hasil, foto_dokumentasi_url, tanggal_pencatatan, dibuat_pada) FROM stdin;
b90f87dc-777f-4192-a01c-c60cbaa749be	3	PMF-3-536	Bank Sampah	Kompos	Organik	68.51	Kg	39.91	Kg	https://dummyimage.com/600x400/000/fff&text=Pemanfaatan	2026-07-29 04:54:13.206	2026-07-29 04:54:13.207
75872f0c-0533-402f-b3e2-5116c04ecc3e	4	PMF-4-822	Bank Sampah	Kompos	Organik	68.82	Kg	20.42	Kg	https://dummyimage.com/600x400/000/fff&text=Pemanfaatan	2026-07-29 04:54:13.389	2026-07-29 04:54:13.39
15b37982-cf67-4c3a-92d2-9dfc8f2be8d0	5	PMF-5-330	Bank Sampah	Kompos	Organik	62.59	Kg	27.76	Kg	https://dummyimage.com/600x400/000/fff&text=Pemanfaatan	2026-07-29 04:54:13.559	2026-07-29 04:54:13.56
282c71f3-14b5-4c5f-b3be-9b42ddad3c43	6	PMF-6-221	Bank Sampah	Kompos	Organik	94.96	Kg	34.24	Kg	https://dummyimage.com/600x400/000/fff&text=Pemanfaatan	2026-07-29 04:54:13.732	2026-07-29 04:54:13.733
a5d22f86-e959-497f-82a8-1d33f81668ca	7	PMF-7-845	Bank Sampah	Kompos	Organik	96.11	Kg	26.48	Kg	https://dummyimage.com/600x400/000/fff&text=Pemanfaatan	2026-07-29 04:54:13.815	2026-07-29 04:54:13.816
fe63cad1-7daf-4cd4-957e-dfe166a62fbe	8	PMF-8-326	Bank Sampah	Kompos	Organik	80.57	Kg	39.91	Kg	https://dummyimage.com/600x400/000/fff&text=Pemanfaatan	2026-07-29 04:54:13.903	2026-07-29 04:54:13.904
95e84a6e-664b-4f0f-9443-6afcb02f0ce0	9	PMF-9-535	Bank Sampah	Kompos	Organik	86.49	Kg	38.16	Kg	https://dummyimage.com/600x400/000/fff&text=Pemanfaatan	2026-07-29 04:54:14.01	2026-07-29 04:54:14.011
2b7605bb-d4b4-43da-ba95-56d19a525dbf	10	PMF-10-523	Bank Sampah	Kompos	Organik	54.69	Kg	26.91	Kg	https://dummyimage.com/600x400/000/fff&text=Pemanfaatan	2026-07-29 04:54:14.164	2026-07-29 04:54:14.166
d2f2fcf6-d9a2-40fc-a752-b2923e63a7bf	11	PMF-11-869	Bank Sampah	Kompos	Organik	87.02	Kg	33.83	Kg	https://dummyimage.com/600x400/000/fff&text=Pemanfaatan	2026-07-29 04:54:14.377	2026-07-29 04:54:14.378
b21c9f40-198b-4e78-9c6c-2d67dced8695	12	PMF-12-383	Bank Sampah	Kompos	Organik	55.11	Kg	29.84	Kg	https://dummyimage.com/600x400/000/fff&text=Pemanfaatan	2026-07-29 04:54:14.496	2026-07-29 04:54:14.497
\.


--
-- Data for Name: pengajuan_aktivasi_tong; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.pengajuan_aktivasi_tong (id, id_tong, id_pengguna, url_foto_bukti, status, id_pereview, dibuat_pada, diperbarui_pada) FROM stdin;
\.


--
-- Data for Name: pengguna; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.pengguna (id, nama, surel, kata_sandi, token_fcm, id_peran, dibuat_pada, diperbarui_pada, foto_profil, nik, id_rt_rw, status, alamat, no_telepon, subtipe_warga) FROM stdin;
762859bd-bfaf-4817-a568-505c2c9ad734	Bambang RT 01	rt@psc.id	$2a$10$mpMWsr0Npv14tNG7OV26bO39RQt1lh7F0VgLTv9nrGsOFjiVtkyrW	\N	6	2026-07-29 02:57:44.545	2026-07-29 02:57:44.545	\N	3273010000000006	2	Aktif	\N	+628111111116	\N
a92b2f4b-596d-44fe-a044-140f7989ae89	Andi Saputra	andi.kkn@psc.id	$2a$10$mpMWsr0Npv14tNG7OV26bO39RQt1lh7F0VgLTv9nrGsOFjiVtkyrW	\N	9	2026-07-29 02:57:44.551	2026-07-29 02:57:44.551	\N	3273012026000008	1	Aktif	\N	+628111111118	\N
34a74246-182e-41c3-a787-235e8ab5737c	Dewi Lestari	dewi.kkn@psc.id	$2a$10$mpMWsr0Npv14tNG7OV26bO39RQt1lh7F0VgLTv9nrGsOFjiVtkyrW	\N	9	2026-07-29 02:57:44.569	2026-07-29 02:57:44.569	\N	3273012026000009	1	Aktif	\N	+628111111119	\N
4bf677e7-92f2-4ff4-9dd7-0f68f1b8cd09	Soni Petugas	soni.petugas@psc.id	$2a$10$mpMWsr0Npv14tNG7OV26bO39RQt1lh7F0VgLTv9nrGsOFjiVtkyrW	\N	7	2026-07-29 02:57:44.598	2026-07-29 02:57:44.598	\N	3273013026000002	1	Aktif	\N	+628111111120	\N
b1b3eb39-61c3-4a98-b480-48241bd302b3	SUPER USER	superUser.test-1785297543236@psc.id	$2a$10$T.o/h35cg.jNOhMPDaIgc.Kclmq5lead/HzSsIWHq0AfPM39j6nXK	\N	1	2026-07-29 03:59:03.303	2026-07-29 03:59:03.303	\N	3273016112534399	\N	Aktif	\N	+628111111111	\N
d5e2f4ed-e6d4-4c81-8753-ae1c36ea7d2a	Admin DLH	admin.test-1785297543236@psc.id	$2a$10$T.o/h35cg.jNOhMPDaIgc.Kclmq5lead/HzSsIWHq0AfPM39j6nXK	\N	2	2026-07-29 03:59:03.322	2026-07-29 03:59:03.322	\N	3273022186523205	\N	Aktif	\N	+628111111112	\N
537298b2-c799-4039-bdcc-0f16b63cac23	Camat Coblong	camat.test-1785297543236@psc.id	$2a$10$T.o/h35cg.jNOhMPDaIgc.Kclmq5lead/HzSsIWHq0AfPM39j6nXK	\N	3	2026-07-29 03:59:03.335	2026-07-29 03:59:03.335	\N	3273032526933965	\N	Aktif	\N	+628111111113	\N
4a24ada2-5e02-46a7-bb7a-967edb0623ef	Lurah Dago	lurah.test-1785297543236@psc.id	$2a$10$T.o/h35cg.jNOhMPDaIgc.Kclmq5lead/HzSsIWHq0AfPM39j6nXK	\N	4	2026-07-29 03:59:03.349	2026-07-29 03:59:03.349	\N	3273046952501624	\N	Aktif	\N	+628111111114	\N
4b4f66f6-a3fc-4603-addc-0c81ec08d6a5	Asep RW 06	rw.test-1785297543236@psc.id	$2a$10$T.o/h35cg.jNOhMPDaIgc.Kclmq5lead/HzSsIWHq0AfPM39j6nXK	\N	5	2026-07-29 03:59:03.36	2026-07-29 03:59:03.36	\N	3273054644101628	\N	Aktif	\N	+628111111115	\N
8360d7c4-7a69-4163-bac8-71c9b9debf00	Budi Petugas Residu	petugas.test-1785297543236@psc.id	$2a$10$T.o/h35cg.jNOhMPDaIgc.Kclmq5lead/HzSsIWHq0AfPM39j6nXK	\N	7	2026-07-29 03:59:03.372	2026-07-29 03:59:03.372	\N	3273074749958488	\N	Aktif	\N	+628111111117	\N
e29ea3d7-5144-4f18-b798-893c5f508119	Warga Test KKN	wargatest-1785297546577@psc.id	$2a$10$e7ERM2YUWASVTU8AdIFGGeybxtK9UijYZGqPEflVyWglsMcpcL/mC	\N	8	2026-07-29 03:59:06.765	2026-07-29 03:59:06.765	\N	4371297437964578	1	PENDING	Jl. Dago Giri No. 12	+6281221436912	UTAMA
eb9e4172-4a8f-45e3-a64f-8fb40ae1225f	Asep Sunandar	\N	$2a$10$vixsflP/14jQu4TPs9dbdekIac8bOfuEt5J9TY7IoG0ReDDuq5zui	\N	10	2026-07-29 04:20:29.932	2026-07-29 04:20:29.932	\N	\N	3	Aktif	Jl. Dago Asri No. 82, RT/RW sesuai area	081200000001	\N
a62df906-a634-4e87-b197-d3f079e267ca	Budi Santoso	\N	$2a$10$vixsflP/14jQu4TPs9dbdekIac8bOfuEt5J9TY7IoG0ReDDuq5zui	\N	10	2026-07-29 04:20:29.951	2026-07-29 04:20:29.951	\N	\N	3	Aktif	Jl. Dago Asri No. 34, RT/RW sesuai area	081200000002	\N
9325bae3-870e-44f3-8fc8-d675645a4bff	Cecep Kusnadi	\N	$2a$10$vixsflP/14jQu4TPs9dbdekIac8bOfuEt5J9TY7IoG0ReDDuq5zui	\N	6	2026-07-29 04:20:29.964	2026-07-29 04:20:29.964	\N	\N	3	Aktif	Jl. Dago Asri No. 73, RT/RW sesuai area	081200000003	\N
f91d2022-a123-475b-ae34-9f19f08330bd	Dadang Sudrajat	\N	$2a$10$vixsflP/14jQu4TPs9dbdekIac8bOfuEt5J9TY7IoG0ReDDuq5zui	\N	5	2026-07-29 04:20:29.975	2026-07-29 04:20:29.975	\N	\N	3	Aktif	Jl. Dago Asri No. 11, RT/RW sesuai area	081200000004	\N
35171cb3-8974-45df-9dad-88ab741af06e	Euis Julaeha	\N	$2a$10$vixsflP/14jQu4TPs9dbdekIac8bOfuEt5J9TY7IoG0ReDDuq5zui	\N	11	2026-07-29 04:20:29.987	2026-07-29 04:20:29.987	\N	\N	3	Aktif	Jl. Dago Asri No. 46, RT/RW sesuai area	081200000005	\N
d344060c-d455-46c0-a7e0-cabaf6c7d030	Ujang Suparman	\N	$2a$10$vixsflP/14jQu4TPs9dbdekIac8bOfuEt5J9TY7IoG0ReDDuq5zui	\N	12	2026-07-29 04:20:29.999	2026-07-29 04:20:29.999	\N	\N	\N	Aktif	Jl. Pemda	081200000006	\N
e49ca6ad-0dac-4122-892b-ec99e3b1b9d4	Neng Siti KKN	\N	$2a$10$vixsflP/14jQu4TPs9dbdekIac8bOfuEt5J9TY7IoG0ReDDuq5zui	\N	13	2026-07-29 04:20:30.012	2026-07-29 04:20:30.012	\N	\N	\N	Aktif	Jl. Pemda	081200000007	\N
068da0a1-7f9b-4d77-8af8-95cfdc4ae395	Dr. Hendra	\N	$2a$10$vixsflP/14jQu4TPs9dbdekIac8bOfuEt5J9TY7IoG0ReDDuq5zui	\N	14	2026-07-29 04:20:30.023	2026-07-29 04:20:30.023	\N	\N	\N	Aktif	Jl. Pemda	081200000008	\N
6c91dcd9-d94e-4cc7-b151-13e9238ea90a	Admin Dago	\N	$2a$10$vixsflP/14jQu4TPs9dbdekIac8bOfuEt5J9TY7IoG0ReDDuq5zui	\N	15	2026-07-29 04:20:30.035	2026-07-29 04:20:30.035	\N	\N	\N	Aktif	Jl. Pemda	081200000009	\N
3fecaa43-1fef-4b1b-89f8-11fe688f1f6b	SUPER USER	\N	$2a$10$vixsflP/14jQu4TPs9dbdekIac8bOfuEt5J9TY7IoG0ReDDuq5zui	\N	17	2026-07-29 04:20:30.047	2026-07-29 04:20:30.047	\N	\N	\N	Aktif	Jl. Pemda	081200000010	\N
2fe17edc-9c6d-4db9-ac8a-608c02e73a87	Warga RT 02 1 RW 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.522	2026-07-29 04:54:06.969	\N	\N	4	Aktif	Jl. Warga RT 02 1 RW 01 No. 96	0812001007	\N
6e65c7cb-2969-4483-be16-923f5dfc02b5	Warga RT 02 2 RW 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.53	2026-07-29 04:54:06.976	\N	\N	4	Aktif	Jl. Warga RT 02 2 RW 01 No. 45	0812001008	\N
8265f3d5-9929-4810-9d35-8254c92b7161	Warga RT 02 3 RW 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.537	2026-07-29 04:54:06.983	\N	\N	4	Aktif	Jl. Warga RT 02 3 RW 01 No. 78	0812001009	\N
3a2194cf-659e-487b-8571-98642c9009f5	Petugas RW 01 / RT 02	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	11	2026-07-29 04:29:18.544	2026-07-29 04:54:06.99	\N	\N	4	Aktif	Jl. Petugas RW 01 / RT 02 No. 38	0812001010	\N
fcc7bf14-8b4c-4893-9089-a35d9e8f3cff	Mahasiswa KKN RW 01 / RT 02 - 1	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:18.559	2026-07-29 04:54:07.003	\N	\N	4	Aktif	Jl. Mahasiswa KKN RW 01 / RT 02 - 1 No. 9	0812001011	\N
5d41a2e9-5d95-4d98-9b31-c87eb6a0a437	Mahasiswa KKN RW 01 / RT 02 - 2	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:18.577	2026-07-29 04:54:07.023	\N	\N	4	Aktif	Jl. Mahasiswa KKN RW 01 / RT 02 - 2 No. 99	0812001012	\N
6350bf55-763c-4db5-a60a-011fb84c6ef2	Warga RT 01 1 RW 02	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.597	2026-07-29 04:54:07.043	\N	\N	5	Aktif	Jl. Warga RT 01 1 RW 02 No. 28	0812001013	\N
f8f351b8-1174-40d2-b107-988355cfac0d	Warga RT 01 3 RW 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.452	2026-07-29 04:54:06.894	\N	\N	3	Aktif	Jl. Warga RT 01 3 RW 01 No. 64	0812001003	\N
4f7be806-dc90-42aa-9626-744df99f2082	Petugas RW 01 / RT 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	11	2026-07-29 04:29:18.459	2026-07-29 04:54:06.902	\N	\N	3	Aktif	Jl. Petugas RW 01 / RT 01 No. 43	0812001004	\N
549e72c8-63c9-476a-b790-f2d253b57474	Mahasiswa KKN RW 01 / RT 01 - 1	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:18.477	2026-07-29 04:54:06.92	\N	\N	3	Aktif	Jl. Mahasiswa KKN RW 01 / RT 01 - 1 No. 28	0812001005	\N
83b09660-3137-4845-9d4c-83789cd9e001	Mahasiswa KKN RW 01 / RT 01 - 2	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:18.502	2026-07-29 04:54:06.948	\N	\N	3	Aktif	Jl. Mahasiswa KKN RW 01 / RT 01 - 2 No. 37	0812001006	\N
4d3fa45f-9210-47b2-bc18-2d7ddf81631c	Warga RT 02 1 RW 02	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.674	2026-07-29 04:54:07.125	\N	\N	6	Aktif	Jl. Warga RT 02 1 RW 02 No. 4	0812001019	\N
878f098e-6dc8-4860-ba8e-53bb9dc307bf	Warga RT 02 2 RW 02	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.681	2026-07-29 04:54:07.133	\N	\N	6	Aktif	Jl. Warga RT 02 2 RW 02 No. 69	0812001020	\N
429797a7-76fc-4742-a802-e4cc532c85a9	Warga RT 02 3 RW 02	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.687	2026-07-29 04:54:07.143	\N	\N	6	Aktif	Jl. Warga RT 02 3 RW 02 No. 80	0812001021	\N
340a6d05-69ee-4c2b-85da-e2d3ea6fb503	Petugas RW 02 / RT 02	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	11	2026-07-29 04:29:18.694	2026-07-29 04:54:07.151	\N	\N	6	Aktif	Jl. Petugas RW 02 / RT 02 No. 71	0812001022	\N
d431945f-6df0-48e4-b67d-5cfde21059ed	Mahasiswa KKN RW 02 / RT 02 - 1	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:18.707	2026-07-29 04:54:07.169	\N	\N	6	Aktif	Jl. Mahasiswa KKN RW 02 / RT 02 - 1 No. 67	0812001023	\N
788ae2c4-6324-4eff-938e-64d844d8176f	Mahasiswa KKN RW 02 / RT 02 - 2	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:18.726	2026-07-29 04:54:07.289	\N	\N	6	Aktif	Jl. Mahasiswa KKN RW 02 / RT 02 - 2 No. 13	0812001024	\N
cc384148-25ef-43c2-8187-289865e697a5	Warga RT 01 1 RW 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.744	2026-07-29 04:54:07.333	\N	\N	7	Aktif	Jl. Warga RT 01 1 RW 01 No. 16	0812001025	\N
e9a5cb9c-3a99-4448-8bfa-6388378e52a5	Warga RT 01 2 RW 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.751	2026-07-29 04:54:07.346	\N	\N	7	Aktif	Jl. Warga RT 01 2 RW 01 No. 88	0812001026	\N
d6db8325-10f5-45cb-a509-b0d284cb91f0	Warga RT 01 3 RW 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.757	2026-07-29 04:54:07.355	\N	\N	7	Aktif	Jl. Warga RT 01 3 RW 01 No. 9	0812001027	\N
bf55de66-761d-4b67-84c8-4bb6b8d70332	Petugas RW 01 / RT 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	11	2026-07-29 04:29:18.764	2026-07-29 04:54:07.364	\N	\N	7	Aktif	Jl. Petugas RW 01 / RT 01 No. 6	0812001028	\N
45f36c56-fa50-413e-9d3e-4d478279a348	Mahasiswa KKN RW 01 / RT 01 - 1	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:18.778	2026-07-29 04:54:07.379	\N	\N	7	Aktif	Jl. Mahasiswa KKN RW 01 / RT 01 - 1 No. 82	0812001029	\N
b630466b-dcea-4b96-9c13-46e2197b0f9c	Mahasiswa KKN RW 01 / RT 01 - 2	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:18.796	2026-07-29 04:54:07.404	\N	\N	7	Aktif	Jl. Mahasiswa KKN RW 01 / RT 01 - 2 No. 96	0812001030	\N
54e9694d-7492-4543-9fe9-8fd7f4f5c921	Warga RT 02 1 RW 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.815	2026-07-29 04:54:07.426	\N	\N	8	Aktif	Jl. Warga RT 02 1 RW 01 No. 65	0812001031	\N
2a07a787-3e37-41c1-a052-ab2fea01f2d7	Warga RT 02 2 RW 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.821	2026-07-29 04:54:07.435	\N	\N	8	Aktif	Jl. Warga RT 02 2 RW 01 No. 60	0812001032	\N
f2edfdc0-029b-46db-8710-968c19475c2e	Warga RT 02 3 RW 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.828	2026-07-29 04:54:07.443	\N	\N	8	Aktif	Jl. Warga RT 02 3 RW 01 No. 73	0812001033	\N
ddc89057-6cc4-4ee7-a592-bdf9b6b628b7	Petugas RW 01 / RT 02	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	11	2026-07-29 04:29:18.835	2026-07-29 04:54:07.454	\N	\N	8	Aktif	Jl. Petugas RW 01 / RT 02 No. 19	0812001034	\N
967f0e9d-35d1-4b1e-9fc8-97f27e3ee3ab	Mahasiswa KKN RW 01 / RT 02 - 1	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:18.849	2026-07-29 04:54:07.469	\N	\N	8	Aktif	Jl. Mahasiswa KKN RW 01 / RT 02 - 1 No. 66	0812001035	\N
5fa6b2fd-21c4-474c-8f79-088e1ffb1e96	Mahasiswa KKN RW 01 / RT 02 - 2	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:18.868	2026-07-29 04:54:07.492	\N	\N	8	Aktif	Jl. Mahasiswa KKN RW 01 / RT 02 - 2 No. 15	0812001036	\N
b0a65787-bac6-4fec-87ef-24db782044bd	Warga RT 01 1 RW 02	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.886	2026-07-29 04:54:07.518	\N	\N	9	Aktif	Jl. Warga RT 01 1 RW 02 No. 1	0812001037	\N
8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	Warga RT 01 2 RW 02	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.893	2026-07-29 04:54:07.527	\N	\N	9	Aktif	Jl. Warga RT 01 2 RW 02 No. 96	0812001038	\N
3cfdcc3f-aa06-4386-8d31-293f3913d7e5	Warga RT 01 3 RW 02	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.9	2026-07-29 04:54:07.537	\N	\N	9	Aktif	Jl. Warga RT 01 3 RW 02 No. 93	0812001039	\N
a1526984-44bc-4aa2-9811-f1fa8732c9e1	Petugas RW 02 / RT 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	11	2026-07-29 04:29:18.91	2026-07-29 04:54:07.548	\N	\N	9	Aktif	Jl. Petugas RW 02 / RT 01 No. 61	0812001040	\N
9ba9db61-7c43-4765-9f1b-7fa8b5e47d56	Mahasiswa KKN RW 02 / RT 01 - 1	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:18.927	2026-07-29 04:54:07.567	\N	\N	9	Aktif	Jl. Mahasiswa KKN RW 02 / RT 01 - 1 No. 35	0812001041	\N
f5abb400-3f37-4e3e-9e13-8c79fd09cc1b	Mahasiswa KKN RW 02 / RT 01 - 2	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:18.95	2026-07-29 04:54:07.591	\N	\N	9	Aktif	Jl. Mahasiswa KKN RW 02 / RT 01 - 2 No. 10	0812001042	\N
d32557cf-a420-438e-8d42-c8b3d35ecb08	Warga RT 02 1 RW 02	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.972	2026-07-29 04:54:07.615	\N	\N	10	Aktif	Jl. Warga RT 02 1 RW 02 No. 33	0812001043	\N
514e074f-d89a-4380-87d8-e91aef8ec350	Warga RT 02 2 RW 02	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.982	2026-07-29 04:54:07.625	\N	\N	10	Aktif	Jl. Warga RT 02 2 RW 02 No. 97	0812001044	\N
ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	Warga RT 02 3 RW 02	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.991	2026-07-29 04:54:07.635	\N	\N	10	Aktif	Jl. Warga RT 02 3 RW 02 No. 80	0812001045	\N
5db1deba-21e8-4883-9353-71c24033da4a	Petugas RW 02 / RT 02	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	11	2026-07-29 04:29:18.998	2026-07-29 04:54:07.646	\N	\N	10	Aktif	Jl. Petugas RW 02 / RT 02 No. 18	0812001046	\N
866e0066-e48e-4339-a2a5-40d06ba5c93e	Warga RT 01 3 RW 02	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.616	2026-07-29 04:54:07.057	\N	\N	5	Aktif	Jl. Warga RT 01 3 RW 02 No. 19	0812001015	\N
b061b068-dfc4-481e-9813-fe7b00082aaa	Petugas RW 02 / RT 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	11	2026-07-29 04:29:18.623	2026-07-29 04:54:07.065	\N	\N	5	Aktif	Jl. Petugas RW 02 / RT 01 No. 96	0812001016	\N
cf200a2a-ff22-45f5-a2bc-e670f4b15c86	Mahasiswa KKN RW 02 / RT 01 - 1	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:18.637	2026-07-29 04:54:07.079	\N	\N	5	Aktif	Jl. Mahasiswa KKN RW 02 / RT 01 - 1 No. 91	0812001017	\N
c26fc2fd-15c0-4288-b1cb-1455aca58314	Mahasiswa KKN RW 02 / RT 01 - 2	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:18.656	2026-07-29 04:54:07.102	\N	\N	5	Aktif	Jl. Mahasiswa KKN RW 02 / RT 01 - 2 No. 22	0812001018	\N
3459e1ba-26b5-4241-89c6-e4cf9131d8d1	SUPER USER	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	17	2026-07-29 04:29:19.259	2026-07-29 04:29:19.259	\N	\N	\N	Aktif	Jl. Pemda	081200999999	\N
6f80591d-5068-43be-8639-447be9a9590c	Admin Coblong	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	16	2026-07-29 04:29:19.28	2026-07-29 04:29:19.28	\N	\N	\N	Aktif	Jl. Pemda	081200999998	\N
1cfba3ed-a354-4232-8d05-a35df134e95b	Warga RT 01 3 RW 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:19.085	2026-07-29 04:54:07.727	\N	\N	11	Aktif	Jl. Warga RT 01 3 RW 01 No. 6	0812001051	\N
b718beeb-4b87-4f6b-9a38-84e13f469445	Petugas RW 01 / RT 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	11	2026-07-29 04:29:19.094	2026-07-29 04:54:07.735	\N	\N	11	Aktif	Jl. Petugas RW 01 / RT 01 No. 25	0812001052	\N
0df98491-a706-4304-910b-04994dad1d30	Mahasiswa KKN RW 01 / RT 01 - 1	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:19.116	2026-07-29 04:54:07.754	\N	\N	11	Aktif	Jl. Mahasiswa KKN RW 01 / RT 01 - 1 No. 88	0812001053	\N
0e33475b-de22-4d41-890a-27bbf5494046	Mahasiswa KKN RW 01 / RT 01 - 2	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:19.142	2026-07-29 04:54:07.785	\N	\N	11	Aktif	Jl. Mahasiswa KKN RW 01 / RT 01 - 2 No. 80	0812001054	\N
ae934d2f-e7ae-4471-ab73-6388951d3c2b	Warga RT 02 1 RW 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:19.164	2026-07-29 04:54:07.819	\N	\N	12	Aktif	Jl. Warga RT 02 1 RW 01 No. 41	0812001055	\N
13a8cc8d-80ad-4559-a301-ea7a8481f621	Warga RT 02 2 RW 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:19.172	2026-07-29 04:54:07.828	\N	\N	12	Aktif	Jl. Warga RT 02 2 RW 01 No. 87	0812001056	\N
b8e9385a-6ed1-41b8-8b74-55123baa568a	Warga RT 02 3 RW 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:19.182	2026-07-29 04:54:07.839	\N	\N	12	Aktif	Jl. Warga RT 02 3 RW 01 No. 58	0812001057	\N
2be71aba-1bf7-411e-b539-076e033dbc50	Warga RT 01 1 RW 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.431	2026-07-29 04:54:06.872	\N	\N	3	Aktif	Jl. Warga RT 01 1 RW 01 No. 97	0812001001	\N
67996a97-6f02-47b0-8218-cb7760d5c9e4	Warga RT 01 2 RW 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.444	2026-07-29 04:54:06.885	\N	\N	3	Aktif	Jl. Warga RT 01 2 RW 01 No. 70	0812001002	\N
7e42f423-8a90-40f7-88e7-619af6512070	Petugas RW 01 / RT 02	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	11	2026-07-29 04:29:19.192	2026-07-29 04:54:07.848	\N	\N	12	Aktif	Jl. Petugas RW 01 / RT 02 No. 13	0812001058	\N
d6c83ff1-1b9d-4617-a603-ec16a407cb97	Mahasiswa KKN RW 01 / RT 02 - 1	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:19.208	2026-07-29 04:54:07.865	\N	\N	12	Aktif	Jl. Mahasiswa KKN RW 01 / RT 02 - 1 No. 2	0812001059	\N
a72e03f8-20b2-47e4-bce5-530eb6f81d0c	Mahasiswa KKN RW 01 / RT 02 - 2	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:19.23	2026-07-29 04:54:07.892	\N	\N	12	Aktif	Jl. Mahasiswa KKN RW 01 / RT 02 - 2 No. 79	0812001060	\N
ece74bb6-33f1-4e23-b489-aedd0f91cbca	Warga RT 01 2 RW 02	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:18.605	2026-07-29 04:54:07.05	\N	\N	5	Aktif	Jl. Warga RT 01 2 RW 02 No. 41	0812001014	\N
4fe7f457-6335-4192-b869-4e3b16e2c3f8	Mahasiswa KKN RW 02 / RT 02 - 1	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:19.015	2026-07-29 04:54:07.662	\N	\N	10	Aktif	Jl. Mahasiswa KKN RW 02 / RT 02 - 1 No. 28	0812001047	\N
ccdac479-5fca-43bc-9adc-c47baa106f29	Mahasiswa KKN RW 02 / RT 02 - 2	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	13	2026-07-29 04:29:19.042	2026-07-29 04:54:07.687	\N	\N	10	Aktif	Jl. Mahasiswa KKN RW 02 / RT 02 - 2 No. 12	0812001048	\N
3f35f06b-a435-44a2-9ce1-ce4fc2852c23	Warga RT 01 1 RW 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:19.067	2026-07-29 04:54:07.71	\N	\N	11	Aktif	Jl. Warga RT 01 1 RW 01 No. 1	0812001049	\N
e77f0e98-184a-411a-ae09-c5393acbc976	Warga RT 01 2 RW 01	\N	$2a$10$951dwT/mAVS56DgyxOO5Yu./RCpkIvKQR4TYTdr7KYPH7z1/egf5S	\N	10	2026-07-29 04:29:19.076	2026-07-29 04:54:07.718	\N	\N	11	Aktif	Jl. Warga RT 01 2 RW 01 No. 81	0812001050	\N
\.


--
-- Data for Name: peran; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.peran (id, nama, dibuat_pada, diperbarui_pada) FROM stdin;
1	SUPER_USER	2026-07-29 02:46:36.233	2026-07-29 02:46:36.233
2	ADMIN_DLH	2026-07-29 02:46:36.257	2026-07-29 02:46:36.257
3	CAMAT	2026-07-29 02:46:36.268	2026-07-29 02:46:36.268
4	LURAH	2026-07-29 02:46:36.278	2026-07-29 02:46:36.278
5	RW	2026-07-29 02:46:36.289	2026-07-29 02:46:36.289
6	RT	2026-07-29 02:46:36.3	2026-07-29 02:46:36.3
7	PETUGAS_RESIDU	2026-07-29 02:46:36.309	2026-07-29 02:46:36.309
8	WARGA	2026-07-29 02:46:36.321	2026-07-29 02:46:36.321
9	MAHASISWA_KKN	2026-07-29 02:46:36.332	2026-07-29 02:46:36.332
10	Warga	2026-07-29 04:20:29.513	2026-07-29 04:20:29.513
11	Petugas Residu	2026-07-29 04:20:29.57	2026-07-29 04:20:29.57
12	Pengangkut	2026-07-29 04:20:29.582	2026-07-29 04:20:29.582
13	Mahasiswa	2026-07-29 04:20:29.595	2026-07-29 04:20:29.595
14	DPL	2026-07-29 04:20:29.607	2026-07-29 04:20:29.607
15	Admin Kelurahan	2026-07-29 04:20:29.619	2026-07-29 04:20:29.619
16	Admin Kecamatan	2026-07-29 04:20:29.631	2026-07-29 04:20:29.631
17	SUPER USER	2026-07-29 04:20:29.644	2026-07-29 04:20:29.644
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
ef43c284-cf86-45b3-8287-35adb5447fd6	4f7be806-dc90-42aa-9626-744df99f2082	Petugas RW 01 / RT 01	0812001004	100.00	\N	2026-07-29 04:54:06.91	2026-07-29 04:54:06.91	-6.86912543	107.62590454	APPROVED
038b2150-4c46-4aaa-921c-5e6a857c8a6f	3a2194cf-659e-487b-8571-98642c9009f5	Petugas RW 01 / RT 02	0812001010	100.00	\N	2026-07-29 04:54:06.997	2026-07-29 04:54:06.997	-6.86592864	107.62094060	APPROVED
8f87fc98-3677-494c-a700-156f0f7ec08a	b061b068-dfc4-481e-9813-fe7b00082aaa	Petugas RW 02 / RT 01	0812001016	100.00	\N	2026-07-29 04:54:07.071	2026-07-29 04:54:07.071	-6.87028299	107.62241479	APPROVED
c567f1ee-6069-4f1f-b6d4-0d082ddfeba6	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	Petugas RW 02 / RT 02	0812001022	100.00	\N	2026-07-29 04:54:07.16	2026-07-29 04:54:07.16	-6.87413736	107.61951756	APPROVED
730b8a16-88af-44c7-a32b-a21e9bbf5b91	bf55de66-761d-4b67-84c8-4bb6b8d70332	Petugas RW 01 / RT 01	0812001028	100.00	\N	2026-07-29 04:54:07.371	2026-07-29 04:54:07.371	-6.88607584	107.61625672	APPROVED
ec03229e-60af-411a-95ea-97bcf670cb5d	ddc89057-6cc4-4ee7-a592-bdf9b6b628b7	Petugas RW 01 / RT 02	0812001034	100.00	\N	2026-07-29 04:54:07.462	2026-07-29 04:54:07.462	-6.88453415	107.61819283	APPROVED
d789d9a1-5461-46d3-a2c7-cf1360e94433	a1526984-44bc-4aa2-9811-f1fa8732c9e1	Petugas RW 02 / RT 01	0812001040	100.00	\N	2026-07-29 04:54:07.56	2026-07-29 04:54:07.56	-6.88632441	107.61769204	APPROVED
698d086f-4406-496f-b2c0-dc6f73e6ef3f	5db1deba-21e8-4883-9353-71c24033da4a	Petugas RW 02 / RT 02	0812001046	100.00	\N	2026-07-29 04:54:07.654	2026-07-29 04:54:07.654	-6.88820289	107.61814828	APPROVED
0e109ffe-d901-4788-8832-558f8fe392b6	b718beeb-4b87-4f6b-9a38-84e13f469445	Petugas RW 01 / RT 01	0812001052	100.00	\N	2026-07-29 04:54:07.744	2026-07-29 04:54:07.744	-6.89175237	107.61505551	APPROVED
7602294a-c3e9-4d76-8d1a-ffec085d1d73	7e42f423-8a90-40f7-88e7-619af6512070	Petugas RW 01 / RT 02	0812001058	100.00	\N	2026-07-29 04:54:07.858	2026-07-29 04:54:07.858	-6.89155492	107.61444979	APPROVED
\.


--
-- Data for Name: riwayat_poin; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.riwayat_poin (id, id_pengguna, points, description, dibuat_pada, kategori, redeemable) FROM stdin;
8f379cae-8d73-4c48-bc51-62033966814d	2be71aba-1bf7-411e-b539-076e033dbc50	10	Setoran sampah Organik	2026-06-06 00:00:00	REDUKSI_TONASE	f
92819032-5884-4df1-820f-a2dadc6bafa7	2be71aba-1bf7-411e-b539-076e033dbc50	22	Setoran sampah Anorganik	2026-07-02 00:00:00	REDUKSI_TONASE	f
2889cff5-b6b5-43ec-86d9-b1a1cabdf470	2be71aba-1bf7-411e-b539-076e033dbc50	13	Setoran sampah Organik	2026-06-10 10:00:00	REDUKSI_TONASE	f
330984c3-f4c0-4670-80cf-05b4ed68439d	2be71aba-1bf7-411e-b539-076e033dbc50	26	Setoran sampah Anorganik	2026-06-03 10:00:00	REDUKSI_TONASE	f
e1ac6243-9d2e-43ee-a79f-898f99c46e6d	2be71aba-1bf7-411e-b539-076e033dbc50	19	Setoran sampah Organik	2026-07-05 09:00:00	REDUKSI_TONASE	f
d9899d48-16c7-4d8e-9059-622019db100c	2be71aba-1bf7-411e-b539-076e033dbc50	27	Setoran sampah Anorganik	2026-06-30 10:00:00	REDUKSI_TONASE	f
f0603311-fa3e-43c9-8d58-3fd7213a6ef3	2be71aba-1bf7-411e-b539-076e033dbc50	21	Setoran sampah Organik	2026-07-29 10:00:00	REDUKSI_TONASE	f
3c12775f-12cb-4f70-94a1-9158715d510b	2be71aba-1bf7-411e-b539-076e033dbc50	29	Setoran sampah Anorganik	2026-06-23 23:00:00	REDUKSI_TONASE	f
8b8fba15-1c55-4d9f-86a7-83be540064f4	2be71aba-1bf7-411e-b539-076e033dbc50	15	Setoran sampah Organik	2026-07-25 10:00:00	REDUKSI_TONASE	f
e1266a5e-5964-4abb-8416-eb257388d49e	2be71aba-1bf7-411e-b539-076e033dbc50	32	Setoran sampah Organik	2026-07-24 09:00:00	REDUKSI_TONASE	f
58d7f9a7-b46b-44c4-af8c-4e286ada60f6	2be71aba-1bf7-411e-b539-076e033dbc50	16	Setoran sampah Anorganik	2026-06-03 23:00:00	REDUKSI_TONASE	f
9c1eaaaa-2d4a-4836-9e3f-4dd12ea4d04c	2be71aba-1bf7-411e-b539-076e033dbc50	22	Setoran sampah Organik	2026-06-14 10:00:00	REDUKSI_TONASE	f
f0854965-36fe-4b39-8bb1-5aec58347f1d	67996a97-6f02-47b0-8218-cb7760d5c9e4	34	Setoran sampah Organik	2026-06-12 00:00:00	REDUKSI_TONASE	f
83e3ee2a-13e7-4fc5-8342-c01732484944	67996a97-6f02-47b0-8218-cb7760d5c9e4	40	Setoran sampah Anorganik	2026-06-01 23:00:00	REDUKSI_TONASE	f
84421bcd-608f-49d1-8b87-5fd9078cf21a	67996a97-6f02-47b0-8218-cb7760d5c9e4	9	Setoran sampah Organik	2026-07-15 10:00:00	REDUKSI_TONASE	f
94e8ad6b-9742-4b17-8b52-4b33a60c9b3c	67996a97-6f02-47b0-8218-cb7760d5c9e4	45	Setoran sampah Anorganik	2026-07-03 09:00:00	REDUKSI_TONASE	f
94b05aac-8241-4e58-8de0-7642e1dc3819	67996a97-6f02-47b0-8218-cb7760d5c9e4	19	Setoran sampah Anorganik	2026-06-17 00:00:00	REDUKSI_TONASE	f
e770a224-ef9d-4e7a-8236-ff78ec615aa2	67996a97-6f02-47b0-8218-cb7760d5c9e4	20	Setoran sampah Organik	2026-07-27 09:00:00	REDUKSI_TONASE	f
2954e813-da2b-4031-aaac-d4cc4c5a1d6c	67996a97-6f02-47b0-8218-cb7760d5c9e4	42	Setoran sampah Anorganik	2026-06-29 00:00:00	REDUKSI_TONASE	f
4a739b27-7080-4634-af09-f5ac9098f3cc	f8f351b8-1174-40d2-b107-988355cfac0d	34	Setoran sampah Anorganik	2026-06-06 00:00:00	REDUKSI_TONASE	f
a2ddad14-c7b9-4eb8-b729-dda321750693	f8f351b8-1174-40d2-b107-988355cfac0d	21	Setoran sampah Organik	2026-06-17 09:00:00	REDUKSI_TONASE	f
45a16e85-9c54-4947-bb14-1ea608760f42	f8f351b8-1174-40d2-b107-988355cfac0d	38	Setoran sampah Organik	2026-06-01 10:00:00	REDUKSI_TONASE	f
9867212b-9eb3-4f67-a073-2198599ded5a	f8f351b8-1174-40d2-b107-988355cfac0d	13	Setoran sampah Organik	2026-06-13 23:00:00	REDUKSI_TONASE	f
3428c399-0d5a-4c03-b958-c0dc62e72461	f8f351b8-1174-40d2-b107-988355cfac0d	36	Setoran sampah Organik	2026-07-13 09:00:00	REDUKSI_TONASE	f
505cedfa-6139-41c9-9280-0161c150d864	f8f351b8-1174-40d2-b107-988355cfac0d	31	Setoran sampah Organik	2026-07-27 09:00:00	REDUKSI_TONASE	f
7af9d17d-0f62-4837-bd3a-7bb0ffd386c5	f8f351b8-1174-40d2-b107-988355cfac0d	28	Setoran sampah Anorganik	2026-07-19 00:00:00	REDUKSI_TONASE	f
9a31d57e-f737-475a-9d0b-02aa27b6d40a	f8f351b8-1174-40d2-b107-988355cfac0d	9	Setoran sampah Organik	2026-07-18 23:00:00	REDUKSI_TONASE	f
580fdfaf-c175-4450-85a7-2cdd0ba65551	f8f351b8-1174-40d2-b107-988355cfac0d	20	Setoran sampah Anorganik	2026-05-31 09:00:00	REDUKSI_TONASE	f
a1bae38c-d5e3-4def-b583-60775f68c197	f8f351b8-1174-40d2-b107-988355cfac0d	39	Setoran sampah Anorganik	2026-06-29 09:00:00	REDUKSI_TONASE	f
e501d3dc-8c99-4994-ad41-9b8e588fd4d6	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	30	Setoran sampah Anorganik	2026-06-26 00:00:00	REDUKSI_TONASE	f
ce02d951-9a0b-4cc2-8a31-23c9d546d25f	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	28	Setoran sampah Organik	2026-06-01 23:00:00	REDUKSI_TONASE	f
7d4cbc52-4bdb-4069-b076-cbd71de8c3c3	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	31	Setoran sampah Organik	2026-07-27 23:00:00	REDUKSI_TONASE	f
e320099d-f12e-49a4-b98d-c95a3b5f4bfb	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	18	Setoran sampah Organik	2026-07-21 09:00:00	REDUKSI_TONASE	f
1a735948-4895-458e-be7d-962d8ec6731d	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	22	Setoran sampah Anorganik	2026-06-15 10:00:00	REDUKSI_TONASE	f
c0a7d34e-7dfd-4fe7-a43f-905c373f44d0	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	34	Setoran sampah Organik	2026-06-10 10:00:00	REDUKSI_TONASE	f
3a9527b2-edad-4674-802b-c7a49c13413c	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	22	Setoran sampah Anorganik	2026-07-14 10:00:00	REDUKSI_TONASE	f
6db54641-60ca-4480-80ef-599ef8baa707	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	31	Setoran sampah Anorganik	2026-06-08 10:00:00	REDUKSI_TONASE	f
54a948b9-247a-4592-81bd-f63fc2dff5f5	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	26	Setoran sampah Anorganik	2026-06-10 10:00:00	REDUKSI_TONASE	f
3be01370-7ac1-40e2-9221-2c1fdb2ff9de	6e65c7cb-2969-4483-be16-923f5dfc02b5	20	Setoran sampah Organik	2026-07-26 00:00:00	REDUKSI_TONASE	f
f91f5166-28c6-4023-9f75-5dcaa76e3506	6e65c7cb-2969-4483-be16-923f5dfc02b5	15	Setoran sampah Anorganik	2026-06-07 10:00:00	REDUKSI_TONASE	f
1391d833-ff7a-45ef-8e2c-950bd1073c0f	6e65c7cb-2969-4483-be16-923f5dfc02b5	28	Setoran sampah Anorganik	2026-06-04 09:00:00	REDUKSI_TONASE	f
d8d681fa-faab-4ce6-9911-f165fa0d12cd	6e65c7cb-2969-4483-be16-923f5dfc02b5	22	Setoran sampah Organik	2026-06-07 00:00:00	REDUKSI_TONASE	f
680b0e47-e13b-4196-ad1a-809d32cd4ef2	6e65c7cb-2969-4483-be16-923f5dfc02b5	48	Setoran sampah Anorganik	2026-07-19 09:00:00	REDUKSI_TONASE	f
4b1a9d33-fa1f-45cb-b86a-10f41e292200	6e65c7cb-2969-4483-be16-923f5dfc02b5	22	Setoran sampah Organik	2026-06-19 23:00:00	REDUKSI_TONASE	f
96dbc95b-945a-47e2-8c30-dd03cd8a296c	6e65c7cb-2969-4483-be16-923f5dfc02b5	51	Setoran sampah Anorganik	2026-07-22 09:00:00	REDUKSI_TONASE	f
210ca27a-d579-427d-a73b-d09f71482372	6e65c7cb-2969-4483-be16-923f5dfc02b5	18	Setoran sampah Anorganik	2026-06-22 10:00:00	REDUKSI_TONASE	f
6a0f279a-359c-467b-b78d-341e439fe1e2	8265f3d5-9929-4810-9d35-8254c92b7161	14	Setoran sampah Organik	2026-06-28 23:00:00	REDUKSI_TONASE	f
dd9784f9-2b2d-42f2-aae3-26fe4548ecc2	8265f3d5-9929-4810-9d35-8254c92b7161	26	Setoran sampah Organik	2026-06-04 10:00:00	REDUKSI_TONASE	f
b0992d95-dab0-4af8-98d7-5552484ecd2b	8265f3d5-9929-4810-9d35-8254c92b7161	10	Setoran sampah Organik	2026-07-25 09:00:00	REDUKSI_TONASE	f
ab3d23fe-5f37-4da8-92bb-2c3f807866f2	8265f3d5-9929-4810-9d35-8254c92b7161	18	Setoran sampah Organik	2026-07-07 10:00:00	REDUKSI_TONASE	f
bdbd9258-553a-4341-b0c9-0c9677368e56	8265f3d5-9929-4810-9d35-8254c92b7161	12	Setoran sampah Organik	2026-06-15 00:00:00	REDUKSI_TONASE	f
834497f7-4639-4952-ba48-1d6d6c5dbed4	8265f3d5-9929-4810-9d35-8254c92b7161	25	Setoran sampah Organik	2026-07-04 09:00:00	REDUKSI_TONASE	f
e19313d3-fc9a-4929-bff8-86d05f335170	6350bf55-763c-4db5-a60a-011fb84c6ef2	27	Setoran sampah Anorganik	2026-06-01 10:00:00	REDUKSI_TONASE	f
0760d30c-7b81-4e11-b787-8381653123eb	6350bf55-763c-4db5-a60a-011fb84c6ef2	44	Setoran sampah Anorganik	2026-07-19 09:00:00	REDUKSI_TONASE	f
1b16605a-1eee-4399-b4c5-1a3d3c5e7958	6350bf55-763c-4db5-a60a-011fb84c6ef2	15	Setoran sampah Anorganik	2026-07-18 00:00:00	REDUKSI_TONASE	f
c4e00684-9046-4c23-af27-37f63369b39f	6350bf55-763c-4db5-a60a-011fb84c6ef2	35	Setoran sampah Organik	2026-07-24 09:00:00	REDUKSI_TONASE	f
0f09bddd-7977-4df1-b3bd-5ef48d320683	6350bf55-763c-4db5-a60a-011fb84c6ef2	49	Setoran sampah Anorganik	2026-07-01 00:00:00	REDUKSI_TONASE	f
261d21fe-ba24-47c2-878c-21b163947191	6350bf55-763c-4db5-a60a-011fb84c6ef2	30	Setoran sampah Anorganik	2026-06-21 09:00:00	REDUKSI_TONASE	f
921129dc-44fd-4f78-87f9-c107017186aa	ece74bb6-33f1-4e23-b489-aedd0f91cbca	24	Setoran sampah Organik	2026-07-28 09:00:00	REDUKSI_TONASE	f
24f71f92-1638-4752-9d50-66cbcd828aff	ece74bb6-33f1-4e23-b489-aedd0f91cbca	17	Setoran sampah Anorganik	2026-06-06 23:00:00	REDUKSI_TONASE	f
87d4525f-8a1b-4a4d-9b92-64dcdca3620f	ece74bb6-33f1-4e23-b489-aedd0f91cbca	17	Setoran sampah Organik	2026-07-22 23:00:00	REDUKSI_TONASE	f
74ccd37c-5f4f-46ce-9bb8-e66967907ece	ece74bb6-33f1-4e23-b489-aedd0f91cbca	23	Setoran sampah Anorganik	2026-06-14 09:00:00	REDUKSI_TONASE	f
326c1153-26fa-4d50-adf8-55fb112b5d95	ece74bb6-33f1-4e23-b489-aedd0f91cbca	20	Setoran sampah Anorganik	2026-06-08 23:00:00	REDUKSI_TONASE	f
7d09ae68-ac09-435a-a352-b25613a6b168	ece74bb6-33f1-4e23-b489-aedd0f91cbca	18	Setoran sampah Organik	2026-07-04 23:00:00	REDUKSI_TONASE	f
16805158-8801-4b58-9c30-58051c103ef2	ece74bb6-33f1-4e23-b489-aedd0f91cbca	22	Setoran sampah Organik	2026-07-07 00:00:00	REDUKSI_TONASE	f
4309503a-0352-4850-a708-3615c87da968	ece74bb6-33f1-4e23-b489-aedd0f91cbca	19	Setoran sampah Anorganik	2026-07-01 09:00:00	REDUKSI_TONASE	f
c529f49c-2416-4a77-a7db-1f483eb1c7f3	ece74bb6-33f1-4e23-b489-aedd0f91cbca	24	Setoran sampah Anorganik	2026-07-27 00:00:00	REDUKSI_TONASE	f
743ed828-73ae-469f-9eab-f7753fabadfa	ece74bb6-33f1-4e23-b489-aedd0f91cbca	31	Setoran sampah Anorganik	2026-06-12 23:00:00	REDUKSI_TONASE	f
6c2a54ef-1e1c-4f7f-b2aa-0187b29db0b5	866e0066-e48e-4339-a2a5-40d06ba5c93e	15	Setoran sampah Organik	2026-07-04 10:00:00	REDUKSI_TONASE	f
4a28cac2-43fb-4a1a-9d1e-b1230e89ed24	866e0066-e48e-4339-a2a5-40d06ba5c93e	11	Setoran sampah Organik	2026-06-01 00:00:00	REDUKSI_TONASE	f
840ab9ae-5036-48f8-883a-6a73ca0fa63d	866e0066-e48e-4339-a2a5-40d06ba5c93e	49	Setoran sampah Anorganik	2026-06-12 09:00:00	REDUKSI_TONASE	f
f9c09589-262f-456b-adf2-460ed2966c9f	866e0066-e48e-4339-a2a5-40d06ba5c93e	14	Setoran sampah Organik	2026-07-14 09:00:00	REDUKSI_TONASE	f
0fe93fd6-d4f6-43ab-b2b6-16322616c7db	866e0066-e48e-4339-a2a5-40d06ba5c93e	30	Setoran sampah Anorganik	2026-07-15 23:00:00	REDUKSI_TONASE	f
a49cab22-785e-4209-9dec-8a176f06853f	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	9	Setoran sampah Organik	2026-07-18 10:00:00	REDUKSI_TONASE	f
c64a517d-b759-4e04-a5c0-617a408aafd6	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	14	Setoran sampah Organik	2026-06-14 09:00:00	REDUKSI_TONASE	f
6d5f3e48-a0f1-4ec4-a5b0-14351cac9781	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	44	Setoran sampah Anorganik	2026-07-09 10:00:00	REDUKSI_TONASE	f
7af4949e-45da-405a-b11e-cff69fbe1c12	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	29	Setoran sampah Organik	2026-06-23 23:00:00	REDUKSI_TONASE	f
6879a3ea-bf3a-4013-a628-72b09ce220c6	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	35	Setoran sampah Anorganik	2026-07-20 23:00:00	REDUKSI_TONASE	f
04e271a1-525d-4cb4-aad5-820b5d556c3d	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	9	Setoran sampah Organik	2026-07-07 00:00:00	REDUKSI_TONASE	f
fb4527fe-212a-468d-8ee8-b0fde7fb9e67	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	23	Setoran sampah Organik	2026-06-20 23:00:00	REDUKSI_TONASE	f
74982ab2-7266-4728-a899-8fc8fd375f8f	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	55	Setoran sampah Anorganik	2026-06-02 10:00:00	REDUKSI_TONASE	f
3ccd28b4-b671-4b1c-a189-812625785492	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	31	Setoran sampah Anorganik	2026-06-08 00:00:00	REDUKSI_TONASE	f
ac9d6806-4062-4709-94b5-ea6baf070459	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	30	Setoran sampah Organik	2026-07-11 09:00:00	REDUKSI_TONASE	f
aac29cbe-a6cb-4471-bffe-de4142b8bdff	878f098e-6dc8-4860-ba8e-53bb9dc307bf	36	Setoran sampah Organik	2026-06-17 10:00:00	REDUKSI_TONASE	f
9fca510c-44ea-4f0d-bddc-1928c3c84503	878f098e-6dc8-4860-ba8e-53bb9dc307bf	33	Setoran sampah Organik	2026-07-20 23:00:00	REDUKSI_TONASE	f
a64aad96-d329-44d5-ba12-2e3fc49b27e8	878f098e-6dc8-4860-ba8e-53bb9dc307bf	53	Setoran sampah Anorganik	2026-07-07 23:00:00	REDUKSI_TONASE	f
1fcd58a3-e7ed-4238-b707-5a893de2962b	878f098e-6dc8-4860-ba8e-53bb9dc307bf	24	Setoran sampah Organik	2026-06-11 00:00:00	REDUKSI_TONASE	f
222d792b-679c-4de4-83e3-459929fdfdd3	878f098e-6dc8-4860-ba8e-53bb9dc307bf	48	Setoran sampah Anorganik	2026-06-12 23:00:00	REDUKSI_TONASE	f
b5c58377-ef94-4234-b54c-2379aa6ec102	878f098e-6dc8-4860-ba8e-53bb9dc307bf	23	Setoran sampah Organik	2026-06-05 10:00:00	REDUKSI_TONASE	f
4ef00b81-6d32-480a-9dc8-fe3b49cac090	429797a7-76fc-4742-a802-e4cc532c85a9	34	Setoran sampah Anorganik	2026-06-21 09:00:00	REDUKSI_TONASE	f
092c9cde-56e3-4d42-9258-d8e0f08c1743	429797a7-76fc-4742-a802-e4cc532c85a9	25	Setoran sampah Anorganik	2026-07-04 00:00:00	REDUKSI_TONASE	f
0f0624b8-44f1-41c0-adcb-250c1501dbb5	429797a7-76fc-4742-a802-e4cc532c85a9	30	Setoran sampah Organik	2026-06-14 00:00:00	REDUKSI_TONASE	f
279a703f-3c24-446a-9281-5da986dfddf8	429797a7-76fc-4742-a802-e4cc532c85a9	35	Setoran sampah Organik	2026-07-01 23:00:00	REDUKSI_TONASE	f
fdbccde1-9dee-4ed0-b643-167995938492	429797a7-76fc-4742-a802-e4cc532c85a9	18	Setoran sampah Anorganik	2026-06-16 00:00:00	REDUKSI_TONASE	f
d5c64562-1a76-4e21-8899-15b81b61f6ea	429797a7-76fc-4742-a802-e4cc532c85a9	18	Setoran sampah Organik	2026-07-21 23:00:00	REDUKSI_TONASE	f
138e7381-7b7a-444c-892c-959f1e6d0070	cc384148-25ef-43c2-8187-289865e697a5	36	Setoran sampah Anorganik	2026-07-26 10:00:00	REDUKSI_TONASE	f
2ec2aaac-589e-48e9-b02c-8407923ec629	cc384148-25ef-43c2-8187-289865e697a5	18	Setoran sampah Anorganik	2026-06-23 23:00:00	REDUKSI_TONASE	f
03eaf0fc-9794-47f5-9a40-ad2c6d336157	cc384148-25ef-43c2-8187-289865e697a5	33	Setoran sampah Anorganik	2026-06-09 00:00:00	REDUKSI_TONASE	f
9a368d70-b52f-4f4b-b15c-151cae4a178b	cc384148-25ef-43c2-8187-289865e697a5	32	Setoran sampah Organik	2026-07-06 09:00:00	REDUKSI_TONASE	f
b9952092-3c75-473d-8655-97181772f363	cc384148-25ef-43c2-8187-289865e697a5	35	Setoran sampah Anorganik	2026-07-09 00:00:00	REDUKSI_TONASE	f
ebfe838a-df82-44d2-9d95-b5ec48c3eb8e	cc384148-25ef-43c2-8187-289865e697a5	16	Setoran sampah Anorganik	2026-06-19 09:00:00	REDUKSI_TONASE	f
aa5ac63a-1753-4451-8227-f33dbb200671	cc384148-25ef-43c2-8187-289865e697a5	10	Setoran sampah Organik	2026-07-01 10:00:00	REDUKSI_TONASE	f
e29307d7-738f-45d2-bd63-5fb63eee74ba	cc384148-25ef-43c2-8187-289865e697a5	28	Setoran sampah Organik	2026-06-27 00:00:00	REDUKSI_TONASE	f
bf6838eb-46f8-43bd-99fa-ace512470f78	e9a5cb9c-3a99-4448-8bfa-6388378e52a5	46	Setoran sampah Anorganik	2026-06-21 23:00:00	REDUKSI_TONASE	f
4f29f358-4c27-40d6-a7ff-fd170489e218	e9a5cb9c-3a99-4448-8bfa-6388378e52a5	10	Setoran sampah Organik	2026-07-22 00:00:00	REDUKSI_TONASE	f
5a97464c-3692-4f8d-9ca8-4926ce13e3d0	e9a5cb9c-3a99-4448-8bfa-6388378e52a5	39	Setoran sampah Anorganik	2026-07-23 10:00:00	REDUKSI_TONASE	f
6574c483-34e5-4994-8734-ab09d9dd98df	e9a5cb9c-3a99-4448-8bfa-6388378e52a5	21	Setoran sampah Organik	2026-06-28 09:00:00	REDUKSI_TONASE	f
4119bcbe-b785-4586-b7fa-f469c5496ef4	e9a5cb9c-3a99-4448-8bfa-6388378e52a5	33	Setoran sampah Anorganik	2026-06-29 10:00:00	REDUKSI_TONASE	f
b097e753-aa3b-468f-b1a2-20a2d6ddcaac	d6db8325-10f5-45cb-a509-b0d284cb91f0	51	Setoran sampah Anorganik	2026-07-27 09:00:00	REDUKSI_TONASE	f
1498e8dd-69c3-44c0-8e95-b30fc307e1bf	d6db8325-10f5-45cb-a509-b0d284cb91f0	22	Setoran sampah Organik	2026-07-16 23:00:00	REDUKSI_TONASE	f
cc8ee7d4-41f0-4719-99bc-c6fa71d4c98e	d6db8325-10f5-45cb-a509-b0d284cb91f0	25	Setoran sampah Organik	2026-07-01 23:00:00	REDUKSI_TONASE	f
946efb15-8453-4952-b897-4121df8c9a66	d6db8325-10f5-45cb-a509-b0d284cb91f0	45	Setoran sampah Anorganik	2026-07-08 10:00:00	REDUKSI_TONASE	f
dd563501-2c5a-4f58-ae3a-b05463cbe9d8	d6db8325-10f5-45cb-a509-b0d284cb91f0	26	Setoran sampah Anorganik	2026-07-08 09:00:00	REDUKSI_TONASE	f
06e27ce5-e7d4-434f-91b3-46057214d8d9	d6db8325-10f5-45cb-a509-b0d284cb91f0	23	Setoran sampah Anorganik	2026-06-10 23:00:00	REDUKSI_TONASE	f
2bcea4c2-3a7a-457f-bc26-70ce7b443efc	d6db8325-10f5-45cb-a509-b0d284cb91f0	33	Setoran sampah Anorganik	2026-06-17 00:00:00	REDUKSI_TONASE	f
76fedd67-7713-4c70-830d-db7e100019d4	54e9694d-7492-4543-9fe9-8fd7f4f5c921	28	Setoran sampah Organik	2026-06-21 00:00:00	REDUKSI_TONASE	f
5f8edf57-760b-4c48-bf64-8ec6f2485fc4	54e9694d-7492-4543-9fe9-8fd7f4f5c921	28	Setoran sampah Anorganik	2026-06-29 09:00:00	REDUKSI_TONASE	f
74be2cea-fb0f-4281-8058-6e657cb2cbac	54e9694d-7492-4543-9fe9-8fd7f4f5c921	22	Setoran sampah Organik	2026-06-05 09:00:00	REDUKSI_TONASE	f
88879768-574f-4687-b42c-749c672c5c25	54e9694d-7492-4543-9fe9-8fd7f4f5c921	24	Setoran sampah Anorganik	2026-07-25 00:00:00	REDUKSI_TONASE	f
774b1281-226f-4916-88f9-d50ad7d53d77	54e9694d-7492-4543-9fe9-8fd7f4f5c921	12	Setoran sampah Organik	2026-07-09 00:00:00	REDUKSI_TONASE	f
422a0fe9-ded7-4404-8c6c-e3ae31432662	54e9694d-7492-4543-9fe9-8fd7f4f5c921	16	Setoran sampah Anorganik	2026-06-24 00:00:00	REDUKSI_TONASE	f
0a733f91-8100-4ae1-8e6d-d0a85b1d158e	54e9694d-7492-4543-9fe9-8fd7f4f5c921	16	Setoran sampah Organik	2026-07-06 09:00:00	REDUKSI_TONASE	f
cc230071-929e-4c29-b3ca-0a890d37fbf9	54e9694d-7492-4543-9fe9-8fd7f4f5c921	9	Setoran sampah Organik	2026-05-30 23:00:00	REDUKSI_TONASE	f
41e15e29-09eb-4aa2-a057-153ef338c6ba	2a07a787-3e37-41c1-a052-ab2fea01f2d7	22	Setoran sampah Anorganik	2026-07-06 10:00:00	REDUKSI_TONASE	f
c61fd235-88df-4398-a61e-86d779f73cb1	2a07a787-3e37-41c1-a052-ab2fea01f2d7	23	Setoran sampah Organik	2026-06-30 09:00:00	REDUKSI_TONASE	f
1a7aa16c-dbc5-46f9-ae3d-0601663030e8	2a07a787-3e37-41c1-a052-ab2fea01f2d7	26	Setoran sampah Organik	2026-06-06 23:00:00	REDUKSI_TONASE	f
04b8f6c3-f0f6-413d-87ac-fa3570877abb	2a07a787-3e37-41c1-a052-ab2fea01f2d7	17	Setoran sampah Organik	2026-06-28 09:00:00	REDUKSI_TONASE	f
0b82fbcb-0b86-461b-b0df-33bc1f9e158b	2a07a787-3e37-41c1-a052-ab2fea01f2d7	31	Setoran sampah Organik	2026-07-28 23:00:00	REDUKSI_TONASE	f
8ed63a56-080a-4102-9501-aa47085f87f3	2a07a787-3e37-41c1-a052-ab2fea01f2d7	47	Setoran sampah Anorganik	2026-07-13 00:00:00	REDUKSI_TONASE	f
dc80e815-7d7e-4aad-ba1b-bd6b4e9749cd	2a07a787-3e37-41c1-a052-ab2fea01f2d7	20	Setoran sampah Organik	2026-06-07 10:00:00	REDUKSI_TONASE	f
5e1aba1b-e3d3-4190-a357-4ab6355d5c51	2a07a787-3e37-41c1-a052-ab2fea01f2d7	24	Setoran sampah Anorganik	2026-06-07 10:00:00	REDUKSI_TONASE	f
67ecf771-b00c-4ba0-ad25-9a1533e3fe16	2a07a787-3e37-41c1-a052-ab2fea01f2d7	16	Setoran sampah Anorganik	2026-07-18 09:00:00	REDUKSI_TONASE	f
447047d5-6e7d-4148-bea1-45adc00206b2	2a07a787-3e37-41c1-a052-ab2fea01f2d7	17	Setoran sampah Organik	2026-07-14 09:00:00	REDUKSI_TONASE	f
a1062763-8dc9-499b-838b-7f2f514e6b03	2a07a787-3e37-41c1-a052-ab2fea01f2d7	31	Setoran sampah Organik	2026-07-03 00:00:00	REDUKSI_TONASE	f
7efc4778-36d5-434b-a9cc-6e09cfa0c89f	f2edfdc0-029b-46db-8710-968c19475c2e	27	Setoran sampah Anorganik	2026-06-21 09:00:00	REDUKSI_TONASE	f
b6a2ab19-da50-4cc0-aebe-dec8834dd541	f2edfdc0-029b-46db-8710-968c19475c2e	17	Setoran sampah Organik	2026-06-01 09:00:00	REDUKSI_TONASE	f
0476c49f-9ac3-4e4e-9c23-6e1670aa5022	f2edfdc0-029b-46db-8710-968c19475c2e	31	Setoran sampah Organik	2026-06-09 09:00:00	REDUKSI_TONASE	f
b0ef0526-1bad-45fe-8b3d-d11d2a3409cf	f2edfdc0-029b-46db-8710-968c19475c2e	16	Setoran sampah Organik	2026-07-22 10:00:00	REDUKSI_TONASE	f
059dc5d5-8eff-4ba6-bde7-0ae8421c27de	f2edfdc0-029b-46db-8710-968c19475c2e	20	Setoran sampah Organik	2026-07-06 10:00:00	REDUKSI_TONASE	f
21d8b256-89dd-48e2-b34f-6385437c7ab1	f2edfdc0-029b-46db-8710-968c19475c2e	14	Setoran sampah Organik	2026-06-09 10:00:00	REDUKSI_TONASE	f
5e10cec6-e8fa-4496-a730-ab5df22362f0	f2edfdc0-029b-46db-8710-968c19475c2e	32	Setoran sampah Organik	2026-07-14 09:00:00	REDUKSI_TONASE	f
dfd6b83f-4b7a-4f3f-bf29-ff85950a1efd	f2edfdc0-029b-46db-8710-968c19475c2e	18	Setoran sampah Organik	2026-06-17 09:00:00	REDUKSI_TONASE	f
70618b66-494a-4526-b742-c80484b65cf0	f2edfdc0-029b-46db-8710-968c19475c2e	24	Setoran sampah Organik	2026-07-05 23:00:00	REDUKSI_TONASE	f
2b94ff6f-6d24-4b0d-a88f-cb53e284f6fd	f2edfdc0-029b-46db-8710-968c19475c2e	27	Setoran sampah Organik	2026-07-07 10:00:00	REDUKSI_TONASE	f
5a499cd5-305a-4b7a-9069-575c110c6cb8	b0a65787-bac6-4fec-87ef-24db782044bd	54	Setoran sampah Anorganik	2026-06-26 09:00:00	REDUKSI_TONASE	f
9caec1a1-d8f3-4b64-ad54-b1ab6c6f6847	b0a65787-bac6-4fec-87ef-24db782044bd	27	Setoran sampah Anorganik	2026-06-18 09:00:00	REDUKSI_TONASE	f
99271856-5044-4805-9e42-6e6790f08148	b0a65787-bac6-4fec-87ef-24db782044bd	20	Setoran sampah Organik	2026-06-20 10:00:00	REDUKSI_TONASE	f
bf7d2597-15f6-4129-aed4-a0f6a9004afe	b0a65787-bac6-4fec-87ef-24db782044bd	10	Setoran sampah Organik	2026-07-06 00:00:00	REDUKSI_TONASE	f
f8b7708f-4c75-4d12-8f0a-596278dd133f	b0a65787-bac6-4fec-87ef-24db782044bd	19	Setoran sampah Organik	2026-06-24 09:00:00	REDUKSI_TONASE	f
b807d0c2-1074-4adb-916e-cfbefe6aa631	b0a65787-bac6-4fec-87ef-24db782044bd	52	Setoran sampah Anorganik	2026-06-14 10:00:00	REDUKSI_TONASE	f
2f504133-28fb-43f7-9c7f-bcc621c15d0d	b0a65787-bac6-4fec-87ef-24db782044bd	31	Setoran sampah Organik	2026-07-05 23:00:00	REDUKSI_TONASE	f
46a1e5db-88e7-4b99-ba9a-23eb16877a23	b0a65787-bac6-4fec-87ef-24db782044bd	36	Setoran sampah Organik	2026-07-13 10:00:00	REDUKSI_TONASE	f
8faa6277-f4ac-4c77-896a-144d35665f47	b0a65787-bac6-4fec-87ef-24db782044bd	18	Setoran sampah Organik	2026-07-12 23:00:00	REDUKSI_TONASE	f
1b2cf7fa-1871-4055-a9ae-9b3986e6c5a2	b0a65787-bac6-4fec-87ef-24db782044bd	48	Setoran sampah Anorganik	2026-07-27 23:00:00	REDUKSI_TONASE	f
011a82b8-72e8-43df-a5d8-7b97bd10fe4f	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	16	Setoran sampah Anorganik	2026-06-09 10:00:00	REDUKSI_TONASE	f
da462b21-44d6-4ad2-a536-64223ff1409b	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	35	Setoran sampah Anorganik	2026-07-27 00:00:00	REDUKSI_TONASE	f
f4f2b569-55ea-43c7-a54e-f96256a17f3a	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	19	Setoran sampah Organik	2026-07-17 09:00:00	REDUKSI_TONASE	f
eec6668c-eddb-4cd8-ba69-806b73f391fe	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	11	Setoran sampah Organik	2026-07-28 10:00:00	REDUKSI_TONASE	f
7b04eb6b-2d91-4138-9cb4-ef026daa5253	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	15	Setoran sampah Organik	2026-05-31 00:00:00	REDUKSI_TONASE	f
2e28cf29-874f-41dc-b40c-fe4b54b6c19f	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	24	Setoran sampah Anorganik	2026-07-20 00:00:00	REDUKSI_TONASE	f
3feab7c8-4246-43b3-b8c3-277bcb0533a8	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	18	Setoran sampah Organik	2026-07-04 23:00:00	REDUKSI_TONASE	f
fe8b9ffb-4533-49a6-b7c8-d1e6d6020763	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	25	Setoran sampah Anorganik	2026-06-22 23:00:00	REDUKSI_TONASE	f
aad178b3-8606-4572-9468-7934795d4ff5	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	26	Setoran sampah Organik	2026-07-01 23:00:00	REDUKSI_TONASE	f
29d67935-199b-4e65-83a8-af28fab6cf0b	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	26	Setoran sampah Anorganik	2026-07-04 23:00:00	REDUKSI_TONASE	f
9cb51fb6-fbcf-49be-870d-6a54d5c438f8	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	21	Setoran sampah Organik	2026-07-13 09:00:00	REDUKSI_TONASE	f
21c72f95-a198-4ece-9b29-e94201f911cb	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	15	Setoran sampah Organik	2026-07-26 09:00:00	REDUKSI_TONASE	f
885558b2-8439-4ef6-8adf-dc3b36b33ec8	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	28	Setoran sampah Anorganik	2026-07-08 23:00:00	REDUKSI_TONASE	f
f4e65a93-c0dc-4d5d-be87-c46dcf463f71	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	51	Setoran sampah Anorganik	2026-06-26 23:00:00	REDUKSI_TONASE	f
834f3e6f-b0c1-4cf0-8db7-f274fdd2ec25	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	32	Setoran sampah Organik	2026-07-11 00:00:00	REDUKSI_TONASE	f
fc72e68f-f61f-46ae-af18-9b665fb28b23	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	36	Setoran sampah Anorganik	2026-06-20 23:00:00	REDUKSI_TONASE	f
80e41a20-4bcd-42d7-94f6-7fba7d64060a	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	16	Setoran sampah Anorganik	2026-06-20 23:00:00	REDUKSI_TONASE	f
75701323-102f-48f5-904a-5595566b4a16	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	24	Setoran sampah Organik	2026-06-18 09:00:00	REDUKSI_TONASE	f
d7e401a1-1ca7-4eab-8803-df1fea4a7e78	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	41	Setoran sampah Anorganik	2026-07-06 23:00:00	REDUKSI_TONASE	f
be470a1e-6fe9-4c68-b66a-2c2cf87f77a2	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	31	Setoran sampah Organik	2026-07-01 00:00:00	REDUKSI_TONASE	f
b0c508a5-f650-42b9-b155-d4aca34ce044	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	15	Setoran sampah Anorganik	2026-06-20 00:00:00	REDUKSI_TONASE	f
0e2676f9-e33a-4532-8550-761ad37d41e4	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	33	Setoran sampah Organik	2026-06-29 23:00:00	REDUKSI_TONASE	f
8d1ac8ac-3b79-4296-8e4e-ed5115189f3c	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	18	Setoran sampah Organik	2026-06-09 00:00:00	REDUKSI_TONASE	f
d16f83f0-f49f-480e-838f-2079e33c56d0	d32557cf-a420-438e-8d42-c8b3d35ecb08	17	Setoran sampah Organik	2026-07-05 00:00:00	REDUKSI_TONASE	f
7a673859-1661-4dc9-8cdc-f7292777e29b	d32557cf-a420-438e-8d42-c8b3d35ecb08	27	Setoran sampah Organik	2026-07-12 00:00:00	REDUKSI_TONASE	f
297286c0-b7ae-4272-90c8-529a0d5b08c6	d32557cf-a420-438e-8d42-c8b3d35ecb08	13	Setoran sampah Organik	2026-07-16 23:00:00	REDUKSI_TONASE	f
4aa5e57f-0bfd-40c3-997e-0d309de213ac	d32557cf-a420-438e-8d42-c8b3d35ecb08	18	Setoran sampah Organik	2026-07-02 09:00:00	REDUKSI_TONASE	f
3e54864d-043d-484a-920c-11faa27a1086	d32557cf-a420-438e-8d42-c8b3d35ecb08	33	Setoran sampah Anorganik	2026-06-06 10:00:00	REDUKSI_TONASE	f
5f64c1fd-8670-4562-9b73-6d7313266d5a	d32557cf-a420-438e-8d42-c8b3d35ecb08	37	Setoran sampah Anorganik	2026-06-05 10:00:00	REDUKSI_TONASE	f
2a713454-9f65-4fb6-af37-454e8e167443	d32557cf-a420-438e-8d42-c8b3d35ecb08	26	Setoran sampah Anorganik	2026-07-16 23:00:00	REDUKSI_TONASE	f
4d08f357-b7c5-4090-9b19-b285d174d0d5	d32557cf-a420-438e-8d42-c8b3d35ecb08	17	Setoran sampah Anorganik	2026-06-05 23:00:00	REDUKSI_TONASE	f
ca850ec8-25e5-4f02-bda1-80854c045217	d32557cf-a420-438e-8d42-c8b3d35ecb08	32	Setoran sampah Organik	2026-07-26 23:00:00	REDUKSI_TONASE	f
62620e24-81b7-4b9c-93e7-0990ead4570e	d32557cf-a420-438e-8d42-c8b3d35ecb08	25	Setoran sampah Organik	2026-06-06 10:00:00	REDUKSI_TONASE	f
ff8764e9-f64b-44e7-8ba6-0c53c393cf9f	d32557cf-a420-438e-8d42-c8b3d35ecb08	43	Setoran sampah Anorganik	2026-06-15 23:00:00	REDUKSI_TONASE	f
ebb8028a-d39c-48c6-9de2-f31aa73b89ec	514e074f-d89a-4380-87d8-e91aef8ec350	25	Setoran sampah Anorganik	2026-06-01 09:00:00	REDUKSI_TONASE	f
1a1ac7e2-3db0-4d64-aee6-a96cfcf569f5	514e074f-d89a-4380-87d8-e91aef8ec350	21	Setoran sampah Organik	2026-06-09 23:00:00	REDUKSI_TONASE	f
705e45d1-e72a-4f80-99d0-746a165f93a6	514e074f-d89a-4380-87d8-e91aef8ec350	22	Setoran sampah Anorganik	2026-07-27 09:00:00	REDUKSI_TONASE	f
a6bba5bb-d603-485b-b9cc-f0ebe25d43ed	514e074f-d89a-4380-87d8-e91aef8ec350	12	Setoran sampah Organik	2026-06-22 09:00:00	REDUKSI_TONASE	f
5a806ce9-a343-49b7-a33a-a500aa8d34e9	514e074f-d89a-4380-87d8-e91aef8ec350	32	Setoran sampah Anorganik	2026-06-28 10:00:00	REDUKSI_TONASE	f
06224002-1361-4f23-8d42-2367f4e889ce	514e074f-d89a-4380-87d8-e91aef8ec350	26	Setoran sampah Organik	2026-07-01 09:00:00	REDUKSI_TONASE	f
6d5a7187-40fe-4137-be22-1c788624b013	514e074f-d89a-4380-87d8-e91aef8ec350	20	Setoran sampah Organik	2026-07-18 00:00:00	REDUKSI_TONASE	f
2a9822a4-1efa-4913-8fa5-8b1e66811e97	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	13	Setoran sampah Organik	2026-06-27 23:00:00	REDUKSI_TONASE	f
7cfd2716-346e-4d57-8022-5a25b73ee0e7	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	16	Setoran sampah Organik	2026-07-18 23:00:00	REDUKSI_TONASE	f
a172d535-7128-4de6-a90c-7d26ad1ef55c	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	32	Setoran sampah Organik	2026-06-19 23:00:00	REDUKSI_TONASE	f
eee1327f-c3ab-4033-90dc-84affac336fe	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	56	Setoran sampah Anorganik	2026-07-04 23:00:00	REDUKSI_TONASE	f
fd1dc50b-be42-434b-a4e8-e90368ed4e7b	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	23	Setoran sampah Anorganik	2026-07-05 10:00:00	REDUKSI_TONASE	f
9d1a4674-6a3b-4db7-9352-a9de88095c4e	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	29	Setoran sampah Organik	2026-07-07 09:00:00	REDUKSI_TONASE	f
05e93302-f542-464f-8507-58f45ba86e2e	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	34	Setoran sampah Organik	2026-07-26 09:00:00	REDUKSI_TONASE	f
6bfebbfa-7f21-4c97-91e9-158dbae53ab1	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	22	Setoran sampah Anorganik	2026-06-17 10:00:00	REDUKSI_TONASE	f
e1504468-b764-4bb0-b768-8a3131bfb5f5	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	29	Setoran sampah Anorganik	2026-06-13 23:00:00	REDUKSI_TONASE	f
4472eab5-d5d7-4829-9e93-6e7a2d775b67	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	15	Setoran sampah Organik	2026-07-23 00:00:00	REDUKSI_TONASE	f
4233005d-4fdc-4c1c-93fe-f47ef91d10d6	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	11	Setoran sampah Organik	2026-07-17 00:00:00	REDUKSI_TONASE	f
98c6764c-5dea-4ca7-8fbb-509056571c4d	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	13	Setoran sampah Organik	2026-06-04 00:00:00	REDUKSI_TONASE	f
2b322c35-d54d-4c5a-899d-e8fdde6ac693	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	34	Setoran sampah Anorganik	2026-06-02 23:00:00	REDUKSI_TONASE	f
04ddb48d-b5c5-4ee3-8af2-efda1c6ef0b1	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	35	Setoran sampah Anorganik	2026-06-27 10:00:00	REDUKSI_TONASE	f
8b224954-1602-403b-b3fd-05f32566cf83	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	22	Setoran sampah Anorganik	2026-07-23 23:00:00	REDUKSI_TONASE	f
e10a7d82-e264-46a8-840a-dc45c05904ec	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	30	Setoran sampah Anorganik	2026-07-25 10:00:00	REDUKSI_TONASE	f
3a584012-be92-4237-97c8-a6ef4b09e474	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	41	Setoran sampah Anorganik	2026-07-10 10:00:00	REDUKSI_TONASE	f
f6bd0658-8b59-409a-8692-22f86dd1341d	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	18	Setoran sampah Anorganik	2026-07-18 10:00:00	REDUKSI_TONASE	f
7ddf5548-f959-4e83-88c9-60e568ed7804	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	35	Setoran sampah Anorganik	2026-07-07 00:00:00	REDUKSI_TONASE	f
20aacc58-946f-4ada-94f9-184ac73bda18	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	14	Setoran sampah Anorganik	2026-06-11 00:00:00	REDUKSI_TONASE	f
f36df5e4-923e-453f-9937-b0ec835d9190	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	18	Setoran sampah Anorganik	2026-06-07 00:00:00	REDUKSI_TONASE	f
ea4c521e-21a0-4552-b4b9-5b91397df067	e77f0e98-184a-411a-ae09-c5393acbc976	56	Setoran sampah Anorganik	2026-07-18 00:00:00	REDUKSI_TONASE	f
b41f3684-cb31-41b0-9827-f31886acf5c5	e77f0e98-184a-411a-ae09-c5393acbc976	18	Setoran sampah Anorganik	2026-07-26 23:00:00	REDUKSI_TONASE	f
3bba2854-9c8c-4b48-a971-2122ea7a6e57	e77f0e98-184a-411a-ae09-c5393acbc976	30	Setoran sampah Organik	2026-07-04 10:00:00	REDUKSI_TONASE	f
3a6583d3-167c-4379-9807-3bc7b206b3eb	e77f0e98-184a-411a-ae09-c5393acbc976	18	Setoran sampah Organik	2026-07-24 23:00:00	REDUKSI_TONASE	f
02b7d839-b160-4628-aa6c-8650caceda8b	e77f0e98-184a-411a-ae09-c5393acbc976	25	Setoran sampah Organik	2026-07-19 09:00:00	REDUKSI_TONASE	f
075fe541-9c07-4121-9088-5043c1fa4821	e77f0e98-184a-411a-ae09-c5393acbc976	26	Setoran sampah Anorganik	2026-07-24 23:00:00	REDUKSI_TONASE	f
276d05a3-761f-4c1d-b4ac-f7da9deda446	e77f0e98-184a-411a-ae09-c5393acbc976	32	Setoran sampah Organik	2026-07-19 23:00:00	REDUKSI_TONASE	f
101dd00d-13b9-4d76-a8da-3e0f2af6f0e5	e77f0e98-184a-411a-ae09-c5393acbc976	43	Setoran sampah Anorganik	2026-06-12 00:00:00	REDUKSI_TONASE	f
4cab309e-4b9b-41e0-a7e0-871845996f3e	e77f0e98-184a-411a-ae09-c5393acbc976	12	Setoran sampah Organik	2026-07-01 09:00:00	REDUKSI_TONASE	f
13e4d0de-58f0-40a3-921c-7d88d60eb110	e77f0e98-184a-411a-ae09-c5393acbc976	12	Setoran sampah Organik	2026-06-18 10:00:00	REDUKSI_TONASE	f
e5a7e905-c608-4478-9c4e-e797c375cfac	e77f0e98-184a-411a-ae09-c5393acbc976	43	Setoran sampah Anorganik	2026-06-25 09:00:00	REDUKSI_TONASE	f
e280e0f7-01e9-4ca3-b887-1a4265523470	1cfba3ed-a354-4232-8d05-a35df134e95b	31	Setoran sampah Organik	2026-06-16 00:00:00	REDUKSI_TONASE	f
5bc4ba73-6e2a-45f6-8d45-ba93b287e468	1cfba3ed-a354-4232-8d05-a35df134e95b	31	Setoran sampah Anorganik	2026-06-03 23:00:00	REDUKSI_TONASE	f
72fa59ba-e5a3-42b2-9199-0bae540f9f19	1cfba3ed-a354-4232-8d05-a35df134e95b	16	Setoran sampah Anorganik	2026-07-02 09:00:00	REDUKSI_TONASE	f
e9f23b42-9b6a-43d3-abad-7734f99da549	1cfba3ed-a354-4232-8d05-a35df134e95b	40	Setoran sampah Anorganik	2026-06-21 23:00:00	REDUKSI_TONASE	f
c74d0dad-c492-457d-af1e-868252197c17	1cfba3ed-a354-4232-8d05-a35df134e95b	11	Setoran sampah Organik	2026-07-27 10:00:00	REDUKSI_TONASE	f
c7437b33-32a9-4d4e-bfed-a3a933512b7f	1cfba3ed-a354-4232-8d05-a35df134e95b	21	Setoran sampah Anorganik	2026-06-28 23:00:00	REDUKSI_TONASE	f
efd34cd3-5909-4b14-ac2c-d97254f697a9	1cfba3ed-a354-4232-8d05-a35df134e95b	38	Setoran sampah Anorganik	2026-06-09 09:00:00	REDUKSI_TONASE	f
8b1816f8-e27b-426d-971f-6f4ee30ecb19	1cfba3ed-a354-4232-8d05-a35df134e95b	30	Setoran sampah Anorganik	2026-07-01 09:00:00	REDUKSI_TONASE	f
a3339bdf-5084-4769-8d03-58d3aa233474	1cfba3ed-a354-4232-8d05-a35df134e95b	28	Setoran sampah Anorganik	2026-07-16 09:00:00	REDUKSI_TONASE	f
b0a1cf1b-4b0e-4783-8357-b707e705490e	ae934d2f-e7ae-4471-ab73-6388951d3c2b	33	Setoran sampah Organik	2026-06-21 00:00:00	REDUKSI_TONASE	f
2d69eafe-4246-49e7-aa08-b4af6a96c124	ae934d2f-e7ae-4471-ab73-6388951d3c2b	13	Setoran sampah Organik	2026-07-06 10:00:00	REDUKSI_TONASE	f
6572ed2f-5557-40f6-8e04-68b919dda926	ae934d2f-e7ae-4471-ab73-6388951d3c2b	20	Setoran sampah Anorganik	2026-07-22 23:00:00	REDUKSI_TONASE	f
b61bc199-b2c6-48d9-9e05-bbdc4b397e8f	ae934d2f-e7ae-4471-ab73-6388951d3c2b	19	Setoran sampah Organik	2026-06-18 09:00:00	REDUKSI_TONASE	f
f476bc6b-7a72-4e9a-b2f2-3f77bb9e892b	ae934d2f-e7ae-4471-ab73-6388951d3c2b	42	Setoran sampah Anorganik	2026-06-19 23:00:00	REDUKSI_TONASE	f
38279ae3-9a1c-4789-b8c8-689d7633bc5d	ae934d2f-e7ae-4471-ab73-6388951d3c2b	16	Setoran sampah Anorganik	2026-07-07 23:00:00	REDUKSI_TONASE	f
58333849-1ca9-4e40-a8c5-3cb8cfe2de94	ae934d2f-e7ae-4471-ab73-6388951d3c2b	11	Setoran sampah Organik	2026-07-13 10:00:00	REDUKSI_TONASE	f
a9bb567d-8ceb-4aad-b066-94cda3aaa7d4	ae934d2f-e7ae-4471-ab73-6388951d3c2b	31	Setoran sampah Anorganik	2026-07-05 09:00:00	REDUKSI_TONASE	f
67e3d988-71e7-4a6d-a7ae-c1b02927e018	ae934d2f-e7ae-4471-ab73-6388951d3c2b	16	Setoran sampah Anorganik	2026-06-16 10:00:00	REDUKSI_TONASE	f
154f1ea5-10f5-4d9b-889e-7d59c2cff7ba	ae934d2f-e7ae-4471-ab73-6388951d3c2b	35	Setoran sampah Anorganik	2026-07-21 10:00:00	REDUKSI_TONASE	f
6e4af923-e9e8-4750-bf9d-e3b058500de0	ae934d2f-e7ae-4471-ab73-6388951d3c2b	35	Setoran sampah Organik	2026-06-01 09:00:00	REDUKSI_TONASE	f
c43d94a2-6410-49d9-8eaa-69da9fefdfd8	13a8cc8d-80ad-4559-a301-ea7a8481f621	54	Setoran sampah Anorganik	2026-07-12 23:00:00	REDUKSI_TONASE	f
763ad2ca-ca47-4001-a953-e9771c9b5694	13a8cc8d-80ad-4559-a301-ea7a8481f621	35	Setoran sampah Anorganik	2026-07-09 23:00:00	REDUKSI_TONASE	f
73fd3c7d-acc5-4aea-98aa-b036fea52670	13a8cc8d-80ad-4559-a301-ea7a8481f621	32	Setoran sampah Organik	2026-07-02 23:00:00	REDUKSI_TONASE	f
c069b93d-ac0a-4728-a5d3-4412a3323fa3	13a8cc8d-80ad-4559-a301-ea7a8481f621	25	Setoran sampah Organik	2026-07-26 10:00:00	REDUKSI_TONASE	f
ad15eeed-2735-4814-80fe-35a1221af973	13a8cc8d-80ad-4559-a301-ea7a8481f621	33	Setoran sampah Anorganik	2026-07-18 00:00:00	REDUKSI_TONASE	f
c4fed786-b9e9-4c10-9517-878dd483a0b0	13a8cc8d-80ad-4559-a301-ea7a8481f621	35	Setoran sampah Anorganik	2026-06-26 10:00:00	REDUKSI_TONASE	f
9fc1df77-41bc-408a-ab8a-1a2b8b09de38	13a8cc8d-80ad-4559-a301-ea7a8481f621	48	Setoran sampah Anorganik	2026-06-14 23:00:00	REDUKSI_TONASE	f
7db3176b-1adc-4daa-9577-eb895ecff8d4	13a8cc8d-80ad-4559-a301-ea7a8481f621	19	Setoran sampah Anorganik	2026-06-20 23:00:00	REDUKSI_TONASE	f
afdd91f0-f07b-4fa0-93f3-b98e1837e722	13a8cc8d-80ad-4559-a301-ea7a8481f621	39	Setoran sampah Anorganik	2026-05-30 23:00:00	REDUKSI_TONASE	f
41cccffb-89d1-4b2f-beb7-1aaf13cddf04	13a8cc8d-80ad-4559-a301-ea7a8481f621	21	Setoran sampah Organik	2026-06-03 23:00:00	REDUKSI_TONASE	f
cc699834-f700-496b-91ae-88c17c9f52ef	13a8cc8d-80ad-4559-a301-ea7a8481f621	55	Setoran sampah Anorganik	2026-06-10 09:00:00	REDUKSI_TONASE	f
926c34a3-75d1-4fbf-9475-c897637c687c	13a8cc8d-80ad-4559-a301-ea7a8481f621	19	Setoran sampah Anorganik	2026-06-08 00:00:00	REDUKSI_TONASE	f
d10de91e-993c-433a-8237-493fe17f9468	b8e9385a-6ed1-41b8-8b74-55123baa568a	21	Setoran sampah Organik	2026-07-23 09:00:00	REDUKSI_TONASE	f
404fbc68-bef4-45e4-b3dd-7dd915c3944a	b8e9385a-6ed1-41b8-8b74-55123baa568a	12	Setoran sampah Organik	2026-06-05 09:00:00	REDUKSI_TONASE	f
4be35783-6d48-4a6d-ab94-caa1f4359b33	b8e9385a-6ed1-41b8-8b74-55123baa568a	28	Setoran sampah Anorganik	2026-07-08 10:00:00	REDUKSI_TONASE	f
bad96e87-056a-46cf-aff6-9e1351826b41	b8e9385a-6ed1-41b8-8b74-55123baa568a	30	Setoran sampah Anorganik	2026-06-15 09:00:00	REDUKSI_TONASE	f
876387b0-c64a-4c46-96fc-4453dc279d29	b8e9385a-6ed1-41b8-8b74-55123baa568a	21	Setoran sampah Anorganik	2026-06-25 23:00:00	REDUKSI_TONASE	f
bcbf673b-ef97-4037-9886-cc6083f515f8	b8e9385a-6ed1-41b8-8b74-55123baa568a	23	Setoran sampah Organik	2026-06-30 23:00:00	REDUKSI_TONASE	f
\.


--
-- Data for Name: riwayat_serah_terima_kkn; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.riwayat_serah_terima_kkn (id, id_pengguna_dari, id_pengguna_ke, id_rt_rw, notes, tanggal_serah_terima) FROM stdin;
\.


--
-- Data for Name: rumah_tangga; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.rumah_tangga (id, id_pengguna, address, id_rt_rw, latitude, longitude, dibuat_pada, diperbarui_pada) FROM stdin;
10626f05-d666-4752-864c-2edbd67ee2c6	2be71aba-1bf7-411e-b539-076e033dbc50	Jl. Warga RT 01 1 RW 01 No. 97	3	-6.87084020	107.62466477	2026-07-29 04:54:07.951	2026-07-29 04:54:07.951
80c2257c-07dd-4134-aaaa-bc2b26b1f670	67996a97-6f02-47b0-8218-cb7760d5c9e4	Jl. Warga RT 01 2 RW 01 No. 70	3	-6.86878672	107.62726526	2026-07-29 04:54:08.252	2026-07-29 04:54:08.252
2947169b-a607-48fc-9875-50cb6ca18cd9	f8f351b8-1174-40d2-b107-988355cfac0d	Jl. Warga RT 01 3 RW 01 No. 64	3	-6.87040576	107.62634651	2026-07-29 04:54:08.424	2026-07-29 04:54:08.424
a240af29-8660-46d3-95c2-62b9a1d265ba	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	Jl. Warga RT 02 1 RW 01 No. 96	4	-6.86458000	107.62102662	2026-07-29 04:54:08.635	2026-07-29 04:54:08.635
efd94b5b-715c-433e-91c3-84d422b01c63	6e65c7cb-2969-4483-be16-923f5dfc02b5	Jl. Warga RT 02 2 RW 01 No. 45	4	-6.86416815	107.62148695	2026-07-29 04:54:08.83	2026-07-29 04:54:08.83
44b81e55-f1e2-4bdf-8b6b-67a9b714b2e6	8265f3d5-9929-4810-9d35-8254c92b7161	Jl. Warga RT 02 3 RW 01 No. 78	4	-6.86420858	107.61974313	2026-07-29 04:54:09.001	2026-07-29 04:54:09.001
e66f6b71-ae4d-46d3-b030-81a3df8ad1c1	6350bf55-763c-4db5-a60a-011fb84c6ef2	Jl. Warga RT 01 1 RW 02 No. 28	5	-6.86971681	107.62291201	2026-07-29 04:54:09.124	2026-07-29 04:54:09.124
8a371802-d253-4bfe-87e4-06733cef067c	ece74bb6-33f1-4e23-b489-aedd0f91cbca	Jl. Warga RT 01 2 RW 02 No. 41	5	-6.87135190	107.62167193	2026-07-29 04:54:09.246	2026-07-29 04:54:09.246
ed8fb557-a838-460b-a870-e6c0584e3a0e	866e0066-e48e-4339-a2a5-40d06ba5c93e	Jl. Warga RT 01 3 RW 02 No. 19	5	-6.87069689	107.62186918	2026-07-29 04:54:09.446	2026-07-29 04:54:09.446
b738d131-f595-418d-8f38-66c4dd11e010	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	Jl. Warga RT 02 1 RW 02 No. 4	6	-6.87291716	107.61850318	2026-07-29 04:54:09.552	2026-07-29 04:54:09.552
19960806-c005-4e1a-be75-47c564c69cd1	878f098e-6dc8-4860-ba8e-53bb9dc307bf	Jl. Warga RT 02 2 RW 02 No. 69	6	-6.87298936	107.61944888	2026-07-29 04:54:09.751	2026-07-29 04:54:09.751
7ce5af0c-7c13-4cd8-8cc1-f53c95bdc9dc	429797a7-76fc-4742-a802-e4cc532c85a9	Jl. Warga RT 02 3 RW 02 No. 80	6	-6.87557828	107.61853498	2026-07-29 04:54:09.876	2026-07-29 04:54:09.876
f43cf308-01f7-40cb-b445-c259cd0ca6cc	cc384148-25ef-43c2-8187-289865e697a5	Jl. Warga RT 01 1 RW 01 No. 16	7	-6.88686638	107.61646977	2026-07-29 04:54:09.993	2026-07-29 04:54:09.993
b3e7d2bd-cc72-4e2d-8c87-41173f3b34f0	e9a5cb9c-3a99-4448-8bfa-6388378e52a5	Jl. Warga RT 01 2 RW 01 No. 88	7	-6.88620745	107.61795241	2026-07-29 04:54:10.116	2026-07-29 04:54:10.116
bc9ddcb8-7492-46b7-aedd-cd36e9766702	d6db8325-10f5-45cb-a509-b0d284cb91f0	Jl. Warga RT 01 3 RW 01 No. 9	7	-6.88541985	107.61610452	2026-07-29 04:54:10.201	2026-07-29 04:54:10.201
4f4f7df3-9bba-495c-a268-a74633a7a2bd	54e9694d-7492-4543-9fe9-8fd7f4f5c921	Jl. Warga RT 02 1 RW 01 No. 65	8	-6.88370895	107.61639500	2026-07-29 04:54:10.323	2026-07-29 04:54:10.323
02bbc7c7-7cc0-448c-838c-b73bc77f8b57	2a07a787-3e37-41c1-a052-ab2fea01f2d7	Jl. Warga RT 02 2 RW 01 No. 60	8	-6.88454046	107.61776358	2026-07-29 04:54:10.453	2026-07-29 04:54:10.453
cd94558a-c26c-49a0-9066-d7c378924c95	f2edfdc0-029b-46db-8710-968c19475c2e	Jl. Warga RT 02 3 RW 01 No. 73	8	-6.88466010	107.61669869	2026-07-29 04:54:10.615	2026-07-29 04:54:10.615
4f341caf-fa8d-4c5b-b952-d1e2b0f35d48	b0a65787-bac6-4fec-87ef-24db782044bd	Jl. Warga RT 01 1 RW 02 No. 1	9	-6.88698161	107.61644111	2026-07-29 04:54:10.776	2026-07-29 04:54:10.776
a8961f42-bdd5-41ec-b676-84842e8af64a	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	Jl. Warga RT 01 2 RW 02 No. 96	9	-6.88584853	107.61753474	2026-07-29 04:54:10.955	2026-07-29 04:54:10.955
f8a27cbb-9ddd-4d72-8d14-0bf23c32361d	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	Jl. Warga RT 01 3 RW 02 No. 93	9	-6.88779207	107.61864850	2026-07-29 04:54:11.165	2026-07-29 04:54:11.165
50d2a5e6-25fe-49f1-910f-24a023250221	d32557cf-a420-438e-8d42-c8b3d35ecb08	Jl. Warga RT 02 1 RW 02 No. 33	10	-6.88717583	107.61845037	2026-07-29 04:54:11.392	2026-07-29 04:54:11.392
af700c1d-12aa-44c3-b394-0f0c39a72706	514e074f-d89a-4380-87d8-e91aef8ec350	Jl. Warga RT 02 2 RW 02 No. 97	10	-6.88770695	107.61700307	2026-07-29 04:54:11.598	2026-07-29 04:54:11.598
79e13176-159f-4ca3-a663-f1e84ce5d0b0	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	Jl. Warga RT 02 3 RW 02 No. 80	10	-6.88721582	107.61714081	2026-07-29 04:54:11.732	2026-07-29 04:54:11.732
46caa259-4ef5-4bb9-8d71-197e2a5e8599	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	Jl. Warga RT 01 1 RW 01 No. 1	11	-6.89147411	107.61462258	2026-07-29 04:54:11.937	2026-07-29 04:54:11.937
fcc5f9b2-0bd3-44bc-a51e-a807083a0274	e77f0e98-184a-411a-ae09-c5393acbc976	Jl. Warga RT 01 2 RW 01 No. 81	11	-6.89067178	107.61658384	2026-07-29 04:54:12.133	2026-07-29 04:54:12.133
248eff1f-0f9a-41fb-b6cb-c87b8eb5f975	1cfba3ed-a354-4232-8d05-a35df134e95b	Jl. Warga RT 01 3 RW 01 No. 6	11	-6.89266294	107.61491203	2026-07-29 04:54:12.347	2026-07-29 04:54:12.347
181e7ed0-9e39-483a-a5b2-65be71a6ee9c	ae934d2f-e7ae-4471-ab73-6388951d3c2b	Jl. Warga RT 02 1 RW 01 No. 41	12	-6.89180482	107.61549645	2026-07-29 04:54:12.527	2026-07-29 04:54:12.527
1d72599a-9b37-4cbb-9a0e-f2deab9a547e	13a8cc8d-80ad-4559-a301-ea7a8481f621	Jl. Warga RT 02 2 RW 01 No. 87	12	-6.89231868	107.61511568	2026-07-29 04:54:12.737	2026-07-29 04:54:12.737
8be46f83-6f43-464a-9c8e-72b21316c3e1	b8e9385a-6ed1-41b8-8b74-55123baa568a	Jl. Warga RT 02 3 RW 01 No. 58	12	-6.89035557	107.61371110	2026-07-29 04:54:12.978	2026-07-29 04:54:12.978
\.


--
-- Data for Name: setoran_manual; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.setoran_manual (id, petugas_residu_id, diinput_oleh, rw_id, foto_residu_url, berat, unit, lokasi_gps, kategori, created_at) FROM stdin;
20da197f-a683-4853-b9e4-85441d41ab54	4f7be806-dc90-42aa-9626-744df99f2082	petugas	3	https://dummyimage.com/600x400/ff0000/fff&text=Residu	15.55	Kg	-6.86784054626735,107.62681613023932	residu	2026-07-12 04:54:13.109
a8725c3a-7f0a-4b61-8639-47531eeec393	4f7be806-dc90-42aa-9626-744df99f2082	petugas	3	https://dummyimage.com/600x400/ff0000/fff&text=Residu	7.67	Kg	-6.868065600818557,107.62632635144763	residu	2026-07-29 04:54:13.12
48daaac1-8ba2-4343-b9cd-c650963492a4	4f7be806-dc90-42aa-9626-744df99f2082	petugas	3	https://dummyimage.com/600x400/ff0000/fff&text=Residu	19.69	Kg	-6.868030040744018,107.62749492464378	residu	2026-06-23 04:54:13.127
99e52491-95f6-4cb6-98fa-0232ab027fce	4f7be806-dc90-42aa-9626-744df99f2082	petugas	3	https://dummyimage.com/600x400/ff0000/fff&text=Residu	15.66	Kg	-6.868787558838901,107.6277063633655	residu	2026-06-22 04:54:13.133
dc987a2b-32ce-42b3-be4e-0cb262d3160b	4f7be806-dc90-42aa-9626-744df99f2082	petugas	3	https://dummyimage.com/600x400/ff0000/fff&text=Residu	18.11	Kg	-6.868352118388057,107.62637138670465	residu	2026-07-06 04:54:13.139
67401c5b-f146-4acb-b9e3-cac58c6dfa3e	4f7be806-dc90-42aa-9626-744df99f2082	petugas	3	https://dummyimage.com/600x400/ff0000/fff&text=Residu	8.86	Kg	-6.868206467489229,107.62745132748067	residu	2026-06-18 04:54:13.145
dccbc257-ac07-498a-a5de-99f0119326df	4f7be806-dc90-42aa-9626-744df99f2082	petugas	3	https://dummyimage.com/600x400/ff0000/fff&text=Residu	12.19	Kg	-6.869588722141585,107.62658551946225	residu	2026-07-03 04:54:13.152
5cf4e237-2c4a-4fa0-a3a3-781926aeb04c	4f7be806-dc90-42aa-9626-744df99f2082	petugas	3	https://dummyimage.com/600x400/ff0000/fff&text=Residu	10.30	Kg	-6.868779354205644,107.62686535577869	residu	2026-07-26 04:54:13.158
f5614f20-c8f3-4170-bbd5-ada6cd3a1d55	4f7be806-dc90-42aa-9626-744df99f2082	petugas	3	https://dummyimage.com/600x400/ff0000/fff&text=Residu	11.87	Kg	-6.868650155777407,107.6266468691589	residu	2026-06-15 04:54:13.164
094b5632-ecfd-43c7-82a7-0fc07e4149e6	4f7be806-dc90-42aa-9626-744df99f2082	petugas	3	https://dummyimage.com/600x400/ff0000/fff&text=Residu	15.52	Kg	-6.869085094799222,107.625919312104	residu	2026-07-06 04:54:13.17
f1dfb0dc-b2bb-4fb1-88e7-a19fd9ebf656	4f7be806-dc90-42aa-9626-744df99f2082	petugas	3	https://dummyimage.com/600x400/ff0000/fff&text=Residu	16.62	Kg	-6.8691030107611715,107.62626039367993	residu	2026-06-16 04:54:13.176
1c57f00b-b643-498e-bfb0-b9fba21b7a97	4f7be806-dc90-42aa-9626-744df99f2082	petugas	3	https://dummyimage.com/600x400/ff0000/fff&text=Residu	5.04	Kg	-6.869597758263354,107.6269508614742	residu	2026-06-11 04:54:13.182
b1ebc4ee-9ec8-4cea-a447-eeda603ab9d1	4f7be806-dc90-42aa-9626-744df99f2082	petugas	3	https://dummyimage.com/600x400/ff0000/fff&text=Residu	16.30	Kg	-6.8687549752853885,107.62603486209252	residu	2026-06-30 04:54:13.188
8fca5592-e8e4-4d9a-964e-3140d8362f8b	4f7be806-dc90-42aa-9626-744df99f2082	petugas	3	https://dummyimage.com/600x400/ff0000/fff&text=Residu	19.48	Kg	-6.867682165267673,107.62758932171728	residu	2026-07-21 04:54:13.194
11ac45e4-e419-4c59-b3ef-e9615a857e93	4f7be806-dc90-42aa-9626-744df99f2082	petugas	3	https://dummyimage.com/600x400/ff0000/fff&text=Residu	5.98	Kg	-6.868799752972914,107.62679778373945	residu	2026-06-04 04:54:13.2
2dd49817-64a7-4c86-a6a7-b3d40f00d7af	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	15.85	Kg	-6.864869298904649,107.6220744235361	residu	2026-06-23 04:54:13.216
2c478162-a6d1-4005-9ddd-6ce119594db9	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.50	Kg	-6.865001821702237,107.62245845237372	residu	2026-07-23 04:54:13.223
71d747d6-1a76-4118-ac47-a9df6a0775e9	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	8.77	Kg	-6.864196002088108,107.62215063500787	residu	2026-07-24 04:54:13.228
d4ea6d81-44b0-44dc-8f17-26ad61184bce	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	13.08	Kg	-6.864337731859119,107.62226034188613	residu	2026-07-18 04:54:13.234
962ab2e9-8962-428b-9ab4-19b6e5b3b58e	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	14.18	Kg	-6.863764421998838,107.623049448254	residu	2026-07-04 04:54:13.24
06d8ba3a-3905-4098-9a0d-e1dde365538a	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	18.27	Kg	-6.863794287172376,107.62214460389707	residu	2026-07-12 04:54:13.246
96cd4fd8-6ffb-4b8a-8dfa-0bb430e1d10a	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	9.22	Kg	-6.864366030992808,107.62213442518623	residu	2026-06-11 04:54:13.252
f57c1e12-fb4b-41a7-bab9-f36beb6306cc	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	8.31	Kg	-6.864774975739766,107.62285182046129	residu	2026-07-22 04:54:13.258
78939226-4aee-485d-abe3-27b43468223c	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	11.94	Kg	-6.864777371231069,107.62173978108432	residu	2026-07-24 04:54:13.264
42906af8-3f18-4c48-92c1-b5fb40634576	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.09	Kg	-6.864092374518866,107.6229783495254	residu	2026-06-27 04:54:13.27
a04bb285-c460-4917-a0e8-72301369e088	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	14.17	Kg	-6.8651647336914765,107.62165314460215	residu	2026-06-28 04:54:13.275
2b6dfe21-bec1-4cc1-a8cd-e641ff3fc5b8	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	16.15	Kg	-6.865271343277792,107.62126146794348	residu	2026-06-15 04:54:13.281
e3bbc081-679b-46f2-9288-792e096ed79d	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.65	Kg	-6.8637172463719685,107.6223972852431	residu	2026-06-14 04:54:13.287
d867a7c0-b382-4efc-93d9-012cb605d9b0	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	12.84	Kg	-6.8637989803210715,107.62192637955161	residu	2026-06-19 04:54:13.293
f8cd0f0e-f319-4420-82a9-b0d62d4af813	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	10.65	Kg	-6.864161151728468,107.62216688706988	residu	2026-07-19 04:54:13.299
7aa9ac33-ef19-45ca-b4ec-879f4b244941	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	12.35	Kg	-6.865139478520828,107.62249986299399	residu	2026-07-11 04:54:13.305
986e2a7d-a48a-4122-b67a-d6e9b154baf8	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	8.01	Kg	-6.864344973012963,107.6216650116444	residu	2026-07-27 04:54:13.311
5e66e077-0791-4153-9c04-1aa283bb41c8	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	12.72	Kg	-6.865426323770727,107.62294500702876	residu	2026-07-09 04:54:13.317
d1064b12-e89b-4164-9980-f82d34628215	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	18.80	Kg	-6.863575051875112,107.62155399934548	residu	2026-06-07 04:54:13.323
c4bb30f4-cd66-4d97-ab84-df2c089d52af	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.15	Kg	-6.863933590345045,107.62313307771394	residu	2026-06-23 04:54:13.329
8778b3d2-dded-472a-b729-0eca9b760279	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	13.19	Kg	-6.8648669867978125,107.6213210969578	residu	2026-05-31 04:54:13.335
b6b60c05-178c-4630-982b-b8ca3fe3cf1a	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	10.92	Kg	-6.865301717907801,107.62288373949772	residu	2026-06-12 04:54:13.341
5e9a47b5-a558-4e1c-b41a-fdc4f9f34df4	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	16.96	Kg	-6.863864384391139,107.62124191225804	residu	2026-07-03 04:54:13.347
521bf666-2bf2-400a-a7eb-3ce63dcbb615	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	16.28	Kg	-6.863910873440779,107.62223622107848	residu	2026-07-21 04:54:13.353
1a577a35-c7ba-4c46-9e10-82b6f2f33232	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	8.62	Kg	-6.86405645342057,107.6217825365594	residu	2026-07-28 04:54:13.359
fa874a82-a2d6-4ae0-aa4c-69e48c09e811	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	14.70	Kg	-6.863554134773282,107.62138788148917	residu	2026-06-09 04:54:13.365
6bceea98-acc0-492f-b9a6-de83b6a0fb2b	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	8.14	Kg	-6.864127524918556,107.62221460686705	residu	2026-06-27 04:54:13.371
2c88702b-3bc2-4b0b-9891-03c3efd7d518	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	19.41	Kg	-6.865226477779023,107.62160982402551	residu	2026-07-02 04:54:13.377
7bfc59e0-e3ac-4926-aaae-315613b50141	3a2194cf-659e-487b-8571-98642c9009f5	petugas	4	https://dummyimage.com/600x400/ff0000/fff&text=Residu	16.89	Kg	-6.864161747861883,107.62275858096419	residu	2026-06-06 04:54:13.383
dbc1c2cd-0f06-47c2-b55d-44659e95f48c	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	9.80	Kg	-6.869985105889664,107.62352598270735	residu	2026-06-08 04:54:13.398
b888d7ef-d1c4-472a-836b-723ea7992515	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	18.88	Kg	-6.86862728846612,107.62331411996232	residu	2026-06-13 04:54:13.404
0c8498dd-a907-4b92-bbf1-23c8199df590	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.77	Kg	-6.868906207983111,107.62280008417893	residu	2026-06-23 04:54:13.41
c1b20ca1-05ef-411f-ac7f-5329500ba2a4	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.13	Kg	-6.868982771048138,107.622998155241	residu	2026-06-12 04:54:13.416
3208b23c-62bf-43ef-a445-b83433eeb6f1	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	6.66	Kg	-6.870043086943366,107.62331182258517	residu	2026-06-21 04:54:13.423
04c1bc7c-99a2-4e13-bb95-e20dfd08f31a	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	10.13	Kg	-6.869736942836869,107.62384839769067	residu	2026-06-03 04:54:13.429
fee809af-551d-4c5f-abb9-6e1dd5f9a62b	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.09	Kg	-6.870185918759812,107.6241478954354	residu	2026-06-25 04:54:13.435
980e5704-c30f-4e9a-91f6-7b0cf312c2ca	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	14.73	Kg	-6.86945654691934,107.62436529957854	residu	2026-07-04 04:54:13.441
3d59c951-0b4c-4d81-9fcf-c5fb09860599	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	14.55	Kg	-6.868867698399526,107.62430366324199	residu	2026-07-29 04:54:13.447
7e0ec49e-329b-47f7-9ec7-d5e0d20a682b	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.57	Kg	-6.869891221922564,107.62415927591077	residu	2026-07-27 04:54:13.454
3f309d3b-07ac-4bb6-a96f-4bd2e12937bc	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	10.25	Kg	-6.868629037710718,107.62460670912392	residu	2026-07-09 04:54:13.46
7e7f7009-3c03-414c-a4ce-cd366e779b6c	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	16.16	Kg	-6.868460521742884,107.62341479403706	residu	2026-06-28 04:54:13.466
6e33d4ac-05ed-4ca4-acbd-85029669656b	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.03	Kg	-6.869684800855476,107.62397831708503	residu	2026-05-31 04:54:13.473
b43d3c13-c64e-404c-a96d-6005aed075e2	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	18.38	Kg	-6.8702084794177365,107.6235074142921	residu	2026-06-14 04:54:13.479
d9257ac9-d62c-4bb8-96c2-94612234885e	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.01	Kg	-6.869243431405213,107.62321273359035	residu	2026-06-19 04:54:13.485
a78d1d9d-465d-436e-9609-8f6e72fea3e3	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.29	Kg	-6.869761317827845,107.62378182800363	residu	2026-07-09 04:54:13.491
4edb410c-7ac5-41a7-8e14-b70686f18334	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.76	Kg	-6.869715451209213,107.6237356713516	residu	2026-06-03 04:54:13.497
56209522-5e9b-4e23-bca2-947c3f3d8a43	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	13.99	Kg	-6.870391080763724,107.6227039277151	residu	2026-07-17 04:54:13.504
928c1ae6-d220-4ca8-9768-55b87aa7c74b	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	11.22	Kg	-6.870077294436052,107.62396370987021	residu	2026-06-20 04:54:13.51
bb745f82-2432-4dd4-b6e0-aeac5315d196	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	18.39	Kg	-6.868538335059859,107.62314062513859	residu	2026-07-02 04:54:13.516
737a4c12-972a-4192-8124-5750b9594b19	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	14.46	Kg	-6.869237270920491,107.62460333085602	residu	2026-06-10 04:54:13.522
21085548-a0e7-4724-9917-9d61cf6b4297	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	7.68	Kg	-6.8697990598164145,107.62419113539703	residu	2026-05-31 04:54:13.528
1996fb76-049f-45fd-b553-a6b81fe4b40e	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	14.32	Kg	-6.870193714869856,107.62315125942654	residu	2026-06-16 04:54:13.534
69a1788f-76f6-408c-9817-9ff28e8c2d2c	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	5.49	Kg	-6.869936712965557,107.62298116341917	residu	2026-07-26 04:54:13.54
5761caee-c95c-4b5d-bb92-08ac29dd158f	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.74	Kg	-6.868469378871136,107.62289553195389	residu	2026-06-15 04:54:13.547
0ee2a9f4-b064-4c2f-9f51-d2d6edee6663	b061b068-dfc4-481e-9813-fe7b00082aaa	petugas	5	https://dummyimage.com/600x400/ff0000/fff&text=Residu	15.88	Kg	-6.869999942310604,107.62349427394689	residu	2026-06-14 04:54:13.553
6f2902d4-9470-4133-98b4-cae56b213e05	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	14.12	Kg	-6.872922954764455,107.62104898211697	residu	2026-06-14 04:54:13.568
94ba5020-74e5-4cd4-9a96-8ebb141e1d49	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	18.79	Kg	-6.873729506560743,107.62121378074994	residu	2026-07-22 04:54:13.575
c51bb9c9-cf41-40f1-8f64-628f08886bbd	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	7.05	Kg	-6.872794079408637,107.62112894545623	residu	2026-05-31 04:54:13.581
aea19819-c8ff-4085-a6e9-c1bfcecdc8b0	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	12.97	Kg	-6.873488813853957,107.62130345230146	residu	2026-07-27 04:54:13.588
70e9696a-9631-453f-8544-dc4fad1739ef	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	10.71	Kg	-6.872447782030873,107.62100657044444	residu	2026-07-09 04:54:13.594
a31f27a4-33f0-4bc2-8990-f7949c38e3ac	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.16	Kg	-6.873805040056084,107.62028522724067	residu	2026-06-05 04:54:13.601
b6481253-4072-4fe6-9c7b-a61b7f66daa9	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.03	Kg	-6.873137439931023,107.62034935530274	residu	2026-06-15 04:54:13.607
552c45f0-1269-4a99-84a4-fabb8d48e835	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	10.58	Kg	-6.8742142458885755,107.62118001643526	residu	2026-07-20 04:54:13.613
6370d8ab-b6c3-4082-b6fd-c2adadcbd4ab	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	13.51	Kg	-6.87385620431416,107.62057076676574	residu	2026-07-27 04:54:13.619
132f148e-e15d-4f33-9859-5a5a2bf7285e	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	10.77	Kg	-6.872655656663922,107.62046435554711	residu	2026-06-09 04:54:13.625
0a42a0e9-e9e6-4726-93e2-0d26bc81d5d0	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	12.00	Kg	-6.872335465816303,107.62107427917856	residu	2026-06-16 04:54:13.631
204d8a1d-6c79-4f2a-a1dd-52cdd9bc8cc8	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	11.37	Kg	-6.873341348913029,107.61969891504586	residu	2026-06-22 04:54:13.637
30d37cb5-b128-4cd2-a2cd-4d111ffbbd17	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	9.92	Kg	-6.87328036270713,107.6212184653117	residu	2026-07-14 04:54:13.643
21c2245d-3d26-4840-b6ab-9e5e0477f5ca	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.96	Kg	-6.873785011119657,107.62043084496173	residu	2026-07-03 04:54:13.649
45e9cf51-e0f5-4bd4-9f67-43a3441f48ac	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	12.60	Kg	-6.872590134423441,107.62042700942249	residu	2026-05-31 04:54:13.655
1cb6b98a-ab66-4e5a-a952-f3e30cf76097	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	16.34	Kg	-6.873949121504536,107.61961569955471	residu	2026-07-11 04:54:13.661
41c137ff-91bd-4d00-9c06-b0168d325df9	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	13.56	Kg	-6.872704150612302,107.6202428844514	residu	2026-07-01 04:54:13.669
423cb2b2-d936-4555-86c6-c62492c58cc2	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	14.99	Kg	-6.872395559706905,107.6214261648394	residu	2026-07-05 04:54:13.677
7deee260-a13d-4c69-b800-8878969e2b6e	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	8.99	Kg	-6.874039968051038,107.62012641529888	residu	2026-06-02 04:54:13.683
8be601d0-acb9-468d-96fb-d24771bbf1c4	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	11.64	Kg	-6.873066963706008,107.61969465472647	residu	2026-07-08 04:54:13.689
f8851e16-2204-4586-b744-551c6d82c3e2	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	14.49	Kg	-6.873778003726353,107.62021572688641	residu	2026-07-19 04:54:13.695
74d9d356-cb4d-44dd-aaea-3bdae139569d	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	6.68	Kg	-6.873581522978034,107.61983201921909	residu	2026-06-06 04:54:13.702
07b32bbd-4cc4-4ee1-b7e6-c88efbd9a438	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	6.16	Kg	-6.8725565238255975,107.61954042479859	residu	2026-07-03 04:54:13.708
55de59a8-d329-4384-a968-d67d724e1a4b	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	18.95	Kg	-6.873159168072193,107.61957267607937	residu	2026-06-04 04:54:13.714
74972047-70ec-414b-9344-5b1c677d256e	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	15.83	Kg	-6.873665002133936,107.61958316639142	residu	2026-07-11 04:54:13.72
25bb5dde-2814-43cb-a2f6-6cf939bb2c21	340a6d05-69ee-4c2b-85da-e2d3ea6fb503	petugas	6	https://dummyimage.com/600x400/ff0000/fff&text=Residu	13.06	Kg	-6.873297689835159,107.62004506870846	residu	2026-06-09 04:54:13.726
6ea13a94-bdf6-4a8b-a680-add4be24acae	bf55de66-761d-4b67-84c8-4bb6b8d70332	petugas	7	https://dummyimage.com/600x400/ff0000/fff&text=Residu	19.91	Kg	-6.884918863184136,107.61798105483894	residu	2026-07-16 04:54:13.741
3ec27d55-7876-437f-91d0-faf5d61947cc	bf55de66-761d-4b67-84c8-4bb6b8d70332	petugas	7	https://dummyimage.com/600x400/ff0000/fff&text=Residu	6.11	Kg	-6.8844784723913515,107.61762371423663	residu	2026-06-03 04:54:13.747
e9d36557-3481-4a42-90b5-c7067b5ea67c	bf55de66-761d-4b67-84c8-4bb6b8d70332	petugas	7	https://dummyimage.com/600x400/ff0000/fff&text=Residu	7.25	Kg	-6.885000347452488,107.61687685195818	residu	2026-06-20 04:54:13.754
b58d78d0-1b05-4c2f-aef3-d585a948c844	bf55de66-761d-4b67-84c8-4bb6b8d70332	petugas	7	https://dummyimage.com/600x400/ff0000/fff&text=Residu	14.88	Kg	-6.884145003881442,107.61709523496343	residu	2026-06-21 04:54:13.761
98d2569e-59e5-4de4-b97b-e2c379b629ed	bf55de66-761d-4b67-84c8-4bb6b8d70332	petugas	7	https://dummyimage.com/600x400/ff0000/fff&text=Residu	10.82	Kg	-6.885135475805421,107.61683764660305	residu	2026-07-16 04:54:13.767
0f120b4f-378c-4427-82b6-cec95b3d2a3d	bf55de66-761d-4b67-84c8-4bb6b8d70332	petugas	7	https://dummyimage.com/600x400/ff0000/fff&text=Residu	18.06	Kg	-6.884724521775184,107.61692604143897	residu	2026-06-26 04:54:13.773
37523110-a1d8-4f24-a005-6a2949996e97	bf55de66-761d-4b67-84c8-4bb6b8d70332	petugas	7	https://dummyimage.com/600x400/ff0000/fff&text=Residu	11.15	Kg	-6.88474019561603,107.61689022500124	residu	2026-06-20 04:54:13.779
9fe70db4-a759-4f36-8c6d-a2aa6ae80b84	bf55de66-761d-4b67-84c8-4bb6b8d70332	petugas	7	https://dummyimage.com/600x400/ff0000/fff&text=Residu	16.57	Kg	-6.884520718552012,107.61756532749784	residu	2026-07-02 04:54:13.785
3687a3b6-5981-47bb-a53c-5af8357e10e0	bf55de66-761d-4b67-84c8-4bb6b8d70332	petugas	7	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.11	Kg	-6.884720720774084,107.6167146370026	residu	2026-06-18 04:54:13.791
13d19168-f2e9-4be5-94d2-05d0849148f0	bf55de66-761d-4b67-84c8-4bb6b8d70332	petugas	7	https://dummyimage.com/600x400/ff0000/fff&text=Residu	12.57	Kg	-6.8840017715522,107.61781800984699	residu	2026-06-06 04:54:13.797
6f1e5523-53f9-484a-b9cb-ef0b4c749a90	bf55de66-761d-4b67-84c8-4bb6b8d70332	petugas	7	https://dummyimage.com/600x400/ff0000/fff&text=Residu	5.56	Kg	-6.885252550894735,107.61673726614468	residu	2026-05-31 04:54:13.803
ecaf9252-112e-4e0b-92f4-612c97ec45e4	bf55de66-761d-4b67-84c8-4bb6b8d70332	petugas	7	https://dummyimage.com/600x400/ff0000/fff&text=Residu	6.63	Kg	-6.884681491307881,107.61847931641228	residu	2026-07-28 04:54:13.809
fb2e1dcb-a37b-4e51-8ba6-8a37fd3e1303	ddc89057-6cc4-4ee7-a592-bdf9b6b628b7	petugas	8	https://dummyimage.com/600x400/ff0000/fff&text=Residu	14.00	Kg	-6.884297301637694,107.61833732652443	residu	2026-07-09 04:54:13.825
969fbf5f-f64c-47fb-bae1-4e3eafc5b8bc	ddc89057-6cc4-4ee7-a592-bdf9b6b628b7	petugas	8	https://dummyimage.com/600x400/ff0000/fff&text=Residu	12.64	Kg	-6.882910926217437,107.61942907183577	residu	2026-06-27 04:54:13.83
460b0041-477f-49b3-a0fa-d120c05bb789	ddc89057-6cc4-4ee7-a592-bdf9b6b628b7	petugas	8	https://dummyimage.com/600x400/ff0000/fff&text=Residu	7.83	Kg	-6.883315050615141,107.61894622072528	residu	2026-06-23 04:54:13.836
062da8b1-504b-4992-bd4f-e4a675d052a6	ddc89057-6cc4-4ee7-a592-bdf9b6b628b7	petugas	8	https://dummyimage.com/600x400/ff0000/fff&text=Residu	9.83	Kg	-6.884265903469169,107.61892755722015	residu	2026-07-28 04:54:13.842
4c3e6c2a-82fb-43ee-88a3-6264bb33730a	ddc89057-6cc4-4ee7-a592-bdf9b6b628b7	petugas	8	https://dummyimage.com/600x400/ff0000/fff&text=Residu	16.15	Kg	-6.882661816884832,107.61844570642045	residu	2026-07-13 04:54:13.848
c420815e-1d91-479e-b6d9-f66db6ed86f1	ddc89057-6cc4-4ee7-a592-bdf9b6b628b7	petugas	8	https://dummyimage.com/600x400/ff0000/fff&text=Residu	10.93	Kg	-6.8836696220521665,107.61939175843236	residu	2026-06-10 04:54:13.854
467a4ae2-29c1-46cc-9e62-37d5d389a34f	ddc89057-6cc4-4ee7-a592-bdf9b6b628b7	petugas	8	https://dummyimage.com/600x400/ff0000/fff&text=Residu	5.24	Kg	-6.882602790061197,107.61957346969037	residu	2026-07-04 04:54:13.86
14689c4a-ed11-45df-9f58-f829c0a12649	ddc89057-6cc4-4ee7-a592-bdf9b6b628b7	petugas	8	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.02	Kg	-6.883071839239056,107.61797555961418	residu	2026-06-10 04:54:13.867
a8b80dc6-5a21-45c4-9f72-c19828dfd446	ddc89057-6cc4-4ee7-a592-bdf9b6b628b7	petugas	8	https://dummyimage.com/600x400/ff0000/fff&text=Residu	15.33	Kg	-6.8835665185808,107.6191731850719	residu	2026-07-04 04:54:13.873
b4ec284f-b06e-4720-b23f-a9db8681d2f1	ddc89057-6cc4-4ee7-a592-bdf9b6b628b7	petugas	8	https://dummyimage.com/600x400/ff0000/fff&text=Residu	19.87	Kg	-6.882779467043825,107.61913074844509	residu	2026-06-22 04:54:13.88
fc1062e0-f415-43ae-a21b-fb8bd77e6ea6	ddc89057-6cc4-4ee7-a592-bdf9b6b628b7	petugas	8	https://dummyimage.com/600x400/ff0000/fff&text=Residu	16.85	Kg	-6.88277083537151,107.6191777767817	residu	2026-07-01 04:54:13.886
83f94445-a25e-4a82-98e7-24f5597d31c7	ddc89057-6cc4-4ee7-a592-bdf9b6b628b7	petugas	8	https://dummyimage.com/600x400/ff0000/fff&text=Residu	19.88	Kg	-6.883339599065801,107.61844405351057	residu	2026-05-31 04:54:13.892
fc9e964e-7ef3-4592-af91-230299a4688b	ddc89057-6cc4-4ee7-a592-bdf9b6b628b7	petugas	8	https://dummyimage.com/600x400/ff0000/fff&text=Residu	10.90	Kg	-6.8838620525873955,107.61818481497426	residu	2026-06-28 04:54:13.897
2a61b2ae-1754-4843-99e9-4766895078af	a1526984-44bc-4aa2-9811-f1fa8732c9e1	petugas	9	https://dummyimage.com/600x400/ff0000/fff&text=Residu	9.37	Kg	-6.885727491127785,107.6189733862072	residu	2026-07-12 04:54:13.913
937a1100-7f54-49f0-9fa5-b99771b68384	a1526984-44bc-4aa2-9811-f1fa8732c9e1	petugas	9	https://dummyimage.com/600x400/ff0000/fff&text=Residu	11.35	Kg	-6.886135785942548,107.61934107888484	residu	2026-06-27 04:54:13.919
201d1c88-6e76-4e0a-94f3-cba43d032163	a1526984-44bc-4aa2-9811-f1fa8732c9e1	petugas	9	https://dummyimage.com/600x400/ff0000/fff&text=Residu	6.48	Kg	-6.886528940109629,107.61971501942931	residu	2026-06-10 04:54:13.926
cf5cde54-2aa3-4884-a15f-48e4173e7ab9	a1526984-44bc-4aa2-9811-f1fa8732c9e1	petugas	9	https://dummyimage.com/600x400/ff0000/fff&text=Residu	9.06	Kg	-6.88653434249232,107.61886679642922	residu	2026-06-12 04:54:13.932
1d88dde3-2dd8-4c30-a52b-2a0ff3cc4752	a1526984-44bc-4aa2-9811-f1fa8732c9e1	petugas	9	https://dummyimage.com/600x400/ff0000/fff&text=Residu	14.47	Kg	-6.885545249897077,107.61825293471344	residu	2026-06-20 04:54:13.938
e5a5a9d3-9e7d-4e27-88e1-480cd739652f	a1526984-44bc-4aa2-9811-f1fa8732c9e1	petugas	9	https://dummyimage.com/600x400/ff0000/fff&text=Residu	16.46	Kg	-6.885763980093682,107.61969507368016	residu	2026-07-17 04:54:13.944
9933ce89-238b-42f6-9864-1c161e922ea0	a1526984-44bc-4aa2-9811-f1fa8732c9e1	petugas	9	https://dummyimage.com/600x400/ff0000/fff&text=Residu	19.59	Kg	-6.885044834743656,107.61961630267999	residu	2026-06-04 04:54:13.95
1f156a96-407d-449f-bc94-9ee672ca35aa	a1526984-44bc-4aa2-9811-f1fa8732c9e1	petugas	9	https://dummyimage.com/600x400/ff0000/fff&text=Residu	11.34	Kg	-6.885937210229956,107.61859531195714	residu	2026-06-01 04:54:13.956
6ee56bb8-1383-49d5-8747-2a30a70882f8	a1526984-44bc-4aa2-9811-f1fa8732c9e1	petugas	9	https://dummyimage.com/600x400/ff0000/fff&text=Residu	9.18	Kg	-6.88638891071428,107.61934739936692	residu	2026-06-14 04:54:13.962
892a7a15-9823-4461-b09e-054d9f56de29	a1526984-44bc-4aa2-9811-f1fa8732c9e1	petugas	9	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.54	Kg	-6.885444175211634,107.61923554990427	residu	2026-06-13 04:54:13.968
dcb08b5b-9d80-44dc-8b4b-59d323775c0d	a1526984-44bc-4aa2-9811-f1fa8732c9e1	petugas	9	https://dummyimage.com/600x400/ff0000/fff&text=Residu	11.22	Kg	-6.8846834432302835,107.61793196159124	residu	2026-06-29 04:54:13.974
25ff4ef9-e641-4131-87a2-91b5b4d444c8	a1526984-44bc-4aa2-9811-f1fa8732c9e1	petugas	9	https://dummyimage.com/600x400/ff0000/fff&text=Residu	8.13	Kg	-6.886554331553867,107.61955586451846	residu	2026-07-06 04:54:13.98
4ee4052f-e892-462a-b072-cb03fb502237	a1526984-44bc-4aa2-9811-f1fa8732c9e1	petugas	9	https://dummyimage.com/600x400/ff0000/fff&text=Residu	7.16	Kg	-6.88520789396705,107.61860618088373	residu	2026-07-02 04:54:13.986
51a50684-6b82-4716-b28a-12416adbf25e	a1526984-44bc-4aa2-9811-f1fa8732c9e1	petugas	9	https://dummyimage.com/600x400/ff0000/fff&text=Residu	7.99	Kg	-6.885727343936393,107.61949534546861	residu	2026-06-25 04:54:13.992
0fa6e163-09a5-4f4b-aafa-dd54161a2a68	a1526984-44bc-4aa2-9811-f1fa8732c9e1	petugas	9	https://dummyimage.com/600x400/ff0000/fff&text=Residu	9.31	Kg	-6.885350087682564,107.6178678631376	residu	2026-06-07 04:54:13.998
66447b3e-7c0c-4f2b-b5ef-a5f0af2582ee	a1526984-44bc-4aa2-9811-f1fa8732c9e1	petugas	9	https://dummyimage.com/600x400/ff0000/fff&text=Residu	9.56	Kg	-6.884867075727399,107.61787676752995	residu	2026-06-22 04:54:14.004
057dec95-63ce-41fa-994f-ea11c99fdf22	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	9.82	Kg	-6.886018653994839,107.61923216462637	residu	2026-06-21 04:54:14.02
5686b73e-000f-47b4-b232-bd6847ba4e21	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	6.79	Kg	-6.887389889538797,107.618759927989	residu	2026-07-29 04:54:14.025
b177d91e-5848-4a88-902b-cc670b0eca83	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	13.87	Kg	-6.886812803359908,107.619216759306	residu	2026-07-18 04:54:14.032
7c2a82e6-b48e-476f-9902-3e137dd2804d	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	9.95	Kg	-6.887864354073523,107.61986180841478	residu	2026-06-24 04:54:14.038
5bc454ac-aa05-4e95-b495-73d449b8da6c	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	12.96	Kg	-6.886767053992622,107.61946914018901	residu	2026-06-04 04:54:14.044
2619b615-fddc-4012-b73c-73940fdc203e	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	10.26	Kg	-6.886224455790392,107.61937406945843	residu	2026-07-01 04:54:14.05
9a09b1dd-efd3-434a-9788-8c85a213ed49	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	9.13	Kg	-6.887627918924089,107.61855301123671	residu	2026-06-07 04:54:14.056
fa7819d2-e608-48b9-8394-06540aecfeb0	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	16.55	Kg	-6.886487692721541,107.61960829391587	residu	2026-07-26 04:54:14.062
51acd256-a541-481a-805e-67d341568e64	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	18.11	Kg	-6.886655644728904,107.61944618718901	residu	2026-07-18 04:54:14.069
2457eec3-ae49-4a9a-9a6f-e2c316bd1c7e	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	11.90	Kg	-6.886308352521567,107.61992029475427	residu	2026-07-21 04:54:14.076
f3655bf8-3346-4e66-b3ca-b42fdf4fe45e	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	11.39	Kg	-6.887117122270965,107.61903207047403	residu	2026-07-17 04:54:14.082
f9307369-1ef2-456f-94fb-8c886861a6e2	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	12.02	Kg	-6.886368958692923,107.61874911875567	residu	2026-07-29 04:54:14.088
917d9c07-d5b9-4d34-b47a-eb42838c172a	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	13.04	Kg	-6.887916908638613,107.61873324267732	residu	2026-06-30 04:54:14.096
23e6ef5e-9dfa-4add-9536-41d0f4d11ac5	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	19.50	Kg	-6.887069499758304,107.61922058795076	residu	2026-06-02 04:54:14.102
1a9cc1a0-d33b-48e8-a67b-4a94ab169dc9	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	5.55	Kg	-6.886627005333502,107.61989294198916	residu	2026-07-18 04:54:14.108
0cdc0c6f-8aeb-4634-baf0-afb2015ec602	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.11	Kg	-6.887259800216899,107.61993575438112	residu	2026-06-04 04:54:14.114
cb315221-18ee-48db-a442-790dc767188b	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	18.87	Kg	-6.886123048440815,107.6198755215745	residu	2026-07-23 04:54:14.121
6b4c5a20-7b70-464d-a5fb-d2a4ee2de670	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	6.69	Kg	-6.88629444903329,107.61986812877373	residu	2026-07-27 04:54:14.128
08c4cb3b-d35e-4d81-834e-7656db4b7d10	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	18.01	Kg	-6.886432179613916,107.61878672484336	residu	2026-06-01 04:54:14.136
506250e1-e0f5-4839-9f58-dd36b0fe252e	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	18.34	Kg	-6.886933062764271,107.62003396045765	residu	2026-06-13 04:54:14.142
eda552b9-86bc-4d89-9390-c2c692dbf85c	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	12.07	Kg	-6.887773537341618,107.61822478802623	residu	2026-06-20 04:54:14.15
cd5af85a-9375-41c5-8acf-cdd651b75f34	5db1deba-21e8-4883-9353-71c24033da4a	petugas	10	https://dummyimage.com/600x400/ff0000/fff&text=Residu	6.94	Kg	-6.886103123186438,107.61936213331026	residu	2026-07-14 04:54:14.157
7eada7a7-da98-42e7-9d1f-fb16ed44c173	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	14.35	Kg	-6.891049579275524,107.6158245538112	residu	2026-05-31 04:54:14.176
7d7d0547-6537-4194-a355-77a87f134bd7	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	7.51	Kg	-6.891584200093236,107.61631009872772	residu	2026-06-14 04:54:14.184
ed032ceb-c1c1-495e-b76e-d9203dd0595c	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	14.44	Kg	-6.89152236455621,107.61596244476652	residu	2026-06-07 04:54:14.192
657c36dd-6cc1-438e-ab23-9b8e808807f2	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	5.36	Kg	-6.890800027074102,107.61700446096698	residu	2026-07-25 04:54:14.198
f82143f7-fc90-48a1-92c1-1c0c8ff6fb83	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	19.53	Kg	-6.8907683381751035,107.61611047296927	residu	2026-06-11 04:54:14.205
991bcb7a-2661-4215-8908-5fb6e6a714a1	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	18.75	Kg	-6.890484253621744,107.61694547012942	residu	2026-06-20 04:54:14.213
fed37ed6-9fb8-498f-a6eb-df183f237cc8	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	14.00	Kg	-6.890183436892274,107.61570777833195	residu	2026-07-18 04:54:14.221
d3e631c8-bab5-4600-a074-f55344b83b0e	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.71	Kg	-6.89025786634089,107.61679420846626	residu	2026-06-25 04:54:14.231
459e4113-186f-482c-85f6-82a9cfe24470	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	10.66	Kg	-6.890915396686112,107.6164197057874	residu	2026-06-26 04:54:14.237
f243f169-8fa4-4e1b-bf74-33da9c8de163	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	19.94	Kg	-6.891948749123919,107.61687692869674	residu	2026-06-08 04:54:14.243
e0951af2-bc7c-4147-88d3-228ac022db13	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	11.11	Kg	-6.891457175051506,107.61658487387724	residu	2026-07-02 04:54:14.25
11bbb48a-08b0-4f92-8e95-ef34c0a9293e	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	14.60	Kg	-6.891350385455666,107.61736415063348	residu	2026-06-25 04:54:14.257
d6f914c4-13bc-404e-99c8-324832748aad	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	13.78	Kg	-6.8919416765958275,107.61631359438447	residu	2026-07-27 04:54:14.263
3a68e66d-b776-47c7-b5f8-a09de934c1fa	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	9.38	Kg	-6.890398043784736,107.61664077792437	residu	2026-07-14 04:54:14.271
b9f575e3-3716-40f2-8833-a947af3dc6b0	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	5.43	Kg	-6.892040628287855,107.61706491853157	residu	2026-07-25 04:54:14.277
e6de2252-37c7-4d3e-90e0-d4069e5a8332	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	19.54	Kg	-6.8918209072516,107.6158817667545	residu	2026-07-16 04:54:14.284
a7c07826-933b-4948-81b9-8536ae1bf04f	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	8.10	Kg	-6.89089677648098,107.61563685387887	residu	2026-06-05 04:54:14.291
d1875dcd-dd28-4c44-aaa0-3539aba10a56	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	12.72	Kg	-6.892024421549801,107.61655156906606	residu	2026-06-28 04:54:14.298
bffe85d0-3e8c-4ecb-b704-9ce5fb7a88c4	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	7.49	Kg	-6.890893451952413,107.61599874815217	residu	2026-06-20 04:54:14.305
119ce54b-434a-45f8-91f2-a70ee0e4a268	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	15.75	Kg	-6.891876492871028,107.61643092570193	residu	2026-07-12 04:54:14.311
be49876d-f67e-4fba-ad73-b87ebd51acf9	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	16.15	Kg	-6.891060024215601,107.6172988905962	residu	2026-06-23 04:54:14.318
e465f1c9-ff4a-443d-8fd3-89c5713da7a4	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	13.32	Kg	-6.890171236740925,107.61593126903844	residu	2026-06-01 04:54:14.325
7d590eb5-75bc-4580-83bd-d363e3ab1c1a	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	19.09	Kg	-6.890304370357341,107.61713274030164	residu	2026-06-18 04:54:14.331
34e86f84-782f-469e-8151-f49ec826c501	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	10.81	Kg	-6.890838166309243,107.61663942399146	residu	2026-06-06 04:54:14.338
1cdacf18-a12b-4885-8e42-1f0c7d79850b	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	6.08	Kg	-6.89049062984298,107.61636607977175	residu	2026-07-06 04:54:14.345
5839dbf0-80da-4d94-ae3e-6e5e35d402cb	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	10.58	Kg	-6.89126358127577,107.61719746949184	residu	2026-07-14 04:54:14.353
4a92ee9b-d142-4673-97d1-20483694d867	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	19.81	Kg	-6.89165831170184,107.61721571621855	residu	2026-06-12 04:54:14.359
54822030-cc56-4f63-80a4-dfaf0b09f3d8	b718beeb-4b87-4f6b-9a38-84e13f469445	petugas	11	https://dummyimage.com/600x400/ff0000/fff&text=Residu	16.90	Kg	-6.890133943066671,107.61620058549883	residu	2026-06-17 04:54:14.367
d9d8d631-5f88-44af-b12b-a4b9e86280e1	7e42f423-8a90-40f7-88e7-619af6512070	petugas	12	https://dummyimage.com/600x400/ff0000/fff&text=Residu	11.19	Kg	-6.890483299152427,107.6149582515937	residu	2026-07-02 04:54:14.388
48b612a0-9d05-4c2f-ba07-c31b9df825be	7e42f423-8a90-40f7-88e7-619af6512070	petugas	12	https://dummyimage.com/600x400/ff0000/fff&text=Residu	7.02	Kg	-6.890797048737318,107.61468801319414	residu	2026-07-27 04:54:14.394
1f2ade3b-23df-4f16-994f-cff05414ed17	7e42f423-8a90-40f7-88e7-619af6512070	petugas	12	https://dummyimage.com/600x400/ff0000/fff&text=Residu	5.41	Kg	-6.890464505556365,107.61547690812112	residu	2026-07-24 04:54:14.401
463c9bbe-fe23-49d7-bc78-04e7574fcf96	7e42f423-8a90-40f7-88e7-619af6512070	petugas	12	https://dummyimage.com/600x400/ff0000/fff&text=Residu	12.02	Kg	-6.889575979273632,107.61585234844227	residu	2026-07-29 04:54:14.408
2cb9002b-bb94-470f-b16a-1a11486295b4	7e42f423-8a90-40f7-88e7-619af6512070	petugas	12	https://dummyimage.com/600x400/ff0000/fff&text=Residu	17.72	Kg	-6.8897365105193344,107.61505143805046	residu	2026-06-20 04:54:14.415
288552dc-8e39-440a-a09e-25a1288d7a2d	7e42f423-8a90-40f7-88e7-619af6512070	petugas	12	https://dummyimage.com/600x400/ff0000/fff&text=Residu	15.77	Kg	-6.889306552006397,107.61478210785236	residu	2026-07-13 04:54:14.422
2e602420-1799-41de-ae92-7e6f2916c4b2	7e42f423-8a90-40f7-88e7-619af6512070	petugas	12	https://dummyimage.com/600x400/ff0000/fff&text=Residu	19.65	Kg	-6.890745653076038,107.61623029388392	residu	2026-06-06 04:54:14.429
c795fc75-f526-420c-91d7-bd60d22cc9ed	7e42f423-8a90-40f7-88e7-619af6512070	petugas	12	https://dummyimage.com/600x400/ff0000/fff&text=Residu	14.57	Kg	-6.89114368398851,107.61633814495845	residu	2026-06-10 04:54:14.437
df8fb862-1a7a-40dd-8f4b-75ee9eb97ccc	7e42f423-8a90-40f7-88e7-619af6512070	petugas	12	https://dummyimage.com/600x400/ff0000/fff&text=Residu	13.31	Kg	-6.889652006165034,107.61523597111169	residu	2026-06-27 04:54:14.443
5bdd0995-6d1e-4e20-baf8-0f3fb259b88b	7e42f423-8a90-40f7-88e7-619af6512070	petugas	12	https://dummyimage.com/600x400/ff0000/fff&text=Residu	8.78	Kg	-6.890471033927486,107.61540303061324	residu	2026-07-12 04:54:14.45
63e13499-886e-4746-ab2a-213a725d4d2b	7e42f423-8a90-40f7-88e7-619af6512070	petugas	12	https://dummyimage.com/600x400/ff0000/fff&text=Residu	9.69	Kg	-6.889786191273943,107.61460591231999	residu	2026-07-06 04:54:14.456
e685b6f9-729b-42a2-b5e5-8406bf63094d	7e42f423-8a90-40f7-88e7-619af6512070	petugas	12	https://dummyimage.com/600x400/ff0000/fff&text=Residu	16.49	Kg	-6.890851753504362,107.61552810002617	residu	2026-07-09 04:54:14.462
ff81961e-be6f-4362-8bad-986da9d40b86	7e42f423-8a90-40f7-88e7-619af6512070	petugas	12	https://dummyimage.com/600x400/ff0000/fff&text=Residu	13.48	Kg	-6.8899289886112145,107.61604221797609	residu	2026-07-22 04:54:14.469
f704c69a-e6f6-4a13-9c9d-523ab0a776e3	7e42f423-8a90-40f7-88e7-619af6512070	petugas	12	https://dummyimage.com/600x400/ff0000/fff&text=Residu	18.55	Kg	-6.889228538869869,107.6160377693466	residu	2026-07-12 04:54:14.475
91a20777-751d-4dae-b24a-ec0021c51e70	7e42f423-8a90-40f7-88e7-619af6512070	petugas	12	https://dummyimage.com/600x400/ff0000/fff&text=Residu	12.38	Kg	-6.889772423151093,107.61528482795954	residu	2026-06-28 04:54:14.483
d4466249-c482-4697-9e68-c0804a81029d	7e42f423-8a90-40f7-88e7-619af6512070	petugas	12	https://dummyimage.com/600x400/ff0000/fff&text=Residu	15.06	Kg	-6.889866165207787,107.61456021844612	residu	2026-06-22 04:54:14.489
\.


--
-- Data for Name: setoran_otomatis; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.setoran_otomatis (id, warga_id, foto_sampah_url, hasil_klasifikasi_ai, confidence_ai, berat, unit, poin, qr_tempat_sampah_id, lokasi_gps, created_at) FROM stdin;
841a778f-ec2b-49b2-a7e5-46c5432a91db	2be71aba-1bf7-411e-b539-076e033dbc50	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.99	1.03	Kg	10.15	1b81d232-309e-4ed9-86ef-c2ba475a427a	-6.870840199004648,107.62466476723024	2026-06-06 00:00:00
72f98487-a1b2-44e7-9094-d75dae08b106	2be71aba-1bf7-411e-b539-076e033dbc50	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.84	1.75	Kg	21.90	0bbcdb10-0ce5-4e5b-89d7-808cefa2a1ef	-6.870840199004648,107.62466476723024	2026-07-02 00:00:00
eca41e61-7ba9-4598-add6-84280f3ae765	2be71aba-1bf7-411e-b539-076e033dbc50	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.95	1.38	Kg	13.20	1b81d232-309e-4ed9-86ef-c2ba475a427a	-6.870840199004648,107.62466476723024	2026-06-10 10:00:00
0fc5c812-220b-4585-9f5b-3a18c50dda45	2be71aba-1bf7-411e-b539-076e033dbc50	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.95	1.84	Kg	26.08	0bbcdb10-0ce5-4e5b-89d7-808cefa2a1ef	-6.870840199004648,107.62466476723024	2026-06-03 10:00:00
f5f6f348-2ddc-42b7-89cd-3f50ab363c4e	2be71aba-1bf7-411e-b539-076e033dbc50	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.98	1.95	Kg	19.17	1b81d232-309e-4ed9-86ef-c2ba475a427a	-6.870840199004648,107.62466476723024	2026-07-05 09:00:00
2c5e2ce3-1d34-4373-a462-6cf41ff625dd	2be71aba-1bf7-411e-b539-076e033dbc50	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.96	1.90	Kg	27.25	0bbcdb10-0ce5-4e5b-89d7-808cefa2a1ef	-6.870840199004648,107.62466476723024	2026-06-30 10:00:00
93efea97-07e2-46ca-a655-13b9f57dc4fb	2be71aba-1bf7-411e-b539-076e033dbc50	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.83	2.56	Kg	21.23	1b81d232-309e-4ed9-86ef-c2ba475a427a	-6.870840199004648,107.62466476723024	2026-07-29 10:00:00
cb375719-b586-42fe-baea-f03178a77a41	2be71aba-1bf7-411e-b539-076e033dbc50	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.82	2.36	Kg	28.91	0bbcdb10-0ce5-4e5b-89d7-808cefa2a1ef	-6.870840199004648,107.62466476723024	2026-06-23 23:00:00
7321f0c8-3520-47d7-86fb-c093a4ecd125	2be71aba-1bf7-411e-b539-076e033dbc50	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.91	1.63	Kg	14.91	1b81d232-309e-4ed9-86ef-c2ba475a427a	-6.870840199004648,107.62466476723024	2026-07-25 10:00:00
a223d98d-4f80-42d6-9293-469227df62a3	2be71aba-1bf7-411e-b539-076e033dbc50	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.82	3.92	Kg	32.17	1b81d232-309e-4ed9-86ef-c2ba475a427a	-6.870840199004648,107.62466476723024	2026-07-24 09:00:00
98b75223-9753-4112-bdd8-d1038255a1e1	2be71aba-1bf7-411e-b539-076e033dbc50	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.93	1.12	Kg	15.73	0bbcdb10-0ce5-4e5b-89d7-808cefa2a1ef	-6.870840199004648,107.62466476723024	2026-06-03 23:00:00
e33ba246-e023-4d14-989a-a43ecee77b4f	2be71aba-1bf7-411e-b539-076e033dbc50	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.96	2.32	Kg	22.27	1b81d232-309e-4ed9-86ef-c2ba475a427a	-6.870840199004648,107.62466476723024	2026-06-14 10:00:00
b26a8b19-f3ce-4b3d-86b1-c30bd80f2a60	67996a97-6f02-47b0-8218-cb7760d5c9e4	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.96	3.50	Kg	33.54	e8b10e67-ce5b-49a6-b8c7-9497fbb1ae97	-6.868786719291752,107.62726525927032	2026-06-12 00:00:00
cc3b14d3-061f-4ffd-9503-e443d408d3d7	67996a97-6f02-47b0-8218-cb7760d5c9e4	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.90	2.93	Kg	39.54	d71c52eb-80e0-4ed9-be66-a9d3001c6d18	-6.868786719291752,107.62726525927032	2026-06-01 23:00:00
9450aba0-83b5-46fd-8163-16957ec99df5	67996a97-6f02-47b0-8218-cb7760d5c9e4	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.87	1.01	Kg	8.80	e8b10e67-ce5b-49a6-b8c7-9497fbb1ae97	-6.868786719291752,107.62726525927032	2026-07-15 10:00:00
dfeb96ca-d5ea-47d6-9491-746efd121f34	67996a97-6f02-47b0-8218-cb7760d5c9e4	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.90	3.38	Kg	45.49	d71c52eb-80e0-4ed9-be66-a9d3001c6d18	-6.868786719291752,107.62726525927032	2026-07-03 09:00:00
7421855f-61b2-4491-8a35-a9927e7e0032	67996a97-6f02-47b0-8218-cb7760d5c9e4	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.88	1.43	Kg	18.78	d71c52eb-80e0-4ed9-be66-a9d3001c6d18	-6.868786719291752,107.62726525927032	2026-06-17 00:00:00
f9c042b4-29bc-4535-bc62-9cc1bd066f2f	67996a97-6f02-47b0-8218-cb7760d5c9e4	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.94	2.12	Kg	19.98	e8b10e67-ce5b-49a6-b8c7-9497fbb1ae97	-6.868786719291752,107.62726525927032	2026-07-27 09:00:00
f5f461ba-0400-4c37-a808-67c28b823d8b	67996a97-6f02-47b0-8218-cb7760d5c9e4	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.88	3.22	Kg	42.30	d71c52eb-80e0-4ed9-be66-a9d3001c6d18	-6.868786719291752,107.62726525927032	2026-06-29 00:00:00
f1614896-a735-41a0-b3dd-73530c9c19ec	f8f351b8-1174-40d2-b107-988355cfac0d	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.80	2.83	Kg	33.96	c0312dda-3da8-4c5f-b6d8-104c2a3a99e7	-6.87040575644722,107.62634650688013	2026-06-06 00:00:00
fa47778b-84f8-400d-87bf-155c010f85fe	f8f351b8-1174-40d2-b107-988355cfac0d	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.93	2.21	Kg	20.51	97746f10-4550-47c6-a4c2-3beed36e4447	-6.87040575644722,107.62634650688013	2026-06-17 09:00:00
d9a1c535-dd08-4875-83f8-0e0b2c0284c5	f8f351b8-1174-40d2-b107-988355cfac0d	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.96	3.92	Kg	37.72	97746f10-4550-47c6-a4c2-3beed36e4447	-6.87040575644722,107.62634650688013	2026-06-01 10:00:00
1f5440da-b34c-4be4-afd7-f478fe74339d	f8f351b8-1174-40d2-b107-988355cfac0d	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.97	1.32	Kg	12.81	97746f10-4550-47c6-a4c2-3beed36e4447	-6.87040575644722,107.62634650688013	2026-06-13 23:00:00
047b9c87-f5b0-4477-9a52-941e2449f60b	f8f351b8-1174-40d2-b107-988355cfac0d	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.99	3.60	Kg	35.56	97746f10-4550-47c6-a4c2-3beed36e4447	-6.87040575644722,107.62634650688013	2026-07-13 09:00:00
29ad2910-73c3-49c2-80b6-0329ff2cb12b	f8f351b8-1174-40d2-b107-988355cfac0d	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.87	3.57	Kg	31.22	97746f10-4550-47c6-a4c2-3beed36e4447	-6.87040575644722,107.62634650688013	2026-07-27 09:00:00
c45b0e1d-f308-4b60-883e-41ed54f9f26c	f8f351b8-1174-40d2-b107-988355cfac0d	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.95	1.94	Kg	27.78	c0312dda-3da8-4c5f-b6d8-104c2a3a99e7	-6.87040575644722,107.62634650688013	2026-07-19 00:00:00
0e9bed81-dba4-4363-beb9-e82d2a2fa4df	f8f351b8-1174-40d2-b107-988355cfac0d	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.80	1.12	Kg	9.03	97746f10-4550-47c6-a4c2-3beed36e4447	-6.87040575644722,107.62634650688013	2026-07-18 23:00:00
9544e71f-06d2-4af4-8baa-b4728dd3dbf2	f8f351b8-1174-40d2-b107-988355cfac0d	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.88	1.53	Kg	20.12	c0312dda-3da8-4c5f-b6d8-104c2a3a99e7	-6.87040575644722,107.62634650688013	2026-05-31 09:00:00
d0a1391f-8f96-4fe4-b7a4-3d48038acfad	f8f351b8-1174-40d2-b107-988355cfac0d	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.99	2.65	Kg	39.38	c0312dda-3da8-4c5f-b6d8-104c2a3a99e7	-6.87040575644722,107.62634650688013	2026-06-29 09:00:00
b703ca83-8678-471f-87aa-197b2d9720f0	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.89	2.27	Kg	30.28	bab99c3a-4c22-46d6-9acf-09717e9577bf	-6.8645799993372805,107.62102662066918	2026-06-26 00:00:00
682e7f92-6402-4409-ab80-dbd6ba0fdda6	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.85	3.36	Kg	28.40	c1c3e5b0-8d63-44d3-a1c2-fb9cfb28b8fb	-6.8645799993372805,107.62102662066918	2026-06-01 23:00:00
59722707-98f9-46c0-a23c-9867daabad2a	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.98	3.17	Kg	31.08	c1c3e5b0-8d63-44d3-a1c2-fb9cfb28b8fb	-6.8645799993372805,107.62102662066918	2026-07-27 23:00:00
317e0c6c-f422-4bf5-bab2-907c962a6e27	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.98	1.80	Kg	17.69	c1c3e5b0-8d63-44d3-a1c2-fb9cfb28b8fb	-6.8645799993372805,107.62102662066918	2026-07-21 09:00:00
ee1e43f3-33f3-4c48-86a8-86aa292fcc05	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.90	1.61	Kg	21.84	bab99c3a-4c22-46d6-9acf-09717e9577bf	-6.8645799993372805,107.62102662066918	2026-06-15 10:00:00
d8b5efc4-79b1-4506-b0ee-a229015eb5ff	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.96	3.56	Kg	34.13	c1c3e5b0-8d63-44d3-a1c2-fb9cfb28b8fb	-6.8645799993372805,107.62102662066918	2026-06-10 10:00:00
8c92b6a0-ecce-40a8-a211-b251cd610f41	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.82	1.79	Kg	22.09	bab99c3a-4c22-46d6-9acf-09717e9577bf	-6.8645799993372805,107.62102662066918	2026-07-14 10:00:00
3c7af2e4-8226-4525-aa00-ed6a4329c508	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.95	2.18	Kg	31.01	bab99c3a-4c22-46d6-9acf-09717e9577bf	-6.8645799993372805,107.62102662066918	2026-06-08 10:00:00
19889e8f-eb10-4558-a067-0b5d24d6c75c	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.93	1.87	Kg	26.15	bab99c3a-4c22-46d6-9acf-09717e9577bf	-6.8645799993372805,107.62102662066918	2026-06-10 10:00:00
d27d778d-480e-41ab-b4fb-bf1e92b0619c	6e65c7cb-2969-4483-be16-923f5dfc02b5	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.88	2.22	Kg	19.57	1b55c6cb-63e8-4acf-a10f-06a5be363a9a	-6.864168149120362,107.62148694552545	2026-07-26 00:00:00
7f54225b-65be-4249-af83-a9ee97bbdf21	6e65c7cb-2969-4483-be16-923f5dfc02b5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.83	1.21	Kg	15.06	5f169e8b-93c0-42ee-9613-dc76842ecad1	-6.864168149120362,107.62148694552545	2026-06-07 10:00:00
c39ba00e-030d-4d9f-8602-af95936c6129	6e65c7cb-2969-4483-be16-923f5dfc02b5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.91	2.08	Kg	28.27	5f169e8b-93c0-42ee-9613-dc76842ecad1	-6.864168149120362,107.62148694552545	2026-06-04 09:00:00
60e16e60-3047-428b-8c92-f306514248ea	6e65c7cb-2969-4483-be16-923f5dfc02b5	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.95	2.28	Kg	21.69	1b55c6cb-63e8-4acf-a10f-06a5be363a9a	-6.864168149120362,107.62148694552545	2026-06-07 00:00:00
606ecdf3-d2ca-47bc-b601-d009e0c9daea	6e65c7cb-2969-4483-be16-923f5dfc02b5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.96	3.33	Kg	47.96	5f169e8b-93c0-42ee-9613-dc76842ecad1	-6.864168149120362,107.62148694552545	2026-07-19 09:00:00
bd04a70b-3a15-4e88-b9d4-602e946ded8a	6e65c7cb-2969-4483-be16-923f5dfc02b5	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.86	2.52	Kg	21.59	1b55c6cb-63e8-4acf-a10f-06a5be363a9a	-6.864168149120362,107.62148694552545	2026-06-19 23:00:00
45015d9e-bf16-49e2-b2a8-d9745806656f	6e65c7cb-2969-4483-be16-923f5dfc02b5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.85	3.98	Kg	50.75	5f169e8b-93c0-42ee-9613-dc76842ecad1	-6.864168149120362,107.62148694552545	2026-07-22 09:00:00
abbddabf-9013-48a0-9060-ffdec0def997	6e65c7cb-2969-4483-be16-923f5dfc02b5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.96	1.28	Kg	18.31	5f169e8b-93c0-42ee-9613-dc76842ecad1	-6.864168149120362,107.62148694552545	2026-06-22 10:00:00
8513dc9d-a159-4a69-98a9-7b4330673d3c	8265f3d5-9929-4810-9d35-8254c92b7161	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.86	1.58	Kg	13.59	6eb9774a-7e63-4168-be08-731dbb41178d	-6.864208577789908,107.6197431274601	2026-06-28 23:00:00
40e2f61c-83d3-4e29-9d2b-e65e6e886e6b	8265f3d5-9929-4810-9d35-8254c92b7161	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.89	2.90	Kg	25.85	6eb9774a-7e63-4168-be08-731dbb41178d	-6.864208577789908,107.6197431274601	2026-06-04 10:00:00
ab6edc54-c5a2-4a42-b5ae-e92392e7ebac	8265f3d5-9929-4810-9d35-8254c92b7161	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.95	1.04	Kg	9.90	6eb9774a-7e63-4168-be08-731dbb41178d	-6.864208577789908,107.6197431274601	2026-07-25 09:00:00
2f40b935-6ce8-482f-b034-d80f8a38559c	8265f3d5-9929-4810-9d35-8254c92b7161	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.92	1.92	Kg	17.64	6eb9774a-7e63-4168-be08-731dbb41178d	-6.864208577789908,107.6197431274601	2026-07-07 10:00:00
5141be8a-b306-41eb-92e2-19d89120a6d0	8265f3d5-9929-4810-9d35-8254c92b7161	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.90	1.29	Kg	11.59	6eb9774a-7e63-4168-be08-731dbb41178d	-6.864208577789908,107.6197431274601	2026-06-15 00:00:00
ab19dfb3-a906-4aa8-8328-e31405b57314	8265f3d5-9929-4810-9d35-8254c92b7161	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.81	3.05	Kg	24.74	6eb9774a-7e63-4168-be08-731dbb41178d	-6.864208577789908,107.6197431274601	2026-07-04 09:00:00
3b82628f-84ad-462c-a7a5-00880ec123c4	6350bf55-763c-4db5-a60a-011fb84c6ef2	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.89	1.98	Kg	26.58	1b212755-40f2-4f00-a4d4-5dc9a9210dd3	-6.869716805993419,107.62291200784607	2026-06-01 10:00:00
f8bca081-79d1-4d9f-a937-a99309e1ec4b	6350bf55-763c-4db5-a60a-011fb84c6ef2	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.93	3.15	Kg	43.93	1b212755-40f2-4f00-a4d4-5dc9a9210dd3	-6.869716805993419,107.62291200784607	2026-07-19 09:00:00
0bcf4740-e6e6-4190-b630-24915bb807fb	6350bf55-763c-4db5-a60a-011fb84c6ef2	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.91	1.09	Kg	14.99	1b212755-40f2-4f00-a4d4-5dc9a9210dd3	-6.869716805993419,107.62291200784607	2026-07-18 00:00:00
f5725bf2-6a73-4be6-8796-d3a5c3684608	6350bf55-763c-4db5-a60a-011fb84c6ef2	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.92	3.83	Kg	35.37	151c8739-2aaf-40f6-aebe-2775c0ded2af	-6.869716805993419,107.62291200784607	2026-07-24 09:00:00
c97c480f-fcf0-40a7-9526-ba8a668e251c	6350bf55-763c-4db5-a60a-011fb84c6ef2	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.98	3.32	Kg	48.92	1b212755-40f2-4f00-a4d4-5dc9a9210dd3	-6.869716805993419,107.62291200784607	2026-07-01 00:00:00
88145f29-7456-4717-9676-0e7b79f9b576	6350bf55-763c-4db5-a60a-011fb84c6ef2	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.91	2.17	Kg	29.81	1b212755-40f2-4f00-a4d4-5dc9a9210dd3	-6.869716805993419,107.62291200784607	2026-06-21 09:00:00
5ecafbbd-8c95-4742-856e-0ff9e4e308ef	ece74bb6-33f1-4e23-b489-aedd0f91cbca	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.95	2.50	Kg	23.67	981507f1-dc39-45d8-8c10-f9a05aaf39d4	-6.871351898466059,107.62167192821703	2026-07-28 09:00:00
e82144fd-2c84-4e8e-8dcc-5cdb05a2793a	ece74bb6-33f1-4e23-b489-aedd0f91cbca	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.80	1.42	Kg	17.08	2a56f3e0-a093-4a90-8865-17a6df7380bb	-6.871351898466059,107.62167192821703	2026-06-06 23:00:00
61975a0f-82d4-4c54-8b55-c31ce0258244	ece74bb6-33f1-4e23-b489-aedd0f91cbca	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.88	1.98	Kg	17.45	981507f1-dc39-45d8-8c10-f9a05aaf39d4	-6.871351898466059,107.62167192821703	2026-07-22 23:00:00
271a1f8d-8f5e-42a8-be93-efae52b8aea4	ece74bb6-33f1-4e23-b489-aedd0f91cbca	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.88	1.76	Kg	23.33	2a56f3e0-a093-4a90-8865-17a6df7380bb	-6.871351898466059,107.62167192821703	2026-06-14 09:00:00
f77a6446-7795-4561-a4d7-b1e0f8fd5468	ece74bb6-33f1-4e23-b489-aedd0f91cbca	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.99	1.37	Kg	20.24	2a56f3e0-a093-4a90-8865-17a6df7380bb	-6.871351898466059,107.62167192821703	2026-06-08 23:00:00
3e10d792-13b8-4916-95f4-35d5d422337f	ece74bb6-33f1-4e23-b489-aedd0f91cbca	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.92	1.91	Kg	17.55	981507f1-dc39-45d8-8c10-f9a05aaf39d4	-6.871351898466059,107.62167192821703	2026-07-04 23:00:00
697bedfb-18ae-4044-8ca4-94280b293f16	ece74bb6-33f1-4e23-b489-aedd0f91cbca	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.88	2.47	Kg	21.85	981507f1-dc39-45d8-8c10-f9a05aaf39d4	-6.871351898466059,107.62167192821703	2026-07-07 00:00:00
63fe0015-4dc5-49c2-90e8-81bf2c244154	ece74bb6-33f1-4e23-b489-aedd0f91cbca	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.98	1.27	Kg	18.70	2a56f3e0-a093-4a90-8865-17a6df7380bb	-6.871351898466059,107.62167192821703	2026-07-01 09:00:00
e4ea9b52-5b3d-48e0-83f7-77f4d818df01	ece74bb6-33f1-4e23-b489-aedd0f91cbca	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.87	1.82	Kg	23.89	2a56f3e0-a093-4a90-8865-17a6df7380bb	-6.871351898466059,107.62167192821703	2026-07-27 00:00:00
4d41e9fd-ee03-4bbb-ae9c-006a46b0453e	ece74bb6-33f1-4e23-b489-aedd0f91cbca	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.97	2.15	Kg	31.39	2a56f3e0-a093-4a90-8865-17a6df7380bb	-6.871351898466059,107.62167192821703	2026-06-12 23:00:00
b37a9a94-de5a-4ff6-9707-ec665e7d4636	866e0066-e48e-4339-a2a5-40d06ba5c93e	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.98	1.54	Kg	15.18	c123745b-c121-4ac7-a7f7-9fc867698ac7	-6.870696889686054,107.62186918374397	2026-07-04 10:00:00
92cac887-7514-4e22-aeaf-8523768448c6	866e0066-e48e-4339-a2a5-40d06ba5c93e	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.93	1.16	Kg	10.85	c123745b-c121-4ac7-a7f7-9fc867698ac7	-6.870696889686054,107.62186918374397	2026-06-01 00:00:00
8b5ace17-a193-4f43-961f-60f44dda3ad2	866e0066-e48e-4339-a2a5-40d06ba5c93e	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.85	3.88	Kg	49.30	09ed65ff-237c-43bb-84e4-60b16427c2a1	-6.870696889686054,107.62186918374397	2026-06-12 09:00:00
737575ec-c007-4a6b-9a7e-0d2779a37e21	866e0066-e48e-4339-a2a5-40d06ba5c93e	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.91	1.54	Kg	13.95	c123745b-c121-4ac7-a7f7-9fc867698ac7	-6.870696889686054,107.62186918374397	2026-07-14 09:00:00
923fcf5d-23d3-4b5c-bfb1-3a6fa5e8fca5	866e0066-e48e-4339-a2a5-40d06ba5c93e	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.81	2.51	Kg	30.46	09ed65ff-237c-43bb-84e4-60b16427c2a1	-6.870696889686054,107.62186918374397	2026-07-15 23:00:00
9ce058c5-2c1a-44b1-960a-09fe23dc2dad	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.83	1.12	Kg	9.28	4f8e19a0-bfac-430e-999e-ca71ce875f16	-6.872917158912858,107.61850317754381	2026-07-18 10:00:00
5134d635-c11c-4b5a-91dd-89443a6fe2b6	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.86	1.60	Kg	13.82	4f8e19a0-bfac-430e-999e-ca71ce875f16	-6.872917158912858,107.61850317754381	2026-06-14 09:00:00
bbd92202-f9e7-4118-9028-1dca75708e63	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.91	3.22	Kg	44.01	9666e589-38d4-4404-82c4-910a271e8757	-6.872917158912858,107.61850317754381	2026-07-09 10:00:00
1af10f8b-55df-4de9-b5e6-956cf8ffdf96	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.95	3.04	Kg	28.91	4f8e19a0-bfac-430e-999e-ca71ce875f16	-6.872917158912858,107.61850317754381	2026-06-23 23:00:00
4acf91b4-bdd9-44c7-a20a-47d43cc54a23	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.85	2.74	Kg	35.05	9666e589-38d4-4404-82c4-910a271e8757	-6.872917158912858,107.61850317754381	2026-07-20 23:00:00
1d77a6b4-1992-42c2-8959-dc059403bcb4	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.80	1.08	Kg	8.67	4f8e19a0-bfac-430e-999e-ca71ce875f16	-6.872917158912858,107.61850317754381	2026-07-07 00:00:00
c6cc9660-c004-4413-9978-94a5703abd57	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.92	2.52	Kg	23.07	4f8e19a0-bfac-430e-999e-ca71ce875f16	-6.872917158912858,107.61850317754381	2026-06-20 23:00:00
321c770d-b5f4-427b-ae21-9dabe60c1fd4	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.98	3.76	Kg	55.10	9666e589-38d4-4404-82c4-910a271e8757	-6.872917158912858,107.61850317754381	2026-06-02 10:00:00
e26160ce-8c26-4aea-8166-0b6357346890	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.95	2.14	Kg	30.64	9666e589-38d4-4404-82c4-910a271e8757	-6.872917158912858,107.61850317754381	2026-06-08 00:00:00
e5311971-d1c9-44aa-af4e-916b3cdfa291	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.92	3.29	Kg	30.29	4f8e19a0-bfac-430e-999e-ca71ce875f16	-6.872917158912858,107.61850317754381	2026-07-11 09:00:00
51155826-d3d3-4371-a6d2-4b1d2895258a	878f098e-6dc8-4860-ba8e-53bb9dc307bf	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.97	3.72	Kg	36.05	f041d015-6c3e-42f5-aec9-b1235bd6fbba	-6.872989363483857,107.61944887857007	2026-06-17 10:00:00
9b0c92c5-7f18-4338-92aa-e3da789ad0b4	878f098e-6dc8-4860-ba8e-53bb9dc307bf	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.96	3.45	Kg	33.27	f041d015-6c3e-42f5-aec9-b1235bd6fbba	-6.872989363483857,107.61944887857007	2026-07-20 23:00:00
20c89dd5-7ca6-4649-9db5-9616b860b79d	878f098e-6dc8-4860-ba8e-53bb9dc307bf	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.96	3.68	Kg	52.99	5a78ee01-6d56-4e3c-8849-a471d01ebe01	-6.872989363483857,107.61944887857007	2026-07-07 23:00:00
6db4616a-71e5-47e0-bd18-5f7a53d11741	878f098e-6dc8-4860-ba8e-53bb9dc307bf	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.96	2.52	Kg	24.24	f041d015-6c3e-42f5-aec9-b1235bd6fbba	-6.872989363483857,107.61944887857007	2026-06-11 00:00:00
89ce25e8-293a-45c1-8eea-1becfce44f45	878f098e-6dc8-4860-ba8e-53bb9dc307bf	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.94	3.38	Kg	47.84	5a78ee01-6d56-4e3c-8849-a471d01ebe01	-6.872989363483857,107.61944887857007	2026-06-12 23:00:00
0bfe3987-0dd5-4322-8984-9970ba8e4623	878f098e-6dc8-4860-ba8e-53bb9dc307bf	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.97	2.40	Kg	23.19	f041d015-6c3e-42f5-aec9-b1235bd6fbba	-6.872989363483857,107.61944887857007	2026-06-05 10:00:00
1cda1bc0-0625-4375-9d95-01f77e5c4c1d	429797a7-76fc-4742-a802-e4cc532c85a9	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.91	2.50	Kg	34.30	e30d175f-a898-47a3-8218-e15545e555e3	-6.875578282998696,107.61853497853089	2026-06-21 09:00:00
0a35cda9-37b9-43e3-b8ad-26f616f42911	429797a7-76fc-4742-a802-e4cc532c85a9	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.82	2.06	Kg	25.43	e30d175f-a898-47a3-8218-e15545e555e3	-6.875578282998696,107.61853497853089	2026-07-04 00:00:00
5f71e88d-3688-4117-9643-527ac2e13bee	429797a7-76fc-4742-a802-e4cc532c85a9	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.84	3.58	Kg	30.10	91ce5f8f-c238-42e7-b2b1-c7781b193e05	-6.875578282998696,107.61853497853089	2026-06-14 00:00:00
89ae46d2-e214-4807-bee4-4e8c46f5092d	429797a7-76fc-4742-a802-e4cc532c85a9	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.91	3.90	Kg	35.29	91ce5f8f-c238-42e7-b2b1-c7781b193e05	-6.875578282998696,107.61853497853089	2026-07-01 23:00:00
ebe79122-f460-4ec0-9272-1b7678b2b5c7	429797a7-76fc-4742-a802-e4cc532c85a9	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.81	1.47	Kg	17.82	e30d175f-a898-47a3-8218-e15545e555e3	-6.875578282998696,107.61853497853089	2026-06-16 00:00:00
e0b7e997-88b1-4164-a41c-8047a10f8aff	429797a7-76fc-4742-a802-e4cc532c85a9	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.95	1.90	Kg	18.05	91ce5f8f-c238-42e7-b2b1-c7781b193e05	-6.875578282998696,107.61853497853089	2026-07-21 23:00:00
256902ce-84d2-49f7-9b32-8cebfb684169	cc384148-25ef-43c2-8187-289865e697a5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.91	2.60	Kg	35.62	d1cf2280-a220-4610-bb5a-4f7e7ff6a479	-6.886866382473474,107.6164697656737	2026-07-26 10:00:00
a3d51bd5-1736-4186-911f-115670db5b87	cc384148-25ef-43c2-8187-289865e697a5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.97	1.22	Kg	17.76	d1cf2280-a220-4610-bb5a-4f7e7ff6a479	-6.886866382473474,107.6164697656737	2026-06-23 23:00:00
efe29afa-3eef-4c13-a51e-2022e5ea1274	cc384148-25ef-43c2-8187-289865e697a5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.86	2.53	Kg	32.73	d1cf2280-a220-4610-bb5a-4f7e7ff6a479	-6.886866382473474,107.6164697656737	2026-06-09 00:00:00
086fabcd-5fd9-4b82-8d7d-c17466bd68f7	cc384148-25ef-43c2-8187-289865e697a5	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.93	3.43	Kg	31.91	2f50c138-c5e8-4d02-a39e-fab07bc57f25	-6.886866382473474,107.6164697656737	2026-07-06 09:00:00
9b7a6213-0ceb-47fc-9abf-e5c2f39e2b8a	cc384148-25ef-43c2-8187-289865e697a5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.81	2.84	Kg	34.61	d1cf2280-a220-4610-bb5a-4f7e7ff6a479	-6.886866382473474,107.6164697656737	2026-07-09 00:00:00
29968824-56f6-4795-aac2-2f9d69602e33	cc384148-25ef-43c2-8187-289865e697a5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.97	1.08	Kg	15.70	d1cf2280-a220-4610-bb5a-4f7e7ff6a479	-6.886866382473474,107.6164697656737	2026-06-19 09:00:00
3e5b2ecb-2bb9-49c6-8d7f-da00d9abb2d9	cc384148-25ef-43c2-8187-289865e697a5	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.85	1.21	Kg	10.30	2f50c138-c5e8-4d02-a39e-fab07bc57f25	-6.886866382473474,107.6164697656737	2026-07-01 10:00:00
0b5d20e6-5b4e-4afe-8b9e-9e540d0d22e5	cc384148-25ef-43c2-8187-289865e697a5	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.88	3.23	Kg	28.32	2f50c138-c5e8-4d02-a39e-fab07bc57f25	-6.886866382473474,107.6164697656737	2026-06-27 00:00:00
56fd6757-dd41-4cfb-8feb-047d204715a3	e9a5cb9c-3a99-4448-8bfa-6388378e52a5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.88	3.49	Kg	46.00	aba8a5fd-7c54-475e-96de-c285070fed6f	-6.886207447365989,107.61795241214057	2026-06-21 23:00:00
5bb3ab31-bc96-46d7-816c-5b581dbbfcfb	e9a5cb9c-3a99-4448-8bfa-6388378e52a5	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.95	1.03	Kg	9.78	19014866-2adc-4bab-b9b6-894358e90c4d	-6.886207447365989,107.61795241214057	2026-07-22 00:00:00
be6e3e19-e654-424e-b114-e8271e8895bd	e9a5cb9c-3a99-4448-8bfa-6388378e52a5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.83	3.16	Kg	39.46	aba8a5fd-7c54-475e-96de-c285070fed6f	-6.886207447365989,107.61795241214057	2026-07-23 10:00:00
70b8ce0b-9eb0-4091-a1a1-48351234a22f	e9a5cb9c-3a99-4448-8bfa-6388378e52a5	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.93	2.30	Kg	21.44	19014866-2adc-4bab-b9b6-894358e90c4d	-6.886207447365989,107.61795241214057	2026-06-28 09:00:00
c463054e-eb4c-49ea-b5a2-23c45abb5a8c	e9a5cb9c-3a99-4448-8bfa-6388378e52a5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.94	2.35	Kg	33.06	aba8a5fd-7c54-475e-96de-c285070fed6f	-6.886207447365989,107.61795241214057	2026-06-29 10:00:00
047f0b0f-6acc-41f3-92e1-a722d97dac20	d6db8325-10f5-45cb-a509-b0d284cb91f0	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.97	3.50	Kg	50.76	a3398840-269e-4638-a1bf-0810e0b6a9ca	-6.885419850398726,107.61610451520558	2026-07-27 09:00:00
26f6128e-f930-443d-bf61-b65613e36873	d6db8325-10f5-45cb-a509-b0d284cb91f0	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.91	2.42	Kg	22.11	da42673d-22cb-412e-93c6-3f7782e257fb	-6.885419850398726,107.61610451520558	2026-07-16 23:00:00
e2c4c1d0-92d4-45e6-82b8-793ed2ff607b	d6db8325-10f5-45cb-a509-b0d284cb91f0	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.86	2.87	Kg	24.53	da42673d-22cb-412e-93c6-3f7782e257fb	-6.885419850398726,107.61610451520558	2026-07-01 23:00:00
cde3a2fc-7dee-4f64-ad56-e9d4ddd7834d	d6db8325-10f5-45cb-a509-b0d284cb91f0	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.88	3.41	Kg	45.17	a3398840-269e-4638-a1bf-0810e0b6a9ca	-6.885419850398726,107.61610451520558	2026-07-08 10:00:00
f5b94fcb-4224-4189-ae9a-7468328d624b	d6db8325-10f5-45cb-a509-b0d284cb91f0	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.97	1.82	Kg	26.48	a3398840-269e-4638-a1bf-0810e0b6a9ca	-6.885419850398726,107.61610451520558	2026-07-08 09:00:00
053ccb51-da34-4725-84f9-457295580f55	d6db8325-10f5-45cb-a509-b0d284cb91f0	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.95	1.59	Kg	22.62	a3398840-269e-4638-a1bf-0810e0b6a9ca	-6.885419850398726,107.61610451520558	2026-06-10 23:00:00
e1521688-bb7e-4b94-ad24-e2cdda4ee235	d6db8325-10f5-45cb-a509-b0d284cb91f0	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.90	2.45	Kg	32.96	a3398840-269e-4638-a1bf-0810e0b6a9ca	-6.885419850398726,107.61610451520558	2026-06-17 00:00:00
695dcc72-4f1c-495c-8205-1a7a06dd6ffc	54e9694d-7492-4543-9fe9-8fd7f4f5c921	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.94	2.97	Kg	27.81	a9186f55-e8bd-4abd-993f-b660bec22e27	-6.883708953893119,107.61639500168542	2026-06-21 00:00:00
c5c83ec0-e281-4f03-bf99-e1ad481f2e4b	54e9694d-7492-4543-9fe9-8fd7f4f5c921	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.91	2.05	Kg	27.92	6f152d2a-7a7a-4209-a872-aeb0eb6fcbad	-6.883708953893119,107.61639500168542	2026-06-29 09:00:00
5eef0947-be58-486d-9eb7-7892f6919138	54e9694d-7492-4543-9fe9-8fd7f4f5c921	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.81	2.67	Kg	21.75	a9186f55-e8bd-4abd-993f-b660bec22e27	-6.883708953893119,107.61639500168542	2026-06-05 09:00:00
2fdb6456-cd50-40c8-a9ad-bfde8ca31f72	54e9694d-7492-4543-9fe9-8fd7f4f5c921	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.95	1.65	Kg	23.66	6f152d2a-7a7a-4209-a872-aeb0eb6fcbad	-6.883708953893119,107.61639500168542	2026-07-25 00:00:00
85bb12cc-5616-4fa4-a4ea-a51e8d891c6e	54e9694d-7492-4543-9fe9-8fd7f4f5c921	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.84	1.46	Kg	12.35	a9186f55-e8bd-4abd-993f-b660bec22e27	-6.883708953893119,107.61639500168542	2026-07-09 00:00:00
5ec8dba9-b895-44c6-9e6c-3dcec61a085a	54e9694d-7492-4543-9fe9-8fd7f4f5c921	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.93	1.12	Kg	15.54	6f152d2a-7a7a-4209-a872-aeb0eb6fcbad	-6.883708953893119,107.61639500168542	2026-06-24 00:00:00
ea9f0b37-a926-4dcb-8228-007e658d4c95	54e9694d-7492-4543-9fe9-8fd7f4f5c921	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.86	1.83	Kg	15.79	a9186f55-e8bd-4abd-993f-b660bec22e27	-6.883708953893119,107.61639500168542	2026-07-06 09:00:00
09fb0588-50d3-4197-98a4-1950da18a62a	54e9694d-7492-4543-9fe9-8fd7f4f5c921	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.87	1.00	Kg	8.69	a9186f55-e8bd-4abd-993f-b660bec22e27	-6.883708953893119,107.61639500168542	2026-05-30 23:00:00
eab5aa6e-5ad9-4993-b07e-5c250cd91874	2a07a787-3e37-41c1-a052-ab2fea01f2d7	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.96	1.53	Kg	21.97	82a26307-a23e-4810-b6e7-f68a10f9a516	-6.884540460659926,107.6177635775495	2026-07-06 10:00:00
f0f49f79-b31e-4209-a59f-2fa64bee80e8	2a07a787-3e37-41c1-a052-ab2fea01f2d7	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.82	2.86	Kg	23.43	ceea01d3-8cfa-4cdd-9a47-35b475c5b844	-6.884540460659926,107.6177635775495	2026-06-30 09:00:00
d9dde1d6-5808-4b18-a6a1-8acb53686bdf	2a07a787-3e37-41c1-a052-ab2fea01f2d7	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.84	3.09	Kg	25.99	ceea01d3-8cfa-4cdd-9a47-35b475c5b844	-6.884540460659926,107.6177635775495	2026-06-06 23:00:00
a9b5eebc-0634-4107-bd64-d2b36dd18db4	2a07a787-3e37-41c1-a052-ab2fea01f2d7	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.96	1.78	Kg	17.12	ceea01d3-8cfa-4cdd-9a47-35b475c5b844	-6.884540460659926,107.6177635775495	2026-06-28 09:00:00
e02a72f4-6a4e-4760-b8dd-7735d35f9a9e	2a07a787-3e37-41c1-a052-ab2fea01f2d7	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.96	3.25	Kg	31.13	ceea01d3-8cfa-4cdd-9a47-35b475c5b844	-6.884540460659926,107.6177635775495	2026-07-28 23:00:00
2f4dc29d-1d32-4bec-b56e-37bd9c215ee3	2a07a787-3e37-41c1-a052-ab2fea01f2d7	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.91	3.43	Kg	47.05	82a26307-a23e-4810-b6e7-f68a10f9a516	-6.884540460659926,107.6177635775495	2026-07-13 00:00:00
cd99dbe6-5e95-41fe-aa7c-549451efdf36	2a07a787-3e37-41c1-a052-ab2fea01f2d7	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.82	2.47	Kg	20.33	ceea01d3-8cfa-4cdd-9a47-35b475c5b844	-6.884540460659926,107.6177635775495	2026-06-07 10:00:00
f478a32c-5bd3-46f3-b24d-04eb8a8879ff	2a07a787-3e37-41c1-a052-ab2fea01f2d7	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.82	1.93	Kg	23.74	82a26307-a23e-4810-b6e7-f68a10f9a516	-6.884540460659926,107.6177635775495	2026-06-07 10:00:00
5aaf646d-012c-4722-809b-3e61695871ec	2a07a787-3e37-41c1-a052-ab2fea01f2d7	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.95	1.13	Kg	16.10	82a26307-a23e-4810-b6e7-f68a10f9a516	-6.884540460659926,107.6177635775495	2026-07-18 09:00:00
ea2a5d12-ffbe-438f-bc39-b1fad3301c31	2a07a787-3e37-41c1-a052-ab2fea01f2d7	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.95	1.76	Kg	16.76	ceea01d3-8cfa-4cdd-9a47-35b475c5b844	-6.884540460659926,107.6177635775495	2026-07-14 09:00:00
1696edc5-98ae-4bfb-b5db-48e31a475578	2a07a787-3e37-41c1-a052-ab2fea01f2d7	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.82	3.81	Kg	31.25	ceea01d3-8cfa-4cdd-9a47-35b475c5b844	-6.884540460659926,107.6177635775495	2026-07-03 00:00:00
4bb884a0-e33a-40c1-841c-5261de8aba85	f2edfdc0-029b-46db-8710-968c19475c2e	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.89	2.01	Kg	26.90	7945ff70-a80e-4a31-b373-f0a2253e0500	-6.8846601015145215,107.6166986896525	2026-06-21 09:00:00
618ad8ab-a68c-4c9a-8ee4-e9f959a53ccb	f2edfdc0-029b-46db-8710-968c19475c2e	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.96	1.74	Kg	16.77	948309dd-baf9-4fc3-9373-100ab05af27d	-6.8846601015145215,107.6166986896525	2026-06-01 09:00:00
5d7ccb05-f96f-43d7-9da1-0038bbb44b8c	f2edfdc0-029b-46db-8710-968c19475c2e	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.90	3.45	Kg	31.01	948309dd-baf9-4fc3-9373-100ab05af27d	-6.8846601015145215,107.6166986896525	2026-06-09 09:00:00
ea5f2b30-0678-4e4a-9f83-ecab1604a4f8	f2edfdc0-029b-46db-8710-968c19475c2e	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.90	1.80	Kg	16.13	948309dd-baf9-4fc3-9373-100ab05af27d	-6.8846601015145215,107.6166986896525	2026-07-22 10:00:00
062e7da1-6f43-4461-9c78-921cb229424f	f2edfdc0-029b-46db-8710-968c19475c2e	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.86	2.31	Kg	19.86	948309dd-baf9-4fc3-9373-100ab05af27d	-6.8846601015145215,107.6166986896525	2026-07-06 10:00:00
8ca049ec-6cbb-4553-93d6-5aee88cfaead	f2edfdc0-029b-46db-8710-968c19475c2e	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.92	1.54	Kg	14.25	948309dd-baf9-4fc3-9373-100ab05af27d	-6.8846601015145215,107.6166986896525	2026-06-09 10:00:00
997f7530-2565-4d64-814b-5094983e402b	f2edfdc0-029b-46db-8710-968c19475c2e	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.85	3.75	Kg	32.04	948309dd-baf9-4fc3-9373-100ab05af27d	-6.8846601015145215,107.6166986896525	2026-07-14 09:00:00
dc08fb5e-742a-411b-8590-0e8a9eb801dc	f2edfdc0-029b-46db-8710-968c19475c2e	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.84	2.13	Kg	17.87	948309dd-baf9-4fc3-9373-100ab05af27d	-6.8846601015145215,107.6166986896525	2026-06-17 09:00:00
ab1117a5-0816-4b37-8888-4d9aa360a44d	f2edfdc0-029b-46db-8710-968c19475c2e	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.88	2.74	Kg	24.01	948309dd-baf9-4fc3-9373-100ab05af27d	-6.8846601015145215,107.6166986896525	2026-07-05 23:00:00
21174370-cd05-49ed-9ee2-c34b884f40bc	f2edfdc0-029b-46db-8710-968c19475c2e	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.92	2.94	Kg	27.07	948309dd-baf9-4fc3-9373-100ab05af27d	-6.8846601015145215,107.6166986896525	2026-07-07 10:00:00
4f3942b2-5724-4336-9044-b786db5137c6	b0a65787-bac6-4fec-87ef-24db782044bd	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.93	3.87	Kg	53.86	7f97eb37-66c1-4c5c-a952-a3f8eaee4bac	-6.886981610098162,107.61644110622987	2026-06-26 09:00:00
13bb2bd3-9301-4b91-9bab-7085fc78bcfa	b0a65787-bac6-4fec-87ef-24db782044bd	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.87	2.05	Kg	26.77	7f97eb37-66c1-4c5c-a952-a3f8eaee4bac	-6.886981610098162,107.61644110622987	2026-06-18 09:00:00
a15200c1-50a5-4d61-b40f-b7b08207b12d	b0a65787-bac6-4fec-87ef-24db782044bd	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.97	2.02	Kg	19.53	b1f021cf-5373-4569-878c-0057b6d81cdc	-6.886981610098162,107.61644110622987	2026-06-20 10:00:00
168e719e-7540-4f10-8604-37162d3b1641	b0a65787-bac6-4fec-87ef-24db782044bd	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.82	1.26	Kg	10.37	b1f021cf-5373-4569-878c-0057b6d81cdc	-6.886981610098162,107.61644110622987	2026-07-06 00:00:00
222c9835-2f91-4314-9667-a2fe6a038c66	b0a65787-bac6-4fec-87ef-24db782044bd	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.84	2.20	Kg	18.57	b1f021cf-5373-4569-878c-0057b6d81cdc	-6.886981610098162,107.61644110622987	2026-06-24 09:00:00
8865c09b-d58a-4696-bb33-a02f8712c2cd	b0a65787-bac6-4fec-87ef-24db782044bd	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.87	3.98	Kg	52.14	7f97eb37-66c1-4c5c-a952-a3f8eaee4bac	-6.886981610098162,107.61644110622987	2026-06-14 10:00:00
fc33aa84-1207-4d3e-9c79-4daf91815b5c	b0a65787-bac6-4fec-87ef-24db782044bd	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.82	3.82	Kg	31.29	b1f021cf-5373-4569-878c-0057b6d81cdc	-6.886981610098162,107.61644110622987	2026-07-05 23:00:00
57ca2ce9-7864-4890-8610-1baefe456891	b0a65787-bac6-4fec-87ef-24db782044bd	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.98	3.72	Kg	36.35	b1f021cf-5373-4569-878c-0057b6d81cdc	-6.886981610098162,107.61644110622987	2026-07-13 10:00:00
70c99220-98a4-4161-85d0-0e2cf18b890e	b0a65787-bac6-4fec-87ef-24db782044bd	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.92	1.97	Kg	18.02	b1f021cf-5373-4569-878c-0057b6d81cdc	-6.886981610098162,107.61644110622987	2026-07-12 23:00:00
74bea00f-7bd6-4e83-b28b-7b3038884b55	b0a65787-bac6-4fec-87ef-24db782044bd	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.90	3.57	Kg	48.29	7f97eb37-66c1-4c5c-a952-a3f8eaee4bac	-6.886981610098162,107.61644110622987	2026-07-27 23:00:00
e5cbd1d8-5650-4d5c-b0f9-e9b16602b47b	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.83	1.27	Kg	15.82	6ca3091a-5143-44d5-96d3-ce8aac8829d5	-6.885848529488184,107.61753474402768	2026-06-09 10:00:00
0b233bf3-a229-4cf0-9c86-946406eb57de	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.92	2.54	Kg	35.08	6ca3091a-5143-44d5-96d3-ce8aac8829d5	-6.885848529488184,107.61753474402768	2026-07-27 00:00:00
1eec603f-7032-4433-b114-e963c8ce7d93	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.84	2.25	Kg	18.87	3fdd6981-b8c1-415b-a4f0-160353e8b486	-6.885848529488184,107.61753474402768	2026-07-17 09:00:00
33aad25c-2ff7-4282-a54d-47115457c6a4	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.90	1.16	Kg	10.54	3fdd6981-b8c1-415b-a4f0-160353e8b486	-6.885848529488184,107.61753474402768	2026-07-28 10:00:00
00ac673f-bb5d-4a98-ac30-ad01cde92c1b	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.91	1.65	Kg	14.95	3fdd6981-b8c1-415b-a4f0-160353e8b486	-6.885848529488184,107.61753474402768	2026-05-31 00:00:00
a077be72-2a9b-453a-8d55-ec6179e47a5f	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.96	1.67	Kg	23.89	6ca3091a-5143-44d5-96d3-ce8aac8829d5	-6.885848529488184,107.61753474402768	2026-07-20 00:00:00
0a7c4d3a-09a6-46ca-8d42-2934a60857d6	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.87	2.05	Kg	17.81	3fdd6981-b8c1-415b-a4f0-160353e8b486	-6.885848529488184,107.61753474402768	2026-07-04 23:00:00
1d692c45-f067-435e-8021-b2db18d29a82	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.98	1.70	Kg	24.94	6ca3091a-5143-44d5-96d3-ce8aac8829d5	-6.885848529488184,107.61753474402768	2026-06-22 23:00:00
3eba0842-f70d-421a-829b-4a751df7b29c	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.88	2.97	Kg	26.26	3fdd6981-b8c1-415b-a4f0-160353e8b486	-6.885848529488184,107.61753474402768	2026-07-01 23:00:00
0678b7c5-181f-4c62-9743-c498ff512c14	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.83	2.11	Kg	26.29	6ca3091a-5143-44d5-96d3-ce8aac8829d5	-6.885848529488184,107.61753474402768	2026-07-04 23:00:00
dd4df89a-de45-4be2-ab95-a6a41978f1b4	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.89	2.38	Kg	21.10	3fdd6981-b8c1-415b-a4f0-160353e8b486	-6.885848529488184,107.61753474402768	2026-07-13 09:00:00
fb719e69-6283-4787-878f-ea47468e5543	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.85	1.81	Kg	15.47	1ea72845-6112-4c97-a8a0-5b3b8b889e5d	-6.887792072886983,107.61864850401672	2026-07-26 09:00:00
689ccf49-e888-4986-8d6a-6839f85c79cc	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.91	2.06	Kg	27.98	5c33d7e9-48d4-4461-9011-050e38972322	-6.887792072886983,107.61864850401672	2026-07-08 23:00:00
5356b8c8-bd88-45fd-8536-a3db890fb3ff	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.87	3.90	Kg	50.71	5c33d7e9-48d4-4461-9011-050e38972322	-6.887792072886983,107.61864850401672	2026-06-26 23:00:00
44d86364-bc9b-499b-908b-d6b72a0493b8	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.82	3.86	Kg	31.62	1ea72845-6112-4c97-a8a0-5b3b8b889e5d	-6.887792072886983,107.61864850401672	2026-07-11 00:00:00
ece2430c-0e3a-4d66-96c5-0adee22c8b4d	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.84	2.84	Kg	35.75	5c33d7e9-48d4-4461-9011-050e38972322	-6.887792072886983,107.61864850401672	2026-06-20 23:00:00
f6b4df67-89af-44d8-be89-3412e7d81ff5	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.96	1.09	Kg	15.72	5c33d7e9-48d4-4461-9011-050e38972322	-6.887792072886983,107.61864850401672	2026-06-20 23:00:00
d1fd0432-6b8a-47a8-b79e-5eeef9a180fc	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.89	2.69	Kg	24.06	1ea72845-6112-4c97-a8a0-5b3b8b889e5d	-6.887792072886983,107.61864850401672	2026-06-18 09:00:00
9c928108-6630-4744-abf3-e67ae483ff78	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.91	3.02	Kg	41.34	5c33d7e9-48d4-4461-9011-050e38972322	-6.887792072886983,107.61864850401672	2026-07-06 23:00:00
ba328487-f840-4cca-86bf-26723fd08df5	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.98	3.15	Kg	30.91	1ea72845-6112-4c97-a8a0-5b3b8b889e5d	-6.887792072886983,107.61864850401672	2026-07-01 00:00:00
273e2b41-7fb2-4229-bd0d-1cc4b2999d89	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.88	1.12	Kg	14.82	5c33d7e9-48d4-4461-9011-050e38972322	-6.887792072886983,107.61864850401672	2026-06-20 00:00:00
e29863e7-70ec-43df-9766-1c1f2f4bcd94	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.82	3.99	Kg	32.56	1ea72845-6112-4c97-a8a0-5b3b8b889e5d	-6.887792072886983,107.61864850401672	2026-06-29 23:00:00
c239c3ec-ca09-4905-b0aa-c2046c803cba	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.87	2.03	Kg	17.72	1ea72845-6112-4c97-a8a0-5b3b8b889e5d	-6.887792072886983,107.61864850401672	2026-06-09 00:00:00
0be07229-6903-427c-8380-e464accd716d	d32557cf-a420-438e-8d42-c8b3d35ecb08	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.82	2.10	Kg	17.33	6507a0bd-15ab-4446-bcd0-aab0bd57645b	-6.887175831552246,107.61845036779773	2026-07-05 00:00:00
416f579c-1f65-45d3-abb4-3c93ffa2629b	d32557cf-a420-438e-8d42-c8b3d35ecb08	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.90	2.97	Kg	26.74	6507a0bd-15ab-4446-bcd0-aab0bd57645b	-6.887175831552246,107.61845036779773	2026-07-12 00:00:00
9d95b5f8-4cce-4a4b-b4fd-62a06c0ae79b	d32557cf-a420-438e-8d42-c8b3d35ecb08	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.90	1.49	Kg	13.45	6507a0bd-15ab-4446-bcd0-aab0bd57645b	-6.887175831552246,107.61845036779773	2026-07-16 23:00:00
2f6987de-f907-4cde-99d7-af798bc4de9a	d32557cf-a420-438e-8d42-c8b3d35ecb08	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.94	1.90	Kg	17.81	6507a0bd-15ab-4446-bcd0-aab0bd57645b	-6.887175831552246,107.61845036779773	2026-07-02 09:00:00
f265a677-4e58-42db-916f-c12d9ad19753	d32557cf-a420-438e-8d42-c8b3d35ecb08	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.90	2.47	Kg	33.35	57cb8903-d531-42a0-a736-46497d2d16e5	-6.887175831552246,107.61845036779773	2026-06-06 10:00:00
212a2dde-6826-40e2-8aa9-c840795e4999	d32557cf-a420-438e-8d42-c8b3d35ecb08	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.96	2.55	Kg	36.86	57cb8903-d531-42a0-a736-46497d2d16e5	-6.887175831552246,107.61845036779773	2026-06-05 10:00:00
178768a4-51f3-412b-83f9-730293c9df84	d32557cf-a420-438e-8d42-c8b3d35ecb08	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.87	2.02	Kg	26.20	57cb8903-d531-42a0-a736-46497d2d16e5	-6.887175831552246,107.61845036779773	2026-07-16 23:00:00
794b356a-0ea8-43f2-be82-7e76e26427d8	d32557cf-a420-438e-8d42-c8b3d35ecb08	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.96	1.14	Kg	16.53	57cb8903-d531-42a0-a736-46497d2d16e5	-6.887175831552246,107.61845036779773	2026-06-05 23:00:00
ec66626a-61f5-4fd0-a5bb-476584aa5419	d32557cf-a420-438e-8d42-c8b3d35ecb08	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.92	3.50	Kg	32.31	6507a0bd-15ab-4446-bcd0-aab0bd57645b	-6.887175831552246,107.61845036779773	2026-07-26 23:00:00
cd8c8bf2-d4b5-42c8-ba47-84cf12a62300	d32557cf-a420-438e-8d42-c8b3d35ecb08	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.93	2.62	Kg	24.52	6507a0bd-15ab-4446-bcd0-aab0bd57645b	-6.887175831552246,107.61845036779773	2026-06-06 10:00:00
ad2f231c-2712-40b5-a69f-35d38a5a0cfc	d32557cf-a420-438e-8d42-c8b3d35ecb08	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.94	3.05	Kg	42.85	57cb8903-d531-42a0-a736-46497d2d16e5	-6.887175831552246,107.61845036779773	2026-06-15 23:00:00
500f9c2f-2cf4-4fb5-8498-b9b2ec6abdf2	514e074f-d89a-4380-87d8-e91aef8ec350	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.87	1.94	Kg	25.41	e5af4aed-5ff3-4dfd-abbd-737558bfda94	-6.8877069488657545,107.6170030742918	2026-06-01 09:00:00
af7bde3c-fd0f-4efb-a787-84d192452e6e	514e074f-d89a-4380-87d8-e91aef8ec350	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.93	2.20	Kg	20.54	ae2f55c1-7295-4f60-99b2-0100b560120d	-6.8877069488657545,107.6170030742918	2026-06-09 23:00:00
20c13ff8-2c61-4e20-a6cf-17147e4afabd	514e074f-d89a-4380-87d8-e91aef8ec350	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.99	1.49	Kg	22.13	e5af4aed-5ff3-4dfd-abbd-737558bfda94	-6.8877069488657545,107.6170030742918	2026-07-27 09:00:00
16d95d04-f811-40ca-9e8c-b119a0e8d114	514e074f-d89a-4380-87d8-e91aef8ec350	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.81	1.49	Kg	11.99	ae2f55c1-7295-4f60-99b2-0100b560120d	-6.8877069488657545,107.6170030742918	2026-06-22 09:00:00
b292237f-478d-4905-9dbb-2fa1a301db9e	514e074f-d89a-4380-87d8-e91aef8ec350	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.80	2.69	Kg	32.33	e5af4aed-5ff3-4dfd-abbd-737558bfda94	-6.8877069488657545,107.6170030742918	2026-06-28 10:00:00
ba6b514a-7100-4c11-8311-79e504a1e8cb	514e074f-d89a-4380-87d8-e91aef8ec350	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.80	3.29	Kg	26.36	ae2f55c1-7295-4f60-99b2-0100b560120d	-6.8877069488657545,107.6170030742918	2026-07-01 09:00:00
ca696427-ed9c-4844-a1f6-9e44d7207c74	514e074f-d89a-4380-87d8-e91aef8ec350	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.98	2.08	Kg	20.46	ae2f55c1-7295-4f60-99b2-0100b560120d	-6.8877069488657545,107.6170030742918	2026-07-18 00:00:00
c9b5eb55-4656-4c6d-be6c-bd0a0e81bc3f	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.90	1.49	Kg	13.32	1fb3cdc4-3a21-407a-9fb1-b997863a4bb1	-6.887215820333147,107.6171408056027	2026-06-27 23:00:00
13252472-7ef9-42d3-86a9-97d59fe29572	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.82	1.91	Kg	15.66	1fb3cdc4-3a21-407a-9fb1-b997863a4bb1	-6.887215820333147,107.6171408056027	2026-07-18 23:00:00
83277399-1812-4bb3-b14b-9361b3803366	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.97	3.34	Kg	32.46	1fb3cdc4-3a21-407a-9fb1-b997863a4bb1	-6.887215820333147,107.6171408056027	2026-06-19 23:00:00
096a17e3-f445-41ee-a787-d28118dcf003	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.99	3.80	Kg	56.31	6445dea2-fca2-4c3e-ad7f-fafec52ca80b	-6.887215820333147,107.6171408056027	2026-07-04 23:00:00
a4c75fe6-a562-4ea0-92ee-c8b05545c305	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.87	1.73	Kg	22.55	6445dea2-fca2-4c3e-ad7f-fafec52ca80b	-6.887215820333147,107.6171408056027	2026-07-05 10:00:00
75aff11c-973e-4614-98e9-84a78a5b3e2f	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.94	3.06	Kg	28.87	1fb3cdc4-3a21-407a-9fb1-b997863a4bb1	-6.887215820333147,107.6171408056027	2026-07-07 09:00:00
e10c6db3-5eb0-4ae2-bd91-e7b6bf712caa	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.99	3.48	Kg	34.39	1fb3cdc4-3a21-407a-9fb1-b997863a4bb1	-6.887215820333147,107.6171408056027	2026-07-26 09:00:00
68c746d0-761f-4cd4-9482-6d5d995ed484	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.81	1.83	Kg	22.14	6445dea2-fca2-4c3e-ad7f-fafec52ca80b	-6.887215820333147,107.6171408056027	2026-06-17 10:00:00
99266ded-9415-4aee-82a3-6a98d89838f9	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.98	2.00	Kg	29.41	6445dea2-fca2-4c3e-ad7f-fafec52ca80b	-6.887215820333147,107.6171408056027	2026-06-13 23:00:00
173fec99-12d9-48b2-a989-d1221f218d0b	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.89	1.66	Kg	14.72	1fb3cdc4-3a21-407a-9fb1-b997863a4bb1	-6.887215820333147,107.6171408056027	2026-07-23 00:00:00
9f66325c-13c7-42a2-92d2-c7a8e8844dc6	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.95	1.17	Kg	11.08	1fb3cdc4-3a21-407a-9fb1-b997863a4bb1	-6.887215820333147,107.6171408056027	2026-07-17 00:00:00
c2d8290d-75e3-423f-9f97-2be3dbc6874e	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.95	1.41	Kg	13.35	3c372260-c622-4c12-b425-95eae4c05922	-6.891474111156844,107.61462258169634	2026-06-04 00:00:00
01fb05df-c3dd-41ee-8d28-8ddfd0f9660a	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.95	2.42	Kg	34.38	e2be8014-3670-4bd2-b325-e4ef3e76d281	-6.891474111156844,107.61462258169634	2026-06-02 23:00:00
2a99f132-c864-434f-acab-371674a24549	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.82	2.83	Kg	35.07	e2be8014-3670-4bd2-b325-e4ef3e76d281	-6.891474111156844,107.61462258169634	2026-06-27 10:00:00
69d88678-196c-4218-9977-daf88b7e79f0	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.87	1.69	Kg	22.21	e2be8014-3670-4bd2-b325-e4ef3e76d281	-6.891474111156844,107.61462258169634	2026-07-23 23:00:00
79917389-0607-406b-a40d-537c4205d0a6	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.92	2.15	Kg	29.77	e2be8014-3670-4bd2-b325-e4ef3e76d281	-6.891474111156844,107.61462258169634	2026-07-25 10:00:00
dd6f0b0c-df73-48ea-a475-01e9c1baa351	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.85	3.26	Kg	41.45	e2be8014-3670-4bd2-b325-e4ef3e76d281	-6.891474111156844,107.61462258169634	2026-07-10 10:00:00
48574b79-1d6b-4fe1-aeef-024c80449dc5	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.86	1.43	Kg	18.46	e2be8014-3670-4bd2-b325-e4ef3e76d281	-6.891474111156844,107.61462258169634	2026-07-18 10:00:00
9444d1bb-29d4-439d-b0ff-7dd33f1e203c	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.88	2.62	Kg	34.52	e2be8014-3670-4bd2-b325-e4ef3e76d281	-6.891474111156844,107.61462258169634	2026-07-07 00:00:00
f6d2d58a-54db-4ecb-9d26-361f33317fa5	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.88	1.07	Kg	14.10	e2be8014-3670-4bd2-b325-e4ef3e76d281	-6.891474111156844,107.61462258169634	2026-06-11 00:00:00
32d47a5f-4eb0-4cd9-bb95-3ddfc5f21609	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.88	1.35	Kg	17.92	e2be8014-3670-4bd2-b325-e4ef3e76d281	-6.891474111156844,107.61462258169634	2026-06-07 00:00:00
2eb61b28-ef3c-46b5-9596-f35fee0cb2fc	e77f0e98-184a-411a-ae09-c5393acbc976	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.99	3.77	Kg	55.75	e3701a8f-2e79-4d7e-919b-7d3bb6daefd6	-6.890671781129625,107.61658384195653	2026-07-18 00:00:00
76e7f30c-53e4-4dfd-b92b-18439f7a5f3d	e77f0e98-184a-411a-ae09-c5393acbc976	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.95	1.23	Kg	17.64	e3701a8f-2e79-4d7e-919b-7d3bb6daefd6	-6.890671781129625,107.61658384195653	2026-07-26 23:00:00
b643ebb6-c28a-425a-9269-08ad90488d78	e77f0e98-184a-411a-ae09-c5393acbc976	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.93	3.22	Kg	29.80	46783889-8d33-4e65-a2d9-f078b6718b66	-6.890671781129625,107.61658384195653	2026-07-04 10:00:00
be2f51f6-21ce-4518-83d5-2ec4fdf1457c	e77f0e98-184a-411a-ae09-c5393acbc976	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.99	1.81	Kg	17.84	46783889-8d33-4e65-a2d9-f078b6718b66	-6.890671781129625,107.61658384195653	2026-07-24 23:00:00
3e1d4200-d9e9-40cb-be99-e86cbe8a5b7b	e77f0e98-184a-411a-ae09-c5393acbc976	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.97	2.62	Kg	25.31	46783889-8d33-4e65-a2d9-f078b6718b66	-6.890671781129625,107.61658384195653	2026-07-19 09:00:00
20473fa3-4448-4bcd-9cc5-8b98a3e60f18	e77f0e98-184a-411a-ae09-c5393acbc976	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.85	2.06	Kg	26.30	e3701a8f-2e79-4d7e-919b-7d3bb6daefd6	-6.890671781129625,107.61658384195653	2026-07-24 23:00:00
8db54de2-21a5-4885-96e3-945c71b2a55e	e77f0e98-184a-411a-ae09-c5393acbc976	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.91	3.50	Kg	31.95	46783889-8d33-4e65-a2d9-f078b6718b66	-6.890671781129625,107.61658384195653	2026-07-19 23:00:00
a7865470-9166-480d-9e58-c23ee09d7fc4	e77f0e98-184a-411a-ae09-c5393acbc976	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.87	3.30	Kg	43.22	e3701a8f-2e79-4d7e-919b-7d3bb6daefd6	-6.890671781129625,107.61658384195653	2026-06-12 00:00:00
51f317d9-1e0e-4c70-bcd4-d29bbcd64f18	e77f0e98-184a-411a-ae09-c5393acbc976	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.86	1.37	Kg	11.88	46783889-8d33-4e65-a2d9-f078b6718b66	-6.890671781129625,107.61658384195653	2026-07-01 09:00:00
7416f20b-51bf-442e-8ca8-334e87756e83	e77f0e98-184a-411a-ae09-c5393acbc976	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.85	1.36	Kg	11.52	46783889-8d33-4e65-a2d9-f078b6718b66	-6.890671781129625,107.61658384195653	2026-06-18 10:00:00
18431678-8bba-4275-8272-44e9d6d87b52	e77f0e98-184a-411a-ae09-c5393acbc976	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.85	3.36	Kg	43.01	e3701a8f-2e79-4d7e-919b-7d3bb6daefd6	-6.890671781129625,107.61658384195653	2026-06-25 09:00:00
b58f03c2-467a-414a-a98d-daa01d900f61	1cfba3ed-a354-4232-8d05-a35df134e95b	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.93	3.31	Kg	30.59	e5b676e1-cc37-4a31-94b6-31bc79eba6d2	-6.8926629435184505,107.61491203066218	2026-06-16 00:00:00
e3b5db0b-487e-47ec-9d9f-32c54ff31ed9	1cfba3ed-a354-4232-8d05-a35df134e95b	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.83	2.48	Kg	31.05	f33fa756-0a88-47b9-8576-a42b82cfff33	-6.8926629435184505,107.61491203066218	2026-06-03 23:00:00
d78504c3-d0e0-4a9c-ade9-5513b92ca8b9	1cfba3ed-a354-4232-8d05-a35df134e95b	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.85	1.22	Kg	15.61	f33fa756-0a88-47b9-8576-a42b82cfff33	-6.8926629435184505,107.61491203066218	2026-07-02 09:00:00
12f1bdd2-3c94-400e-8317-3a195e70088d	1cfba3ed-a354-4232-8d05-a35df134e95b	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.82	3.25	Kg	39.88	f33fa756-0a88-47b9-8576-a42b82cfff33	-6.8926629435184505,107.61491203066218	2026-06-21 23:00:00
b1371612-7827-4bae-b275-73da45831af8	1cfba3ed-a354-4232-8d05-a35df134e95b	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.93	1.15	Kg	10.68	e5b676e1-cc37-4a31-94b6-31bc79eba6d2	-6.8926629435184505,107.61491203066218	2026-07-27 10:00:00
35141cc4-bd09-447c-a7ba-ae014b71b7bd	1cfba3ed-a354-4232-8d05-a35df134e95b	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.90	1.52	Kg	20.65	f33fa756-0a88-47b9-8576-a42b82cfff33	-6.8926629435184505,107.61491203066218	2026-06-28 23:00:00
ff154ec0-a8d2-49e9-86ff-cbe5efe0dea2	1cfba3ed-a354-4232-8d05-a35df134e95b	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.88	2.91	Kg	38.30	f33fa756-0a88-47b9-8576-a42b82cfff33	-6.8926629435184505,107.61491203066218	2026-06-09 09:00:00
8775cb4a-ae5b-4dc3-839c-60f46da65b30	1cfba3ed-a354-4232-8d05-a35df134e95b	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.99	2.02	Kg	29.92	f33fa756-0a88-47b9-8576-a42b82cfff33	-6.8926629435184505,107.61491203066218	2026-07-01 09:00:00
85787d6d-8971-4dea-9660-f02b5f133541	1cfba3ed-a354-4232-8d05-a35df134e95b	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.83	2.29	Kg	28.37	f33fa756-0a88-47b9-8576-a42b82cfff33	-6.8926629435184505,107.61491203066218	2026-07-16 09:00:00
a9992c07-b8a7-489e-982e-858b60715d33	ae934d2f-e7ae-4471-ab73-6388951d3c2b	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.86	3.78	Kg	32.64	eba0cbd6-e483-4139-8e99-33b29ee4060a	-6.891804824422928,107.61549645164102	2026-06-21 00:00:00
23d6f36e-4f44-4be7-b05e-46436428c93f	ae934d2f-e7ae-4471-ab73-6388951d3c2b	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.81	1.63	Kg	13.18	eba0cbd6-e483-4139-8e99-33b29ee4060a	-6.891804824422928,107.61549645164102	2026-07-06 10:00:00
57b68391-f367-4218-811f-63e17809bf33	ae934d2f-e7ae-4471-ab73-6388951d3c2b	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.87	1.54	Kg	20.12	c0db6469-ce22-4ee1-92df-b00211444150	-6.891804824422928,107.61549645164102	2026-07-22 23:00:00
a71cd5e6-5624-4b63-ab5c-6716eccd45bb	ae934d2f-e7ae-4471-ab73-6388951d3c2b	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.84	2.28	Kg	19.05	eba0cbd6-e483-4139-8e99-33b29ee4060a	-6.891804824422928,107.61549645164102	2026-06-18 09:00:00
4b8c9f35-2313-42e0-929b-15f7f71a30c1	ae934d2f-e7ae-4471-ab73-6388951d3c2b	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.87	3.26	Kg	42.50	c0db6469-ce22-4ee1-92df-b00211444150	-6.891804824422928,107.61549645164102	2026-06-19 23:00:00
f31a9d19-f1ba-465a-9674-2bd7d0faddba	ae934d2f-e7ae-4471-ab73-6388951d3c2b	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.81	1.32	Kg	16.04	c0db6469-ce22-4ee1-92df-b00211444150	-6.891804824422928,107.61549645164102	2026-07-07 23:00:00
b3375ee2-8e82-4e11-a3b1-aef8fe38b6f8	ae934d2f-e7ae-4471-ab73-6388951d3c2b	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.89	1.28	Kg	11.37	eba0cbd6-e483-4139-8e99-33b29ee4060a	-6.891804824422928,107.61549645164102	2026-07-13 10:00:00
6b5a649b-4507-41f9-8e04-06fff7e2f5de	ae934d2f-e7ae-4471-ab73-6388951d3c2b	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.89	2.36	Kg	31.39	c0db6469-ce22-4ee1-92df-b00211444150	-6.891804824422928,107.61549645164102	2026-07-05 09:00:00
3b3609ca-0e64-4130-b116-e2f1ca93397f	ae934d2f-e7ae-4471-ab73-6388951d3c2b	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.86	1.22	Kg	15.81	c0db6469-ce22-4ee1-92df-b00211444150	-6.891804824422928,107.61549645164102	2026-06-16 10:00:00
dbed7a88-6dd3-49bc-816d-34eaa489e2a8	ae934d2f-e7ae-4471-ab73-6388951d3c2b	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.93	2.48	Kg	34.60	c0db6469-ce22-4ee1-92df-b00211444150	-6.891804824422928,107.61549645164102	2026-07-21 10:00:00
eb8a0322-aa27-4188-8ac8-42bbe1bb2267	ae934d2f-e7ae-4471-ab73-6388951d3c2b	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.96	3.66	Kg	35.12	eba0cbd6-e483-4139-8e99-33b29ee4060a	-6.891804824422928,107.61549645164102	2026-06-01 09:00:00
e364fd75-e4ec-4815-aef7-e91db3330c2d	13a8cc8d-80ad-4559-a301-ea7a8481f621	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.97	3.71	Kg	53.91	877bb8c5-c426-47d2-8b3d-f20ade5f2847	-6.892318684799396,107.6151156832422	2026-07-12 23:00:00
9b63f7a5-1306-400d-8c08-eeed3c32fe65	13a8cc8d-80ad-4559-a301-ea7a8481f621	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.90	2.62	Kg	35.27	877bb8c5-c426-47d2-8b3d-f20ade5f2847	-6.892318684799396,107.6151156832422	2026-07-09 23:00:00
2e5fde54-1923-47d0-835f-be75bf0cda42	13a8cc8d-80ad-4559-a301-ea7a8481f621	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.84	3.80	Kg	31.87	24ecb846-7edf-4a1e-8be8-c84c94135c86	-6.892318684799396,107.6151156832422	2026-07-02 23:00:00
c8fb8bb1-2fb0-4d25-bcda-1826e49d0d51	13a8cc8d-80ad-4559-a301-ea7a8481f621	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.84	2.97	Kg	24.85	24ecb846-7edf-4a1e-8be8-c84c94135c86	-6.892318684799396,107.6151156832422	2026-07-26 10:00:00
5961a4fd-8946-4577-bfb4-567b4596b1a3	13a8cc8d-80ad-4559-a301-ea7a8481f621	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.81	2.75	Kg	33.28	877bb8c5-c426-47d2-8b3d-f20ade5f2847	-6.892318684799396,107.6151156832422	2026-07-18 00:00:00
8ff5d3c6-15d5-47c6-a98a-3132ab505b26	13a8cc8d-80ad-4559-a301-ea7a8481f621	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.88	2.64	Kg	34.95	877bb8c5-c426-47d2-8b3d-f20ade5f2847	-6.892318684799396,107.6151156832422	2026-06-26 10:00:00
14ff6daf-4950-4107-bea9-43fef3afa92e	13a8cc8d-80ad-4559-a301-ea7a8481f621	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.89	3.63	Kg	48.45	877bb8c5-c426-47d2-8b3d-f20ade5f2847	-6.892318684799396,107.6151156832422	2026-06-14 23:00:00
d8c8e3f9-7024-44d6-8a45-a71d93210e72	13a8cc8d-80ad-4559-a301-ea7a8481f621	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.96	1.28	Kg	18.51	877bb8c5-c426-47d2-8b3d-f20ade5f2847	-6.892318684799396,107.6151156832422	2026-06-20 23:00:00
4463d1ce-659a-4806-95a3-aa22a23ec4c5	13a8cc8d-80ad-4559-a301-ea7a8481f621	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.89	2.94	Kg	39.33	877bb8c5-c426-47d2-8b3d-f20ade5f2847	-6.892318684799396,107.6151156832422	2026-05-30 23:00:00
17924400-4147-415d-adac-6f17e5faa844	13a8cc8d-80ad-4559-a301-ea7a8481f621	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.91	2.29	Kg	20.79	24ecb846-7edf-4a1e-8be8-c84c94135c86	-6.892318684799396,107.6151156832422	2026-06-03 23:00:00
ca752b7f-aeea-4409-94dd-da496858b8c6	13a8cc8d-80ad-4559-a301-ea7a8481f621	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.95	3.86	Kg	55.06	877bb8c5-c426-47d2-8b3d-f20ade5f2847	-6.892318684799396,107.6151156832422	2026-06-10 09:00:00
25b3c85d-0045-443f-986d-39be48716aa0	13a8cc8d-80ad-4559-a301-ea7a8481f621	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.84	1.52	Kg	19.10	877bb8c5-c426-47d2-8b3d-f20ade5f2847	-6.892318684799396,107.6151156832422	2026-06-08 00:00:00
a3376430-585e-4d1c-9c64-c50c6b4f430b	b8e9385a-6ed1-41b8-8b74-55123baa568a	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.97	2.21	Kg	21.38	d2a33ef1-d17a-4036-ab67-55aee74495df	-6.890355573143833,107.61371109525727	2026-07-23 09:00:00
f2762507-4659-42dc-aa9f-fe53e4f920b9	b8e9385a-6ed1-41b8-8b74-55123baa568a	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.98	1.24	Kg	12.15	d2a33ef1-d17a-4036-ab67-55aee74495df	-6.890355573143833,107.61371109525727	2026-06-05 09:00:00
faf3ed59-30df-426f-8abe-769f7831412f	b8e9385a-6ed1-41b8-8b74-55123baa568a	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.82	2.23	Kg	27.63	f449a51d-aadd-4b54-9836-d1da00ec3bfa	-6.890355573143833,107.61371109525727	2026-07-08 10:00:00
9ed98ac4-0d62-46d4-9284-228128ce4c42	b8e9385a-6ed1-41b8-8b74-55123baa568a	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.84	2.34	Kg	29.56	f449a51d-aadd-4b54-9836-d1da00ec3bfa	-6.890355573143833,107.61371109525727	2026-06-15 09:00:00
65b3e262-7de6-4087-8265-fec9a8e90171	b8e9385a-6ed1-41b8-8b74-55123baa568a	https://dummyimage.com/600x400/000/fff&text=anorganik	anorganik	0.94	1.52	Kg	21.47	f449a51d-aadd-4b54-9836-d1da00ec3bfa	-6.890355573143833,107.61371109525727	2026-06-25 23:00:00
d3731e3a-9dc1-435b-86f0-ade04893a0a4	b8e9385a-6ed1-41b8-8b74-55123baa568a	https://dummyimage.com/600x400/000/fff&text=organik	organik	0.87	2.57	Kg	22.50	d2a33ef1-d17a-4036-ab67-55aee74495df	-6.890355573143833,107.61371109525727	2026-06-30 23:00:00
\.


--
-- Data for Name: token_penyegar; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.token_penyegar (id, id_pengguna, token, kedaluwarsa_pada, dibuat_pada) FROM stdin;
8f974973-d304-4ed0-b1fa-b9277bf9f1fd	e29ea3d7-5144-4f18-b798-893c5f508119	2556d871-0928-4005-b159-5f12c979bb46	2026-08-05 03:59:06.807	2026-07-29 03:59:06.814
9133cb8c-94ee-414c-b0ce-2bf582d7c851	b1b3eb39-61c3-4a98-b480-48241bd302b3	0214e034-80d7-4976-b9fc-59b6f6d999b2	2026-08-05 03:59:25.838	2026-07-29 03:59:25.84
\.


--
-- Data for Name: tong_sampah; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.tong_sampah (id, kode_qr, id_kategori, maks_kapasitas_liter, volume_sekarang_liter, id_rt_rw, id_kelurahan, dibuat_pada, diperbarui_pada, latitude, longitude, id_gelombang_qr, status, id_pengguna, bentuk, diameter, id_mahasiswa_pendaftar, lebar, panjang, tinggi, tipe_wadah) FROM stdin;
6f152d2a-7a7a-4209-a872-aeb0eb6fcbad	ANORG00322026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	22.12	8	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:10.332	2026-07-29 04:54:10.332	-6.88370895	107.61639500	\N	ACTIVE_BOUND	54e9694d-7492-4543-9fe9-8fd7f4f5c921	\N	\N	\N	\N	\N	\N	\N
ceea01d3-8cfa-4cdd-9a47-35b475c5b844	ORG00332026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	11.98	8	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:10.458	2026-07-29 04:54:10.458	-6.88454046	107.61776358	\N	ACTIVE_BOUND	2a07a787-3e37-41c1-a052-ab2fea01f2d7	\N	\N	\N	\N	\N	\N	\N
82a26307-a23e-4810-b6e7-f68a10f9a516	ANORG00342026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	3.41	8	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:10.464	2026-07-29 04:54:10.464	-6.88454046	107.61776358	\N	ACTIVE_BOUND	2a07a787-3e37-41c1-a052-ab2fea01f2d7	\N	\N	\N	\N	\N	\N	\N
948309dd-baf9-4fc3-9373-100ab05af27d	ORG00352026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	15.67	8	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:10.62	2026-07-29 04:54:10.62	-6.88466010	107.61669869	\N	ACTIVE_BOUND	f2edfdc0-029b-46db-8710-968c19475c2e	\N	\N	\N	\N	\N	\N	\N
7945ff70-a80e-4a31-b373-f0a2253e0500	ANORG00362026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	3.39	8	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:10.625	2026-07-29 04:54:10.625	-6.88466010	107.61669869	\N	ACTIVE_BOUND	f2edfdc0-029b-46db-8710-968c19475c2e	\N	\N	\N	\N	\N	\N	\N
b1f021cf-5373-4569-878c-0057b6d81cdc	ORG00372026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	9.29	9	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:10.78	2026-07-29 04:54:10.78	-6.88698161	107.61644111	\N	ACTIVE_BOUND	b0a65787-bac6-4fec-87ef-24db782044bd	\N	\N	\N	\N	\N	\N	\N
7f97eb37-66c1-4c5c-a952-a3f8eaee4bac	ANORG00382026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	10.09	9	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:10.786	2026-07-29 04:54:10.786	-6.88698161	107.61644111	\N	ACTIVE_BOUND	b0a65787-bac6-4fec-87ef-24db782044bd	\N	\N	\N	\N	\N	\N	\N
3fdd6981-b8c1-415b-a4f0-160353e8b486	ORG00392026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	13.56	9	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:10.961	2026-07-29 04:54:10.961	-6.88584853	107.61753474	\N	ACTIVE_BOUND	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	\N	\N	\N	\N	\N	\N	\N
6ca3091a-5143-44d5-96d3-ce8aac8829d5	ANORG00402026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	15.62	9	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:10.967	2026-07-29 04:54:10.967	-6.88584853	107.61753474	\N	ACTIVE_BOUND	8ddb042e-654f-4bc6-bbf5-2901a8b86b6f	\N	\N	\N	\N	\N	\N	\N
1ea72845-6112-4c97-a8a0-5b3b8b889e5d	ORG00412026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	12.19	9	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:11.171	2026-07-29 04:54:11.171	-6.88779207	107.61864850	\N	ACTIVE_BOUND	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	\N	\N	\N	\N	\N	\N	\N
5c33d7e9-48d4-4461-9011-050e38972322	ANORG00422026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	1.47	9	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:11.178	2026-07-29 04:54:11.178	-6.88779207	107.61864850	\N	ACTIVE_BOUND	3cfdcc3f-aa06-4386-8d31-293f3913d7e5	\N	\N	\N	\N	\N	\N	\N
6507a0bd-15ab-4446-bcd0-aab0bd57645b	ORG00432026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	19.81	10	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:11.397	2026-07-29 04:54:11.397	-6.88717583	107.61845037	\N	ACTIVE_BOUND	d32557cf-a420-438e-8d42-c8b3d35ecb08	\N	\N	\N	\N	\N	\N	\N
57cb8903-d531-42a0-a736-46497d2d16e5	ANORG00442026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	7.05	10	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:11.403	2026-07-29 04:54:11.403	-6.88717583	107.61845037	\N	ACTIVE_BOUND	d32557cf-a420-438e-8d42-c8b3d35ecb08	\N	\N	\N	\N	\N	\N	\N
ae2f55c1-7295-4f60-99b2-0100b560120d	ORG00452026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	12.63	10	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:11.604	2026-07-29 04:54:11.604	-6.88770695	107.61700307	\N	ACTIVE_BOUND	514e074f-d89a-4380-87d8-e91aef8ec350	\N	\N	\N	\N	\N	\N	\N
e5af4aed-5ff3-4dfd-abbd-737558bfda94	ANORG00462026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	7.07	10	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:11.61	2026-07-29 04:54:11.61	-6.88770695	107.61700307	\N	ACTIVE_BOUND	514e074f-d89a-4380-87d8-e91aef8ec350	\N	\N	\N	\N	\N	\N	\N
1fb3cdc4-3a21-407a-9fb1-b997863a4bb1	ORG00472026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	13.68	10	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:11.738	2026-07-29 04:54:11.738	-6.88721582	107.61714081	\N	ACTIVE_BOUND	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	\N	\N	\N	\N	\N	\N	\N
6445dea2-fca2-4c3e-ad7f-fafec52ca80b	ANORG00482026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	6.81	10	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:11.744	2026-07-29 04:54:11.744	-6.88721582	107.61714081	\N	ACTIVE_BOUND	ad5acbe2-ff4d-41e5-8cdd-d3d146dda2f7	\N	\N	\N	\N	\N	\N	\N
3c372260-c622-4c12-b425-95eae4c05922	ORG00492026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	17.81	11	b8e7fa19-03fa-4a5c-989d-f9b07cb5898a	2026-07-29 04:54:11.943	2026-07-29 04:54:11.943	-6.89147411	107.61462258	\N	ACTIVE_BOUND	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	\N	\N	\N	\N	\N	\N	\N
e2be8014-3670-4bd2-b325-e4ef3e76d281	ANORG00502026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	10.03	11	b8e7fa19-03fa-4a5c-989d-f9b07cb5898a	2026-07-29 04:54:11.949	2026-07-29 04:54:11.949	-6.89147411	107.61462258	\N	ACTIVE_BOUND	3f35f06b-a435-44a2-9ce1-ce4fc2852c23	\N	\N	\N	\N	\N	\N	\N
46783889-8d33-4e65-a2d9-f078b6718b66	ORG00512026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	12.74	11	b8e7fa19-03fa-4a5c-989d-f9b07cb5898a	2026-07-29 04:54:12.139	2026-07-29 04:54:12.139	-6.89067178	107.61658384	\N	ACTIVE_BOUND	e77f0e98-184a-411a-ae09-c5393acbc976	\N	\N	\N	\N	\N	\N	\N
e3701a8f-2e79-4d7e-919b-7d3bb6daefd6	ANORG00522026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	17.54	11	b8e7fa19-03fa-4a5c-989d-f9b07cb5898a	2026-07-29 04:54:12.146	2026-07-29 04:54:12.146	-6.89067178	107.61658384	\N	ACTIVE_BOUND	e77f0e98-184a-411a-ae09-c5393acbc976	\N	\N	\N	\N	\N	\N	\N
e5b676e1-cc37-4a31-94b6-31bc79eba6d2	ORG00532026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	2.17	11	b8e7fa19-03fa-4a5c-989d-f9b07cb5898a	2026-07-29 04:54:12.353	2026-07-29 04:54:12.353	-6.89266294	107.61491203	\N	ACTIVE_BOUND	1cfba3ed-a354-4232-8d05-a35df134e95b	\N	\N	\N	\N	\N	\N	\N
f33fa756-0a88-47b9-8576-a42b82cfff33	ANORG00542026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	21.47	11	b8e7fa19-03fa-4a5c-989d-f9b07cb5898a	2026-07-29 04:54:12.359	2026-07-29 04:54:12.359	-6.89266294	107.61491203	\N	ACTIVE_BOUND	1cfba3ed-a354-4232-8d05-a35df134e95b	\N	\N	\N	\N	\N	\N	\N
eba0cbd6-e483-4139-8e99-33b29ee4060a	ORG00552026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	16.99	12	b8e7fa19-03fa-4a5c-989d-f9b07cb5898a	2026-07-29 04:54:12.533	2026-07-29 04:54:12.533	-6.89180482	107.61549645	\N	ACTIVE_BOUND	ae934d2f-e7ae-4471-ab73-6388951d3c2b	\N	\N	\N	\N	\N	\N	\N
c0db6469-ce22-4ee1-92df-b00211444150	ANORG00562026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	17.04	12	b8e7fa19-03fa-4a5c-989d-f9b07cb5898a	2026-07-29 04:54:12.54	2026-07-29 04:54:12.54	-6.89180482	107.61549645	\N	ACTIVE_BOUND	ae934d2f-e7ae-4471-ab73-6388951d3c2b	\N	\N	\N	\N	\N	\N	\N
24ecb846-7edf-4a1e-8be8-c84c94135c86	ORG00572026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	8.28	12	b8e7fa19-03fa-4a5c-989d-f9b07cb5898a	2026-07-29 04:54:12.743	2026-07-29 04:54:12.743	-6.89231868	107.61511568	\N	ACTIVE_BOUND	13a8cc8d-80ad-4559-a301-ea7a8481f621	\N	\N	\N	\N	\N	\N	\N
877bb8c5-c426-47d2-8b3d-f20ade5f2847	ANORG00582026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	18.24	12	b8e7fa19-03fa-4a5c-989d-f9b07cb5898a	2026-07-29 04:54:12.751	2026-07-29 04:54:12.751	-6.89231868	107.61511568	\N	ACTIVE_BOUND	13a8cc8d-80ad-4559-a301-ea7a8481f621	\N	\N	\N	\N	\N	\N	\N
d2a33ef1-d17a-4036-ab67-55aee74495df	ORG00592026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	17.15	12	b8e7fa19-03fa-4a5c-989d-f9b07cb5898a	2026-07-29 04:54:12.984	2026-07-29 04:54:12.984	-6.89035557	107.61371110	\N	ACTIVE_BOUND	b8e9385a-6ed1-41b8-8b74-55123baa568a	\N	\N	\N	\N	\N	\N	\N
f449a51d-aadd-4b54-9836-d1da00ec3bfa	ANORG00602026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	22.17	12	b8e7fa19-03fa-4a5c-989d-f9b07cb5898a	2026-07-29 04:54:12.991	2026-07-29 04:54:12.991	-6.89035557	107.61371110	\N	ACTIVE_BOUND	b8e9385a-6ed1-41b8-8b74-55123baa568a	\N	\N	\N	\N	\N	\N	\N
1b81d232-309e-4ed9-86ef-c2ba475a427a	ORG00012026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	9.90	3	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:07.962	2026-07-29 04:54:07.962	-6.87084020	107.62466477	\N	ACTIVE_BOUND	2be71aba-1bf7-411e-b539-076e033dbc50	\N	\N	\N	\N	\N	\N	\N
0bbcdb10-0ce5-4e5b-89d7-808cefa2a1ef	ANORG00022026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	17.25	3	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:07.975	2026-07-29 04:54:07.975	-6.87084020	107.62466477	\N	ACTIVE_BOUND	2be71aba-1bf7-411e-b539-076e033dbc50	\N	\N	\N	\N	\N	\N	\N
e8b10e67-ce5b-49a6-b8c7-9497fbb1ae97	ORG00032026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	1.69	3	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:08.258	2026-07-29 04:54:08.258	-6.86878672	107.62726526	\N	ACTIVE_BOUND	67996a97-6f02-47b0-8218-cb7760d5c9e4	\N	\N	\N	\N	\N	\N	\N
d71c52eb-80e0-4ed9-be66-a9d3001c6d18	ANORG00042026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	9.01	3	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:08.265	2026-07-29 04:54:08.265	-6.86878672	107.62726526	\N	ACTIVE_BOUND	67996a97-6f02-47b0-8218-cb7760d5c9e4	\N	\N	\N	\N	\N	\N	\N
97746f10-4550-47c6-a4c2-3beed36e4447	ORG00052026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	14.84	3	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:08.432	2026-07-29 04:54:08.432	-6.87040576	107.62634651	\N	ACTIVE_BOUND	f8f351b8-1174-40d2-b107-988355cfac0d	\N	\N	\N	\N	\N	\N	\N
c0312dda-3da8-4c5f-b6d8-104c2a3a99e7	ANORG00062026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	11.21	3	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:08.442	2026-07-29 04:54:08.442	-6.87040576	107.62634651	\N	ACTIVE_BOUND	f8f351b8-1174-40d2-b107-988355cfac0d	\N	\N	\N	\N	\N	\N	\N
c1c3e5b0-8d63-44d3-a1c2-fb9cfb28b8fb	ORG00072026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	7.72	4	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:08.641	2026-07-29 04:54:08.641	-6.86458000	107.62102662	\N	ACTIVE_BOUND	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	\N	\N	\N	\N	\N	\N	\N
bab99c3a-4c22-46d6-9acf-09717e9577bf	ANORG00082026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	22.56	4	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:08.648	2026-07-29 04:54:08.648	-6.86458000	107.62102662	\N	ACTIVE_BOUND	2fe17edc-9c6d-4db9-ac8a-608c02e73a87	\N	\N	\N	\N	\N	\N	\N
1b55c6cb-63e8-4acf-a10f-06a5be363a9a	ORG00092026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	23.27	4	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:08.837	2026-07-29 04:54:08.837	-6.86416815	107.62148695	\N	ACTIVE_BOUND	6e65c7cb-2969-4483-be16-923f5dfc02b5	\N	\N	\N	\N	\N	\N	\N
5f169e8b-93c0-42ee-9613-dc76842ecad1	ANORG00102026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	23.95	4	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:08.844	2026-07-29 04:54:08.844	-6.86416815	107.62148695	\N	ACTIVE_BOUND	6e65c7cb-2969-4483-be16-923f5dfc02b5	\N	\N	\N	\N	\N	\N	\N
6eb9774a-7e63-4168-be08-731dbb41178d	ORG00112026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	22.68	4	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:09.007	2026-07-29 04:54:09.007	-6.86420858	107.61974313	\N	ACTIVE_BOUND	8265f3d5-9929-4810-9d35-8254c92b7161	\N	\N	\N	\N	\N	\N	\N
78e224c4-d70d-4e70-bcf7-de6c210ce759	ANORG00122026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	3.55	4	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:09.013	2026-07-29 04:54:09.013	-6.86420858	107.61974313	\N	ACTIVE_BOUND	8265f3d5-9929-4810-9d35-8254c92b7161	\N	\N	\N	\N	\N	\N	\N
151c8739-2aaf-40f6-aebe-2775c0ded2af	ORG00132026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	4.41	5	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:09.13	2026-07-29 04:54:09.13	-6.86971681	107.62291201	\N	ACTIVE_BOUND	6350bf55-763c-4db5-a60a-011fb84c6ef2	\N	\N	\N	\N	\N	\N	\N
1b212755-40f2-4f00-a4d4-5dc9a9210dd3	ANORG00142026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	8.74	5	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:09.136	2026-07-29 04:54:09.136	-6.86971681	107.62291201	\N	ACTIVE_BOUND	6350bf55-763c-4db5-a60a-011fb84c6ef2	\N	\N	\N	\N	\N	\N	\N
981507f1-dc39-45d8-8c10-f9a05aaf39d4	ORG00152026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	21.00	5	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:09.252	2026-07-29 04:54:09.252	-6.87135190	107.62167193	\N	ACTIVE_BOUND	ece74bb6-33f1-4e23-b489-aedd0f91cbca	\N	\N	\N	\N	\N	\N	\N
2a56f3e0-a093-4a90-8865-17a6df7380bb	ANORG00162026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	5.14	5	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:09.259	2026-07-29 04:54:09.259	-6.87135190	107.62167193	\N	ACTIVE_BOUND	ece74bb6-33f1-4e23-b489-aedd0f91cbca	\N	\N	\N	\N	\N	\N	\N
c123745b-c121-4ac7-a7f7-9fc867698ac7	ORG00172026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	12.36	5	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:09.452	2026-07-29 04:54:09.452	-6.87069689	107.62186918	\N	ACTIVE_BOUND	866e0066-e48e-4339-a2a5-40d06ba5c93e	\N	\N	\N	\N	\N	\N	\N
09ed65ff-237c-43bb-84e4-60b16427c2a1	ANORG00182026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	16.36	5	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:09.458	2026-07-29 04:54:09.458	-6.87069689	107.62186918	\N	ACTIVE_BOUND	866e0066-e48e-4339-a2a5-40d06ba5c93e	\N	\N	\N	\N	\N	\N	\N
4f8e19a0-bfac-430e-999e-ca71ce875f16	ORG00192026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	21.06	6	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:09.559	2026-07-29 04:54:09.559	-6.87291716	107.61850318	\N	ACTIVE_BOUND	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	\N	\N	\N	\N	\N	\N	\N
9666e589-38d4-4404-82c4-910a271e8757	ANORG00202026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	19.56	6	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:09.565	2026-07-29 04:54:09.565	-6.87291716	107.61850318	\N	ACTIVE_BOUND	4d3fa45f-9210-47b2-bc18-2d7ddf81631c	\N	\N	\N	\N	\N	\N	\N
f041d015-6c3e-42f5-aec9-b1235bd6fbba	ORG00212026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	19.40	6	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:09.757	2026-07-29 04:54:09.757	-6.87298936	107.61944888	\N	ACTIVE_BOUND	878f098e-6dc8-4860-ba8e-53bb9dc307bf	\N	\N	\N	\N	\N	\N	\N
5a78ee01-6d56-4e3c-8849-a471d01ebe01	ANORG00222026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	14.02	6	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:09.763	2026-07-29 04:54:09.763	-6.87298936	107.61944888	\N	ACTIVE_BOUND	878f098e-6dc8-4860-ba8e-53bb9dc307bf	\N	\N	\N	\N	\N	\N	\N
91ce5f8f-c238-42e7-b2b1-c7781b193e05	ORG00232026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	11.03	6	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:09.882	2026-07-29 04:54:09.882	-6.87557828	107.61853498	\N	ACTIVE_BOUND	429797a7-76fc-4742-a802-e4cc532c85a9	\N	\N	\N	\N	\N	\N	\N
e30d175f-a898-47a3-8218-e15545e555e3	ANORG00242026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	10.31	6	638442b9-98e9-40b2-8e69-dee107033fb9	2026-07-29 04:54:09.889	2026-07-29 04:54:09.889	-6.87557828	107.61853498	\N	ACTIVE_BOUND	429797a7-76fc-4742-a802-e4cc532c85a9	\N	\N	\N	\N	\N	\N	\N
2f50c138-c5e8-4d02-a39e-fab07bc57f25	ORG00252026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	1.90	7	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:09.998	2026-07-29 04:54:09.998	-6.88686638	107.61646977	\N	ACTIVE_BOUND	cc384148-25ef-43c2-8187-289865e697a5	\N	\N	\N	\N	\N	\N	\N
d1cf2280-a220-4610-bb5a-4f7e7ff6a479	ANORG00262026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	14.18	7	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:10.004	2026-07-29 04:54:10.004	-6.88686638	107.61646977	\N	ACTIVE_BOUND	cc384148-25ef-43c2-8187-289865e697a5	\N	\N	\N	\N	\N	\N	\N
19014866-2adc-4bab-b9b6-894358e90c4d	ORG00272026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	22.23	7	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:10.12	2026-07-29 04:54:10.12	-6.88620745	107.61795241	\N	ACTIVE_BOUND	e9a5cb9c-3a99-4448-8bfa-6388378e52a5	\N	\N	\N	\N	\N	\N	\N
aba8a5fd-7c54-475e-96de-c285070fed6f	ANORG00282026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	11.04	7	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:10.125	2026-07-29 04:54:10.125	-6.88620745	107.61795241	\N	ACTIVE_BOUND	e9a5cb9c-3a99-4448-8bfa-6388378e52a5	\N	\N	\N	\N	\N	\N	\N
da42673d-22cb-412e-93c6-3f7782e257fb	ORG00292026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	11.37	7	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:10.206	2026-07-29 04:54:10.206	-6.88541985	107.61610452	\N	ACTIVE_BOUND	d6db8325-10f5-45cb-a509-b0d284cb91f0	\N	\N	\N	\N	\N	\N	\N
a3398840-269e-4638-a1bf-0810e0b6a9ca	ANORG00302026	3132d7fe-07fb-4787-9857-c1e9f6602104	25.00	18.41	7	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:10.213	2026-07-29 04:54:10.213	-6.88541985	107.61610452	\N	ACTIVE_BOUND	d6db8325-10f5-45cb-a509-b0d284cb91f0	\N	\N	\N	\N	\N	\N	\N
a9186f55-e8bd-4abd-993f-b660bec22e27	ORG00312026	89f9fbfe-f8bc-4afd-bd98-1b99b39df8c6	25.00	16.48	8	52097faa-3960-45a6-88d3-976cf944c20d	2026-07-29 04:54:10.327	2026-07-29 04:54:10.327	-6.88370895	107.61639500	\N	ACTIVE_BOUND	54e9694d-7492-4543-9fe9-8fd7f4f5c921	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: tugas_penjemputan; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.tugas_penjemputan (id, id_tong, status, id_pengguna_mengklaim, dibuat_pada, diperbarui_pada) FROM stdin;
\.


--
-- Data for Name: wilayah_rt_rw; Type: TABLE DATA; Schema: public; Owner: psc_user
--

COPY public.wilayah_rt_rw (id, id_kelurahan, nama, dibuat_pada, diperbarui_pada, id_petugas_residu, latitude, longitude) FROM stdin;
1	638442b9-98e9-40b2-8e69-dee107033fb9	RW 06	2026-07-29 02:57:44.468	2026-07-29 02:57:44.468	\N	\N	\N
2	638442b9-98e9-40b2-8e69-dee107033fb9	RT 01 / RW 06	2026-07-29 02:57:44.477	2026-07-29 02:57:44.477	\N	\N	\N
4	638442b9-98e9-40b2-8e69-dee107033fb9	RW 01 / RT 02	2026-07-29 04:20:29.802	2026-07-29 04:20:29.802	\N	-6.86554278	107.62120340
5	638442b9-98e9-40b2-8e69-dee107033fb9	RW 02 / RT 01	2026-07-29 04:20:29.814	2026-07-29 04:20:29.814	\N	-6.87044061	107.62261214
3	638442b9-98e9-40b2-8e69-dee107033fb9	RW 01 / RT 01	2026-07-29 04:20:29.782	2026-07-29 04:21:06.092	35171cb3-8974-45df-9dad-88ab741af06e	-6.86962330	107.62581399
6	638442b9-98e9-40b2-8e69-dee107033fb9	RW 02 / RT 02	2026-07-29 04:29:18.238	2026-07-29 04:29:18.238	\N	-6.87426144	107.61946258
7	52097faa-3960-45a6-88d3-976cf944c20d	RW 01 / RT 01	2026-07-29 04:29:18.256	2026-07-29 04:29:18.256	\N	-6.88557881	107.61671257
8	52097faa-3960-45a6-88d3-976cf944c20d	RW 01 / RT 02	2026-07-29 04:29:18.268	2026-07-29 04:29:18.268	\N	-6.88445448	107.61781914
9	52097faa-3960-45a6-88d3-976cf944c20d	RW 02 / RT 01	2026-07-29 04:29:18.28	2026-07-29 04:29:18.28	\N	-6.88659737	107.61780092
10	52097faa-3960-45a6-88d3-976cf944c20d	RW 02 / RT 02	2026-07-29 04:29:18.291	2026-07-29 04:29:18.291	\N	-6.88799990	107.61813731
11	b8e7fa19-03fa-4a5c-989d-f9b07cb5898a	RW 01 / RT 01	2026-07-29 04:29:18.303	2026-07-29 04:29:18.303	\N	-6.89210157	107.61538058
12	b8e7fa19-03fa-4a5c-989d-f9b07cb5898a	RW 01 / RT 02	2026-07-29 04:29:18.316	2026-07-29 04:29:18.316	\N	-6.89120895	107.61455838
\.


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: psc_user
--

SELECT pg_catalog.setval('public.roles_id_seq', 17, true);


--
-- Name: rt_rw_areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: psc_user
--

SELECT pg_catalog.setval('public.rt_rw_areas_id_seq', 12, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


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
-- Name: kategori_sampah kategori_sampah_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kategori_sampah
    ADD CONSTRAINT kategori_sampah_pkey PRIMARY KEY (id);


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
-- Name: kepemilikan_tong kepemilikan_tong_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kepemilikan_tong
    ADD CONSTRAINT kepemilikan_tong_pkey PRIMARY KEY (id);


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
-- Name: pengajuan_aktivasi_tong pengajuan_aktivasi_tong_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pengajuan_aktivasi_tong
    ADD CONSTRAINT pengajuan_aktivasi_tong_pkey PRIMARY KEY (id);


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
-- Name: rumah_tangga rumah_tangga_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.rumah_tangga
    ADD CONSTRAINT rumah_tangga_pkey PRIMARY KEY (id);


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
-- Name: token_penyegar token_penyegar_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.token_penyegar
    ADD CONSTRAINT token_penyegar_pkey PRIMARY KEY (id);


--
-- Name: tong_sampah tong_sampah_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tong_sampah
    ADD CONSTRAINT tong_sampah_pkey PRIMARY KEY (id);


--
-- Name: tugas_penjemputan tugas_penjemputan_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tugas_penjemputan
    ADD CONSTRAINT tugas_penjemputan_pkey PRIMARY KEY (id);


--
-- Name: wilayah_rt_rw wilayah_rt_rw_pkey; Type: CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.wilayah_rt_rw
    ADD CONSTRAINT wilayah_rt_rw_pkey PRIMARY KEY (id);


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
-- Name: kategori_sampah_nama_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX kategori_sampah_nama_key ON public.kategori_sampah USING btree (nama);


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
-- Name: kepemilikan_tong_id_tong_id_pengguna_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX kepemilikan_tong_id_tong_id_pengguna_key ON public.kepemilikan_tong USING btree (id_tong, id_pengguna);


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
-- Name: pengguna_nik_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX pengguna_nik_key ON public.pengguna USING btree (nik);


--
-- Name: pengguna_no_telepon_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX pengguna_no_telepon_key ON public.pengguna USING btree (no_telepon);


--
-- Name: pengguna_surel_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX pengguna_surel_key ON public.pengguna USING btree (surel);


--
-- Name: peran_nama_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX peran_nama_key ON public.peran USING btree (nama);


--
-- Name: petugas_residu_id_pengguna_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX petugas_residu_id_pengguna_key ON public.petugas_residu USING btree (id_pengguna);


--
-- Name: token_penyegar_token_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX token_penyegar_token_key ON public.token_penyegar USING btree (token);


--
-- Name: tong_sampah_kode_qr_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX tong_sampah_kode_qr_key ON public.tong_sampah USING btree (kode_qr);


--
-- Name: wilayah_rt_rw_id_kelurahan_nama_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX wilayah_rt_rw_id_kelurahan_nama_key ON public.wilayah_rt_rw USING btree (id_kelurahan, nama);


--
-- Name: wilayah_rt_rw_id_petugas_residu_key; Type: INDEX; Schema: public; Owner: psc_user
--

CREATE UNIQUE INDEX wilayah_rt_rw_id_petugas_residu_key ON public.wilayah_rt_rw USING btree (id_petugas_residu);


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
-- Name: fasilitas fasilitas_id_rt_rw_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.fasilitas
    ADD CONSTRAINT fasilitas_id_rt_rw_fkey FOREIGN KEY (id_rt_rw) REFERENCES public.wilayah_rt_rw(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: gelombang_qr gelombang_qr_id_pengguna_pic_ditugaskan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.gelombang_qr
    ADD CONSTRAINT gelombang_qr_id_pengguna_pic_ditugaskan_fkey FOREIGN KEY (id_pengguna_pic_ditugaskan) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ide_daur_ulang ide_daur_ulang_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.ide_daur_ulang
    ADD CONSTRAINT ide_daur_ulang_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jejak_audit jejak_audit_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.jejak_audit
    ADD CONSTRAINT jejak_audit_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: kepemilikan_tong kepemilikan_tong_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kepemilikan_tong
    ADD CONSTRAINT kepemilikan_tong_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kepemilikan_tong kepemilikan_tong_id_tong_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.kepemilikan_tong
    ADD CONSTRAINT kepemilikan_tong_id_tong_fkey FOREIGN KEY (id_tong) REFERENCES public.tong_sampah(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: mahasiswa_kkn mahasiswa_kkn_id_poligon_ditugaskan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.mahasiswa_kkn
    ADD CONSTRAINT mahasiswa_kkn_id_poligon_ditugaskan_fkey FOREIGN KEY (id_poligon_ditugaskan) REFERENCES public.wilayah_rt_rw(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: pelanggaran pelanggaran_id_tong_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pelanggaran
    ADD CONSTRAINT pelanggaran_id_tong_fkey FOREIGN KEY (id_tong) REFERENCES public.tong_sampah(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pemanfaatan_sampah pemanfaatan_sampah_id_rw_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pemanfaatan_sampah
    ADD CONSTRAINT pemanfaatan_sampah_id_rw_fkey FOREIGN KEY (id_rw) REFERENCES public.wilayah_rt_rw(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pengajuan_aktivasi_tong pengajuan_aktivasi_tong_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pengajuan_aktivasi_tong
    ADD CONSTRAINT pengajuan_aktivasi_tong_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pengajuan_aktivasi_tong pengajuan_aktivasi_tong_id_pereview_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pengajuan_aktivasi_tong
    ADD CONSTRAINT pengajuan_aktivasi_tong_id_pereview_fkey FOREIGN KEY (id_pereview) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pengajuan_aktivasi_tong pengajuan_aktivasi_tong_id_tong_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pengajuan_aktivasi_tong
    ADD CONSTRAINT pengajuan_aktivasi_tong_id_tong_fkey FOREIGN KEY (id_tong) REFERENCES public.tong_sampah(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pengguna pengguna_id_peran_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pengguna
    ADD CONSTRAINT pengguna_id_peran_fkey FOREIGN KEY (id_peran) REFERENCES public.peran(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pengguna pengguna_id_rt_rw_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.pengguna
    ADD CONSTRAINT pengguna_id_rt_rw_fkey FOREIGN KEY (id_rt_rw) REFERENCES public.wilayah_rt_rw(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: riwayat_serah_terima_kkn riwayat_serah_terima_kkn_id_rt_rw_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.riwayat_serah_terima_kkn
    ADD CONSTRAINT riwayat_serah_terima_kkn_id_rt_rw_fkey FOREIGN KEY (id_rt_rw) REFERENCES public.wilayah_rt_rw(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: rumah_tangga rumah_tangga_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.rumah_tangga
    ADD CONSTRAINT rumah_tangga_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rumah_tangga rumah_tangga_id_rt_rw_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.rumah_tangga
    ADD CONSTRAINT rumah_tangga_id_rt_rw_fkey FOREIGN KEY (id_rt_rw) REFERENCES public.wilayah_rt_rw(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: setoran_manual setoran_manual_petugas_residu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.setoran_manual
    ADD CONSTRAINT setoran_manual_petugas_residu_id_fkey FOREIGN KEY (petugas_residu_id) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: setoran_manual setoran_manual_rw_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.setoran_manual
    ADD CONSTRAINT setoran_manual_rw_id_fkey FOREIGN KEY (rw_id) REFERENCES public.wilayah_rt_rw(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: setoran_otomatis setoran_otomatis_qr_tempat_sampah_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.setoran_otomatis
    ADD CONSTRAINT setoran_otomatis_qr_tempat_sampah_id_fkey FOREIGN KEY (qr_tempat_sampah_id) REFERENCES public.tong_sampah(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: setoran_otomatis setoran_otomatis_warga_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.setoran_otomatis
    ADD CONSTRAINT setoran_otomatis_warga_id_fkey FOREIGN KEY (warga_id) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: token_penyegar token_penyegar_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.token_penyegar
    ADD CONSTRAINT token_penyegar_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tong_sampah tong_sampah_id_gelombang_qr_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tong_sampah
    ADD CONSTRAINT tong_sampah_id_gelombang_qr_fkey FOREIGN KEY (id_gelombang_qr) REFERENCES public.gelombang_qr(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tong_sampah tong_sampah_id_kategori_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tong_sampah
    ADD CONSTRAINT tong_sampah_id_kategori_fkey FOREIGN KEY (id_kategori) REFERENCES public.kategori_sampah(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tong_sampah tong_sampah_id_kelurahan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tong_sampah
    ADD CONSTRAINT tong_sampah_id_kelurahan_fkey FOREIGN KEY (id_kelurahan) REFERENCES public.kelurahan(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tong_sampah tong_sampah_id_mahasiswa_pendaftar_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tong_sampah
    ADD CONSTRAINT tong_sampah_id_mahasiswa_pendaftar_fkey FOREIGN KEY (id_mahasiswa_pendaftar) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tong_sampah tong_sampah_id_pengguna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tong_sampah
    ADD CONSTRAINT tong_sampah_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tong_sampah tong_sampah_id_rt_rw_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tong_sampah
    ADD CONSTRAINT tong_sampah_id_rt_rw_fkey FOREIGN KEY (id_rt_rw) REFERENCES public.wilayah_rt_rw(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tugas_penjemputan tugas_penjemputan_id_pengguna_mengklaim_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tugas_penjemputan
    ADD CONSTRAINT tugas_penjemputan_id_pengguna_mengklaim_fkey FOREIGN KEY (id_pengguna_mengklaim) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tugas_penjemputan tugas_penjemputan_id_tong_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.tugas_penjemputan
    ADD CONSTRAINT tugas_penjemputan_id_tong_fkey FOREIGN KEY (id_tong) REFERENCES public.tong_sampah(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wilayah_rt_rw wilayah_rt_rw_id_kelurahan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.wilayah_rt_rw
    ADD CONSTRAINT wilayah_rt_rw_id_kelurahan_fkey FOREIGN KEY (id_kelurahan) REFERENCES public.kelurahan(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: wilayah_rt_rw wilayah_rt_rw_id_petugas_residu_fkey; Type: FK CONSTRAINT; Schema: public; Owner: psc_user
--

ALTER TABLE ONLY public.wilayah_rt_rw
    ADD CONSTRAINT wilayah_rt_rw_id_petugas_residu_fkey FOREIGN KEY (id_petugas_residu) REFERENCES public.pengguna(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: psc_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict dLZZAhHmmUIS0F3EeYSBH6pPeFG7PO6wARMrtcWodVNNuJ3kHOVBlIgAYk4yvtj

