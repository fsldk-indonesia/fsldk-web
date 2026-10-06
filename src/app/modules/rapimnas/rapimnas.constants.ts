/**
 * Pilihan iconKey untuk field feature card/home card/resource — subset dari
 * set ikon yang SUDAH ADA di `shared/icon.component.ts` (ICONS map), tidak
 * menambah ikon baru sama sekali, sesuai spec. Dirender lewat `<select>`
 * native (lihat Global Constraints), bukan `app-select`/teks bebas.
 */
export const RAPIMNAS_ICON_KEYS: string[] = [
  'hand-heart', 'sitemap', 'calendar-days', 'megaphone', 'star', 'users',
  'book-open', 'map-pin', 'download', 'file-text', 'image', 'external-link',
  'phone', 'mail', 'building', 'award', 'sparkles', 'compass', 'flag',
];
