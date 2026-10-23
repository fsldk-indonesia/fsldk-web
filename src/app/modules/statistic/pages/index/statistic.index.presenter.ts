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

  /** `filter` dikirim apa adanya ke `type`/`province`/`city`/`puskomda`/
   *  `level` — tiap key boleh array (multi-select, ApiService mengirimnya
   *  sebagai repeated query key, lihat core/services/api.service.ts
   *  toParams()) atau kosong/undefined (tanpa filter field itu). `sort`
   *  dipetakan backend (statistic_repository_impl.go Directory()) ke ORDER
   *  BY — 'name' (default, alfabetis) atau 'level' (Mandiri -> Pra Mula
   *  dulu, baru alfabetis). */
  loadDirectory(page: number, limit: number, search: string, filter: Record<string, unknown>, sort: string): void {
    this.repo.directory({
      page, limit,
      search: search || undefined,
      type: filter['type'],
      province: filter['province'],
      city: filter['city'],
      puskomda: filter['puskomda'],
      level: filter['level'],
      sort,
    }).subscribe({
      next: (p) => this.view.setDirectory(p.data, p.count),
      error: () => this.view.setDirectoryError(),
    });
  }

  /** Daftar Puskomda aktif (38 baris, jauh di bawah limit 100) — sekali
   *  ambil untuk mengisi opsi filter "Puskomda Induk", bukan bagian dari
   *  tree utama (loadDirectory()) supaya tidak ikut berubah tiap kali
   *  pencarian/filter lain di-apply. */
  loadPuskomdaOptions(): void {
    this.repo.directory({ type: 'PUSKOMDA', limit: 100 }).subscribe({
      next: (p) => this.view.setPuskomdaOptions(p.data),
      error: () => {},
    });
  }
}
