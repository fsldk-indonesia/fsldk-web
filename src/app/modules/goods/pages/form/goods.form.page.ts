import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { MultiImageUploadComponent } from '../../../../shared/multi-image-upload.component';
import { RichTextEditorComponent } from '../../../../shared/rich-text-editor.component';
import { SelectComponent } from '../../../../shared/select.component';
import { GoodsCategory } from '../../entities/goods-category';
import { GoodsFormPresenter, GoodsFormValue, emptyGoodsForm } from './goods.form.presenter';
import { GoodsFormView } from './goods.form.view';

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Tersedia' },
  { value: 'out_of_stock', label: 'Stok Habis' },
  { value: 'coming_soon', label: 'Segera Hadir' },
];

@Component({
  selector: 'app-goods-form-page',
  standalone: true,
  templateUrl: './goods.form.page.html',
  imports: [FormsModule, RouterLink, ImageUploadComponent, MultiImageUploadComponent, RichTextEditorComponent, SelectComponent],
  providers: [GoodsFormPresenter],
  styles: [`
    .page-head { max-width: 820px; margin: 0 auto 24px; } .back { display: inline-block; margin-bottom: 8px; color: var(--color-text-secondary); }
    .form-card { max-width: 820px; margin: 0 auto; }
  `],
})
export class GoodsFormPage implements OnInit, GoodsFormView {
  private presenter = inject(GoodsFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  categories = signal<GoodsCategory[]>([]);
  saving = signal(false);
  editId: number | null = null;
  form: GoodsFormValue = { ...emptyGoodsForm };
  availabilityOptions = AVAILABILITY_OPTIONS;
  categoryOptions = computed(() => this.categories().map((c) => ({ value: c.goodsCategoryID, label: c.categoryName })));

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

  setCategories(categories: GoodsCategory[]): void {
    this.categories.set(categories);
    if (!this.form.goodsCategoryID && categories[0]) this.form.goodsCategoryID = categories[0].goodsCategoryID;
  }
  setForm(form: GoodsFormValue): void { this.form = form; }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  navigateToIndex(): void { this.router.navigate(['/cms/goods']); }
}
