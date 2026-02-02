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

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import { MockBuilder, MockedComponentFixture, MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { LoggerModule } from 'ngx-logger';
import { lastValueFrom, of } from 'rxjs';
import { CreateDocumentReferenceResponse, DocumentReferenceService } from 'src/api/services/document-reference.service';
import { ExportToFileService } from 'src/api/services/export-to-file.service';
import { FhirValidationResponseService } from 'src/api/services/fhir-validation-response.service';
import { MeldungSubmitService } from 'src/api/services/meldung-submit.service';
import { MeldungsdatenCsvFileUploadService } from 'src/api/services/meldungsdaten-csv-file-upload.service';
import { ChunkUploadResponse, SequenceUploadService, SequenceValidationInfo, UploadProcessInfo } from 'src/api/services/sequence-upload.service';
import { AppModule } from 'src/app/app.module';
import { igsBatchFastqTestdata } from 'src/app/components/igs-meldung/igs-batch-fastq.testdata';
import { IgsMeldungService } from 'src/app/components/igs-meldung/igs-meldung.service';
import { IgsMeldung } from 'src/app/components/igs-meldung/igs-meldung.types';
import { ConfigService } from 'src/app/config.service';
import { UploadProgress } from 'src/shared/shared-functions';
import { mockFileList } from '../shared-behaviour/mock-file-list.function';
import { AppWrapperComponent } from 'src/app/app-wrapper.component';

/**
 * Integration tests for IgsNotificationComponent with SideNavigation (FEATURE_FLAG_PORTAL_IGS_SIDENAV).
 *
 * Once FEATURE_FLAG_PORTAL_IGS_SIDENAV and FEATURE_FLAG_PORTAL_HEADER_FOOTER are removed and become
 * the default behavior, this file should be renamed to integration.component.spec.ts and replace
 * the legacy test file.
 */
describe('Igs - Integration Tests (with FEATURE_FLAG_PORTAL_IGS_SIDENAV)', () => {
  let fixture: MockedComponentFixture<AppWrapperComponent, AppWrapperComponent>;
  let component: AppWrapperComponent;
  let igsMeldungService: IgsMeldungService;

  /**
   * Helper function to trigger change detection cycles and wait for async operations to complete.
   * Even though observables are mocked with synchronous of(), the component lifecycle and
   * service methods like uploadNotifications() are genuinely async and need to complete.
   * This waits for real async operations, not artificial timeouts.
   *
   * Currently runs 2 cycles which is sufficient for this component hierarchy:
   * - Cycle 1: AppWrapper/IgsNotification async operations
   * - Cycle 2: Child components (e.g., UploadStatusComponent.ngOnInit()) async operations
   *
   * If the component hierarchy grows deeper and components at deeper levels start async operations,
   * additional cycles would be needed. The test would fail fast in that case, making it obvious.
   */
  async function flushChanges(): Promise<void> {
    // Wait for all pending async operations (like service.uploadNotifications())
    await fixture.whenStable();
    // Trigger change detection to update the DOM with the results of async operations
    fixture.detectChanges();
    // After detectChanges(), nested components may trigger their own async operations in ngOnInit().
    // Wait for those to complete as well (e.g., UploadStatusComponent calls uploadNotifications() in ngOnInit).
    await fixture.whenStable();
    // Final change detection to render the results of those nested async operations
    fixture.detectChanges();
  }

  let documentReferenceCounter = 1;

  const spies = {
    uploadMeldungsdatenCsvFile: jasmine.createSpy('uploadMeldungsdatenCsvFile').and.returnValue(
      of({
        progress: 100,
        payload: { items: [igsBatchFastqTestdata.items[0]] } as IgsMeldung.OverviewResponse,
      } as UploadProgress<IgsMeldung.OverviewResponse>)
    ),
    createDocumentReference: jasmine
      .createSpy('createDocumentReference')
      .and.returnValue(
        of({ documentReferenceId: `DR4711-${documentReferenceCounter++}`, sequenceUploadUrl: 'http://upload-to-this.url' } as CreateDocumentReferenceResponse)
      ),
    getFileUploadInfo: jasmine
      .createSpy('getFileUploadInfo')
      .and.returnValue(of({ uploadId: 'UL4711', presignedUrls: ['http://upload-chunk-to-this.url'], partSizeBytes: 9999999999 } as UploadProcessInfo)),
    uploadSequenceFileChunk: jasmine
      .createSpy('uploadSequenceFileChunk')
      .and.returnValue(lastValueFrom(of({ partNumber: 1, eTag: 'example-e-tag' } as ChunkUploadResponse))),
    finishSequenceFileUpload: jasmine.createSpy('finishSequenceFileUpload').and.returnValue(of({})),
    pollSequenceValidationResult: jasmine.createSpy('pollSequenceValidationResult').and.callFake((documentReferenceId: string) =>
      of({
        documentReferenceId,
        status: 'VALID',
        message: 'Validation successful',
      } as SequenceValidationInfo)
    ),
    submitMeldung: jasmine.createSpy('submitMeldung').and.returnValue(
      of({
        status: 'SUCCESS',
        message: 'Meldung erfolgreich übermittelt',
      })
    ),
    exportToCsvFile: jasmine.createSpy('exportToCsvFile'),
  };

  const overrides = {
    get meldungsdatenCsvFileUploadService() {
      return {
        uploadMeldungsdatenCsvFile: spies.uploadMeldungsdatenCsvFile,
      } as Partial<MeldungsdatenCsvFileUploadService>;
    },
    get documentReferenceService() {
      return {
        createDocumentReference: spies.createDocumentReference,
      } as Partial<DocumentReferenceService>;
    },
    get sequenceUploadService() {
      return {
        getFileUploadInfo: spies.getFileUploadInfo,
        uploadSequenceFileChunk: spies.uploadSequenceFileChunk,
        finishSequenceFileUpload: spies.finishSequenceFileUpload,
        pollSequenceValidationResult: spies.pollSequenceValidationResult,
      } as Partial<SequenceUploadService>;
    },
    get meldungSubmitService() {
      return {
        submitMeldung: spies.submitMeldung,
      } as Partial<MeldungSubmitService>;
    },
    get fhirValidationResponseService() {
      return {} as Partial<FhirValidationResponseService>;
    },
    get exportToFileService() {
      return {
        exportToCsvFile: spies.exportToCsvFile,
      } as Partial<ExportToFileService>;
    },
    get configService() {
      return {
        isFeatureEnabled: jasmine.createSpy('isFeatureEnabled').and.callFake((flag: string) => {
          if (flag === 'FEATURE_FLAG_PORTAL_IGS_SIDENAV') return true;
          if (flag === 'FEATURE_FLAG_PORTAL_HEADER_FOOTER') return true;
          return false;
        }),
        igsGatewayUrl: 'http://localhost:8080/gateway',
        igsServiceUrl: 'http://localhost:8080/service',
        maxAttempts: 40,
        waitBetweenRetires: 1000,
      } as Partial<ConfigService>;
    },
  };

  beforeEach(() =>
    MockBuilder([AppWrapperComponent, AppModule])
      .keep(IgsMeldungService)
      .mock(LoggerModule)
      .provide(MockProvider(MeldungsdatenCsvFileUploadService, overrides.meldungsdatenCsvFileUploadService))
      .provide(MockProvider(DocumentReferenceService, overrides.documentReferenceService))
      .provide(MockProvider(SequenceUploadService, overrides.sequenceUploadService))
      .provide(MockProvider(MeldungSubmitService, overrides.meldungSubmitService))
      .provide(MockProvider(FhirValidationResponseService, overrides.fhirValidationResponseService))
      .provide(MockProvider(ExportToFileService, overrides.exportToFileService))
      .provide(MockProvider(ConfigService, overrides.configService))
      .provide(provideHttpClient(withInterceptorsFromDi()))
      .provide(provideHttpClientTesting())
  );

  beforeEach(() => {
    fixture = MockRender(AppWrapperComponent);
    component = fixture.point.componentInstance;

    // Get IgsMeldungService instance and reset state before each test
    igsMeldungService = fixture.point.injector.get(IgsMeldungService);
    igsMeldungService.backToWelcome();

    fixture.detectChanges();

    // Reset spies
    Object.values(spies).forEach(spy => {
      if (typeof spy.calls !== 'undefined') {
        spy.calls.reset();
      }
    });
  });

  beforeEach(async () => {
    // Trigger initial change detection for SideNavigation to render the first step
    await flushChanges();
  });

  it('should create', () => {
    expect(fixture).toBeDefined();
    expect(component).toBeTruthy();
  });

  it('should download even with errors', async () => {
    // load a CSV file
    const csvFileSelect = ngMocks.find(fixture.debugElement, 'gem-demis-file-select input[type="file"]');
    expect(csvFileSelect).toBeDefined();
    (csvFileSelect.nativeElement as HTMLInputElement).files = mockFileList(['igs-test-data.csv']);
    csvFileSelect.nativeElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // send the CSV file to the IGS gateway
    const sendButton = ngMocks.find(fixture.debugElement, 'button#send-csv-to-igs-gateway');
    expect(sendButton).toBeDefined();
    sendButton.nativeElement.click();
    fixture.detectChanges();

    // load necessary sequence files
    const sequenceFileSelect = ngMocks.find(fixture.debugElement, 'gem-demis-file-select input[type="file"]');
    expect(sequenceFileSelect).toBeDefined();
    (sequenceFileSelect.nativeElement as HTMLInputElement).files = mockFileList(['Sample12346_R1.fastq', 'Sample12346_R2.fastq']);
    sequenceFileSelect.nativeElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // start the upload process
    const startUploadButton = ngMocks.find(fixture.debugElement, 'button#start-sequence-upload-btn');
    expect(startUploadButton).toBeDefined();
    startUploadButton.nativeElement.click();

    // Wait for async uploadNotifications() to complete
    await flushChanges();

    // Now the "Show Results" button should be enabled
    const showResultsButton = ngMocks.find('button#us-btn-show-results:not([disabled])');
    expect(showResultsButton).toBeDefined();
    expect(spies.createDocumentReference).withContext('should call createDocumentReference').toHaveBeenCalled();
    expect(spies.getFileUploadInfo).withContext('should call getFileUploadInfo').toHaveBeenCalled();
    expect(spies.uploadSequenceFileChunk).withContext('should call uploadSequenceFileChunk').toHaveBeenCalled();
    expect(spies.finishSequenceFileUpload).withContext('should call finishSequenceFileUpload').toHaveBeenCalled();
    expect(spies.pollSequenceValidationResult).withContext('should call pollSequenceValidationResult').toHaveBeenCalled();

    // show the results
    showResultsButton.nativeElement.click();
    fixture.detectChanges();

    // download the results as CSV report
    const downloadButton = ngMocks.find('button#btn-report-download:not([disabled])', undefined);
    expect(downloadButton).toBeDefined();
    downloadButton?.nativeElement.click();
    fixture.detectChanges();
    expect(spies.exportToCsvFile).withContext('should call exportToCsvFile').toHaveBeenCalled();
  });

  it('should go back to start flow before upload sequence data', async () => {
    // load a CSV file
    const csvFileSelect = ngMocks.find(fixture.debugElement, 'gem-demis-file-select input[type="file"]');
    expect(csvFileSelect).toBeDefined();
    (csvFileSelect.nativeElement as HTMLInputElement).files = mockFileList(['igs-test-data.csv']);
    csvFileSelect.nativeElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // send the CSV file to the IGS gateway
    const sendButton = ngMocks.find(fixture.debugElement, 'button#send-csv-to-igs-gateway');
    expect(sendButton).toBeDefined();
    sendButton.nativeElement.click();
    fixture.detectChanges();

    // load necessary sequence files
    const sequenceFileSelect = ngMocks.find(fixture.debugElement, 'gem-demis-file-select input[type="file"]');
    expect(sequenceFileSelect).toBeDefined();
    (sequenceFileSelect.nativeElement as HTMLInputElement).files = mockFileList(['Sample12346_R1.fastq', 'Sample12346_R2.fastq']);
    sequenceFileSelect.nativeElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // click restart process button
    const cancelProcessButton = ngMocks.find(fixture.debugElement, 'button#btn-reset-flow');
    expect(cancelProcessButton).toBeDefined();
    expect(cancelProcessButton.nativeElement.textContent.trim()).toEqual('Prozess neu starten');
    cancelProcessButton.nativeElement.click();

    // Wait for navigation to complete
    await flushChanges();

    // check if back to CSV upload step by looking for the specific section header text
    const csvUploadContent = ngMocks.findAll(fixture.debugElement, 'gem-demis-section-header');
    expect(csvUploadContent.length).toBeGreaterThan(0);
    const metadatenHeader = csvUploadContent.find(el => el.nativeElement.textContent.includes('Metadaten bereitstellen'));
    expect(metadatenHeader).toBeDefined();

    // verify the file select input is present
    const fileSelectAfterReset = ngMocks.find(fixture.debugElement, 'gem-demis-file-select input[type="file"]');
    expect(fileSelectAfterReset).toBeDefined();
  });

  it('should go back to start flow after upload sequence data', async () => {
    // load a CSV file
    const csvFileSelect = ngMocks.find(fixture.debugElement, 'gem-demis-file-select input[type="file"]');
    expect(csvFileSelect).toBeDefined();
    (csvFileSelect.nativeElement as HTMLInputElement).files = mockFileList(['igs-test-data.csv']);
    csvFileSelect.nativeElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // send the CSV file to the IGS gateway
    const sendButton = ngMocks.find(fixture.debugElement, 'button#send-csv-to-igs-gateway');
    expect(sendButton).toBeDefined();
    sendButton.nativeElement.click();
    fixture.detectChanges();

    // load necessary sequence files
    const sequenceFileSelect = ngMocks.find(fixture.debugElement, 'gem-demis-file-select input[type="file"]');
    expect(sequenceFileSelect).toBeDefined();
    (sequenceFileSelect.nativeElement as HTMLInputElement).files = mockFileList(['Sample12346_R1.fastq', 'Sample12346_R2.fastq']);
    sequenceFileSelect.nativeElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // start the upload process
    const startUploadButton = ngMocks.find(fixture.debugElement, 'button#start-sequence-upload-btn');
    expect(startUploadButton).toBeDefined();
    startUploadButton.nativeElement.click();

    // Wait for async uploadNotifications() to complete
    await flushChanges();

    // Now the "Show Results" button should be enabled
    const showResultsButton = ngMocks.find('button#us-btn-show-results:not([disabled])');
    expect(showResultsButton).toBeDefined();
    expect(spies.createDocumentReference).withContext('should call createDocumentReference').toHaveBeenCalled();
    expect(spies.getFileUploadInfo).withContext('should call getFileUploadInfo').toHaveBeenCalled();
    expect(spies.uploadSequenceFileChunk).withContext('should call uploadSequenceFileChunk').toHaveBeenCalled();
    expect(spies.finishSequenceFileUpload).withContext('should call finishSequenceFileUpload').toHaveBeenCalled();
    expect(spies.pollSequenceValidationResult).withContext('should call pollSequenceValidationResult').toHaveBeenCalled();

    // Note: In the SideNavigation version, the cancel button is only visible while upload is in progress.
    // Once upload is complete (canProceed() returns true), the cancel button is hidden.
    // Therefore, we proceed to results instead of canceling.

    // show the results
    showResultsButton.nativeElement.click();
    fixture.detectChanges();

    // click restart process button from the results page
    const restartProcessButton = ngMocks.find(fixture.debugElement, 'button#btn-reset-flow');
    expect(restartProcessButton).toBeDefined();
    expect(restartProcessButton.nativeElement.textContent.trim()).toEqual('Prozess neu starten');
    restartProcessButton.nativeElement.click();

    // Wait for navigation to complete
    await flushChanges();

    // check if back to CSV upload step by looking for the specific section header text
    const csvUploadContent = ngMocks.findAll(fixture.debugElement, 'gem-demis-section-header');
    expect(csvUploadContent.length).toBeGreaterThan(0);
    const metadatenHeader = csvUploadContent.find(el => el.nativeElement.textContent.includes('Metadaten bereitstellen'));
    expect(metadatenHeader).toBeDefined();

    // verify the file select input is present
    const fileSelectAfterReset = ngMocks.find(fixture.debugElement, 'gem-demis-file-select input[type="file"]');
    expect(fileSelectAfterReset).toBeDefined();
  });
});
