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
  users: 'fas fa-users',
  'user-group': 'fas fa-users',
  'shield-check': 'fas fa-user-shield',
  link: 'fas fa-link',
  'calendar-days': 'fas fa-calendar-alt',
  home: 'fas fa-home',
  book: 'fas fa-book',
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
