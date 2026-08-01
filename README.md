# FSLDK Web (`fsldk-web`)

Frontend Website FSLDK Indonesia, dibangun dengan **Angular 19 (standalone)** dan **SCSS**, mengikuti [Technical Specification](../.claude/techspec/Technical%20Specification%20-%20FSLDK%20Website.md) serta design system resmi FSLDK (hijau `#00933b`, Poppins + Manrope).

## Struktur

```
src/
├── styles.scss              # Design system global (token warna, tipografi, komponen)
├── environments/            # environment.ts / environment.prod.ts
└── app/
    ├── core/
    │   ├── models/          # Tipe data & amplop response API
    │   ├── services/        # api, auth, toast, menu, news, user, role, content, dashboard
    │   ├── interceptors/    # auth (Bearer), error (global)
    │   └── guards/          # auth, login, verified, permission
    ├── shared/              # Komponen reusable (toast)
    ├── layouts/             # public, auth, cms (sidebar menu dinamis)
    └── pages/
        ├── public/          # home, about, news-list, news-detail, contact
        ├── auth/            # login, register, verify-email, forgot-password
        └── cms/             # dashboard, users, roles, news-management, news-form
```

## Prasyarat

- Node.js 20+ / 22+
- Backend `fsldk-api` berjalan di `http://localhost:8080`

## Menjalankan

```bash
npm install
npm start           # ng serve → http://localhost:4200
```

Konfigurasi API diatur pada `src/environments/environment.ts` (`apiBaseUrl`).

## Fitur Utama

| Area | Halaman |
|---|---|
| Publik | Beranda, Tentang (visi/misi/struktur), Berita (list + filter), Detail Berita, Kontak |
| Autentikasi | Login, **Registrasi mandiri**, **Verifikasi Email**, Lupa Password |
| CMS | Dashboard (statistik), Manajemen Pengguna, Manajemen Role (permission), Manajemen Berita, Form Berita |

## Arsitektur Frontend

- **Standalone components** + lazy-loaded routes.
- **Signals** untuk state komponen; `AuthService` menyimpan sesi & profil.
- **Sidebar CMS dinamis**: item menu diambil dari `GET /me/menus` sesuai permission role (Dashboard selalu tampil / hardcode), mengikuti TechSpec.
- **Guard berlapis**: `authGuard` → `verifiedGuard` → `permissionGuard`.
- **Interceptor**: menyisipkan Bearer token & menangani error global (401 → login, 403 `EMAIL_NOT_VERIFIED` → halaman verifikasi).

## Build Produksi

```bash
npm run build       # output: dist/fsldk-web
```
