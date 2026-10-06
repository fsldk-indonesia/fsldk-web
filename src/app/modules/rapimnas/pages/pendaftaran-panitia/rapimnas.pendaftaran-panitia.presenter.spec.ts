import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RapimnasPendaftaranPanitiaPresenter } from './rapimnas.pendaftaran-panitia.presenter';
import { RapimnasRepository } from '../../repositories/rapimnas.repository';
import { RapimnasPendaftaranPanitiaView } from './rapimnas.pendaftaran-panitia.view';
import { RapimnasPublic } from '../../entities/rapimnas';

describe('RapimnasPendaftaranPanitiaPresenter', () => {
  let presenter: RapimnasPendaftaranPanitiaPresenter;
  let repo: jasmine.SpyObj<RapimnasRepository>;
  let view: jasmine.SpyObj<RapimnasPendaftaranPanitiaView>;

  const sample = { panitiaIsOpen: true, panitiaClosedMessage: '' } as unknown as RapimnasPublic;

  beforeEach(() => {
    repo = jasmine.createSpyObj('RapimnasRepository', ['getPublic']);
    TestBed.configureTestingModule({
      providers: [RapimnasPendaftaranPanitiaPresenter, { provide: RapimnasRepository, useValue: repo }],
    });
    presenter = TestBed.inject(RapimnasPendaftaranPanitiaPresenter);
    view = jasmine.createSpyObj('RapimnasPendaftaranPanitiaView', ['setData', 'setLoading']);
    presenter.attachView(view);
  });

  it('load() populates the view and clears loading on success', () => {
    repo.getPublic.and.returnValue(of(sample));
    presenter.load();
    expect(view.setLoading).toHaveBeenCalledWith(true);
    expect(view.setData).toHaveBeenCalledWith(sample);
    expect(view.setLoading).toHaveBeenCalledWith(false);
  });

  it('load() clears loading even when the request fails', () => {
    repo.getPublic.and.returnValue(throwError(() => new Error('network')));
    presenter.load();
    expect(view.setData).not.toHaveBeenCalled();
    expect(view.setLoading).toHaveBeenCalledWith(false);
  });
});
