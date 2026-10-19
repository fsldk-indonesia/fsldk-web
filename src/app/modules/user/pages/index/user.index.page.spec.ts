import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthRepository } from '../../repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { UserRepository } from '../../repositories/user.repository';
import { RoleRepository } from '../../../role/repositories/role.repository';
import { OrganizationRepository } from '../../../organization/repositories/organization.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { UserRow } from '../../entities/user';
import { UserIndexPage } from './user.index.page';

describe('UserIndexPage', () => {
  let component: UserIndexPage;

  const sampleRow: UserRow = {
    userID: 7, fullName: 'Budi', email: 'budi@example.com', roleID: 1, role: 'Super Admin',
    emailVerified: false, isActive: true, hasGoogle: false, hasPassword: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UserIndexPage],
      providers: [
        { provide: AuthRepository, useValue: { user: signal(null), hasPermission: () => true } },
        { provide: AlertService, useValue: jasmine.createSpyObj('AlertService', ['confirm']) },
        { provide: UserRepository, useValue: jasmine.createSpyObj('UserRepository', ['list', 'create', 'update']) },
        { provide: RoleRepository, useValue: jasmine.createSpyObj('RoleRepository', ['list']) },
        { provide: OrganizationRepository, useValue: jasmine.createSpyObj('OrganizationRepository', ['list']) },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
      ],
    });
    const fixture = TestBed.createComponent(UserIndexPage);
    component = fixture.componentInstance;
  });

  it('openCreate() defaults emailVerified to true (bypass verification — current behavior unchanged)', () => {
    component.openCreate();
    expect(component.form.emailVerified).toBeTrue();
  });

  it('openEdit() populates emailVerified from the row', () => {
    component.openEdit({ ...sampleRow, emailVerified: false });
    expect(component.form.emailVerified).toBeFalse();
  });

  it('openView() populates emailVerified from the row', () => {
    component.openView({ ...sampleRow, emailVerified: true });
    expect(component.form.emailVerified).toBeTrue();
  });
});
