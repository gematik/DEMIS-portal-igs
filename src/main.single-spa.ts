/*
    Copyright (c) 2026 gematik GmbH
    Licensed under the EUPL, Version 1.2 or - as soon they will be approved by the
    European Commission – subsequent versions of the EUPL (the "Licence").
    You may not use this work except in compliance with the Licence.
    You find a copy of the Licence in the "Licence" file or at
    https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
    Unless required by applicable law or agreed to in writing,
    software distributed under the Licence is distributed on an "AS IS" basis,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
    In case of changes by gematik find details in the "Readme" file.
    See the Licence for the specific language governing permissions and limitations under the Licence.
    *******
    For additional notes and disclaimer from gematik and in case of changes by gematik,
    find details in the "Readme" file.
 */

import { NgZone, isDevMode, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';

import { getSingleSpaExtraProviders, singleSpaAngular } from 'single-spa-angular';
import { singleSpaPropsSubject } from './single-spa/single-spa-props';
import { AppProps } from 'single-spa';
import { setPublicPath } from 'systemjs-webpack-interop';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { ConfigService } from './app/config.service';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AuthInterceptor } from './app/auth.interceptor';
import { MeldungsdatenCsvFileUploadService } from './api/services/meldungsdaten-csv-file-upload.service';
import { SequenceUploadService } from './api/services/sequence-upload.service';
import { MeldungSubmitService } from './api/services/meldung-submit.service';
import { DocumentReferenceService } from './api/services/document-reference.service';
import { IgsMeldungService } from './app/components/igs-meldung/igs-meldung.service';
import { FhirValidationResponseService } from './api/services/fhir-validation-response.service';
import { provideStepNavigation, FileSizePipe, SecondaryButtonDirective } from '@gematik/demis-portal-core-library';
import { AppRoutingModule } from './app/app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { AppComponent } from './app/app.component';

const appId = 'notification-portal-mf-igs';

const lifecycles = singleSpaAngular({
  bootstrapFunction: singleSpaProps => {
    singleSpaPropsSubject.next(singleSpaProps);
    return bootstrapApplication(AppComponent, {
      providers: [
        getSingleSpaExtraProviders(),
        provideZoneChangeDetection(),
        importProvidersFrom(
          BrowserModule,
          AppRoutingModule,
          BrowserAnimationsModule,
          MatSidenavModule,
          MatStepperModule,
          MatCardModule,
          MatButtonModule,
          MatIconModule,
          MatChipsModule,
          MatDividerModule,
          MatProgressSpinnerModule,
          MatTableModule,
          MatPaginatorModule,
          MatDialogModule,
          LoggerModule.forRoot({
            level: isDevMode() ? NgxLoggerLevel.DEBUG : NgxLoggerLevel.ERROR,
            serverLogLevel: NgxLoggerLevel.OFF,
          }),
          FileSizePipe,
          SecondaryButtonDirective
        ),
        ConfigService,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
        MeldungsdatenCsvFileUploadService,
        SequenceUploadService,
        MeldungSubmitService,
        DocumentReferenceService,
        provideHttpClient(withInterceptorsFromDi()),
        IgsMeldungService,
        FhirValidationResponseService,
        provideStepNavigation(),
      ],
    });
  },
  template: '<app-surveillance-root />',
  Router,
  NgZone,
  NavigationStart,
});

function init() {
  setPublicPath(appId);
  return Promise.resolve();
}

function bootstrapFn(props: AppProps) {
  return init().then(() => {
    if (typeof lifecycles.bootstrap == 'function') {
      return lifecycles.bootstrap(props);
    } else {
      return lifecycles.bootstrap;
    }
  });
}

export const bootstrap = bootstrapFn;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
