import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { OrgContextService } from '../../../../core/services/org-context.service';
import { ToastService } from '../../../../core/services/toast.service';
import { IconComponent } from '../../../../shared/icon.component';
import { ReportFilterBarComponent, ReportFilterFieldDef } from '../../../../shared/report-filter-bar.component';
import { StatisticRepository } from '../../../statistic/repositories/statistic.repository';
import { KADER_STATUS_LABELS } from '../../../submission/entities/submission';
import { KaderFilterValue, EMPTY_KADER_FILTER, PendataanTab } from '../../entities/report';
import { ReportPendataanSensusKaderPresenter } from './report.pendataan-sensus-kader.presenter';
import { ReportPendataanSensusKaderView } from './report.pendataan-sensus-kader.view';

@Component({
  selector: 'app-report-pendataan-sensus-kader-page',
  standalone: true,
  templateUrl: './report.pendataan-sensus-kader.page.html',
  imports: [IconComponent, ReportFilterBarComponent],
  providers: [ReportPendataanSensusKaderPresenter],
  styles: [`
    .page-head { margin-bottom: 28px; } .page-head h1 { margin-bottom: 2px; }
    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--color-border); margin-bottom: 16px; flex-wrap: wrap; }
    .tabs button { padding: 10px 16px; border: none; background: none; cursor: pointer; font-weight: 600; color: var(--color-text-secondary); border-bottom: 2px solid transparent; }
    .tabs button.active { color: var(--color-primary-dark); border-bottom-color: var(--color-primary); }
    .table-wrap { overflow-x: auto; }
  `],
})
export class ReportPendataanSensusKaderPage implements OnInit, ReportPendataanSensusKaderView {
  private presenter = inject(ReportPendataanSensusKaderPresenter);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthRepository);
  private orgContext = inject(OrgContextService);
  private statisticRepo = inject(StatisticRepository);
  private toast = inject(ToastService);

  title = this.route.snapshot.data['title'] as string;

  canExport = this.auth.hasPermission(this.route.snapshot.data['exportPermission'] as string);

  private isLdk = this.route.snapshot.pathFromRoot.some((r) => r.url.some((seg) => seg.path === 'cms-ldk'));
  private isNasional = this.route.snapshot.pathFromRoot.some((r) => r.url.some((seg) => seg.path === 'cms-puskomnas'));
  private provinceOptions = signal<{ value: string; label: string }[]>([]);
  private cityOptions = signal<{ value: string; label: string }[]>([]);
  private puskomdaOptions = signal<{ value: string; label: string }[]>([]);
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

  tabs = signal<PendataanTab[]>([]);
  activeTabIndex = signal(0);
  loading = signal(false);
  exporting = signal(false);
  hasShownReport = signal(false);

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

  onShowReport(filter: KaderFilterValue): void {
    this.currentFilter = filter;
    this.hasShownReport.set(true);
    this.presenter.show(filter, this.currentOrganizationID);
  }

  onDownloadReport(filter: KaderFilterValue): void {
    if (!this.canExport) { this.toast.warning('Anda tidak memiliki izin mengunduh laporan ini.'); return; }
    this.currentFilter = filter;
    this.presenter.download(filter, 'xlsx', this.currentOrganizationID);
  }

  selectTab(i: number): void { this.activeTabIndex.set(i); }

  setTabs(tabs: PendataanTab[]): void { this.tabs.set(tabs); this.activeTabIndex.set(0); }
  setLoading(loading: boolean): void { this.loading.set(loading); }
  setExporting(exporting: boolean): void { this.exporting.set(exporting); }
}
