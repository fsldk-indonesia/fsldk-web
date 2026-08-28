import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { CatalogBookRepository } from '../../repositories/catalogbook.repository';
import { CatalogBook } from '../../entities/catalog-book';
import { CatalogBookIndexView } from './catalogbook.index.view';

@Injectable()
export class CatalogBookIndexPresenter extends BasePresenter<CatalogBookIndexView> {
  private bookRepo = inject(CatalogBookRepository);
  private toast = inject(ToastService);

  loadCategories(): void {
    this.bookRepo.categories().subscribe({ next: (c) => this.view.setCategories(c), error: () => {} });
  }

  load(page: number, limit: number, search: string, bookCategoryID: number): void {
    this.bookRepo.cmsList({ page, limit, search, bookCategoryID: bookCategoryID || undefined }).subscribe({
      next: (p) => this.view.setBooks(p.data, p.count), error: () => {},
    });
  }

  togglePublish(b: CatalogBook): void {
    this.bookRepo.publish(b.bookID, !b.isActive).subscribe({
      next: () => { this.toast.success(b.isActive ? 'Buku dinonaktifkan' : 'Buku diaktifkan'); this.view.onPublishToggleSuccess(); this.view.onActionSettled(b.bookID); },
      error: () => this.view.onActionSettled(b.bookID),
    });
  }

  remove(b: CatalogBook): void {
    this.bookRepo.remove(b.bookID).subscribe({
      next: () => { this.toast.success('Buku dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(b.bookID); },
      error: () => this.view.onActionSettled(b.bookID),
    });
  }
}
