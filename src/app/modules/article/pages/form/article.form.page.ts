import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { IconComponent } from '../../../../shared/icon.component';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { PdfUploadComponent } from '../../../../shared/pdf-upload.component';
import { RichTextEditorComponent } from '../../../../shared/rich-text-editor.component';
import { SelectComponent } from '../../../../shared/select.component';
import { ArticleCategory } from '../../entities/article-category';
import { ArticleFormPresenter, ArticleFormValue, emptyArticleForm } from './article.form.presenter';
import { ArticleFormView } from './article.form.view';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];

@Component({
  selector: 'app-article-form-page',
  standalone: true,
  templateUrl: './article.form.page.html',
  imports: [FormsModule, RouterLink, DatePipe, IconComponent, ImageUploadComponent, PdfUploadComponent, RichTextEditorComponent, SelectComponent],
  providers: [ArticleFormPresenter],
  styles: [`
    /* Lebar kolom form dibiarkan mengisi penuh .page-shell (bukan dikunci ke
       angka tetap) — sama seperti form Berita, lihat catatan riwayat di
       news.form.page.ts untuk alasan (page-shell CMS sudah dibatasi 1100px
       dengan padding sendiri). */
    .page-head { margin: 0 0 24px; }
    .form-card { display: flex; flex-direction: column; gap: 20px; }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 16px;
      font-family: var(--font-heading); font-weight: 700; font-size: .78rem;
      letter-spacing: .08em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .form-control-lg { font-weight: 700; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 22px; margin-top: 4px; border-top: 1px solid var(--color-border); }
  `],
})
export class ArticleFormPage implements OnInit, ArticleFormView {
  private presenter = inject(ArticleFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthRepository);

  categories = signal<ArticleCategory[]>([]);
  saving = signal(false);
  editId: number | null = null;
  // Halaman detail (read-only) memakai komponen yang sama dengan form edit —
  // dibedakan lewat route data `viewOnly` (lihat article.routes.ts), bukan
  // URL atau state terpisah, supaya layout field tidak dobel-maintain di 2 file.
  isReadonly = false;
  canPublish = this.auth.hasPermission('article.publish');
  form: ArticleFormValue = { ...emptyArticleForm };
  publishedDate = signal<string | null>(null);
  statusOptions = STATUS_OPTIONS;
  categoryOptions = computed(() => this.categories().map((c) => ({ value: c.categoryID, label: c.categoryName })));

  get pageSubtitle(): string {
    if (this.isReadonly) return 'Lihat detail lengkap artikel ini.';
    return this.editId ? 'Perbarui informasi artikel yang sudah ada.' : 'Isi informasi artikel yang akan dipublikasikan ke pengguna.';
  }

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadCategories();

    this.isReadonly = this.route.snapshot.data['viewOnly'] === true;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.presenter.loadForEdit(this.editId);
    }
  }

  save(): void { this.presenter.save(this.editId, this.form); }

  setCategories(categories: ArticleCategory[]): void {
    this.categories.set(categories);
    if (!this.form.categoryID && categories[0]) this.form.categoryID = categories[0].categoryID;
  }
  setForm(form: ArticleFormValue): void { this.form = form; }
  setPublishedDate(date: string | null): void { this.publishedDate.set(date); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  navigateToIndex(): void { this.router.navigate(['/cms/articles']); }
}
