import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PengurusIndexPresenter } from './pengurus.index.presenter';
import { PengurusRepository } from '../../repositories/pengurus.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { PengurusIndexView } from './pengurus.index.view';
import { PengurusEntry } from '../../entities/pengurus';

describe('PengurusIndexPresenter', () => {
  let presenter: PengurusIndexPresenter;
  let repo: jasmine.SpyObj<PengurusRepository>;
  let toast: jasmine.SpyObj<ToastService>;
  let view: jasmine.SpyObj<PengurusIndexView>;

  const sample: PengurusEntry[] = [
    { userID: 1, fullName: 'Budi', email: 'budi@example.com', roleName: 'Kader', homeOrganizationID: 10, homeOrganizationName: 'LDK Syahid' },
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
});
