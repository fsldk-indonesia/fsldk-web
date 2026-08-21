import { HttpClient, HttpContext, HttpContextToken, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../entities/api-response';

/** Ditandai lewat `{ silent: true }` pada `ApiService.get()` untuk request
 *  dekoratif/opsional (mis. kartu "Konfirmasi via WhatsApp") yang errornya
 *  ditangani sendiri oleh pemanggil (biasanya disembunyikan diam-diam) —
 *  errorInterceptor membaca token ini untuk melewati toast global. */
export const SILENT_ERROR = new HttpContextToken<boolean>(() => false);

/**
 * ApiService adalah pembungkus HttpClient yang membuka amplop response standar
 * FSLDK API dan mengembalikan hanya bagian `result`.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  private toParams(query?: Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== '') {
          params = params.set(k, String(v));
        }
      }
    }
    return params;
  }

  private unwrap<T>() {
    return map((res: ApiResponse<T>) => res.result);
  }

  get<T>(path: string, query?: Record<string, unknown>, opts?: { silent?: boolean }): Observable<T> {
    const context = opts?.silent ? new HttpContext().set(SILENT_ERROR, true) : undefined;
    return this.http.get<ApiResponse<T>>(`${this.base}${path}`, { params: this.toParams(query), context }).pipe(this.unwrap<T>());
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${this.base}${path}`, body ?? {}).pipe(this.unwrap<T>());
  }

  put<T>(path: string, body?: unknown): Observable<T> {
    return this.http.put<ApiResponse<T>>(`${this.base}${path}`, body ?? {}).pipe(this.unwrap<T>());
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http.patch<ApiResponse<T>>(`${this.base}${path}`, body ?? {}).pipe(this.unwrap<T>());
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(`${this.base}${path}`).pipe(this.unwrap<T>());
  }
}
