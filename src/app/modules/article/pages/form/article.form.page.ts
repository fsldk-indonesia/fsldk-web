import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { ArticleCategory } from '../../entities/article-category';
import { ArticleFormPresenter, ArticleFormValue, emptyArticleForm } from './article.form.presenter';
import { ArticleFormView } from './article.form.view';

@Component({
  selector: 'app-article-form-page',
  standalone: true,
  templateUrl: './article.form.page.html',
  imports: [FormsModule, RouterLink],
  providers: [ArticleFormPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .back { display: inline-block; margin-bottom: 8px; color: var(--color-text-secondary); }
    .form-card { max-width: 820px; }
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
  canPublish = this.auth.hasPermission('article.publish');
  form: ArticleFormValue = { ...emptyArticleForm };

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

  setCategories(categories: ArticleCategory[]): void {
    this.categories.set(categories);
    if (!this.form.categoryID && categories[0]) this.form.categoryID = categories[0].categoryID;
  }
  setForm(form: ArticleFormValue): void { this.form = form; }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  navigateToIndex(): void { this.router.navigate(['/cms/articles']); }
}
