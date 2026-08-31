import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { FinanceFormatRepository } from '../../repositories/financeformat.repository';
import { FinanceFormatPublicIndexView } from './financeformat.public-index.view';

@Injectable()
export class FinanceFormatPublicIndexPresenter extends BasePresenter<FinanceFormatPublicIndexView> {
  private repo = inject(FinanceFormatRepository);

  load(): void {
    this.view.setLoading(true);
    this.repo.publicList().subscribe({
      next: (d) => { this.view.setData(d); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }
}
