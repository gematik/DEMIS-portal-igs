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
    For additional notes and disclaimer from gematik and in case of changes by gematik,
    find details in the "Readme" file.
 */

import { TestBed } from '@angular/core/testing';
import { FileSizePipe, MessageDialogService, Step } from '@gematik/demis-portal-core-library';
import { MockBuilder } from 'ng-mocks';
import { LoggerModule } from 'ngx-logger';
import { BehaviorSubject, firstValueFrom, of, throwError } from 'rxjs';
import { CreateDocumentReferenceResponse, DocumentReferenceService } from 'src/api/services/document-reference.service';
import { MeldungSubmitResponse, MeldungSubmitService } from 'src/api/services/meldung-submit.service';
import { ChunkUploadResponse, SequenceUploadService, UploadProcessInfo } from 'src/api/services/sequence-upload.service';
import { AppModule } from 'src/app/app.module';
import { UploadProgress } from 'src/shared/shared-functions';
import { mockFileList, mockFileListWithBytes } from 'src/test/shared-behaviour/mock-file-list.function';
import { igsBatchFastqSequenzdateienSelectOverview, igsBatchFastqTestdata, uploadProcessInfo, uploadSequenceFileParams } from './igs-batch-fastq.testdata';
import { IgsLocalStorageKeys, IgsMeldungService, SEARCH_STRINGS, UploadError } from './igs-meldung.service';
import { IgsMeldung } from './igs-meldung.types';
import { HttpErrorResponse } from '@angular/common/http';

const exampleOpperationOutcomeString = JSON.stringify(
  {
    resourceType: 'OperationOutcome',
    meta: {
      profile: ['http://example.org/fhir/StructureDefinition/OperationOutcome'],
    },
    text: {
      status: 'generated',
      div: '<div xmlns="http://www.w3.org/1999/xhtml">Example narrative</div>',
    },
    issue: [
      {
        severity: 'error',
        code: 'invalid',
        diagnostics: 'Invalid value detected',
        location: ['Patient.name[0].given[0]'],
        extension: [
          {
            url: 'http://example.org/fhir/StructureDefinition/extension-example',
            valueString: 'Example extension',
          },
        ],
        details: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/operation-outcome',
              code: 'value',
            },
          ],
        },
      },
    ],
  },
  null,
  2
);

describe('IgsMeldungService', () => {
  let service: IgsMeldungService;

  beforeEach(() => MockBuilder([IgsMeldungService, AppModule]).mock(LoggerModule).mock(FileSizePipe).mock(MessageDialogService).mock(SequenceUploadService));

  beforeEach(() => {
    service = TestBed.inject(IgsMeldungService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial steps', () => {
    expect(service.steps.length).toBe(4);
    expect(service.steps[0].number).toBe(1);
    expect(service.steps[0].title).toBe('Metadaten bereitstellen');
    expect(service.steps[0].description).toBe('Bereitstellung der Metadaten in tabellarischer Form');
  });

  it('should have initial values for observables', async () => {
    await expectAsync(firstValueFrom(service.csvFile$)).toBeResolvedTo(null);
    await expectAsync(firstValueFrom(service.activeStep$)).toBeResolvedTo(service.steps[0]);
    await expectAsync(firstValueFrom(service.overviewData$)).toBeResolvedTo(null);
    await expectAsync(firstValueFrom(service.sequenceFileSelectionOverviewData$)).toBeResolvedTo([]);
    await expectAsync(firstValueFrom(service.attachedFiles$)).toBeResolvedTo([]);
    await expectAsync(firstValueFrom(service.fileUploads$)).toBeResolvedTo([]);
    await expectAsync(firstValueFrom(service.notificationUploads$)).toBeResolvedTo([]);
  });

  it('should clear csvFile', async () => {
    const csvFile = new File([''], 'test.csv');
    service.useCsvFile(csvFile);
    service.clearCsvFile();
    await expectAsync(firstValueFrom(service.csvFile$)).toBeResolvedTo(null);
  });

  it('should useCsvFile', async () => {
    const csvFile = new File([''], 'test.csv');
    service.useCsvFile(csvFile);
    await expectAsync(firstValueFrom(service.csvFile$)).toBeResolvedTo(csvFile);
  });

  it('should useParsedCsvOverviewData', async () => {
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    await expectAsync(firstValueFrom(service.overviewData$)).toBeResolvedTo(igsBatchFastqTestdata);
    await expectAsync(firstValueFrom(service.sequenceFileSelectionOverviewData$)).toBeResolvedTo(igsBatchFastqSequenzdateienSelectOverview);
  });

  it('should attachFiles', async () => {
    const fileList = mockFileList([igsBatchFastqTestdata.items[0].data.fileOneName, igsBatchFastqTestdata.items[0].data.fileTwoName]);
    const files = Array.from(fileList);
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    service.attachFiles(fileList);

    await expectAsync(firstValueFrom(service.attachedFiles$)).toBeResolvedTo(files);
  });

  it('should update error if attached file not found ', async () => {
    const fileList = mockFileList(['notExisting', 'notExsisting2']);
    const files = Array.from(fileList);
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    const messageDialog = TestBed.inject(MessageDialogService);
    const method = spyOn(messageDialog, 'showErrorDialog');

    service.attachFiles(fileList);
    expect(method).toHaveBeenCalledWith({
      errorTitle: 'Fehler beim Anhängen von Dateien',
      errors: files.map(item => ({ text: `Die ausgewählte Datei ${item.name} stimmt mit keinem Element in den Metadaten überein.` })),
    });
  });

  it('should update error if attached file too big', async () => {
    const bytesOver2GiB = 2 * 1024 * 1024 * 1024 + 1;
    const fileList = mockFileListWithBytes([igsBatchFastqTestdata.items[0].data.fileOneName, igsBatchFastqTestdata.items[0].data.fileTwoName], bytesOver2GiB);
    const files = Array.from(fileList);
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    const messageDialog = TestBed.inject(MessageDialogService);
    const method = spyOn(messageDialog, 'showErrorDialog');

    service.attachFiles(fileList);
    expect(method).toHaveBeenCalledWith({
      errorTitle: 'Fehler beim Anhängen von Dateien',
      errors: files.map(item => ({ text: `Die ausgewählte Sequenzdatei ${item.name} ist größer als das Upload-Limit 2.00 GB.` })),
    });
  });

  it('should check if a file is attached', () => {
    const fileList = mockFileList([igsBatchFastqTestdata.items[0].data.fileOneName, igsBatchFastqTestdata.items[0].data.fileTwoName]);
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    service.attachFiles(fileList);
    expect(service.isAttached(igsBatchFastqTestdata.items[0].data.fileOneName)).toBe(true);
    expect(service.isAttached(igsBatchFastqTestdata.items[0].data.fileTwoName)).toBe(true);
    expect(service.isAttached('shouldNotBeAttached.txt')).toBe(false);
  });

  it('should go back to welcome page and reset the service state', async () => {
    const csvFile = new File([''], 'test.csv');
    service.useCsvFile(csvFile);
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    const fileList = mockFileList([igsBatchFastqTestdata.items[0].data.fileOneName, igsBatchFastqTestdata.items[0].data.fileTwoName]);
    service.attachFiles(fileList);

    // Call the reset method
    service.backToWelcome();

    // Expect the service state to be reset
    await expectAsync(firstValueFrom(service.csvFile$)).toBeResolvedTo(null);
    await expectAsync(firstValueFrom(service.activeStep$)).toBeResolvedTo(service.steps[0]);
    await expectAsync(firstValueFrom(service.overviewData$)).toBeResolvedTo(null);
    await expectAsync(firstValueFrom(service.attachedFiles$)).toBeResolvedTo([]);
    await expectAsync(firstValueFrom(service.fileUploads$)).toBeResolvedTo([]);
    await expectAsync(firstValueFrom(service.notificationUploads$)).toBeResolvedTo([]);
  });

  it('should reset the service state and adjust result for aborted upload', async () => {
    // Set initial values for the service state
    const uploadCanceledSpy = spyOn<any>(service['uploadCanceled$'], 'next');
    const uploadCanceledSubjectSpy = spyOn<any>(service['uploadCanceledSubject'], 'next');
    const notificationUploadsSub = service['notificationUploadsSub$'] as BehaviorSubject<IgsMeldung.NotificationUploadInfo[]>;
    notificationUploadsSub.next([
      {
        rowNumber: 1,
        demisNotificationId: 'notification 1',
        labSequenceId: 'lab sequence id 1',
        status: 'PENDING',
      },
      {
        rowNumber: 2,
        demisNotificationId: 'notification 2',
        labSequenceId: 'lab sequence id 2',
        status: 'PLANNED',
      },
      {
        rowNumber: 3,
        demisNotificationId: 'notification 3',
        labSequenceId: 'lab sequence id 3',
        status: 'PLANNED',
      },
    ]);

    // Call the reset method
    service.cancel();

    await expectAsync(firstValueFrom(service.activeStep$)).toBeResolvedTo(service.steps[3]);
    expect(uploadCanceledSpy).toHaveBeenCalledWith(true);
    expect(uploadCanceledSubjectSpy).toHaveBeenCalledWith(true);
    // assert aborted state in service
    let expectedResultEntries: IgsMeldung.NotificationUploadInfo[] = [
      {
        rowNumber: 1,
        demisNotificationId: 'notification 1',
        labSequenceId: 'lab sequence id 1',
        status: 'ABORTED',
      },
      {
        rowNumber: 2,
        demisNotificationId: 'notification 2',
        labSequenceId: 'lab sequence id 2',
        status: 'ABORTED',
      },
      {
        rowNumber: 3,
        demisNotificationId: 'notification 3',
        labSequenceId: 'lab sequence id 3',
        status: 'ABORTED',
      },
    ];
    expect(notificationUploadsSub.value).toEqual(expectedResultEntries);
    // assert aborted state in local storage
    let actualResultEntries = localStorage.getItem(IgsLocalStorageKeys.NOTIFICATION_UPLOADS);
    expect(actualResultEntries).toEqual(JSON.stringify(expectedResultEntries));
  });

  it('should return false if no files are attached', () => {
    expect(service.isAttached('file1.txt')).toBe(false);
  });

  it('should proceed to the next step if a CSV file is selected', async () => {
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    expect(service.canProceed()).toBe(true);
    service.proceed();
    await expectAsync(firstValueFrom(service.activeStep$)).toBeResolvedTo(service.steps[1]);
  });

  it('should not proceed if no CSV file is selected', async () => {
    expect(service.canProceed()).toBe(false);
    service.proceed();
    await expectAsync(firstValueFrom(service.activeStep$)).toBeResolvedTo(service.steps[0]);
  });

  it('should proceed to the next step if all sequence files are attached', async () => {
    const fileList = mockFileList([
      igsBatchFastqTestdata.items[0].data.fileOneName,
      igsBatchFastqTestdata.items[0].data.fileTwoName,
      igsBatchFastqTestdata.items[1].data.fileOneName,
      igsBatchFastqTestdata.items[1].data.fileTwoName,
      igsBatchFastqTestdata.items[2].data.fileOneName,
      igsBatchFastqTestdata.items[2].data.fileTwoName,
    ]);
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    service.proceed();
    service.attachFiles(fileList);
    expect(service.canProceed()).toBe(true);
    service.proceed();
    await expectAsync(firstValueFrom(service.activeStep$)).toBeResolvedTo(service.steps[2]);
  });

  it('should not proceed if not all sequence files are attached', async () => {
    const fileList = mockFileList([igsBatchFastqTestdata.items[0].data.fileOneName]);
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    service.attachFiles(fileList);
    service.proceed();
    await expectAsync(firstValueFrom(service.activeStep$)).toBeResolvedTo(service.steps[1]);
  });

  it('should proceed to the next step if notifications are uploaded', async () => {
    const uploadTimestamps: string[] = [];
    const demisSequenceIds: string[] = [];
    spyOn(Date.prototype, 'toISOString').and.callFake(() => {
      uploadTimestamps.push(new Date().toLocaleString());
      return uploadTimestamps[uploadTimestamps.length - 1];
    });
    spyOn(TestBed.inject(DocumentReferenceService), 'createDocumentReference').and.returnValue(
      of({
        sequenceUploadUrl: `https://igs.gateway/sequence-upload?fileRef=${Math.floor(Math.random() * 100000000)}`,
        documentReferenceId: 'docref-id',
      } as CreateDocumentReferenceResponse)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'getFileUploadInfo').and.returnValue(
      of({ uploadId: 'string', presignedUrls: [''], partSizeBytes: 1 } as UploadProcessInfo)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'uploadSequenceFileChunk').and.returnValue(
      Promise.resolve({ partNumber: 1, eTag: 'etag-value' } as ChunkUploadResponse)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'finishSequenceFileUpload').and.returnValue(of({ status: 'SUCCESS' }));
    spyOn(TestBed.inject(SequenceUploadService), 'initValidation').and.returnValue(Promise.resolve());
    spyOn(TestBed.inject(SequenceUploadService), 'pollSequenceValidationResult').and.returnValue(
      Promise.resolve({ documentReferenceId: 'docref-id', status: 'VALID', message: 'string' })
    );
    spyOn(TestBed.inject(MeldungSubmitService), 'submitMeldung').and.callFake(() => {
      uploadTimestamps.push(new Date().toISOString());
      demisSequenceIds.push(`IGS-${10000 + Math.floor(Math.random() * 89999)}-PLAP-${crypto.randomUUID()}`);
      return of({
        igsId: demisSequenceIds[demisSequenceIds.length - 1],
      } as MeldungSubmitResponse);
    });
    const fileList = mockFileList([
      igsBatchFastqTestdata.items[0].data.fileOneName,
      igsBatchFastqTestdata.items[0].data.fileTwoName,
      igsBatchFastqTestdata.items[1].data.fileOneName,
      igsBatchFastqTestdata.items[1].data.fileTwoName,
      igsBatchFastqTestdata.items[2].data.fileOneName,
      igsBatchFastqTestdata.items[2].data.fileTwoName,
    ]);
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    service.proceed();
    service.attachFiles(fileList);
    expect(service.canProceed()).toBe(true);
    service.proceed();
    await service.uploadNotifications();
    expect(localStorage.getItem(IgsLocalStorageKeys.NOTIFICATION_UPLOADS)).toBe(
      JSON.stringify([
        {
          rowNumber: 1,
          uploadTimestamp: uploadTimestamps[0],
          demisNotificationId: igsBatchFastqTestdata.items[0].data.demisNotificationId,
          labSequenceId: igsBatchFastqTestdata.items[0].data.labSequenceId,
          demisSequenceId: demisSequenceIds[0],
          status: 'SUCCESS',
        },
        {
          rowNumber: 2,
          uploadTimestamp: uploadTimestamps[1],
          demisNotificationId: igsBatchFastqTestdata.items[1].data.demisNotificationId,
          labSequenceId: igsBatchFastqTestdata.items[1].data.labSequenceId,
          demisSequenceId: demisSequenceIds[1],
          status: 'SUCCESS',
        },
        {
          rowNumber: 3,
          uploadTimestamp: uploadTimestamps[2],
          demisNotificationId: igsBatchFastqTestdata.items[2].data.demisNotificationId,
          labSequenceId: igsBatchFastqTestdata.items[2].data.labSequenceId,
          demisSequenceId: demisSequenceIds[2],
          status: 'SUCCESS',
        },
      ])
    );
    expect(service.canProceed()).toBe(true);
    service.proceed();
    await expectAsync(firstValueFrom(service.activeStep$)).toBeResolvedTo(service.steps[3]);
  });

  it('should not proceed if notifications are not uploaded', async () => {
    spyOn(TestBed.inject(MeldungSubmitService), 'submitMeldung').and.returnValue(
      throwError(() => ({ progress: 100, error: 'something went wrong' }) as UploadProgress<IgsMeldung.OverviewResponse>)
    );
    const fileList = mockFileList([
      igsBatchFastqTestdata.items[0].data.fileOneName,
      igsBatchFastqTestdata.items[0].data.fileTwoName,
      igsBatchFastqTestdata.items[1].data.fileOneName,
      igsBatchFastqTestdata.items[1].data.fileTwoName,
      igsBatchFastqTestdata.items[2].data.fileOneName,
      igsBatchFastqTestdata.items[2].data.fileTwoName,
    ]);
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    service.proceed();
    service.attachFiles(fileList);
    service.proceed();
    expect(service.canProceed()).toBe(false);
  });

  it('should not proceed if results are shown', async () => {
    spyOn(TestBed.inject(DocumentReferenceService), 'createDocumentReference').and.returnValue(
      of({ sequenceUploadUrl: `https://igs.gateway/sequence-upload?fileRef=${Math.floor(Math.random() * 100000000)}` } as CreateDocumentReferenceResponse)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'uploadSequenceFileChunk').and.returnValue(
      Promise.resolve({ partNumber: 1, eTag: 'etag-value' } as ChunkUploadResponse)
    );
    spyOn(TestBed.inject(MeldungSubmitService), 'submitMeldung').and.returnValue(
      of({
        demisSequenceId: `IGS-${10000 + Math.floor(Math.random() * 89999)}-PLAP-${crypto.randomUUID()}`,
      } as MeldungSubmitResponse)
    );
    const fileList = mockFileList([
      igsBatchFastqTestdata.items[0].data.fileOneName,
      igsBatchFastqTestdata.items[0].data.fileTwoName,
      igsBatchFastqTestdata.items[1].data.fileOneName,
      igsBatchFastqTestdata.items[1].data.fileTwoName,
      igsBatchFastqTestdata.items[2].data.fileOneName,
      igsBatchFastqTestdata.items[2].data.fileTwoName,
    ]);
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    service.proceed();
    service.attachFiles(fileList);
    service.proceed();
    await service.uploadNotifications();
    service.proceed();
    expect(service.canProceed()).toBe(false);
    service.proceed();
    await expectAsync(firstValueFrom(service.activeStep$)).toBeResolvedTo(service.steps[3]);
  });

  it('should write errors associated with create document reference to rowErrorsSub$', async () => {
    const uploadTimestamps: string[] = [];
    spyOn(Date.prototype, 'toISOString').and.callFake(() => {
      uploadTimestamps.push(new Date().toLocaleString());
      return uploadTimestamps[uploadTimestamps.length - 1];
    });
    spyOn(TestBed.inject(DocumentReferenceService), 'createDocumentReference').and.throwError(
      new HttpErrorResponse({
        error: 'Error message',
        status: 500,
        statusText: 'Internal Server Error',
        url: 'https://igs.gateway/sequence-upload',
      })
    );
    const fileList = mockFileList([
      igsBatchFastqTestdata.items[0].data.fileOneName,
      igsBatchFastqTestdata.items[0].data.fileTwoName,
      igsBatchFastqTestdata.items[1].data.fileOneName,
      igsBatchFastqTestdata.items[1].data.fileTwoName,
      igsBatchFastqTestdata.items[2].data.fileOneName,
      igsBatchFastqTestdata.items[2].data.fileTwoName,
    ]);
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    service.proceed();
    service.attachFiles(fileList);
    expect(service.canProceed()).toBe(true);
    service.proceed();
    await service.uploadNotifications();
    const errorText = '500 Http failure response for https://igs.gateway/sequence-upload: 500 Internal Server Error';
    expect(service.rowErrorsSub$.value).toEqual([
      {
        rowNumber: 1,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
      {
        rowNumber: 2,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
      {
        rowNumber: 3,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
    ]);
  });

  it('should write errors associated with getFileUploadInfo to rowErrorsSub$', async () => {
    const uploadTimestamps: string[] = [];
    spyOn(Date.prototype, 'toISOString').and.callFake(() => {
      uploadTimestamps.push(new Date().toLocaleString());
      return uploadTimestamps[uploadTimestamps.length - 1];
    });
    spyOn(TestBed.inject(DocumentReferenceService), 'createDocumentReference').and.returnValue(
      of({
        sequenceUploadUrl: `https://igs.gateway/sequence-upload?fileRef=${Math.floor(Math.random() * 100000000)}`,
        documentReferenceId: 'docref-id',
      } as CreateDocumentReferenceResponse)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'getFileUploadInfo').and.throwError(
      new HttpErrorResponse({
        error: 'Error message',
        status: 400,
        statusText: 'Bad Request',
        url: 'https://igs.gateway/sequence-upload',
      })
    );
    const fileList = mockFileList([
      igsBatchFastqTestdata.items[0].data.fileOneName,
      igsBatchFastqTestdata.items[0].data.fileTwoName,
      igsBatchFastqTestdata.items[1].data.fileOneName,
      igsBatchFastqTestdata.items[1].data.fileTwoName,
      igsBatchFastqTestdata.items[2].data.fileOneName,
      igsBatchFastqTestdata.items[2].data.fileTwoName,
    ]);
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    service.proceed();
    service.attachFiles(fileList);
    expect(service.canProceed()).toBe(true);
    service.proceed();
    await service.uploadNotifications();
    const errorText = '400 Http failure response for https://igs.gateway/sequence-upload: 400 Bad Request';
    expect(service.rowErrorsSub$.value).toEqual([
      {
        rowNumber: 1,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
      {
        rowNumber: 2,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
      {
        rowNumber: 3,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
    ]);
  });

  it('should write errors associated with chunk upload to rowErrorsSub$', async () => {
    const uploadTimestamps: string[] = [];
    spyOn(Date.prototype, 'toISOString').and.callFake(() => {
      uploadTimestamps.push(new Date().toLocaleString());
      return uploadTimestamps[uploadTimestamps.length - 1];
    });
    spyOn(TestBed.inject(DocumentReferenceService), 'createDocumentReference').and.returnValue(
      of({
        sequenceUploadUrl: `https://igs.gateway/sequence-upload?fileRef=${Math.floor(Math.random() * 100000000)}`,
        documentReferenceId: 'docref-id',
      } as CreateDocumentReferenceResponse)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'getFileUploadInfo').and.returnValue(
      of({ uploadId: 'string', presignedUrls: [''], partSizeBytes: 1 } as UploadProcessInfo)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'uploadSequenceFileChunk').and.throwError(
      new HttpErrorResponse({
        error: 'Error message',
        status: 401,
        statusText: 'Unauthorized',
        url: 'https://igs.gateway/sequence-upload',
      })
    );
    const fileList = mockFileList([
      igsBatchFastqTestdata.items[0].data.fileOneName,
      igsBatchFastqTestdata.items[0].data.fileTwoName,
      igsBatchFastqTestdata.items[1].data.fileOneName,
      igsBatchFastqTestdata.items[1].data.fileTwoName,
      igsBatchFastqTestdata.items[2].data.fileOneName,
      igsBatchFastqTestdata.items[2].data.fileTwoName,
    ]);
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    service.proceed();
    service.attachFiles(fileList);
    expect(service.canProceed()).toBe(true);
    service.proceed();
    await service.uploadNotifications();
    const errorText = '401 Http failure response for https://igs.gateway/sequence-upload: 401 Unauthorized';
    expect(service.rowErrorsSub$.value).toEqual([
      {
        rowNumber: 1,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
      {
        rowNumber: 2,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
      {
        rowNumber: 3,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
    ]);
  });

  it('should write errors associated with finish upload to rowErrorsSub$', async () => {
    const uploadTimestamps: string[] = [];
    spyOn(Date.prototype, 'toISOString').and.callFake(() => {
      uploadTimestamps.push(new Date().toLocaleString());
      return uploadTimestamps[uploadTimestamps.length - 1];
    });
    spyOn(TestBed.inject(DocumentReferenceService), 'createDocumentReference').and.returnValue(
      of({
        sequenceUploadUrl: `https://igs.gateway/sequence-upload?fileRef=${Math.floor(Math.random() * 100000000)}`,
        documentReferenceId: 'docref-id',
      } as CreateDocumentReferenceResponse)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'getFileUploadInfo').and.returnValue(
      of({ uploadId: 'string', presignedUrls: [''], partSizeBytes: 1 } as UploadProcessInfo)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'uploadSequenceFileChunk').and.returnValue(
      Promise.resolve({ partNumber: 1, eTag: 'etag-value' } as ChunkUploadResponse)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'finishSequenceFileUpload').and.throwError(
      new HttpErrorResponse({
        error: 'Error message',
        status: 404,
        statusText: 'Not Found',
        url: 'https://igs.gateway/sequence-upload',
      })
    );
    const fileList = mockFileList([
      igsBatchFastqTestdata.items[0].data.fileOneName,
      igsBatchFastqTestdata.items[0].data.fileTwoName,
      igsBatchFastqTestdata.items[1].data.fileOneName,
      igsBatchFastqTestdata.items[1].data.fileTwoName,
      igsBatchFastqTestdata.items[2].data.fileOneName,
      igsBatchFastqTestdata.items[2].data.fileTwoName,
    ]);
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    service.proceed();
    service.attachFiles(fileList);
    expect(service.canProceed()).toBe(true);
    service.proceed();
    await service.uploadNotifications();
    const errorText = '404 Http failure response for https://igs.gateway/sequence-upload: 404 Not Found';
    expect(service.rowErrorsSub$.value).toEqual([
      {
        rowNumber: 1,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
      {
        rowNumber: 2,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
      {
        rowNumber: 3,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
    ]);
  });

  it('should write errors associated with initialize validation to rowErrorsSub$', async () => {
    const uploadTimestamps: string[] = [];
    spyOn(Date.prototype, 'toISOString').and.callFake(() => {
      uploadTimestamps.push(new Date().toLocaleString());
      return uploadTimestamps[uploadTimestamps.length - 1];
    });
    spyOn(TestBed.inject(DocumentReferenceService), 'createDocumentReference').and.returnValue(
      of({
        sequenceUploadUrl: `https://igs.gateway/sequence-upload?fileRef=${Math.floor(Math.random() * 100000000)}`,
        documentReferenceId: 'docref-id',
      } as CreateDocumentReferenceResponse)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'getFileUploadInfo').and.returnValue(
      of({ uploadId: 'string', presignedUrls: [''], partSizeBytes: 1 } as UploadProcessInfo)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'uploadSequenceFileChunk').and.returnValue(
      Promise.resolve({ partNumber: 1, eTag: 'etag-value' } as ChunkUploadResponse)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'finishSequenceFileUpload').and.returnValue(of({ status: 'SUCCESS' }));
    spyOn(TestBed.inject(SequenceUploadService), 'initValidation').and.throwError(
      new HttpErrorResponse({
        error: 'Error message',
        status: 403,
        statusText: 'Forbidden',
        url: 'https://igs.gateway/sequence-upload',
      })
    );
    const fileList = mockFileList([
      igsBatchFastqTestdata.items[0].data.fileOneName,
      igsBatchFastqTestdata.items[0].data.fileTwoName,
      igsBatchFastqTestdata.items[1].data.fileOneName,
      igsBatchFastqTestdata.items[1].data.fileTwoName,
      igsBatchFastqTestdata.items[2].data.fileOneName,
      igsBatchFastqTestdata.items[2].data.fileTwoName,
    ]);
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    service.proceed();
    service.attachFiles(fileList);
    expect(service.canProceed()).toBe(true);
    service.proceed();
    await service.uploadNotifications();
    const errorText = '403 Http failure response for https://igs.gateway/sequence-upload: 403 Forbidden';
    expect(service.rowErrorsSub$.value).toEqual([
      {
        rowNumber: 1,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
      {
        rowNumber: 2,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
      {
        rowNumber: 3,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
    ]);
  });

  it('should write errors associated with polling validation result to rowErrorsSub$', async () => {
    const uploadTimestamps: string[] = [];
    spyOn(Date.prototype, 'toISOString').and.callFake(() => {
      uploadTimestamps.push(new Date().toLocaleString());
      return uploadTimestamps[uploadTimestamps.length - 1];
    });
    spyOn(TestBed.inject(DocumentReferenceService), 'createDocumentReference').and.returnValue(
      of({
        sequenceUploadUrl: `https://igs.gateway/sequence-upload?fileRef=${Math.floor(Math.random() * 100000000)}`,
        documentReferenceId: 'docref-id',
      } as CreateDocumentReferenceResponse)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'getFileUploadInfo').and.returnValue(
      of({ uploadId: 'string', presignedUrls: [''], partSizeBytes: 1 } as UploadProcessInfo)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'uploadSequenceFileChunk').and.returnValue(
      Promise.resolve({ partNumber: 1, eTag: 'etag-value' } as ChunkUploadResponse)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'finishSequenceFileUpload').and.returnValue(of({ status: 'SUCCESS' }));
    spyOn(TestBed.inject(SequenceUploadService), 'initValidation').and.returnValue(Promise.resolve());
    spyOn(TestBed.inject(SequenceUploadService), 'pollSequenceValidationResult').and.throwError(
      new HttpErrorResponse({
        error: 'Error message',
        status: 405,
        statusText: 'Method Not Allowed',
        url: 'https://igs.gateway/sequence-upload',
      })
    );
    const fileList = mockFileList([
      igsBatchFastqTestdata.items[0].data.fileOneName,
      igsBatchFastqTestdata.items[0].data.fileTwoName,
      igsBatchFastqTestdata.items[1].data.fileOneName,
      igsBatchFastqTestdata.items[1].data.fileTwoName,
      igsBatchFastqTestdata.items[2].data.fileOneName,
      igsBatchFastqTestdata.items[2].data.fileTwoName,
    ]);
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    service.proceed();
    service.attachFiles(fileList);
    expect(service.canProceed()).toBe(true);
    service.proceed();
    await service.uploadNotifications();
    const errorText = '405 Http failure response for https://igs.gateway/sequence-upload: 405 Method Not Allowed';
    expect(service.rowErrorsSub$.value).toEqual([
      {
        rowNumber: 1,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
      {
        rowNumber: 2,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
      {
        rowNumber: 3,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
    ]);
  });

  it('should write error concerning invalid sequence data to rowErrorsSub$', async () => {
    const uploadTimestamps: string[] = [];
    spyOn(Date.prototype, 'toISOString').and.callFake(() => {
      uploadTimestamps.push(new Date().toLocaleString());
      return uploadTimestamps[uploadTimestamps.length - 1];
    });
    spyOn(TestBed.inject(DocumentReferenceService), 'createDocumentReference').and.returnValue(
      of({
        sequenceUploadUrl: `https://igs.gateway/sequence-upload?fileRef=${Math.floor(Math.random() * 100000000)}`,
        documentReferenceId: 'docref-id',
      } as CreateDocumentReferenceResponse)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'getFileUploadInfo').and.returnValue(
      of({ uploadId: 'string', presignedUrls: [''], partSizeBytes: 1 } as UploadProcessInfo)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'uploadSequenceFileChunk').and.returnValue(
      Promise.resolve({ partNumber: 1, eTag: 'etag-value' } as ChunkUploadResponse)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'finishSequenceFileUpload').and.returnValue(of({ status: 'SUCCESS' }));
    spyOn(TestBed.inject(SequenceUploadService), 'initValidation').and.returnValue(Promise.resolve());
    let message = 'Invalid sequence -> found invalid character in sequence line Nr. 2';
    spyOn(TestBed.inject(SequenceUploadService), 'pollSequenceValidationResult').and.returnValue(
      Promise.resolve({ documentReferenceId: 'docref-id', status: 'VALIDATION_FAILED', message: message })
    );
    const fileList = mockFileList([
      igsBatchFastqTestdata.items[0].data.fileOneName,
      igsBatchFastqTestdata.items[0].data.fileTwoName,
      igsBatchFastqTestdata.items[1].data.fileOneName,
      igsBatchFastqTestdata.items[1].data.fileTwoName,
      igsBatchFastqTestdata.items[2].data.fileOneName,
      igsBatchFastqTestdata.items[2].data.fileTwoName,
    ]);
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    service.proceed();
    service.attachFiles(fileList);
    expect(service.canProceed()).toBe(true);
    service.proceed();
    await service.uploadNotifications();
    const errorText = 'Die hochgeladene Sequenz ist nicht valide. Details: ' + message;
    expect(service.rowErrorsSub$.value).toEqual([
      {
        rowNumber: 1,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
      {
        rowNumber: 2,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
      {
        rowNumber: 3,
        errors: [{ text: errorText, queryString: SEARCH_STRINGS.sequenceValidation }],
        clipboardContent: errorText,
      } as UploadError,
    ]);
  });

  it('should get search string correct and put it to rowErrorsSub$', async () => {
    const uploadTimestamps: string[] = [];
    spyOn(Date.prototype, 'toISOString').and.callFake(() => {
      uploadTimestamps.push(new Date().toLocaleString());
      return uploadTimestamps[uploadTimestamps.length - 1];
    });
    spyOn(TestBed.inject(DocumentReferenceService), 'createDocumentReference').and.returnValue(
      of({
        sequenceUploadUrl: `https://igs.gateway/sequence-upload?fileRef=${Math.floor(Math.random() * 100000000)}`,
        documentReferenceId: 'docref-id',
      } as CreateDocumentReferenceResponse)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'getFileUploadInfo').and.returnValue(
      of({ uploadId: 'string', presignedUrls: [''], partSizeBytes: 1 } as UploadProcessInfo)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'uploadSequenceFileChunk').and.returnValue(
      Promise.resolve({ partNumber: 1, eTag: 'etag-value' } as ChunkUploadResponse)
    );
    spyOn(TestBed.inject(SequenceUploadService), 'finishSequenceFileUpload').and.returnValue(of({ status: 'SUCCESS' }));
    spyOn(TestBed.inject(SequenceUploadService), 'initValidation').and.returnValue(Promise.resolve());
    spyOn(TestBed.inject(SequenceUploadService), 'pollSequenceValidationResult').and.returnValue(
      Promise.resolve({ documentReferenceId: 'docref-id', status: 'VALID', message: 'valid' })
    );
    spyOn(TestBed.inject(MeldungSubmitService), 'submitMeldung').and.throwError(
      new HttpErrorResponse({
        status: 422,
        error: { detail: exampleOpperationOutcomeString },
      })
    );
    const fileList = mockFileList([
      igsBatchFastqTestdata.items[0].data.fileOneName,
      igsBatchFastqTestdata.items[0].data.fileTwoName,
      igsBatchFastqTestdata.items[1].data.fileOneName,
      igsBatchFastqTestdata.items[1].data.fileTwoName,
      igsBatchFastqTestdata.items[2].data.fileOneName,
      igsBatchFastqTestdata.items[2].data.fileTwoName,
    ]);
    service.useParsedCsvOverviewData(igsBatchFastqTestdata);
    service.proceed();
    service.attachFiles(fileList);
    expect(service.canProceed()).toBe(true);
    service.proceed();
    await service.uploadNotifications();

    expect(service.rowErrorsSub$.value).toEqual([
      {
        rowNumber: 1,
        errors: [{ text: 'Invalid value detected', queryString: SEARCH_STRINGS.profileValidation }],
        clipboardContent: exampleOpperationOutcomeString,
      } as UploadError,
      {
        rowNumber: 2,
        errors: [{ text: 'Invalid value detected', queryString: SEARCH_STRINGS.profileValidation }],
        clipboardContent: exampleOpperationOutcomeString,
      } as UploadError,
      {
        rowNumber: 3,
        errors: [{ text: 'Invalid value detected', queryString: SEARCH_STRINGS.profileValidation }],
        clipboardContent: exampleOpperationOutcomeString,
      } as UploadError,
    ]);
  });

  it('should initialize BehaviorSubjects with proceedToResultStep', async () => {
    const notificationUploads =
      '[{"rowNumber":1,"uploadTimestamp":"2025-01-31T09:19:08.815Z","demisNotificationId":"cbd091f6-7f7c-40aa-8557-9006d03b072a","labSequenceId":"Sample12346","demisSequenceId":"IGS-10234-SPNP-42C852B5-A378-4989-90D8-D6654C083B2F","status":"SUCCESS"},{"rowNumber":2,"demisNotificationId":"00000000-0000-0000-0000-000000000000","labSequenceId":"Sample12346","status":"ERROR"}]';
    localStorage.setItem(IgsLocalStorageKeys.NOTIFICATION_UPLOADS, notificationUploads);
    const uploadErrors = '[{"rowNumber":2,"errorText":["Die hochgeladene Sequenz ist nicht valide"],"furtherInformation":"SequenceValidationError"}]';
    localStorage.setItem(IgsLocalStorageKeys.UPLOAD_ERRORS, uploadErrors);

    service.proceedToResultStep();

    const notificationUploadSub = service['notificationUploadsSub$'] as BehaviorSubject<IgsMeldung.NotificationUploadInfo[]>;
    expect(notificationUploadSub.value).toEqual(JSON.parse(notificationUploads));

    const rowErrorsSub = service['rowErrorsSub$'] as BehaviorSubject<UploadError[]>;
    expect(rowErrorsSub.value).toEqual(JSON.parse(uploadErrors));

    const activeStepSub = service['activeStepSub$'] as BehaviorSubject<Step>;
    expect(activeStepSub.value).toEqual({ number: 4, title: 'Ergebnis', description: 'Zusammenfassung der Übermittlungen' });
  });

  it('should not start to send any notification if upload was canceled', async () => {
    const functionThatShouldNotBeCalled = spyOn<any>(service, 'uploadSingleNotification');
    spyOnProperty(service['uploadCanceled$'], 'value', 'get').and.returnValue(true);
    spyOnProperty(service['overviewDataSub$'], 'value', 'get').and.returnValue(igsBatchFastqTestdata);

    await service.uploadNotifications();

    expect(functionThatShouldNotBeCalled).not.toHaveBeenCalled();
  });

  it('should only upload one chunk and stop after upload was canceled', async () => {
    const uploadChunkFunctionSpy = spyOn(service['sequenceUploadService'], 'uploadSequenceFileChunk');
    const updateFileInfoFunctionSpy = spyOn<any>(service, 'updateFileUploadInfos');
    spyOn(service['sequenceUploadService'], 'getFileUploadInfo').and.returnValue(of(uploadProcessInfo[0]));
    spyOnProperty(service['uploadCanceled$'], 'value', 'get').and.returnValues(false, true);

    await service['uploadSingleSequenceFile'](uploadSequenceFileParams);

    expect(updateFileInfoFunctionSpy).toHaveBeenCalledTimes(2);
    expect(uploadChunkFunctionSpy).toHaveBeenCalledTimes(1);
  });

  it('should not validate sequence if upload was canceled', async () => {
    const functionThatShouldNotBeCalled = spyOn<any>(service, 'validateSequence');
    spyOn<any>(service, 'getDocumentReference').and.returnValue(uploadSequenceFileParams);
    spyOn<any>(service, 'uploadSingleSequenceFile').and.callFake;
    spyOnProperty(service['uploadCanceled$'], 'value', 'get').and.returnValue(true);

    await service['uploadSequenceFiles']([
      {
        file: new File(['dummy content'], 'example.txt', {
          type: 'text/plain',
        }),
        hash: 'testHash',
      },
    ]);

    expect(functionThatShouldNotBeCalled).not.toHaveBeenCalled();
  });

  it('should not send notification if upload was canceled', async () => {
    const functionThatShouldNotBeCalled = spyOn<any>(service, 'meldungSubmitService');
    spyOnProperty(service['uploadCanceled$'], 'value', 'get').and.returnValue(true);

    await service['submitNotification'](igsBatchFastqTestdata.items[0].data, [uploadSequenceFileParams]);

    expect(functionThatShouldNotBeCalled).not.toHaveBeenCalled();
  });

  it('should initialize local storage correctly when proceeding to results', () => {
    let resultEntries: IgsMeldung.NotificationUploadInfo[] = [
      {
        rowNumber: 1,
        demisNotificationId: 'notification 1',
        labSequenceId: 'lab sequence id 1',
        status: 'SUCCESS',
      },
      {
        rowNumber: 2,
        demisNotificationId: 'notification 2',
        labSequenceId: 'lab sequence id 2',
        status: 'PLANNED',
      },
      {
        rowNumber: 3,
        demisNotificationId: 'notification 3',
        labSequenceId: 'lab sequence id 3',
        status: 'PENDING',
      },
    ];
    localStorage.setItem(IgsLocalStorageKeys.NOTIFICATION_UPLOADS, JSON.stringify(resultEntries));

    service.proceedToResultStep();

    let initializedResultEntries = localStorage.getItem(IgsLocalStorageKeys.NOTIFICATION_UPLOADS);
    let expectedResultEntries: IgsMeldung.NotificationUploadInfo[] = [
      {
        rowNumber: 1,
        demisNotificationId: 'notification 1',
        labSequenceId: 'lab sequence id 1',
        status: 'SUCCESS',
      },
      {
        rowNumber: 2,
        demisNotificationId: 'notification 2',
        labSequenceId: 'lab sequence id 2',
        status: 'ABORTED',
      },
      {
        rowNumber: 3,
        demisNotificationId: 'notification 3',
        labSequenceId: 'lab sequence id 3',
        status: 'ABORTED',
      },
    ];
    expect(initializedResultEntries).toEqual(JSON.stringify(expectedResultEntries));
  });
});
