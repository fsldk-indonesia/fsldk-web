import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { ArticleRepository } from '../../repositories/article.repository';
import { ArticleFormView } from './article.form.view';

export interface ArticleFormValue {
  articleTitle: string;
  categoryID: number;
  status: 'draft' | 'published';
  articleImage: string;
  articleExcerpt: string;
  articleContent: string;
}

export const emptyArticleForm: ArticleFormValue = {
  articleTitle: '', categoryID: 0, status: 'draft', articleImage: '', articleExcerpt: '', articleContent: '',
};

@Injectable()
export class ArticleFormPresenter extends BasePresenter<ArticleFormView> {
  private articleRepo = inject(ArticleRepository);
  private toast = inject(ToastService);

  loadCategories(): void {
    this.articleRepo.categories().subscribe({ next: (c) => this.view.setCategories(c), error: () => {} });
  }

  loadForEdit(id: number): void {
    this.articleRepo.cmsGet(id).subscribe({
      next: (a) => this.view.setForm({
        articleTitle: a.articleTitle, categoryID: a.categoryID, status: a.isPublished ? 'published' : 'draft',
        articleImage: a.articleImage ?? '', articleExcerpt: a.articleExcerpt ?? '', articleContent: a.articleContent,
      }),
      error: () => {},
    });
  }

  save(editId: number | null, form: ArticleFormValue): void {
    if (!form.articleTitle || !form.articleContent) { this.toast.error('Judul dan konten wajib diisi'); return; }
    this.view.setSaving(true);
    const body = { ...form, categoryID: +form.categoryID };
    const done = () => { this.toast.success('Artikel disimpan'); this.view.setSaving(false); this.view.navigateToIndex(); };
    if (editId) {
      this.articleRepo.update(editId, body).subscribe({ next: done, error: () => this.view.setSaving(false) });
    } else {
      this.articleRepo.create(body).subscribe({ next: done, error: () => this.view.setSaving(false) });
    }
  }
}
