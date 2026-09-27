import { environment } from '../../../environments/environment';

/** Resolusi imagePath yang disimpan backend (nama file relatif seperti
 *  "<token>.<ext>", atau path lama diawali "/") menjadi URL publik penuh.
 *  URL absolut (http/https/data:) dikembalikan apa adanya. Satu-satunya
 *  sumber logika ini — sebelumnya disalin manual di gallery.public-index,
 *  gallery.public-detail, gallery-lightbox, dan home.index. */
export function resolveImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const base = environment.apiBaseUrl.replace('/api/v1', '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/uploads/${path}`;
}

/** Varian thumbnail (lebih kecil, di-generate backend saat upload — lihat
 *  fsldk-api/pkg/upload/resize.go) untuk grid/card view, supaya tidak semua
 *  card meng-load gambar resolusi penuh sekaligus. Cukup sisip "_thumb"
 *  sebelum ekstensi — konvensi penamaan yang sama dipakai backend
 *  (thumbFileName di pkg/upload). Lightbox/detail penuh tetap pakai
 *  resolveImageUrl() — cuma satu foto ditampilkan sekaligus di sana. */
export function resolveThumbnailUrl(path: string): string {
  const full = resolveImageUrl(path);
  if (!full) return '';
  const dot = full.lastIndexOf('.');
  if (dot === -1) return full;
  return `${full.slice(0, dot)}_thumb${full.slice(dot)}`;
}
