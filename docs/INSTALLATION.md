# Panduan Instalasi — FSLDK Web

[← Kembali ke README](../README.md) · [Lihat Arsitektur & Alur Sistem →](./ARCHITECTURE.md)

Panduan ini menjelaskan langkah lengkap menyiapkan dan menjalankan `fsldk-web` dari nol, mulai dari prasyarat hingga verifikasi aplikasi berjalan di browser.

---

## 1. Prasyarat

| Kebutuhan | Versi | Keterangan |
|---|---|---|
| **Node.js** | 20+ atau 22+ | `node -v` untuk memeriksa |
| **npm** | Bawaan Node.js | `npm -v` untuk memeriksa |
| **Backend `fsldk-api`** | — | Harus berjalan (default `http://localhost:8080`) — lihat panduan instalasi di repositori `fsldk-api` |
| **Google OAuth Client ID** | — | Opsional, hanya diperlukan bila fitur "Masuk/Daftar dengan Google" diaktifkan |

> `fsldk-web` dan `fsldk-api` adalah dua repositori terpisah yang di-deploy independen. Pastikan `fsldk-api` sudah menyala dan sudah memiliki akun Admin FSLDK (dibuat otomatis via migration) sebelum menguji login di aplikasi ini.

---

## 2. Kloning & Masuk ke Direktori

```bash
cd C:/Apache24/htdocs/fsldk-app-web/fsldk-web
```

---

## 3. Instal Dependensi

```bash
npm install
```

---

## 4. Konfigurasi Environment

Konfigurasi frontend **tidak** memakai berkas `.env` — melainkan dua berkas TypeScript di [`src/environments/`](../src/environments):

| Berkas | Dipakai Saat | Isi |
|---|---|---|
| `environment.ts` | `npm start` (development) | `apiBaseUrl` mengarah ke backend lokal |
| `environment.prod.ts` | `npm run build` (production, via `fileReplacements` di `angular.json`) | `apiBaseUrl` relatif (`/api/v1`) — asumsinya API di-reverse-proxy satu origin dengan frontend |

Sesuaikan `src/environments/environment.ts` bila backend tidak berjalan di `localhost:8080`:

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api/v1',
  appName: 'FSLDK Indonesia',
  requestTimeout: 30000,
  googleClientId: '', // isi bila login Google diaktifkan — lihat §5
};
```

---

## 5. (Opsional) Konfigurasi Google OAuth

Diperlukan agar tombol "Masuk/Daftar dengan Google" aktif (tanpa ini, tombol tetap tampil tapi menampilkan pesan info dan tidak memicu login).

1. Buat kredensial **OAuth 2.0 Client ID** (tipe *Web application*) di [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Tambahkan origin frontend (mis. `http://localhost:4200`) ke **Authorized JavaScript origins**.
3. Isi `googleClientId` pada `environment.ts` (dan `environment.prod.ts` untuk build produksi) dengan Client ID tersebut.
4. Pastikan `GOOGLE_CLIENT_ID` pada backend `fsldk-api` diisi dengan **Client ID yang sama** — verifikasi ID Token dilakukan di sisi backend.

---

## 6. Jalankan Development Server

```bash
npm start
# alias untuk: ng serve
```

Buka **http://localhost:4200**. Perubahan kode otomatis memicu rebuild + reload browser (hot reload bawaan Angular CLI).

> Pastikan `fsldk-api` sudah berjalan di `http://localhost:8080` (§1) — tanpa ini, seluruh pemanggilan data (berita, login, dsb.) akan gagal dengan error koneksi di console browser.

---

## 7. Verifikasi Aplikasi Berjalan

1. Buka `http://localhost:4200` — halaman Beranda publik harus tampil (hero + daftar berita, kosong bila backend belum ada data).
2. Buka `http://localhost:4200/login`, masuk dengan kredensial Admin FSLDK bawaan dari backend:

   | Field | Nilai |
   |---|---|
   | **Email** | `noreply-fsldk@gmail.com` |
   | **Password** | `abc123` |

   *(Kredensial ini didefinisikan di sisi backend `fsldk-api` — lihat panduan instalasi repositori tersebut. Wajib diganti setelah login pertama di lingkungan produksi.)*
3. Setelah login berhasil, Anda akan diarahkan ke `/cms/dashboard` dengan sidebar menu yang terisi otomatis sesuai permission role Admin.

---

## 8. Build untuk Produksi

```bash
npm run build
# output: dist/fsldk-web/browser
```

Build produksi otomatis memakai `environment.prod.ts` (`apiBaseUrl: '/api/v1'`) — asumsinya aplikasi di-deploy di belakang reverse proxy (mis. Nginx/Apache) yang meneruskan `/api/v1/*` ke backend `fsldk-api` pada origin yang sama dengan file statis frontend. Sesuaikan `apiBaseUrl` di `environment.prod.ts` bila topologi deployment Anda berbeda (mis. backend di subdomain terpisah — pastikan CORS di `fsldk-api` mengizinkan origin frontend).

Hasil build adalah berkas statis murni (`dist/fsldk-web/browser/`) — sajikan dengan web server statis apa pun (Nginx, Apache, Vercel, dsb.), dengan fallback semua rute ke `index.html` (single-page application).

---

## Pemecahan Masalah (Troubleshooting)

| Gejala | Kemungkinan Penyebab | Solusi |
|---|---|---|
| Halaman kosong / error jaringan di console | `fsldk-api` belum berjalan atau `apiBaseUrl` salah | Pastikan backend aktif di `http://localhost:8080`, cek `environment.ts` |
| Login gagal padahal kredensial benar | Backend belum menjalankan migration seed admin | Cek log `fsldk-api` saat start, pastikan `0003_seed_admin.up.sql` diterapkan |
| CORS error di console browser | Origin frontend tidak diizinkan backend | Tambahkan `http://localhost:4200` ke `CORS_ALLOWED_ORIGINS` pada `app.env` backend |
| Tombol Google tidak muncul / hanya placeholder | `googleClientId` kosong di `environment.ts` | Isi sesuai §5 |
| Login Google gagal (`401`) | Client ID di frontend & backend tidak sama, atau domain email tidak diizinkan | Samakan `googleClientId` (frontend) dengan `GOOGLE_CLIENT_ID` (backend); cek `GOOGLE_ALLOWED_DOMAINS` |
| Sidebar CMS kosong setelah login | Role pengguna belum memiliki permission apa pun | Cek penetapan permission role di menu Manajemen Role (`/cms/roles`) |

---

[← Kembali ke README](../README.md) · [Lihat Arsitektur & Alur Sistem →](./ARCHITECTURE.md)
