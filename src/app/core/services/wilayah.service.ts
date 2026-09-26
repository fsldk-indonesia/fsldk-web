import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { SelectOption } from '../../shared/select.component';

interface WilayahProvince { id: string; name: string; }
interface WilayahRegency { id: string; province_id: string; name: string; }

/**
 * Pembungkus API publik "emsifa wilayah indonesia" (gratis, tanpa auth) untuk
 * dropdown Provinsi/Kota-Kabupaten berjenjang di form LDK/Puskomda — sebelum
 * ini provinceName/cityName cuma input teks bebas, tidak ada master data
 * wilayah di codebase ini sama sekali. Dipanggil lewat HttpClient LANGSUNG
 * (bukan ApiService, yang selalu mem-prefix environment.apiBaseUrl dan
 * membongkar amplop {result:...} FSLDK API sendiri — respons API ini array
 * polos dari host pihak ketiga). Lihat auth.interceptor.ts: header
 * Authorization sengaja TIDAK disisipkan untuk request non-apiBaseUrl supaya
 * tidak memicu CORS preflight ke host statis ini.
 *
 * Nilai yang disimpan ke form (provinceName/cityName) adalah LABEL nama
 * wilayah, bukan id — backend organization_dto hanya punya kolom string
 * bebas tanpa FK ke master wilayah manapun (lihat CreateRequest/UpdateRequest).
 * id provinsi cuma dipakai sebagai kunci untuk memanggil regencies().
 */
@Injectable({ providedIn: 'root' })
export class WilayahService {
  private http = inject(HttpClient);
  private base = 'https://www.emsifa.com/api-wilayah-indonesia/api';

  provinces(): Observable<SelectOption[]> {
    return this.http.get<WilayahProvince[]>(`${this.base}/provinces.json`).pipe(
      map((list) => list.map((p) => ({ value: p.id, label: p.name } as SelectOption))),
    );
  }

  regencies(provinceId: string): Observable<SelectOption[]> {
    return this.http.get<WilayahRegency[]>(`${this.base}/regencies/${provinceId}.json`).pipe(
      map((list) => list.map((r) => ({ value: r.id, label: r.name } as SelectOption))),
    );
  }
}
