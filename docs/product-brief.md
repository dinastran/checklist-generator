# Product Brief — Checklist Generator

## Objective
Checklist Generator adalah aplikasi web internal multi-organisasi untuk membuat, menetapkan, menjalankan, dan memantau checklist operasional berdasarkan role anggota organisasi.

## Primary users
- Admin organisasi: mengelola membership, role, template, jadwal, API key, import, monitoring, dan koreksi progres.
- User: menjalankan checklist sesuai role dan melihat riwayat miliknya.
- AI Agent: membuat draft checklist melalui API key organisasi.

## Core outcomes
1. Admin dapat menerbitkan checklist yang valid tanpa bantuan teknis.
2. User hanya melihat checklist yang memang ditugaskan kepada role-nya.
3. Progres tersimpan per user dan per run.
4. Semua data domain terisolasi berdasarkan organization.
5. Draft dapat dibuat melalui API AI atau import HTML, tetapi publish tetap dikontrol Admin.

## MVP flows
1. Register → buat organisasi → creator menjadi Admin organisasi.
2. Admin membuat role → membership → template → item → assignment → publish.
3. User membuka run aktif → check/uncheck item → run completed → history.
4. Scheduler membuat maksimal satu run per user target per periode.
5. AI Agent membuat draft melalui API key.
6. Admin import HTML resmi → validasi → preview → simpan draft.

## Out of scope
Notifikasi eksternal, manager bawaan, branching checklist, file attachment item, tanda tangan digital, marketplace template, dan production deployment tanpa approval eksplisit.

## Product rules
- Semua akses domain wajib scoped ke organization aktif yang sudah divalidasi.
- Role operasional adalah milik organization, bukan role global user.
- Published template yang sudah memiliki history tidak boleh dimutasi secara destruktif.
- Run menyimpan snapshot/version metadata agar history stabil.
- API key secret hanya tampil saat dibuat/rotasi dan tidak disimpan plaintext.
- HTML import selalu menghasilkan draft.
- Scheduler dan request AI yang dapat diulang harus idempotent.

Sumber utama: docs/PRD.md.
