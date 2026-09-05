import { NetworkStats, DirectoryEntry } from '../../entities/statistic';

export interface StatisticIndexView {
  setStats(stats: NetworkStats): void;
  setStatsError(): void;
  setDirectory(items: DirectoryEntry[], count: number): void;
  setDirectoryError(): void;
}
