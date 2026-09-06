import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { SubscriptionRepository } from '../../repositories/subscription.repository';
import { SubscriptionIndexView } from './subscription.index.view';

@Injectable()
export class SubscriptionIndexPresenter extends BasePresenter<SubscriptionIndexView> {
  private repo = inject(SubscriptionRepository);
  private toast = inject(ToastService);

  load(page: number, limit: number, search: string, isActive: string, from: string, to: string): void {
    this.repo.cmsList({
      page, limit,
      search: search || undefined,
      isActive: isActive || undefined,
      from: from || undefined,
      to: to || undefined,
    }).subscribe({
      next: (p) => this.view.setSubscribers(p.data, p.count),
      error: () => {},
    });
  }

  bulkAdd(emails: string): void {
    this.repo.bulkAdd(emails).subscribe({
      next: (result) => { this.view.onBulkAddResult(result); this.view.onAddSettled(); },
      error: () => this.view.onAddSettled(),
    });
  }

  update(id: number, email: string, isActive: boolean): void {
    this.repo.update(id, { email, isActive }).subscribe({
      next: (sub) => { this.toast.success('Subscriber berhasil diperbarui'); this.view.onUpdateSuccess(sub); this.view.onEditSettled(); },
      error: () => this.view.onEditSettled(),
    });
  }

  remove(id: number): void {
    this.repo.remove(id).subscribe({
      next: () => { this.toast.success('Subscriber berhasil dihapus'); this.view.onRemoveSuccess(id); this.view.onActionSettled(id); },
      error: () => this.view.onActionSettled(id),
    });
  }

  bulkRemove(ids: number[]): void {
    this.repo.bulkRemove(ids).subscribe({
      next: () => { this.toast.success(`${ids.length} subscriber berhasil dihapus`); this.view.onBulkRemoveSuccess(ids); },
      error: () => {},
    });
  }
}
