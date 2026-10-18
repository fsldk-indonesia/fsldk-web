import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PengurusIndexPresenter } from './pengurus.index.presenter';
import { PengurusRepository } from '../../repositories/pengurus.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { PengurusIndexView } from './pengurus.index.view';
import { PengurusEntry } from '../../entities/pengurus';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';

describe('PengurusIndexPresenter', () => {
  let presenter: PengurusIndexPresenter;
  let repo: jasmine.SpyObj<PengurusRepository>;
  let toast: jasmine.SpyObj<ToastService>;
  let view: jasmine.SpyObj<PengurusIndexView>;

  const sample: PengurusEntry[] = [
    { userID: 1, fullName: 'Budi', email: 'budi@example.com', roleName: 'Kader', homeOrganizationID: 10, homeOrganizationName: 'LDK Syahid', puskomdaName: 'Puskomda Jabar' },
  ];

  beforeEach(() => {
    repo = jasmine.createSpyObj('PengurusRepository', ['list', 'updateRole']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);

    TestBed.configureTestingModule({
      providers: [
        PengurusIndexPresenter,
        { provide: PengurusRepository, useValue: repo },
        { provide: ToastService, useValue: toast },
      ],
    });
    presenter = TestBed.inject(PengurusIndexPresenter);
    view = jasmine.createSpyObj('PengurusIndexView', ['setItems', 'setLoading', 'setBusy']);
    presenter.attachView(view);
  });

  it('loadAll() populates the view and clears loading on success', () => {
    repo.list.and.returnValue(of(sample));

    presenter.loadAll();

    expect(view.setLoading).toHaveBeenCalledWith(true);
    expect(view.setItems).toHaveBeenCalledWith(sample);
    expect(view.setLoading).toHaveBeenCalledWith(false);
  });

  it('loadAll() clears loading even when the request fails', () => {
    repo.list.and.returnValue(throwError(() => new Error('network')));

    presenter.loadAll();

    expect(view.setItems).not.toHaveBeenCalled();
    expect(view.setLoading).toHaveBeenCalledWith(false);
  });

  it('updateRole() marks the row busy, shows a success toast, and reloads the list on success', () => {
    repo.updateRole.and.returnValue(of(sample[0]));
    repo.list.and.returnValue(of(sample));

    presenter.updateRole(1, 'LDK Admin');

    expect(view.setBusy).toHaveBeenCalledWith(1);
    expect(repo.updateRole).toHaveBeenCalledWith(1, 'LDK Admin');
    expect(toast.success).toHaveBeenCalled();
    expect(repo.list).toHaveBeenCalled();
    expect(view.setBusy).toHaveBeenCalledWith(null);
  });

  it('updateRole() clears busy without a success toast when the request fails', () => {
    repo.updateRole.and.returnValue(throwError(() => new Error('network')));

    presenter.updateRole(1, 'LDK Admin');

    expect(toast.success).not.toHaveBeenCalled();
    expect(view.setBusy).toHaveBeenCalledWith(null);
  });

  describe('list() / paginate() — the <app-cms-index> dataSource adapter', () => {
    const roster: PengurusEntry[] = [
      { userID: 1, fullName: 'Budi', email: 'budi@example.com', roleName: 'Kader', homeOrganizationID: 10, homeOrganizationName: 'LDK Syahid', puskomdaName: 'Puskomda Jabar' },
      { userID: 2, fullName: 'Citra', email: 'citra@example.com', roleName: 'LDK Admin', homeOrganizationID: 11, homeOrganizationName: 'LDK Binus', puskomdaName: 'Puskomda Jakarta' },
      { userID: 3, fullName: 'Andi', email: 'andi@example.com', roleName: 'Puskomda Verifikator', homeOrganizationID: 10, homeOrganizationName: 'LDK Syahid', puskomdaName: 'Puskomda Jabar' },
    ];

    const baseParams: CmsListParams = { page: 1, limit: 10, sort: 'fullName', status: [], dateFrom: '', dateTo: '', filters: {} };

    it('with no filters, returns every item sorted ascending by the given key', (done) => {
      repo.list.and.returnValue(of(roster));

      presenter.list(baseParams).subscribe((result) => {
        expect(result.count).toBe(3);
        expect(result.data.map((i) => i.fullName)).toEqual(['Andi', 'Budi', 'Citra']);
        done();
      });
    });

    it('sorts descending when the sort key is prefixed with "-"', (done) => {
      repo.list.and.returnValue(of(roster));

      presenter.list({ ...baseParams, sort: '-fullName' }).subscribe((result) => {
        expect(result.data.map((i) => i.fullName)).toEqual(['Citra', 'Budi', 'Andi']);
        done();
      });
    });

    it('filters by the "name" search target (case-insensitive substring)', (done) => {
      repo.list.and.returnValue(of(roster));

      presenter.list({ ...baseParams, filters: { name: ['bud'] } }).subscribe((result) => {
        expect(result.data.map((i) => i.userID)).toEqual([1]);
        done();
      });
    });

    it('filters by the "role" combobox target, matching any of multiple selected roles', (done) => {
      repo.list.and.returnValue(of(roster));

      presenter.list({ ...baseParams, filters: { role: ['LDK Admin', 'Puskomda Verifikator'] } }).subscribe((result) => {
        expect(result.data.map((i) => i.userID).sort()).toEqual([2, 3]);
        done();
      });
    });

    it('combines multiple active filters with AND, not OR', (done) => {
      repo.list.and.returnValue(of(roster));

      presenter.list({ ...baseParams, filters: { name: ['di'], role: ['Kader'] } }).subscribe((result) => {
        // "di" matches Budi/Andi by fullName substring, but role=Kader only
        // matches Budi -- AND of both must leave just Budi.
        expect(result.data.map((i) => i.userID)).toEqual([1]);
        done();
      });
    });

    it('paginates: page 2 with limit 2 returns only the remaining item and the true total count', (done) => {
      repo.list.and.returnValue(of(roster));

      presenter.list({ ...baseParams, page: 2, limit: 2 }).subscribe((result) => {
        expect(result.count).toBe(3); // total after filtering, not just this page's size
        expect(result.data.length).toBe(1);
        expect(result.page).toBe(2);
        expect(result.limit).toBe(2);
        done();
      });
    });

    it('a page past the end of the filtered results returns an empty page, not an error', (done) => {
      repo.list.and.returnValue(of(roster));

      presenter.list({ ...baseParams, page: 99, limit: 10 }).subscribe((result) => {
        expect(result.data).toEqual([]);
        expect(result.count).toBe(3);
        done();
      });
    });

    it('passes the organizationID through to the repository (org-switcher support)', () => {
      repo.list.and.returnValue(of(roster));

      presenter.list(baseParams, 42).subscribe();

      expect(repo.list).toHaveBeenCalledWith(42);
    });
  });

  describe('roleSearchOptions()', () => {
    it('maps a role catalog to combobox options with matching id/label', (done) => {
      presenter.roleSearchOptions([{ value: 'Kader', label: 'Kader' }, { value: 'LDK Admin', label: 'LDK Admin' }]).subscribe((options) => {
        expect(options).toEqual([{ id: 'Kader', label: 'Kader' }, { id: 'LDK Admin', label: 'LDK Admin' }]);
        done();
      });
    });
  });
});
