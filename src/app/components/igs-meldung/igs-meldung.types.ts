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

import { FhirValidationResponse } from 'src/api/services/fhir-validation-response.types';

export namespace IgsMeldung {
  export type OverviewResponse = {
    items: OverviewParsedRowResult[];
  };

  export type OverviewParsedRowResult = {
    data: OverviewData;
  };

  export type OverviewData = {
    rowNumber: number;
    meldetatbestand?: string;
    speciesCode?: string;
    species?: string;
    labSequenceId: string;
    demisNotificationId: string;
    status?: string;
    demisSequenceId?: string;
    dateOfSampling?: string;
    dateOfReceiving?: string;
    dateOfSequencing: string;
    dateOfSubmission?: string;
    sequencingInstrument?: string;
    sequencingPlatform?: string;
    adapterSubstance?: string;
    primerSchemeSubstance?: string;
    sequencingStrategy?: string;
    isolationSourceCode?: string;
    isolationSource?: string;
    host?: string;
    sex?: string;
    birthdayMonth?: string;
    birthdayYear?: string;
    sequencingReason?: string;
    geographicLocation?: string;
    isolate?: string;
    author?: string;
    nameAmpProtocol?: string;
    primeDiagnosticLabDemisLabId?: string;
    primeDiagnosticLabName?: string;
    primeDiagnosticLabAddress?: string;
    primeDiagnosticLabPostalCode?: string;
    primeDiagnosticLabCity?: string;
    primeDiagnosticLabFederalState?: string;
    sequencingLabDemisLabId?: string;
    sequencingLabName?: string;
    sequencingLabAddress?: string;
    sequencingLabPostalCode?: string;
    sequencingLabCity?: string;
    sequencingLabFederalState?: string;
    repositoryName?: string;
    repositoryLink?: string;
    repositoryId?: string;
    uploadDate?: string;
    uploadStatus?: string;
    uploadSubmitter?: string;
    fileOneName: string;
    fileOneSha256Sum?: string;
    fileOneDocumentReference?: string;
    fileTwoName: string;
    fileTwoSha256Sum?: string;
    fileTwoDocumentReference?: string;
  };

  export type SequenzdateienSelectOverview = {
    rowNumber: number;
    labSequenceId: string;
    demisNotificationId: string;
    dateOfSequencing: Date;
    fileOneName: string;
    fileTwoName?: string;
    error?: Error;
  };

  export type UploadStatus = 'PLANNED' | 'WAITING' | 'PENDING' | 'SUCCESS' | 'ERROR' | 'ABORTED';

  export type SequenceValidationInfoStatus = 'VALIDATING' | 'VALID' | 'VALIDATION_FAILED' | 'VALIDATION_NOT_INITIATED';

  export type FileUploadInfo = {
    file: File;
    progress: number;
    status: UploadStatus | SequenceValidationInfoStatus;
    error?: string;
  };

  export type NotificationUploadInfo = {
    rowNumber: number;
    demisNotificationId: string;
    labSequenceId: string;
    status: UploadStatus;
    uploadTimestamp?: string;
    demisSequenceId?: string;
  };

  type ConcatenatedExportableNotificationUploadInfo = {
    [P in keyof Omit<NotificationUploadInfo, 'status'>]-?: NotificationUploadInfo[P];
  } & {
    errors: string;
    status: string;
  };

  export type ExportableNotificationUploadInfo = {
    [Property in keyof ConcatenatedExportableNotificationUploadInfo]: ConcatenatedExportableNotificationUploadInfo[Property];
  };

  export type FurtherInformation = 'SequenceValidationError' | 'ProfileValidationError' | 'Other';

  export type IgsError = {
    detail: string;
    errorReport: IgsErrorReport[];
    instance: string;
    status: number;
    title: string;
    type: string;
  };

  export type IgsErrorReport = {
    msg: string;
    columName?: string;
    errorCode?: string;
    foundValue?: string;
    rowNumber?: number;
  };
}
