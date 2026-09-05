import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { SubscriptionRepository } from '../../repositories/subscription.repository';
import { SubscriptionUnsubscribeView } from './subscription.unsubscribe.view';

@Injectable()
export class SubscriptionUnsubscribePresenter extends BasePresenter<SubscriptionUnsubscribeView> {
  private repo = inject(SubscriptionRepository);

  unsubscribe(email: string | null, token: string | null): void {
    if (!email || !token) {
      this.view.setLoading(false);
      this.view.setResult(false, 'Tautan berhenti berlangganan tidak valid.');
      return;
    }

    this.view.setLoading(true);
    this.repo.unsubscribe(email, token).subscribe({
      next: () => {
        this.view.setLoading(false);
        this.view.setResult(true, 'Anda berhasil berhenti berlangganan dari newsletter FSLDK Indonesia.');
      },
      error: (err) => {
        this.view.setLoading(false);
        this.view.setResult(false, err.error?.message || 'Gagal memproses permintaan berhenti berlangganan.');
      },
    });
  }
}
