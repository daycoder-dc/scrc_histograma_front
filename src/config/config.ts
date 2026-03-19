import { provideRouter, withComponentInputBinding, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './routes';
import Aura from '@primeuix/themes/aura';

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
