# Data Model — Checklist Generator

## Identity
users
Akun global. Email unik. Password hash tidak pernah keluar ke client.

sessions
Session login. Menyimpan hash token, user, expiry, flash, dan organization aktif.

## Organization
organizations
Workspace terisolasi. Field utama: id, name, slug, timezone, status, creator, timestamps.

organization_memberships
Relasi user ke organization. Membership memiliki status aktif/inaktif.

roles
Role operasional milik organization. Nama unik per organization. Admin dibuat sebagai system role pertama organisasi.

membership_roles
Many-to-many membership ke role agar satu user dapat memiliki beberapa role dalam organization.

## Checklist
checklist_templates
organization scoped. Status draft/published/archived dan version metadata.

checklist_items
Item berurutan milik template, aktif/nonaktif.

checklist_template_roles
Assignment template ke role.

checklist_runs
Eksekusi template untuk satu user. Menyimpan organization, target user, template/version snapshot, status, progress, period key, timestamps.

checklist_item_completions
Completion per run item. Perubahan dibuat idempotent dan dapat diaudit.

## Scheduling
checklist_schedules
Schedule organization/template dengan timezone/rule/status.

Unique idempotency untuk run scheduler minimal organization + schedule + period + user.

## Governance
audit_logs
Event penting dengan organization, actor, action, target, metadata aman, timestamp.

api_keys
Organization-scoped key metadata dan hash secret. Secret plaintext tidak disimpan.

ai_imports
Metadata request/import AI, contract version, validation state, draft linkage, tanpa menyimpan secret.

## Invariants
- Semua entity domain wajib memiliki organization scope langsung atau dapat dibuktikan melalui parent yang scoped.
- Membership unik per organization + user.
- Role name unik per organization.
- Assignment unik per template + role.
- Completion unik per run + item.
- Scheduler run unik per schedule + period + user.
- Archived/inactive data tidak dihapus jika masih dibutuhkan history.
