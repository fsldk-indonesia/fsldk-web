import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Campaign, CampaignCategory } from '../../entities/campaign';
import { IconComponent } from '../../../../shared/icon.component';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalCampaignListPresenter } from './kantong-amal.campaign-list.presenter';
import { KantongAmalCampaignListView } from './kantong-amal.campaign-list.view';

const SORT_OPTIONS: SelectOption[] = [
  { value: '-createdDate', label: 'Terbaru' },
  { value: '-collectedAmountCache', label: 'Dana Terkumpul Terbanyak' },
];

@Component({
  selector: 'app-kantong-amal-campaign-list-page',
  standalone: true,
  templateUrl: './kantong-amal.campaign-list.page.html',
  imports: [RouterLink, FormsModule, IconComponent, SelectComponent],
  providers: [KantongAmalCampaignListPresenter],
  styles: [`
    .section { background: linear-gradient(180deg, var(--color-primary-soft) 0%, var(--color-primary-tint) 220px, #fff 520px); }
    .filters { display: flex; flex-direction: column; gap: 16px; align-items: center; }
    .search { max-width: 460px; }
    .chips { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
    .sort-row { display: flex; justify-content: flex-end; margin: 20px 0 4px; }
    .sort-row select { width: auto; }

    .campaign-card { display: block; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out); }
    .campaign-card:hover { box-shadow: var(--shadow); transform: translateY(-3px); text-decoration: none; }
    .campaign-thumb { aspect-ratio: 16/10; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-size: .8rem; }
    .campaign-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .campaign-body { padding: 20px; }
    .campaign-body h3 { margin: 12px 0 10px; font-size: 1.08rem; }
    .progress-track { height: 8px; border-radius: 999px; background: var(--color-bg-alt); overflow: hidden; }
    .progress-fill { height: 100%; background: var(--color-primary); border-radius: 999px; }
    .progress-meta { display: flex; justify-content: space-between; font-size: .82rem; color: var(--color-text-secondary); margin-top: 8px; }
    .progress-meta strong { color: var(--color-primary-dark); }

    .pager { display: flex; align-items: center; justify-content: center; gap: 18px; margin-top: 36px; color: var(--color-text-secondary); font-size: .9rem; }
  `],
})
export class KantongAmalCampaignListPage implements OnInit, KantongAmalCampaignListView {
  private presenter = inject(KantongAmalCampaignListPresenter);

  campaigns = signal<Campaign[]>([]);
  categories = signal<CampaignCategory[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  limit = 9;
  search = '';
  activeCategoryID = 0;
  sort = '-createdDate';

  readonly kantongAmalPath = kantongAmalPath;
  readonly formatRupiah = formatRupiah;
  readonly sortOptions = SORT_OPTIONS;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadCategories();
    this.load();
  }

  load(): void { this.presenter.load(this.page(), this.limit, this.search, this.activeCategoryID, this.sort); }

  applySearch(): void { this.page.set(1); this.load(); }
  filterCategory(id: number): void { this.activeCategoryID = id; this.page.set(1); this.load(); }
  applySort(): void { this.page.set(1); this.load(); }
  go(p: number): void { this.page.set(p); this.load(); }
  totalPages(): number { return Math.max(1, Math.ceil(this.count() / this.limit)); }
  progressPercent(c: Campaign): number { return c.targetAmount > 0 ? Math.min(100, Math.round((c.collectedAmount / c.targetAmount) * 100)) : 0; }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setCampaigns(campaigns: Campaign[], count: number): void { this.campaigns.set(campaigns); this.count.set(count); }
  setCategories(categories: CampaignCategory[]): void { this.categories.set(categories); }
}
