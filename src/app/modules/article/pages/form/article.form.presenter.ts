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
  articleWriter: string;
  articleEditor: string;
  articlePdf: string;
  articleIntro: string;
}

export const emptyArticleForm: ArticleFormValue = {
  articleTitle: '', categoryID: 0, status: 'draft', articleImage: '',
  articleWriter: '', articleEditor: '', articlePdf: '', articleIntro: '',
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
      next: (a) => {
        this.view.setForm({
          articleTitle: a.articleTitle, categoryID: a.categoryID, status: a.isPublished ? 'published' : 'draft',
          articleImage: a.articleImage ?? '', articleWriter: a.articleWriter ?? '', articleEditor: a.articleEditor ?? '',
          articlePdf: a.articlePdf ?? '', articleIntro: a.articleIntro,
        });
        this.view.setPublishedDate(a.publishedDate);
      },
      error: () => {},
    });
  }

  save(editId: number | null, form: ArticleFormValue): void {
    if (!form.articleTitle || !form.articleIntro) { this.toast.error('Judul dan pendahuluan wajib diisi'); return; }
    if (!form.articleWriter) { this.toast.error('Penulis wajib diisi'); return; }
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
