# Cloudflare Deployment — Checklist Generator

## Bindings
Minimum:
- DB: D1 database.
- ASSETS: Workers Static Assets.

Optional sesuai kebutuhan:
- RATE_LIMIT_KV.
- SESSION_KV.
- AVATARS/R2 bila fitur avatar dipertahankan.

## Environments
Local, staging, production memiliki binding/ID masing-masing. Account ID, database ID, namespace ID, domain, dan secret tidak ditaruh di dokumentasi publik atau ditebak.

## Migration order
Migration selalu dijalankan berdasarkan nomor file. Remote migration adalah mutation production dan membutuhkan approval eksplisit.

## Secrets
Secret hanya melalui Cloudflare secret/config mechanism. Jangan commit API key, OAuth secret, mail credential, token, atau DB credential.

## Deployment gate
Sebelum production:
1. build/typecheck/lint/test PASS.
2. migration plan dan rollback dipahami.
3. target commit diketahui.
4. approval deploy eksplisit.
5. setelah deploy: runtime identity, health, external HTTP, dan changed-flow smoke diverifikasi.

Code merge tidak otomatis berarti deployment disetujui.
