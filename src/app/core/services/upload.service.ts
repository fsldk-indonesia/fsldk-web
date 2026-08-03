import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface UploadResult {
  url: string;
}

/** Panggilan HTTP mentah untuk unggah berkas gambar (/uploads/image), dipakai bersama oleh form Artikel & Berita. */
@Injectable({ providedIn: 'root' })
export class UploadService {
  private api = inject(ApiService);

  uploadImage(file: File): Observable<UploadResult> {
    const formData = new FormData();
    formData.append('image', file);
    return this.api.post<UploadResult>('/uploads/image', formData);
  }
}
