/** Amplop hasil paginasi — dipakai lintas seluruh modul (news, article, user, dst). */
export interface Pagination<T> {
  page: number;
  limit: number;
  count: number;
  data: T[];
  prev: string;
  next: string;
}
