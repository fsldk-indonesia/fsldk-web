import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Rute publik goods — dipasang sebagai children dari PublicLayoutComponent. */
export const goodsPublicRoutes: () => Routes = () => [
  { path: 'fsldk-goods', loadComponent: () => import('./pages/public-index/goods.public-index.page').then((m) => m.GoodsPublicIndexPage) },
  { path: 'fsldk-goods/:slug', loadComponent: () => import('./pages/public-detail/goods.public-detail.page').then((m) => m.GoodsPublicDetailPage) },
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
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'goods.view' },
    loadComponent: () => import('./pages/index/goods.index.page').then((m) => m.GoodsIndexPage),
  },
  {
    path: 'goods/products/form',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'goods.create' },
    loadComponent: () => import('./pages/form/goods.form.page').then((m) => m.GoodsFormPage),
  },
  {
    path: 'goods/products/form/:id',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'goods.update' },
    loadComponent: () => import('./pages/form/goods.form.page').then((m) => m.GoodsFormPage),
  },
];

export const goodsCategoryCmsRoutes: () => Routes = () => [
  {
    path: 'goods/categories',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'goodscategory.view' },
    loadComponent: () => import('./pages/category-index/goods-category.index.page').then((m) => m.GoodsCategoryIndexPage),
  },
  {
    path: 'goods/categories/form',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'goodscategory.create' },
    loadComponent: () => import('./pages/category-form/goods-category.form.page').then((m) => m.GoodsCategoryFormPage),
  },
  {
    path: 'goods/categories/form/:id',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'goodscategory.update' },
    loadComponent: () => import('./pages/category-form/goods-category.form.page').then((m) => m.GoodsCategoryFormPage),
  },
];
