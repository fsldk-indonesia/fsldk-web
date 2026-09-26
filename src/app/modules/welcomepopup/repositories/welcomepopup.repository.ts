import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WelcomepopupApiService } from '../services/welcomepopup-api.service';
import { WelcomePopup, WelcomePopupUpdatePayload } from '../entities/welcome-popup';

@Injectable({ providedIn: 'root' })
export class WelcomepopupRepository {
  private api = inject(WelcomepopupApiService);

  get(): Observable<WelcomePopup> { return this.api.get(); }
  update(payload: WelcomePopupUpdatePayload): Observable<WelcomePopup> { return this.api.update(payload); }
  getPublic(): Observable<WelcomePopup> { return this.api.getPublic(); }
}
