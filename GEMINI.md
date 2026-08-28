# User Role & Development Guidelines

## User Profile
- **Role**: Fullstack Developer (Backend API & Web Frontend) di folder `main`.

## Git & Branch Safety Rules
1. **DILARANG KERAS PUSH LANGSUNG KE `main`**:
   - Jangan pernah menjalankan `git push origin main`, `git push origin HEAD:main`, atau melakukan push langsung ke branch `main`.
   - Segala perubahan wajib melalui branch pengembangan (seperti `development`, feature branch `feat/*`, `fix/*`) atau melalui Pull Request.
2. **Sinkronisasi & Keamanan Kode Tim**:
   - Selalu periksa `git status` dan amankan perubahan lokal (stash/commit) sebelum melakukan pull/rebase agar perubahan anggota tim tidak saling tertimpa atau konflik.
   - Dilarang keras melakukan `push --force` pada branch bersama.
