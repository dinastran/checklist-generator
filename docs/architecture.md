# Architecture — Checklist Generator

## Runtime
- Cloudflare Workers sebagai runtime aplikasi.
- Hono untuk HTTP routing.
- Inertia v3 + React 19 untuk server-driven SPA/SSR.
- D1 sebagai relational database tanpa ORM.
- Workers Static Assets melalui binding ASSETS.
- KV hanya untuk kebutuhan nyata seperti rate limiting/session cache.
- Bun digunakan sebagai package manager dan script runner, bukan runtime production.

## Application boundaries
Request masuk melalui src/worker.ts, lalu initConfig, initDb, initSessionCache, dan app.fetch.

Server tetap mengikuti convention repository:
- route feature: src/server/routes/<feature>.routes.ts
- shared server logic: flat module di src/server
- seluruh SQL/query helper: src/server/db.ts
- schema: migrations/000N_*.sql
- client page: src/client/pages
- page registry: src/client/pages.ts

## Domain isolation
Organization adalah security boundary utama. Setiap query checklist, role, membership, schedule, run, audit, API key, dan AI import harus membawa organizationId atau context membership yang tervalidasi.

Session menyimpan organization aktif. Nilai ini bukan bukti otorisasi sendiri; setiap request domain tetap memvalidasi bahwa user masih memiliki membership aktif pada organization tersebut.

## Auth and authorization
- Session cookie httpOnly, SameSite, secure pada production.
- Authentication tidak sama dengan authorization.
- Guard minimum: requireUser, requireMembership, requireOrganizationAdmin.
- Admin organisasi berasal dari role/membership organization, bukan dari parameter request.
- Akses resource selalu memeriksa organization ownership.

## Checklist versioning
Template memiliki lifecycle draft, published, archived.
Run tidak membaca struktur template mutable secara langsung untuk history. Pada saat run dibuat, sistem menyimpan template version/snapshot metadata yang diperlukan agar perubahan template berikutnya tidak merusak run lama.

## Scheduler
Cron Worker mengevaluasi schedule berdasarkan timezone organization. Unique key minimum:
organization + schedule + period + user.
Retry harus aman dan tidak menggandakan run.

## AI API
API key scoped ke organization dan scope. Draft creation memakai idempotency key, validation boundary, consistent JSON errors, audit tanpa secret, dan rate limiting.

## HTML import
Parser hanya menerima contract version yang dikenali. Raw HTML tidak pernah dianggap trusted markup. Parsing, sanitasi, validation, normalization, preview, lalu save sebagai draft.

## Deployment
Production deployment, remote D1 migration, DNS, dan secret changes berada di luar perubahan code biasa dan membutuhkan approval eksplisit.
