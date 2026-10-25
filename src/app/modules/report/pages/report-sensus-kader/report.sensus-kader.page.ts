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
import { KADER_STATUS_LABELS } from '../../../submission/entities/submission';
import { KaderFilterValue, EMPTY_KADER_FILTER, KaderReportRow } from '../../entities/report';
import { ReportSensusKaderPresenter } from './report.sensus-kader.presenter';
import { ReportSensusKaderView } from './report.sensus-kader.view';

/** CmsIndexConfig<KaderReportRow> — statusOptions/searchTargets/showDateRange
 *  SENGAJA tidak diisi, sama pola dengan ReportLevelisasiPage — filternya
 *  datang dari ReportFilterBarComponent, CmsIndexComponent di sini cuma
 *  dipakai untuk tabel/pagination/"Atur Kolom". */
function buildConfig(): CmsIndexConfig<KaderReportRow> {
  return {
    entityLabel: 'kader',
    columns: [
      { key: 'fullName', label: 'Nama Lengkap', locked: true },
      { key: 'organizationName', label: 'LDK' },
      { key: 'parentOrganizationName', label: 'Puskomda' },
      { key: 'provinceName', label: 'Provinsi' },
      { key: 'cityName', label: 'Kota/Kabupaten' },
      { key: 'status', label: 'Status Keanggotaan' },
      { key: 'uniqueCode', label: 'Kode Unik' },
      { key: 'issuedDate', label: 'Tanggal Terbit' },
    ],
    defaultSort: { sortBy: 'organizationName', sortDir: 'asc' },
    rowIdKey: 'kaderID',
    limit: 50,
    emptyIcon: 'user-group',
    emptyTitle: 'Tidak ada data',
    emptyDescription: 'Belum ada kader yang cocok dengan filter ini.',
  };
}

@Component({
  selector: 'app-report-sensus-kader-page',
  standalone: true,
  templateUrl: './report.sensus-kader.page.html',
  imports: [CmsIndexComponent, ReportFilterBarComponent],
  providers: [ReportSensusKaderPresenter],
  styles: [`.page-head { margin-bottom: 28px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class ReportSensusKaderPage implements OnInit, ReportSensusKaderView {
  private presenter = inject(ReportSensusKaderPresenter);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthRepository);
  private orgContext = inject(OrgContextService);
  private statisticRepo = inject(StatisticRepository);
  private toast = inject(ToastService);

  @ViewChild(CmsIndexComponent) private cmsIndex?: CmsIndexComponent<KaderReportRow>;

  title = this.route.snapshot.data['title'] as string;
  readonly config = buildConfig();
  readonly statusLabels = KADER_STATUS_LABELS;
  exporting = signal(false);

  /** Tabel baru muncul setelah "Tampilkan Laporan" ditekan pertama kali —
   *  sama pola dengan ReportLevelisasiPage (CmsIndexComponent auto-load di
   *  ngOnInit-nya sendiri, jadi tidak dirender sampai ini true). */
  hasShownReport = signal(false);
  showing = signal(false);

  canExport = this.auth.hasPermission(this.route.snapshot.data['exportPermission'] as string);

  /** Tier saat ini — 3 kemungkinan (beda dari ReportLevelisasiPage yang cuma
   *  2): LDK tidak punya filter Provinsi/Kota/Puskomda sama sekali (datanya
   *  sudah otomatis satu LDK, sama logika dengan Puskomda-tier Levelisasi),
   *  Puskomnas dapat ketiganya, Puskomda tidak dapat (sama seperti Levelisasi). */
  private isLdk = this.route.snapshot.pathFromRoot.some((r) => r.url.some((seg) => seg.path === 'cms-ldk'));
  private isNasional = this.route.snapshot.pathFromRoot.some((r) => r.url.some((seg) => seg.path === 'cms-puskomnas'));

  private provinceOptions = signal<{ value: string; label: string }[]>([]);
  private cityOptions = signal<{ value: string; label: string }[]>([]);
  private puskomdaOptions = signal<{ value: string; label: string }[]>([]);
  /** Nama LDK: tier LDK tidak butuh field ini sama sekali (sudah satu LDK
   *  tunggal secara definisi) — beda dari ReportLevelisasiPage yang selalu
   *  menampilkannya di kedua tier. Puskomda: directory type=LDK tanpa filter
   *  puskomda (LDK miliknya sendiri sudah di-scope backend). Puskomnas:
   *  seluruh LDK nasional. */
  private ldkOptions = signal<{ value: string; label: string }[]>([]);

  filterFields = computed<ReportFilterFieldDef[]>(() => {
    const fields: ReportFilterFieldDef[] = [
      { key: 'statuses', label: 'Status Keanggotaan', options: Object.entries(KADER_STATUS_LABELS).map(([value, label]) => ({ value, label })) },
    ];
    if (!this.isLdk) {
      fields.push({ key: 'organizationIDs', label: 'Nama LDK', options: this.ldkOptions() });
    }
    if (this.isNasional) {
      fields.push(
        { key: 'provinces', label: 'Provinsi', options: this.provinceOptions() },
        { key: 'cities', label: 'Kota/Kabupaten', options: this.cityOptions() },
        { key: 'puskomdaIDs', label: 'Puskomda', options: this.puskomdaOptions() },
      );
    }
    return fields;
  });

  private currentOrganizationID: number | undefined;
  private currentFilter: KaderFilterValue = { ...EMPTY_KADER_FILTER };

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.orgContext.organizationID$(this.route).subscribe((id) => {
      this.currentOrganizationID = id;
      if (!this.isLdk && !this.isNasional) {
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

  dataSource = (params: CmsListParams) => {
    this.showing.set(true);
    return this.presenter.list(this.currentFilter, params.page, params.limit, params.sort, this.currentOrganizationID).pipe(
      tap({ next: () => this.showing.set(false), error: () => this.showing.set(false) }),
    );
  };

  statusLabel(code: string): string { return this.statusLabels[code] ?? code; }

  onShowReport(filter: KaderFilterValue): void {
    this.currentFilter = filter;
    this.hasShownReport.set(true);
    this.cmsIndex?.refresh();
  }

  onDownloadReport(filter: KaderFilterValue): void {
    if (!this.canExport) { this.toast.warning('Anda tidak memiliki izin mengunduh laporan ini.'); return; }
    this.currentFilter = filter;
    this.presenter.download(filter, 'xlsx', this.currentOrganizationID);
  }

  setExporting(exporting: boolean): void { this.exporting.set(exporting); }
}
