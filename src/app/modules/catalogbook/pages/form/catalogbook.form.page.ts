import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { PdfUploadComponent } from '../../../../shared/pdf-upload.component';
import { SelectComponent } from '../../../../shared/select.component';
import { BookCategory } from '../../entities/book-category';
import { BookLanguage } from '../../entities/book-language';
import { BookAuthorType } from '../../entities/book-author-type';
import { BookAvailabilityType } from '../../entities/book-availability-type';
import { CatalogBookFormPresenter, CatalogBookFormValue, emptyCatalogBookForm } from './catalogbook.form.presenter';
import { CatalogBookFormView } from './catalogbook.form.view';

@Component({
  selector: 'app-catalogbook-form-page',
  standalone: true,
  templateUrl: './catalogbook.form.page.html',
  imports: [FormsModule, RouterLink, IconComponent, ImageUploadComponent, PdfUploadComponent, SelectComponent],
  providers: [CatalogBookFormPresenter],
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
export class CatalogBookFormPage implements OnInit, CatalogBookFormView {
  private presenter = inject(CatalogBookFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  categories = signal<BookCategory[]>([]);
  languages = signal<BookLanguage[]>([]);
  authorTypes = signal<BookAuthorType[]>([]);
  availabilityTypes = signal<BookAvailabilityType[]>([]);
  saving = signal(false);
  editId: number | null = null;
  // Halaman detail (read-only) memakai komponen yang sama dengan form edit —
  // dibedakan lewat route data `viewOnly` (lihat catalogbook.routes.ts), bukan
  // URL atau state terpisah, supaya layout field tidak dobel-maintain di 2 file.
  isReadonly = false;
  form: CatalogBookFormValue = { ...emptyCatalogBookForm };

  categoryOptions = computed(() => this.categories().map((c) => ({ value: c.bookCategoryID, label: c.bookCategoryName })));
  languageOptions = computed(() => this.languages().map((l) => ({ value: l.languageID, label: l.languageName })));
  authorTypeOptions = computed(() => this.authorTypes().map((t) => ({ value: t.authorTypeID, label: t.authorTypeName })));
  availabilityTypeOptions = computed(() => this.availabilityTypes().map((t) => ({ value: t.availabilityTypeID, label: t.availabilityTypeName })));

  get pageSubtitle(): string {
    if (this.isReadonly) return 'Lihat detail lengkap buku ini.';
    return this.editId ? 'Perbarui informasi buku yang sudah ada.' : 'Isi informasi buku yang akan dipublikasikan ke pengguna.';
  }

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadLookups();

    this.isReadonly = this.route.snapshot.data['viewOnly'] === true;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.presenter.loadForEdit(this.editId);
    }
  }

  save(): void { this.presenter.save(this.editId, this.form); }

  setCategories(categories: BookCategory[]): void { this.categories.set(categories); if (!this.form.bookCategoryID && categories[0]) this.form.bookCategoryID = categories[0].bookCategoryID; }
  setLanguages(languages: BookLanguage[]): void { this.languages.set(languages); if (!this.form.languageID && languages[0]) this.form.languageID = languages[0].languageID; }
  setAuthorTypes(types: BookAuthorType[]): void { this.authorTypes.set(types); if (!this.form.authorTypeID && types[0]) this.form.authorTypeID = types[0].authorTypeID; }
  setAvailabilityTypes(types: BookAvailabilityType[]): void { this.availabilityTypes.set(types); if (!this.form.availabilityTypeID && types[0]) this.form.availabilityTypeID = types[0].availabilityTypeID; }
  setForm(form: CatalogBookFormValue): void { this.form = form; }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  navigateToIndex(): void { this.router.navigate(['/cms/catalog-books']); }
}
