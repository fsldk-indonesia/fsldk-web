import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { RapimnasRepository } from '../../repositories/rapimnas.repository';
import { RapimnasPendaftaranPanitiaView } from './rapimnas.pendaftaran-panitia.view';

@Injectable()
export class RapimnasPendaftaranPanitiaPresenter extends BasePresenter<RapimnasPendaftaranPanitiaView> {
  private repo = inject(RapimnasRepository);

  load(): void {
    this.view.setLoading(true);
    this.repo.getPublic().subscribe({
      next: (data) => { this.view.setData(data); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }
}
