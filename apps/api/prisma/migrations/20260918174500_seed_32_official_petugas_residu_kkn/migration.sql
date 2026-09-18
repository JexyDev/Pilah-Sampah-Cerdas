-- 1. Ensure Role PETUGAS_RESIDU exists in peran table
INSERT INTO "peran" ("nama", "dibuat_pada", "diperbarui_pada")
VALUES ('PETUGAS_RESIDU', NOW(), NOW())
ON CONFLICT ("nama") DO NOTHING;

-- 2. Upsert 32 Official Accounts for Petugas Residu KKN in Kecamatan Coblong
DO $$
DECLARE
  v_role_id INT;
  v_password TEXT := '$2a$10$ryBO/.d4GOr6NOjlruGmt.G8V5GXZZEVm7I54QHqprsSF9BDSqLH6'; -- PetugasCoblong2026!
  v_user_id TEXT;
  rec RECORD;
BEGIN
  SELECT id INTO v_role_id FROM "peran" WHERE "nama" = 'PETUGAS_RESIDU' LIMIT 1;
  IF v_role_id IS NULL THEN
    RETURN;
  END IF;

  FOR rec IN
    SELECT * FROM (
      VALUES
        (1, 'Sadang Serang', 'Kelompok 1', 'Petugas Sadang Serang 01', 'Petugas Sadang Serang 01', '+628139040001', 'petugas01.sadangserang@berseka.id', 'Kelompok 01 (Sadang Serang), Kec. Coblong'),
        (2, 'Sadang Serang', 'Kelompok 2', 'Petugas Sadang Serang 02', 'Petugas Sadang Serang 02', '+628139040002', 'petugas02.sadangserang@berseka.id', 'Kelompok 02 (Sadang Serang), Kec. Coblong'),
        (3, 'Sadang Serang', 'Kelompok 3', 'Petugas Sadang Serang 03', 'Petugas Sadang Serang 03', '+628139040003', 'petugas03.sadangserang@berseka.id', 'Kelompok 03 (Sadang Serang), Kec. Coblong'),
        (4, 'Sadang Serang', 'Kelompok 4', 'Petugas Sadang Serang 04', 'Petugas Sadang Serang 04', '+628139040004', 'petugas04.sadangserang@berseka.id', 'Kelompok 04 (Sadang Serang), Kec. Coblong'),
        (5, 'Sadang Serang', 'Kelompok 5', 'Petugas Sadang Serang 05', 'Petugas Sadang Serang 05', '+628139040005', 'petugas05.sadangserang@berseka.id', 'Kelompok 05 (Sadang Serang), Kec. Coblong'),
        (6, 'Sadang Serang', 'Kelompok 6', 'Petugas Sadang Serang 06', 'Petugas Sadang Serang 06', '+628139040006', 'petugas06.sadangserang@berseka.id', 'Kelompok 06 (Sadang Serang), Kec. Coblong'),
        (7, 'Sadang Serang', 'Kelompok 7', 'Petugas Sadang Serang 07', 'Petugas Sadang Serang 07', '+628139040007', 'petugas07.sadangserang@berseka.id', 'Kelompok 07 (Sadang Serang), Kec. Coblong'),
        (8, 'Sadang Serang', 'Kelompok 8', 'Petugas Sadang Serang 08', 'Petugas Sadang Serang 08', '+628139040008', 'petugas08.sadangserang@berseka.id', 'Kelompok 08 (Sadang Serang), Kec. Coblong'),
        (9, 'Sadang Serang', 'Kelompok 9', 'Petugas Sadang Serang 09', 'Petugas Sadang Serang 09', '+628139040009', 'petugas09.sadangserang@berseka.id', 'Kelompok 09 (Sadang Serang), Kec. Coblong'),
        (10, 'Sadang Serang', 'Kelompok 10', 'Petugas Sadang Serang 10', 'Petugas Sadang Serang 10', '+628139040010', 'petugas10.sadangserang@berseka.id', 'Kelompok 10 (Sadang Serang), Kec. Coblong'),
        (11, 'Sadang Serang', 'Kelompok 11', 'Petugas Sadang Serang 11', 'Petugas Sadang Serang 11', '+628139040011', 'petugas11.sadangserang@berseka.id', 'Kelompok 11 (Sadang Serang), Kec. Coblong'),
        (12, 'Sekeloa', 'Kelompok 1', 'Petugas Sekeloa 01', 'Petugas Sekeloa 01', '+628139050001', 'petugas01.sekeloa@berseka.id', 'Kelompok 01 (Sekeloa), Kec. Coblong'),
        (13, 'Sekeloa', 'Kelompok 2', 'Petugas Sekeloa 02', 'Petugas Sekeloa 02', '+628139050002', 'petugas02.sekeloa@berseka.id', 'Kelompok 02 (Sekeloa), Kec. Coblong'),
        (14, 'Sekeloa', 'Kelompok 3', 'Petugas Sekeloa 03', 'Petugas Sekeloa 03', '+628139050003', 'petugas03.sekeloa@berseka.id', 'Kelompok 03 (Sekeloa), Kec. Coblong'),
        (15, 'Sekeloa', 'Kelompok 4', 'Petugas Sekeloa 04', 'Petugas Sekeloa 04', '+628139050004', 'petugas04.sekeloa@berseka.id', 'Kelompok 04 (Sekeloa), Kec. Coblong'),
        (16, 'Sekeloa', 'Kelompok 5', 'Petugas Sekeloa 05', 'Petugas Sekeloa 05', '+628139050005', 'petugas05.sekeloa@berseka.id', 'Kelompok 05 (Sekeloa), Kec. Coblong'),
        (17, 'Sekeloa', 'Kelompok 6', 'Petugas Sekeloa 06', 'Petugas Sekeloa 06', '+628139050006', 'petugas06.sekeloa@berseka.id', 'Kelompok 06 (Sekeloa), Kec. Coblong'),
        (18, 'Dago', 'Kelompok 1', 'Petugas Dago 01', 'Petugas Dago 01', '+628139010001', 'petugas01.dago@berseka.id', 'Kelompok 01 (Dago), Kec. Coblong'),
        (19, 'Dago', 'Kelompok 2', 'Petugas Dago 02', 'Petugas Dago 02', '+628139010002', 'petugas02.dago@berseka.id', 'Kelompok 02 (Dago), Kec. Coblong'),
        (20, 'Dago', 'Kelompok 3', 'Petugas Dago 03', 'Petugas Dago 03', '+628139010003', 'petugas03.dago@berseka.id', 'Kelompok 03 (Dago), Kec. Coblong'),
        (21, 'Dago', 'Kelompok 4', 'Petugas Dago 04', 'Petugas Dago 04', '+628139010004', 'petugas04.dago@berseka.id', 'Kelompok 04 (Dago), Kec. Coblong'),
        (22, 'Lebak Gede', 'Kelompok 1', 'Petugas Lebak Gede 01', 'Petugas Lebak Gede 01', '+628139020001', 'petugas01.lebakgede@berseka.id', 'Kelompok 01 (Lebak Gede), Kec. Coblong'),
        (23, 'Lebak Gede', 'Kelompok 2', 'Petugas Lebak Gede 02', 'Petugas Lebak Gede 02', '+628139020002', 'petugas02.lebakgede@berseka.id', 'Kelompok 02 (Lebak Gede), Kec. Coblong'),
        (24, 'Lebak Gede', 'Kelompok 3', 'Petugas Lebak Gede 03', 'Petugas Lebak Gede 03', '+628139020003', 'petugas03.lebakgede@berseka.id', 'Kelompok 03 (Lebak Gede), Kec. Coblong'),
        (25, 'Lebak Gede', 'Kelompok 4', 'Petugas Lebak Gede 04', 'Petugas Lebak Gede 04', '+628139020004', 'petugas04.lebakgede@berseka.id', 'Kelompok 04 (Lebak Gede), Kec. Coblong'),
        (26, 'Cipaganti', 'Kelompok 1', 'Petugas Cipaganti 01', 'Petugas Cipaganti 01', '+628139060001', 'petugas01.cipaganti@berseka.id', 'Kelompok 01 (Cipaganti), Kec. Coblong'),
        (27, 'Cipaganti', 'Kelompok 2', 'Petugas Cipaganti 02', 'Petugas Cipaganti 02', '+628139060002', 'petugas02.cipaganti@berseka.id', 'Kelompok 02 (Cipaganti), Kec. Coblong'),
        (28, 'Cipaganti', 'Kelompok 3', 'Petugas Cipaganti 03', 'Petugas Cipaganti 03', '+628139060003', 'petugas03.cipaganti@berseka.id', 'Kelompok 03 (Cipaganti), Kec. Coblong'),
        (29, 'Cipaganti', 'Kelompok 4', 'Petugas Cipaganti 04', 'Petugas Cipaganti 04', '+628139060004', 'petugas04.cipaganti@berseka.id', 'Kelompok 04 (Cipaganti), Kec. Coblong'),
        (30, 'Lebak Siliwangi', 'Kelompok 1', 'Petugas Lebak Siliwangi 01', 'Petugas Lebak Siliwangi 01', '+628139030001', 'petugas01.lebaksiliwangi@berseka.id', 'Kelompok 01 (Lebak Siliwangi), Kec. Coblong'),
        (31, 'Lebak Siliwangi', 'Kelompok 2', 'Petugas Lebak Siliwangi 02', 'Petugas Lebak Siliwangi 02', '+628139030002', 'petugas02.lebaksiliwangi@berseka.id', 'Kelompok 02 (Lebak Siliwangi), Kec. Coblong'),
        (32, 'Lebak Siliwangi', 'Kelompok 3', 'Petugas Lebak Siliwangi 03', 'Petugas Lebak Siliwangi 03', '+628139030003', 'petugas03.lebaksiliwangi@berseka.id', 'Kelompok 03 (Lebak Siliwangi), Kec. Coblong')
    ) AS t(no, kelurahan, kelompok, name, nama_display, phone, email, zone)
  LOOP
    -- 1. Insert or update pengguna
    INSERT INTO "pengguna" (
      "id",
      "nama",
      "kata_sandi",
      "id_peran",
      "no_telepon",
      "email",
      "alamat",
      "provinsi",
      "kabupaten",
      "id_rw",
      "status",
      "harus_ganti_password",
      "is_test_account",
      "dibuat_pada",
      "diperbarui_pada"
    )
    SELECT
      gen_random_uuid()::text,
      rec.name,
      v_password,
      v_role_id,
      rec.phone,
      rec.email,
      'Kel. ' || rec.kelurahan || ', Kecamatan Coblong',
      'Jawa Barat',
      'Kota Bandung',
      (
        SELECT r.id
        FROM "rw" r
        JOIN "kelurahan" k ON k.id = r.id_kelurahan
        WHERE k.nama ILIKE '%' || rec.kelurahan || '%'
        ORDER BY r.nama ASC
        LIMIT 1
      ),
      'Aktif',
      false,
      false,
      NOW(),
      NOW()
    ON CONFLICT ("no_telepon") DO UPDATE SET
      "id_peran" = EXCLUDED."id_peran",
      "nama" = EXCLUDED."nama",
      "email" = EXCLUDED."email",
      "alamat" = EXCLUDED."alamat",
      "provinsi" = EXCLUDED."provinsi",
      "kabupaten" = EXCLUDED."kabupaten",
      "id_rw" = COALESCE(EXCLUDED."id_rw", "pengguna"."id_rw"),
      "kata_sandi" = EXCLUDED."kata_sandi",
      "status" = 'Aktif',
      "is_test_account" = false,
      "diperbarui_pada" = NOW();

    -- Ambil user id pengguna terkait
    SELECT id INTO v_user_id FROM "pengguna" WHERE "no_telepon" = rec.phone LIMIT 1;

    -- 2. Insert or update profile petugas_residu
    IF v_user_id IS NOT NULL THEN
      INSERT INTO "petugas_residu" (
        "id",
        "id_pengguna",
        "nama",
        "nama_display",
        "no_wa",
        "skor_kpi",
        "zona_ditugaskan",
        "kelurahan",
        "status_whitelist",
        "dibuat_pada",
        "diperbarui_pada"
      )
      VALUES (
        gen_random_uuid()::text,
        v_user_id,
        rec.name,
        rec.nama_display,
        rec.phone,
        100.0,
        rec.zone,
        rec.kelurahan,
        'APPROVED',
        NOW(),
        NOW()
      )
      ON CONFLICT ("id_pengguna") DO UPDATE SET
        "nama" = EXCLUDED."nama",
        "nama_display" = EXCLUDED."nama_display",
        "no_wa" = EXCLUDED."no_wa",
        "zona_ditugaskan" = EXCLUDED."zona_ditugaskan",
        "kelurahan" = EXCLUDED."kelurahan",
        "status_whitelist" = 'APPROVED',
        "diperbarui_pada" = NOW();
    END IF;

  END LOOP;
END $$;
