import { PengurusEntry } from '../../entities/pengurus';

export interface PengurusIndexView {
  setItems(items: PengurusEntry[]): void;
  setLoading(loading: boolean): void;
  /** userID sedang diproses (dipakai page untuk disable baris itu saja
   *  selagi request jalan), null = tidak ada yang sedang diproses. */
  setBusy(userID: number | null): void;
}
