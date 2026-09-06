import { Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { IconComponent } from '../../../../shared/icon.component';

interface HadithBook { id: string; name: string; max: number; }

// Enam kitab hadis populer + jumlah maksimum nomor hadisnya — dipakai untuk
// memilih hadis acak. Sama seperti pola di ldksyahid-app (admin dashboard
// widget "Daily Hadith & Al-Qur'an"), sumber data publik hadith-api-go.vercel.app.
const BOOKS: HadithBook[] = [
  { id: 'bukhari', name: 'HR. Bukhari', max: 6638 },
  { id: 'muslim', name: 'HR. Muslim', max: 4930 },
  { id: 'abu-daud', name: 'HR. Abu Daud', max: 4419 },
  { id: 'tirmidzi', name: 'HR. Tirmidzi', max: 3625 },
  { id: 'ibnu-majah', name: 'HR. Ibnu Majah', max: 4285 },
  { id: 'nasai', name: 'HR. Nasai', max: 5364 },
];

// Jumlah ayat per surah (index 0 = Al-Fatihah) — dipakai untuk memilih ayat
// Al-Qur'an acak dari quran-api-id.vercel.app (sumber publik, tanpa API key).
const SURAH_MAX_AYAH: number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30,
  73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29,
  18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18,
  12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19,
  5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

const ROTATE_SECONDS = 60;
const RETRY_DELAY_MS = 3000;
const MAX_RETRY = 5;
const FETCH_TIMEOUT_MS = 10000;

/**
 * Widget "Hadis & Al-Qur'an Harian" — bergantian menampilkan satu hadis acak
 * (6 kitab utama) atau satu ayat Al-Qur'an acak setiap 60 detik, referensi
 * langsung dari widget serupa di dashboard admin ldksyahid-app.
 *
 * Panggil `fetch` browser langsung ke API publik pihak ketiga (BUKAN lewat
 * ApiService) — pola yang sama dipakai PrayerTimeComponent — supaya
 * authInterceptor/errorInterceptor global tidak ikut kena ke domain di luar
 * backend sendiri.
 */
@Component({
  selector: 'app-hadith-quran-widget',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="hq-card">
      <div class="hq-head">
        <h3><app-icon name="book-open" [size]="17" /> Hadis &amp; Al-Qur'an Harian</h3>
        <div class="hq-actions">
          @if (!loading() && !failed()) {
            <span class="hq-countdown">Berganti {{ countdown() }}d</span>
          }
          <button type="button" class="hq-refresh" (click)="refresh()" title="Perbarui sekarang" aria-label="Perbarui sekarang">
            <app-icon name="refresh" [size]="12" />
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="hq-skel">
          <span class="skel skel-line" style="width:35%;height:20px"></span>
          <span class="skel skel-line" style="width:100%"></span>
          <span class="skel skel-line" style="width:92%"></span>
          <span class="skel skel-line" style="width:60%"></span>
        </div>
      } @else if (failed()) {
        <p class="hq-error">Konten tidak tersedia saat ini. Coba lagi nanti.</p>
      } @else {
        <div class="hq-body" [class.is-fading]="fading()">
          <div class="hq-meta">
            <span class="hq-badge" [class.quran]="isQuran()">{{ sourceLabel() }}</span>
            <span class="hq-number">{{ numberLabel() }}</span>
          </div>
          <div class="hq-text-wrapper" #wrapperEl [class.expanded]="expanded()" [class.no-clamp]="!overflowing()">
            @if (arabic()) { <p class="hq-arabic">{{ arabic() }}</p> }
            <p class="hq-translation">&ldquo;{{ translation() }}&rdquo;</p>
          </div>
          @if (overflowing()) {
            <button type="button" class="hq-toggle" (click)="toggleExpanded()">
              {{ expanded() ? 'Lihat Lebih Sedikit' : 'Lihat Selengkapnya' }}
              <app-icon name="chevron-down" [size]="11" [class.is-expanded]="expanded()" />
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .hq-card { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); padding: 22px 24px; }
    .hq-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
    .hq-head h3 { display: flex; align-items: center; gap: 9px; margin: 0; font-size: 1.05rem; }
    .hq-actions { display: flex; align-items: center; gap: 10px; }
    .hq-countdown { font-size: .78rem; color: var(--color-muted); font-weight: 600; white-space: nowrap; }
    .hq-refresh {
      width: 28px; height: 28px; border-radius: var(--radius-full); border: 1px solid var(--color-border);
      background: #fff; color: var(--color-primary-dark); display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0; transition: background var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    .hq-refresh:hover { background: var(--color-primary-soft); transform: rotate(50deg); }

    .hq-skel { display: flex; flex-direction: column; gap: 10px; }
    .hq-error { color: var(--color-muted); font-size: .9rem; margin: 0; }

    .hq-body { transition: opacity var(--motion-slow) ease; }
    .hq-body.is-fading { opacity: 0; }
    .hq-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
    .hq-badge { background: var(--color-primary); color: #fff; font-size: .74rem; font-weight: 700; padding: 4px 12px; border-radius: var(--radius-full); white-space: nowrap; }
    .hq-badge.quran { background: var(--color-gold); }
    .hq-number { font-size: .8rem; color: var(--color-muted); font-weight: 600; }
    .hq-arabic { font-family: 'Traditional Arabic', 'Scheherazade New', serif; font-size: 1.45rem; line-height: 2.1; text-align: right; direction: rtl; color: var(--color-text); margin: 0 0 12px; }
    .hq-translation { font-family: var(--font-accent); font-style: italic; font-size: 1rem; line-height: 1.75; color: var(--color-text-secondary); margin: 0; }

    /* Diciutkan secara default (mis. ayat panjang) — persis perilaku widget
       serupa di ldksyahid-app: teks penuh tidak langsung tampil semua,
       harus diklik "Lihat Selengkapnya" dulu. */
    .hq-text-wrapper { max-height: 158px; overflow: hidden; transition: max-height var(--motion-slow, .3s) ease; position: relative; }
    .hq-text-wrapper.expanded { max-height: 2000px; }
    .hq-text-wrapper:not(.expanded):not(.no-clamp)::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 40px;
      background: linear-gradient(to bottom, transparent, #fff); pointer-events: none;
    }
    .hq-toggle {
      display: inline-flex; align-items: center; gap: 5px; background: transparent; border: none;
      color: var(--color-primary-dark); font-size: .85rem; font-weight: 700; padding: 0; margin-top: 12px; cursor: pointer;
    }
    .hq-toggle:hover { text-decoration: underline; }
    .hq-toggle app-icon { transition: transform var(--motion-fast) ease; display: inline-flex; }
    .hq-toggle app-icon.is-expanded { transform: rotate(180deg); }

    @media (max-width: 600px) {
      .hq-card { padding: 18px; }
      .hq-arabic { font-size: 1.2rem; }
    }
  `],
})
export class HadithQuranWidgetComponent implements OnInit, OnDestroy {
  @ViewChild('wrapperEl') private wrapperRef?: ElementRef<HTMLDivElement>;

  loading = signal(true);
  failed = signal(false);
  fading = signal(false);
  arabic = signal('');
  translation = signal('');
  sourceLabel = signal('');
  numberLabel = signal('');
  isQuran = signal(false);
  countdown = signal(ROTATE_SECONDS);
  expanded = signal(false);
  overflowing = signal(false);

  private contentType: 'hadith' | 'quran' = Math.random() < 0.5 ? 'hadith' : 'quran';
  private countdownTimer?: ReturnType<typeof setInterval>;
  private retryTimeout?: ReturnType<typeof setTimeout>;
  private retryCount = 0;
  private fetchToken = 0;

  ngOnInit(): void {
    this.fetchContent();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    clearInterval(this.countdownTimer);
    clearTimeout(this.retryTimeout);
  }

  refresh(): void {
    this.retryCount = 0;
    clearTimeout(this.retryTimeout);
    this.contentType = Math.random() < 0.5 ? 'hadith' : 'quran';
    this.fetchContent();
  }

  toggleExpanded(): void {
    this.expanded.update((v) => !v);
  }

  private startCountdown(): void {
    clearInterval(this.countdownTimer);
    this.countdown.set(ROTATE_SECONDS);
    this.countdownTimer = setInterval(() => {
      this.countdown.update((v) => v - 1);
      if (this.countdown() <= 0) {
        this.contentType = this.contentType === 'hadith' ? 'quran' : 'hadith';
        this.fetchContent();
      }
    }, 1000);
  }

  private async fetchContent(): Promise<void> {
    const token = ++this.fetchToken;
    if (!this.loading()) this.fading.set(true);
    if (this.contentType === 'quran') {
      await this.fetchAyah(token);
    } else {
      await this.fetchHadith(token);
    }
  }

  private async fetchHadith(token: number): Promise<void> {
    const book = BOOKS[Math.floor(Math.random() * BOOKS.length)];
    const number = Math.floor(Math.random() * book.max) + 1;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(`https://hadith-api-go.vercel.app/api/v1/hadis/${book.id}/${number}`, { signal: ctrl.signal });
      clearTimeout(timer);
      const json = await res.json();
      if (token !== this.fetchToken) return;
      if (json?.status === 'success' && json?.data) {
        this.applyContent(json.data.arab ?? '', json.data.id ?? '', book.name, `${book.name} No. ${json.data.number}`, false);
      } else {
        throw new Error('invalid response');
      }
    } catch {
      if (token === this.fetchToken) this.scheduleRetry();
    }
  }

  private async fetchAyah(token: number): Promise<void> {
    const surahNo = Math.floor(Math.random() * 114) + 1;
    const ayahNo = Math.floor(Math.random() * SURAH_MAX_AYAH[surahNo - 1]) + 1;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(`https://quran-api-id.vercel.app/surah/${surahNo}/${ayahNo}`, { signal: ctrl.signal });
      clearTimeout(timer);
      const json = await res.json();
      if (token !== this.fetchToken) return;
      if (json?.code === 200 && json?.data) {
        const d = json.data;
        const arab = d.text?.arab ?? '';
        const terjemah = d.translation?.id ?? '';
        const surahName = d.surah?.name?.transliteration?.id ? `QS. ${d.surah.name.transliteration.id}` : `QS. Surah ${surahNo}`;
        this.applyContent(arab, terjemah, surahName, `${surahName}: ${ayahNo}`, true);
      } else {
        throw new Error('invalid response');
      }
    } catch {
      if (token === this.fetchToken) this.scheduleRetry();
    }
  }

  private applyContent(arab: string, translation: string, source: string, number: string, isQuran: boolean): void {
    this.arabic.set(arab);
    this.translation.set(translation);
    this.sourceLabel.set(source);
    this.numberLabel.set(number);
    this.isQuran.set(isQuran);
    this.failed.set(false);
    this.loading.set(false);
    this.fading.set(false);
    this.retryCount = 0;
    this.countdown.set(ROTATE_SECONDS);
    // Konten baru selalu mulai diciutkan lagi (default belum-dibaca-penuh),
    // baru dicek apakah teksnya memang melebihi tinggi ciutan setelah DOM
    // sempat di-render ulang oleh Angular (makanya ditunda satu tick).
    this.expanded.set(false);
    setTimeout(() => this.checkOverflow(), 50);
  }

  private checkOverflow(): void {
    const el = this.wrapperRef?.nativeElement;
    if (!el) { this.overflowing.set(false); return; }
    this.overflowing.set(el.scrollHeight > el.clientHeight + 4);
  }

  private scheduleRetry(): void {
    this.retryCount++;
    if (this.retryCount <= MAX_RETRY) {
      this.retryTimeout = setTimeout(() => this.fetchContent(), RETRY_DELAY_MS);
    } else {
      this.loading.set(false);
      this.failed.set(true);
      this.retryCount = 0;
    }
  }
}
