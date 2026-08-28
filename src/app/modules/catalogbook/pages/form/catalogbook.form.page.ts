import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  imports: [FormsModule, RouterLink, ImageUploadComponent, PdfUploadComponent, SelectComponent],
  providers: [CatalogBookFormPresenter],
  styles: [`
    .page-head { max-width: 820px; margin: 0 auto 24px; } .back { display: inline-block; margin-bottom: 8px; color: var(--color-text-secondary); }
    .form-card { max-width: 820px; margin: 0 auto; }
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
  form: CatalogBookFormValue = { ...emptyCatalogBookForm };

  categoryOptions = computed(() => this.categories().map((c) => ({ value: c.bookCategoryID, label: c.bookCategoryName })));
  languageOptions = computed(() => this.languages().map((l) => ({ value: l.languageID, label: l.languageName })));
  authorTypeOptions = computed(() => this.authorTypes().map((t) => ({ value: t.authorTypeID, label: t.authorTypeName })));
  availabilityTypeOptions = computed(() => this.availabilityTypes().map((t) => ({ value: t.availabilityTypeID, label: t.availabilityTypeName })));

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadLookups();

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
