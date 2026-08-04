import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface UploadResult {
  url: string;
}

/** Panggilan HTTP mentah untuk unggah berkas (/uploads/image, /uploads/document), dipakai bersama oleh form Artikel & Berita. */
@Injectable({ providedIn: 'root' })
export class UploadService {
  private api = inject(ApiService);

  uploadImage(file: Blob, filename?: string): Observable<UploadResult> {
    const formData = new FormData();
    if (filename) formData.append('image', file, filename);
    else formData.append('image', file);
    return this.api.post<UploadResult>('/uploads/image', formData);
  }

  uploadDocument(file: File): Observable<UploadResult> {
    const formData = new FormData();
    formData.append('document', file);
    return this.api.post<UploadResult>('/uploads/document', formData);
  }
}
