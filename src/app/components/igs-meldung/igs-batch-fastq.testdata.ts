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

import { IgsMeldung } from './igs-meldung.types';
import { UploadSequenceFileParams, UploadProcessInfo } from '../../../api/services/sequence-upload.service';

export const igsBatchFastqTestdata: IgsMeldung.OverviewResponse = {
  items: [
    {
      data: {
        rowNumber: 1,
        meldetatbestand: 'SPNP',
        species: 'Multiple drug-resistant Streptococcus pneumoniae (organism)',
        labSequenceId: 'Sample12346',
        demisNotificationId: '6cb7099d-8d53-4ee4-96ca-c55761b347d4',
        status: 'final',
        demisSequenceId: 'IGS-10243-SPNP-6cb7099d-8d53-4ee4-96ca-c55761b347d4',
        dateOfSampling: '2022-05-17T22:00:00.000+00:00',
        dateOfReceiving: '2023-03-02T23:00:00.000+00:00',
        dateOfSequencing: '2022-09-28T22:00:00.000+00:00',
        dateOfSubmission: '2023-11-30T23:00:00.000+00:00',
        sequencingInstrument: 'NextSeq_500',
        sequencingPlatform: 'ILLUMINA',
        sequencingStrategy: 'WGS',
        isolationSource: 'Cerebrospinal fluid specimen (specimen)',
        host: 'Homo sapiens',
        sex: 'male',
        birthdayMonth: '11',
        birthdayYear: '1970',
        sequencingReason: 'other',
        geographicLocation: '104',
        isolate: 'Beta_123',
        author: 'Babara Muster',
        nameAmpProtocol: 'AmpProtocol Alpha_7',
        primeDiagnosticLabDemisLabId: 'DEMIS-10666',
        primeDiagnosticLabName: 'Lab Ernst',
        primeDiagnosticLabAddress: 'Steinstr. 5',
        primeDiagnosticLabPostalCode: '10407',
        primeDiagnosticLabFederalState: 'Berlin',
        sequencingLabDemisLabId: 'DEMIS-10234',
        sequencingLabName: 'Labor Buchstabensalat',
        sequencingLabAddress: 'Lehmstr. 12',
        sequencingLabPostalCode: '42653',
        sequencingLabFederalState: 'Bayern',
        repositoryName: 'PubMLST',
        repositoryLink: 'https://pubmlst.org/1230423',
        repositoryId: '1230423',
        uploadDate: '2024-05-21T22:00:00.000+00:00',
        uploadStatus: 'Planned',
        uploadSubmitter: 'Thomas Stern',
        fileOneName: 'Sample12346_R1.fastq',
        fileOneSha256Sum: '7ecb8f9f902ed8b45ccf83a7bc974b36a4df8e7d2d87a981fc8bea2f68a323a6',
        fileTwoName: 'Sample12346_R2.fastq',
        fileTwoSha256Sum: 'f9a32e1d7c7554d2db2fafe53c239bd6de968979390ab3b914d5e179cec6ff13',
      },
    },
    {
      data: {
        rowNumber: 2,
        meldetatbestand: 'SPNP',
        species: 'Multiple drug-resistant Streptococcus pneumoniae (organism)',
        labSequenceId: 'Sample12347',
        demisNotificationId: '25cae3da-a8ae-4363-8475-6c24c897f099',
        status: 'preliminary',
        demisSequenceId: 'IGS-10234-SPNP-25cae3da-a8ae-4363-8475-6c24c897f099',
        dateOfSampling: '2022-07-05T22:00:00.000+00:00',
        dateOfReceiving: '2023-03-02T23:00:00.000+00:00',
        dateOfSequencing: '2022-09-28T22:00:00.000+00:00',
        dateOfSubmission: '2023-11-30T23:00:00.000+00:00',
        sequencingInstrument: 'NextSeq_500',
        sequencingPlatform: 'ILLUMINA',
        sequencingStrategy: 'WGS',
        isolationSource: 'Blood specimen (specimen)',
        host: 'Homo sapiens',
        sex: 'female',
        birthdayMonth: '10',
        birthdayYear: '1980',
        sequencingReason: 'other',
        geographicLocation: '413',
        isolate: 'Beta_124',
        author: 'Babara Muster',
        nameAmpProtocol: 'AmpProtocol Alpha_7',
        primeDiagnosticLabDemisLabId: 'DEMIS-10666',
        primeDiagnosticLabName: 'Lab Ernst',
        primeDiagnosticLabAddress: 'Steinstr. 5',
        primeDiagnosticLabPostalCode: '10407',
        primeDiagnosticLabFederalState: 'Berlin',
        sequencingLabDemisLabId: 'DEMIS-10234',
        sequencingLabName: 'Labor Buchstabensalat',
        sequencingLabAddress: 'Lehmstr. 12',
        sequencingLabPostalCode: '42653',
        sequencingLabFederalState: 'Bayern',
        repositoryName: 'PubMLST',
        repositoryLink: 'https://pubmlst.org/2141234',
        repositoryId: '2141234',
        uploadDate: '2024-05-21T22:00:00.000+00:00',
        uploadStatus: 'Planned',
        uploadSubmitter: 'Thomas Stern',
        fileOneName: 'Sample12347_R1.fastq',
        fileOneSha256Sum: '090a78cf3ff533272b22a1c853a1aff1f60f1aed99305262552824de36a4d06e',
        fileTwoName: 'Sample12347_R2.fastq',
        fileTwoSha256Sum: 'd740f315040bc8421b00419b30f7aba9d01f239f7efaa9677b4b1ff3b4aaa44e',
      },
    },
    {
      data: {
        rowNumber: 3,
        meldetatbestand: 'SPNP',
        species: 'Multiple drug-resistant Streptococcus pneumoniae (organism)',
        labSequenceId: 'Sample12348',
        demisNotificationId: '92687a30-8f6a-4e80-beca-78defe7af5e8',
        status: 'amended',
        demisSequenceId: 'IGS-10234-SPNP-92687a30-8f6a-4e80-beca-78defe7af5e8',
        dateOfSampling: '2023-01-23T23:00:00.000+00:00',
        dateOfReceiving: '2023-03-02T23:00:00.000+00:00',
        dateOfSequencing: '2023-08-23T22:00:00.000+00:00',
        dateOfSubmission: '2023-11-30T23:00:00.000+00:00',
        sequencingInstrument: 'NextSeq_500',
        sequencingPlatform: 'ILLUMINA',
        sequencingStrategy: 'WGS',
        isolationSource: 'Blood specimen (specimen)',
        host: 'Homo sapiens',
        sex: 'diverse',
        birthdayMonth: '9',
        birthdayYear: '1990',
        sequencingReason: 'other',
        geographicLocation: '820',
        isolate: 'Beta_125',
        author: 'Babara Muster',
        nameAmpProtocol: 'AmpProtocol Alpha_7',
        primeDiagnosticLabDemisLabId: 'DEMIS-10666',
        primeDiagnosticLabName: 'Lab Ernst',
        primeDiagnosticLabAddress: 'Steinstr. 5',
        primeDiagnosticLabPostalCode: '10407',
        primeDiagnosticLabFederalState: 'Berlin',
        sequencingLabDemisLabId: 'DEMIS-10234',
        sequencingLabName: 'Labor Buchstabensalat',
        sequencingLabAddress: 'Lehmstr. 12',
        sequencingLabPostalCode: '42653',
        sequencingLabFederalState: 'Bayern',
        repositoryName: 'PubMLST',
        repositoryLink: 'https://pubmlst.org/2348234',
        repositoryId: '2348234',
        uploadDate: '2024-05-21T22:00:00.000+00:00',
        uploadStatus: 'Accepted',
        uploadSubmitter: 'Thomas Stern',
        fileOneName: 'Sample12348_R1.fq.gz',
        fileOneSha256Sum: '198b3a461414526830704c5c60c89a8a43348e5e28a0cfe4e2e83567dabefca8',
        fileTwoName: 'Sample12348_R2.fq.gz',
        fileTwoSha256Sum: '777a95cd97382080bfeb78a5b0b56a6f43aa6b9f02618be37f7cd156edffe5da',
      },
    },
  ],
};

export const igsBatchFastqSequenzdateienSelectOverview: IgsMeldung.SequenzdateienSelectOverview[] = [
  {
    rowNumber: 1,
    labSequenceId: igsBatchFastqTestdata.items[0].data.labSequenceId,
    demisNotificationId: igsBatchFastqTestdata.items[0].data.demisNotificationId,
    dateOfSequencing: new Date(igsBatchFastqTestdata.items[0].data.dateOfSequencing),
    fileOneName: igsBatchFastqTestdata.items[0].data.fileOneName,
    fileTwoName: igsBatchFastqTestdata.items[0].data.fileTwoName,
  },
  {
    rowNumber: 2,
    labSequenceId: igsBatchFastqTestdata.items[1].data.labSequenceId,
    demisNotificationId: igsBatchFastqTestdata.items[1].data.demisNotificationId,
    dateOfSequencing: new Date(igsBatchFastqTestdata.items[1].data.dateOfSequencing),
    fileOneName: igsBatchFastqTestdata.items[1].data.fileOneName,
    fileTwoName: igsBatchFastqTestdata.items[1].data.fileTwoName,
  },
  {
    rowNumber: 3,
    labSequenceId: igsBatchFastqTestdata.items[2].data.labSequenceId,
    demisNotificationId: igsBatchFastqTestdata.items[2].data.demisNotificationId,
    dateOfSequencing: new Date(igsBatchFastqTestdata.items[2].data.dateOfSequencing),
    fileOneName: igsBatchFastqTestdata.items[2].data.fileOneName,
    fileTwoName: igsBatchFastqTestdata.items[2].data.fileTwoName,
  },
];

export const uploadSequenceFileParams: UploadSequenceFileParams = {
  sequenceUploadUrl: 'https://someUploadUrl',
  file: new File(['dummy content'], 'example.txt', {
    type: 'text/plain',
  }),
  documentReferenceId: 'SomeReferenceId',
};

export const uploadProcessInfo: UploadProcessInfo[] = [
  {
    presignedUrls: ['https://example.com/upload/chunk1', 'https://example.com/upload/chunk2'],
    partSizeBytes: 1024,
    uploadId: 'mockUploadId',
  },
];
