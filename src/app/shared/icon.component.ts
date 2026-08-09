import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

/** name -> kelas Font Awesome (set "fas", gratis) — dipilih mengikuti gaya
 *  ikon yang sudah dipakai di ldksyahid-app (mis. fa-tachometer-alt untuk
 *  Dashboard, fa-newspaper untuk Berita, fa-users untuk Pengguna). `name`
 *  untuk item menu CMS juga cocok dengan `menuIcon` yang sudah dikirim
 *  backend (lk_permission.menuIcon: newspaper, file-text, users,
 *  shield-check, link). */
const ICONS: Record<string, string> = {
  dashboard: 'fa-tachometer-alt',
  newspaper: 'fa-newspaper',
  'file-text': 'fa-file-alt',
  users: 'fa-users',
  'user-group': 'fa-users',
  'shield-check': 'fa-user-shield',
  link: 'fa-link',
  home: 'fa-home',
  book: 'fa-book',
  globe: 'fa-globe',
  'empty-box': 'fa-box-open',
  error: 'fa-exclamation-triangle',
  search: 'fa-search',
  guest: 'fa-user',
  'user-plus': 'fa-user-plus',
  'log-in': 'fa-sign-in-alt',
  'log-out': 'fa-sign-out-alt',
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
  template: `<i class="fas" [ngClass]="faClass" [style.fontSize.px]="size" aria-hidden="true"></i>`,
})
export class IconComponent {
  @Input() set name(value: string) { this.faClass = ICONS[value] ?? 'fa-circle-question'; }
  @Input() size = 16;

  faClass = 'fa-circle-question';
}
