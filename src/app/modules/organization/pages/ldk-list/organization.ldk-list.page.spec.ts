import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { signal } from '@angular/core';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { ToastService } from '../../../../core/services/toast.service';
import { WilayahService } from '../../../../core/services/wilayah.service';
import { OrganizationRepository } from '../../repositories/organization.repository';
import { Pagination } from '../../../../core/entities/pagination';
import { Organization } from '../../entities/organization';
import { OrganizationLdkListPage } from './organization.ldk-list.page';

describe('OrganizationLdkListPage', () => {
  const emptyPage: Pagination<Organization> = { page: 1, limit: 10, count: 0, data: [], prev: '', next: '' };

  function setup(initialOrgID: string) {
    const queryParamMap$ = new BehaviorSubject(convertToParamMap({ organizationID: initialOrgID }));
    const listSpy = jasmine.createSpy('list').and.returnValue(of(emptyPage));

    TestBed.configureTestingModule({
      imports: [OrganizationLdkListPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: {} }, queryParamMap: queryParamMap$ } },
        { provide: AuthRepository, useValue: { user: signal(null), hasPermission: () => true } },
        { provide: AlertService, useValue: jasmine.createSpyObj('AlertService', ['confirm']) },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
        { provide: WilayahService, useValue: {} },
        { provide: OrganizationRepository, useValue: { list: listSpy } },
      ],
    });
    const fixture = TestBed.createComponent(OrganizationLdkListPage);
    fixture.detectChanges();
    return { fixture, queryParamMap$, listSpy };
  }

  it('refetches the LDK table when the org-switcher selects a different Puskomda', () => {
    const { queryParamMap$, listSpy } = setup('16');
    listSpy.calls.reset();

    queryParamMap$.next(convertToParamMap({ organizationID: '17' }));

    expect(listSpy).toHaveBeenCalled();
  });
});
