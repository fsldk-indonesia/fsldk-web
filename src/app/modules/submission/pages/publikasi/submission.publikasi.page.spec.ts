import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SubmissionRepository } from '../../repositories/submission.repository';
import { SubmissionFormRepository } from '../../../submission-form/repositories/submission-form.repository';
import { OrgContextService } from '../../../../core/services/org-context.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AlertService } from '../../../../core/services/alert.service';
import { SubmissionPublikasiPage } from './submission.publikasi.page';

describe('SubmissionPublikasiPage', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [SubmissionPublikasiPage],
      providers: [
        provideRouter([]),
        { provide: SubmissionRepository, useValue: { listByStatus: () => of({ page: 1, limit: 50, count: 0, data: [], prev: '', next: '' }) } },
        { provide: SubmissionFormRepository, useValue: { getPublishedByFormCode: () => of(null) } },
        { provide: OrgContextService, useValue: { organizationID$: () => of(undefined) } },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error', 'info', 'warning']) },
        { provide: AlertService, useValue: jasmine.createSpyObj('AlertService', ['confirm']) },
      ],
    });
    const fixture = TestBed.createComponent(SubmissionPublikasiPage);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('builds search options from the queue, combining org name and parent org name', () => {
    const { component } = setup();
    component.queue.set([
      { submissionID: 3, formID: 1, formCode: 'LEVELISASI_LDK', formVersionID: 1, organizationID: 404, organizationName: 'LDK Syahid', parentOrganizationName: 'Banten Raya', subjectType: 'ORGANIZATION', status: 'PUBLISHED', version: 1, createdDate: '2026-10-24T00:00:00Z' },
    ]);
    component.orgNames.set({ 404: 'LDK Syahid' });

    expect(component.queueSearchOptions()).toEqual([
      { value: 3, label: 'LDK Syahid — Banten Raya' },
    ]);
  });

  const itemA = { submissionID: 3, formID: 1, formCode: 'LEVELISASI_LDK', formVersionID: 1, organizationID: 404, organizationName: 'LDK Syahid', parentOrganizationName: 'Banten Raya', subjectType: 'ORGANIZATION' as const, status: 'PUBLISHED', version: 1, createdDate: '2026-10-24T00:00:00Z' };
  const itemB = { submissionID: 4, formID: 1, formCode: 'LEVELISASI_LDK', formVersionID: 1, organizationID: 405, organizationName: 'LDK Abror', parentOrganizationName: 'Banten Raya', subjectType: 'ORGANIZATION' as const, status: 'LEVEL_ESTABLISHED', version: 1, createdDate: '2026-10-24T00:00:00Z' };

  it('shows every queue item when no filter is selected', () => {
    const { component } = setup();
    component.queue.set([itemA, itemB]);
    component.queueFilter = [];

    expect(component.filteredQueue()).toEqual([itemA, itemB]);
  });

  it('narrows the queue to only the submissionIDs checked in the filter', () => {
    const { component } = setup();
    component.queue.set([itemA, itemB]);
    component.queueFilter = [4];

    expect(component.filteredQueue()).toEqual([itemB]);
  });
});
