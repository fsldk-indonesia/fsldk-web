import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RapimnasIndexPresenter } from './rapimnas.index.presenter';
import { RapimnasRepository } from '../../repositories/rapimnas.repository';
import { RapimnasIndexView } from './rapimnas.index.view';
import { RapimnasPublic } from '../../entities/rapimnas';

describe('RapimnasIndexPresenter', () => {
  let presenter: RapimnasIndexPresenter;
  let repo: jasmine.SpyObj<RapimnasRepository>;
  let view: jasmine.SpyObj<RapimnasIndexView>;

  const sample = { heroBadgeText: 'Diponegoro\'s Spirit', galleryImages: [], homeCards: [] } as unknown as RapimnasPublic;

  beforeEach(() => {
    repo = jasmine.createSpyObj('RapimnasRepository', ['getPublic']);
    TestBed.configureTestingModule({
      providers: [RapimnasIndexPresenter, { provide: RapimnasRepository, useValue: repo }],
    });
    presenter = TestBed.inject(RapimnasIndexPresenter);
    view = jasmine.createSpyObj('RapimnasIndexView', ['setData', 'setLoading']);
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
