import { NetworkStats, DirectoryEntry } from '../../entities/statistic';

export interface StatisticIndexView {
  setStats(stats: NetworkStats): void;
  setStatsError(): void;
  setDirectory(items: DirectoryEntry[], count: number): void;
  setDirectoryError(): void;
  /** Daftar Puskomda aktif (38, sekali ambil) — sumber opsi filter "Puskomda
   *  Induk", terpisah dari setDirectory() supaya tidak ikut ter-replace tiap
   *  kali tree utama di-refetch oleh pencarian/filter lain. */
  setPuskomdaOptions(items: DirectoryEntry[]): void;
}
