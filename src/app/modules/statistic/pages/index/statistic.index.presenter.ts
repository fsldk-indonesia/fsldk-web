import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { StatisticRepository } from '../../repositories/statistic.repository';
import { StatisticIndexView } from './statistic.index.view';

@Injectable()
export class StatisticIndexPresenter extends BasePresenter<StatisticIndexView> {
  private repo = inject(StatisticRepository);

  loadStats(): void {
    this.repo.networkStats().subscribe({
      next: (stats) => this.view.setStats(stats),
      error: () => this.view.setStatsError(),
    });
  }

  loadDirectory(page: number, limit: number, search: string, type: string, province: string): void {
    this.repo.directory({
      page, limit,
      search: search || undefined,
      type: type || undefined,
      province: province || undefined,
    }).subscribe({
      next: (p) => this.view.setDirectory(p.data, p.count),
      error: () => this.view.setDirectoryError(),
    });
  }
}
