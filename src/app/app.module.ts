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

import { isDevMode, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MeldungsdatenCsvFileUploadService } from '../api/services/meldungsdaten-csv-file-upload.service';
import { SequenceUploadService } from '../api/services/sequence-upload.service';
import { MeldungSubmitService } from '../api/services/meldung-submit.service';
import { DocumentReferenceService } from '../api/services/document-reference.service';
import { ConfigService } from './config.service';
import { AuthInterceptor } from './auth.interceptor';
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
import { MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { IgsMeldungService } from './components/igs-meldung/igs-meldung.service';
import { IgsMeldungComponent } from './components/igs-meldung/igs-meldung.component';
import { CsvUploadComponent } from './components/igs-meldung/csv-upload/csv-upload.component';
import { ResultComponent } from './components/igs-meldung/result/result.component';
import { SequenceSelectionComponent } from './components/igs-meldung/sequence-selection/sequence-selection.component';
import { UploadStatusComponent } from './components/igs-meldung/upload-status/upload-status.component';
import { AppWrapperComponent } from './app-wrapper.component';
import { IgsNotificationComponent } from './igs-notification/igs-notification.component';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import {
  ActionsBarComponent,
  FileNameChipComponent,
  FileSelectComponent,
  FileSizePipe,
  FormsFooterComponent,
  MaxHeightContentContainerComponent,
  ProcessStepperComponent,
  SecondaryButtonDirective,
  SectionHeaderComponent,
  SideNavigationComponent,
  TiledContentComponent,
} from '@gematik/demis-portal-core-library';
import { FhirValidationResponseService } from '../api/services/fhir-validation-response.service';

@NgModule({
  declarations: [
    AppComponent,
    AppWrapperComponent,
    IgsMeldungComponent,
    IgsNotificationComponent,
    CsvUploadComponent,
    ResultComponent,
    SequenceSelectionComponent,
    UploadStatusComponent,
  ],
  imports: [
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
    MaxHeightContentContainerComponent,
    SectionHeaderComponent,
    SideNavigationComponent,
    TiledContentComponent,
    FileSelectComponent,
    FileNameChipComponent,
    ProcessStepperComponent,
    ActionsBarComponent,
    FileSizePipe,
    SecondaryButtonDirective,
    FormsFooterComponent,
  ],
  providers: [
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
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
