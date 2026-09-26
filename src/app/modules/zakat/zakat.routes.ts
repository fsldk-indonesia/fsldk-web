import { Routes } from '@angular/router';

/** Public zakat routes — mounted as children of PublicLayoutComponent. */
export const zakatPublicRoutes: () => Routes = () => [
  { path: 'kalkulator-zakat', title: 'Kalkulator Zakat', loadComponent: () => import('./pages/calculator/zakat.calculator.page').then((m) => m.ZakatCalculatorPage) },
];
