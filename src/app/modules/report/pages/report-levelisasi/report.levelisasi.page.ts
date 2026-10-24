import { Component, OnInit, inject, signal, computed, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { tap } from 'rxjs';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { OrgContextService } from '../../../../core/services/org-context.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { ReportFilterBarComponent, ReportFilterFieldDef } from '../../../../shared/report-filter-bar.component';
import { StatisticRepository } from '../../../statistic/repositories/statistic.repository';
import { SUBMISSION_STATUS_LABELS, LEVEL_OPTIONS } from '../../../submission/entities/submission';
import { ReportFilterValue, EMPTY_REPORT_FILTER, ReportSubmissionRow } from '../../entities/report';
import { ReportLevelisasiPresenter } from './report.levelisasi.presenter';
import { ReportLevelisasiView } from './report.levelisasi.view';

/** CmsIndexConfig<ReportSubmissionRow> — statusOptions/searchTargets/showDateRange
 *  SENGAJA tidak diisi: filter-nya sekarang datang dari ReportFilterBarComponent
 *  (DL-4, lebih dari satu dimensi multi-select sekaligus, lihat plan Task 10 /
 *  "Correction to the spec" di header plan ini) — CmsIndexComponent di sini
 *  cuma dipakai untuk tabel/pagination/"Atur Kolom". */
function buildConfig(): CmsIndexConfig<ReportSubmissionRow> {
  return {
    entityLabel: 'submission',
    columns: [
      { key: 'organizationName', label: 'LDK', locked: true },
      { key: 'parentOrganizationName', label: 'Puskomda' },
      { key: 'provinceName', label: 'Provinsi' },
      { key: 'cityName', label: 'Kota/Kabupaten' },
      { key: 'status', label: 'Status' },
      { key: 'levelLabel', label: 'Level' },
      { key: 'submittedDate', label: 'Terkirim' },
    ],
    defaultSort: { sortBy: 'organizationName', sortDir: 'asc' },
    rowIdKey: 'submissionID', // identitas baris sungguhan — organizationName bisa kolisi (dua LDK beda kota/Puskomda bisa saja sama nama)
    limit: 50,
    emptyIcon: 'clipboard-list',
    emptyTitle: 'Tidak ada data',
    emptyDescription: 'Belum ada submission Levelisasi LDK yang cocok dengan filter ini.',
  };
}

@Component({
  selector: 'app-report-levelisasi-page',
  standalone: true,
  templateUrl: './report.levelisasi.page.html',
  imports: [CmsIndexComponent, ReportFilterBarComponent],
  providers: [ReportLevelisasiPresenter],
  styles: [`.page-head { margin-bottom: 28px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class ReportLevelisasiPage implements OnInit, ReportLevelisasiView {
  private presenter = inject(ReportLevelisasiPresenter);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthRepository);
  private orgContext = inject(OrgContextService);
  private statisticRepo = inject(StatisticRepository);
  private toast = inject(ToastService);

  @ViewChild(CmsIndexComponent) private cmsIndex?: CmsIndexComponent<ReportSubmissionRow>;

  title = this.route.snapshot.data['title'] as string;
  readonly config = buildConfig();
  readonly statusLabels = SUBMISSION_STATUS_LABELS;
  exporting = signal(false);

  /** Tabel BARU muncul setelah "Tampilkan Laporan" ditekan pertama kali —
   *  <app-cms-index> tidak dirender sampai ini true (template), supaya
   *  ngOnInit()-nya (yang auto-load lewat dataSource) tidak sempat jalan
   *  dengan EMPTY_REPORT_FILTER saat halaman baru dibuka. Sama perilaku
   *  dengan ReportPendataanPage, yang memang tidak pernah auto-load (tidak
   *  pakai CmsIndexComponent) — permintaan user saat manual testing. */
  hasShownReport = signal(false);
  showing = signal(false);

  /** Sama pola dengan canCreate/canUpdate/dst di modul lain (mis.
   *  news.index.page.ts) — ReportFilterBarComponent (Task 10, sudah
   *  direview) selalu merender tombol Download Report tanpa tahu
   *  permission, jadi gating-nya dilakukan di sini: tombol tetap tampil
   *  (Show Report harus tetap bisa dipakai pemegang .view saja — sudah
   *  digerbangi route canActivate: [permissionGuard]) tapi onDownloadReport()
   *  jadi no-op + toast peringatan bila caller tidak punya exportPermission. */
  canExport = this.auth.hasPermission(this.route.snapshot.data['exportPermission'] as string);

  /** Shell saat ini (sama pendekatan dengan ReportHubPage.isNasional) —
   *  menentukan apakah field filter Puskomda ikut ditampilkan (DL-4: hanya
   *  tier Puskomnas yang butuh menyaring lintas-Puskomda, tier Puskomda
   *  sudah otomatis terbatas ke wilayahnya sendiri). */
  private isNasional = this.route.snapshot.pathFromRoot.some((r) => r.url.some((seg) => seg.path === 'cms-puskomnas'));

  /** Provinsi/Kota/Puskomda HANYA tampil di tier Puskomnas (permintaan user
   *  saat manual testing) — tier Puskomda sudah otomatis terbatas ke satu
   *  wilayah sendiri, jadi filter Provinsi/Kota di portalnya sendiri redundan.
   *  Provinsi/Kota: distinct dari data organisasi yang benar-benar ada
   *  (GET /public/network-stats, endpoint publik yang sama dipakai Direktori
   *  Jaringan — lihat statistic.index.page.ts:444-446) — bukan daftar wilayah
   *  administratif Indonesia generik, dan bukan endpoint baru. Puskomda:
   *  GET /organizations/directory?organizationTypeCode=PUSKOMDA (idem,
   *  statistic.index.presenter.ts loadPuskomdaOptions()). Level: LEVEL_OPTIONS
   *  (submission/entities/submission.ts), dipakai tetap di sini karena Laporan
   *  Levelisasi selalu relevan dengan level, beda dari Laporan Pendataan
   *  (Task 14) yang tidak menyertakannya. */
  private provinceOptions = signal<{ value: string; label: string }[]>([]);
  private cityOptions = signal<{ value: string; label: string }[]>([]);
  private puskomdaOptions = signal<{ value: string; label: string }[]>([]);
  /** Nama LDK — SELALU tampil di kedua tier (beda dari Provinsi/Kota/Puskomda
   *  di atas), tapi opsinya dibatasi beda per tier: tier Puskomda cuma
   *  LDK miliknya sendiri (directory `puskomda=<currentOrganizationID>`,
   *  "based on Puskomda-nya itu aja" — permintaan user), tier Puskomnas
   *  seluruh LDK nasional (directory tanpa filter puskomda). Endpoint sama
   *  dengan directory Puskomda di atas, type='LDK'. */
  private ldkOptions = signal<{ value: string; label: string }[]>([]);

  filterFields = computed<ReportFilterFieldDef[]>(() => {
    const fields: ReportFilterFieldDef[] = [
      { key: 'statuses', label: 'Status', options: Object.entries(SUBMISSION_STATUS_LABELS).map(([value, label]) => ({ value, label })) },
      { key: 'organizationIDs', label: 'Nama LDK', options: this.ldkOptions() },
    ];
    if (this.isNasional) {
      fields.push(
        { key: 'provinces', label: 'Provinsi', options: this.provinceOptions() },
        { key: 'cities', label: 'Kota/Kabupaten', options: this.cityOptions() },
      );
    }
    fields.push({ key: 'levelCodes', label: 'Level', options: LEVEL_OPTIONS });
    if (this.isNasional) fields.push({ key: 'puskomdaIDs', label: 'Puskomda', options: this.puskomdaOptions() });
    return fields;
  });

  private currentOrganizationID: number | undefined;
  private currentFilter: ReportFilterValue = { ...EMPTY_REPORT_FILTER };

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.orgContext.organizationID$(this.route).subscribe((id) => {
      this.currentOrganizationID = id;
      if (!this.isNasional) {
        this.statisticRepo.directory({ type: 'LDK', puskomda: id, limit: 100 }).subscribe({
          next: (p) => this.ldkOptions.set(p.data.map((o) => ({ value: String(o.organizationID), label: o.organizationName }))),
          error: () => {},
        });
      }
    });
    if (this.isNasional) {
      this.statisticRepo.networkStats().subscribe({
        next: (stats) => {
          this.provinceOptions.set(stats.byProvince.map((p) => ({ value: p.provinceName, label: p.provinceName })));
          this.cityOptions.set(stats.byCity.map((c) => ({ value: c.cityName, label: c.cityName })));
        },
        error: () => {},
      });
      this.statisticRepo.directory({ type: 'PUSKOMDA', limit: 100 }).subscribe({
        next: (p) => this.puskomdaOptions.set(p.data.map((o) => ({ value: String(o.organizationID), label: o.organizationName }))),
        error: () => {},
      });
      this.statisticRepo.directory({ type: 'LDK', limit: 100 }).subscribe({
        next: (p) => this.ldkOptions.set(p.data.map((o) => ({ value: String(o.organizationID), label: o.organizationName }))),
        error: () => {},
      });
    }
  }

  /** Dibungkus tap() (bukan baca CmsIndexComponent.loading() lewat
   *  @ViewChild) supaya busy-state tombol Show Report ikut nyala PERSIS saat
   *  dataSource dipanggil — baik dari ngOnInit() milik CmsIndexComponent
   *  (begitu <app-cms-index> pertama kali dirender) maupun dari refresh()
   *  tiap klik Tampilkan Laporan berikutnya — tanpa bergantung pada timing
   *  @ViewChild yang baru ter-update satu change-detection cycle setelahnya. */
  dataSource = (params: CmsListParams) => {
    this.showing.set(true);
    return this.presenter.list(this.currentFilter, params.page, params.limit, params.sort, this.currentOrganizationID).pipe(
      tap({ next: () => this.showing.set(false), error: () => this.showing.set(false) }),
    );
  };

  /** Sama pola dengan statusLabel() di ReportListPage yang dihapus — backend
   *  mengirim kode mentah tr_submission.status (mis. PUSKOMDA_REVIEW) tanpa
   *  terjemahan, fallback ke kode itu sendiri bila suatu saat ada status yang
   *  belum masuk peta. Dibungkus method (bukan ekspresi `??` langsung di
   *  template) supaya tidak kena NG8102 — SUBMISSION_STATUS_LABELS bertipe
   *  Record<string,string> sehingga TS templat strict menganggap index
   *  access-nya tidak pernah undefined. */
  statusLabel(code: string): string { return this.statusLabels[code] ?? code; }

  onShowReport(filter: ReportFilterValue): void {
    this.currentFilter = filter;
    this.hasShownReport.set(true);
    this.cmsIndex?.refresh();
  }

  onDownloadReport(filter: ReportFilterValue): void {
    if (!this.canExport) { this.toast.warning('Anda tidak memiliki izin mengunduh laporan ini.'); return; }
    this.currentFilter = filter;
    this.presenter.download(filter, 'xlsx', this.currentOrganizationID);
  }

  setExporting(exporting: boolean): void { this.exporting.set(exporting); }
}
