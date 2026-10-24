import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { SubmissionRepository } from '../../repositories/submission.repository';
import { SubmissionFormRepository } from '../../../submission-form/repositories/submission-form.repository';
import { OrgContextService } from '../../../../core/services/org-context.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SubmissionReviewQueuePage } from './submission.review-queue.page';

describe('SubmissionReviewQueuePage', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [SubmissionReviewQueuePage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { title: 'Verifikasi', reviewTier: 'PUSKOMDA', statuses: ['SUBMITTED'] } } } },
        { provide: SubmissionRepository, useValue: { listByStatus: () => of({ page: 1, limit: 50, count: 0, data: [], prev: '', next: '' }) } },
        { provide: SubmissionFormRepository, useValue: { getPublishedByFormCode: () => of(null) } },
        { provide: OrgContextService, useValue: { organizationID$: () => of(undefined) } },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error', 'info', 'warning']) },
      ],
    });
    const fixture = TestBed.createComponent(SubmissionReviewQueuePage);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  const itemA = { submissionID: 1, formID: 1, formCode: 'LEVELISASI_LDK', formVersionID: 1, organizationID: 404, organizationName: 'LDK Syahid', parentOrganizationName: 'Banten Raya', subjectType: 'ORGANIZATION' as const, status: 'SUBMITTED', version: 1, createdDate: '2026-10-24T00:00:00Z' };
  const itemB = { submissionID: 2, formID: 1, formCode: 'LEVELISASI_LDK', formVersionID: 1, organizationID: 405, organizationName: 'LDK Abror', parentOrganizationName: 'Banten Raya', subjectType: 'ORGANIZATION' as const, status: 'SUBMITTED', version: 1, createdDate: '2026-10-24T00:00:00Z' };

  it('builds search options from the queue, combining org name and parent org name', () => {
    const { component } = setup();
    component.queue.set([itemA]);
    component.orgNames.set({ 404: 'LDK Syahid' });

    expect(component.queueSearchOptions()).toEqual([
      { value: 1, label: 'LDK Syahid — Banten Raya' },
    ]);
  });

  it('shows every queue item when no filter is selected', () => {
    const { component } = setup();
    component.queue.set([itemA, itemB]);
    component.queueFilter = [];

    expect(component.filteredQueue()).toEqual([itemA, itemB]);
  });

  it('narrows the queue to only the submissionIDs checked in the filter', () => {
    const { component } = setup();
    component.queue.set([itemA, itemB]);
    component.queueFilter = [2];

    expect(component.filteredQueue()).toEqual([itemB]);
  });
});
