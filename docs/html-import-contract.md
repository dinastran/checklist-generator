# HTML Import Contract — checklist-html-v1

## Version
Contract version: checklist-html-v1

Semua import menghasilkan template Draft. Import tidak pernah melakukan publish.

## Root
Dokumen harus memiliki satu root:
<section data-checklist-contract="checklist-html-v1">

## Template metadata
Di dalam root:
<header
  data-template-name="Nama checklist"
  data-template-description="Deskripsi opsional">
</header>

data-template-name wajib dan tidak boleh kosong.
Description opsional.

## Target roles
Role ditulis sebagai elemen kosong:
<div data-checklist-role="Nama Role"></div>

Minimal satu role wajib ada saat hasil akan dipublish. Saat import, role yang tidak ditemukan menghasilkan validation error dan tidak dibuat diam-diam.

## Schedule
Schedule opsional:
<div
  data-checklist-schedule="daily|weekly|monthly|custom"
  data-timezone="Asia/Jakarta"
  data-rule="...">
</div>

Timezone harus IANA timezone. data-rule hanya digunakan untuk custom atau detail schedule yang memang dibutuhkan parser.

## Items
Item:
<article
  data-checklist-item
  data-order="1"
  data-title="Judul item"
  data-active="true">
  <p>Instruksi teks opsional.</p>
</article>

Rules:
- data-title wajib.
- data-order integer positif dan unik dalam import.
- data-active hanya true atau false.
- instruction hanya plain text hasil sanitasi.
- minimal satu item aktif dibutuhkan untuk publish.

## Allowed content
Allowed structural tags:
section, header, div, article, p, ul, ol, li, strong, em, span.

Allowed attributes hanya data-checklist-contract, data-template-name, data-template-description, data-checklist-role, data-checklist-schedule, data-timezone, data-rule, data-checklist-item, data-order, data-title, data-active.

## Rejected content
Parser menolak atau membuang:
script, style, iframe, object, embed, form, input, button, link, meta, SVG executable content, event-handler attribute seperti onclick, srcdoc, javascript URL, dan attribute di luar allowlist.

Raw HTML tidak boleh dirender sebagai trusted markup pada preview.

## Validation output
Parser mengembalikan error terstruktur:
- path/field
- code
- message
- item index bila terkait item

Contoh code:
unsupported_contract_version
missing_template_name
unknown_role
invalid_schedule
invalid_timezone
duplicate_item_order
missing_item_title
unsafe_markup

## Valid example
<section data-checklist-contract="checklist-html-v1">
  <header data-template-name="Opening CS" data-template-description="Checklist awal shift"></header>
  <div data-checklist-role="CS"></div>
  <div data-checklist-schedule="daily" data-timezone="Asia/Jakarta"></div>
  <article data-checklist-item data-order="1" data-title="Buka kanal layanan" data-active="true">
    <p>Pastikan seluruh kanal kerja dapat diakses.</p>
  </article>
</section>

## Invalid example
<section data-checklist-contract="checklist-html-v1">
  <script>alert("x")</script>
  <article data-checklist-item data-order="1" data-active="true"></article>
</section>

Invalid karena unsafe markup dan item title tidak ada.
