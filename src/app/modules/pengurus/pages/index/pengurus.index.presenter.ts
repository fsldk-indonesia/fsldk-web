import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { PengurusRepository } from '../../repositories/pengurus.repository';
import { PengurusIndexView } from './pengurus.index.view';

@Injectable()
export class PengurusIndexPresenter extends BasePresenter<PengurusIndexView> {
  private repo = inject(PengurusRepository);
  private toast = inject(ToastService);

  loadAll(): void {
    this.view.setLoading(true);
    this.repo.list().subscribe({
      next: (items) => { this.view.setItems(items); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }

  updateRole(userID: number, roleName: string): void {
    this.view.setBusy(userID);
    this.repo.updateRole(userID, roleName).subscribe({
      next: () => {
        this.toast.success('Role pengurus berhasil diperbarui');
        this.view.setBusy(null);
        this.loadAll();
      },
      error: () => this.view.setBusy(null),
    });
  }
}
