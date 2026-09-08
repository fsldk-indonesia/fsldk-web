# FSLDK Web (`fsldk-web`)

[![CI](https://github.com/fsldk-indonesia/fsldk-web/actions/workflows/ci.yml/badge.svg)](https://github.com/fsldk-indonesia/fsldk-web/actions/workflows/ci.yml)
[![Deploy](https://github.com/fsldk-indonesia/fsldk-web/actions/workflows/deploy.yml/badge.svg)](https://github.com/fsldk-indonesia/fsldk-web/actions/workflows/deploy.yml)

Frontend Website FSLDK Indonesia, dibangun dengan **Angular 19 (standalone components)** dan **SCSS**, mengikuti design system resmi FSLDK (hijau `#00933b`, tipografi Poppins + Manrope). Mengonsumsi REST API dari backend `fsldk-api` (repositori terpisah).

📖 **Dokumentasi lengkap:**

| Dokumen | Isi |
|---|---|
| [**docs/INSTALLATION.md**](./docs/INSTALLATION.md) | Panduan instalasi langkah-demi-langkah — prasyarat, konfigurasi environment, menjalankan dev server, **kredensial Admin FSLDK**, Google OAuth, build produksi, troubleshooting |
| [**docs/ARCHITECTURE.md**](./docs/ARCHITECTURE.md) | Penjelasan arsitektur & alur sistem — pola modul fitur, pola MVP (Presenter/View), sesi & autentikasi, routing, sidebar CMS dinamis |

---

## Ringkasan Cepat

Arsitektur **modul fitur + MVP**: setiap fitur punya folder sendiri di `src/app/modules/<nama>/` (`entities/`, `services/`, `repositories/`, `pages/<halaman>/`), dan setiap halaman dipecah jadi `page.ts` (View) + `page.html` (template) + `presenter.ts` (seluruh logika & state) + `view.ts` (kontrak Presenter↔Page).

```
Route → Page (implements View) → Presenter → Repository → ApiService (HTTP) → FSLDK API
```

Penjelasan detail struktur modul, pola MVP, dan diagram alur permintaan ada di **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)**.

## Struktur Direktori

```
src/
├── styles.scss              # Design system global (token warna, tipografi, komponen bersama)
├── environments/             # environment.ts (dev) / environment.prod.ts (build produksi)
└── app/
    ├── core/                 # Infrastruktur lintas-aplikasi
    │   ├── entities/         # Tipe generik: amplop response API, paginasi
    │   ├── services/         # api.service (HTTP client bersama), toast.service
    │   ├── interceptors/     # auth (Bearer token), error (global 401/403)
    │   ├── guards/           # auth, login, verified, permission
    │   └── mvp/              # base.presenter.ts — plumbing attachView() bersama
    ├── modules/               # Satu folder per fitur — lihat docs/ARCHITECTURE.md §2
    │   │                       #   (~29 modul saat ini, daftar di bawah bukan exhaustive —
    │   │                       #   jalankan `ls src/app/modules/` untuk daftar aktual)
    │   ├── auth/              # Halaman login, daftar, verifikasi email, lupa/reset password
    │   ├── user/              # Sesi (AuthRepository) + manajemen pengguna CMS
    │   ├── role/              # Manajemen role & permission
    │   ├── permission/        # Menu sidebar dinamis
    │   ├── news/               # Berita — publik & CMS
    │   ├── article/            # Artikel — publik & CMS
    │   ├── event/               # Event — publik & CMS
    │   ├── catalogbook/         # Perpustakaan/katalog buku — publik & CMS
    │   ├── financeformat/       # Format Keuangan (unduhan dokumen) — publik & CMS
    │   ├── goods/               # FSLDK Goods (katalog produk, bukan e-commerce) — publik & CMS
    │   ├── schedule/            # Jadwal kegiatan — publik & CMS
    │   ├── structure/           # Struktur Organisasi (arsip kepengurusan per periode) — CMS
    │   ├── gallery/             # Galeri foto per album — publik & CMS
    │   ├── contact/             # Kotak masuk pesan "Hubungi Kami" (bukan Kontak Beranda) — CMS
    │   ├── subscription/        # Newsletter/subscriber — publik & CMS
    │   ├── statistic/           # Statistik jaringan nasional — publik-only
    │   ├── zakat/               # Kalkulator zakat — publik-only, kalkulasi di browser
    │   ├── dynamicform/         # Formulir Dinamis — form builder ad-hoc generik
    │   ├── comment/             # Komentar lintas-modul (widget publik + moderasi CMS)
    │   ├── shortlink/          # Manajemen shortlink (pemendek URL) CMS + pengajuan publik
    │   ├── kantong-amal/        # Crowdfunding donasi (memetakan 4 modul backend, lihat ARCHITECTURE.md)
    │   ├── setting/             # App Settings CMS, Superadmin-only
    │   ├── jobqueue/            # Monitoring antrian WhatsApp/email, Superadmin-only
    │   ├── dashboard/          # Ringkasan statistik CMS, tier-aware (§7 ARCHITECTURE.md)
    │   ├── organization/        # Hierarki LDK/Puskomda/Puskomnas + organization switcher
    │   ├── submission-form/     # Form builder khusus Levelisasi LDK & Sensus Kader
    │   ├── submission/          # Pengisian/status/review pendataan
    │   ├── report/              # Laporan Wilayah/Nasional — ekspor Excel/CSV
    │   └── home/               # Beranda — hero, berita terbaru, Tentang & Kontak (hardcoded)
    │                           #   (Tentang & Kontak Beranda sengaja tidak jadi modul/rute
    │                           #   terpisah — kontennya statis; JANGAN disamakan dengan
    │                           #   modul `structure`/`contact` di atas — beda tujuan)
    ├── layouts/               # public (+ auth bersarang di dalamnya), cms (4 tier — lihat
    │                           #   ARCHITECTURE.md §6/§7), kader (portal self-service Kader)
    ├── shared/                # Komponen reusable lintas-modul (toast, google-button, cms-tier.ts, dst.)
    └── app.routes.ts          # Mengagregasi <modul>.routes.ts tiap modul di bawah 4 layout shell
```

## Menjalankan Cepat

```bash
npm install
npm start           # ng serve → http://localhost:4200 (backend fsldk-api harus berjalan di :8080)
```

Langkah lengkap + konfigurasi Google OAuth + kredensial Admin FSLDK ada di **[docs/INSTALLATION.md](./docs/INSTALLATION.md)**.

## Fitur Utama

| Area | Halaman |
|---|---|
| **Publik** | Beranda (hero, berita terbaru, Tentang — visi/misi, Kontak — semuanya satu halaman), Berita, Artikel, Event, Perpustakaan, Format Keuangan, FSLDK Goods, Jadwal Kegiatan, Galeri, Struktur Organisasi, Kalkulator Zakat, Kantong Amal (donasi + status pembayaran + resi), Formulir Dinamis (isi/submit), Newsletter (langganan), Kontak (kirim pesan), Statistik Jaringan, Peta Silaturahmi |
| **Autentikasi** | Login (email/password + Google), Registrasi mandiri (+ Google), Verifikasi Email, Lupa Password, Reset Password |
| **Kader** (portal self-service ringkas, `/kader`) | Pendataan (isi/status Sensus Kader), Persetujuan Kader (LDK), Profil LDK |
| **CMS** (4 tier — Portal Admin `/cms`, Portal LDK `/cms-ldk`, Portal Puskomda `/cms-puskomda`, Portal Puskomnas `/cms-puskomnas`, lihat [docs/ARCHITECTURE.md §7](./docs/ARCHITECTURE.md#7-shell-cms-ber-tier-menu-sidebar-dinamis--organization-switcher)) | Dashboard (statistik tier-aware), Pengguna, Role & Permission, Berita/Artikel/Event/Perpustakaan/Format Keuangan/Goods/Jadwal/Galeri + form masing-masing, Struktur Organisasi, Kontak (kotak masuk), Newsletter, Formulir Dinamis (builder), Kantong Amal (campaign/donasi/penarikan/laporan), Shortlink + Permintaan Shortlink, App Settings, Job Queue, Komentar (moderasi), Organisasi (profil/daftar wilayah), Form Builder Pendataan, Pendataan & Review, Laporan Wilayah/Nasional |

## Konsep Autentikasi

Password lokal (wajib verifikasi email) & Google OAuth (auto-link/auto-provision, langsung terverifikasi) dapat dimiliki bersamaan oleh satu akun — mengikuti konsep dual-login backend `fsldk-api`. Sesi disimpan & diorkestrasi oleh `AuthRepository` (`modules/user`), satu-satunya sumber kebenaran status login di seluruh aplikasi. Detail alur di **[docs/ARCHITECTURE.md §5](./docs/ARCHITECTURE.md#5-sesi--autentikasi)**.

## Rute Utama

| Grup | Contoh Rute |
|---|---|
| Publik | `/` (Beranda — termasuk section Tentang & Kontak), `/berita`, `/berita/:slug`, `/artikel`, `/artikel/:slug`, `/kalkulator-zakat`, `/kantong-amal`, dst. — satu route tree per modul, lihat `<modul>.routes.ts` |
| Autentikasi | `/login`, `/daftar`, `/verifikasi-email`, `/lupa-password`, `/reset-password` |
| Kader | `/kader/pendataan`, `/kader/status`, dst. — portal terpisah (`KaderLayoutComponent`) |
| CMS — 4 shell terpisah, komponen sama (`CmsLayoutComponent`), tier dari route `data` (lihat [docs/ARCHITECTURE.md §6](./docs/ARCHITECTURE.md#6-routing--lazy-loading)) | `/cms/dashboard` (Portal Admin/FSLDK) · `/cms-ldk/dashboard` (Portal LDK) · `/cms-puskomda/dashboard` (Portal Puskomda) · `/cms-puskomnas/dashboard` (Portal Puskomnas) — modul non-tier (news/users/roles/dst.) hanya terpasang di `/cms/*`; modul tier-aware (dashboard/organizations/submissions/reports) terpasang di shell yang relevan |
| Shortlink | `/:key` — catch-all publik, resolve & redirect ke `destinationURL` (lihat [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md#rute-catch-all-key-redirect-shortlink)) |

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm start` | Menjalankan dev server (`ng serve`) |
| `npm run build` | Build produksi → `dist/fsldk-web` |
| `npm run watch` | Build mode development dengan watch |
| `npm test` | Menjalankan unit test (Karma/Jasmine) |
