import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { CatalogBookRepository } from '../../repositories/catalogbook.repository';
import { CatalogBookPublicIndexView } from './catalogbook.public-index.view';

/** Nilai filter publik — SEMUA field multi-select (array), keynya SENGAJA
 *  dibuat identik dengan nama query param backend (bookCategoryID,
 *  authorTypeID, availabilityTypeID, languageID, year — lihat
 *  catalogbook_handler.parseFilter) supaya bisa langsung disebar ke query
 *  tanpa pemetaan nama. ApiService men-serialize array jadi repeated query
 *  key (?bookCategoryID=1&bookCategoryID=2), dibaca backend lewat
 *  c.QueryArray() + IN(...) — dukungan multi-value ini sudah ada di
 *  backend sejak awal, cuma belum dipakai oleh UI filter lama. */
export interface CatalogBookPublicFilter {
  bookCategoryID?: number[];
  authorTypeID?: number[];
  availabilityTypeID?: number[];
  languageID?: number[];
  year?: string[];
}

export const emptyCatalogBookPublicFilter: CatalogBookPublicFilter = {};

@Injectable()
export class CatalogBookPublicIndexPresenter extends BasePresenter<CatalogBookPublicIndexView> {
  private bookRepo = inject(CatalogBookRepository);

  loadLookups(): void {
    this.bookRepo.categories().subscribe({ next: (c) => this.view.setCategories(c), error: () => {} });
    this.bookRepo.languages().subscribe({ next: (l) => this.view.setLanguages(l), error: () => {} });
    this.bookRepo.authorTypes().subscribe({ next: (t) => this.view.setAuthorTypes(t), error: () => {} });
    this.bookRepo.availabilityTypes().subscribe({ next: (t) => this.view.setAvailabilityTypes(t), error: () => {} });
  }

  load(page: number, limit: number, search: string, sort: string, filter: CatalogBookPublicFilter): void {
    this.view.setLoading(true);
    const q: Record<string, unknown> = {
      page, limit, search, sort,
      bookCategoryID: filter.bookCategoryID,
      authorTypeID: filter.authorTypeID,
      availabilityTypeID: filter.availabilityTypeID,
      languageID: filter.languageID,
      year: filter.year,
    };
    this.bookRepo.publicList(q).subscribe({
      next: (p) => { this.view.setBooks(p.data, p.count); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }
}
