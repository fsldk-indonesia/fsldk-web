import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, signal } from '@angular/core';
import { IconComponent } from './icon.component';
import { ModalBackdropDirective } from './modal-backdrop.directive';

interface PrayerJadwal {
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
}

interface PrayerData {
  lokasi: string;
  daerah: string;
  jadwal: PrayerJadwal;
}

interface PrayerEntry {
  key: keyof PrayerJadwal;
  label: string;
}

// Kota rujukan jadwal sholat (Jakarta Pusat) — sama seperti pola di
// ldksyahid-app; sumber data publik api.myquran.com (Kemenag), tanpa API key.
const CITY_ID = 1301;
const PRAYERS: PrayerEntry[] = [
  { key: 'subuh', label: 'Subuh' },
  { key: 'dzuhur', label: 'Dzuhur' },
  { key: 'ashar', label: 'Ashar' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isya', label: 'Isya' },
];
const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function toMinutes(time: string | undefined): number {
  if (!time) return Infinity;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Widget Jadwal Sholat — tombol navbar (nama & jam sholat berikutnya) yang
 * membuka modal berisi jadwal lengkap hari ini + jam WIB berjalan. Dipasang
 * apa adanya di SiteHeaderComponent (navbar landing page & Portal Kader) dan
 * CmsLayoutComponent (topbar CMS Utama/LDK/Puskomda/Puskomnas — satu shell
 * component dipakai untuk keempatnya, lihat app.routes.ts), jadi cukup satu
 * kali ditambahkan di masing-masing untuk hadir di semua shell tersebut.
 *
 * Panggil `fetch` browser langsung ke api.myquran.com (BUKAN lewat ApiService)
 * supaya authInterceptor/errorInterceptor global (yang menempel token Bearer
 * & menampilkan toast/redirect ke semua request HttpClient) tidak ikut kena
 * ke domain pihak ketiga ini.
 */
@Component({
  selector: 'app-prayer-time',
  standalone: true,
  imports: [IconComponent, ModalBackdropDirective],
  template: `
    <button type="button" class="prayer-btn" (click)="open()">
      <span class="prayer-btn-icon"><app-icon name="mosque" [size]="15" /></span>
      <span class="prayer-btn-text">
        <span class="prayer-btn-label">{{ next()?.label ?? 'Sholat' }}</span>
        <span class="prayer-btn-time">{{ next()?.time ?? '--:--' }}</span>
      </span>
    </button>

    <div class="prayer-modal-overlay" [class.active]="isOpen()" appModalBackdrop #overlayEl>
      <div class="prayer-modal" (click)="$event.stopPropagation()">
        <div class="prayer-modal-hero">
          <button type="button" class="prayer-modal-close" (click)="close()" aria-label="Tutup">&times;</button>
          <div class="prayer-modal-icon"><app-icon name="mosque" [size]="26" /></div>
          <div class="prayer-clock">{{ clockLabel() }} <small>WIB</small></div>
          <h3>Jadwal Sholat Hari Ini</h3>
          <p class="prayer-modal-date">{{ dateLabel }}</p>
          <p class="prayer-modal-location">{{ locationLabel() }}</p>
        </div>

        <div class="prayer-list">
          @if (!data() && !loadFailed()) {
            <div class="prayer-loading"><app-icon name="clock" [size]="20" />Memuat jadwal sholat…</div>
          } @else if (loadFailed()) {
            <div class="prayer-loading">Jadwal sholat tidak tersedia saat ini. Coba lagi nanti.</div>
          } @else {
            @for (p of prayers; track p.key) {
              <div class="prayer-item" [class.next-prayer]="next()?.key === p.key">
                <span class="prayer-item-dot"></span>
                <span class="prayer-item-name">{{ p.label }}</span>
                @if (next()?.key === p.key) { <span class="prayer-next-badge">Berikutnya</span> }
                <span class="prayer-item-time">{{ data()?.jadwal?.[p.key] ?? '--:--' }}</span>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .prayer-btn { display: flex; align-items: center; gap: 8px; padding: 7px 14px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-primary-soft); color: var(--color-primary-dark); font-family: var(--font-body); font-weight: 700; cursor: pointer; transition: background var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out); white-space: nowrap; }
    .prayer-btn:hover { background: var(--color-primary); color: #fff; transform: translateY(-1px); }
    .prayer-btn-icon { font-size: 1rem; line-height: 1; flex-shrink: 0; }
    .prayer-btn-text { display: flex; flex-direction: column; line-height: 1.2; text-align: left; }
    .prayer-btn-label { font-size: .62rem; font-weight: 600; opacity: .8; text-transform: uppercase; letter-spacing: .03em; }
    .prayer-btn-time { font-size: .82rem; font-weight: 800; }

    .prayer-modal-overlay {
      position: fixed; inset: 0; background: rgba(15,23,20,.55); backdrop-filter: blur(4px); z-index: 200;
      display: flex; align-items: center; justify-content: center; padding: 16px;
      opacity: 0; visibility: hidden; pointer-events: none;
      transition: opacity var(--motion-base) ease, visibility var(--motion-base);
    }
    .prayer-modal-overlay.active { opacity: 1; visibility: visible; pointer-events: auto; }
    .prayer-modal {
      background: #fff; border-radius: var(--radius-lg); width: 100%; max-width: 380px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg);
      transform: scale(.9) translateY(12px); transition: transform var(--motion-base) var(--ease-out);
    }
    .prayer-modal-overlay.active .prayer-modal { transform: scale(1) translateY(0); }
    @media (prefers-reduced-motion: reduce) { .prayer-modal-overlay, .prayer-modal { transition: opacity var(--motion-base) ease, visibility var(--motion-base); transform: none !important; } }
    .prayer-modal-hero { position: relative; background: linear-gradient(145deg, var(--color-primary-bright) 0%, var(--color-primary) 60%, var(--color-primary-dark) 100%); border-radius: var(--radius-lg) var(--radius-lg) 0 0; padding: 32px 24px 26px; text-align: center; color: #fff; }
    .prayer-modal-close { position: absolute; top: 12px; right: 12px; width: 30px; height: 30px; border-radius: 50%; border: none; background: rgba(255,255,255,.2); color: #fff; font-size: 1.2rem; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .prayer-modal-close:hover { background: rgba(255,255,255,.35); }
    .prayer-modal-icon { width: 64px; height: 64px; margin: 0 auto 12px; border-radius: 50%; background: rgba(255,255,255,.18); border: 2px solid rgba(255,255,255,.3); display: flex; align-items: center; justify-content: center; }
    .prayer-clock { font-family: 'Courier New', monospace; font-size: 1.9rem; font-weight: 700; letter-spacing: .03em; margin-bottom: 8px; }
    .prayer-clock small { font-size: .7rem; font-weight: 700; opacity: .8; letter-spacing: .1em; margin-left: 4px; }
    .prayer-modal-hero h3 { color: #fff; font-size: 1.1rem; margin: 0 0 4px; }
    .prayer-modal-date { font-size: .85rem; font-weight: 600; margin: 0 0 2px; opacity: .95; }
    .prayer-modal-location { font-size: .78rem; margin: 0; opacity: .75; }

    .prayer-list { display: flex; flex-direction: column; gap: 8px; padding: 20px; }
    .prayer-loading { text-align: center; padding: 24px 0; color: var(--color-muted); display: flex; flex-direction: column; align-items: center; gap: 8px; font-size: .88rem; }
    .prayer-item { display: flex; align-items: center; gap: 12px; padding: 11px 14px; background: var(--color-bg-warm); border-radius: var(--radius-md); }
    .prayer-item-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary-soft); border: 2px solid var(--color-primary); flex-shrink: 0; }
    .prayer-item.next-prayer { background: var(--color-primary-soft); }
    .prayer-item.next-prayer .prayer-item-dot { background: var(--color-primary); }
    .prayer-item-name { flex: 1; font-weight: 600; font-size: .9rem; color: var(--color-text); }
    .prayer-item.next-prayer .prayer-item-name { color: var(--color-primary-dark); font-weight: 700; }
    .prayer-next-badge { font-size: .62rem; font-weight: 700; background: var(--color-primary); color: #fff; padding: 2px 8px; border-radius: var(--radius-full); }
    .prayer-item-time { font-weight: 700; font-size: .9rem; color: var(--color-text); min-width: 42px; text-align: right; }
    .prayer-item.next-prayer .prayer-item-time { color: var(--color-primary-dark); }

    @media (max-width: 420px) { .prayer-btn-label { display: none; } .prayer-btn { padding: 7px 10px; } }
  `],
})
export class PrayerTimeComponent implements OnInit, AfterViewInit, OnDestroy {
  // Modal dipindah fisik ke document.body (bukan CDK Overlay — belum jadi
  // dependency proyek ini) supaya `position: fixed`-nya tidak terkurung
  // dalam containing block leluhur manapun yang punya `transform` (mis.
  // .pub-header.scrolled di site-header.component.ts memakai
  // `transform: translateX(-50%)`, yang membuat fixed-descendant terhitung
  // relatif ke kotak header, bukan viewport — modal jadi terpotong/tidak
  // center). Overlay SENGAJA statis (bukan @if) dan ditoggle lewat class
  // `.active` supaya node-nya tidak pernah dibuat/dihancurkan Angular lewat
  // structural directive — kalau masih di bawah @if, Angular menyimpan
  // referensi parent logis aslinya (bukan document.body) dan `removeChild`
  // saat destroy akan gagal karena node sudah dipindah ke parent lain.
  @ViewChild('overlayEl', { static: true }) private overlayRef!: ElementRef<HTMLElement>;

  readonly prayers = PRAYERS;
  readonly dateLabel = `${DAY_NAMES[new Date().getDay()]}, ${new Date().getDate()} ${MONTH_NAMES[new Date().getMonth()]} ${new Date().getFullYear()}`;

  data = signal<PrayerData | null>(null);
  loadFailed = signal(false);
  isOpen = signal(false);
  private minuteTick = signal(Date.now());
  private clockTick = signal(Date.now());

  private minuteTimer?: ReturnType<typeof setInterval>;
  private clockTimer?: ReturnType<typeof setInterval>;

  next = computed(() => {
    const jadwal = this.data()?.jadwal;
    if (!jadwal) return null;
    void this.minuteTick();
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    for (const p of PRAYERS) {
      if (toMinutes(jadwal[p.key]) > cur) return { key: p.key, label: p.label, time: jadwal[p.key] };
    }
    return { key: PRAYERS[0].key, label: PRAYERS[0].label, time: jadwal[PRAYERS[0].key] };
  });

  clockLabel = computed(() => {
    void this.clockTick();
    const wib = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    return [wib.getHours(), wib.getMinutes(), wib.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':');
  });

  locationLabel(): string {
    const d = this.data();
    return d ? `Untuk Wilayah ${d.lokasi} & Sekitarnya` : 'Untuk Wilayah Jakarta & Sekitarnya';
  }

  ngOnInit(): void {
    this.fetchPrayerTimes();
    this.minuteTimer = setInterval(() => this.minuteTick.set(Date.now()), 60000);
  }

  ngAfterViewInit(): void {
    document.body.appendChild(this.overlayRef.nativeElement);
  }

  ngOnDestroy(): void {
    clearInterval(this.minuteTimer);
    clearInterval(this.clockTimer);
    // Bersihkan sendiri node yang sudah dipindah ke document.body — lihat
    // catatan di deklarasi overlayRef kenapa ini tidak bisa dibiarkan ke
    // mekanisme removeChild bawaan Angular.
    this.overlayRef?.nativeElement.remove();
  }

  open(): void {
    this.isOpen.set(true);
    this.clockTick.set(Date.now());
    this.clockTimer = setInterval(() => this.clockTick.set(Date.now()), 1000);
  }

  close(): void {
    this.isOpen.set(false);
    clearInterval(this.clockTimer);
    this.clockTimer = undefined;
  }

  private async fetchPrayerTimes(): Promise<void> {
    try {
      const d = new Date();
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const res = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${CITY_ID}/${date}`);
      const json = await res.json();
      if (json?.status && json?.data) {
        this.data.set(json.data);
      } else {
        this.loadFailed.set(true);
      }
    } catch {
      this.loadFailed.set(true);
    }
  }
}
