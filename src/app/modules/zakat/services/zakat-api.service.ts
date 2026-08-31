import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { GoldPrice } from '../entities/gold-price';

/** Raw HTTP calls for the zakat calculator — a single public gold-price proxy. */
@Injectable({ providedIn: 'root' })
export class ZakatApiService {
  private api = inject(ApiService);

  /** `refresh` maps to `?refresh=1`, forcing a backend re-fetch from upstream.
   *  `silent` keeps the auto-fetch on page load from raising a global toast. */
  goldPrice(refresh = false, silent = false): Observable<GoldPrice> {
    return this.api.get('/public/zakat/gold-price', refresh ? { refresh: 1 } : undefined, { silent });
  }
}
