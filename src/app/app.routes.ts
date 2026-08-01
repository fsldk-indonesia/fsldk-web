import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout.component';
import { CmsLayoutComponent } from './layouts/cms-layout.component';
import { authGuard, loginGuard, permissionGuard, verifiedGuard } from './core/guards/guards';

export const routes: Routes = [
  // ---------- Publik (Landing Page) ----------
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./pages/public/home.component').then((m) => m.HomeComponent) },
      { path: 'tentang', loadComponent: () => import('./pages/public/about.component').then((m) => m.AboutComponent) },
      { path: 'berita', loadComponent: () => import('./pages/public/news-list.component').then((m) => m.NewsListComponent) },
      { path: 'berita/:slug', loadComponent: () => import('./pages/public/news-detail.component').then((m) => m.NewsDetailComponent) },
      { path: 'artikel', loadComponent: () => import('./pages/public/article-list.component').then((m) => m.ArticleListComponent) },
      { path: 'artikel/:slug', loadComponent: () => import('./pages/public/article-detail.component').then((m) => m.ArticleDetailComponent) },
      { path: 'kontak', loadComponent: () => import('./pages/public/contact.component').then((m) => m.ContactComponent) },
    ],
  },

  // ---------- Autentikasi ----------
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', canActivate: [loginGuard], loadComponent: () => import('./pages/auth/login.component').then((m) => m.LoginComponent) },
      { path: 'daftar', canActivate: [loginGuard], loadComponent: () => import('./pages/auth/register.component').then((m) => m.RegisterComponent) },
      { path: 'verifikasi-email', loadComponent: () => import('./pages/auth/verify-email.component').then((m) => m.VerifyEmailComponent) },
      { path: 'lupa-password', canActivate: [loginGuard], loadComponent: () => import('./pages/auth/forgot-password.component').then((m) => m.ForgotPasswordComponent) },
      { path: 'reset-password', canActivate: [loginGuard], loadComponent: () => import('./pages/auth/reset-password.component').then((m) => m.ResetPasswordComponent) },
    ],
  },

  // ---------- CMS (terproteksi) ----------
  {
    path: 'cms',
    component: CmsLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', canActivate: [verifiedGuard], loadComponent: () => import('./pages/cms/dashboard.component').then((m) => m.CmsDashboardComponent) },
      { path: 'users', canActivate: [verifiedGuard, permissionGuard], data: { permission: 'user.view' }, loadComponent: () => import('./pages/cms/users.component').then((m) => m.CmsUsersComponent) },
      { path: 'roles', canActivate: [verifiedGuard, permissionGuard], data: { permission: 'role.view' }, loadComponent: () => import('./pages/cms/roles.component').then((m) => m.CmsRolesComponent) },
      { path: 'news', canActivate: [verifiedGuard, permissionGuard], data: { permission: 'news.view' }, loadComponent: () => import('./pages/cms/news-management.component').then((m) => m.CmsNewsComponent) },
      { path: 'news/form', canActivate: [verifiedGuard, permissionGuard], data: { permission: 'news.create' }, loadComponent: () => import('./pages/cms/news-form.component').then((m) => m.CmsNewsFormComponent) },
      { path: 'news/form/:id', canActivate: [verifiedGuard, permissionGuard], data: { permission: 'news.update' }, loadComponent: () => import('./pages/cms/news-form.component').then((m) => m.CmsNewsFormComponent) },
      { path: 'articles', canActivate: [verifiedGuard, permissionGuard], data: { permission: 'article.view' }, loadComponent: () => import('./pages/cms/articles-management.component').then((m) => m.CmsArticlesComponent) },
      { path: 'articles/form', canActivate: [verifiedGuard, permissionGuard], data: { permission: 'article.create' }, loadComponent: () => import('./pages/cms/article-form.component').then((m) => m.CmsArticleFormComponent) },
      { path: 'articles/form/:id', canActivate: [verifiedGuard, permissionGuard], data: { permission: 'article.update' }, loadComponent: () => import('./pages/cms/article-form.component').then((m) => m.CmsArticleFormComponent) },
      { path: 'contents', canActivate: [verifiedGuard, permissionGuard], data: { permission: 'content.view' }, loadComponent: () => import('./pages/cms/content-management.component').then((m) => m.CmsContentComponent) },
    ],
  },

  { path: '**', redirectTo: '' },
];
