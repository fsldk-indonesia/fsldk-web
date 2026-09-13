import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
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
  imports: [FormsModule, RouterLink, IconComponent, ImageUploadComponent, MultiImageUploadComponent, RichTextEditorComponent, SelectComponent],
  providers: [GoodsFormPresenter],
  styles: [`
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
export class GoodsFormPage implements OnInit, GoodsFormView {
  private presenter = inject(GoodsFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  categories = signal<GoodsCategory[]>([]);
  saving = signal(false);
  editId: number | null = null;
  // Halaman detail (read-only) memakai komponen yang sama dengan form edit —
  // dibedakan lewat route data `viewOnly` (lihat goods.routes.ts), pola sama
  // seperti Perpustakaan/Event/Berita.
  isReadonly = false;
  form: GoodsFormValue = { ...emptyGoodsForm };
  availabilityOptions = AVAILABILITY_OPTIONS;
  categoryOptions = computed(() => this.categories().map((c) => ({ value: c.goodsCategoryID, label: c.categoryName })));

  get pageSubtitle(): string {
    if (this.isReadonly) return 'Lihat detail lengkap produk ini.';
    return this.editId ? 'Perbarui informasi produk yang sudah ada.' : 'Isi informasi produk yang akan dipublikasikan ke katalog.';
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

  setCategories(categories: GoodsCategory[]): void {
    this.categories.set(categories);
    if (!this.form.goodsCategoryID && categories[0]) this.form.goodsCategoryID = categories[0].goodsCategoryID;
  }
  setForm(form: GoodsFormValue): void { this.form = form; }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  navigateToIndex(): void { this.router.navigate(['/cms/goods/products']); }
}
