import { provideRouter, withComponentInputBinding, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from "@angular/common";
import localeEs from "@angular/common/locales/es";
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { appRoutes } from './routes';

registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled'
      }),
      withEnabledBlockingInitialNavigation(),
      withComponentInputBinding()
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([])
    ),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark'
        }
      }
    })
  ]
};
