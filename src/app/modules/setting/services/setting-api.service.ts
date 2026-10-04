import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Setting } from '../entities/setting';

/** Panggilan HTTP mentah untuk App Settings (/settings). */
@Injectable({ providedIn: 'root' })
export class SettingApiService {
  private api = inject(ApiService);

  list(): Observable<Setting[]> { return this.api.get('/settings'); }
  update(id: number, settingValue: string): Observable<Setting> { return this.api.put(`/settings/${id}`, { settingValue }); }

  /** Email kontak ditampilkan di beranda ("Hubungi Kami") & /kontak,
   *  lihat setting_model.go (backend) GroupKontak/KeyContactEmail. */
  getPublicContactEmail(): Observable<{ email: string }> { return this.api.get('/public/settings/contact-email'); }

  /** Nomor WhatsApp untuk floating button (app-whatsapp-fab, shared/) —
   *  angka digit internasional tanpa "+"/spasi/strip, siap dipakai untuk
   *  link wa.me/<nomor>. Lihat setting_model.go GroupKontak/KeyContactWhatsapp. */
  getPublicContactWhatsapp(): Observable<{ whatsappNumber: string }> { return this.api.get('/public/settings/contact-whatsapp'); }
}
