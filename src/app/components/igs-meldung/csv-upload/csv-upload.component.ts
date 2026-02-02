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

import { Component, inject, OnDestroy } from '@angular/core';
import { ErrorMessage, MessageDialogService, StepContentComponent, StepNavigationService } from '@gematik/demis-portal-core-library';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { MeldungsdatenCsvFileUploadService } from 'src/api/services/meldungsdaten-csv-file-upload.service';
import { IgsMeldungService } from '../igs-meldung.service';
import { IgsMeldung } from '../igs-meldung.types';
import { ConfigService } from '../../../config.service';

@Component({
  selector: 'np-mf-igs-csv-upload',
  templateUrl: './csv-upload.component.html',
  styleUrl: './csv-upload.component.scss',
  standalone: false,
})
export class CsvUploadComponent extends StepContentComponent<void> implements OnDestroy {
  readonly uploading$ = new BehaviorSubject<boolean>(false);
  readonly igsMeldungSrv = inject(IgsMeldungService);
  private readonly meldungsdatenCsvFileUploadSrv = inject(MeldungsdatenCsvFileUploadService);
  private readonly unsubscriber = new Subject<void>();
  private readonly messageDialogService = inject(MessageDialogService);
  private readonly configService = inject(ConfigService);
  // remove optional when FEATURE_FLAG_PORTAL_IGS_SIDENAV is default enabled
  private readonly stepNavigationService = inject(StepNavigationService, { optional: true });

  get FEATURE_FLAG_PORTAL_IGS_SIDENAV(): boolean {
    return this.configService.isFeatureEnabled('FEATURE_FLAG_PORTAL_IGS_SIDENAV');
  }

  ngOnDestroy(): void {
    this.unsubscriber.next();
    this.unsubscriber.complete();
  }

  onFileDeleted() {
    this.igsMeldungSrv.clearCsvFile();
  }

  onFilesSelected(fileList: FileList | null) {
    if (!!fileList && !!fileList[0] && fileList[0] instanceof File) {
      this.igsMeldungSrv.useCsvFile(fileList[0]);
      return;
    }
    this.onFileDeleted();
  }

  onUseFile(csvFile: File) {
    this.uploading$.next(true);
    this.meldungsdatenCsvFileUploadSrv
      .uploadMeldungsdatenCsvFile(csvFile)
      .pipe(takeUntil(this.unsubscriber.asObservable()))
      .subscribe({
        next: uploadData => {
          if (uploadData.progress === 100 && !!uploadData.payload) {
            this.igsMeldungSrv.useParsedCsvOverviewData(uploadData.payload as IgsMeldung.OverviewResponse);
            this.uploading$.next(false);
            this.igsMeldungSrv.proceed();
            if (this.configService.isFeatureEnabled('FEATURE_FLAG_PORTAL_IGS_SIDENAV')) {
              this.stepNavigationService?.next();
            }
          }
        },
        error: errorData => {
          if (errorData.error) {
            this.uploading$.next(false);
            let collectedErrors: ErrorMessage[];
            if (errorData.error.errorReport) {
              collectedErrors = errorData.error.errorReport.map((e: IgsMeldung.IgsErrorReport) => ({
                text: e.msg,
                queryString: 'Validierungsfehler CSV-Upload IGS',
              }));
            } else {
              collectedErrors = [{ text: errorData.error.detail, queryString: 'Validierungsfehler CSV-Upload IGS' }];
            }
            this.messageDialogService.showErrorDialog({
              errorTitle: errorData.error.title,
              clipboardContent: JSON.stringify(errorData.error, null, 2),
              errors: collectedErrors,
            });
          }
        },
      });
  }

  showProceedToLastResults(): boolean {
    return this.igsMeldungSrv.lastResultsAvailable();
  }

  navigateToLastResults() {
    this.igsMeldungSrv.proceedToResultStep();
    if (this.configService.isFeatureEnabled('FEATURE_FLAG_PORTAL_IGS_SIDENAV')) {
      this.igsMeldungSrv.processSteps.forEach(step => {
        step.control.enable();
      });
      for (let i = 0; i < 3; i++) {
        this.stepNavigationService?.next();
      }
      this.igsMeldungSrv.processSteps.forEach(step => {
        if (step.key !== 'result') {
          step.control.disable();
        }
      });
    }
  }
}
