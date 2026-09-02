import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceAuditLogItem } from '../../entities/audit-log';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { KantongAmalAdminAuditLogPresenter } from './kantong-amal.admin-audit-log.presenter';
import { KantongAmalAdminAuditLogView } from './kantong-amal.admin-audit-log.view';

@Component({
  selector: 'app-kantong-amal-admin-audit-log-page',
  standalone: true,
  templateUrl: './kantong-amal.admin-audit-log.page.html',
  imports: [DatePipe, FormsModule, PaginationComponent],
  providers: [KantongAmalAdminAuditLogPresenter],
  styles: [`
    .filters { display: flex; gap: 10px; }
    .filters > * { max-width: 220px; }
    .json-preview { font-family: monospace; font-size: .78rem; color: var(--color-text-secondary); white-space: pre-wrap; max-width: 320px; overflow-x: auto; }
  `],
})
export class KantongAmalAdminAuditLogPage implements OnInit, KantongAmalAdminAuditLogView {
  private presenter = inject(KantongAmalAdminAuditLogPresenter);

  logs = signal<FinanceAuditLogItem[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  limit = 20;
  entity = '';
  action = '';

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.load();
  }

  load(): void { this.presenter.load(this.page(), this.limit, this.entity, this.action); }
  applyFilter(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }

  formatJson(raw?: string): string {
    if (!raw) return '';
    try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; }
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setLogs(logs: FinanceAuditLogItem[], count: number): void { this.logs.set(logs); this.count.set(count); }
}
