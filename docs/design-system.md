# Design System — Checklist Generator

## Principles
- Bahasa utama Indonesia.
- Mobile-first untuk menjalankan checklist.
- Desktop-friendly untuk administrasi dan monitoring.
- Reuse token dan primitive yang sudah ada di src/client/styles.css.
- CSS page/component tetap co-located sesuai AGENTS.md.

## Interaction states
Flow penting wajib memiliki state yang relevan:
loading, empty, success, validation error, server error, forbidden, mutation in progress.

## Checklist execution
- Checkbox memiliki label eksplisit dan area tap yang cukup.
- Saving state terlihat tanpa memblokir seluruh halaman bila tidak perlu.
- Progress ditampilkan sebagai angka dan teks, tidak hanya warna.
- Item selesai tetap terbaca dan dapat dibatalkan sesuai izin.

## Forms
- Label selalu terasosiasi ke input.
- Error menempel pada field.
- Submit disabled ketika mutation sedang berlangsung.
- Keyboard navigation dan focus-visible dipertahankan.

## Status vocabulary
Template: Draft, Published, Archived.
Run: In progress, Completed.
Membership/Role/Schedule: Active, Inactive atau Paused sesuai domain.

Status harus konsisten di seluruh UI.
