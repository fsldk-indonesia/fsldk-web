import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren, inject, signal } from '@angular/core';
import { IconComponent } from '../../../../shared/icon.component';
import { PageHeroComponent } from '../../../../shared/page-hero.component';
import { BottomSheetComponent } from '../../../../shared/bottom-sheet.component';
import { Schedule } from '../../entities/schedule';
import {
  DAYS_ID_SHORT, ScheduleCategoryMeta, categoryMeta,
  formatDateRange, formatLongDate, formatTimeRange, monthName,
} from '../../schedule.constants';
import { SchedulePublicIndexPresenter } from './schedule.public-index.presenter';
import { CalendarCell, SchedulePublicIndexView } from './schedule.public-index.view';

/** Grid dekoratif hero: 7x3 titik hari, satu titik "hari ini" di tengah
 *  (baris 1, kolom 3) jadi titik hub jaringan — pola sama persis hero
 *  Berita/Perpustakaan/Struktur, cuma motifnya diganti kartu kalender. */
const CAL_HERO_DOTS: { cx: number; cy: number }[] = (() => {
  const dots: { cx: number; cy: number }[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 7; c++) dots.push({ cx: 168 + c * 24, cy: 190 + r * 30 });
  }
  return dots;
})();
const CAL_HERO_TODAY_INDEX = 1 * 7 + 3; // baris 1, kolom 3 -> (240, 220)

@Component({
  selector: 'app-schedule-public-index-page',
  standalone: true,
  imports: [IconComponent, PageHeroComponent, BottomSheetComponent],
  providers: [SchedulePublicIndexPresenter],
  templateUrl: './schedule.public-index.page.html',
  styles: [`
    /* ---------- Siluet hero: kartu kalender + jaringan "digambar sendiri" —
       mekanisme identik Berita/Perpustakaan/Struktur (lihat komentar di
       masing-masing), cuma motif tengahnya diganti kartu kalender + titik
       "hari ini" yang jadi hub jaringan. ---------- */
    .hero-cal-visual { position: relative; width: 100%; }
    .cal-svg { position: relative; z-index: 1; width: 100%; height: 240px; overflow: visible; }

    .cal-silhouette {
      transform-box: fill-box; transform-origin: 50% 100%; opacity: 0;
      animation: calGrow .9s cubic-bezier(.34,1.4,.64,1) forwards;
      filter: drop-shadow(0 10px 18px rgba(0,147,59,.2));
    }
    @keyframes calGrow { from { opacity: 0; transform: scale(.75) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .cal-ground-shadow { fill: var(--color-primary-dark); opacity: .14; }
    .cal-hero-day-dot { fill: var(--color-border-strong); }
    .cal-hero-today-dot { fill: var(--color-primary-soft); stroke: var(--color-primary); stroke-width: 1.5; }
    @media (prefers-reduced-motion: reduce) { .cal-silhouette { animation: none; opacity: 1; transform: none; } }

    .cal-line { fill: none; stroke: var(--color-primary); stroke-width: 1.8; stroke-linecap: round; opacity: .55; }
    .cal-line.thick { stroke-width: 2.6; opacity: .75; stroke: var(--color-primary-bright); }
    .cal-tier { opacity: 0; animation: calTierFadeIn .4s ease-out forwards; }
    .cal-tier-0 { animation-delay: .75s; }
    .cal-tier-1 { animation-delay: 1.3s; }
    .cal-tier-2 { animation-delay: 1.8s; }
    @keyframes calTierFadeIn { from { opacity: 0; } to { opacity: 1; } }

    .cal-badge {
      transform-box: fill-box; transform-origin: center; opacity: 0;
      animation: calBadgePop .5s cubic-bezier(.34,1.4,.64,1) 2.2s forwards;
    }
    @keyframes calBadgePop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: scale(1); } }
    @media (prefers-reduced-motion: reduce) { .cal-tier, .cal-badge { animation: none; opacity: 1; transform: none; } }

    /* ---------- Section hijau PENUH tepi-ke-tepi + siluet ikon raksasa
       pudar — pola sama persis Berita/Perpustakaan. ---------- */
    .section { position: relative; overflow: hidden; background: var(--color-primary); padding: 56px 0 72px; }
    .jadwal-panel-silhouette { position: absolute; right: 8px; bottom: 8px; z-index: 0; color: rgba(255,255,255,.12); transform: rotate(-12deg); pointer-events: none; }
    .jadwal-panel-silhouette-2 { position: absolute; left: 8px; top: 8px; z-index: 0; color: rgba(255,255,255,.08); transform: rotate(16deg); pointer-events: none; }
    .section > .container { position: relative; z-index: 1; }

    .jadwal-section-head { margin-bottom: 28px; }
    .jadwal-section-head h2 { margin: 0 0 10px; color: #fff; }
    .jadwal-section-subtitle { max-width: 560px; margin: 0 auto; color: rgba(255,255,255,.85); font-size: 1.02rem; line-height: 1.6; }

    @media (max-width: 640px) { .section { padding: 40px 0 56px; } }

    /* ---------- Toolbar navigasi bulan — tombol putih di atas hijau solid,
       pola override sama seperti filter/pagination putih Perpustakaan. ---------- */
    .jadwal-toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center; margin-bottom: 28px; }
    .jadwal-toolbar .nav-btn {
      width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center;
      font-size: 1.25rem; line-height: 1; background: #fff; border-color: transparent;
      color: var(--color-primary-dark); box-shadow: var(--shadow-sm);
    }
    .jadwal-toolbar .nav-btn:hover { background: var(--color-primary-soft); }
    .jadwal-toolbar .btn-ghost { background: rgba(255,255,255,.16); color: #fff; border: 1px solid rgba(255,255,255,.3); }
    .jadwal-toolbar .btn-ghost:hover { background: rgba(255,255,255,.28); }
    .jadwal-period { font-family: var(--font-heading); font-weight: 700; font-size: 1.2rem; min-width: 190px; text-align: center; color: #fff; }

    .jadwal-error {
      max-width: 640px; margin: 0 auto 20px; padding: 14px 18px; border-radius: var(--radius-md);
      background: #fff; color: #b42318; display: flex; gap: 12px; align-items: center; justify-content: center;
      font-size: .9rem; box-shadow: var(--shadow-sm);
    }

    /* ---------- Kalender putih di atas hijau solid — style/js interaksi
       MIRIP kalender mini Beranda (hover naik+zoom, popup berkepala warna +
       anak panah, badge hari-ini lebih besar), cuma ditambah toolbar
       navigasi bulan yang Beranda tidak punya. ---------- */
    .cal-wrap { max-width: 980px; margin: 0 auto; background: #fff; border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-lg); }
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
    .cal-dow-cell { padding: 8px 6px; text-align: center; font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; color: var(--color-muted); }
    .cal-cell {
      position: relative; min-height: 108px; padding: 8px; border: 1px solid var(--color-border);
      margin: -0.5px; display: flex; flex-direction: column; gap: 4px; background: #fff;
      transition: background var(--motion-fast) ease, box-shadow var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    .cal-cell.out { background: var(--color-bg-alt); }
    .cal-cell.out .cal-date { color: var(--color-muted); }
    .cal-cell.has { cursor: pointer; }
    .cal-cell:hover, .cal-cell:focus-within, .cal-cell:focus { z-index: 30; outline: none; }
    .cal-cell.has:hover {
      transform: translateY(-2px) scale(1.04); background: var(--color-primary-tint);
      box-shadow: inset 0 0 0 2px var(--color-primary), var(--shadow-md, var(--shadow-sm));
    }
    .cal-cell.has:hover .cal-date { color: var(--color-primary-dark); }
    .cal-cell:focus-visible { box-shadow: inset 0 0 0 2px var(--color-primary); }
    .cal-date { font-size: .92rem; font-weight: 600; color: var(--color-text-secondary); transition: color var(--motion-fast) ease; }
    .cal-cell.today .cal-date { background: var(--color-primary); color: #fff; border-radius: var(--radius-full); width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; }
    @media (prefers-reduced-motion: reduce) { .cal-cell, .cal-date { transition: none; } }

    .cal-chips { display: flex; flex-direction: column; gap: 3px; overflow: hidden; }
    .cal-chip { display: flex; align-items: center; gap: 5px; font-size: .76rem; line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--color-text); }
    .cal-chip .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .cal-more { font-size: .7rem; color: var(--color-muted); }
    /* Titik kategori mobile-only — pengganti .cal-chips (kepanjangan di sel kecil). */
    .cal-dots { display: none; flex-wrap: wrap; gap: 3px; }
    .cal-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

    @keyframes calPopIn { from { opacity: 0; transform: translateY(-6px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .cal-pop {
      position: absolute; top: calc(100% + 14px); left: -1px; width: 300px; max-width: 82vw; z-index: 40;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg); text-align: left; cursor: default;
      animation: calPopIn .18s var(--ease-out) both;
    }
    .cal-cell:nth-child(7n) .cal-pop, .cal-cell:nth-child(7n-1) .cal-pop { left: auto; right: -1px; }
    .cal-pop-arrow {
      position: absolute; top: -7px; left: 24px; width: 13px; height: 13px; z-index: 1;
      background: var(--color-primary-tint); border-left: 1px solid var(--color-border); border-top: 1px solid var(--color-border);
      transform: rotate(45deg); border-radius: 3px 0 0 0;
    }
    .cal-cell:nth-child(7n) .cal-pop-arrow, .cal-cell:nth-child(7n-1) .cal-pop-arrow { left: auto; right: 24px; }
    .cal-pop-head {
      position: relative; z-index: 2; display: flex; align-items: center; gap: 8px; padding: 12px 16px;
      background: var(--color-primary-tint); color: var(--color-primary-dark); border-radius: var(--radius-md) var(--radius-md) 0 0;
    }
    .cal-pop-date { margin: 0; font-weight: 700; font-size: .84rem; }
    .cal-pop ul { list-style: none; margin: 0; padding: 6px 0; display: flex; flex-direction: column; max-height: 280px; overflow-y: auto; }
    .cal-pop li { position: relative; display: flex; align-items: flex-start; gap: 10px; padding: 9px 16px; transition: background var(--motion-fast) ease; }
    .cal-pop li::before {
      content: ''; position: absolute; left: 0; top: 4px; bottom: 4px; width: 3px; border-radius: var(--radius-full);
      background: var(--jadwal-pop-accent, var(--color-primary)); opacity: 0; transition: opacity var(--motion-fast) ease;
    }
    .cal-pop li:hover { background: var(--color-bg-alt); }
    .cal-pop li:hover::before { opacity: 1; }
    .cal-pop li:last-child:hover { border-radius: 0 0 var(--radius-md) var(--radius-md); }
    .cal-pop-dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; }
    .cal-pop-body { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .cal-pop-title { font-weight: 700; font-size: .84rem; line-height: 1.35; color: var(--color-text); }
    .cal-pop-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
    .cal-pop-time { font-variant-numeric: tabular-nums; color: var(--color-muted); font-size: .74rem; font-weight: 600; }
    .cal-pop-loc { display: flex; align-items: center; gap: 5px; color: var(--color-muted); font-size: .74rem; }
    .cat-badge { display: inline-block; padding: 1px 8px; border-radius: var(--radius-full); font-size: .68rem; font-weight: 700; }
    @media (prefers-reduced-motion: reduce) { .cal-pop { animation: none; } }

    /* ---------- Agenda: kartu putih melayang di atas hijau solid, aksen
       kategori di tepi kiri — lebih "hidup" dari daftar bergaris tipis. ---------- */
    .jadwal-agenda { max-width: 820px; margin: 48px auto 0; }
    .jadwal-agenda > h2 { font-size: 1.2rem; margin: 0 0 18px; color: #fff; text-align: center; }
    .agenda-list { display: flex; flex-direction: column; gap: 16px; }
    .agenda-item {
      position: relative; display: flex; gap: 18px; background: #fff; border-radius: var(--radius-lg);
      padding: 18px 20px; box-shadow: var(--shadow-sm);
      border: 1.5px solid var(--color-primary);
      transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s cubic-bezier(.22,1,.36,1);
    }
    .agenda-item:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    .agenda-when { flex: 0 0 128px; }
    .agenda-date { display: block; font-weight: 700; font-size: .9rem; color: var(--color-text); }
    .agenda-time { display: block; font-size: .82rem; color: var(--color-muted); font-variant-numeric: tabular-nums; margin-top: 2px; }
    .agenda-body { flex: 1; min-width: 0; }
    .agenda-body h3 { margin: 8px 0 4px; font-size: 1rem; }
    .agenda-desc { color: var(--color-text-secondary); font-size: .88rem; margin: 4px 0; white-space: pre-line; }
    .agenda-meta { display: flex; flex-wrap: wrap; gap: 14px; color: var(--color-muted); font-size: .82rem; margin: 6px 0 10px; }
    .agenda-meta span { display: inline-flex; align-items: center; gap: 5px; }

    .jadwal-empty-panel { background: #fff; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }

    /* ---------- Sheet mobile tap-tanggal. ---------- */
    .jadwal-daysheet-list { display: flex; flex-direction: column; gap: 16px; }
    .jadwal-daysheet-item { padding-top: 14px; border-top: 1px solid var(--color-border); }
    .jadwal-daysheet-item:first-child { padding-top: 0; border-top: none; }
    .jadwal-daysheet-item h4 { margin: 8px 0 4px; font-size: .98rem; }
    .jadwal-daysheet-meta { display: flex; flex-wrap: wrap; gap: 12px; color: var(--color-muted); font-size: .8rem; margin: 0 0 4px; }
    .jadwal-daysheet-meta span { display: inline-flex; align-items: center; gap: 5px; }
    .jadwal-daysheet-desc { color: var(--color-text-secondary); font-size: .86rem; margin: 4px 0 0; white-space: pre-line; }

    @media (max-width: 640px) {
      .cal-wrap { padding: 14px; }
      .cal-cell { min-height: 44px; gap: 2px; padding: 6px 4px; }
      .cal-chips { display: none; }
      .cal-dots { display: flex; }
      .cal-pop { display: none; }
      .agenda-item { flex-direction: column; gap: 6px; padding: 16px 18px; }
      .agenda-when { flex-basis: auto; }
    }
  `],
})
export class SchedulePublicIndexPage implements OnInit, AfterViewInit, OnDestroy, SchedulePublicIndexView {
  private presenter = inject(SchedulePublicIndexPresenter);

  readonly dow = DAYS_ID_SHORT;
  readonly skeletonCells = Array.from({ length: 42 }, (_, i) => i);
  readonly calHeroDots = CAL_HERO_DOTS;
  readonly calHeroTodayIndex = CAL_HERO_TODAY_INDEX;

  loading = signal(true);
  periodLabel = signal('');
  weeks = signal<CalendarCell[][]>([]);
  agenda = signal<Schedule[]>([]);
  error = signal<string | null>(null);
  popupIso = signal<string | null>(null);
  /** Sheet mobile-only, tap tanggal kalender (tidak ada hover di touch device). */
  daySheet = signal<CalendarCell | null>(null);

  @ViewChildren('calLine') private calLineRefs!: QueryList<ElementRef<SVGPathElement>>;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
    /* Section di halaman ini berakhir hijau solid — ruang negatif wave
     *  footer perlu diisi hijau khusus di sini, pola sama persis Berita/
     *  Perpustakaan. */
    document.documentElement.style.setProperty('--footer-wave-backdrop', 'var(--color-primary)');
  }

  ngAfterViewInit(): void {
    this.animateCalLines();
  }

  ngOnDestroy(): void {
    document.documentElement.style.removeProperty('--footer-wave-backdrop');
  }

  prev(): void { this.presenter.prevMonth(); }
  next(): void { this.presenter.nextMonth(); }
  today(): void { this.presenter.goToday(); }
  reload(): void { this.presenter.load(); }

  openPopup(iso: string): void { this.popupIso.set(iso); }
  closePopup(): void { this.popupIso.set(null); }
  togglePopup(iso: string): void { this.popupIso.update((cur) => (cur === iso ? null : iso)); }

  isMobilePreview(): boolean { return window.innerWidth <= 640; }

  /** Klik tanggal kalender — mobile buka bottom sheet (tidak ada hover di
   *  touch device), desktop toggle popup seperti sebelumnya. */
  onCellClick(cell: CalendarCell): void {
    if (!cell.items.length) return;
    if (this.isMobilePreview()) { this.daySheet.set(cell); return; }
    this.togglePopup(cell.iso);
  }

  cat(value: string): ScheduleCategoryMeta { return categoryMeta(value); }
  timeRange(s: Schedule): string { return formatTimeRange(s); }
  dateRange(s: Schedule): string { return formatDateRange(s); }
  longDate(d: Date): string { return formatLongDate(d); }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setPeriod(year: number, month: number): void { this.periodLabel.set(`${monthName(month)} ${year}`); }
  setCalendar(weeks: CalendarCell[][]): void { this.weeks.set(weeks); }
  setAgenda(items: Schedule[]): void { this.agenda.set(items); }
  setError(message: string | null): void { this.error.set(message); }

  /** Efek "jaringan digambar sendiri" — identik animateBookLines()/
   *  animateNewsLines() di hero Perpustakaan/Berita. */
  private animateCalLines(): void {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.calLineRefs?.forEach((ref, i) => {
      const path = ref.nativeElement;
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      if (reduced) { path.style.strokeDashoffset = '0'; return; }
      path.animate(
        [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
        { duration: 600, delay: 700 + i * 130, easing: 'ease-out', fill: 'forwards' },
      );
    });
  }
}
