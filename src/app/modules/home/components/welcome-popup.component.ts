import { Component, OnInit, inject } from '@angular/core';
import { WelcomepopupRepository } from '../../welcomepopup/repositories/welcomepopup.repository';

/**
 * Injector generik Welcome Popup untuk halaman Beranda — komponen ini TIDAK
 * tahu apa pun soal "dismiss"/"backdrop"/dst.; semua itu ada di dalam
 * htmlContent/jsContent/cssContent yang diisi Super Admin lewat CMS
 * (/cms/welcome-popup, lihat WelcomepopupFormPage). Tugas komponen ini
 * murni mengambil kontennya lalu menyuntikkannya ke DOM.
 *
 * Template SENGAJA kosong — semua konten disuntik lewat DOM API langsung
 * (bukan binding [innerHTML] Angular), karena:
 * 1. <script> yang ikut ter-parse di dalam innerHTML TIDAK PERNAH dieksekusi
 *    browser (batasan platform, bukan sesuatu yang bisa "diperbaiki" lewat
 *    DomSanitizer) — satu-satunya cara javascript-nya beneran jalan adalah
 *    document.createElement('script') lalu appendChild, seperti di bawah.
 * 2. Konten ini memang sepenuhnya dipercaya (trust boundary-nya adalah
 *    permission welcomepopup.update di CMS, Super Admin only) — mem-bypass
 *    sanitizer Angular pun tidak menambah risiko baru di sini.
 */
@Component({
  selector: 'app-welcome-popup',
  standalone: true,
  template: '',
})
export class WelcomePopupComponent implements OnInit {
  private repo = inject(WelcomepopupRepository);

  ngOnInit(): void {
    this.repo.getPublic().subscribe({
      next: (popup) => {
        if (!popup.isEnabled || !popup.htmlContent?.trim()) return;
        this.inject(popup.htmlContent, popup.cssContent, popup.jsContent);
      },
      error: () => {},
    });
  }

  private inject(html: string, css: string, js: string): void {
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap);

    if (css?.trim()) {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    }
    if (js?.trim()) {
      const script = document.createElement('script');
      script.textContent = js;
      document.body.appendChild(script);
    }
  }
}
