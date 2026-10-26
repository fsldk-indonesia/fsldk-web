import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { RapimnasRepository } from '../../repositories/rapimnas.repository';
import { RapimnasPendaftaranLombaView } from './rapimnas.pendaftaran-lomba.view';

@Injectable()
export class RapimnasPendaftaranLombaPresenter extends BasePresenter<RapimnasPendaftaranLombaView> {
  private repo = inject(RapimnasRepository);

  load(): void {
    this.view.setLoading(true);
    this.repo.getPublic().subscribe({
      next: (data) => { this.view.setData(data); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }
}