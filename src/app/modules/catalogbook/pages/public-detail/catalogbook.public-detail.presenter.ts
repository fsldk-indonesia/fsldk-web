import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { CatalogBookRepository } from '../../repositories/catalogbook.repository';
import { CatalogBookPublicDetailView } from './catalogbook.public-detail.view';

@Injectable()
export class CatalogBookPublicDetailPresenter extends BasePresenter<CatalogBookPublicDetailView> {
  private bookRepo = inject(CatalogBookRepository);
  private toast = inject(ToastService);

  load(slug: string): void {
    this.view.setLoading(true);
    this.bookRepo.publicDetail(slug).subscribe({
      next: (b) => { this.view.setBook(b); this.view.setLoading(false); },
      error: () => { this.view.setBook(null); this.view.setLoading(false); },
    });
  }

  like(bookID: number): void {
    this.bookRepo.like(bookID).subscribe({
      next: (res) => this.view.setFavoriteCount(res.favoriteCount),
      error: () => this.toast.error('Gagal menyukai buku, coba lagi nanti'),
    });
  }
}
