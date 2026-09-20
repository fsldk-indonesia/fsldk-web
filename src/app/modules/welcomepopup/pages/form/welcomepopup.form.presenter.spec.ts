import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { WelcomepopupFormPresenter } from './welcomepopup.form.presenter';
import { WelcomepopupRepository } from '../../repositories/welcomepopup.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { WelcomepopupFormView } from './welcomepopup.form.view';
import { WelcomePopup } from '../../entities/welcome-popup';

describe('WelcomepopupFormPresenter', () => {
  let presenter: WelcomepopupFormPresenter;
  let repo: jasmine.SpyObj<WelcomepopupRepository>;
  let toast: jasmine.SpyObj<ToastService>;
  let view: jasmine.SpyObj<WelcomepopupFormView>;

  const sample: WelcomePopup = { isEnabled: true, htmlContent: '<div>hi</div>', jsContent: 'run();', cssContent: 'body{}' };

  beforeEach(() => {
    repo = jasmine.createSpyObj('WelcomepopupRepository', ['get', 'update']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);

    TestBed.configureTestingModule({
      providers: [
        WelcomepopupFormPresenter,
        { provide: WelcomepopupRepository, useValue: repo },
        { provide: ToastService, useValue: toast },
      ],
    });
    presenter = TestBed.inject(WelcomepopupFormPresenter);
    view = jasmine.createSpyObj('WelcomepopupFormView', ['setForm', 'setLoading', 'setSaving']);
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

  it('save() shows a success toast and refreshes the form on success', () => {
    repo.update.and.returnValue(of(sample));

    presenter.save({ isEnabled: true, htmlContent: sample.htmlContent, jsContent: sample.jsContent, cssContent: sample.cssContent });

    expect(view.setSaving).toHaveBeenCalledWith(true);
    expect(toast.success).toHaveBeenCalled();
    expect(view.setForm).toHaveBeenCalledWith(sample);
    expect(view.setSaving).toHaveBeenCalledWith(false);
  });

  it('save() clears saving without a success toast when the request fails', () => {
    repo.update.and.returnValue(throwError(() => new Error('network')));

    presenter.save({ isEnabled: true, htmlContent: '', jsContent: '', cssContent: '' });

    expect(toast.success).not.toHaveBeenCalled();
    expect(view.setSaving).toHaveBeenCalledWith(false);
  });
});
