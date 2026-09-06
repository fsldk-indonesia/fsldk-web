import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SubscriptionUnsubscribePresenter } from './subscription.unsubscribe.presenter';
import { SubscriptionUnsubscribeView } from './subscription.unsubscribe.view';

@Component({
  selector: 'app-subscription-unsubscribe-page',
  standalone: true,
  templateUrl: './subscription.unsubscribe.page.html',
  imports: [RouterLink],
  providers: [SubscriptionUnsubscribePresenter],
  styles: [`
    .section { min-height: 70vh; display: flex; align-items: center; padding: 48px 0; }
    .card-wrap { max-width: 460px; margin: 0 auto; text-align: center; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 40px 32px; box-shadow: var(--shadow); }
    .icon { width: 72px; height: 72px; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 20px; }
    .icon.ok { background: var(--color-primary-soft); color: var(--color-primary); }
    .icon.fail { background: var(--color-danger-soft); color: var(--color-danger); }
    h2 { margin-bottom: 8px; }
    .subtitle { color: var(--color-text-secondary); margin: 0 0 24px; }
  `],
})
export class SubscriptionUnsubscribePage implements OnInit, SubscriptionUnsubscribeView {
  private presenter = inject(SubscriptionUnsubscribePresenter);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  success = signal(false);
  message = signal('');

  ngOnInit(): void {
    this.presenter.attachView(this);
    const params = this.route.snapshot.queryParamMap;
    this.presenter.unsubscribe(params.get('email'), params.get('token'));
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setResult(success: boolean, message: string): void { this.success.set(success); this.message.set(message); }
}
