# API Routes — Checklist Generator

## Browser routes
Authentication:
- GET/POST /login
- GET/POST /register
- POST /logout

Organization:
- GET/POST /organizations/new
- GET/POST /organizations/switch

Admin:
- /admin/users
- /admin/roles
- /admin/checklists
- /admin/activity
- /admin/api-keys
- /admin/import-html
- /admin/schedules

User:
- /dashboard
- /checklists
- /checklists/:id
- /history

## AI API v1
Base: /api/v1

POST /checklist-templates
Membuat draft template. API key menentukan organization. Request tidak boleh mengirim organizationId untuk memilih tenant lain.

Planned child operations:
- POST /checklist-templates/:id/items
- POST /checklist-templates/:id/roles
- POST /checklist-templates/:id/schedules

## API authentication
Authorization memakai API key organization. Key memiliki label, status, scope, last-used timestamp, dan hash secret.

## Required request protections
- TypeBox validation pada boundary.
- organization scope berasal dari key.
- rate limiting.
- idempotency key untuk operasi create yang dapat diulang.
- audit tanpa secret.
- parameterized SQL.

## Error shape
JSON API menggunakan bentuk konsisten:
{
  "error": {
    "code": "validation_error",
    "message": "Request tidak valid.",
    "fields": {}
  }
}

HTTP status mengikuti kategori error: 400 malformed, 401 auth, 403 scope/permission, 404 scoped resource, 409 conflict/idempotency, 422 validation, 429 rate limit, 500 unexpected.
