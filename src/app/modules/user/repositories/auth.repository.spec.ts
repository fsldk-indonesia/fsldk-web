import { TestBed } from '@angular/core/testing';
import { AuthApiService } from '../services/auth-api.service';
import { AuthSessionService } from '../services/auth-session.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserProfile } from '../entities/user';
import { AuthRepository } from './auth.repository';

describe('AuthRepository', () => {
  let repo: AuthRepository;

  function profile(overrides: Partial<UserProfile>): UserProfile {
    return {
      userID: 1, fullName: 'Test User', email: 'test@example.com', emailVerified: true,
      role: 'Pengunjung', permissions: [],
      ...overrides,
    };
  }

  beforeEach(() => {
    const session = jasmine.createSpyObj('AuthSessionService', ['loadUser']);
    session.loadUser.and.returnValue(null);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApiService, useValue: jasmine.createSpyObj('AuthApiService', ['login']) },
        { provide: AuthSessionService, useValue: session },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'info']) },
      ],
    });
    repo = TestBed.inject(AuthRepository);
  });

  it('defaultCmsPath() does not route Pengunjung to Portal Kader (falls back to null / home)', () => {
    repo.user.set(profile({ role: 'Pengunjung', permissions: ['submission.create'] }));
    expect(repo.defaultCmsPath()).toBeNull();
  });

  it('defaultCmsPath() still routes Kader to Portal Kader', () => {
    repo.user.set(profile({ role: 'Kader', permissions: ['submission.create'] }));
    expect(repo.defaultCmsPath()).toBe('/kader/ringkasan');
  });

  it('defaultCmsPath() routes an account with CMS tier access to its dashboard regardless of role', () => {
    repo.user.set(profile({ role: 'Super Admin', permissions: ['role.view'] }));
    expect(repo.defaultCmsPath()).toBe('/cms/dashboard');
  });
});
