import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { ToastService } from '../../../../core/services/toast.service';
import {
  LombaKategori,
  RapimnasLombaSetting,
  RapimnasLombaUpdatePayload,
} from '../../entities/rapimnas-lomba';
import { RapimnasLombaApiService } from '../../services/rapimnas-lomba-api.service';

@Component({
  selector: 'app-rapimnas-cms-lomba-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './rapimnas.cms-lomba.page.html',
  styleUrls: ['./rapimnas.cms-lomba.page.css'],
})
export class RapimnasCmsLombaPage implements OnInit {
  private readonly api = inject(RapimnasLombaApiService);
  private readonly auth = inject(AuthRepository);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly updatedDate = signal<string | null>(null);
  readonly canManage = this.auth.hasPermission('rapimnas.lomba.manage');

  data: RapimnasLombaUpdatePayload | null = null;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getCMS().subscribe({
      next: (response) => {
        this.data = this.toForm(response);
        this.updatedDate.set(response.updatedDate);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Data lomba gagal dimuat. Periksa koneksi, login, dan hak akses.');
        this.loading.set(false);
      },
    });
  }

  private toForm(value: RapimnasLombaSetting): RapimnasLombaUpdatePayload {
    // Normalisasi kolom TEXT NULL agar tidak mengirim null pada payload PUT.
    return {
      namaKegiatan: value.namaKegiatan ?? '',
      deskripsi: value.deskripsi ?? '',
      benefit: [...(value.benefit ?? [])],
      persyaratanUmum: [...(value.persyaratanUmum ?? [])],
      daftarKategori: (value.daftarKategori ?? []).map((item) => ({
        namaKategori: item.namaKategori ?? '',
        temaKategori: item.temaKategori ?? '',
        tipePeserta: item.tipePeserta ?? '',
        biayaPendaftaran: item.biayaPendaftaran ?? '',
        alurPendaftaran: [...(item.alurPendaftaran ?? [])],
        timeline: (item.timeline ?? []).map((line) => ({ ...line })),
      })),
      linkGuidebook: value.linkGuidebook ?? '',
      linkPendaftaran: value.linkPendaftaran ?? '',
      linkTwibbon: value.linkTwibbon ?? '',
      linkPengumpulanKarya: value.linkPengumpulanKarya ?? '',
      linkTemplateBCC: value.linkTemplateBCC ?? '',
      akunSosmed: value.akunSosmed ?? '',
      contactPersons: (value.contactPersons ?? []).map((person) => ({ ...person })),
    };
  }

  addBenefit(): void { this.data?.benefit.push(''); }
  removeBenefit(index: number): void { this.data?.benefit.splice(index, 1); }
  addRequirement(): void { this.data?.persyaratanUmum.push(''); }
  removeRequirement(index: number): void { this.data?.persyaratanUmum.splice(index, 1); }

  addCategory(): void {
    this.data?.daftarKategori.push({
      namaKategori: '', temaKategori: '', tipePeserta: '', biayaPendaftaran: '',
      alurPendaftaran: [], timeline: [],
    });
  }
  removeCategory(index: number): void {
    if (!this.data || this.data.daftarKategori.length <= 1) return;
    if (confirm('Hapus kategori ini dari konfigurasi lomba?')) {
      this.data.daftarKategori.splice(index, 1);
    }
  }
  addStep(category: LombaKategori): void { category.alurPendaftaran.push(''); }
  removeStep(category: LombaKategori, index: number): void { category.alurPendaftaran.splice(index, 1); }
  addTimeline(category: LombaKategori): void { category.timeline.push({ title: '', date: '' }); }
  removeTimeline(category: LombaKategori, index: number): void { category.timeline.splice(index, 1); }

  addContact(): void { this.data?.contactPersons.push({ name: '', phone: '', type: '' }); }
  removeContact(index: number): void { this.data?.contactPersons.splice(index, 1); }

  trackIndex(index: number): number { return index; }

  private validUrl(input: string, required: boolean): boolean {
    const value = input.trim();
    if (!value) return !required;
    if (value.length > 500) return false;
    try {
      const parsed = new URL(value);
      return ['https:', 'http:'].includes(parsed.protocol) && !!parsed.hostname &&
        !parsed.username && !parsed.password;
    } catch { return false; }
  }

  private validate(data: RapimnasLombaUpdatePayload): string | null {
    if (!data.namaKegiatan.trim() || !data.deskripsi.trim()) return 'Nama kegiatan dan deskripsi wajib diisi.';
    if (!this.validUrl(data.linkPendaftaran, true)) return 'Link pendaftaran wajib berupa URL http(s) yang valid.';
    const optional = [
      data.linkGuidebook, data.linkTwibbon, data.linkPengumpulanKarya, data.linkTemplateBCC,
    ];
    if (optional.some((url) => !this.validUrl(url, false))) return 'Periksa URL guidebook, twibbon, pengumpulan, atau template BCC.';
    if (!data.daftarKategori.length) return 'Minimal harus ada satu kategori lomba.';
    const names = new Set<string>();
    for (const category of data.daftarKategori) {
      if (![category.namaKategori, category.temaKategori, category.tipePeserta, category.biayaPendaftaran]
        .every((value) => value.trim())) return 'Setiap kategori harus memiliki nama, tema, jenis peserta, dan biaya.';
      const key = category.namaKategori.trim().toLowerCase();
      if (names.has(key)) return 'Nama kategori tidak boleh sama.';
      names.add(key);
      if (category.timeline.some((item) => !item.title.trim() || !item.date.trim())) {
        return 'Judul dan tanggal pada setiap baris timeline wajib diisi.';
      }
      if (category.alurPendaftaran.some((step) => !step.trim())) return 'Alur pendaftaran tidak boleh memiliki baris kosong.';
    }
    if (data.benefit.some((item) => !item.trim()) || data.persyaratanUmum.some((item) => !item.trim())) {
      return 'Benefit dan persyaratan tidak boleh memiliki baris kosong.';
    }
    if (data.contactPersons.some((item) => !item.name.trim() || !item.phone.trim())) {
      return 'Nama dan nomor telepon narahubung wajib diisi.';
    }
    return null;
  }

  save(): void {
    if (!this.canManage || !this.data || this.saving()) return;
    const error = this.validate(this.data);
    if (error) { this.error.set(error); this.toast.error(error); return; }
    this.error.set('');
    this.saving.set(true);
    // PUT mengganti seluruh konfigurasi; kirim semua field, bukan hanya yang diedit.
    this.api.updateCMS(this.data).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Informasi lomba berhasil disimpan.');
        this.load(); // Ambil ulang data terbaru dan updatedDate dari server.
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Gagal menyimpan informasi lomba. Periksa data atau izin akun.');
      },
    });
  }
}
