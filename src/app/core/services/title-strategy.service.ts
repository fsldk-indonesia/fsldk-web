import { Injectable, inject } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { Title } from '@angular/platform-browser';

/**
 * Title strategy sentral — route hanya perlu deklarasikan label pendek
 * (mis. `title: 'Dashboard'`), suffix brand ditambahkan otomatis di sini
 * berdasarkan prefix URL (CMS/Portal Kader/publik). Sebelumnya beberapa
 * halaman (contact/structure/gallery) memanggil `Title.setTitle()` manual
 * di `ngOnInit` — karena itu HANYA jalan sekali saat halaman itu dibuka dan
 * tidak pernah direset, tab browser "nyangkut" menampilkan judul halaman
 * CMS terakhir yang dibuka (mis. tetap "Pesan Kontak" walau sudah pindah ke
 * Dashboard) — lihat CmsLayoutComponent (bug ini dilaporkan dari sana).
 *
 * Route yang TIDAK mendeklarasikan `title` sengaja dibiarkan (early return)
 * supaya perilaku halaman publik yang sudah punya `Title.setTitle()` manual
 * sendiri (mis. `contact.public-index.page.ts`) tidak diganggu.
 */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private titleService = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const label = this.buildTitle(snapshot);
    if (!label) return;

    const url = snapshot.url;
    let suffix = 'FSLDK Indonesia';
    if (url.startsWith('/cms')) suffix = 'CMS FSLDK Indonesia';
    else if (url.startsWith('/kader')) suffix = 'Portal Kader FSLDK';

    this.titleService.setTitle(`${label} — ${suffix}`);
  }
}
