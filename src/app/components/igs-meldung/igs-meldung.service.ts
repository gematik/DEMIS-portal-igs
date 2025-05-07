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

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { ErrorMessage, FileSizePipe, MessageDialogService, Step } from '@gematik/demis-portal-core-library';
import { NGXLogger } from 'ngx-logger';
import { BehaviorSubject, lastValueFrom, map, Subject } from 'rxjs';
import { CreateDocumentReferenceResponse, DocumentReferenceService } from 'src/api/services/document-reference.service';
import { MeldungSubmitService } from 'src/api/services/meldung-submit.service';
import { ChunkUploadResponse, SequenceUploadService, UploadSequenceFileChunkParams, UploadSequenceFileParams } from 'src/api/services/sequence-upload.service';
import { UploadProgress } from 'src/shared/shared-functions';
import { FhirValidationResponseService } from 'src/api/services/fhir-validation-response.service';
import { IgsMeldung } from './igs-meldung.types';

export enum IgsLocalStorageKeys {
  FILE_UPLOADS = 'IGS_FILE_UPLOADS',
  NOTIFICATION_UPLOADS = 'IGS_NOTIFICATION_UPLOADS',
  UPLOAD_ERRORS = 'IGS_UPLOAD_ERRORS',
}

export class SequenceUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SequenceUploadError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

declare type SequenceUploadInfo = {
  file: File | undefined;
  hash: string | undefined;
};

export type UploadError = {
  rowNumber: number;
  errors: ErrorMessage[];
  clipboardContent?: string;
};

const IGS_STEPS: Step[] = [
  {
    number: 1,
    title: 'Metadaten bereitstellen',
    description: 'Bereitstellung der Metadaten in tabellarischer Form',
  },
  {
    number: 2,
    title: 'Sequenzdateien auswählen',
    description: 'Bereitstellung der zugehörigen Sequenzdateien',
  },
  {
    number: 3,
    title: 'Status des Uploads',
    description: 'Hochladen der Sequenzdateien und Übermittlung an das RKI',
  },
  {
    number: 4,
    title: 'Ergebnis',
    description: 'Zusammenfassung der Übermittlungen',
  },
];

const IGS_INITIAL_STATE = {
  csvFile: null,
  activeStep: IGS_STEPS[0],
  overviewData: null,
  attachedFiles: [],
  fileUploads: [],
  notificationUploads: [],
  uploadErrors: [],
  uploadCanceled: true,
};

export const SEARCH_STRINGS = {
  profileValidation: 'Validierungsfehler Metadaten-Upload IGS',
  sequenceValidation: 'Validierungsfehler Sequenzdaten-Upload IGS',
  other: 'Validierungsfehler Sequenzdaten-Upload IGS',
};

const getSearchString = (type: string): string => {
  switch (type) {
    case 'ProfileValidationError':
      return SEARCH_STRINGS.profileValidation;
    case 'SequenceValidationError':
      return SEARCH_STRINGS.sequenceValidation;
    default:
      return SEARCH_STRINGS.sequenceValidation;
  }
};

@Injectable()
export class IgsMeldungService {
  private readonly csvFileSub$ = new BehaviorSubject<File | null>(IGS_INITIAL_STATE.csvFile);
  private readonly activeStepSub$ = new BehaviorSubject<Step>(IGS_INITIAL_STATE.activeStep);
  private readonly overviewDataSub$ = new BehaviorSubject<IgsMeldung.OverviewResponse | null>(IGS_INITIAL_STATE.overviewData);
  private readonly attachedFilesSub$ = new BehaviorSubject<File[]>(IGS_INITIAL_STATE.attachedFiles);
  private readonly fileUploadsSub$ = new BehaviorSubject<IgsMeldung.FileUploadInfo[]>(IGS_INITIAL_STATE.fileUploads);
  private readonly notificationUploadsSub$ = new BehaviorSubject<IgsMeldung.NotificationUploadInfo[]>(IGS_INITIAL_STATE.notificationUploads);
  private readonly uploadCanceled$ = new BehaviorSubject<boolean>(IGS_INITIAL_STATE.uploadCanceled);
  private readonly uploadCanceledSubject = new Subject<boolean>();
  private readonly lastBatchUploadFinishedAt_Trigger: WritableSignal<Date | undefined> = signal(undefined);

  readonly lastBatchUploadFinishedAt: Signal<Date | undefined> = computed(() => this.lastBatchUploadFinishedAt_Trigger());
  readonly rowErrorsSub$ = new BehaviorSubject<UploadError[]>([]);

  readonly csvFile$ = this.csvFileSub$.asObservable();
  readonly activeStep$ = this.activeStepSub$.asObservable();
  readonly overviewData$ = this.overviewDataSub$.asObservable();
  readonly sequenceFileSelectionOverviewData$ = this.overviewDataSub$.asObservable().pipe(
    map(overviewData =>
      !overviewData
        ? []
        : overviewData.items.map(
            item =>
              ({
                rowNumber: item.data.rowNumber,
                dateOfSequencing: new Date(item.data.dateOfSequencing),
                demisNotificationId: item.data.demisNotificationId,
                labSequenceId: item.data.labSequenceId,
                fileOneName: item.data.fileOneName,
                fileTwoName: item.data.fileTwoName,
              }) as IgsMeldung.SequenzdateienSelectOverview
          )
    )
  );
  readonly attachedFiles$ = this.attachedFilesSub$.asObservable();
  readonly fileUploads$ = this.fileUploadsSub$.asObservable();
  readonly notificationUploads$ = this.notificationUploadsSub$.asObservable();

  private readonly maxFileSizeBytes = 1047527424;
  private readonly messageDialogService = inject(MessageDialogService);
  private readonly logger = inject(NGXLogger);
  private readonly fileSizePipe = new FileSizePipe();
  private readonly documentReferenceService = inject(DocumentReferenceService);
  private readonly sequenceUploadService = inject(SequenceUploadService);
  private readonly meldungSubmitService = inject(MeldungSubmitService);
  private readonly fhirValidationResponseService = inject(FhirValidationResponseService);

  get steps() {
    return IGS_STEPS;
  }

  proceed() {
    const currentStepIndex = IGS_STEPS.indexOf(this.activeStepSub$.value);
    if (currentStepIndex < IGS_STEPS.length - 1 && this.canProceed()) {
      this.activeStepSub$.next(IGS_STEPS[currentStepIndex + 1]);
    }
  }

  proceedToResultStep() {
    this.initializeNotificationUploadInfoFromLocalStorage();
    this.initializeUploadErrorsFromLocalStorage();
    this.activeStepSub$.next(IGS_STEPS[IGS_STEPS.length - 1]);
  }

  lastResultsAvailable(): boolean {
    let notificationUploadInfoJson = localStorage.getItem(IgsLocalStorageKeys.NOTIFICATION_UPLOADS);
    if (notificationUploadInfoJson && notificationUploadInfoJson.length > 0) {
      return true;
    }
    return false;
  }

  canProceed(): boolean {
    const currentStepIndex = IGS_STEPS.indexOf(this.activeStepSub$.value);
    switch (currentStepIndex) {
      case 0:
        return this.csvFileParsed();
      case 1:
        return this.allSequenceFilesAttached();
      case 2:
        return (
          this.overviewDataSub$.value?.items?.length === this.notificationUploadsSub$.value.length &&
          this.notificationUploadsSub$.value.every(item => ['SUCCESS', 'ERROR'].includes(item.status))
        );
      default:
        return false;
    }
  }

  cancel() {
    this.notificationUploadsSub$.value.forEach(notification => {
      if (notification.status === 'PLANNED' || notification.status === 'PENDING') {
        notification.status = 'ABORTED';
      }
    });
    localStorage.setItem(IgsLocalStorageKeys.NOTIFICATION_UPLOADS, JSON.stringify(this.notificationUploadsSub$.value));
    this.activeStepSub$.next(IGS_STEPS[3]);
    this.uploadCanceled$.next(true);
    this.uploadCanceledSubject.next(true);
  }

  backToWelcome() {
    this.csvFileSub$.next(null);
    this.activeStepSub$.next(IGS_STEPS[0]);
    this.overviewDataSub$.next(null);
    this.attachedFilesSub$.next([]);
    this.fileUploadsSub$.next([]);
    this.notificationUploadsSub$.next([]);
    this.rowErrorsSub$.next([]);
    this.uploadCanceled$.next(true);
  }

  clearCsvFile() {
    this.csvFileSub$.next(null);
  }

  useCsvFile(file: File) {
    this.csvFileSub$.next(file);
  }

  useParsedCsvOverviewData(overviewData: IgsMeldung.OverviewResponse) {
    this.overviewDataSub$.next(overviewData);
  }

  attachFiles(files: FileList) {
    const matchedFiles = [] as File[];
    const errors = signal([] as ErrorMessage[]);
    for (const element of Array.from(files)) {
      const file = element;
      const item = this.overviewDataSub$.value?.items?.find(item => item.data.fileOneName === file.name || item.data.fileTwoName === file.name);
      if (!item) {
        errors.update(current => [...current, { text: `Die ausgewählte Datei ${file.name} stimmt mit keinem Element in den Metadaten überein.` }]);
        this.logger.error('File does not match any item in the overview data', file);
        continue;
      }
      if (file.size > this.maxFileSizeBytes) {
        errors.update(current => [
          ...current,
          {
            text: `Die ausgewählte Sequenzdatei ${file.name} ist größer als das Upload-Limit ${this.fileSizePipe.transform(this.maxFileSizeBytes)}.`,
          },
        ]);
        continue;
      }
      if (this.attachedFilesSub$.value.some(attachedFile => attachedFile.name === file.name)) {
        this.logger.warn(`File ${file.name} already attached. Skipping.`, file);
        continue;
      }
      matchedFiles.push(file);
    }
    this.attachedFilesSub$.next([...this.attachedFilesSub$.value, ...matchedFiles]);
    if (errors().length > 0) {
      this.messageDialogService.showErrorDialog({
        errorTitle: 'Fehler beim Anhängen von Dateien',
        errors: errors(),
      });
    }
    this.logger.debug('Attached files', this.attachedFilesSub$.value);
  }

  isAttached(fileName: string): boolean {
    return this.attachedFilesSub$.value.some(file => file.name === fileName);
  }

  async uploadNotifications() {
    this.logger.debug('Start uploading notifications');
    this.uploadCanceled$.next(false);

    this.initializeDataStructures();

    const notifications = this.overviewDataSub$.value?.items;
    if (!notifications || notifications.length === 0) {
      this.logger.error('No notifications to upload');
      return;
    }

    // Upload all notifications one by one
    for (const notification of notifications) {
      if (this.uploadCanceled$.value) {
        break;
      }
      try {
        await this.uploadSingleNotification(notification.data);
      } catch (err: any) {
        this.updateNotificationUploadInfo(notification.data, {
          rowNumber: notification.data.rowNumber,
          demisNotificationId: notification.data.demisNotificationId,
          labSequenceId: notification.data.labSequenceId,
          status: this.uploadCanceled$.value ? 'ABORTED' : 'ERROR',
        });
        this.handleError(err, notification.data);
        this.logger.error('Error uploading notification', err);
      }
    }

    this.lastBatchUploadFinishedAt_Trigger.update(() => new Date());
    this.logger.debug('Finished uploading notifications');
  }

  private initializeDataStructures() {
    localStorage.setItem(IgsLocalStorageKeys.UPLOAD_ERRORS, JSON.stringify(IGS_INITIAL_STATE.uploadErrors));
    this.rowErrorsSub$.next(IGS_INITIAL_STATE.uploadErrors);

    localStorage.setItem(IgsLocalStorageKeys.FILE_UPLOADS, JSON.stringify(IGS_INITIAL_STATE.fileUploads));
    this.fileUploadsSub$.next(IGS_INITIAL_STATE.fileUploads);

    const overviewParsedRowResults = this.overviewDataSub$.value?.items;
    overviewParsedRowResults?.forEach(overviewParsedRowResult => {
      let notification = overviewParsedRowResult.data;
      this.notificationUploadsSub$.next([
        ...this.notificationUploadsSub$.value,
        {
          rowNumber: notification.rowNumber,
          demisNotificationId: notification.demisNotificationId,
          labSequenceId: notification.labSequenceId,
          status: 'PLANNED',
        } as IgsMeldung.NotificationUploadInfo,
      ]);
    });
    localStorage.setItem(IgsLocalStorageKeys.NOTIFICATION_UPLOADS, JSON.stringify(this.notificationUploadsSub$.value));
    this.uploadCanceled$.next(false);
  }

  getSequenceFileUploadInfo(fileName: string) {
    return (
      this.fileUploadsSub$.value.find(fileUploadInfo => fileUploadInfo.file.name === fileName) ??
      ({
        file: { name: fileName },
        progress: 0,
        status: 'WAITING',
      } as IgsMeldung.FileUploadInfo)
    );
  }

  getNotificationUploadStatus(notification: IgsMeldung.OverviewData) {
    return (
      this.notificationUploadsSub$.value.find(notificationUploadInfo => notificationUploadInfo.rowNumber === notification.rowNumber) ??
      ({
        rowNumber: notification.rowNumber,
        demisNotificationId: notification.demisNotificationId,
        labSequenceId: notification.labSequenceId,
        status: 'WAITING',
      } as IgsMeldung.NotificationUploadInfo)
    );
  }

  private csvFileParsed() {
    return !!this.overviewDataSub$.value;
  }

  private allSequenceFilesAttached() {
    return (
      this.overviewDataSub$.value?.items?.every(
        item => this.isAttached(item.data.fileOneName) && (!item.data.fileTwoName || (!!item.data.fileTwoName && this.isAttached(item.data.fileTwoName)))
      ) ?? false
    );
  }

  private getDocumentReference(sequenceFile: File, fileHash: string) {
    try {
      return lastValueFrom(
        this.documentReferenceService.createDocumentReference({ fileHash }).pipe(
          map(
            (createDocumentReferenceResponse: CreateDocumentReferenceResponse) =>
              ({
                file: sequenceFile,
                sequenceUploadUrl: createDocumentReferenceResponse.sequenceUploadUrl,
                documentReferenceId: createDocumentReferenceResponse.documentReferenceId,
              }) as UploadSequenceFileParams
          )
        )
      );
    } catch (err: any) {
      this.logger.error('Error creating document reference for sequence file', sequenceFile, err);
      throw err;
    }
  }

  private async uploadSingleSequenceFile(uploadSequenceFileParams: UploadSequenceFileParams) {
    if (!uploadSequenceFileParams.documentReferenceId) {
      this.logger.error('Cannot uploaded sequence file without a DocumentReferenceId.', uploadSequenceFileParams.file);
      throw new Error(`Die Sequenzdatei "${uploadSequenceFileParams.file.name}" kann nicht ohne DocumentReferenceId hochgeladen werden.`);
    }

    let fileUploadInfo;
    try {
      fileUploadInfo = await lastValueFrom(
        this.sequenceUploadService.getFileUploadInfo(uploadSequenceFileParams.documentReferenceId, uploadSequenceFileParams.file.size)
      );
    } catch (err: any) {
      this.logger.error('Error getting file upload info for sequence file', uploadSequenceFileParams.file, err);
      throw err;
    }
    const chunkUploadResponses: ChunkUploadResponse[] = [];

    this.updateFileUploadInfos(this.buildFileUploadInfo(uploadSequenceFileParams, { progress: 0 }));

    for (let [index, presignedUrl] of fileUploadInfo.presignedUrls.entries()) {
      if (this.uploadCanceled$.value) {
        return;
      }
      const uploadSequenceFileChunkParams: UploadSequenceFileChunkParams = {
        presignedUrl,
        file: uploadSequenceFileParams.file,
        partSizeBytes: fileUploadInfo.partSizeBytes,
        partNo: index + 1,
      };

      // TODO: Refactor this in order to allow for parallel uploads
      const chunkUploadResponse: ChunkUploadResponse = await this.sequenceUploadService.uploadSequenceFileChunk(uploadSequenceFileChunkParams);
      const chunksUploaded: number = chunkUploadResponses.push(chunkUploadResponse);
      const chunkUploadProgress = Math.round((chunksUploaded / fileUploadInfo.presignedUrls.length) * 100);
      this.updateFileUploadInfos(this.buildFileUploadInfo(uploadSequenceFileParams, { progress: chunkUploadProgress }));
    }

    this.logger.debug('Uploaded all file chunks');

    try {
      return lastValueFrom(
        this.sequenceUploadService.finishSequenceFileUpload({
          documentReferenceId: uploadSequenceFileParams.documentReferenceId,
          uploadId: fileUploadInfo.uploadId,
          completedChunks: chunkUploadResponses,
        })
      );
    } catch (err: any) {
      this.logger.error('Error finishing sequence file upload', uploadSequenceFileParams.file, err);
      throw err;
    }
  }

  private async uploadSequenceFiles(sequenceUploadInfos: SequenceUploadInfo[]): Promise<UploadSequenceFileParams[]> {
    const uploadSequenceFileParamsList: UploadSequenceFileParams[] = [];
    for (const sequenceUploadInfo of sequenceUploadInfos) {
      // Since file two is optional, we only upload if the file property is defined
      if (sequenceUploadInfo.file) {
        if (!sequenceUploadInfo.hash) {
          this.logger.error('No hash value given for file', sequenceUploadInfo.file);
          throw new Error(`Für die Sequenzdatei "${sequenceUploadInfo.file.name}" ist kein Hash-Wert angegeben.`);
        }

        let uploadSequenceFileParams = {
          sequenceUploadUrl: '',
          file: sequenceUploadInfo.file,
          documentReferenceId: undefined,
        } as UploadSequenceFileParams;
        try {
          uploadSequenceFileParams = await this.getDocumentReference(sequenceUploadInfo.file, sequenceUploadInfo.hash);
          this.logger.debug('Determined upload sequence file params', uploadSequenceFileParamsList);

          await this.uploadSingleSequenceFile(uploadSequenceFileParams);
        } catch (err: any) {
          this.logger.error('Error uploading sequence file', err);
          this.updateFileUploadInfos(this.buildFileUploadInfo(uploadSequenceFileParams, { progress: 100, error: err.message }));
          throw err;
        }

        if (this.uploadCanceled$.value) {
          break;
        }
        this.logger.debug('sequence upload finished');

        const { file, documentReferenceId } = uploadSequenceFileParams;

        if (!documentReferenceId) {
          this.logger.error('No documentReferenceId for file', file);
          throw new Error(`Für die Sequenzdatei "${sequenceUploadInfo.file.name}" ist keine DocumentReferenceId vorhanden.`);
        }

        await this.validateSequence(file, documentReferenceId);

        uploadSequenceFileParamsList.push(uploadSequenceFileParams);
      }
    }
    return uploadSequenceFileParamsList;
  }

  private buildFileUploadInfo(uploadSequenceFileParams: UploadSequenceFileParams, uploadStatus: UploadProgress<any>) {
    let fileUploadInfo = {
      file: uploadSequenceFileParams.file,
      status: 'PENDING',
      progress: uploadStatus.progress,
    } as IgsMeldung.FileUploadInfo;

    // Handle finished upload processes
    if (uploadStatus.progress === 100) {
      fileUploadInfo = {
        ...fileUploadInfo,
        status: 'SUCCESS',
      };
      if (!!uploadStatus.error) {
        fileUploadInfo = {
          ...fileUploadInfo,
          status: 'ERROR',
          error: uploadStatus.error,
        };
      }
      this.logger.debug(`Sequence file upload ended with ${fileUploadInfo.status}`, uploadStatus);
    }
    return fileUploadInfo;
  }

  private updateFileUploadInfos(newFileUploadInfo: IgsMeldung.FileUploadInfo) {
    // Build updated file upload collection
    let updatedFileUploads = [...this.fileUploadsSub$.value];
    const existingFileUploadInfo = updatedFileUploads.find(fileUploadInfo => fileUploadInfo.file.name === newFileUploadInfo.file.name);
    if (!existingFileUploadInfo) {
      // Add file upload process, if not already present
      updatedFileUploads.push(newFileUploadInfo);
    } else {
      // Update file upload process, if already present
      updatedFileUploads = updatedFileUploads.map(fileUploadInfo =>
        fileUploadInfo.file.name === newFileUploadInfo.file.name ? newFileUploadInfo : fileUploadInfo
      );
    }

    // publish updated file upload collection
    this.logger.debug('Updated file uploads', updatedFileUploads);
    localStorage.setItem(
      IgsLocalStorageKeys.FILE_UPLOADS,
      JSON.stringify(updatedFileUploads.map(fileUploadInfo => ({ ...fileUploadInfo, file: fileUploadInfo.file.name })))
    );
    this.fileUploadsSub$.next(updatedFileUploads);
  }

  private async validateSequence(file: File, documentReferenceId: string): Promise<void> {
    this.updateFileUploadInfos({ file, progress: 0, status: 'VALIDATING' });

    let validationInfo;
    try {
      await this.sequenceUploadService.initValidation(documentReferenceId);
      validationInfo = await this.sequenceUploadService.pollSequenceValidationResult(documentReferenceId, this.uploadCanceledSubject);
    } catch (err: any) {
      this.logger.error('Error validating sequence file', file, err);
      this.updateFileUploadInfos({ file, progress: 100, status: 'ERROR', error: err });
      throw err;
    }

    switch (validationInfo.status) {
      case 'VALID':
        this.updateFileUploadInfos({ file, progress: 100, status: 'VALID' });
        return;
      case 'VALIDATION_FAILED':
        this.logger.error('Sequence file validation failed', file, validationInfo);
        this.updateFileUploadInfos({ file, progress: 100, status: 'ERROR', error: `Sequence file validation failed. ${validationInfo.message}` });
        throw new SequenceUploadError('Die hochgeladene Sequenz ist nicht valide. Details: ' + validationInfo.message);
      case 'VALIDATING':
        this.logger.error('Sequence file validation took too long', file, validationInfo);
        this.updateFileUploadInfos({ file, progress: 100, status: 'ERROR', error: `Sequence file validation took too long. ${validationInfo.message}` });
        throw new SequenceUploadError('Die Sequenz konnte nicht in der vorgegebenen Zeit validiert werden');
      default:
        this.logger.error('Sequence file validation failed with unknown error', file, validationInfo);
        this.updateFileUploadInfos({
          file,
          progress: 100,
          status: 'ERROR',
          error: `Sequence file validation failed with unknown error. ${validationInfo.message}`,
        });
        throw new SequenceUploadError('Unbekannter Fehler bei der Sequenzvalidierung');
    }
  }

  private async submitNotification(notification: IgsMeldung.OverviewData, uploadSequenceFileParamsList: UploadSequenceFileParams[]) {
    if (this.uploadCanceled$.value) {
      return;
    }
    this.logger.debug('Submitting notification', notification);
    try {
      const demisSequenceId = await lastValueFrom(
        this.meldungSubmitService
          .submitMeldung({
            metadata: {
              ...notification,
              fileOneDocumentReference: uploadSequenceFileParamsList.find(p => p.file.name === notification.fileOneName)?.documentReferenceId,
              fileTwoDocumentReference: uploadSequenceFileParamsList.find(p => p.file.name === notification.fileTwoName)?.documentReferenceId,
            },
          })
          .pipe(map(response => response.igsId))
      );
      return demisSequenceId;
    } catch (err: any) {
      this.logger.error('Error submitting notification', notification, err);
      this.handleSubmitNotificationError(err, notification);
      throw new Error(`Die Meldung konnte nicht übermittelt werden.`);
    }
  }

  private handleSubmitNotificationError(err: any, notification: IgsMeldung.OverviewData) {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 422 && err.error?.detail.startsWith('{')) {
        const operationOutcome = this.fhirValidationResponseService.parseStringifiedFhirValidationResponse(err.error.detail);
        const errors = this.fhirValidationResponseService.getErrorDiagnostics(operationOutcome);
        this.rowErrorsSub$.next([
          ...this.rowErrorsSub$.value,
          {
            rowNumber: notification.rowNumber,
            errors: errors.map(message => ({
              text: message,
              queryString: getSearchString('ProfileValidationError'),
            })),
            clipboardContent: JSON.stringify(this.fhirValidationResponseService.parseStringifiedFhirValidationResponse(err.error.detail), null, 2),
          },
        ]);
      } else {
        this.rowErrorsSub$.next([
          ...this.rowErrorsSub$.value,
          {
            rowNumber: notification.rowNumber,
            errors: [
              {
                text: err.error?.detail,
                queryString: getSearchString('Other'),
              },
            ],
            clipboardContent: err.error?.detail,
          },
        ]);
      }
    }
  }

  private handleError(err: any, notification: IgsMeldung.OverviewData) {
    if (err instanceof SequenceUploadError) {
      this.rowErrorsSub$.next([
        ...this.rowErrorsSub$.value,
        {
          rowNumber: notification.rowNumber,
          errors: [
            {
              text: err.message,
              queryString: getSearchString('SequenceValidationError'),
            },
          ],
          clipboardContent: err.message,
        },
      ]);
    } else if (err instanceof HttpErrorResponse) {
      this.rowErrorsSub$.next([
        ...this.rowErrorsSub$.value,
        {
          rowNumber: notification.rowNumber,
          errors: [
            {
              text: err.status + ' ' + err.message,
              queryString: getSearchString('Other'),
            },
          ],
          clipboardContent: err.status + ' ' + err.message,
        },
      ]);
    }
    localStorage.setItem(IgsLocalStorageKeys.UPLOAD_ERRORS, JSON.stringify(this.rowErrorsSub$.value));
  }

  private updateNotificationUploadInfo(notification: IgsMeldung.OverviewData, result: IgsMeldung.NotificationUploadInfo) {
    const updatedNotificationUploads = this.notificationUploadsSub$.value.map(notificationUpload =>
      notificationUpload.rowNumber === notification.rowNumber ? result : notificationUpload
    );
    localStorage.setItem(IgsLocalStorageKeys.NOTIFICATION_UPLOADS, JSON.stringify(updatedNotificationUploads));
    this.notificationUploadsSub$.next(updatedNotificationUploads);
  }

  private async uploadSingleNotification(notification: IgsMeldung.OverviewData) {
    this.logger.debug('Uploading single notification', notification);

    this.updateNotificationUploadInfo(notification, {
      rowNumber: notification.rowNumber,
      demisNotificationId: notification.demisNotificationId,
      labSequenceId: notification.labSequenceId,
      status: 'PENDING',
    });

    const sequenceUploadInfos = [
      {
        file: this.attachedFilesSub$.value.find(attachedFile => attachedFile.name === notification.fileOneName),
        hash: notification.fileOneSha256Sum,
      },
      {
        file: this.attachedFilesSub$.value.find(attachedFile => attachedFile.name === notification.fileTwoName),
        hash: notification.fileTwoSha256Sum,
      },
    ];

    const uploadSequenceFileParamsList = await this.uploadSequenceFiles(sequenceUploadInfos);

    const demisSequenceId = await this.submitNotification(notification, uploadSequenceFileParamsList);

    const result: IgsMeldung.NotificationUploadInfo = {
      rowNumber: notification.rowNumber,
      uploadTimestamp: this.uploadCanceled$.value ? '' : new Date().toISOString(),
      demisNotificationId: notification.demisNotificationId,
      labSequenceId: notification.labSequenceId,
      demisSequenceId,
      status: this.determineUploadStatus(demisSequenceId),
    };

    this.updateNotificationUploadInfo(notification, result);

    this.logger.debug('Submitted notification and got following result', result);
  }

  private determineUploadStatus(demisSequenceId: string | undefined): IgsMeldung.UploadStatus {
    if (demisSequenceId) {
      return 'SUCCESS';
    } else if (this.uploadCanceled$.value) {
      return 'ABORTED';
    } else {
      return 'ERROR';
    }
  }

  private initializeNotificationUploadInfoFromLocalStorage() {
    let notificationUploadInfoJson = localStorage.getItem(IgsLocalStorageKeys.NOTIFICATION_UPLOADS);
    let notificationUploadInfos: IgsMeldung.NotificationUploadInfo[] = [];
    if (notificationUploadInfoJson) {
      notificationUploadInfos = JSON.parse(notificationUploadInfoJson);
      notificationUploadInfos.forEach(resultEntry => {
        if (resultEntry.status === 'PLANNED' || resultEntry.status === 'PENDING') {
          resultEntry.status = 'ABORTED';
        }
        localStorage.setItem(IgsLocalStorageKeys.NOTIFICATION_UPLOADS, JSON.stringify(notificationUploadInfos));
      });
    }
    this.notificationUploadsSub$.next(notificationUploadInfos);
  }

  private initializeUploadErrorsFromLocalStorage() {
    const uploadErrorsString = localStorage.getItem(IgsLocalStorageKeys.UPLOAD_ERRORS);
    let uploadErrors: UploadError[] = [];
    if (uploadErrorsString) {
      uploadErrors = JSON.parse(uploadErrorsString);
    }
    this.rowErrorsSub$.next(uploadErrors);
  }
}
