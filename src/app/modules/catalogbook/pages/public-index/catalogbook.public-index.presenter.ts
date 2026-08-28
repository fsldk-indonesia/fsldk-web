import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { CatalogBookRepository } from '../../repositories/catalogbook.repository';
import { CatalogBookPublicIndexView } from './catalogbook.public-index.view';

export interface CatalogBookPublicFilter {
  bookCategoryID: number;
  authorTypeID: number;
  availabilityTypeID: number;
  languageID: number;
  year: string;
}

export const emptyCatalogBookPublicFilter: CatalogBookPublicFilter = {
  bookCategoryID: 0, authorTypeID: 0, availabilityTypeID: 0, languageID: 0, year: '',
};

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
      bookCategoryID: filter.bookCategoryID || undefined,
      authorTypeID: filter.authorTypeID || undefined,
      availabilityTypeID: filter.availabilityTypeID || undefined,
      languageID: filter.languageID || undefined,
      year: filter.year || undefined,
    };
    this.bookRepo.publicList(q).subscribe({
      next: (p) => { this.view.setBooks(p.data, p.count); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }
}
