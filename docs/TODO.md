# Execution TODO — Checklist Generator

Dokumen ini memecah seluruh PRD menjadi pekerjaan yang dapat dieksekusi. Urutan mengikuti dependency teknis dan prinsip vertical slice dari skill `kilat-fullstack-builder`.

## Cara Membaca

- `[ ]` belum dikerjakan.
- `[-]` sedang dikerjakan.
- `[x]` selesai dan sudah diverifikasi.
- Setiap task wajib memiliki bukti: file, migration, test, command output, atau browser verification.
- Task yang mengubah kontrak produk harus memperbarui PRD/blueprint terkait.

## Phase 0 — Project Setup dan Kontrak Produk

### P0.1 Workspace dan repository

- [ ] Pastikan folder project `/Users/nurdiansyahdisastra/checklist-generator` menjadi workspace aplikasi.
- [ ] Clone repository resmi Kilat ke workspace aplikasi tanpa menghapus dokumen PRD.
- [ ] Baca dan ikuti `AGENTS.md`, README, package manifest, `wrangler.toml`, migrations, dan test yang tersedia.
- [ ] Pastikan Node.js >= 22, Bun >= 1.3, Git, dan Wrangler tersedia.
- [ ] Commit baseline scaffold setelah project dapat di-install.

### P0.2 Blueprint dokumentasi

- [ ] Buat `docs/product-brief.md`.
- [ ] Buat `docs/architecture.md`.
- [ ] Buat `docs/page-map.md`.
- [ ] Buat `docs/data-model.md`.
- [ ] Buat `docs/api-routes.md`.
- [ ] Buat `docs/design-system.md`.
- [ ] Buat `docs/cloudflare-deployment.md`.
- [ ] Buat `docs/testing.md`.
- [ ] Pastikan seluruh blueprint konsisten dengan `docs/PRD.md`.

### P0.3 Kontrak AI dan HTML

- [ ] Definisikan versi kontrak import, misalnya `checklist-html-v1`.
- [ ] Definisikan struktur HTML metadata template.
- [ ] Definisikan atribut target role.
- [ ] Definisikan struktur item checklist dan urutan item.
- [ ] Definisikan struktur schedule dan timezone.
- [ ] Definisikan field yang boleh dan tidak boleh diimpor.
- [ ] Definisikan aturan sanitasi dan error per field/item.
- [ ] Buat `docs/html-import-contract.md`.
- [ ] Buat `docs/ai-system-prompt.md` yang memaksa AI menghasilkan format kontrak resmi.
- [ ] Tambahkan contoh HTML valid dan contoh HTML invalid.
- [ ] Versikan kontrak agar perubahan parser tidak merusak template lama.

## Phase 1 — Scaffold dan Infrastruktur Kilat

- [ ] Gunakan template default `react-tailwind` kecuali ada keputusan berbeda.
- [ ] Set nama project dan Worker secara eksplisit.
- [ ] Konfigurasi local/staging/production tanpa menaruh secret di repository.
- [ ] Pastikan static assets dan Inertia berjalan.
- [ ] Pastikan route health/basic page berjalan lokal.
- [ ] Tambahkan script development, build, typecheck, test, lint, migration, dan seed bila sesuai starter.
- [ ] Jalankan baseline `bun run build`, `bun run typecheck`, `bun run test`, dan `bun run lint`.

## Phase 2 — Database dan Data Isolation

### P2.1 Migration inti

- [ ] Buat tabel `users`.
- [ ] Buat tabel `sessions` atau mekanisme session sesuai konvensi Kilat.
- [ ] Buat tabel `organizations`.
- [ ] Buat tabel `organization_memberships`.
- [ ] Buat tabel `roles` yang terikat organization.
- [ ] Buat tabel membership-to-role bila user dapat memiliki lebih dari satu role pada organization.
- [ ] Buat tabel `checklist_templates`.
- [ ] Buat tabel `checklist_items`.
- [ ] Buat tabel `checklist_template_roles`.
- [ ] Buat tabel `checklist_schedules`.
- [ ] Buat tabel `checklist_runs`.
- [ ] Buat tabel `checklist_item_completions`.
- [ ] Buat tabel `audit_logs`.
- [ ] Buat tabel `api_keys` dengan penyimpanan hash, bukan secret plaintext.
- [ ] Buat tabel `ai_imports`.
- [ ] Buat metadata periode/schedule run dan unique constraint idempotency.
- [ ] Tambahkan foreign key, status constraint, timestamp, dan index yang diperlukan.

### P2.2 Query helpers

- [ ] Tambahkan type dan query helper D1 di `src/server/db.ts` sesuai konvensi Kilat.
- [ ] Semua query domain menerima `organizationId` atau context membership yang tervalidasi.
- [ ] Tambahkan helper untuk transaksi/atomic update bila tersedia.
- [ ] Tambahkan helper pagination dan filtering.
- [ ] Tambahkan query dashboard dan monitoring.
- [ ] Tambahkan query audit trail.

### P2.3 Migration verification

- [ ] Jalankan migration dari database lokal bersih.
- [ ] Jalankan pemeriksaan schema dan index.
- [ ] Tambahkan seed non-sensitive untuk demo lokal bila diperlukan.
- [ ] Uji bahwa query dari organization A tidak mengembalikan data organization B.

## Phase 3 — Authentication, Registration, dan Organization Context

- [ ] Implementasikan register email/password.
- [ ] Implementasikan login/logout.
- [ ] Hash password secara aman dan Worker-compatible.
- [ ] Implementasikan secure httpOnly SameSite session cookie.
- [ ] Tolak login untuk user nonaktif.
- [ ] Buat alur membuat organization pertama setelah register.
- [ ] Jadikan creator organization sebagai Admin.
- [ ] Implementasikan active organization context.
- [ ] Implementasikan perpindahan organization untuk user multi-membership.
- [ ] Implementasikan route guard server-side.
- [ ] Implementasikan helper `requireUser`, `requireMembership`, dan `requireOrganizationAdmin`.
- [ ] Tambahkan CSRF/origin protection dan security headers.
- [ ] Uji login success, login failure, session expiry, logout, dan akses tanpa session.

## Phase 4 — Membership, Invitations, dan Roles

- [ ] Admin dapat membuat, mengubah, menonaktifkan, dan mencari role.
- [ ] Admin dapat mengundang user melalui email/link undangan.
- [ ] Buat token undangan yang aman, scoped ke organization, memiliki expiry, single-use, dan status.
- [ ] Implementasikan accept invitation.
- [ ] Admin dapat melihat daftar membership.
- [ ] Admin dapat mengaktifkan/menonaktifkan membership.
- [ ] Admin dapat menetapkan lebih dari satu role pada user dalam organization.
- [ ] Cegah user non-member mengakses organization.
- [ ] Cegah Admin kehilangan akses Admin terakhir tanpa pengganti.
- [ ] Audit seluruh perubahan membership dan role.
- [ ] Uji kebocoran lintas organization melalui UI dan endpoint langsung.

## Phase 5 — Template Checklist dan Item

- [ ] Buat halaman daftar template untuk Admin.
- [ ] Buat form create/edit template.
- [ ] Implementasikan status draft, published, archived.
- [ ] Tambahkan item checklist dengan title, description, order, active status.
- [ ] Implementasikan reorder item.
- [ ] Implementasikan assignment template ke banyak role.
- [ ] Implementasikan preview template.
- [ ] Implementasikan publish validation: nama, role aktif, dan item aktif wajib tersedia.
- [ ] Implementasikan archive tanpa menghapus riwayat.
- [ ] Implementasikan duplicate template.
- [ ] Tentukan dan dokumentasikan perilaku edit template published terhadap run yang sudah ada.
- [ ] Simpan snapshot/version metadata pada run agar riwayat tetap konsisten.
- [ ] Uji draft tidak muncul di user.
- [ ] Uji template hanya muncul pada role yang ditetapkan.

## Phase 6 — User Checklist Execution

- [ ] Buat dashboard user.
- [ ] Tampilkan checklist aktif sesuai organization dan role.
- [ ] Buat halaman detail checklist.
- [ ] Buat atau ambil active checklist run secara idempotent.
- [ ] Implementasikan check/uncheck item.
- [ ] Simpan completion secara atomik.
- [ ] Hitung persentase progres.
- [ ] Tandai completed ketika semua item aktif selesai.
- [ ] Tolak pengulangan checklist completed pada periode yang sama.
- [ ] Implementasikan loading, saving, saved, dan error state.
- [ ] Buat halaman riwayat user.
- [ ] Pastikan user tidak dapat membuka run user lain.
- [ ] Uji refresh/login ulang mempertahankan progres.

## Phase 7 — Admin Monitoring dan Koreksi Progres

- [ ] Buat dashboard Admin.
- [ ] Tampilkan jumlah template published.
- [ ] Tampilkan jumlah user aktif.
- [ ] Tampilkan run in progress, completed, overdue bila status tersebut digunakan.
- [ ] Tampilkan aktivitas terbaru.
- [ ] Buat filter template, role, user, status, dan date range.
- [ ] Buat halaman detail run user.
- [ ] Izinkan Admin check/uncheck item user.
- [ ] Simpan actor dan alasan koreksi opsional.
- [ ] Pastikan koreksi tidak menghapus riwayat audit.
- [ ] Uji Admin hanya dapat mengoreksi user dalam organization aktif.

## Phase 8 — Recurring Schedule dan Scheduler

- [ ] Definisikan schema schedule: daily, weekly, monthly, custom.
- [ ] Validasi schedule dan timezone IANA.
- [ ] Simpan timezone pada organization.
- [ ] Buat UI create/edit/pause/resume schedule.
- [ ] Tentukan target role pada schedule.
- [ ] Implementasikan scheduled Worker/Cron handler.
- [ ] Hitung periode berdasarkan timezone organization.
- [ ] Ambil user aktif yang memiliki target role saat jadwal berjalan.
- [ ] Buat satu run per user target.
- [ ] Tambahkan unique key organization + schedule + period + user.
- [ ] Pastikan retry scheduler idempotent.
- [ ] Simpan schedule execution log.
- [ ] Tambahkan observability/error handling untuk kegagalan scheduler.
- [ ] Uji timezone, daylight saving bila relevan, boundary period, retry, dan duplicate prevention.

## Phase 9 — AI Agent API dan API Keys

### P9.1 API key management

- [ ] Buat UI daftar API key organisasi.
- [ ] Buat create API key dengan label dan scope.
- [ ] Tampilkan secret hanya sekali.
- [ ] Simpan hash/secure representation saja.
- [ ] Implementasikan revoke.
- [ ] Implementasikan rotate.
- [ ] Tampilkan created at, last used at, status, dan label.
- [ ] Audit create/revoke/rotate tanpa menyimpan secret.

### P9.2 API endpoints

- [ ] Buat route API versi, misalnya `/api/v1/checklist-templates`.
- [ ] Implementasikan authentication API key.
- [ ] Validasi organization context dari key.
- [ ] Implementasikan rate limiting.
- [ ] Implementasikan consistent JSON error shape.
- [ ] Endpoint membuat draft template.
- [ ] Endpoint membuat item checklist.
- [ ] Endpoint menetapkan target role.
- [ ] Endpoint membuat schedule.
- [ ] Pastikan request tidak dapat mengakses organization lain.
- [ ] Implementasikan idempotency key untuk request AI.
- [ ] Dokumentasikan request/response dan contoh curl.
- [ ] Uji key valid, key revoked, key salah, scope tidak cukup, validation error, dan duplicate request.

## Phase 10 — HTML Import dan System Prompt

- [ ] Implementasikan halaman paste/import HTML.
- [ ] Implementasikan parser kontrak HTML versi aktif.
- [ ] Sanitasi HTML sebelum parsing dan preview.
- [ ] Tolak script, event handler, URL berbahaya, dan markup yang tidak diizinkan.
- [ ] Parse metadata template.
- [ ] Parse role target.
- [ ] Parse schedule opsional.
- [ ] Parse item dan order.
- [ ] Kembalikan error per field/item.
- [ ] Tampilkan preview hasil parsing.
- [ ] Simpan hasil valid sebagai draft.
- [ ] Tampilkan versi kontrak yang digunakan.
- [ ] Publikasikan dokumentasi kontrak dan system prompt.
- [ ] Tambahkan test fixture HTML valid, invalid, malformed, dan malicious.
- [ ] Uji bahwa HTML mentah tidak dirender sebagai trusted markup.

## Phase 11 — UX, Design System, Accessibility, dan Responsive

- [ ] Terapkan design tokens dari `docs/design-system.md`.
- [ ] Buat layout public/auth.
- [ ] Buat layout user.
- [ ] Buat layout Admin.
- [ ] Buat organization switcher.
- [ ] Buat komponen checkbox dan progress.
- [ ] Buat form states: idle, loading, success, error.
- [ ] Buat empty states dan not-found states.
- [ ] Pastikan navigasi keyboard.
- [ ] Pastikan label checkbox jelas.
- [ ] Pastikan error terkait dengan field.
- [ ] Pastikan status tidak hanya dibedakan dengan warna.
- [ ] Uji mobile untuk execution checklist.
- [ ] Uji desktop untuk administrasi dan monitoring.
- [ ] Baca browser console dan perbaiki hydration/runtime error.

## Phase 12 — Audit, Security, dan Observability

- [ ] Audit login success/failure secara aman.
- [ ] Audit perubahan user, membership, role, template, assignment, schedule, API key, dan completion.
- [ ] Pastikan audit log scoped per organization.
- [ ] Terapkan security headers.
- [ ] Terapkan input validation dengan TypeBox di route boundary.
- [ ] Pastikan semua SQL parameterized.
- [ ] Review CSRF/origin protection.
- [ ] Review authorization pada setiap route.
- [ ] Review data yang dikirim sebagai Inertia props.
- [ ] Rate limit login dan API AI.
- [ ] Pastikan secret, password hash, invitation token, dan API key tidak bocor di log/response.
- [ ] Tambahkan health endpoint.
- [ ] Tambahkan logging yang dapat ditelusuri tanpa data sensitif.

## Phase 13 — Testing dan Verification

### Automated

- [ ] Unit test password/session helpers.
- [ ] Unit test organization scoping.
- [ ] Unit test role/membership authorization.
- [ ] Unit test template validation.
- [ ] Unit test schedule period calculation.
- [ ] Unit test scheduler idempotency.
- [ ] Unit test API key hashing/revocation.
- [ ] Unit test API schema dan error response.
- [ ] Unit test HTML parser/sanitizer.
- [ ] Integration test migration dari database kosong.
- [ ] Integration test checklist create/read/update flow.
- [ ] Integration test completion flow.
- [ ] Integration test Admin correction flow.
- [ ] Integration test invitation flow.
- [ ] Integration test AI draft flow.

### Commands

- [ ] `bun run build`
- [ ] `bun run typecheck`
- [ ] `bun run test`
- [ ] `bun run lint`
- [ ] Local D1 migration dari clean state.
- [ ] Local seed non-sensitive bila digunakan.

### Manual/local HTTP

- [ ] Register user baru.
- [ ] Membuat organization pertama.
- [ ] Login/logout.
- [ ] Membuat role.
- [ ] Mengundang user dan menerima invitation.
- [ ] Membuat template draft.
- [ ] Publish template.
- [ ] User melihat checklist sesuai role.
- [ ] User check/uncheck item.
- [ ] Checklist completed.
- [ ] User membuka riwayat.
- [ ] Admin melihat monitoring.
- [ ] Admin mengoreksi progres.
- [ ] Scheduler membuat run.
- [ ] Retry scheduler tidak menggandakan run.
- [ ] API AI membuat draft.
- [ ] API key revoked ditolak.
- [ ] Import HTML valid.
- [ ] Import HTML malicious ditolak/disanitasi.
- [ ] Health endpoint.

### Browser verification

- [ ] Verifikasi halaman register.
- [ ] Verifikasi halaman login.
- [ ] Verifikasi organization switcher.
- [ ] Verifikasi dashboard user.
- [ ] Verifikasi checklist mobile.
- [ ] Verifikasi halaman Admin desktop.
- [ ] Verifikasi template editor.
- [ ] Verifikasi import HTML preview.
- [ ] Baca console browser untuk setiap flow utama.
- [ ] Perbaiki seluruh error console sebelum completion.

## Phase 14 — Cloudflare Handover

- [ ] Dokumentasikan binding `ASSETS`.
- [ ] Dokumentasikan binding D1 `DB`.
- [ ] Dokumentasikan KV untuk rate limiting bila digunakan.
- [ ] Dokumentasikan cron/scheduled handler.
- [ ] Dokumentasikan vars versus secrets.
- [ ] Dokumentasikan local/staging/production environment.
- [ ] Dokumentasikan migration order.
- [ ] Dokumentasikan backup/rollback.
- [ ] Pastikan account ID, database ID, namespace ID, domain, dan secret tidak ditebak.
- [ ] Build lokal terakhir.
- [ ] Minta approval eksplisit sebelum remote migration.
- [ ] Minta approval eksplisit sebelum production deploy.
- [ ] Setelah deploy disetujui, baca kembali Worker, health endpoint, dan route representatif.

## Definition of Done

Satu phase hanya boleh ditandai selesai jika:

- Implementasi nyata sudah ada di repository.
- Acceptance criteria terkait sudah memiliki test atau verifikasi manual.
- Tidak ada error typecheck/build/lint yang diperkenalkan.
- Dokumentasi kontrak diperbarui.
- Tidak ada secret atau credential yang masuk repository.
- Untuk UI, browser console sudah diverifikasi.
- Untuk external state, hasil sudah dibaca kembali.

## Urutan Eksekusi Minimum

1. Phase 0 — kontrak produk dan HTML/API.
2. Phase 1 — scaffold Kilat.
3. Phase 2 — database dan isolation.
4. Phase 3 — auth dan organization context.
5. Phase 4 — membership dan role.
6. Phase 5 — template checklist.
7. Phase 6 — user execution.
8. Phase 7 — admin monitoring/correction.
9. Phase 8 — recurring schedule.
10. Phase 9 — AI API.
11. Phase 10 — HTML import.
12. Phase 11 — UX/accessibility.
13. Phase 12 — security/observability.
14. Phase 13 — full verification.
15. Phase 14 — Cloudflare handover dan approval-gated deployment.
