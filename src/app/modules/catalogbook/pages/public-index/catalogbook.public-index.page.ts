import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CatalogBook } from '../../entities/catalog-book';
import { BookCategory } from '../../entities/book-category';
import { BookLanguage } from '../../entities/book-language';
import { BookAuthorType } from '../../entities/book-author-type';
import { BookAvailabilityType } from '../../entities/book-availability-type';
import { IconComponent } from '../../../../shared/icon.component';
import { SelectComponent } from '../../../../shared/select.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { CatalogBookPublicIndexPresenter, CatalogBookPublicFilter, emptyCatalogBookPublicFilter } from './catalogbook.public-index.presenter';
import { CatalogBookPublicIndexView } from './catalogbook.public-index.view';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'popular', label: 'Terpopuler' },
  { value: 'title', label: 'Judul A-Z' },
];

@Component({
  selector: 'app-catalogbook-public-index-page',
  standalone: true,
  templateUrl: './catalogbook.public-index.page.html',
  imports: [RouterLink, FormsModule, IconComponent, SelectComponent, ModalBackdropDirective],
  providers: [CatalogBookPublicIndexPresenter],
  styles: [`
    .section { background: linear-gradient(180deg, var(--color-primary-soft) 0%, var(--color-primary-tint) 220px, #fff 520px); }
    .toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center; }
    .search { max-width: 380px; flex: 1 1 260px; }
    /* Fixed width (not max-width) — app-select's trigger/menu size to this
       host box, so an unbounded shrink-to-fit width made the box (and the
       dropdown menu under it) resize per selected option's text length,
       wrapping longer labels like "Judul A-Z". */
    .sort { width: 180px; flex-shrink: 0; }
    .book-card { display: block; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out); }
    .book-card:hover { box-shadow: var(--shadow); transform: translateY(-3px); text-decoration: none; }
    .book-thumb { aspect-ratio: 3/4; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-size: .8rem; }
    .book-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .book-body { padding: 16px; } .book-body h3 { margin: 8px 0 4px; font-size: 1rem; line-height: 1.3; }
    .meta { color: var(--color-muted); font-size: .82rem; margin: 4px 0 0; }
    .fav { display: inline-flex; align-items: center; gap: 5px; margin-top: 10px; font-size: .82rem; color: var(--color-muted); }
    .pager { display: flex; align-items: center; justify-content: center; gap: 18px; margin-top: 36px; color: var(--color-text-secondary); font-size: .9rem; }
    /* Every popup in this app defines its own backdrop/modal positioning
       locally (no global .modal-backdrop rule exists in styles.scss — see
       role.index.page.ts for the same pattern) — this was missing here,
       so the "backdrop" rendered as a plain block in normal document flow
       instead of a centered fixed overlay. */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    .modal { width: 100%; max-width: 460px; max-height: 86vh; overflow-y: auto; }
    .modal h3 { margin: 0 0 16px; }
  `],
})
export class CatalogBookPublicIndexPage implements OnInit, CatalogBookPublicIndexView {
  private presenter = inject(CatalogBookPublicIndexPresenter);

  items = signal<CatalogBook[]>([]);
  categories = signal<BookCategory[]>([]);
  languages = signal<BookLanguage[]>([]);
  authorTypes = signal<BookAuthorType[]>([]);
  availabilityTypes = signal<BookAvailabilityType[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  showFilter = signal(false);
  limit = 12;
  search = '';
  sort = 'newest';
  filter: CatalogBookPublicFilter = { ...emptyCatalogBookPublicFilter };
  sortOptions = SORT_OPTIONS;
  private debounceHandle: ReturnType<typeof setTimeout> | null = null;

  categoryOptions = computed(() => [{ value: 0, label: 'Semua Kategori' }, ...this.categories().map((c) => ({ value: c.bookCategoryID, label: c.bookCategoryName }))]);
  languageOptions = computed(() => [{ value: 0, label: 'Semua Bahasa' }, ...this.languages().map((l) => ({ value: l.languageID, label: l.languageName }))]);
  authorTypeOptions = computed(() => [{ value: 0, label: 'Semua Tipe Penulis' }, ...this.authorTypes().map((t) => ({ value: t.authorTypeID, label: t.authorTypeName }))]);
  availabilityTypeOptions = computed(() => [{ value: 0, label: 'Semua Ketersediaan' }, ...this.availabilityTypes().map((t) => ({ value: t.availabilityTypeID, label: t.availabilityTypeName }))]);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadLookups();
    this.load();
  }

  load(): void { this.presenter.load(this.page(), this.limit, this.search, this.sort, this.filter); }
  apply(): void {
    if (this.debounceHandle) { clearTimeout(this.debounceHandle); this.debounceHandle = null; }
    this.page.set(1);
    this.load();
  }
  onSearchInput(): void {
    if (this.debounceHandle) clearTimeout(this.debounceHandle);
    this.debounceHandle = setTimeout(() => this.apply(), 400);
  }
  go(p: number): void { this.page.set(p); this.load(); }
  totalPages(): number { return Math.max(1, Math.ceil(this.count() / this.limit)); }
  activeFilterCount(): number {
    return [this.filter.bookCategoryID, this.filter.authorTypeID, this.filter.availabilityTypeID, this.filter.languageID].filter((v) => v).length + (this.filter.year ? 1 : 0);
  }

  openFilter(): void { this.showFilter.set(true); }
  closeFilter(): void { this.showFilter.set(false); }
  applyFilter(): void { this.showFilter.set(false); this.apply(); }
  resetFilter(): void { this.filter = { ...emptyCatalogBookPublicFilter }; this.showFilter.set(false); this.apply(); }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setBooks(books: CatalogBook[], count: number): void { this.items.set(books); this.count.set(count); }
  setCategories(categories: BookCategory[]): void { this.categories.set(categories); }
  setLanguages(languages: BookLanguage[]): void { this.languages.set(languages); }
  setAuthorTypes(types: BookAuthorType[]): void { this.authorTypes.set(types); }
  setAvailabilityTypes(types: BookAvailabilityType[]): void { this.availabilityTypes.set(types); }
}
