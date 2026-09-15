-- 1. Ensure Role MPL exists in peran table
INSERT INTO "peran" ("nama", "dibuat_pada", "diperbarui_pada")
VALUES ('MPL', NOW(), NOW())
ON CONFLICT ("nama") DO NOTHING;

-- 2. Ensure default permissions for MPL in hak_akses table
INSERT INTO "hak_akses" ("id_peran", "resource", "bisa_lihat", "bisa_buat", "bisa_edit", "bisa_hapus", "diperbarui_pada")
SELECT p.id, 'dashboard_kkn', true, false, false, false, NOW()
FROM "peran" p
WHERE p.nama = 'MPL'
ON CONFLICT ("id_peran", "resource") DO NOTHING;

INSERT INTO "hak_akses" ("id_peran", "resource", "bisa_lihat", "bisa_buat", "bisa_edit", "bisa_hapus", "diperbarui_pada")
SELECT p.id, 'dashboard_utama', false, false, false, false, NOW()
FROM "peran" p
WHERE p.nama = 'MPL'
ON CONFLICT ("id_peran", "resource") DO NOTHING;

-- 3. Insert or Update MPL Accounts for 6 Kelurahan in Kecamatan Coblong
DO $$
DECLARE
  v_role_id INT;
  v_password TEXT := '$2a$10$hCbWZV0P1HixbzyfZfKyVevDPjv2RQYhb7yYQPBpRUlh84FJtR6Eq'; -- Berseka2026!
  rec RECORD;
BEGIN
  SELECT id INTO v_role_id FROM "peran" WHERE "nama" = 'MPL' LIMIT 1;
  IF v_role_id IS NULL THEN
    RETURN;
  END IF;

  FOR rec IN
    SELECT * FROM (
      VALUES
        ('Cipaganti', 'mpl.cipaganti@berseka.bandung.go.id', '+6281211110001'),
        ('Dago', 'mpl.dago@berseka.bandung.go.id', '+6281211110002'),
        ('Lebak Gede', 'mpl.lebakgede@berseka.bandung.go.id', '+6281211110003'),
        ('Lebak Siliwangi', 'mpl.lebaksiliwangi@berseka.bandung.go.id', '+6281211110004'),
        ('Sadang Serang', 'mpl.sadangserang@berseka.bandung.go.id', '+6281211110005'),
        ('Sekeloa', 'mpl.sekeloa@berseka.bandung.go.id', '+6281211110006')
    ) AS t(kel_name, email, phone)
  LOOP
    INSERT INTO "pengguna" (
      "id",
      "nama",
      "kata_sandi",
      "id_peran",
      "no_telepon",
      "email",
      "alamat",
      "id_rw",
      "status",
      "harus_ganti_password",
      "dibuat_pada",
      "diperbarui_pada"
    )
    SELECT
      gen_random_uuid()::text,
      'MPL Kelurahan ' || rec.kel_name,
      v_password,
      v_role_id,
      rec.phone,
      rec.email,
      'Kel. ' || rec.kel_name,
      (
        SELECT r.id
        FROM "rw" r
        JOIN "kelurahan" k ON k.id = r.id_kelurahan
        WHERE k.nama ILIKE '%' || rec.kel_name || '%'
        ORDER BY r.nama ASC
        LIMIT 1
      ),
      'Aktif',
      false,
      NOW(),
      NOW()
    ON CONFLICT ("no_telepon") DO UPDATE SET
      "id_peran" = EXCLUDED."id_peran",
      "id_rw" = COALESCE(EXCLUDED."id_rw", "pengguna"."id_rw"),
      "alamat" = COALESCE(EXCLUDED."alamat", "pengguna"."alamat"),
      "kata_sandi" = EXCLUDED."kata_sandi",
      "nama" = EXCLUDED."nama",
      "status" = 'Aktif',
      "diperbarui_pada" = NOW();
  END LOOP;
END $$;
