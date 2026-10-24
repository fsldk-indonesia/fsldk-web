import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SubmissionRepository } from '../../repositories/submission.repository';
import { KaderRepository } from '../../repositories/kader.repository';
import { SubmissionFormRepository } from '../../../submission-form/repositories/submission-form.repository';
import { OrgContextService } from '../../../../core/services/org-context.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AlertService } from '../../../../core/services/alert.service';
import { SubmissionKaderPersetujuanPage } from './submission.kader-persetujuan.page';

describe('SubmissionKaderPersetujuanPage', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [SubmissionKaderPersetujuanPage],
      providers: [
        provideRouter([]),
        { provide: SubmissionRepository, useValue: {} },
        { provide: KaderRepository, useValue: { list: () => of({ page: 1, limit: 50, count: 0, data: [], prev: '', next: '' }) } },
        { provide: SubmissionFormRepository, useValue: { getPublishedByFormCode: () => of(null) } },
        { provide: OrgContextService, useValue: { organizationID$: () => of(undefined) } },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error', 'info', 'warning']) },
        { provide: AlertService, useValue: jasmine.createSpyObj('AlertService', ['confirm']) },
      ],
    });
    const fixture = TestBed.createComponent(SubmissionKaderPersetujuanPage);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('builds search options from the pending list, combining full name and parent org name', () => {
    const { component } = setup();
    component.pending.set([
      { kaderID: 10, submissionID: 5, organizationID: 402, parentOrganizationName: 'Banten Raya', fullName: 'Budi Santoso', status: 'PENDING' },
    ]);

    expect(component.queueSearchOptions()).toEqual([
      { value: 5, label: 'Budi Santoso — Banten Raya' },
    ]);
  });

  const kaderA = { kaderID: 10, submissionID: 5, organizationID: 402, parentOrganizationName: 'Banten Raya', fullName: 'Budi Santoso', status: 'PENDING' };
  const kaderB = { kaderID: 11, submissionID: 6, organizationID: 402, parentOrganizationName: 'Banten Raya', fullName: 'Citra Dewi', status: 'PENDING' };

  it('shows every pending item when no filter is selected', () => {
    const { component } = setup();
    component.pending.set([kaderA, kaderB]);
    component.queueFilter = [];

    expect(component.filteredQueue()).toEqual([kaderA, kaderB]);
  });

  it('narrows the pending list to only the submissionIDs checked in the filter', () => {
    const { component } = setup();
    component.pending.set([kaderA, kaderB]);
    component.queueFilter = [6];

    expect(component.filteredQueue()).toEqual([kaderB]);
  });
});
