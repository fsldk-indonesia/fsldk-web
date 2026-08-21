import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SubmissionFormApiService } from '../services/submission-form-api.service';
import { SubmissionForm, SubmissionFormDetail, FormVersionDetail, FormVersionSummary } from '../entities/submission-form';

@Injectable({ providedIn: 'root' })
export class SubmissionFormRepository {
  private api = inject(SubmissionFormApiService);

  listForms(): Observable<SubmissionForm[]> { return this.api.listForms(); }
  createForm(body: unknown): Observable<SubmissionForm> { return this.api.createForm(body); }
  getForm(formID: number): Observable<SubmissionFormDetail> { return this.api.getForm(formID); }

  createVersion(formID: number, cloneFromVersionID: number | null): Observable<FormVersionSummary> {
    return this.api.createVersion(formID, { cloneFromVersionID });
  }
  getVersion(versionID: number): Observable<FormVersionDetail> { return this.api.getVersion(versionID); }
  publishVersion(versionID: number): Observable<FormVersionSummary> { return this.api.publishVersion(versionID); }
  getPublishedByFormCode(formCode: string): Observable<FormVersionDetail> { return this.api.getPublishedByFormCode(formCode); }

  createSection(versionID: number, body: unknown): Observable<unknown> { return this.api.createSection(versionID, body); }
  updateSection(sectionID: number, body: unknown): Observable<unknown> { return this.api.updateSection(sectionID, body); }
  deleteSection(sectionID: number): Observable<unknown> { return this.api.deleteSection(sectionID); }

  createField(sectionID: number, body: unknown): Observable<unknown> { return this.api.createField(sectionID, body); }
  updateField(fieldID: number, body: unknown): Observable<unknown> { return this.api.updateField(fieldID, body); }
  deleteField(fieldID: number): Observable<unknown> { return this.api.deleteField(fieldID); }

  createOption(fieldID: number, body: unknown): Observable<unknown> { return this.api.createOption(fieldID, body); }
  updateOption(optionID: number, body: unknown): Observable<unknown> { return this.api.updateOption(optionID, body); }
  deleteOption(optionID: number): Observable<unknown> { return this.api.deleteOption(optionID); }
}
