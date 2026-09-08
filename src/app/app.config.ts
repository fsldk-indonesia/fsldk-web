import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions, withRouterConfig, TitleStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AppTitleStrategy } from './core/services/title-strategy.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // withViewTransitions: transisi halus native browser tiap navigasi
    // (::view-transition-old/new di styles.scss) — tanpa dependency animasi baru.
    // paramsInheritanceStrategy 'always': rute anak (mis. organizations/ldk yang
    // dipasang di 2 shell berbeda, cms-puskomda & cms-puskomnas) perlu tahu
    // `tier` shell mana yang memuatnya lewat route data milik shell (ActivatedRoute
    // default HANYA memberi data milik rute itu sendiri, bukan leluhurnya).
    provideRouter(routes, withComponentInputBinding(), withViewTransitions(), withRouterConfig({ paramsInheritanceStrategy: 'always' })),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ],
};
