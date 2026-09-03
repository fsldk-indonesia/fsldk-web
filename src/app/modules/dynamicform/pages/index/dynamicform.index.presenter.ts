import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { DynamicFormRepository } from '../../repositories/dynamic-form.repository';
import { DynamicForm } from '../../entities/dynamic-form';
import { DynamicFormIndexView } from './dynamicform.index.view';

@Injectable()
export class DynamicFormIndexPresenter extends BasePresenter<DynamicFormIndexView> {
  private repo = inject(DynamicFormRepository);
  private toast = inject(ToastService);

  load(page: number, limit: number, search: string, status: string, sort: string): void {
    this.repo.cmsList({ page, limit, search, status: status || undefined, sort }).subscribe({
      next: (p) => this.view.setForms(p.data, p.count),
      error: () => {},
    });
  }

  setStatus(form: DynamicForm, status: string): void {
    this.repo.setStatus(form.formID, status).subscribe({
      next: () => { this.toast.success('Status formulir diperbarui'); this.view.onMutated(); this.view.onActionSettled(form.formID); },
      error: () => this.view.onActionSettled(form.formID),
    });
  }

  remove(form: DynamicForm): void {
    this.repo.remove(form.formID).subscribe({
      next: () => { this.toast.success('Formulir dihapus'); this.view.onMutated(); this.view.onActionSettled(form.formID); },
      error: () => this.view.onActionSettled(form.formID),
    });
  }

  bulkDelete(ids: number[]): void {
    this.repo.bulkDelete(ids).subscribe({
      next: (r) => {
        this.toast.success(`${r.deleted.length} formulir dihapus${r.skipped.length ? `, ${r.skipped.length} dilewati` : ''}`);
        this.view.onMutated();
      },
      error: () => {},
    });
  }
}
