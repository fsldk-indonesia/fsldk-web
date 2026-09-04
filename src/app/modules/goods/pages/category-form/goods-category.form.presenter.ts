import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { GoodsCategoryRepository } from '../../repositories/goods-category.repository';
import { GoodsCategoryFormView } from './goods-category.form.view';

export interface GoodsCategoryFormValue {
  categoryName: string;
  isActive: boolean;
  sortOrder: number;
}

export const emptyGoodsCategoryForm: GoodsCategoryFormValue = { categoryName: '', isActive: true, sortOrder: 0 };

@Injectable()
export class GoodsCategoryFormPresenter extends BasePresenter<GoodsCategoryFormView> {
  private categoryRepo = inject(GoodsCategoryRepository);
  private toast = inject(ToastService);

  loadForEdit(id: number): void {
    this.categoryRepo.cmsList().subscribe({
      next: (list) => {
        const cat = list.find((c) => c.goodsCategoryID === id);
        if (!cat) return;
        this.view.setForm({ categoryName: cat.categoryName, isActive: cat.isActive, sortOrder: cat.sortOrder });
      },
      error: () => {},
    });
  }

  save(editId: number | null, form: GoodsCategoryFormValue): void {
    if (!form.categoryName.trim()) { this.toast.error('Nama kategori wajib diisi'); return; }
    this.view.setSaving(true);
    const body = { ...form, sortOrder: +form.sortOrder };
    const done = () => { this.toast.success('Kategori disimpan'); this.view.setSaving(false); this.view.navigateToIndex(); };
    if (editId) {
      this.categoryRepo.update(editId, body).subscribe({ next: done, error: () => this.view.setSaving(false) });
    } else {
      this.categoryRepo.create(body).subscribe({ next: done, error: () => this.view.setSaving(false) });
    }
  }
}
