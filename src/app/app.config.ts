import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';

import { provideStore } from '@ngrx/store';
import { reducers, rootStoreConfig } from './ngrx.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideStore(reducers, rootStoreConfig),
  ],
};
