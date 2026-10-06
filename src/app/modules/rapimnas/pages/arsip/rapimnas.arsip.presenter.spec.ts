import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RapimnasArsipPresenter } from './rapimnas.arsip.presenter';
import { RapimnasRepository } from '../../repositories/rapimnas.repository';
import { RapimnasArsipView } from './rapimnas.arsip.view';
import { RapimnasPublic } from '../../entities/rapimnas';

describe('RapimnasArsipPresenter', () => {
  let presenter: RapimnasArsipPresenter;
  let repo: jasmine.SpyObj<RapimnasRepository>;
  let view: jasmine.SpyObj<RapimnasArsipView>;

  const sample = { resources: [] } as unknown as RapimnasPublic;

  beforeEach(() => {
    repo = jasmine.createSpyObj('RapimnasRepository', ['getPublic']);
    TestBed.configureTestingModule({
      providers: [RapimnasArsipPresenter, { provide: RapimnasRepository, useValue: repo }],
    });
    presenter = TestBed.inject(RapimnasArsipPresenter);
    view = jasmine.createSpyObj('RapimnasArsipView', ['setData', 'setLoading']);
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
