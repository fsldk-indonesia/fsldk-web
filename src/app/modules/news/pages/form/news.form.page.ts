import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { NewsCategory } from '../../entities/news-category';
import { NewsFormPresenter, NewsFormValue, emptyNewsForm } from './news.form.presenter';
import { NewsFormView } from './news.form.view';

@Component({
  selector: 'app-news-form-page',
  standalone: true,
  templateUrl: './news.form.page.html',
  imports: [FormsModule, RouterLink, ImageUploadComponent],
  providers: [NewsFormPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .back { display: inline-block; margin-bottom: 8px; color: var(--color-text-secondary); }
    .form-card { max-width: 820px; }
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
