import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/guards';

/** Rute publik goods — dipasang sebagai children dari PublicLayoutComponent. */
export const goodsPublicRoutes: () => Routes = () => [
  { path: 'fsldk-goods', title: 'FSLDK Goods', loadComponent: () => import('./pages/public-index/goods.public-index.page').then((m) => m.GoodsPublicIndexPage) },
  { path: 'fsldk-goods/:slug', title: 'Detail Produk', loadComponent: () => import('./pages/public-detail/goods.public-detail.page').then((m) => m.GoodsPublicDetailPage) },
];

/**
 * Rute manajemen produk & kategori goods CMS — dipasang sebagai children dari
 * CmsLayoutComponent, dinest di bawah 'goods/...' supaya keduanya bisa
 * dikelompokkan jadi satu dropdown collapsible "FSLDK Goods" di sidebar
 * (lihat SIDEBAR_GROUPS di cms-layout.component.ts), pola sama seperti "Kantong Amal".
 */
export const goodsCmsRoutes: () => Routes = () => [
  {
    path: 'goods/products',
    canActivate: [permissionGuard],
    data: { permission: 'goods.view' },
    title: 'FSLDK Goods',
    loadComponent: () => import('./pages/index/goods.index.page').then((m) => m.GoodsIndexPage),
  },
  {
    path: 'goods/products/form',
    canActivate: [permissionGuard],
    data: { permission: 'goods.create' },
    title: 'Tambah Produk Goods',
    loadComponent: () => import('./pages/form/goods.form.page').then((m) => m.GoodsFormPage),
  },
  {
    path: 'goods/products/form/:id',
    canActivate: [permissionGuard],
    data: { permission: 'goods.update' },
    title: 'Edit Produk Goods',
    loadComponent: () => import('./pages/form/goods.form.page').then((m) => m.GoodsFormPage),
  },
  {
    // Halaman detail (read-only) — komponen sama dengan form edit, dibedakan
    // lewat route data `viewOnly` yang membuat semua field disabled dan
    // tombol Simpan disembunyikan. Dipicu dengan klik baris di index (lihat
    // GoodsIndexPage) — pola sama seperti Berita/Perpustakaan.
    path: 'goods/products/view/:id',
    canActivate: [permissionGuard],
    data: { permission: 'goods.view', viewOnly: true },
    title: 'Detail Produk Goods',
    loadComponent: () => import('./pages/form/goods.form.page').then((m) => m.GoodsFormPage),
  },
];

export const goodsCategoryCmsRoutes: () => Routes = () => [
  {
    path: 'goods/categories',
    canActivate: [permissionGuard],
    data: { permission: 'goodscategory.view' },
    title: 'Kategori Goods',
    loadComponent: () => import('./pages/category-index/goods-category.index.page').then((m) => m.GoodsCategoryIndexPage),
  },
  {
    path: 'goods/categories/form',
    canActivate: [permissionGuard],
    data: { permission: 'goodscategory.create' },
    title: 'Tambah Kategori Goods',
    loadComponent: () => import('./pages/category-form/goods-category.form.page').then((m) => m.GoodsCategoryFormPage),
  },
  {
    path: 'goods/categories/form/:id',
    canActivate: [permissionGuard],
    data: { permission: 'goodscategory.update' },
    title: 'Edit Kategori Goods',
    loadComponent: () => import('./pages/category-form/goods-category.form.page').then((m) => m.GoodsCategoryFormPage),
  },
  {
    // Halaman detail (read-only) — komponen sama dengan form edit, dibedakan
    // lewat route data `viewOnly`, pola sama seperti Berita/Perpustakaan.
    path: 'goods/categories/view/:id',
    canActivate: [permissionGuard],
    data: { permission: 'goodscategory.view', viewOnly: true },
    title: 'Detail Kategori Goods',
    loadComponent: () => import('./pages/category-form/goods-category.form.page').then((m) => m.GoodsCategoryFormPage),
  },
];
