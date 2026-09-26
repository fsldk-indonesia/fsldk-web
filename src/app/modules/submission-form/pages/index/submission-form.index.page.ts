import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { PopupOrigin, popupOriginFromEvent } from '../../../../core/utils/popup-origin';
import { IconComponent } from '../../../../shared/icon.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { SubmissionForm } from '../../entities/submission-form';
import { submissionFormPath } from '../../submission-form.path';
import { FormFormValue, SubmissionFormIndexPresenter } from './submission-form.index.presenter';
import { SubmissionFormIndexView } from './submission-form.index.view';

@Component({
  selector: 'app-submission-form-index-page',
  standalone: true,
  templateUrl: './submission-form.index.page.html',
  imports: [FormsModule, IconComponent, ModalBackdropDirective, PaginationComponent],
  providers: [SubmissionFormIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }

    /* Kotak cari nama/kode form — murni filter client-side (lihat
       filteredForms()), sama pola visual .role-search di RoleIndexPage
       (input + ikon kaca pembesar menyatu dalam satu kotak). */
    .form-search {
      position: relative; display: flex; align-items: stretch;
      border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: #fff;
      transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
    }
    .form-search:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .form-search input { flex: 1; min-width: 0; border: none; background: transparent; padding: 12px 14px; font-size: .95rem; font-family: var(--font-body); }
    .form-search input:focus { outline: none; }
    .form-search-btn { display: flex; align-items: center; justify-content: center; width: 40px; flex-shrink: 0; border: none; background: transparent; color: var(--color-muted); cursor: pointer; transition: color var(--motion-fast) ease; }
    .form-search-btn:hover { color: var(--color-primary-dark); }
    .form-search:focus-within .form-search-btn { color: var(--color-primary); }

    /* Selalu di-render (bukan @if) supaya transisi TUTUP juga kelihatan —
       pola sama persis seperti popup Pengguna (lihat catatan panjang di sana). */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
      opacity: 0; visibility: hidden; pointer-events: none;
      transition: opacity var(--motion-slow) var(--ease-out), visibility 0s linear var(--motion-slow);
    }
    .modal-backdrop.open {
      opacity: 1; visibility: visible; pointer-events: auto;
      transition: opacity var(--motion-slow) var(--ease-out), visibility 0s linear 0s;
    }
    /* Buka/tutup modal digerakkan lewat Web Animations API (lihat
       animateModal()), bukan CSS transition — pola & alasan sama persis
       seperti popup Pengguna (lihat catatan panjang di sana). */
    .modal.modal-pop {
      background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 460px; max-height: 86vh; display: flex; flex-direction: column;
      animation: none; opacity: 0; transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(.25);
    }
    .modal.modal-pop.open { opacity: 1; transform: none; }
    @media (prefers-reduced-motion: reduce) { .modal-backdrop { transition: none; } }
    .modal > h3 { flex-shrink: 0; margin-bottom: 2px; }
    .modal > p.text-muted { flex-shrink: 0; margin: 0 0 18px; font-size: .85rem; }
    /* Panel abu-abu (background tint + inset shadow atas-bawah) yang
       membungkus section .field-card — pola sama persis dengan modal
       Pengguna (lihat user.index.page.ts .modal-body). */
    .modal-body {
      flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 18px;
      border-radius: var(--radius-xs); background: var(--color-bg-alt);
      box-shadow: inset 0 8px 10px -8px rgba(20,23,26,.14), inset 0 -8px 10px -8px rgba(20,23,26,.14);
    }
    .modal-footer { flex-shrink: 0; display: flex; justify-content: flex-end; gap: 10px; padding-top: 18px; margin-top: 4px; border-top: 1px solid var(--color-border); }
    .form-section-group + .form-section-group { margin-top: 0; }
    .field-card { display: flex; flex-direction: column; gap: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: #fff; padding: 16px; }
    .field-card .form-group { margin-bottom: 0; }
    .grid-2 > .card { display: flex; flex-direction: column; }
    .card-footer { margin-top: auto; padding-top: 16px; }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 12px;
      font-family: var(--font-heading); font-weight: 700; font-size: .72rem;
      letter-spacing: .07em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    /* .form-section-label juga dipakai sebagai judul kartu form di grid (title
       case, bukan uppercase kecil) — override khusus konteks itu saja. */
    .card .form-section-label {
      margin: 0; text-transform: none; letter-spacing: normal; font-size: .95rem; color: var(--color-text);
    }
    /* Baris label/nilai read-only di popup Detail Form. */
    .view-row { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
    .view-row + .view-row { margin-top: 2px; }
    .view-label { color: var(--color-muted); font-size: .85rem; flex-shrink: 0; }
    .view-value { text-align: right; font-size: .92rem; }
  `],
})
export class SubmissionFormIndexPage implements OnInit, SubmissionFormIndexView {
  private presenter = inject(SubmissionFormIndexPresenter);
  private auth = inject(AuthRepository);
  private router = inject(Router);

  @ViewChild('createModalEl') private createModalEl?: ElementRef<HTMLElement>;
  @ViewChild('viewModalEl') private viewModalEl?: ElementRef<HTMLElement>;
  private createModalAnimation: Animation | null = null;
  private viewModalAnimation: Animation | null = null;

  forms = signal<SubmissionForm[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  popupOrigin = signal<PopupOrigin>({ dx: 0, dy: 0 });
  form: FormFormValue = { formCode: '', formName: '', description: '' };
  canManage = this.auth.hasPermission('submission_form.manage');

  // Pencarian & pagination murni client-side — submissionFormRepo.listForms()
  // selalu mengembalikan SEMUA form sekaligus (datanya kecil, hanya beberapa
  // form bawaan Levelisasi LDK/Sensus Kader), jadi cukup difilter & di-slice
  // di sini, tidak perlu roundtrip server maupun ubah presenter/repository.
  search = '';
  page = signal(1);
  readonly limit = 6;

  // Klik kartu (di luar tombol "Buka Form Builder", lihat template) membuka
  // popup detail baca-saja — TIDAK lagi navigasi langsung ke Form Builder.
  showView = signal(false);
  viewingForm = signal<SubmissionForm | null>(null);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.loading.set(true);
    this.presenter.loadForms();
  }

  openCreate(event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.form = { formCode: '', formName: '', description: '' };
    this.showForm.set(true);
    this.animateModal(this.createModalEl, this.createModalAnimation, true, (a) => this.createModalAnimation = a);
  }
  close(): void {
    this.animateModal(this.createModalEl, this.createModalAnimation, false, (a) => this.createModalAnimation = a);
    this.showForm.set(false);
  }
  save(): void { this.presenter.save(this.form); }

  /** Buka/tutup modal digerakkan lewat Web Animations API — pola & alasan
   *  sama persis seperti popup Pengguna (lihat catatan panjang di sana).
   *  Dipakai bersama oleh KEDUA modal di halaman ini (Tambah Form & Detail
   *  Form) — tiap pemanggil mengoper ElementRef/Animation/setter miliknya
   *  sendiri karena masing-masing modal punya state animasi terpisah. */
  private animateModal(
    elRef: ElementRef<HTMLElement> | undefined,
    current: Animation | null,
    opening: boolean,
    setAnimation: (a: Animation | null) => void,
  ): void {
    const el = elRef?.nativeElement;
    if (!el) return;
    current?.cancel();
    const { dx, dy } = this.popupOrigin();
    const closed: Keyframe = { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(0.25)` };
    const open: Keyframe = { opacity: 1, transform: 'none' };
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const anim = el.animate(opening ? [closed, open] : [open, closed], {
      duration: reduceMotion ? 1 : 250,
      easing: 'cubic-bezier(.16, 1, .3, 1)',
      fill: 'forwards',
    });
    setAnimation(anim);
    anim.onfinish = () => {
      anim.cancel();
      setAnimation(null);
    };
  }

  /** Navigasi nyata ke Form Builder — HANYA dipicu tombol "Buka Form
   *  Builder" di dalam kartu (yang men-stopPropagation supaya tidak ikut
   *  membuka popup detail di bawahnya). */
  open(f: SubmissionForm): void { this.router.navigateByUrl(submissionFormPath.builder(f.formID)); }

  filteredForms(): SubmissionForm[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.forms();
    return this.forms().filter((f) => f.formName.toLowerCase().includes(q) || f.formCode.toLowerCase().includes(q));
  }
  pagedForms(): SubmissionForm[] {
    const start = (this.page() - 1) * this.limit;
    return this.filteredForms().slice(start, start + this.limit);
  }
  onSearchChange(): void { this.page.set(1); }
  applySearch(): void { this.page.set(1); }
  goPage(p: number): void { this.page.set(p); }

  // Dipicu klik kartu — beda dari open(), popup ini murni tampilan (tanpa
  // field editable, footer hanya "Tutup").
  openView(f: SubmissionForm, event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.viewingForm.set(f);
    this.showView.set(true);
    this.animateModal(this.viewModalEl, this.viewModalAnimation, true, (a) => this.viewModalAnimation = a);
  }
  closeView(): void {
    this.animateModal(this.viewModalEl, this.viewModalAnimation, false, (a) => this.viewModalAnimation = a);
    this.showView.set(false);
  }

  setForms(forms: SubmissionForm[]): void {
    this.forms.set(forms);
    this.loading.set(false);
    // Jaga-jaga: kalau hasil filter/pencarian berkurang sehingga total
    // halaman menyusut, turunkan page() ke halaman valid terakhir alih-alih
    // menampilkan grid kosong padahal masih ada data di halaman sebelumnya.
    const totalPages = Math.max(1, Math.ceil(this.filteredForms().length / this.limit));
    if (this.page() > totalPages) this.page.set(totalPages);
  }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  onSaveSuccess(): void { this.close(); this.loading.set(true); this.presenter.loadForms(); }
}
