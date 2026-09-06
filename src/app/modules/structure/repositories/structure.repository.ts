import { Injectable, inject, signal } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { StructureApiService } from '../services/structure-api.service';
import { Structure, StructureCreateReq, StructureUpdateReq } from '../entities/structure';
import { Pagination } from '../../../core/entities/pagination';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StructureRepository {
  private api = inject(StructureApiService);

  publicStructures = signal<Structure[]>([]);
  cmsStructures = signal<Pagination<Structure> | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  loadPublic(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listPublic().subscribe({
      next: (res) => {
        this.publicStructures.set(res.result);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Gagal memuat data struktur');
        this.loading.set(false);
      }
    });
  }

  loadCMS(params: { page: number; limit: number; search?: string; sort_by?: string; sort_order?: 'asc'|'desc' }): void {
    this.loading.set(true);
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('limit', params.limit);
    
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);
    if (params.sort_order) httpParams = httpParams.set('sort_order', params.sort_order);

    this.api.listCMS(httpParams).subscribe({
      next: (res) => {
        this.cmsStructures.set(res.result);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Gagal memuat data struktur');
        this.loading.set(false);
      }
    });
  }

  getByID(id: number) {
    return this.api.getByID(id);
  }

  create(req: StructureCreateReq) {
    return this.api.create(req);
  }

  update(id: number, req: StructureUpdateReq) {
    return this.api.update(id, req);
  }

  delete(id: number) {
    return this.api.delete(id);
  }
}
