import { Routes } from '@angular/router';
import { loginGuard } from '../../core/guards/guards';

/** Rute autentikasi — dipasang sebagai children dari AuthLayoutComponent. */
export const authRoutes: () => Routes = () => [
  { path: 'login', title: 'Masuk', canActivate: [loginGuard], loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage) },
  { path: 'daftar', title: 'Daftar', canActivate: [loginGuard], loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage) },
  { path: 'verifikasi-email', title: 'Verifikasi Email', loadComponent: () => import('./pages/verify-email/verify-email.page').then((m) => m.VerifyEmailPage) },
  { path: 'lupa-password', title: 'Lupa Password', canActivate: [loginGuard], loadComponent: () => import('./pages/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage) },
  { path: 'reset-password', title: 'Reset Password', canActivate: [loginGuard], loadComponent: () => import('./pages/reset-password/reset-password.page').then((m) => m.ResetPasswordPage) },
];
