import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/guards';

export function structurePublicRoutes(): Routes {
  return [
    {
      path: 'tentang/struktur',
      loadComponent: () => import('./pages/public-index/structure.public-index.page').then((m) => m.StructurePublicIndexPage),
    },
  ];
}

export function structureCmsRoutes(): Routes {
  return [
    {
      path: 'structures',
      canActivate: [permissionGuard],
      data: { permission: 'structure.view' },
      loadComponent: () => import('./pages/index/structure.index.page').then((m) => m.StructureIndexPage),
    },
    {
      path: 'structures/create',
      canActivate: [permissionGuard],
      data: { permission: 'structure.create' },
      loadComponent: () => import('./pages/form/structure.form.page').then((m) => m.StructureFormPage),
    },
    {
      path: 'structures/:id/edit',
      canActivate: [permissionGuard],
      data: { permission: 'structure.update' },
      loadComponent: () => import('./pages/form/structure.form.page').then((m) => m.StructureFormPage),
    },
  ];
}
