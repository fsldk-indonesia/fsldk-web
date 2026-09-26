import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { DynamicFormRepository } from '../../repositories/dynamic-form.repository';
import { DynamicForm } from '../../entities/dynamic-form';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { DynamicFormIndexView } from './dynamicform.index.view';

@Injectable()
export class DynamicFormIndexPresenter extends BasePresenter<DynamicFormIndexView> {
  private repo = inject(DynamicFormRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  query param dynamicform_dto.FormFilter. Status (draft/published/closed)
   *  genuinely multi-select bermakna (backend pakai klausa IN, lihat
   *  dynamicform_repository_impl.go) — sama pola dengan Job Queue, beda dari
   *  status published/draft biner di modul lain. */
  list(params: CmsListParams): Observable<Pagination<DynamicForm>> {
    return this.repo.cmsList({
      page: params.page, limit: params.limit, sort: params.sort,
      dateFrom: params.dateFrom, dateTo: params.dateTo,
      search: (params.filters['search'] ?? [])[0] ?? '',
      status: params.status.join(','),
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
