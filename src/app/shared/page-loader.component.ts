import { Component, Input } from '@angular/core';

/**
 * Loading penuh-halaman bermerek FSLDK — cincin hijau berputar dengan dua
 * "planet" kecil beredar di sekelilingnya, logo FSLDK diam di tengah (tidak
 * ikut berputar). Dipakai HANYA untuk momen loading penuh-halaman yang
 * sesungguhnya (mis. redirect shortlink), bukan untuk loading
 * komponen/tabel/kartu (pakai skeleton, lihat kelas `.skel` di styles.scss).
 */
@Component({
  selector: 'app-page-loader',
  standalone: true,
  template: `
    <div class="page-loader" [class.is-inline]="inline">
      <div class="page-loader-ring">
        <div class="page-loader-orbit"><span class="page-loader-planet"></span></div>
        <div class="page-loader-orbit reverse"><span class="page-loader-planet"></span></div>
        <img src="assets/logo-fsldk-removebg.png" alt="" class="page-loader-mark">
      </div>
      @if (label) { <span class="page-loader-label">{{ label }}</span> }
    </div>
  `,
})
export class PageLoaderComponent {
  @Input() label = 'Memuat…';
  @Input() inline = false;
}
