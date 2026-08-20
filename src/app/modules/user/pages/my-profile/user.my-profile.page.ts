import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../repositories/auth.repository';
import { PasswordFieldComponent } from '../../../../shared/password-field.component';
import { IconComponent } from '../../../../shared/icon.component';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { KaderInfo } from '../../../submission/entities/submission';
import { UserMyProfilePresenter } from './user.my-profile.presenter';
import { UserMyProfileView } from './user.my-profile.view';

@Component({
  selector: 'app-user-my-profile-page',
  standalone: true,
  imports: [FormsModule, PasswordFieldComponent, IconComponent, ImageUploadComponent],
  providers: [UserMyProfilePresenter],
  template: `
    <div class="page-head">
      <h1>Profil Saya</h1>
      <p class="text-muted">Kelola identitas akun & kata sandi Anda.</p>
    </div>

    <div class="card card-pad profile-card">
      <div class="identity-row">
        @if (auth.user()?.photoURL) {
          <img class="avatar" [src]="auth.user()?.photoURL" alt="" referrerpolicy="no-referrer">
        } @else {
          <span class="avatar">{{ initials() }}</span>
        }
        <div>
          <h3 style="margin-bottom:2px">{{ auth.user()?.fullName }}</h3>
          <p class="text-muted" style="margin:0">{{ auth.user()?.email }}</p>
        </div>
      </div>

      <div class="form-group photo-upload">
        <label class="form-label">
          Foto Profil
          @if (photoSaving()) { <span class="spinner spinner-xs"></span> }
        </label>
        <app-image-upload [value]="auth.user()?.photoURL ?? null" (valueChange)="onPhotoChange($event)" />
        <p class="form-hint">Kalau tidak diunggah, otomatis pakai foto akun Google Anda (bila ada) — kalau tidak ada juga, tampil inisial huruf seperti di atas.</p>
      </div>
    </div>

    @if (kader(); as k) {
      @if (k.status === 'ACTIVE') {
        <div class="card card-pad profile-card" style="margin-top:16px">
          <h3 style="display:flex;align-items:center;gap:8px"><app-icon name="id-card" [size]="16" /> Info Kekaderan</h3>
          <div class="grid-cols-2">
            <div class="form-group"><label class="form-label">Nama LDK</label>
              <input class="form-control" [value]="k.organizationName ?? '—'" readonly></div>
            <div class="form-group"><label class="form-label">Nama Puskomda</label>
              <input class="form-control" [value]="k.parentOrganizationName ?? '—'" readonly></div>
          </div>
        </div>
      }
    }

    <div class="card card-pad profile-card" style="margin-top:16px">
      <h3 style="display:flex;align-items:center;gap:8px"><app-icon name="phone" [size]="16" /> Kontak</h3>
      <form (ngSubmit)="submitContact()">
        <div class="grid-cols-2">
          <div class="form-group"><label class="form-label">No Whatsapp</label>
            <input class="form-control" name="phoneNumber" [(ngModel)]="phoneNumber" placeholder="08xxxxxxxxxx"></div>
          <div class="form-group"><label class="form-label">Alamat</label>
            <textarea class="form-control" name="address" rows="1" [(ngModel)]="address" placeholder="Alamat domisili"></textarea></div>
        </div>
        <button class="btn btn-primary" type="submit" [disabled]="contactSaving()">
          @if (contactSaving()) { <span class="spinner"></span> } @else { Simpan Kontak }
        </button>
      </form>
    </div>

    <div class="card card-pad profile-card" style="margin-top:16px">
      <h3 style="display:flex;align-items:center;gap:8px"><app-icon name="lock" [size]="16" /> Ubah Kata Sandi</h3>
      <form (ngSubmit)="submit()">
        <div class="grid-cols-2">
          <div class="form-group"><label class="form-label">Kata Sandi Lama</label>
            <app-password-field name="old" [(ngModel)]="oldPassword" placeholder="Kata sandi saat ini" /></div>
          <div class="form-group"><label class="form-label">Kata Sandi Baru</label>
            <app-password-field name="new" [(ngModel)]="newPassword" placeholder="Minimal 8 karakter" /></div>
        </div>
        <button class="btn btn-primary" type="submit" [disabled]="saving()">
          @if (saving()) { <span class="spinner"></span> } @else { Simpan Kata Sandi }
        </button>
      </form>
    </div>
  `,
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    /* Diperlebar dari 520px — sebelumnya card terlalu sempit & rata kiri,
       menyisakan banyak ruang kosong di kanan pada layar lebar. */
    .profile-card { max-width: 720px; }
    .identity-row { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
    .avatar { width: 52px; height: 52px; border-radius: var(--radius-full); background: var(--color-primary-soft); color: var(--color-primary-dark); display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-family: var(--font-heading); flex-shrink: 0; font-size: 1.1rem; }
    img.avatar { object-fit: cover; }
    .photo-upload app-image-upload { max-width: 320px; display: block; }
    .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; }
    @media (max-width: 640px) { .grid-cols-2 { grid-template-columns: 1fr; } }
  `],
})
export class UserMyProfilePage implements OnInit, UserMyProfileView {
  private presenter = inject(UserMyProfilePresenter);
  auth = inject(AuthRepository);

  oldPassword = '';
  newPassword = '';
  saving = signal(false);

  phoneNumber = this.auth.user()?.phoneNumber ?? '';
  address = this.auth.user()?.address ?? '';
  contactSaving = signal(false);
  photoSaving = signal(false);

  kader = signal<KaderInfo | null>(null);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadKaderInfo();
  }

  initials(): string {
    const name = this.auth.user()?.fullName ?? '';
    return name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  }

  submit(): void {
    if (!this.oldPassword || !this.newPassword) return;
    this.presenter.changePassword(this.oldPassword, this.newPassword);
  }

  submitContact(): void {
    this.presenter.updateContact(this.phoneNumber.trim(), this.address.trim());
  }

  onPhotoChange(url: string): void {
    this.presenter.updatePhoto(url);
  }

  setSaving(saving: boolean): void { this.saving.set(saving); }
  onChangePasswordSuccess(): void { this.oldPassword = ''; this.newPassword = ''; }
  setKader(kader: KaderInfo | null): void { this.kader.set(kader); }
  setContactSaving(saving: boolean): void { this.contactSaving.set(saving); }
  setPhotoSaving(saving: boolean): void { this.photoSaving.set(saving); }
}
