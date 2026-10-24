import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { SubmissionRepository } from '../../repositories/submission.repository';
import { SubmissionFormRepository } from '../../../submission-form/repositories/submission-form.repository';
import { OrganizationRepository } from '../../../organization/repositories/organization.repository';
import { OrgContextService } from '../../../../core/services/org-context.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SubmissionReviewQueuePresenter } from './submission.review-queue.presenter';
import { SubmissionReviewQueueView } from './submission.review-queue.view';

describe('SubmissionReviewQueuePresenter', () => {
  // Reproduksi bug nyata (2026-10-24): LDK Syahid (organizationID 404, induk
  // Puskomda "Banten Raya") mengisi Pendataan dengan benar, tapi antrian
  // Verifikasi & Persetujuan Puskomda tetap menampilkannya sebagai
  // "Organisasi #404" dan tidak berpindah saat org-switcher diganti.
  //
  // Dua akar masalah, dikonfirmasi lewat DB lokal (590 organisasi total,
  // "LDK Syahid" di urutan alfabetis ke-343):
  // 1. loadQueue() tidak pernah membaca OrgContextService.organizationID$()
  //    dan tidak meneruskannya ke submissionRepo.listByStatus — berbeda dari
  //    sibling SubmissionKaderPersetujuanPresenter yang sudah benar. Backend
  //    (resolveScopedOrganizationIDs) sudah siap menerimanya.
  // 2. orgNames dibangun dari organizationRepo.list({limit:200}) terurut
  //    alfabetis — organisasi di luar 200 teratas (seperti LDK Syahid)
  //    hilang dari lookup, padahal setiap item queue SUDAH membawa
  //    organizationName-nya sendiri dari backend (LEFT JOIN per baris).
  const fakeItem = { submissionID: 22, formID: 1, formCode: 'LEVELISASI_LDK', formVersionID: 1, organizationID: 404, organizationName: 'LDK Syahid', subjectType: 'ORGANIZATION' as const, status: 'SUBMITTED', version: 1, createdDate: '2026-10-24T10:28:19Z' };

  function setup(resolvedOrgID: number | undefined) {
    const listByStatusSpy = jasmine.createSpy('listByStatus').and.returnValue(
      of({ page: 1, limit: 50, count: 1, data: [fakeItem], prev: '', next: '' }),
    );
    const orgListSpy = jasmine.createSpy('orgList').and.returnValue(of({ page: 1, limit: 200, count: 0, data: [], prev: '', next: '' }));

    TestBed.configureTestingModule({
      providers: [
        SubmissionReviewQueuePresenter,
        { provide: SubmissionRepository, useValue: { listByStatus: listByStatusSpy } },
        { provide: SubmissionFormRepository, useValue: { getPublishedByFormCode: () => of(null) } },
        { provide: OrganizationRepository, useValue: { list: orgListSpy } },
        { provide: OrgContextService, useValue: { organizationID$: () => of(resolvedOrgID) } },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error', 'info', 'warning']) },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { tier: 'PUSKOMDA' } }, queryParamMap: of(convertToParamMap({})) } },
      ],
    });
    const presenter = TestBed.inject(SubmissionReviewQueuePresenter);
    const view: SubmissionReviewQueueView = {
      setQueue: jasmine.createSpy('setQueue'),
      setOrgNames: jasmine.createSpy('setOrgNames'),
      setVersion: jasmine.createSpy('setVersion'),
      setDetail: jasmine.createSpy('setDetail'),
      setLoading: jasmine.createSpy('setLoading'),
      setBusy: jasmine.createSpy('setBusy'),
      onDecisionSuccess: jasmine.createSpy('onDecisionSuccess'),
    };
    presenter.attachView(view);
    return { presenter, view, listByStatusSpy, orgListSpy };
  }

  it('forwards the org-switcher organizationID to listByStatus instead of ignoring it', () => {
    const { presenter, listByStatusSpy } = setup(63);
    presenter.loadQueue(['SUBMITTED']);
    expect(listByStatusSpy).toHaveBeenCalledWith('LEVELISASI_LDK', 'SUBMITTED', 63);
  });

  it('builds orgNames from the queue items themselves, not from a separate capped org list fetch', () => {
    const { presenter, view, orgListSpy } = setup(63);
    presenter.loadQueue(['SUBMITTED']);
    expect(orgListSpy).not.toHaveBeenCalled();
    expect(view.setOrgNames).toHaveBeenCalledWith({ 404: 'LDK Syahid' });
  });
});
