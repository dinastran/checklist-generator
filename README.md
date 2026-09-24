# Checklist Generator

Aplikasi web multi-organisasi untuk membuat, menetapkan, menjalankan, dan memantau checklist operasional berdasarkan role user.

## Status

**Tahap:** Product Requirements & Execution Planning  
**Versi PRD:** Draft v0.2  
**Implementasi aplikasi:** Belum dimulai  
**Tanggal:** 24 September 2026

## Tujuan Produk

Checklist Generator membantu organisasi mengubah prosedur operasional menjadi checklist yang dapat dikerjakan user sesuai role-nya. Admin organisasi mengelola user, role, template, assignment, jadwal, progres, dan integrasi AI.

Aplikasi mendukung:

- Banyak organisasi dengan isolasi data.
- Satu user dapat bergabung ke banyak organisasi.
- Role berbeda untuk user pada setiap organisasi.
- Checklist manual dan checklist berulang otomatis.
- Penyimpanan progres dan riwayat.
- Koreksi progres oleh Admin dengan audit log.
- AI Agent melalui API key per organisasi.
- Import HTML dengan kontrak format resmi.
- System prompt baku agar AI menghasilkan HTML yang kompatibel.

## Peran

### Admin Organisasi

Mengelola organisasi, membership, role, template checklist, jadwal, API key, monitoring, serta koreksi progres user.

### User

Menjalankan checklist yang tersedia berdasarkan role pada organisasi aktif dan melihat riwayat miliknya.

### AI Agent

Klien API non-manusia yang dapat membuat draft checklist, item, role mapping, dan schedule menggunakan API key organisasi. Draft tetap perlu direview dan dipublish oleh Admin.

## Alur Utama

1. User mendaftar.
2. User membuat organisasi pertama dan otomatis menjadi Admin.
3. Admin membuat role dan mengundang user melalui email/link.
4. Admin membuat template checklist atau mengimpor hasil AI.
5. Admin menetapkan template ke role dan menerbitkannya.
6. User melihat checklist sesuai role.
7. User menjalankan checklist; progres dan riwayat tersimpan.
8. Schedule aktif membuat run baru untuk user yang memiliki role target saat jadwal berjalan.
9. AI Agent dapat membuat draft checklist melalui API.
10. Admin melakukan review dan publish.

## Teknologi Target

Aplikasi akan dibangun menggunakan starter resmi **Kilat** dengan default template React + Tailwind:

- Cloudflare Workers
- Hono
- Inertia
- React + Tailwind
- Cloudflare D1 untuk data relasional
- KV opsional untuk rate limit/cache/session sesuai kebutuhan
- Cloudflare Cron/Workers Scheduled Handler untuk recurring checklist
- Web Crypto dan Web APIs yang kompatibel dengan Worker runtime

## Struktur Dokumen

- [`docs/PRD.md`](docs/PRD.md) — Product Requirements Document dan acceptance criteria.
- [`docs/TODO.md`](docs/TODO.md) — execution checklist untuk mengimplementasikan seluruh PRD.

Dokumen blueprint berikut akan dibuat sebelum implementasi inti:

- `docs/product-brief.md`
- `docs/architecture.md`
- `docs/page-map.md`
- `docs/data-model.md`
- `docs/api-routes.md`
- `docs/design-system.md`
- `docs/cloudflare-deployment.md`
- `docs/testing.md`
- `docs/html-import-contract.md`
- `docs/ai-system-prompt.md`

## Pengembangan Lokal

Perintah final mengikuti versi Kilat yang digunakan setelah repository resmi di-scaffold. Target command:

```bash
bun install
bun run build
bun run typecheck
bun run test
bun run lint
bun run db:migrate
bun run dev
```

Jangan menjalankan migrasi remote atau deployment production tanpa persetujuan eksplisit.

## Prinsip Implementasi

- Semua akses data wajib dibatasi oleh `organization_id` dan membership yang tervalidasi.
- Role disimpan dalam konteks organisasi, bukan sebagai role global user.
- API key hanya ditampilkan sekali saat dibuat atau dirotasi.
- Endpoint AI membuat draft secara default.
- HTML import harus disanitasi, divalidasi, dipreview, lalu disimpan sebagai draft.
- Scheduler harus idempotent agar retry tidak menggandakan checklist run.
- Perubahan Admin terhadap progres user wajib tercatat dalam audit log.
- Template published boleh diedit, tetapi perilaku terhadap run/riwayat lama harus ditentukan secara eksplisit di data model.
- Build, typecheck, test, lint, local HTTP checks, dan browser verification wajib dijalankan sebelum menyatakan fitur selesai.

## Scope yang Tidak Termasuk MVP

- AI publish otomatis tanpa permission khusus.
- Integrasi WhatsApp, email, Slack, atau Telegram.
- Notifikasi eksternal otomatis.
- Approval berjenjang.
- Checklist bercabang berdasarkan jawaban.
- Upload attachment dan tanda tangan digital.
- Marketplace template.

## Status Deployment

Belum dideploy. Resource Cloudflare, secrets, domain, dan migration remote akan disiapkan dalam tahap handover dan membutuhkan approval terpisah.
