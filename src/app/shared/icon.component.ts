import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

/** name -> kelas Font Awesome (set "fas", gratis) — dipilih mengikuti gaya
 *  ikon yang sudah dipakai di ldksyahid-app (mis. fa-tachometer-alt untuk
 *  Dashboard, fa-newspaper untuk Berita, fa-users untuk Pengguna). `name`
 *  untuk item menu CMS juga cocok dengan `menuIcon` yang sudah dikirim
 *  backend (lk_permission.menuIcon: newspaper, file-text, users,
 *  shield-check, link). */
const ICONS: Record<string, string> = {
  dashboard: 'fas fa-tachometer-alt',
  newspaper: 'fas fa-newspaper',
  'file-text': 'fas fa-file-alt',
  'file-spreadsheet': 'fas fa-file-excel',
  download: 'fas fa-download',
  users: 'fas fa-users',
  'user-group': 'fas fa-users',
  'shield-check': 'fas fa-user-shield',
  link: 'fas fa-link',
  'calendar-days': 'fas fa-calendar-alt',
  calendar: 'fas fa-calendar-alt',
  home: 'fas fa-home',
  book: 'fas fa-book',
  'book-open': 'fas fa-book-open',
  heart: 'fas fa-heart',
  globe: 'fas fa-globe',
  'empty-box': 'fas fa-box-open',
  error: 'fas fa-exclamation-triangle',
  search: 'fas fa-search',
  guest: 'fas fa-user',
  'user-plus': 'fas fa-user-plus',
  'log-in': 'fas fa-sign-in-alt',
  'log-out': 'fas fa-sign-out-alt',
  // Ikon merek (butuh set "fab", bukan "fas") — dipakai untuk tautan media sosial di footer.
  instagram: 'fab fa-instagram',
  facebook: 'fab fa-facebook',
  tiktok: 'fab fa-tiktok',
  'x-twitter': 'fab fa-x-twitter',
  youtube: 'fab fa-youtube',
  whatsapp: 'fab fa-whatsapp',
  // Dipakai toast & dialog konfirmasi (app-toast, app-alert-dialog).
  'check-circle': 'fas fa-circle-check',
  'x-circle': 'fas fa-circle-xmark',
  'info-circle': 'fas fa-circle-info',
  'alert-triangle': 'fas fa-triangle-exclamation',
  'help-circle': 'fas fa-circle-question',
  trash: 'fas fa-trash-can',
  // Aksi tabel CMS (app-icon di tombol ikon Edit/Publish/Salin).
  edit: 'fas fa-pen',
  eye: 'fas fa-eye',
  'eye-off': 'fas fa-eye-slash',
  copy: 'fas fa-copy',
  // Menu modul organization/submission/report (menuIcon dari lk_permission).
  building: 'fas fa-building',
  'building-2': 'fas fa-city',
  landmark: 'fas fa-landmark',
  'file-sliders': 'fas fa-sliders-h',
  'clipboard-list': 'fas fa-clipboard-list',
  'list-checks': 'fas fa-list-check',
  'user-check': 'fas fa-user-check',
  'clipboard-check': 'fas fa-clipboard-check',
  award: 'fas fa-award',
  megaphone: 'fas fa-bullhorn',
  'file-bar-chart': 'fas fa-chart-column',
  'chevron-down': 'fas fa-chevron-down',
  'chevrons-up-down': 'fas fa-sort',
  'arrow-left': 'fas fa-arrow-left',
  info: 'fas fa-circle-info',
  settings: 'fas fa-gear',
  lock: 'fas fa-lock',
  'id-card': 'fas fa-id-card',
  phone: 'fas fa-phone',
  'user-circle': 'fas fa-circle-user',
  // Antrian permintaan shortlink (app-shortlinkrequest-index-page) & App Settings.
  clock: 'fas fa-clock',
  check: 'fas fa-check',
  x: 'fas fa-xmark',
  // Sidebar info halaman pengajuan shortlink publik (Cara Penggunaan).
  list: 'fas fa-list-ul',
  // Dashboard Job Queue (sidebar menuIcon + aksi retry).
  refresh: 'fas fa-rotate-right',
  // Navbar "Layanan" dropdown — Kalkulator Zakat.
  calculator: 'fas fa-calculator',
  // Navbar "Tentang Kami" dropdown & Modul Struktur, Galeri, Kontak.
  sitemap: 'fas fa-sitemap',
  photo: 'fas fa-images',
  images: 'fas fa-images',
  image: 'fas fa-image',
  messages: 'fas fa-envelope',
  envelope: 'fas fa-envelope',
  comments: 'fas fa-comments',
  'zoom-in': 'fas fa-search-plus',
  plus: 'fas fa-plus',
  inbox: 'fas fa-inbox',
  star: 'fas fa-star',
  mosque: 'fas fa-mosque',
};

/**
 * Pembungkus tipis di atas Font Awesome Free (dipasang lewat angular.json,
 * bukan komponen Angular per-ikon) — dipakai di sidebar CMS, navbar publik,
 * dropdown akun, dan empty/error state, supaya satu nama ikon ("newspaper",
 * "users", dst.) dipakai lewat satu API yang sama tanpa mengulang nama
 * kelas "fas fa-..." di tiap komponen.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [NgClass],
  template: `<i [ngClass]="faClass" [style.fontSize.px]="size" aria-hidden="true"></i>`,
})
export class IconComponent {
  @Input() set name(value: string) { this.faClass = ICONS[value] ?? 'fas fa-circle-question'; }
  @Input() size = 16;

  faClass = 'fas fa-circle-question';
}
