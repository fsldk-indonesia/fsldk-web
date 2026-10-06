import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RapimnasTentangPresenter } from './rapimnas.tentang.presenter';
import { RapimnasRepository } from '../../repositories/rapimnas.repository';
import { RapimnasTentangView } from './rapimnas.tentang.view';
import { RapimnasPublic } from '../../entities/rapimnas';

describe('RapimnasTentangPresenter', () => {
  let presenter: RapimnasTentangPresenter;
  let repo: jasmine.SpyObj<RapimnasRepository>;
  let view: jasmine.SpyObj<RapimnasTentangView>;

  const sample = { tentangMisi: ['Misi 1'], tentangTujuan: [], tentangKegiatan: [] } as unknown as RapimnasPublic;

  beforeEach(() => {
    repo = jasmine.createSpyObj('RapimnasRepository', ['getPublic']);
    TestBed.configureTestingModule({
      providers: [RapimnasTentangPresenter, { provide: RapimnasRepository, useValue: repo }],
    });
    presenter = TestBed.inject(RapimnasTentangPresenter);
    view = jasmine.createSpyObj('RapimnasTentangView', ['setData', 'setLoading']);
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
