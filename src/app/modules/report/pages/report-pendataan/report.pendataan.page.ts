import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { OrgContextService } from '../../../../core/services/org-context.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ReportFilterBarComponent, ReportFilterFieldDef } from '../../../../shared/report-filter-bar.component';
import { StatisticRepository } from '../../../statistic/repositories/statistic.repository';
import { SUBMISSION_STATUS_LABELS } from '../../../submission/entities/submission';
import { ReportFilterValue, EMPTY_REPORT_FILTER, PendataanTab } from '../../entities/report';
import { ReportPendataanPresenter } from './report.pendataan.presenter';
import { ReportPendataanView } from './report.pendataan.view';

@Component({
  selector: 'app-report-pendataan-page',
  standalone: true,
  templateUrl: './report.pendataan.page.html',
  imports: [ReportFilterBarComponent],
  providers: [ReportPendataanPresenter],
  styles: [`
    .page-head { margin-bottom: 28px; } .page-head h1 { margin-bottom: 2px; }
    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--color-border); margin-bottom: 16px; flex-wrap: wrap; }
    .tabs button { padding: 10px 16px; border: none; background: none; cursor: pointer; font-weight: 600; color: var(--color-text-secondary); border-bottom: 2px solid transparent; }
    .tabs button.active { color: var(--color-primary-dark); border-bottom-color: var(--color-primary); }
    .table-wrap { overflow-x: auto; }
  `],
})
export class ReportPendataanPage implements OnInit, ReportPendataanView {
  private presenter = inject(ReportPendataanPresenter);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthRepository);
  private orgContext = inject(OrgContextService);
  private statisticRepo = inject(StatisticRepository);
  private toast = inject(ToastService);

  title = this.route.snapshot.data['title'] as string;

  /** Sama pola dengan canExport di ReportLevelisasiPage (Task 13, ditambahkan
   *  di fix round post-review 9a4caa6 setelah brief awalnya juga melewatkan
   *  ini) — DIULANG di sini karena TechSpec-Report-Revamp.md DL-6 eksplisit
   *  menyatakan permission export (`report.region.export`/`report.national.export`)
   *  "berlaku untuk KEDUA laporan baru" (Levelisasi & Pendataan), dan
   *  `report.routes.ts` memang sudah mengisi `exportPermission` yang sama di
   *  route `reports/pendataan` (lihat task-11-brief.md) — tanpa gating ini,
   *  field route data itu tidak terpakai dan perilaku tombol Download Report
   *  jadi tidak konsisten antara dua halaman laporan yang seharusnya identik
   *  izinnya. Task 14's brief (task-14-brief.md Step 3) tidak menyertakan ini
   *  secara verbatim — kemungkinan brief itu ditulis sebelum fix round Task 13
   *  terjadi dan tidak sempat disinkronkan. Didokumentasikan di report Task 14
   *  sebagai keputusan sadar, bukan penambahan diam-diam. */
  canExport = this.auth.hasPermission(this.route.snapshot.data['exportPermission'] as string);

  /** Sama sumber & alasan dengan ReportLevelisasiPage (Task 13) — DIULANG di
   *  sini (bukan diekstrak jadi satu service bersama) karena cuma 2 pemanggil
   *  dan fieldnya sendiri sedikit beda (Pendataan TIDAK punya field Level,
   *  DL-4) — mengekstrak lebih awal untuk 2 titik pakai adalah abstraksi
   *  prematur (YAGNI). Provinsi/Kota/Puskomda HANYA tampil di tier Puskomnas
   *  (permintaan user saat manual testing, sama alasan dengan
   *  ReportLevelisasiPage) — tier Puskomda sudah otomatis terbatas ke satu
   *  wilayah sendiri. */
  private isNasional = this.route.snapshot.pathFromRoot.some((r) => r.url.some((seg) => seg.path === 'cms-puskomnas'));
  private provinceOptions = signal<{ value: string; label: string }[]>([]);
  private cityOptions = signal<{ value: string; label: string }[]>([]);
  private puskomdaOptions = signal<{ value: string; label: string }[]>([]);
  /** Nama LDK — sama pola dengan ReportLevelisasiPage: SELALU tampil di
   *  kedua tier, opsinya dibatasi per tier (Puskomda: miliknya sendiri lewat
   *  directory `puskomda=<currentOrganizationID>`; Puskomnas: seluruh LDK). */
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
        { key: 'puskomdaIDs', label: 'Puskomda', options: this.puskomdaOptions() },
      );
    }
    return fields;
  });

  tabs = signal<PendataanTab[]>([]);
  activeTabIndex = signal(0);
  loading = signal(false);
  exporting = signal(false);

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

  onShowReport(filter: ReportFilterValue): void {
    this.currentFilter = filter;
    this.presenter.show(filter, this.currentOrganizationID);
  }

  onDownloadReport(filter: ReportFilterValue): void {
    if (!this.canExport) { this.toast.warning('Anda tidak memiliki izin mengunduh laporan ini.'); return; }
    this.currentFilter = filter;
    this.presenter.download(filter, 'xlsx', this.currentOrganizationID);
  }

  selectTab(i: number): void { this.activeTabIndex.set(i); }

  setTabs(tabs: PendataanTab[]): void { this.tabs.set(tabs); this.activeTabIndex.set(0); }
  setLoading(loading: boolean): void { this.loading.set(loading); }
  setExporting(exporting: boolean): void { this.exporting.set(exporting); }
}
