# FSLDK Web (`fsldk-web`)

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
    │   ├── auth/              # Halaman login, daftar, verifikasi email, lupa/reset password
    │   ├── user/              # Sesi (AuthRepository) + manajemen pengguna CMS
    │   ├── role/              # Manajemen role & permission
    │   ├── permission/        # Menu sidebar dinamis
    │   ├── news/               # Berita — publik & CMS
    │   ├── article/            # Artikel — publik & CMS
    │   ├── content/            # Konten Landing Page & struktur organisasi CMS
    │   ├── dashboard/          # Ringkasan statistik CMS
    │   ├── home/ about/ contact/  # Halaman publik lain
    │   └── ...
    ├── layouts/               # public, auth, cms (sidebar menu dinamis)
    ├── shared/                # Komponen reusable lintas-modul (toast, google-button)
    └── app.routes.ts          # Mengagregasi <modul>.routes.ts tiap modul di bawah 3 layout shell
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
| **Publik** | Beranda, Tentang (visi/misi/struktur organisasi), Berita (list + filter + pagination), Detail Berita, Artikel (list + filter), Detail Artikel, Kontak |
| **Autentikasi** | Login (email/password + Google), Registrasi mandiri (+ Google), Verifikasi Email, Lupa Password, Reset Password |
| **CMS** | Dashboard (statistik), Manajemen Pengguna, Manajemen Role & Permission, Manajemen Berita + Form, Manajemen Artikel + Form, Konten Landing Page + Struktur Organisasi |

## Konsep Autentikasi

Password lokal (wajib verifikasi email) & Google OAuth (auto-link/auto-provision, langsung terverifikasi) dapat dimiliki bersamaan oleh satu akun — mengikuti konsep dual-login backend `fsldk-api`. Sesi disimpan & diorkestrasi oleh `AuthRepository` (`modules/user`), satu-satunya sumber kebenaran status login di seluruh aplikasi. Detail alur di **[docs/ARCHITECTURE.md §5](./docs/ARCHITECTURE.md#5-sesi--autentikasi)**.

## Rute Utama

| Grup | Contoh Rute |
|---|---|
| Publik | `/`, `/tentang`, `/berita`, `/berita/:slug`, `/artikel`, `/artikel/:slug`, `/kontak` |
| Autentikasi | `/login`, `/daftar`, `/verifikasi-email`, `/lupa-password`, `/reset-password` |
| CMS | `/cms/dashboard`, `/cms/users`, `/cms/roles`, `/cms/news`, `/cms/news/form(/:id)`, `/cms/articles`, `/cms/articles/form(/:id)`, `/cms/contents` |

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm start` | Menjalankan dev server (`ng serve`) |
| `npm run build` | Build produksi → `dist/fsldk-web` |
| `npm run watch` | Build mode development dengan watch |
| `npm test` | Menjalankan unit test (Karma/Jasmine) |
