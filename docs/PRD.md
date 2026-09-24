# PRD — Checklist Generator

**Status:** Draft v0.2  
**Tanggal:** 24 September 2026  
**Pemilik produk:** Kang Nurdin  
**Platform target:** Web application berbasis Cloudflare Workers + Kilat  
**Bahasa utama:** Bahasa Indonesia

## 1. Ringkasan Produk

Checklist Generator adalah aplikasi web internal untuk membantu bisnis membuat, mengelola, menetapkan, dan menjalankan checklist operasional berdasarkan peran pengguna.

Admin membuat template checklist dan menetapkan template tersebut ke satu atau lebih peran. User hanya melihat checklist yang ditugaskan kepada perannya, lalu mencentang item yang sudah dikerjakan. Sistem menyimpan progres dan riwayat penyelesaian agar pekerjaan dapat dipantau dan ditelusuri.

Produk dirancang sebagai aplikasi multi-organisasi. Selain pembuatan manual oleh Admin, organisasi dapat membuat draft checklist melalui API yang dipakai AI Agent atau melalui import HTML dengan kontrak format resmi dan system prompt baku.

## 2. Masalah yang Diselesaikan

1. Prosedur operasional sering tersebar di dokumen, chat, atau ingatan anggota tim.
2. User tidak selalu tahu tugas apa yang menjadi tanggung jawabnya.
3. Admin sulit memastikan checklist yang digunakan masih aktif dan sesuai peran.
4. Progres pekerjaan dan riwayat penyelesaian sulit ditelusuri.
5. Tidak ada sumber data terpusat untuk melihat checklist yang belum selesai.

## 3. Tujuan dan Indikator Keberhasilan

### Tujuan MVP

- Admin dapat membuat dan mengelola template checklist.
- Admin dapat mengelola peran dan user.
- Admin dapat menetapkan template ke peran tertentu.
- User dapat melihat checklist yang berlaku untuk perannya.
- User dapat mencentang, membatalkan centang, dan menyelesaikan item checklist.
- Sistem menyimpan progres dan riwayat checklist.
- Setiap organisasi dapat mengatur user, role, template, dan jadwalnya sendiri.
- AI Agent dapat membuat draft checklist melalui API organisasi.
- Admin dapat mengimpor HTML berformat resmi dan memvalidasi hasilnya sebelum disimpan.

### Indikator keberhasilan awal

- Admin dapat menerbitkan satu template checklist tanpa bantuan teknis.
- User dapat menemukan checklist aktif untuk perannya dalam maksimal 2 langkah dari dashboard.
- Progres checklist tersimpan setelah aksi user dan tetap tersedia saat login ulang.
- Admin dapat mengetahui checklist yang aktif, selesai, atau belum selesai.
- Tidak ada user yang dapat mengakses checklist di luar perannya melalui UI maupun request langsung.

## 4. Target Pengguna dan Peran

### 4.1 Admin Organisasi

Admin adalah pengelola satu organisasi dan konten checklist organisasi tersebut.

Hak akses:

- Login dan logout.
- Melihat ringkasan aktivitas checklist.
- Membuat, mengubah, mengarsipkan, dan mengaktifkan template checklist.
- Menambah, mengubah, menonaktifkan, dan menghapus item checklist sesuai aturan data.
- Membuat dan mengelola peran.
- Membuat dan mengelola user.
- Menetapkan satu atau beberapa template checklist ke peran.
- Melihat progres dan riwayat seluruh user.
- Mengelola API key AI organisasi.
- Menyetujui atau mengatur role user yang mendaftar/bergabung ke organisasi.
- Mengubah progres checklist user bila diperlukan untuk koreksi operasional.

### 4.2 User

User adalah anggota tim yang menjalankan checklist sesuai peran yang diberikan.

Hak akses:

- Login dan logout.
- Melihat checklist aktif yang ditetapkan untuk perannya.
- Membuka detail checklist.
- Menandai item selesai atau belum selesai.
- Melihat progres checklist miliknya.
- Melihat riwayat checklist miliknya.

Batasan:

- Tidak dapat membuat atau mengubah template.
- Tidak dapat melihat checklist yang tidak ditetapkan ke perannya.
- Tidak dapat melihat data progres user lain, kecuali keputusan produk berikutnya menambahkan supervisor/manager.
- Tidak dapat mengakses data organisasi lain.

### 4.3 AI Agent / Integrasi API

AI Agent bukan user manusia. Ia mengakses API menggunakan API key yang dibuat Admin organisasi.

Hak akses awal:

- Membuat draft template checklist.
- Membuat item checklist.
- Mengatur role target berdasarkan role yang tersedia.
- Mengatur jadwal checklist sesuai schema API.
- Membaca hasil validasi/import dan ID draft.

Publish checklist tetap dilakukan melalui Admin atau endpoint berizin khusus yang diputuskan pada desain keamanan API.

## 5. Ruang Lingkup MVP

### Termasuk

1. Registrasi email dan password.
2. Pembuatan organisasi pertama oleh user yang mendaftar; user tersebut otomatis menjadi Admin.
3. Multi-organisasi dengan isolasi data per organisasi.
4. Satu user dapat bergabung ke banyak organisasi dan memiliki role berbeda pada tiap organisasi.
5. Role-based access control dengan Admin dan role operasional yang dibuat Admin.
6. Manajemen user, membership, dan role per organisasi.
7. Manajemen template checklist.
8. Item checklist berurutan dengan judul, deskripsi opsional, dan status aktif.
9. Assignment template ke role.
10. Jadwal berulang otomatis dengan timezone organisasi.
11. Satu run otomatis per user target untuk setiap periode jadwal.
12. Dashboard berbeda untuk Admin dan User.
13. Progres checklist per user.
14. Admin dapat mengoreksi progres user.
15. Riwayat penyelesaian checklist.
16. Status template: draft, published, archived.
17. API key organisasi untuk AI Agent.
18. Endpoint pembuatan draft checklist dari AI Agent.
19. Import HTML dengan schema/atribut resmi, preview, dan validasi.
20. System prompt resmi untuk menghasilkan HTML sesuai kontrak import.
21. Validasi input, proteksi akses, audit dasar, dan rate limiting API.
22. Tampilan responsif untuk desktop dan mobile.

### Tidak termasuk MVP

- AI yang langsung mem-publish checklist tanpa kontrol izin yang eksplisit.
- Integrasi WhatsApp, email, Slack, atau Telegram.
- Notifikasi eksternal otomatis.
- Approval berjenjang selain review/publish Admin.
- Manager/supervisor sebagai role bawaan khusus.
- Checklist bercabang berdasarkan jawaban.
- Upload file atau lampiran pada item.
- Tanda tangan digital.
- Marketplace atau katalog template.
- Deployment production tanpa persetujuan eksplisit.

## 6. Konsep Produk dan Terminologi

- **Role:** kelompok tanggung jawab operasional, misalnya Admin Gudang, CS, atau Tim Marketing.
- **Organization:** ruang kerja terisolasi yang memiliki anggota, role, template, jadwal, dan data aktivitas sendiri.
- **Membership:** hubungan user dengan organization, termasuk status dan role user pada organization tersebut.
- **Template Checklist:** definisi checklist yang dibuat Admin dan dapat ditetapkan ke role.
- **Checklist Assignment:** hubungan antara template dan role.
- **Checklist Run:** salinan eksekusi template untuk seorang user; menyimpan progres pada waktu tertentu.
- **Checklist Item:** langkah individual di dalam template.
- **Item Completion:** catatan bahwa seorang user menyelesaikan atau membatalkan penyelesaian item.
- **Schedule:** aturan pengulangan checklist, minimal harian, mingguan, bulanan, atau custom, dengan timezone organization.
- **AI Import Contract:** format HTML resmi beserta atribut data yang wajib dipatuhi AI Agent.
- **Riwayat:** daftar checklist run yang pernah dikerjakan user beserta status dan waktunya.

## 7. Alur Pengguna Utama

### 7.1 Admin membuat checklist

1. Admin login.
2. Admin membuka menu Template Checklist.
3. Admin memilih Buat Template.
4. Admin mengisi nama, deskripsi, dan role target.
5. Admin menambahkan item checklist dan mengatur urutannya.
6. Admin menyimpan sebagai draft.
7. Admin melakukan preview.
8. Admin menerbitkan template.
9. Sistem membuat template tersedia bagi user dengan role terkait.

### 7.1a User mendaftar dan membuat organisasi

1. User membuka halaman registrasi.
2. User membuat akun.
3. User membuat organisasi pertama.
4. Sistem menjadikan user tersebut Admin organisasi.
5. Admin dapat membuat role dan mengatur membership user lain.
6. User dapat berpindah organisasi jika memiliki membership di beberapa organisasi.

### 7.2 User menjalankan checklist

1. User login.
2. User melihat dashboard berisi checklist aktif untuk role-nya.
3. User membuka salah satu checklist.
4. Sistem membuat atau mengambil checklist run aktif.
5. User mencentang item yang sudah dikerjakan.
6. Sistem menyimpan perubahan progres.
7. Saat seluruh item selesai, sistem menandai run sebagai completed dan menyimpan waktu penyelesaian.
8. User dapat melihat checklist tersebut pada riwayat.

### 7.2a Checklist berulang otomatis

1. Admin membuat atau mengaktifkan schedule pada template published.
2. Sistem menghitung periode berdasarkan timezone organisasi.
3. Pada waktu eksekusi, sistem membuat maksimal satu checklist run per user target untuk periode tersebut.
4. User target melihat run baru di dashboard.
5. Admin dapat memantau run yang selesai dan belum selesai.

### 7.4 AI Agent membuat checklist melalui API

1. Admin membuat API key organisasi.
2. AI Agent mengirim request terautentikasi ke endpoint checklist.
3. Sistem memvalidasi schema, role target, schedule, dan batas organisasi.
4. Sistem membuat template berstatus draft serta mengembalikan ID dan hasil validasi.
5. Admin membuka draft, melakukan preview/edit, lalu publish.

### 7.5 Import HTML dari AI

1. User/Admin membuka Import HTML.
2. User menempelkan HTML yang mengikuti AI Import Contract.
3. Sistem melakukan sanitasi, parsing, schema validation, dan normalisasi.
4. Sistem menampilkan preview hasil parsing.
5. Admin menyimpan hasil sebagai draft template.

Kontrak HTML dan system prompt resmi menjadi artefak produk tersendiri dan harus versioned.

### 7.3 Admin memantau progres

1. Admin membuka dashboard monitoring.
2. Admin memfilter berdasarkan template, role, user, status, dan rentang tanggal.
3. Sistem menampilkan progres dan status checklist.
4. Admin membuka detail untuk melihat item yang belum selesai dan waktu aktivitas terakhir.

## 8. Kebutuhan Fungsional

### FR-01 — Autentikasi

- Sistem harus menyediakan login dan logout.
- Password harus disimpan dalam bentuk hash, bukan plaintext.
- Session harus menggunakan cookie aman, httpOnly, SameSite, dan masa berlaku yang terdokumentasi.
- User nonaktif tidak dapat login.
- Akses route harus diperiksa di server, bukan hanya disembunyikan di frontend.

### FR-02 — Manajemen User

Admin dapat:

- Membuat user dengan nama, email, role, dan status aktif/nonaktif.
- Mengubah nama, role, dan status user.
- Mengatur atau mereset password melalui alur aman.
- Melihat daftar user dengan pencarian dan filter role/status.

Aturan:

- Email harus unik.
- Admin terakhir yang aktif tidak boleh dinonaktifkan tanpa mekanisme pengganti.
- User nonaktif tidak menerima akses checklist.

### FR-03 — Manajemen Role

Admin dapat:

- Membuat role dengan nama dan deskripsi.
- Mengubah nama dan deskripsi role.
- Menonaktifkan role.
- Melihat jumlah user dan template yang terkait dengan role.

Role yang masih digunakan tidak boleh dihapus secara permanen; gunakan status archived/inactive.

### FR-04 — Manajemen Template Checklist

Template memiliki:

- Nama wajib.
- Deskripsi opsional.
- Status draft, published, atau archived.
- Daftar role target.
- Daftar item berurutan.
- Metadata pembuat dan waktu perubahan.

Admin dapat membuat, mengedit draft, preview, publish, archive, dan menduplikasi template.

Aturan:

- Template yang akan dipublish harus memiliki nama, minimal satu role aktif, dan minimal satu item aktif.
- Template published tidak boleh mengubah item secara destruktif jika sudah memiliki riwayat; perubahan berikutnya menggunakan versi baru atau aturan versioning yang ditetapkan saat implementasi.
- Template archived tidak muncul sebagai checklist baru bagi user, tetapi riwayat lama tetap dapat dibaca.

### FR-05 — Manajemen Item Checklist

Setiap item memiliki:

- Judul wajib.
- Deskripsi/instruksi opsional.
- Urutan.
- Status aktif/nonaktif.
- Waktu pembuatan dan perubahan.

Admin dapat menambah, mengubah, mengurutkan, dan menonaktifkan item.

### FR-06 — Assignment Berdasarkan Role

- Admin dapat menetapkan template ke satu atau lebih role.
- User hanya memperoleh template published yang ditetapkan ke role aktifnya.
- Jika user memiliki lebih dari satu role pada masa depan, sistem harus dapat diperluas tanpa perubahan besar pada data utama.
- Assignment yang dihapus tidak menghapus riwayat checklist yang sudah dibuat.

### FR-07 — Eksekusi Checklist User

- User dapat melihat checklist aktif yang tersedia untuk role-nya.
- User dapat memulai checklist.
- User dapat mencentang dan membatalkan centang item.
- Sistem menyimpan progres secara atomik dan idempotent.
- Sistem menghitung persentase progres.
- Sistem menandai run sebagai completed ketika semua item aktif selesai.
- User dapat melanjutkan run yang belum selesai.
- Sistem menampilkan empty state bila tidak ada checklist aktif.

### FR-08 — Riwayat

User dapat melihat riwayat miliknya yang berisi:

- Nama checklist.
- Role saat checklist dikerjakan.
- Status in progress/completed.
- Persentase progres.
- Waktu mulai.
- Waktu aktivitas terakhir.
- Waktu selesai jika completed.

Admin dapat melihat riwayat seluruh user dengan filter.

### FR-09 — Monitoring Admin

Dashboard Admin minimal menampilkan:

- Jumlah template published.
- Jumlah user aktif.
- Checklist run yang sedang berjalan.
- Checklist yang selesai.
- Checklist yang belum selesai.
- Aktivitas terbaru.

### FR-10 — Audit Dasar

Sistem mencatat event penting:

- Login berhasil/gagal secara aman tanpa menyimpan password.
- Pembuatan dan perubahan user/role.
- Pembuatan, publish, archive template.
- Perubahan assignment.
- Perubahan status item oleh user.

Audit log hanya dapat dilihat Admin dan tidak mengandung secret.

### FR-11 — Multi-Organisasi dan Membership

- User dapat membuat organisasi pertama setelah registrasi.
- User dapat memiliki membership pada beberapa organisasi.
- Role user disimpan pada konteks organisasi, bukan global.
- Semua query dan route domain wajib dibatasi dengan `organization_id` dari session/membership yang tervalidasi.
- Admin hanya dapat mengelola organisasi tempat ia memiliki role Admin.
- User dapat memilih organisasi aktif saat memiliki lebih dari satu membership.

### FR-12 — Registrasi dan Pengaturan Role

- User dapat mendaftar sendiri.
- User baru yang membuat organisasi otomatis menjadi Admin organisasi tersebut.
- Admin dapat menambahkan atau mengubah role membership user.
- User dapat bergabung ke organisasi lain melalui undangan email/link dari Admin organisasi.
- User yang belum memiliki membership pada organisasi tidak dapat mengakses data organisasi tersebut.

### FR-13 — Jadwal Checklist Berulang

- Admin dapat membuat jadwal pada template published.
- Jadwal minimal mendukung daily, weekly, monthly, dan custom rule yang divalidasi.
- Jadwal menggunakan timezone organisasi.
- Setiap periode menghasilkan satu run per user target.
- Target run berasal dari user aktif yang memiliki role yang ditetapkan pada saat jadwal berjalan.
- Sistem harus idempotent agar retry scheduler tidak membuat duplikasi run pada periode yang sama.
- Checklist yang sudah completed tidak boleh diulang oleh user; periode berikutnya menghasilkan run baru.

### FR-14 — Koreksi Progres oleh Admin

- Admin dapat membuka detail run user dalam organisasinya.
- Admin dapat menandai atau membatalkan item completion.
- Sistem mencatat actor, alasan opsional, waktu, dan perubahan pada audit log.
- Koreksi Admin tidak menghapus riwayat perubahan.

### FR-15 — API AI Agent dan API Key

- Admin dapat membuat, mencabut, dan merotasi API key organisasi.
- Secret API key hanya ditampilkan satu kali saat pembuatan/rotasi.
- Sistem hanya menyimpan hash atau representasi aman key.
- Setiap key memiliki label, waktu dibuat, waktu terakhir digunakan, status, dan scope.
- API wajib memvalidasi organization context, schema, role target, dan schedule.
- Endpoint pembuatan checklist AI menghasilkan draft secara default.
- Request AI dicatat dalam audit log tanpa menyimpan secret.
- API memiliki rate limiting dan response error yang konsisten.

### FR-16 — HTML Import Contract dan System Prompt

- Sistem menyediakan dokumentasi kontrak HTML resmi dengan versi.
- Kontrak minimal mendefinisikan metadata template, target role, schedule opsional, dan item checklist.
- Parser hanya menerima struktur/atribut yang diizinkan dan mengabaikan atau menolak elemen berbahaya.
- HTML disanitasi sebelum diproses maupun ditampilkan pada preview.
- Sistem menyediakan system prompt resmi yang menginstruksikan AI menghasilkan HTML sesuai kontrak versi aktif.
- Hasil import selalu menjadi draft dan harus melalui preview sebelum publish.
- Parser menghasilkan error per field/item agar mudah diperbaiki AI atau Admin.

## 9. Kebutuhan Non-Fungsional

### Keamanan

- Semua otorisasi diterapkan di server.
- Semua input divalidasi di boundary route.
- Query D1 harus parameterized.
- Password menggunakan algoritme hashing yang sesuai Web Crypto/Worker runtime.
- CSRF/origin protection dan security headers diterapkan.
- Tidak membocorkan password hash, token reset, atau data privat ke props frontend.
- Rate limit login dapat menggunakan KV bila diperlukan.
- API key tidak boleh dikirim kembali setelah response pembuatan awal.
- HTML import wajib disanitasi; jangan merender HTML mentah sebagai trusted markup.
- Scheduler wajib idempotent dengan unique key organisasi + schedule + periode + user.

### Performa

- Dashboard utama dapat dimuat dengan jumlah query yang wajar.
- Daftar user, template, dan riwayat menggunakan pagination ketika data membesar.
- Perubahan item harus terasa responsif dan memberi status saving/saved/error.

### Aksesibilitas

- Navigasi keyboard tersedia.
- Checkbox memiliki label yang jelas.
- Kontras teks dan status memenuhi standar WCAG AA sejauh memungkinkan.
- Error validasi terkait langsung dengan field.
- Status tidak hanya dibedakan dengan warna.

### Responsif

- Mobile-first untuk eksekusi checklist.
- Desktop-friendly untuk administrasi template dan monitoring.
- Breakpoint dan token visual ditentukan dalam design system proyek.

### Bahasa dan format

- UI utama Bahasa Indonesia.
- Format tanggal mengikuti locale Indonesia.
- Istilah status konsisten di seluruh UI.

## 10. Struktur Halaman MVP

### Public/auth

- `/login`
- `/register`
- `/organizations/new`
- `/logout` sebagai action route

### User

- `/dashboard`
- `/checklists`
- `/checklists/:id`
- `/history`
- `/profile` bila dibutuhkan untuk perubahan data dasar
- `/organizations/switch`

### Admin

- `/admin`
- `/admin/users`
- `/admin/roles`
- `/admin/checklists`
- `/admin/checklists/new`
- `/admin/checklists/:id/edit`
- `/admin/activity`
- `/admin/api-keys`
- `/admin/import-html`
- `/admin/schedules`

## 11. Model Data Konseptual

Entitas utama yang disarankan:

- `users`
- `organizations`
- `organization_memberships`
- `roles` (terikat organization)
- `membership_roles` atau `organization_memberships.role_id`, dengan pilihan akhir mempertahankan ekspansi multi-role.
- `checklist_templates`
- `checklist_items`
- `checklist_template_roles`
- `checklist_runs`
- `checklist_item_completions`
- `audit_logs`
- `api_keys`
- `ai_imports`
- `checklist_schedules`
- `schedule_runs` atau metadata periode pada `checklist_runs`
- `sessions` atau penyimpanan session sesuai keputusan implementasi Kilat

Relasi penting:

- Satu organization memiliki banyak membership, role, template, schedule, dan audit log.
- Satu user dapat memiliki membership di banyak organization.
- Satu role memiliki banyak membership user.
- Satu template memiliki banyak item.
- Satu template dapat ditetapkan ke banyak role.
- Satu user dapat memiliki banyak checklist run.
- Satu checklist run memiliki banyak completion record.
- Riwayat tidak hilang ketika template atau assignment diarsipkan.
- Satu periode schedule tidak boleh membuat lebih dari satu run per user target.
- API key dan import AI selalu terikat pada satu organization.

## 12. Acceptance Criteria MVP

1. Admin dapat login dengan akun valid.
2. User tidak dapat mengakses halaman Admin.
3. Admin dapat membuat role dan user.
4. Admin dapat membuat template dengan item dan menetapkannya ke role.
5. Template draft tidak terlihat oleh user.
6. Template published terlihat hanya oleh user dengan role yang sesuai.
7. User dapat mencentang item dan progres tersimpan setelah refresh/login ulang.
8. User dapat membatalkan centang item.
9. Checklist otomatis berubah menjadi completed ketika seluruh item aktif selesai.
10. User hanya dapat melihat riwayat miliknya.
11. Admin dapat melihat progres seluruh user.
12. Template archived tidak muncul sebagai checklist baru.
13. Akses langsung ke endpoint/URL tanpa izin ditolak dengan response yang sesuai.
14. Database dapat dibuat dari migration bersih di lingkungan lokal.
15. Aplikasi lolos build, typecheck, test, lint, dan pemeriksaan route utama lokal.
16. User dapat mendaftar dan membuat organization pertama sebagai Admin.
17. User dapat memiliki role berbeda di beberapa organization tanpa kebocoran data.
18. Schedule menghasilkan satu run per user target pada periode yang benar menurut timezone organization.
19. Retry scheduler tidak menggandakan run.
20. Admin dapat mengoreksi progres user dan perubahan tercatat di audit log.
21. API key hanya terlihat sekali dan key yang dicabut tidak dapat digunakan.
22. AI API dapat membuat draft checklist terikat organization.
23. HTML sesuai kontrak dapat dipreview dan disimpan sebagai draft; HTML berbahaya ditolak/disanitasi.

## 13. Asumsi Produk

- MVP mendukung banyak organization dengan isolasi data yang ketat.
- Satu user dapat memiliki membership pada banyak organization dan role berbeda pada masing-masing organization.
- User yang mendaftar dapat membuat organization pertama dan otomatis menjadi Admin.
- Keanggotaan organisasi tambahan dilakukan melalui undangan email/link dari Admin organisasi.
- Checklist berulang membuat run baru secara otomatis; checklist completed tidak dapat diulang pada periode yang sama.
- Admin boleh mengedit template published; implementasi harus menentukan bagaimana perubahan template berinteraksi dengan run/riwayat yang sudah ada.
- Admin dapat mengoreksi progres user, tetapi koreksi tetap diaudit.
- API AI menggunakan API key per organization dan membuat draft secara default.
- Import HTML menggunakan kontrak format resmi dan system prompt baku yang versioned.
- Tidak ada akses anonim.
- Integrasi eksternal lain di luar API AI dan HTML import belum termasuk.

## 14. Keputusan Produk yang Sudah Ditetapkan

1. User boleh memiliki banyak membership organization dan role berbeda per organization.
2. Checklist dapat berulang otomatis dengan timezone organization.
3. Checklist completed tidak dapat diulang oleh user.
4. Admin boleh mengoreksi progres user.
5. Admin boleh mengedit template published.
6. User mendaftar sendiri dan dapat membuat organization pertama.
7. Multi-organization adalah bagian MVP.
8. AI Agent memakai API key per organization.
9. AI API membuat draft checklist, termasuk role mapping dan schedule.
10. Import HTML menggunakan kontrak resmi dan system prompt baku.
11. User bergabung ke organisasi tambahan melalui undangan email/link.
12. Target checklist berulang dihitung saat jadwal berjalan berdasarkan role aktif saat itu.

## 15. Rekomendasi Tahap Berikutnya

Setelah keputusan pada bagian 14 dikonfirmasi, dokumen berikut dibuat sebagai kontrak implementasi Kilat:

- `docs/product-brief.md`
- `docs/architecture.md`
- `docs/page-map.md`
- `docs/data-model.md`
- `docs/api-routes.md`
- `docs/design-system.md`
- `docs/cloudflare-deployment.md`
- `docs/testing.md`
- `README.md`

Implementasi belum dimulai pada tahap PRD ini. Deployment production dan migrasi remote harus tetap memerlukan persetujuan eksplisit.
