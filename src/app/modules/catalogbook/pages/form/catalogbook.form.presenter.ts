import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { CatalogBookRepository } from '../../repositories/catalogbook.repository';
import { CatalogBookFormView } from './catalogbook.form.view';

export interface CatalogBookFormValue {
  isbn: string;
  bookTitle: string;
  authorName: string;
  authorTypeID: number;
  publisherName: string;
  bookCategoryID: number;
  languageID: number;
  availabilityTypeID: number;
  bookPdf: string;
  year: string;
  pages: number;
  description: string;
  synopsis: string;
  edition: string;
  coverImage: string;
  tags: string;
  metaKeywords: string;
  metaDescription: string;
}

export const emptyCatalogBookForm: CatalogBookFormValue = {
  isbn: '', bookTitle: '', authorName: '', authorTypeID: 0, publisherName: '',
  bookCategoryID: 0, languageID: 0, availabilityTypeID: 0, bookPdf: '',
  year: '', pages: 0, description: '', synopsis: '', edition: '', coverImage: '',
  tags: '', metaKeywords: '', metaDescription: '',
};

@Injectable()
export class CatalogBookFormPresenter extends BasePresenter<CatalogBookFormView> {
  private bookRepo = inject(CatalogBookRepository);
  private toast = inject(ToastService);

  loadLookups(): void {
    this.bookRepo.categories().subscribe({ next: (c) => this.view.setCategories(c), error: () => {} });
    this.bookRepo.languages().subscribe({ next: (l) => this.view.setLanguages(l), error: () => {} });
    this.bookRepo.authorTypes().subscribe({ next: (t) => this.view.setAuthorTypes(t), error: () => {} });
    this.bookRepo.availabilityTypes().subscribe({ next: (t) => this.view.setAvailabilityTypes(t), error: () => {} });
  }

  loadForEdit(id: number): void {
    this.bookRepo.cmsGet(id).subscribe({
      next: (b) => this.view.setForm({
        isbn: b.isbn ?? '', bookTitle: b.bookTitle, authorName: b.authorName, authorTypeID: b.authorTypeID,
        publisherName: b.publisherName, bookCategoryID: b.bookCategoryID, languageID: b.languageID,
        availabilityTypeID: b.availabilityTypeID, bookPdf: b.bookPdf ?? '',
        year: b.year, pages: b.pages, description: b.description, synopsis: b.synopsis ?? '',
        edition: b.edition ?? '', coverImage: b.coverImage ?? '', tags: b.tags ?? '',
        metaKeywords: b.metaKeywords ?? '', metaDescription: b.metaDescription ?? '',
      }),
      error: () => {},
    });
  }

  save(editId: number | null, form: CatalogBookFormValue): void {
    if (!form.bookTitle || !form.authorName || !form.publisherName || !form.description) {
      this.toast.error('Judul, penulis, penerbit, dan deskripsi wajib diisi');
      return;
    }
    if (!form.authorTypeID || !form.bookCategoryID || !form.languageID || !form.availabilityTypeID) {
      this.toast.error('Kategori, bahasa, tipe penulis, dan ketersediaan wajib dipilih');
      return;
    }
    if (!/^\d{4}$/.test(form.year)) {
      this.toast.error('Tahun terbit harus 4 digit angka');
      return;
    }
    this.view.setSaving(true);
    const body = { ...form, pages: +form.pages };
    const done = () => { this.toast.success('Buku disimpan'); this.view.setSaving(false); this.view.navigateToIndex(); };
    if (editId) {
      this.bookRepo.update(editId, body).subscribe({ next: done, error: () => this.view.setSaving(false) });
    } else {
      this.bookRepo.create(body).subscribe({ next: done, error: () => this.view.setSaving(false) });
    }
  }
}
