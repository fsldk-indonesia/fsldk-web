
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';

import {
  RapimnasLombaSetting,
  RapimnasLombaUpdatePayload,
  LombaUpdateResult,
} from '../entities/rapimnas-lomba';

@Injectable({ providedIn: 'root' })
export class RapimnasLombaApiService {
  private readonly api = inject(ApiService);

  getPublic(): Observable<RapimnasLombaSetting> {
    return this.api.get<RapimnasLombaSetting>(
      '/public/rapimnas/lomba'
    );
  }

  getCMS(): Observable<RapimnasLombaSetting> {
    return this.api.get<RapimnasLombaSetting>(
      '/rapimnas-lomba'
    );
  }

  updateCMS(
    payload: RapimnasLombaUpdatePayload
  ): Observable<LombaUpdateResult> {
    return this.api.put<LombaUpdateResult>(
      '/rapimnas-lomba',
      payload
    );
  }
}
