# Testing — Checklist Generator

## Verification ladder
L1 Static:
- bun run build
- bun run typecheck
- bun run lint
- focused diff review

L2 Targeted:
- unit/feature test terdekat dengan perubahan
- regression test untuk bug

L3 Boundary:
- organization isolation
- auth/permission
- database integrity
- scheduler/API idempotency
- HTML sanitization

L4 Broader:
- bun run test
- related integration suite

L5 Runtime:
Hanya setelah deployment atau local server tersedia: HTTP dan changed-flow smoke.

## Mandatory high-value tests
- user organization A tidak dapat membaca/mutasi organization B
- draft template tidak muncul ke user
- role assignment membatasi checklist
- run user lain tidak dapat dibuka
- completion idempotent
- scheduler retry tidak menggandakan run
- revoked API key ditolak
- malicious HTML tidak menjadi trusted markup

## Repository commands
Gunakan bun run test, bukan plain bun test, karena script repository sudah memakai --isolate.

## Status
PASS hanya dengan direct evidence. Tanpa execution evidence, gunakan NOT VERIFIED.
