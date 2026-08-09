import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { RichTextEditorComponent } from '../../../../shared/rich-text-editor.component';
import { SelectComponent } from '../../../../shared/select.component';
import { NewsCategory } from '../../entities/news-category';
import { NewsFormPresenter, NewsFormValue, emptyNewsForm } from './news.form.presenter';
import { NewsFormView } from './news.form.view';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];

@Component({
  selector: 'app-news-form-page',
  standalone: true,
  templateUrl: './news.form.page.html',
  imports: [FormsModule, RouterLink, ImageUploadComponent, RichTextEditorComponent, SelectComponent],
  providers: [NewsFormPresenter],
  styles: [`
    /* Header dan kartu form memakai lebar maksimum yang sama supaya sejajar
       sebagai satu kolom — sebelumnya kartu formnya sendiri yang dibatasi
       820px sementara header di atasnya full-width, jadi terlihat "nabrak
       kiri" dengan sisa ruang kosong di kanan yang tidak presisi. */
    .page-head { max-width: 820px; margin: 0 auto 24px; } .back { display: inline-block; margin-bottom: 8px; color: var(--color-text-secondary); }
    .form-card { max-width: 820px; margin: 0 auto; }
  `],
})
export class NewsFormPage implements OnInit, NewsFormView {
  private presenter = inject(NewsFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthRepository);

  categories = signal<NewsCategory[]>([]);
  saving = signal(false);
  editId: number | null = null;
  canPublish = this.auth.hasPermission('news.publish');
  form: NewsFormValue = { ...emptyNewsForm };
  statusOptions = STATUS_OPTIONS;
  categoryOptions = computed(() => this.categories().map((c) => ({ value: c.categoryID, label: c.categoryName })));

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadCategories();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.presenter.loadForEdit(this.editId);
    }
  }

  save(): void { this.presenter.save(this.editId, this.form); }

  setCategories(categories: NewsCategory[]): void {
    this.categories.set(categories);
    if (!this.form.categoryID && categories[0]) this.form.categoryID = categories[0].categoryID;
  }
  setForm(form: NewsFormValue): void { this.form = form; }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  navigateToIndex(): void { this.router.navigate(['/cms/news']); }
}
