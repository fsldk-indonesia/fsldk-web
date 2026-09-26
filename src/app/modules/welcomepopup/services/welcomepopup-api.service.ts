import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { WelcomePopup, WelcomePopupUpdatePayload } from '../entities/welcome-popup';

/** Panggilan HTTP mentah untuk Welcome Popup (/welcome-popup CMS,
 *  /public/welcome-popup publik). */
@Injectable({ providedIn: 'root' })
export class WelcomepopupApiService {
  private api = inject(ApiService);

  get(): Observable<WelcomePopup> { return this.api.get('/welcome-popup'); }
  update(payload: WelcomePopupUpdatePayload): Observable<WelcomePopup> { return this.api.put('/welcome-popup', payload); }
  /** Endpoint publik (tanpa auth) — dipakai halaman Beranda, BUKAN CMS. */
  getPublic(): Observable<WelcomePopup> { return this.api.get('/public/welcome-popup'); }
}
