# Page Map — Checklist Generator

## Public/Auth
- /login
- /register
- /organizations/new
- /logout

## Organization context
- /organizations/switch

## User
- /dashboard
- /checklists
- /checklists/:id
- /history
- /profile

## Admin
- /admin
- /admin/users
- /admin/roles
- /admin/checklists
- /admin/checklists/new
- /admin/checklists/:id/edit
- /admin/activity
- /admin/api-keys
- /admin/import-html
- /admin/schedules

## API
- /api/v1/checklist-templates
- endpoint turunan item/role/schedule mengikuti docs/api-routes.md

## Route ownership
Setiap namespace feature memiliki satu file route sesuai AGENTS.md. pages.routes.ts hanya untuk app shell.
