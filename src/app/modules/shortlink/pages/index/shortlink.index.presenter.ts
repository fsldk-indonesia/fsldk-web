import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { ShortlinkRepository } from '../../repositories/shortlink.repository';
import { ShortlinkIndexView } from './shortlink.index.view';

export interface ShortlinkFormValue {
  destinationURL: string;
  shortKey: string;
}

@Injectable()
export class ShortlinkIndexPresenter extends BasePresenter<ShortlinkIndexView> {
  private shortlinkRepo = inject(ShortlinkRepository);
  private toast = inject(ToastService);

  load(search: string): void {
    this.shortlinkRepo.list({ page: 1, limit: 50, search }).subscribe({
      next: (p) => this.view.setShortlinks(p.data),
      error: () => {},
    });
  }

  save(editId: number | null, form: ShortlinkFormValue): void {
    this.view.setSaving(true);
    const done = (message: string) => { this.toast.success(message); this.view.setSaving(false); this.view.onSaveSuccess(); };
    if (editId) {
      this.shortlinkRepo.update(editId, { destinationURL: form.destinationURL, shortKey: form.shortKey }).subscribe({
        next: () => done('Shortlink diperbarui'),
        error: () => this.view.setSaving(false),
      });
    } else {
      const body = form.shortKey ? form : { destinationURL: form.destinationURL };
      this.shortlinkRepo.create(body).subscribe({
        next: () => done('Shortlink dibuat'),
        error: () => this.view.setSaving(false),
      });
    }
  }

  remove(id: number): void {
    this.shortlinkRepo.remove(id).subscribe({
      next: () => { this.toast.success('Shortlink dihapus'); this.view.onRemoveSuccess(); },
      error: () => {},
    });
  }
}
