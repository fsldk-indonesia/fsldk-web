import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { NewsRepository } from '../../repositories/news.repository';
import { NewsFormView } from './news.form.view';

export interface NewsFormValue {
  newsTitle: string;
  categoryID: number;
  status: 'draft' | 'published';
  newsImage: string;
  newsExcerpt: string;
  newsContent: string;
  isFeatured: boolean;
}

export const emptyNewsForm: NewsFormValue = {
  newsTitle: '', categoryID: 0, status: 'draft', newsImage: '', newsExcerpt: '', newsContent: '', isFeatured: false,
};

@Injectable()
export class NewsFormPresenter extends BasePresenter<NewsFormView> {
  private newsRepo = inject(NewsRepository);
  private toast = inject(ToastService);

  loadCategories(): void {
    this.newsRepo.categories().subscribe({ next: (c) => this.view.setCategories(c), error: () => {} });
  }

  loadForEdit(id: number): void {
    this.newsRepo.cmsGet(id).subscribe({
      next: (n) => this.view.setForm({
        newsTitle: n.newsTitle, categoryID: n.categoryID, status: n.isPublished ? 'published' : 'draft',
        newsImage: n.newsImage ?? '', newsExcerpt: n.newsExcerpt ?? '', newsContent: n.newsContent, isFeatured: n.isFeatured,
      }),
      error: () => {},
    });
  }

  save(editId: number | null, form: NewsFormValue): void {
    if (!form.newsTitle || !form.newsContent) { this.toast.error('Judul dan konten wajib diisi'); return; }
    this.view.setSaving(true);
    const body = { ...form, categoryID: +form.categoryID };
    const done = () => { this.toast.success('Berita disimpan'); this.view.setSaving(false); this.view.navigateToIndex(); };
    if (editId) {
      this.newsRepo.update(editId, body).subscribe({ next: done, error: () => this.view.setSaving(false) });
    } else {
      this.newsRepo.create(body).subscribe({ next: done, error: () => this.view.setSaving(false) });
    }
  }
}
