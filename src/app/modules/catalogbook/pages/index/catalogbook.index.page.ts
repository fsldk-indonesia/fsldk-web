import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { CatalogBook } from '../../entities/catalog-book';
import { BookCategory } from '../../entities/book-category';
import { IconComponent } from '../../../../shared/icon.component';
import { SelectComponent } from '../../../../shared/select.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { CatalogBookIndexPresenter } from './catalogbook.index.presenter';
import { CatalogBookIndexView } from './catalogbook.index.view';

@Component({
  selector: 'app-catalogbook-index-page',
  standalone: true,
  templateUrl: './catalogbook.index.page.html',
  imports: [RouterLink, FormsModule, IconComponent, SelectComponent, PaginationComponent],
  providers: [CatalogBookIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class CatalogBookIndexPage implements OnInit, CatalogBookIndexView {
  private presenter = inject(CatalogBookIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  books = signal<CatalogBook[]>([]);
  categories = signal<BookCategory[]>([]);
  loading = signal(true);
  search = '';
  bookCategoryID = 0;
  page = signal(1);
  count = signal(0);
  readonly limit = 10;
  busy = signal<ReadonlySet<number>>(new Set());

  canCreate = this.auth.hasPermission('catalogbook.create');
  canUpdate = this.auth.hasPermission('catalogbook.update');
  canPublish = this.auth.hasPermission('catalogbook.publish');
  canDelete = this.auth.hasPermission('catalogbook.delete');

  categoryOptions = computed(() => [{ value: 0, label: 'Semua Kategori' }, ...this.categories().map((c) => ({ value: c.bookCategoryID, label: c.bookCategoryName }))]);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadCategories();
    this.load();
  }

  load(): void { this.loading.set(true); this.presenter.load(this.page(), this.limit, this.search, this.bookCategoryID); }
  apply(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }
  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  togglePublish(b: CatalogBook): void { this.setBusy(b.bookID); this.presenter.togglePublish(b); }
  async remove(b: CatalogBook, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus buku "${b.bookTitle}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Buku', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(b.bookID);
    this.presenter.remove(b);
  }

  setBooks(books: CatalogBook[], count: number): void { this.books.set(books); this.count.set(count); this.loading.set(false); }
  setCategories(categories: BookCategory[]): void { this.categories.set(categories); }
  onPublishToggleSuccess(): void { this.load(); }
  onRemoveSuccess(): void { this.load(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
