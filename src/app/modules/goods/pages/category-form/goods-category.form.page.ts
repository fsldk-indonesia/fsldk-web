import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { GoodsCategoryFormPresenter, GoodsCategoryFormValue, emptyGoodsCategoryForm } from './goods-category.form.presenter';
import { GoodsCategoryFormView } from './goods-category.form.view';

@Component({
  selector: 'app-goods-category-form-page',
  standalone: true,
  templateUrl: './goods-category.form.page.html',
  imports: [FormsModule, RouterLink, IconComponent],
  providers: [GoodsCategoryFormPresenter],
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
export class GoodsCategoryFormPage implements OnInit, GoodsCategoryFormView {
  private presenter = inject(GoodsCategoryFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  saving = signal(false);
  editId: number | null = null;
  // Halaman detail (read-only) memakai komponen yang sama dengan form edit —
  // dibedakan lewat route data `viewOnly` (lihat goods.routes.ts), pola sama
  // seperti Perpustakaan/Event/Berita.
  isReadonly = false;
  form: GoodsCategoryFormValue = { ...emptyGoodsCategoryForm };

  get pageSubtitle(): string {
    if (this.isReadonly) return 'Lihat detail kategori ini.';
    return this.editId ? 'Perbarui informasi kategori yang sudah ada.' : 'Buat kategori baru untuk mengelompokkan produk.';
  }

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.isReadonly = this.route.snapshot.data['viewOnly'] === true;
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
