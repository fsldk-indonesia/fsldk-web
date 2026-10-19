import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let component: LoginPage;
  let router: Router;

  function mount(returnUrl: string | null): void {
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}) } } },
        { provide: AuthRepository, useValue: jasmine.createSpyObj('AuthRepository', ['login', 'loginGoogle', 'defaultCmsPath']) },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error', 'info']) },
      ],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    component = TestBed.createComponent(LoginPage).componentInstance;
  }

  it('navigateAfterLogin() goes straight to a CMS dashboard cmsPath, ignoring returnUrl', () => {
    mount('/some/previous-page');
    component.navigateAfterLogin('/cms/dashboard');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cms/dashboard');
  });

  it('navigateAfterLogin() goes straight to Portal Kader for a Kader-role cmsPath, ignoring returnUrl', () => {
    mount('/some/previous-page');
    component.navigateAfterLogin('/kader/ringkasan');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/kader/ringkasan');
  });

  it('navigateAfterLogin() falls back to returnUrl when there is no cmsPath (e.g. Pengunjung)', () => {
    mount('/some/previous-page');
    component.navigateAfterLogin(null);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/some/previous-page');
  });

  it('navigateAfterLogin() falls back to home when neither cmsPath nor returnUrl exist', () => {
    mount(null);
    component.navigateAfterLogin(null);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});
