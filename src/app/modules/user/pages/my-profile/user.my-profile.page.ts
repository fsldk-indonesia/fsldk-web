import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../repositories/auth.repository';
import { PasswordFieldComponent } from '../../../../shared/password-field.component';
import { PhoneInputComponent } from '../../../../shared/phone-input.component';
import { IconComponent } from '../../../../shared/icon.component';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { PageHeroComponent } from '../../../../shared/page-hero.component';
import { PopupModalComponent } from '../../../../shared/popup-modal.component';
import { KaderInfo } from '../../../submission/entities/submission';
import { UserMyProfilePresenter } from './user.my-profile.presenter';
import { UserMyProfileView } from './user.my-profile.view';

@Component({
  selector: 'app-user-my-profile-page',
  standalone: true,
  templateUrl: './user.my-profile.page.html',
  imports: [FormsModule, DatePipe, PasswordFieldComponent, PhoneInputComponent, IconComponent, ImageUploadComponent, PageHeroComponent, PopupModalComponent],
  providers: [UserMyProfilePresenter],
  styles: [`
    /* ---------- Siluet hero: kartu identitas + badge centang ----------
       Kartu "tumbuh" dulu (scale+fade dari bawah, pola sama dengan
       .gallery-cam-group), badge centang pop-in menyusul dengan delay, lalu
       titik sudut (.id-card-tier) muncul terakhir — urutan animasi yang sama
       dipakai Galeri/Struktur, komposisi ilustrasinya sendiri. */
    .hero-id-illustration { position: relative; width: 100%; }
    .id-illustration-svg { position: relative; z-index: 1; width: 100%; height: 240px; overflow: visible; }

    .id-card-group {
      transform-box: fill-box; transform-origin: 50% 100%; opacity: 0;
      animation: profileCardGrow .9s cubic-bezier(.34,1.4,.64,1) forwards;
      filter: drop-shadow(0 10px 18px rgba(0,147,59,.18));
    }
    @keyframes profileCardGrow { from { opacity: 0; transform: scale(.75) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

    .id-card-badge { opacity: 0; transform-box: fill-box; animation: profileBadgePop .5s var(--ease-out) .5s forwards; }
    @keyframes profileBadgePop { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: scale(1); } }

    .id-card-tier { opacity: 0; animation: profileTierFadeIn .4s ease-out .9s forwards; }
    @keyframes profileTierFadeIn { from { opacity: 0; } to { opacity: 1; } }

    @media (prefers-reduced-motion: reduce) {
      .id-card-group, .id-card-badge, .id-card-tier { animation: none; opacity: 1; transform: none; }
    }

    /* ---------- Kanvas setelah hero — sama persis dengan Galeri/Struktur
       (.section + .section-transition + .section-blob-drift). ---------- */
    .section { background: var(--color-primary-tint); position: relative; min-height: 60vh; }
    .section-transition { position: relative; padding-top: 48px; }
    .section-blob-drift { overflow: hidden; }
    .section-blob-drift > .container { position: relative; z-index: 1; }
    .section-blob-drift::before {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 55% 55% at 88% 42%, var(--color-gold-soft) 0%, var(--color-primary-soft) 42%, transparent 75%),
        radial-gradient(ellipse 50% 50% at 10% 62%, var(--color-primary-soft) 0%, var(--color-gold-soft) 45%, transparent 75%);
      opacity: .8; animation: sectionBlobDrift 12s ease-in-out infinite alternate;
    }
    .section-blob-drift::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: linear-gradient(to bottom,
        var(--color-primary-tint) 0, transparent 70px,
        transparent calc(100% - 70px), var(--color-primary-tint) 100%);
    }
    @keyframes sectionBlobDrift {
      from { transform: translate(0, 0) scale(1); }
      to { transform: translate(-4%, 5%) scale(1.15); }
    }
    @media (prefers-reduced-motion: reduce) {
      .section-blob-drift::before { animation: none; }
    }

    /* ---------- Grid 2 kolom: identitas (kiri, sticky) + kartu info/kontak/
       keamanan (kanan, 1fr). ---------- */
    /* profile-side SENGAJA tidak sticky — dicoba sebelumnya (position:sticky;
       top:100px), tapi begitu di-scroll kartu ini "tertinggal" 100px dari
       puncak viewport sementara kartu Kontak di sebelahnya (tidak sticky)
       terus scroll normal ke atas, jadi kedua kolom kelihatan tidak sejajar.
       Statis + align-items:start sudah cukup supaya kedua kolom selalu rata
       di baris grid yang sama, apa pun posisi scroll-nya. */
    .profile-grid { display: grid; grid-template-columns: minmax(260px, 320px) 1fr; gap: 24px; align-items: start; }
    .profile-main { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
    @media (max-width: 860px) {
      .profile-grid { grid-template-columns: 1fr; }
    }

    /* ---------- Kartu Identitas ala "ID card" ----------
       Banner gradient di atas + avatar besar menumpang di atasnya (bukan
       avatar kecil sebaris seperti sebelumnya) supaya kartu ini punya
       identitas visual sendiri, beda dari kartu form di kolom kanan. */
    .profile-id-card { padding: 0; overflow: hidden; }
    .id-card-banner {
      height: 72px; background: linear-gradient(135deg, var(--color-primary-bright), var(--color-primary-dark));
      position: relative;
    }
    .id-card-avatar-wrap { position: absolute; left: 24px; bottom: -34px; }
    .id-card-avatar {
      width: 84px; height: 84px; border-radius: var(--radius-full); border: 4px solid #fff;
      background: var(--color-primary-soft); color: var(--color-primary-dark);
      display: inline-flex; align-items: center; justify-content: center;
      font-weight: 700; font-family: var(--font-heading); font-size: 1.5rem; box-shadow: var(--shadow-sm);
    }
    .id-card-avatar.id-card-avatar-initials { display: flex; }
    img.id-card-avatar { object-fit: cover; }
    .id-card-avatar-edit {
      position: absolute; right: -2px; bottom: -2px; width: 28px; height: 28px; border-radius: var(--radius-full);
      background: var(--color-gold); color: #fff; border: 2px solid #fff; display: flex; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: var(--shadow-sm);
      transition: transform var(--motion-fast) var(--ease-out), background var(--motion-fast) ease;
    }
    .id-card-avatar-edit:hover { transform: scale(1.08); background: var(--color-gold-dark); }
    .id-card-body { padding: 46px 24px 24px; }
    .id-card-name { margin: 0 0 2px; }
    .id-card-email { margin: 0 0 14px; color: var(--color-muted); font-size: .86rem; word-break: break-all; }
    .id-card-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .id-card-chips .chip { cursor: default; font-size: .76rem; padding: 5px 12px; gap: 6px; }

    /* Tombol teks eksplisit "Ubah Foto Profil" — selain badge pensil kecil
       di atas avatar, supaya aksi ganti foto tetap jelas terlihat & tidak
       cuma bergantung pada ikon kecil yang mudah terlewat. */
    .id-card-change-photo-btn {
      display: inline-flex; align-items: center; gap: 6px; margin-top: 14px;
      background: none; border: none; padding: 0; cursor: pointer;
      font-size: .82rem; font-weight: 700; color: var(--color-primary-dark);
      transition: color var(--motion-fast) ease;
    }
    .id-card-change-photo-btn:hover { color: var(--color-gold-dark); text-decoration: underline; }

    /* ---------- Header seragam untuk kartu kanan (ikon + judul + deskripsi
       singkat), dipakai Info Kekaderan/Kontak/Keamanan — SEKARANG berupa pita
       warna penuh (gradient tint -> putih) yang menutupi lebar kartu, BUKAN
       lagi garis tipis border-top 3px. Garis tipis di atas kartu putih polos
       terasa seperti "ditempel", warnanya cuma kelihatan di satu sisi super
       sempit; pita penuh ini membuat aksen warnanya benar-benar terasa jadi
       bagian desain kartu (echo dari banner gradient Kartu Identitas),
       bukan dekorasi tipis yang gampang terlewat/terlihat asal tempel. ---------- */
    .profile-kader-card, .profile-form-card { overflow: hidden; }
    .profile-card-head { display: flex; align-items: flex-start; gap: 14px; padding: 20px 24px; border-bottom: 1px solid var(--color-border); }
    .profile-card-head.head-primary { background: linear-gradient(135deg, var(--color-primary-soft) 0%, #fff 100%); }
    .profile-card-head.head-ember { background: linear-gradient(135deg, var(--color-ember-soft) 0%, #fff 100%); }
    .profile-card-head.head-gold { background: linear-gradient(135deg, var(--color-gold-soft) 0%, #fff 100%); }
    .profile-card-head-text { flex: 1; min-width: 0; }
    .profile-card-head-text h3 { margin: 0 0 2px; }
    .profile-card-head-text p.text-muted { margin: 0; font-size: .86rem; }
    .profile-card-body { padding: 24px; }

    /* ---------- Kartu Info Kekaderan — aksen emas, baris readonly ala
       "sheet-meta-row" (ikon + label + value) alih-alih <input readonly>,
       supaya terasa seperti kartu keanggotaan/badge, bukan form biasa. ---------- */
    .kader-code-badge {
      flex-shrink: 0; font-family: var(--font-heading); font-weight: 800; font-size: .76rem; letter-spacing: .04em;
      background: var(--color-gold-soft); color: var(--color-gold-dark); padding: 5px 12px; border-radius: var(--radius-full);
      align-self: flex-start;
    }
    .kader-meta-rows { display: flex; flex-direction: column; gap: 14px; }
    .kader-meta-row { display: flex; align-items: flex-start; gap: 10px; }
    .kader-meta-icon {
      display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; flex-shrink: 0;
      border-radius: 8px; background: var(--color-gold-soft); color: var(--color-gold-dark);
    }
    .kader-meta-text { display: flex; flex-direction: column; min-width: 0; }
    .kader-meta-label { font-size: .66rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--color-muted); }
    .kader-meta-value { font-size: .9rem; font-weight: 600; color: var(--color-text); }

    .security-hint { margin: -6px 0 18px; display: flex; align-items: center; gap: 6px; }

    .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; }
    @media (max-width: 640px) { .grid-cols-2 { grid-template-columns: 1fr; } }

    /* ---------- Bottom sheet ubah foto ---------- */
    .photo-sheet { text-align: center; }
    .photo-sheet-icon { margin: 0 auto 14px; }
    .photo-sheet-title { margin: 0 0 8px; }
    .photo-sheet-desc { margin: 0 0 20px; color: var(--color-text-secondary); font-size: .88rem; line-height: 1.6; }
    .photo-sheet app-image-upload { display: block; text-align: left; }
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

  sheetOpen = signal(false);

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

  openPhotoSheet(): void {
    this.sheetOpen.set(true);
  }

  closePhotoSheet(): void {
    this.sheetOpen.set(false);
  }

  onPhotoChange(url: string): void {
    this.presenter.updatePhoto(url);
    this.sheetOpen.set(false);
  }

  setSaving(saving: boolean): void { this.saving.set(saving); }
  onChangePasswordSuccess(): void { this.oldPassword = ''; this.newPassword = ''; }
  setKader(kader: KaderInfo | null): void { this.kader.set(kader); }
  setContactSaving(saving: boolean): void { this.contactSaving.set(saving); }
  setPhotoSaving(saving: boolean): void { this.photoSaving.set(saving); }
}
