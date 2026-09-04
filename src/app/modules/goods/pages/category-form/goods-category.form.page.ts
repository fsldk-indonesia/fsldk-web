import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GoodsCategoryFormPresenter, GoodsCategoryFormValue, emptyGoodsCategoryForm } from './goods-category.form.presenter';
import { GoodsCategoryFormView } from './goods-category.form.view';

@Component({
  selector: 'app-goods-category-form-page',
  standalone: true,
  templateUrl: './goods-category.form.page.html',
  imports: [FormsModule, RouterLink],
  providers: [GoodsCategoryFormPresenter],
  styles: [`
    .page-head { max-width: 560px; margin: 0 auto 24px; } .back { display: inline-block; margin-bottom: 8px; color: var(--color-text-secondary); }
    .form-card { max-width: 560px; margin: 0 auto; }
  `],
})
export class GoodsCategoryFormPage implements OnInit, GoodsCategoryFormView {
  private presenter = inject(GoodsCategoryFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  saving = signal(false);
  editId: number | null = null;
  form: GoodsCategoryFormValue = { ...emptyGoodsCategoryForm };

  ngOnInit(): void {
    this.presenter.attachView(this);
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.presenter.loadForEdit(this.editId);
    }
  }

  save(): void { this.presenter.save(this.editId, this.form); }

  setForm(form: GoodsCategoryFormValue): void { this.form = form; }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  navigateToIndex(): void { this.router.navigate(['/cms/goods/categories']); }
}
