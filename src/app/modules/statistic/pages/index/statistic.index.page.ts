import {
  AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit,
  QueryList, ViewChild, ViewChildren, computed, inject, signal,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { IconComponent } from '../../../../shared/icon.component';
import { PageHeroComponent } from '../../../../shared/page-hero.component';
import { SearchFilterSortComponent, FilterFieldDef } from '../../../../shared/search-filter-sort.component';
import { NetworkStats, DirectoryEntry } from '../../entities/statistic';
import { StatisticIndexPresenter } from './statistic.index.presenter';
import { StatisticIndexView } from './statistic.index.view';

/** Satu simpul Puskomda dalam tree direktori, beserta unit LDK di bawahnya.
 *  `puskomda` null berarti baris Puskomda-nya sendiri tidak ikut termuat
 *  (tersaring filter tipe/pencarian) — grup tetap ditampilkan pakai
 *  `puskomdaName` (dari DirectoryEntry.parentOrganizationName hasil JOIN
 *  backend, selalu terisi lepas dari filter WHERE), cuma tanpa kartu detail. */
interface PuskomdaGroup {
  puskomdaID: number | null;
  puskomdaName: string;
  puskomda: DirectoryEntry | null;
  ldks: DirectoryEntry[];
}

/** Backend membatasi limit list maksimum 100 (base/dto/pagination.go,
 *  dipakai lintas modul — sengaja TIDAK diubah cuma untuk fitur ini).
 *  Tree butuh seluruh hasil filter sekaligus supaya pengelompokan Puskomda
 *  -> unit benar, jadi diminta sekali di batas atas itu alih-alih paginasi
 *  bernomor seperti sebelumnya; kalau hasil > 100, tampilkan catatan jujur
 *  (lihat directoryTruncated()) alih-alih diam-diam memotong. */
const DIRECTORY_TREE_LIMIT = 100;

Chart.register(...registerables);

type TabId = 'statistik' | 'direktori';

const TYPE_OPTIONS = [
  { value: 'LDK', label: 'LDK' },
  { value: 'PUSKOMDA', label: 'Puskomda' },
  { value: 'PUSKOMNAS', label: 'Puskomnas' },
];

const TYPE_LABELS: Record<string, string> = { LDK: 'LDK', PUSKOMDA: 'Puskomda', PUSKOMNAS: 'Puskomnas' };

/**
 * Public page "Statistik Jaringan" — hero & kanvas latar DISAMAKAN dengan
 * Galeri/Struktur Organisasi (app-page-hero + .section-blob-drift, lihat
 * komentar masing-masing di bawah). Dua tab: "Statistik" (ringkasan angka +
 * kedua chart digabung jadi satu tampilan, sebelumnya 3 tab terpisah) dan
 * "Direktori LDK" — pakai app-search-filter-sort (komponen global yang sama
 * dipakai halaman Galeri), disusun sebagai PETA jaringan: Puskomnas jadi hub
 * bercahaya di tengah, garis kurva SVG menyambung ke tiap grup Puskomda
 * (jumlahnya terbatas jadi aman dihitung ulang saat resize/filter), unit LDK
 * tetap mengelompok dalam grid di bawah grupnya masing-masing — BUKAN garis
 * bebas yang menyambung ke tiap kartu LDK satu-satu (jumlahnya bisa banyak &
 * reflow grid-nya rapuh terhadap garis presisi, sudah dipertimbangkan &
 * sengaja dihindari, lihat diskusi arah desain sebelumnya).
 */
@Component({
  selector: 'app-statistic-index-page',
  standalone: true,
  templateUrl: './statistic.index.page.html',
  imports: [IconComponent, PageHeroComponent, SearchFilterSortComponent, TitleCasePipe],
  providers: [StatisticIndexPresenter],
  styles: [`
    :host { display: block; }

    /* ---------- Siluet hero: peta jaringan (hub Puskomnas di tengah -> 3
       simpul Puskomda mengorbit -> tiap Puskomda bercabang ke 2 simpul LDK)
       — pola orbital, BEDA dari pohon vertikal Struktur Organisasi, supaya
       terasa seperti "peta sebaran", bukan bagan organisasi. Primitif visual
       (.network-node/.network-line/.network-ping) SAMA PERSIS dipakai ulang
       dari Beranda/Struktur/Galeri (styles.scss) — bukan diimplementasi
       ulang di sini, cuma komposisi node & garisnya yang baru. ---------- */
    .hero-network-visual { position: relative; width: 100%; }
    .hero-network-svg { position: relative; z-index: 1; width: 100%; height: 280px; overflow: visible; }

    .stat-hub-group { transform-box: fill-box; transform-origin: 50% 50%; opacity: 0; animation: statHubGrow .8s cubic-bezier(.34,1.4,.64,1) forwards; }
    @keyframes statHubGrow { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: scale(1); } }

    .stat-orbit-group { opacity: 0; animation: statOrbitFadeIn .5s var(--ease-out) forwards; }
    .stat-orbit-group.o1 { animation-delay: .35s; }
    .stat-orbit-group.o2 { animation-delay: .5s; }
    .stat-orbit-group.o3 { animation-delay: .65s; }
    @keyframes statOrbitFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

    .stat-leaf-group { opacity: 0; animation: statOrbitFadeIn .4s var(--ease-out) .9s forwards; }

    @media (prefers-reduced-motion: reduce) {
      .stat-hub-group, .stat-orbit-group, .stat-leaf-group { animation: none; opacity: 1; transform: none; }
    }

    /* ---------- Kanvas setelah hero — DISALIN PERSIS dari Galeri/Struktur
       (.section + .section-transition + .section-blob-drift): tint hijau +
       dua radial-gradient "blob" yang melayang pelan, fade-mask di tepi
       atas/bawah. Duplikasi disengaja (view encapsulation Angular tidak
       membagikan style antar komponen) — lihat komentar aslinya di
       gallery.public-index.page.ts. ---------- */
    .section { background: var(--color-primary-tint); position: relative; min-height: 60vh; }
    .section-transition { position: relative; padding-top: 32px; }
    .section-blob-drift { overflow: hidden; }
    .section-blob-drift > .container { position: relative; z-index: 1; }
    .section-blob-drift::before {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 55% 55% at 88% 42%, var(--color-gold-soft) 0%, var(--color-primary-soft) 42%, transparent 75%),
        radial-gradient(ellipse 50% 50% at 10% 62%, var(--color-primary-soft) 0%, var(--color-gold-soft) 45%, transparent 75%);
      opacity: .8; animation: sectionBlobDrift 12s ease-in-out infinite alternate;
    }
    .section-blob-drift::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: linear-gradient(to bottom,
        var(--color-primary-tint) 0, transparent 70px,
        transparent calc(100% - 70px), var(--color-primary-tint) 100%);
    }
    @keyframes sectionBlobDrift {
      from { transform: translate(0, 0) scale(1); }
      to { transform: translate(-4%, 5%) scale(1.15); }
    }
    @media (prefers-reduced-motion: reduce) { .section-blob-drift::before { animation: none; } }

    /* ---------- Tab bar — satu kartu putih berisi pill (pola sama seperti
       .pgn-card pagination/.tentang-tabs-bar Beranda), bukan lagi pill lepas
       mengambang sendiri-sendiri. ---------- */
    .tab-bar-wrap { display: flex; justify-content: center; margin-bottom: 36px; }
    .tab-bar { display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 4px; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 6px; box-shadow: var(--shadow-sm); }
    .tab-btn {
      display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px;
      border-radius: var(--radius-md); border: none; background: transparent;
      color: var(--color-text-secondary); font-weight: 700; font-size: .88rem; font-family: var(--font-body);
      cursor: pointer; white-space: nowrap;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .tab-btn:hover { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .tab-btn.active { background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: #fff; box-shadow: 0 4px 12px rgba(0,147,59,.28); }

    /* ---------- Kartu statistik — icon-badge (utility global) + entrance
       bertahap + aksen gradient yang muncul saat hover (pola "shine" sama
       seperti kartu lain di app ini), supaya terasa lebih hidup/"smooth"
       (diminta eksplisit), bukan cuma kotak statis. ---------- */
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; max-width: 980px; margin: 0 auto; }
    /* ---------- Hover: dua percobaan "cincin gradient berputar" SEBELUMNYA
       dibuang — keduanya bikin kartu rusak kelihatan di browser user
       (percobaan 1: ::before z-index:-1, ternyata tetap tercat DI ATAS
       background kartu per spec paint order, jadi kotak penuh ikut
       ter-rotate jadi belah-ketupat raksasa; percobaan 2: border transparan
       + 2-layer background-clip + @property --ring-angle, ternyata di
       browser user malah bikin satu kartu hilang total saat di-hover —
       kemungkinan dukungan @property/background-clip ganda yang tidak
       konsisten). Diganti teknik PALING SEDERHANA & paling kecil risikonya:
       border solid + box-shadow glow warna — tidak menyentuh background sama
       sekali, jadi konten kartu TIDAK MUNGKIN ikut hilang/rusak. ---------- */
    .stat-card, .chart-card {
      position: relative;
      background: #fff; border: 1px solid var(--color-border); border-radius: 20px;
      box-shadow: var(--shadow-sm);
      transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-base) ease, border-color var(--motion-base) ease;
    }
    .stat-card:hover, .chart-card:hover {
      transform: translateY(-5px); border-color: var(--color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 16%, transparent), var(--shadow-lg);
    }

    .stat-card {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 28px 20px; text-align: center;
      opacity: 0; animation: statCardIn .55s var(--ease-out) forwards;
    }
    .stat-card:nth-child(1) { animation-delay: .04s; }
    .stat-card:nth-child(2) { animation-delay: .11s; }
    .stat-card:nth-child(3) { animation-delay: .18s; }
    .stat-card:nth-child(4) { animation-delay: .25s; }
    @keyframes statCardIn { from { opacity: 0; transform: translateY(16px) scale(.96); } to { opacity: 1; transform: none; } }
    .stat-card b { display: block; font-family: var(--font-heading); font-size: 2.1rem; font-weight: 800; color: var(--color-text); transition: transform var(--motion-fast) var(--ease-out); }
    .stat-card:hover b { transform: scale(1.08); }
    .stat-card .icon-badge { transition: transform var(--motion-fast) var(--ease-out); }
    .stat-card:hover .icon-badge { transform: scale(1.1) rotate(-4deg); }
    .stat-card span { font-size: .86rem; color: var(--color-text-secondary); font-weight: 600; }
    @media (max-width: 720px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }

    /* ---------- Angka turunan — "diminta eksplisit: statistik lain yang bisa
       dipahami" — rasio/jangkauan lebih bermakna sekilas dibanding total
       mentah saja. Kartu lebih ringkas (baris, bukan kotak) supaya terbaca
       sebagai "detail tambahan", bukan bersaing dengan 4 kartu utama. ---------- */
    .insight-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; max-width: 980px; margin: 18px auto 0; }
    .insight-card {
      display: flex; align-items: center; gap: 12px; flex: 1 1 220px;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg);
      padding: 14px 20px; box-shadow: var(--shadow-sm);
      opacity: 0; animation: statCardIn .5s var(--ease-out) .32s forwards;
    }
    .insight-card b { display: block; font-family: var(--font-heading); font-weight: 800; font-size: 1.25rem; color: var(--color-text); }
    .insight-card span { font-size: .76rem; color: var(--color-text-secondary); font-weight: 600; }

    .stats-charts-row { display: grid; grid-template-columns: 1.6fr 1fr; gap: 24px; max-width: 980px; margin: 36px auto 0; align-items: start; }
    @media (max-width: 860px) { .stats-charts-row { grid-template-columns: 1fr; } }

    .chart-card {
      padding: 32px;
      opacity: 0; animation: chartCardIn .55s var(--ease-out) .2s forwards;
    }
    .chart-card.level { animation-delay: .3s; }
    @keyframes chartCardIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
    .chart-card h3 { margin: 0 0 20px; text-align: center; font-family: var(--font-heading); font-weight: 800; color: var(--color-text); }
    .chart-wrap { position: relative; }
    .chart-wrap.province { height: 420px; }
    .chart-wrap.level { height: 300px; max-width: 320px; margin: 0 auto; }

    @media (prefers-reduced-motion: reduce) {
      .stat-card, .chart-card, .insight-card { animation: none; opacity: 1; transform: none; }
      .stat-card:hover b, .stat-card:hover .icon-badge { transform: none; }
    }

    .directory-toolbar { max-width: 900px; margin: 0 auto 10px; }
    .directory-truncated-note {
      display: flex; align-items: center; justify-content: center; gap: 7px;
      max-width: 900px; margin: 0 auto 28px; padding: 10px 16px;
      background: var(--color-gold-soft); color: var(--color-gold-dark);
      border-radius: var(--radius-md); font-size: .82rem; font-weight: 600; text-align: center;
    }

    .org-card {
      background: #fff; border: 1px solid var(--color-border); border-radius: 18px;
      padding: 22px 18px; text-align: center;
      transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease, border-color var(--motion-fast) ease;
    }
    .org-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); border-color: var(--color-primary-soft); }
    .org-logo { width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 14px; object-fit: cover; border: 1px solid var(--color-border); }
    .org-logo-fallback { width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; }
    .org-card h4 { margin: 0 0 6px; font-size: .98rem; font-family: var(--font-heading); }
    /* align-items:flex-start (bukan center) — teks kota/provinsi yang
       panjang bisa melipat 2-3 baris di kartu sempit; center membuat ikon
       melayang di tengah blok multi-baris (dilaporkan "kurang enak
       dilihat"). flex-start membuat ikon sejajar baris pertama, lebih rapi. */
    .org-meta { display: flex; align-items: flex-start; justify-content: center; gap: 6px; font-size: .78rem; color: var(--color-muted); margin: 0; font-weight: 600; line-height: 1.45; text-align: center; }
    .org-meta app-icon { flex-shrink: 0; margin-top: 2px; }

    /* Kontak lengkap per unit LDK (website/email/telepon) — keputusan produk
       eksplisit untuk ditampilkan apa adanya di kartu publik, lihat komentar
       DirectoryEntry di statistic.ts. */
    .org-card-links { display: flex; flex-direction: column; gap: 7px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--color-border); text-align: left; }
    .org-card-link {
      display: flex; align-items: center; gap: 6px; font-size: .74rem; font-weight: 600;
      color: var(--color-text-secondary); text-decoration: none;
    }
    .org-card-link app-icon { flex-shrink: 0; color: var(--color-primary); }
    .org-card-link span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .org-card-link:hover { color: var(--color-primary-dark); text-decoration: underline; }

    /* =====================================================================
       Direktori sebagai PETA — hub Puskomnas bercahaya (reuse .network-node/
       .network-ping) di tengah, garis kurva SVG ke tiap grup Puskomda
       (dihitung dari posisi DOM asli via getBoundingClientRect, lihat
       recomputeConnectors() di .ts), unit LDK mengelompok dalam grid biasa
       di bawah grupnya — TIDAK ada garis per-kartu LDK (lihat komentar
       class komponen). ===================================================================== */
    .org-map { position: relative; max-width: 980px; margin: 0 auto; transition: opacity .25s ease; }
    .org-map.is-refetching { opacity: .5; pointer-events: none; }
    .org-map-loading-bar {
      position: absolute; top: -12px; left: 0; right: 0; height: 3px; z-index: 10; border-radius: 999px;
      background: linear-gradient(90deg, var(--color-primary), #10b981, var(--color-primary));
      background-size: 200% 100%; animation: orgMapShimmer 1s infinite linear;
    }
    @keyframes orgMapShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* Garis kurva — reuse .network-line (styles.scss) apa adanya, posisi
       absolute tanpa viewBox (width/height di-set ke ukuran .org-map yang
       sesungguhnya dalam px lewat [attr.width]/[attr.height], supaya 1 unit
       SVG = 1px, cocok dengan hasil getBoundingClientRect). Opacity 0 ->
       1 SETELAH posisi pertama kali berhasil dihitung (linesReady), supaya
       tidak pernah kelihatan "lompat" dari sudut (0,0) sebelum terukur. */
    .org-map-lines { position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0; transition: opacity .45s ease; }
    .org-map-lines.ready { opacity: 1; }

    .org-hub-wrap { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 48px; }
    .org-hub-node { position: relative; width: 84px; height: 84px; }
    .org-hub-svg { width: 100%; height: 100%; overflow: visible; }
    .org-hub-icon { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; pointer-events: none; }
    .org-hub-body { text-align: center; }
    .org-hub-body h4 { margin: 0; font-size: 1.05rem; font-family: var(--font-heading); color: var(--color-text); }
    .org-hub-caption { display: block; font-size: .76rem; font-weight: 700; letter-spacing: .03em; color: var(--color-primary-dark); margin-top: 3px; }

    .org-map-groups { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 40px; }
    .org-group { position: relative; }
    .org-group-head { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; min-height: 26px; flex-wrap: wrap; }
    /* Simpul kecil bercahaya (reuse .network-node/.network-ping gold) —
       inilah titik yang diukur recomputeConnectors() sebagai ujung garis
       kurva dari hub, BUKAN elemen dekoratif semata. */
    .org-group-node { position: relative; width: 16px; height: 16px; flex-shrink: 0; }
    .org-group-node svg { width: 100%; height: 100%; overflow: visible; }
    /* Nama + kepanjangan "Pusat Komunikasi Daerah" ditumpuk — pola sama
       persis dengan .org-hub-body (nama Puskomnas + "Pusat Komunikasi
       Nasional"), supaya tiap Puskomda terasa jadi hub mini yang setara
       bahasanya dengan hub utama. */
    .org-group-title { display: flex; flex-direction: column; gap: 1px; }
    .org-group-head h4 { margin: 0; font-size: 1rem; font-family: var(--font-heading); color: var(--color-text); }
    .org-group-caption { font-size: .74rem; font-weight: 700; color: var(--color-gold-dark); }
    .org-group-unloaded { color: var(--color-muted); font-weight: 600; font-style: italic; }
    .org-group-count { margin-left: auto; font-size: .76rem; font-weight: 700; background: var(--color-primary-soft); color: var(--color-primary-dark); padding: 4px 11px; border-radius: 999px; white-space: nowrap; }

    .org-group-children { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; }
    .org-group-children .org-card { padding: 16px 14px; }
    .org-group-children .org-logo, .org-group-children .org-logo-fallback { width: 52px; height: 52px; margin-bottom: 10px; }
    .org-group-empty { grid-column: 1 / -1; font-size: .82rem; color: var(--color-muted); padding: 10px 0; }

    .empty-note { text-align: center; color: var(--color-muted); padding: 40px 0; }

    @media (max-width: 480px) {
      .tab-bar { padding: 4px; gap: 2px; }
      .tab-btn { padding: 9px 13px; font-size: .8rem; }
      .chart-card { padding: 20px; }
      .org-hub-node { width: 68px; height: 68px; }
      .org-group-count { margin-left: 0; }
    }
  `],
})
export class StatisticIndexPage implements OnInit, AfterViewInit, OnDestroy, StatisticIndexView {
  private presenter = inject(StatisticIndexPresenter);

  activeTab = signal<TabId>('direktori');
  readonly tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'direktori', label: 'Jaringan', icon: 'building' },
    { id: 'statistik', label: 'Statistik', icon: 'chart-bar' },
  ];

  stats = signal<NetworkStats | null>(null);
  statsLoading = signal(true);

  /** Angka turunan — lebih mudah dipahang sekilas dibanding total mentah
   *  (mis. "3 LDK Aktif" saja tidak bilang apa-apa soal jangkauan/rasio).
   *  Dibulatkan 1 desimal, dijaga dari pembagian nol. */
  insightStats = computed(() => {
    const s = this.stats();
    if (!s) return null;
    const round1 = (n: number) => Math.round(n * 10) / 10;
    return {
      provinceReach: s.byProvince.length,
      avgLdkPerPuskomda: s.totalPuskomda > 0 ? round1(s.totalLDK / s.totalPuskomda) : 0,
      avgKaderPerLdk: s.totalLDK > 0 ? round1(s.totalActiveKader / s.totalLDK) : 0,
    };
  });

  directory = signal<DirectoryEntry[]>([]);
  directoryLoading = signal(true);
  directoryCount = signal(0);
  directorySearch = signal('');
  /** Nilai filter aktif direktori — key cocok FilterFieldDef.key (lihat
   *  directoryFilterFields()): 'type' & 'province', keduanya single-select. */
  directoryFilterValues = signal<Record<string, unknown>>({});
  private directoryLoadedOnce = false;

  /** Skeleton penuh HANYA di muat pertama kali; pencarian/filter berikutnya
   *  cukup meredupkan peta yang sudah ada (.org-map.is-refetching) + loading
   *  bar tipis — supaya render-nya terasa smooth, bukan "glitch" berganti
   *  skeleton tiap kali mengetik di pencarian (diminta eksplisit). */
  showDirectorySkeleton = computed(() => this.directoryLoading() && this.directory().length === 0 && !this.directoryLoadedOnce);
  directoryRefetching = computed(() => this.directoryLoading() && (this.directory().length > 0 || this.directoryLoadedOnce));

  /** Field filter Direktori — opsi Provinsi data-driven dari stats().byProvince
   *  (distinct dari data yang benar-benar ada), opsi Tipe tetap (3 tipe
   *  organisasi baku). Dipakai app-search-filter-sort (komponen global yang
   *  sama dipakai listing publik Galeri), menggantikan 2 <app-select> +
   *  input pencarian mentah sebelumnya. */
  directoryFilterFields = computed<FilterFieldDef[]>(() => [
    { key: 'type', label: 'Tipe Unit', icon: 'sitemap', options: TYPE_OPTIONS },
    {
      key: 'province', label: 'Provinsi', icon: 'map-pin',
      options: (this.stats()?.byProvince ?? []).map((p) => ({ value: p.provinceName, label: p.provinceName })),
    },
  ]);

  /** Puskomnas akar — ditampilkan sebagai hub peta, bukan ikut dikelompokkan
   *  (dia sendiri tidak punya induk). Bisa kosong kalau tersaring filter
   *  tipe (mis. filter "LDK" saja). */
  rootPuskomnas = computed(() => this.directory().find((o) => o.organizationTypeCode === 'PUSKOMNAS') ?? null);

  /** Susun direktori sebagai grup Puskomda -> daftar unit LDK di bawahnya,
   *  data-driven sepenuhnya dari parentOrganizationID/parentOrganizationName
   *  (hasil JOIN backend) — bukan diasumsikan dari urutan/posisi tampilan.
   *  Grup tetap terbentuk & diberi label walau baris Puskomda-nya sendiri
   *  tidak ikut termuat (parentOrganizationName tetap ada dari JOIN, lepas
   *  dari filter WHERE di backend), supaya unit LDK tidak pernah "hilang"
   *  dari peta hanya karena induknya kebetulan tersaring. */
  directoryTree = computed<PuskomdaGroup[]>(() => {
    const items = this.directory();
    const groups = new Map<string, PuskomdaGroup>();

    for (const o of items) {
      if (o.organizationTypeCode !== 'PUSKOMDA') continue;
      groups.set(String(o.organizationID), { puskomdaID: o.organizationID, puskomdaName: o.organizationName, puskomda: o, ldks: [] });
    }

    for (const o of items) {
      if (o.organizationTypeCode !== 'LDK') continue;
      const key = o.parentOrganizationID != null ? String(o.parentOrganizationID) : `nama:${o.parentOrganizationName ?? 'Tanpa Puskomda Induk'}`;
      let group = groups.get(key);
      if (!group) {
        group = { puskomdaID: o.parentOrganizationID ?? null, puskomdaName: o.parentOrganizationName ?? 'Tanpa Puskomda Induk', puskomda: null, ldks: [] };
        groups.set(key, group);
      }
      group.ldks.push(o);
    }

    return Array.from(groups.values()).sort((a, b) => a.puskomdaName.localeCompare(b.puskomdaName));
  });

  /** Direktori dimuat sekali per filter dalam batas DIRECTORY_TREE_LIMIT
   *  (bukan paginasi bernomor, lihat komentar konstantanya) — kalau hasil
   *  sesungguhnya lebih banyak dari itu, tampilkan catatan jujur alih-alih
   *  diam-diam memotong (lihat .html). */
  directoryTruncated = computed(() => this.directoryCount() > this.directory().length);

  /** Garis kurva hub -> tiap grup Puskomda, dihitung ulang dari posisi DOM
   *  asli (lihat recomputeConnectors()) — bukan dari data statis, supaya
   *  selalu cocok dengan layout sesungguhnya (resize, reflow grid, jumlah
   *  grup berubah karena filter). */
  connectorPaths = signal<string[]>([]);
  linesReady = signal(false);
  mapSize = signal({ w: 0, h: 0 });

  @ViewChild('mapWrap') private mapWrapRef?: ElementRef<HTMLElement>;
  @ViewChild('hubNode') private hubNodeRef?: ElementRef<HTMLElement>;
  @ViewChildren('groupNode') private groupNodeRefs?: QueryList<ElementRef<HTMLElement>>;

  private resizeObserver?: ResizeObserver;
  private resizeObserverTarget?: HTMLElement;

  private provinceChart: Chart | null = null;
  private levelChart: Chart | null = null;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.statsLoading.set(true);
    this.presenter.loadStats();
    // "Jaringan" (direktori) sekarang tab default — muat datanya langsung,
    // bukan cuma lewat switchTab() (yang hanya terpicu oleh klik user).
    if (this.activeTab() === 'direktori' && !this.directoryLoadedOnce) {
      this.directoryLoadedOnce = true;
      this.loadDirectory();
    }
  }

  ngAfterViewInit(): void {
    // QueryList berubah tiap kali jumlah grup Puskomda berubah (filter/
    // pencarian/tab masuk-keluar) — di situlah posisi node-nodenya perlu
    // dihitung ulang.
    this.groupNodeRefs?.changes.subscribe(() => this.scheduleRecomputeConnectors());
  }

  ngOnDestroy(): void {
    this.provinceChart?.destroy();
    this.levelChart?.destroy();
    this.resizeObserver?.disconnect();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.activeTab() === 'direktori') this.scheduleRecomputeConnectors();
  }

  switchTab(tab: TabId): void {
    this.activeTab.set(tab);
    if (tab === 'statistik' && this.stats()) {
      setTimeout(() => this.renderCharts(), 0);
    }
    if (tab === 'direktori') {
      if (!this.directoryLoadedOnce) {
        this.directoryLoadedOnce = true;
        this.loadDirectory();
      } else {
        this.scheduleRecomputeConnectors();
      }
    }
  }

  loadDirectory(): void {
    this.directoryLoading.set(true);
    const filter = this.directoryFilterValues();
    this.presenter.loadDirectory(
      1,
      DIRECTORY_TREE_LIMIT,
      this.directorySearch(),
      (filter['type'] as string) || '',
      (filter['province'] as string) || '',
    );
  }

  onDirectorySearch(value: string): void {
    this.directorySearch.set(value);
    this.loadDirectory();
  }

  onDirectoryFilterApply(values: Record<string, unknown>): void {
    this.directoryFilterValues.set(values);
    this.loadDirectory();
  }

  typeLabel(code: string): string { return TYPE_LABELS[code] ?? code; }

  /** wa.me butuh digit saja (buang "+"/spasi/strip) — pola sama persis
   *  dipakai lintas halaman publik lain (lihat whatsapp-fab.component.ts,
   *  home.index.page.ts contactWhatsappDigits(), dsb). */
  waLink(phone: string): string {
    return `https://wa.me/${phone.replace(/\D/g, '')}`;
  }

  private scheduleRecomputeConnectors(): void {
    requestAnimationFrame(() => this.recomputeConnectors());
  }

  /** Ukur posisi DOM asli hub & tiap simpul grup (getBoundingClientRect),
   *  lalu bangun kurva Bezier vertikal dari hub ke tiap simpul — data-driven
   *  dari layout sesungguhnya, bukan dihitung dari koordinat statis, supaya
   *  selalu cocok berapa pun jumlah grup & lebar layar. */
  private recomputeConnectors(): void {
    const wrap = this.mapWrapRef?.nativeElement;
    const hub = this.hubNodeRef?.nativeElement;
    const nodes = this.groupNodeRefs?.toArray() ?? [];
    if (!wrap || !hub || nodes.length === 0) {
      this.connectorPaths.set([]);
      return;
    }

    if (wrap !== this.resizeObserverTarget && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver?.disconnect();
      this.resizeObserver = new ResizeObserver(() => this.scheduleRecomputeConnectors());
      this.resizeObserver.observe(wrap);
      this.resizeObserverTarget = wrap;
    }

    const wrapRect = wrap.getBoundingClientRect();
    this.mapSize.set({ w: wrapRect.width, h: wrapRect.height });

    const hubRect = hub.getBoundingClientRect();
    const hx = hubRect.left + hubRect.width / 2 - wrapRect.left;
    const hy = hubRect.top + hubRect.height / 2 - wrapRect.top;

    const paths = nodes.map((ref) => {
      const r = ref.nativeElement.getBoundingClientRect();
      const nx = r.left + r.width / 2 - wrapRect.left;
      const ny = r.top + r.height / 2 - wrapRect.top;
      const midY = (hy + ny) / 2;
      return `M${hx},${hy} C${hx},${midY} ${nx},${midY} ${nx},${ny}`;
    });
    this.connectorPaths.set(paths);
    this.linesReady.set(true);
  }

  private renderCharts(): void {
    const stats = this.stats();
    if (!stats) return;

    this.provinceChart?.destroy();
    this.provinceChart = null;
    const provinceCanvas = document.getElementById('provinceChart') as HTMLCanvasElement | null;
    if (provinceCanvas && stats.byProvince.length > 0) {
      this.provinceChart = new Chart(provinceCanvas, {
        type: 'bar',
        data: {
          labels: stats.byProvince.map((p) => p.provinceName),
          datasets: [{ label: 'Jumlah LDK', data: stats.byProvince.map((p) => p.count), backgroundColor: '#00933b' }],
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      });
    }

    this.levelChart?.destroy();
    this.levelChart = null;
    const levelCanvas = document.getElementById('levelChart') as HTMLCanvasElement | null;
    if (levelCanvas && stats.byLevel.length > 0) {
      this.levelChart = new Chart(levelCanvas, {
        type: 'doughnut',
        data: {
          labels: stats.byLevel.map((l) => l.levelLabel),
          datasets: [{ data: stats.byLevel.map((l) => l.count), backgroundColor: ['#00933b', '#00b34d', '#5cd685', '#a7ecc0', '#d7f3e2'] }],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });
    }
  }

  setStats(stats: NetworkStats): void {
    this.stats.set(stats);
    this.statsLoading.set(false);
    if (this.activeTab() === 'statistik') {
      setTimeout(() => this.renderCharts(), 0);
    }
  }
  setStatsError(): void { this.statsLoading.set(false); }

  setDirectory(items: DirectoryEntry[], count: number): void {
    this.directory.set(items);
    this.directoryCount.set(count);
    this.directoryLoading.set(false);
    this.scheduleRecomputeConnectors();
  }
  setDirectoryError(): void { this.directoryLoading.set(false); }
}
