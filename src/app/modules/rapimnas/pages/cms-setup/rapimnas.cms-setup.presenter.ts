import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { RapimnasRepository } from '../../repositories/rapimnas.repository';
import { RapimnasUpdatePayload } from '../../entities/rapimnas';
import { RapimnasCmsSetupView } from './rapimnas.cms-setup.view';

@Injectable()
export class RapimnasCmsSetupPresenter extends BasePresenter<RapimnasCmsSetupView> {
  private repo = inject(RapimnasRepository);
  private toast = inject(ToastService);

  load(): void {
    this.view.setLoading(true);
    this.repo.get().subscribe({
      next: (data) => { this.view.setForm(data); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }

  save(payload: RapimnasUpdatePayload): void {
    this.view.setSaving(true);
    this.repo.update(payload).subscribe({
      next: (data) => {
        this.toast.success('Rapimnas Setup berhasil disimpan.');
        this.view.setForm(data);
        this.view.setSaving(false);
      },
      error: () => this.view.setSaving(false),
    });
  }
}
