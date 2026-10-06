import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { RapimnasPublic, RapimnasCms, RapimnasUpdatePayload } from '../entities/rapimnas';

/** Panggilan HTTP mentah untuk Rapimnas (/public/rapimnas publik, /rapimnas-setup CMS). */
@Injectable({ providedIn: 'root' })
export class RapimnasApiService {
  private api = inject(ApiService);

  getPublic(): Observable<RapimnasPublic> { return this.api.get('/public/rapimnas'); }
  get(): Observable<RapimnasCms> { return this.api.get('/rapimnas-setup'); }
  update(payload: RapimnasUpdatePayload): Observable<RapimnasCms> { return this.api.put('/rapimnas-setup', payload); }
}
