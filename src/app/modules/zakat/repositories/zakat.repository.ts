import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ZakatApiService } from '../services/zakat-api.service';
import { GoldPrice } from '../entities/gold-price';

/** Public data API of the zakat module. */
@Injectable({ providedIn: 'root' })
export class ZakatRepository {
  private api = inject(ZakatApiService);

  goldPrice(refresh = false, silent = false): Observable<GoldPrice> { return this.api.goldPrice(refresh, silent); }
}
