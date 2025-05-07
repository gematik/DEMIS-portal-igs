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

import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { NGXLogger } from 'ngx-logger';
import { ConfigService } from 'src/app/config.service';
import { MeldungSubmitService } from './meldung-submit.service';
import { IgsMeldung } from 'src/app/components/igs-meldung/igs-meldung.types';
import { firstValueFrom, of, throwError } from 'rxjs';

const mockOverviewData: IgsMeldung.OverviewData = {
  rowNumber: 1,
  meldetatbestand: 'Test Meldetatbestand',
  speciesCode: '12345',
  species: 'Test Species',
  labSequenceId: 'LAB123456',
  demisNotificationId: 'DEMIS123456',
  status: 'Test Status',
  demisSequenceId: 'SEQ123456',
  dateOfSampling: '2023-01-01',
  dateOfReceiving: '2023-01-02',
  dateOfSequencing: '2023-01-03',
  dateOfSubmission: '2023-01-04',
  sequencingInstrument: 'Test Instrument',
  sequencingPlatform: 'Test Platform',
  adapterSubstance: 'Test Adapter',
  primerSchemeSubstance: 'Test Primer',
  sequencingStrategy: 'Test Strategy',
  isolationSourceCode: 'ISO123',
  isolationSource: 'Test Source',
  host: 'Test Host',
  sex: 'Test Sex',
  birthdayMonth: '01',
  birthdayYear: '2000',
  sequencingReason: 'Test Reason',
  geographicLocation: 'Test Location',
  isolate: 'Test Isolate',
  author: 'Test Author',
  nameAmpProtocol: 'Test Protocol',
  primeDiagnosticLabDemisLabId: 'LAB123',
  primeDiagnosticLabName: 'Test Lab Name',
  primeDiagnosticLabAddress: 'Test Address',
  primeDiagnosticLabPostalCode: '12345',
  primeDiagnosticLabCity: 'Test City',
  primeDiagnosticLabFederalState: 'Test State',
  sequencingLabDemisLabId: 'SEQ123',
  sequencingLabName: 'Test Sequencing Lab',
  sequencingLabAddress: 'Test Sequencing Address',
  sequencingLabPostalCode: '54321',
  sequencingLabCity: 'Sequencing City',
  sequencingLabFederalState: 'Sequencing State',
  repositoryName: 'Test Repository',
  repositoryLink: 'http://testrepository.com',
  repositoryId: 'REPO123',
  uploadDate: '2023-01-05',
  uploadStatus: 'Test Status',
  uploadSubmitter: 'Test Submitter',
  fileOneName: 'file1.txt',
  fileOneSha256Sum: 'abc123',
  fileOneDocumentReference: 'docRef1',
  fileTwoName: 'file2.txt',
  fileTwoSha256Sum: 'def456',
  fileTwoDocumentReference: 'docRef2',
};

const mockResponse = {
  resourceType: 'Parameters',
  parameter: [
    {
      name: 'transactionID',
      valueIdentifier: {
        value: 'IGS-DEMIS-10234-SPNP-faf17c6d-2621-49b3-9652-d9e5214309b1',
      },
    },
    {
      name: 'submitterGeneratedNotificationID',
      valueIdentifier: {
        value: '6cb7099d-8d53-4ee4-96ca-c55761b347d4',
      },
    },
    {
      name: 'labSequenceID',
      valueIdentifier: {
        value: 'Sample12346',
      },
    },
    {
      resource: {
        resourceType: 'OperationOutcome',
        meta: {
          profile: ['https://demis.rki.de/fhir/StructureDefinition/ProcessNotificationResponse'],
        },
        text: {
          status: 'generated',
          div: '<div xmlns="http://www.w3.org/1999/xhtml"></div>',
        },
        issue: [
          {
            severity: 'information',
            code: 'informational',
            details: {
              text: 'All OK',
            },
          },
        ],
      },
    },
  ],
};

describe('MeldungSubmitService', () => {
  let service: MeldungSubmitService;
  let httpPostSpy: jasmine.Spy;

  beforeEach(() => MockBuilder(MeldungSubmitService).mock(NGXLogger).mock(HttpClient).provide(ConfigService));

  beforeEach(() => {
    service = TestBed.inject(MeldungSubmitService);
    spyOnProperty(TestBed.inject(ConfigService), 'igsGatewayUrl', 'get').and.returnValue('http://mocked-url.com');
    httpPostSpy = spyOn(TestBed.inject(HttpClient), 'post');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should submit a Meldung', async () => {
    httpPostSpy.and.returnValue(of(mockResponse));
    const response = await firstValueFrom(service.submitMeldung({ metadata: mockOverviewData }));

    expect(response).toEqual({
      igsId: 'IGS-DEMIS-10234-SPNP-faf17c6d-2621-49b3-9652-d9e5214309b1',
      meldungId: '6cb7099d-8d53-4ee4-96ca-c55761b347d4',
      laborId: 'Sample12346',
    });
  });

  it('should indicate an error', async () => {
    const error = new Error('something went wrong');
    httpPostSpy.and.returnValue(throwError(() => error));
    const errorLoggerSpy = spyOn(TestBed.inject(NGXLogger), 'error');

    await expectAsync(firstValueFrom(service.submitMeldung({ metadata: mockOverviewData }))).toBeRejectedWithError(error.message);
    expect(errorLoggerSpy).toHaveBeenCalledWith('submitMeldung failed', error);
  });
});
