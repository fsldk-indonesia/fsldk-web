import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/entities/api-response';
import { Pagination } from '../../../core/entities/pagination';
import { Structure, StructureCreateReq, StructureUpdateReq } from '../entities/structure';

@Injectable({ providedIn: 'root' })
export class StructureApiService {
  private http = inject(HttpClient);
  private apiBase = environment.apiBaseUrl;

  listPublic(): Observable<ApiResponse<Structure[]>> {
    return this.http.get<ApiResponse<Structure[]>>(`${this.apiBase}/public/structures`);
  }

  listCMS(params: HttpParams): Observable<ApiResponse<Pagination<Structure>>> {
    return this.http.get<ApiResponse<Pagination<Structure>>>(`${this.apiBase}/structures`, { params });
  }

  getByID(id: number): Observable<ApiResponse<Structure>> {
    return this.http.get<ApiResponse<Structure>>(`${this.apiBase}/structures/${id}`);
  }

  create(req: StructureCreateReq): Observable<ApiResponse<{ structureID: number }>> {
    return this.http.post<ApiResponse<{ structureID: number }>>(`${this.apiBase}/structures`, req);
  }

  update(id: number, req: StructureUpdateReq): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.apiBase}/structures/${id}`, req);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiBase}/structures/${id}`);
  }
}
