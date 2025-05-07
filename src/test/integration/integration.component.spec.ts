/*
    Copyright (c) 2025 gematik GmbH
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
    For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockBuilder, MockedComponentFixture, MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { LoggerModule } from 'ngx-logger';
import { lastValueFrom, of } from 'rxjs';
import { CreateDocumentReferenceResponse, DocumentReferenceService } from 'src/api/services/document-reference.service';
import { FhirValidationResponseService } from 'src/api/services/fhir-validation-response.service';
import { MeldungSubmitService } from 'src/api/services/meldung-submit.service';
import { MeldungsdatenCsvFileUploadService } from 'src/api/services/meldungsdaten-csv-file-upload.service';
import { ChunkUploadResponse, SequenceUploadService, SequenceValidationInfo, UploadProcessInfo } from 'src/api/services/sequence-upload.service';
import { AppModule } from 'src/app/app.module';
import { igsBatchFastqTestdata } from 'src/app/components/igs-meldung/igs-batch-fastq.testdata';
import { IgsMeldungComponent } from 'src/app/components/igs-meldung/igs-meldung.component';
import { IgsMeldungService } from 'src/app/components/igs-meldung/igs-meldung.service';
import { IgsMeldung } from 'src/app/components/igs-meldung/igs-meldung.types';
import { UploadProgress } from 'src/shared/shared-functions';
import { mockFileList } from '../shared-behaviour/mock-file-list.function';
import { ExportToFileService } from 'src/api/services/export-to-file.service';

describe('Igs - Integration Tests', () => {
  let fixture: MockedComponentFixture<IgsMeldungComponent, IgsMeldungComponent>;
  let component: IgsMeldungComponent;

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
  };

  beforeEach(() =>
    MockBuilder([IgsMeldungComponent, AppModule])
      .mock(LoggerModule)
      .provide(IgsMeldungService)
      .provide(MockProvider(MeldungsdatenCsvFileUploadService, overrides.meldungsdatenCsvFileUploadService))
      .provide(MockProvider(DocumentReferenceService, overrides.documentReferenceService))
      .provide(MockProvider(SequenceUploadService, overrides.sequenceUploadService))
      .provide(MockProvider(MeldungSubmitService, overrides.meldungSubmitService))
      .provide(MockProvider(FhirValidationResponseService, overrides.fhirValidationResponseService))
      .provide(MockProvider(ExportToFileService, overrides.exportToFileService))
      .provide(provideHttpClient(withInterceptorsFromDi()))
      .provide(provideHttpClientTesting())
  );

  beforeEach(() => {
    fixture = MockRender(IgsMeldungComponent);
    component = fixture.point.componentInstance;
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

    // start the upload process and wait for it to finish
    const startUploadButton = ngMocks.find(fixture.debugElement, 'button#start-sequence-upload-btn');
    expect(startUploadButton).toBeDefined();
    startUploadButton.nativeElement.click();
    const retries = 100;
    let tries = 0;
    let showResultsButton = undefined;
    do {
      tries++;
      fixture.detectChanges();
      showResultsButton = ngMocks.find('button#us-btn-show-results:not([disabled])', undefined);
      await setTimeout(() => {}, 100);
    } while (tries < retries && !showResultsButton);
    expect(showResultsButton).toBeDefined();
    expect(spies.createDocumentReference).withContext('should call createDocumentReference').toHaveBeenCalled();
    expect(spies.getFileUploadInfo).withContext('should call getFileUploadInfo').toHaveBeenCalled();
    expect(spies.uploadSequenceFileChunk).withContext('should call uploadSequenceFileChunk').toHaveBeenCalled();
    expect(spies.finishSequenceFileUpload).withContext('should call finishSequenceFileUpload').toHaveBeenCalled();
    expect(spies.pollSequenceValidationResult).withContext('should call pollSequenceValidationResult').toHaveBeenCalled();

    // show the results
    showResultsButton?.nativeElement.click();
    fixture.detectChanges();

    // download the results as CSV report
    const downloadButton = ngMocks.find('button#btn-report-download:not([disabled])', undefined);
    expect(downloadButton).toBeDefined();
    downloadButton?.nativeElement.click();
    fixture.detectChanges();
    expect(spies.exportToCsvFile).withContext('should call exportToCsvFile').toHaveBeenCalled();
  });
});
