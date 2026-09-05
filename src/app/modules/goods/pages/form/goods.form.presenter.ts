import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { GoodsRepository } from '../../repositories/goods.repository';
import { GoodsCategoryRepository } from '../../repositories/goods-category.repository';
import { GoodsAvailability } from '../../entities/goods';
import { GoodsFormView } from './goods.form.view';

export interface GoodsFormValue {
  goodsName: string;
  skuCode: string;
  goodsCategoryID: number;
  shortDescription: string;
  fullDescription: string;
  price: number;
  mainImageUrl: string;
  imageUrls: string[];
  availabilityStatus: GoodsAvailability;
  purchaseUrl: string;
  purchaseButtonLabel: string;
}

// isFeatured/isPublished sengaja tidak ada di form — keduanya diatur lewat
// aksi toggle terpisah di halaman list (pola sama seperti catalogbook),
// bukan bagian dari body create/update. Produk baru selalu mulai sebagai
// draft & non-unggulan (default kolom database), konsisten dengan itu.
export const emptyGoodsForm: GoodsFormValue = {
  goodsName: '', skuCode: '', goodsCategoryID: 0, shortDescription: '', fullDescription: '',
  price: 0, mainImageUrl: '', imageUrls: [], availabilityStatus: 'available', purchaseUrl: '',
  purchaseButtonLabel: 'Beli Sekarang',
};

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

@Injectable()
export class GoodsFormPresenter extends BasePresenter<GoodsFormView> {
  private goodsRepo = inject(GoodsRepository);
  private categoryRepo = inject(GoodsCategoryRepository);
  private toast = inject(ToastService);

  loadCategories(): void {
    this.categoryRepo.cmsList().subscribe({ next: (c) => this.view.setCategories(c), error: () => {} });
  }

  loadForEdit(id: number): void {
    this.goodsRepo.cmsGet(id).subscribe({
      next: (g) => this.view.setForm({
        goodsName: g.goodsName, skuCode: g.skuCode ?? '', goodsCategoryID: g.goodsCategoryID,
        shortDescription: g.shortDescription ?? '', fullDescription: g.fullDescription ?? '',
        price: g.price, mainImageUrl: g.mainImageUrl ?? '', imageUrls: g.images,
        availabilityStatus: g.availabilityStatus, purchaseUrl: g.purchaseUrl,
        purchaseButtonLabel: g.purchaseButtonLabel,
      }),
      error: () => {},
    });
  }

  save(editId: number | null, form: GoodsFormValue): void {
    if (!form.goodsName.trim()) { this.toast.error('Nama produk wajib diisi'); return; }
    if (!form.goodsCategoryID) { this.toast.error('Kategori wajib dipilih'); return; }
    if (!isValidUrl(form.purchaseUrl)) { this.toast.error('Purchase URL harus berupa URL http/https yang valid'); return; }
    this.view.setSaving(true);
    const body = { ...form, goodsCategoryID: +form.goodsCategoryID, price: +form.price };
    const done = () => { this.toast.success('Produk disimpan'); this.view.setSaving(false); this.view.navigateToIndex(); };
    if (editId) {
      this.goodsRepo.update(editId, body).subscribe({ next: done, error: () => this.view.setSaving(false) });
    } else {
      this.goodsRepo.create(body).subscribe({ next: done, error: () => this.view.setSaving(false) });
    }
  }
}
