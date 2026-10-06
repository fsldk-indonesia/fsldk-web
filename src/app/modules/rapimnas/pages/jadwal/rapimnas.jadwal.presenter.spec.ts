import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RapimnasJadwalPresenter } from './rapimnas.jadwal.presenter';
import { RapimnasRepository } from '../../repositories/rapimnas.repository';
import { RapimnasJadwalView } from './rapimnas.jadwal.view';
import { RapimnasPublic } from '../../entities/rapimnas';

describe('RapimnasJadwalPresenter', () => {
  let presenter: RapimnasJadwalPresenter;
  let repo: jasmine.SpyObj<RapimnasRepository>;
  let view: jasmine.SpyObj<RapimnasJadwalView>;

  const sample = { jadwalHeaderSubtitle: 'Rangkaian acara...', rundownDays: [] } as unknown as RapimnasPublic;

  beforeEach(() => {
    repo = jasmine.createSpyObj('RapimnasRepository', ['getPublic']);
    TestBed.configureTestingModule({
      providers: [RapimnasJadwalPresenter, { provide: RapimnasRepository, useValue: repo }],
    });
    presenter = TestBed.inject(RapimnasJadwalPresenter);
    view = jasmine.createSpyObj('RapimnasJadwalView', ['setData', 'setLoading']);
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
