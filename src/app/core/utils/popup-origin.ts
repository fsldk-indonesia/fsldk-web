export interface PopupOrigin { dx: number; dy: number; }

const CENTERED: PopupOrigin = { dx: 0, dy: 0 };

/** Hitung offset dari pusat viewport ke tombol yang memicu popup (dipakai
 *  untuk animasi "ditarik keluar dari tombolnya"). Modal/dialog di-center
 *  lewat flexbox, jadi posisi akhirnya baru diketahui browser setelah
 *  layout — transform-origin relatif elemen tidak bisa dihitung di awal.
 *  Sebagai gantinya popup dianimasikan dari translate(dx,dy) scale kecil
 *  menuju translate(0,0) scale(1) di posisi center-nya sendiri. */
export function popupOriginFromEvent(event?: Event): PopupOrigin {
  if (!event || !(event.currentTarget instanceof HTMLElement)) return CENTERED;
  const rect = event.currentTarget.getBoundingClientRect();
  const btnX = rect.left + rect.width / 2;
  const btnY = rect.top + rect.height / 2;
  return { dx: btnX - window.innerWidth / 2, dy: btnY - window.innerHeight / 2 };
}
