import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RapimnasCmsSetupPresenter } from './rapimnas.cms-setup.presenter';
import { RapimnasRepository } from '../../repositories/rapimnas.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { RapimnasCmsSetupView } from './rapimnas.cms-setup.view';
import { RapimnasCms, RapimnasUpdatePayload } from '../../entities/rapimnas';

describe('RapimnasCmsSetupPresenter', () => {
  let presenter: RapimnasCmsSetupPresenter;
  let repo: jasmine.SpyObj<RapimnasRepository>;
  let toast: jasmine.SpyObj<ToastService>;
  let view: jasmine.SpyObj<RapimnasCmsSetupView>;

  const sample = {
    heroBadgeText: 'Diponegoro\'s Spirit', homeCards: [{ iconKey: 'star', title: 'Sidang Pleno', description: '...', sortOrder: 0 }],
    updatedDate: '2026-10-06', updatedBy: 'Super Admin',
  } as unknown as RapimnasCms;

  beforeEach(() => {
    repo = jasmine.createSpyObj('RapimnasRepository', ['get', 'update']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    TestBed.configureTestingModule({
      providers: [
        RapimnasCmsSetupPresenter,
        { provide: RapimnasRepository, useValue: repo },
        { provide: ToastService, useValue: toast },
      ],
    });
    presenter = TestBed.inject(RapimnasCmsSetupPresenter);
    view = jasmine.createSpyObj('RapimnasCmsSetupView', ['setForm', 'setLoading', 'setSaving']);
    presenter.attachView(view);
  });

  it('load() populates the view and clears loading on success', () => {
    repo.get.and.returnValue(of(sample));
    presenter.load();
    expect(view.setLoading).toHaveBeenCalledWith(true);
    expect(view.setForm).toHaveBeenCalledWith(sample);
    expect(view.setLoading).toHaveBeenCalledWith(false);
  });

  it('load() clears loading even when the request fails', () => {
    repo.get.and.returnValue(throwError(() => new Error('network')));
    presenter.load();
    expect(view.setForm).not.toHaveBeenCalled();
    expect(view.setLoading).toHaveBeenCalledWith(false);
  });

  it('save() sends an edited field AND an edited repeater item through unchanged, then shows a success toast and refreshes the form', () => {
    repo.update.and.returnValue(of(sample));
    const editedPayload = {
      heroBadgeText: 'Tema Baru Rapimnas 2026', // edited scalar field
      homeCards: [{ iconKey: 'star', title: 'Sidang Pleno (Revisi)', description: 'Deskripsi diperbarui', sortOrder: 0 }], // edited repeater item
    } as unknown as RapimnasUpdatePayload;

    presenter.save(editedPayload);

    expect(view.setSaving).toHaveBeenCalledWith(true);
    expect(repo.update).toHaveBeenCalledWith(editedPayload);
    expect(toast.success).toHaveBeenCalled();
    expect(view.setForm).toHaveBeenCalledWith(sample);
    expect(view.setSaving).toHaveBeenCalledWith(false);
  });

  it('save() clears saving without a success toast when the request fails', () => {
    repo.update.and.returnValue(throwError(() => new Error('network')));
    presenter.save({} as RapimnasUpdatePayload);
    expect(toast.success).not.toHaveBeenCalled();
    expect(view.setSaving).toHaveBeenCalledWith(false);
  });
});
