import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';
import { RapimnasApiService } from '../services/rapimnas-api.service';
import { RapimnasPublic, RapimnasCms, RapimnasUpdatePayload } from '../entities/rapimnas';

@Injectable({ providedIn: 'root' })
export class RapimnasRepository {
  private api = inject(RapimnasApiService);

  /** shareReplay(1) cache — 6 halaman publik semuanya butuh payload aggregate
   *  yang sama (setting + 6 child list); tanpa ini tiap pindah halaman akan
   *  refetch ulang semuanya. Tidak ada precedent shareReplay lain di codebase
   *  ini (repo lain yang di-cache, mis. gallery, pakai signal singleton biasa
   *  di repository-nya) — dipilih di sini karena bentuknya pas: satu nilai,
   *  tidak perlu invalidasi manual di luar alur simpan CMS (lihat update()). */
  private publicCache$: Observable<RapimnasPublic> | null = null;

  getPublic(): Observable<RapimnasPublic> {
    if (!this.publicCache$) {
      this.publicCache$ = this.api.getPublic().pipe(shareReplay({ bufferSize: 1, refCount: false }));
    }
    return this.publicCache$;
  }

  get(): Observable<RapimnasCms> { return this.api.get(); }

  update(payload: RapimnasUpdatePayload): Observable<RapimnasCms> {
    // Invalidate cache publik — setelah CMS menyimpan, halaman publik yang
    // dinavigasi berikutnya harus mengambil data terbaru, bukan cache basi.
    return this.api.update(payload).pipe(tap(() => { this.publicCache$ = null; }));
  }
}
