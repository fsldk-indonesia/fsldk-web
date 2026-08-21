import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { ShortLinkRequest } from '../../entities/shortlink-request';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { ShortLinkRequestIndexPresenter } from './shortlinkrequest.index.presenter';
import { ShortLinkRequestIndexView } from './shortlinkrequest.index.view';

@Component({
  selector: 'app-shortlinkrequest-index-page',
  standalone: true,
  templateUrl: './shortlinkrequest.index.page.html',
  imports: [FormsModule, DatePipe, IconComponent, PaginationComponent],
  providers: [ShortLinkRequestIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .key { background: var(--color-bg-alt); padding: 4px 8px; border-radius: 6px; font-size: .85rem; }
    .destination { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    .modal { background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 460px; }
  `],
})
export class ShortLinkRequestIndexPage implements OnInit, ShortLinkRequestIndexView {
  private presenter = inject(ShortLinkRequestIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  requests = signal<ShortLinkRequest[]>([]);
  loading = signal(true);
  status = '';
  page = signal(1);
  count = signal(0);
  readonly limit = 10;
  busy = signal<ReadonlySet<number>>(new Set());

  showReject = signal(false);
  rejectSaving = signal(false);
  rejectTarget: ShortLinkRequest | null = null;
  rejectReason = '';

  canApprove = this.auth.hasPermission('shortlink.approve');

  ngOnInit(): void { this.presenter.attachView(this); this.load(); }

  load(): void { this.loading.set(true); this.presenter.load(this.page(), this.limit, this.status); }
  filter(s: string): void { this.status = s; this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  async approve(r: ShortLinkRequest, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Setujui permintaan dari "${r.requesterName}"? Shortlink akan langsung aktif.`, {
      title: 'Setujui Permintaan', confirmLabel: 'Ya, Setujui',
    }, event);
    if (!ok) return;
    this.setBusy(r.shortLinkRequestID);
    this.presenter.approve(r.shortLinkRequestID);
  }

  openReject(r: ShortLinkRequest): void {
    this.rejectTarget = r;
    this.rejectReason = '';
    this.showReject.set(true);
  }
  closeReject(): void { this.showReject.set(false); this.rejectTarget = null; }
  submitReject(): void {
    if (!this.rejectTarget || !this.rejectReason.trim()) return;
    this.presenter.reject(this.rejectTarget.shortLinkRequestID, this.rejectReason.trim());
  }

  setRequests(items: ShortLinkRequest[], count: number): void { this.requests.set(items); this.count.set(count); this.loading.set(false); }
  onActionSettled(id: number): void { this.clearBusy(id); }
  onApproveSuccess(): void { this.load(); }
  setRejectSaving(saving: boolean): void { this.rejectSaving.set(saving); }
  onRejectSuccess(): void { this.closeReject(); this.load(); }
}
