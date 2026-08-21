import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { SettingRepository } from '../../repositories/setting.repository';
import { SettingIndexView } from './setting.index.view';

@Injectable()
export class SettingIndexPresenter extends BasePresenter<SettingIndexView> {
  private settingRepo = inject(SettingRepository);
  private toast = inject(ToastService);

  load(): void {
    this.settingRepo.list().subscribe({
      next: (items) => this.view.setSettings(items),
      error: () => {},
    });
  }

  save(id: number, value: string): void {
    this.settingRepo.update(id, value).subscribe({
      next: () => { this.toast.success('Setting disimpan'); this.view.onActionSettled(id); },
      error: () => this.view.onActionSettled(id),
    });
  }
}
