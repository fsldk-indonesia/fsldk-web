import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { RapimnasRepository } from '../../repositories/rapimnas.repository';
import { RapimnasArsipView } from './rapimnas.arsip.view';

@Injectable()
export class RapimnasArsipPresenter extends BasePresenter<RapimnasArsipView> {
  private repo = inject(RapimnasRepository);

  load(): void {
    this.view.setLoading(true);
    this.repo.getPublic().subscribe({
      next: (data) => { this.view.setData(data); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }
}
