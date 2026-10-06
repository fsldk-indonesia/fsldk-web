import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RapimnasPendaftaranPesertaPresenter } from './rapimnas.pendaftaran-peserta.presenter';
import { RapimnasRepository } from '../../repositories/rapimnas.repository';
import { RapimnasPendaftaranPesertaView } from './rapimnas.pendaftaran-peserta.view';
import { RapimnasPublic } from '../../entities/rapimnas';

describe('RapimnasPendaftaranPesertaPresenter', () => {
  let presenter: RapimnasPendaftaranPesertaPresenter;
  let repo: jasmine.SpyObj<RapimnasRepository>;
  let view: jasmine.SpyObj<RapimnasPendaftaranPesertaView>;

  const sample = { pickupLocations: [], contacts: [] } as unknown as RapimnasPublic;

  beforeEach(() => {
    repo = jasmine.createSpyObj('RapimnasRepository', ['getPublic']);
    TestBed.configureTestingModule({
      providers: [RapimnasPendaftaranPesertaPresenter, { provide: RapimnasRepository, useValue: repo }],
    });
    presenter = TestBed.inject(RapimnasPendaftaranPesertaPresenter);
    view = jasmine.createSpyObj('RapimnasPendaftaranPesertaView', ['setData', 'setLoading']);
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
