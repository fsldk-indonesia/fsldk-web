import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SubmissionForm, SubmissionFormDetail, FormVersionDetail, FormVersionSummary } from '../entities/submission-form';

/** Panggilan HTTP mentah untuk form builder (/submission-forms). */
@Injectable({ providedIn: 'root' })
export class SubmissionFormApiService {
  private api = inject(ApiService);

  listForms(): Observable<SubmissionForm[]> { return this.api.get('/submission-forms'); }
  createForm(body: unknown): Observable<SubmissionForm> { return this.api.post('/submission-forms', body); }
  getForm(formID: number): Observable<SubmissionFormDetail> { return this.api.get(`/submission-forms/${formID}`); }

  createVersion(formID: number, body: unknown): Observable<FormVersionSummary> { return this.api.post(`/submission-forms/${formID}/versions`, body); }
  getVersion(versionID: number): Observable<FormVersionDetail> { return this.api.get(`/submission-forms/versions/${versionID}`); }
  publishVersion(versionID: number): Observable<FormVersionSummary> { return this.api.post(`/submission-forms/versions/${versionID}/publish`); }
  getPublishedByFormCode(formCode: string): Observable<FormVersionDetail> { return this.api.get(`/submission-forms/by-code/${formCode}/published`); }

  createSection(versionID: number, body: unknown): Observable<unknown> { return this.api.post(`/submission-forms/versions/${versionID}/sections`, body); }
  updateSection(sectionID: number, body: unknown): Observable<unknown> { return this.api.put(`/submission-forms/sections/${sectionID}`, body); }
  deleteSection(sectionID: number): Observable<unknown> { return this.api.delete(`/submission-forms/sections/${sectionID}`); }

  createField(sectionID: number, body: unknown): Observable<unknown> { return this.api.post(`/submission-forms/sections/${sectionID}/fields`, body); }
  updateField(fieldID: number, body: unknown): Observable<unknown> { return this.api.put(`/submission-forms/fields/${fieldID}`, body); }
  deleteField(fieldID: number): Observable<unknown> { return this.api.delete(`/submission-forms/fields/${fieldID}`); }

  createOption(fieldID: number, body: unknown): Observable<unknown> { return this.api.post(`/submission-forms/fields/${fieldID}/options`, body); }
  updateOption(optionID: number, body: unknown): Observable<unknown> { return this.api.put(`/submission-forms/options/${optionID}`, body); }
  deleteOption(optionID: number): Observable<unknown> { return this.api.delete(`/submission-forms/options/${optionID}`); }
}
