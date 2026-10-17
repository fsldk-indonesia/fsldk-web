import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';
import { UserRepository } from '../../repositories/user.repository';
import { RoleRepository } from '../../../role/repositories/role.repository';
import { OrganizationRepository } from '../../../organization/repositories/organization.repository';
import { UserRow } from '../../entities/user';
import { UserFormValue, UserIndexPresenter } from './user.index.presenter';
import { UserIndexView } from './user.index.view';

describe('UserIndexPresenter', () => {
  let presenter: UserIndexPresenter;
  let userRepo: jasmine.SpyObj<UserRepository>;
  let toast: jasmine.SpyObj<ToastService>;
  let view: jasmine.SpyObj<UserIndexView>;

  const sampleRow: UserRow = {
    userID: 7, fullName: 'Budi', email: 'budi@example.com', roleID: 1, role: 'Super Admin',
    emailVerified: true, isActive: true, hasGoogle: false, hasPassword: true,
  };

  const sampleForm: UserFormValue = {
    fullName: 'Budi', email: 'budi@example.com', password: '', roleID: 1, isActive: true,
    organizationID: null, wildcardTierAccess: [], emailVerified: true,
  };

  beforeEach(() => {
    userRepo = jasmine.createSpyObj('UserRepository', ['create', 'update']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    TestBed.configureTestingModule({
      providers: [
        UserIndexPresenter,
        { provide: UserRepository, useValue: userRepo },
        { provide: RoleRepository, useValue: jasmine.createSpyObj('RoleRepository', ['list']) },
        { provide: OrganizationRepository, useValue: jasmine.createSpyObj('OrganizationRepository', ['list']) },
        { provide: ToastService, useValue: toast },
      ],
    });
    presenter = TestBed.inject(UserIndexPresenter);
    view = jasmine.createSpyObj('UserIndexView', ['setSaving', 'onSaveSuccess']);
    presenter.attachView(view);
  });

  it('save(null, form) sends emailVerified in the create payload', () => {
    userRepo.create.and.returnValue(of(sampleRow));

    presenter.save(null, sampleForm);

    expect(userRepo.create).toHaveBeenCalledWith(jasmine.objectContaining({ emailVerified: true }));
    expect(toast.success).toHaveBeenCalled();
    expect(view.onSaveSuccess).toHaveBeenCalled();
  });

  it('save(editId, form) sends emailVerified in the update payload', () => {
    userRepo.update.and.returnValue(of(sampleRow));

    presenter.save(7, { ...sampleForm, emailVerified: false });

    expect(userRepo.update).toHaveBeenCalledWith(7, jasmine.objectContaining({ emailVerified: false }));
    expect(toast.success).toHaveBeenCalled();
    expect(view.onSaveSuccess).toHaveBeenCalled();
  });
});
