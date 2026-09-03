import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReconciliationSnapshot } from '../../entities/report';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { ToastService } from '../../../../core/services/toast.service';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { KantongAmalAdminReconciliationPresenter } from './kantong-amal.admin-reconciliation.presenter';
import { KantongAmalAdminReconciliationView } from './kantong-amal.admin-reconciliation.view';

@Component({
  selector: 'app-kantong-amal-admin-reconciliation-page',
  standalone: true,
  templateUrl: './kantong-amal.admin-reconciliation.page.html',
  imports: [DatePipe, PaginationComponent],
  providers: [KantongAmalAdminReconciliationPresenter],
  styles: [`
    .anomaly-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; }
    .anomaly-yes { background: #fee2e2; color: #991b1b; }
    .anomaly-no { background: #dcfce7; color: #166534; }
  `],
})
export class KantongAmalAdminReconciliationPage implements OnInit, KantongAmalAdminReconciliationView {
  private presenter = inject(KantongAmalAdminReconciliationPresenter);
  private toast = inject(ToastService);

  snapshots = signal<ReconciliationSnapshot[]>([]);
  loading = signal(true);
  running = signal(false);
  page = signal(1);
  count = signal(0);
  limit = 15;

  readonly formatRupiah = formatRupiah;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.load();
  }

  load(): void { this.presenter.load(this.page(), this.limit); }
  goPage(p: number): void { this.page.set(p); this.load(); }
  runNow(): void { this.presenter.run(); }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setRunning(running: boolean): void { this.running.set(running); }
  setSnapshots(snapshots: ReconciliationSnapshot[], count: number): void { this.snapshots.set(snapshots); this.count.set(count); }
  onRunSuccess(): void { this.toast.success('Rekonsiliasi berhasil dijalankan.'); this.page.set(1); this.load(); }
}
