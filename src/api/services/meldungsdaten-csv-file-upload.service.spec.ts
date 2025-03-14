/*
 Copyright (c) 2025 gematik GmbH
 Licensed under the EUPL, Version 1.2 or - as soon they will be approved by
 the European Commission - subsequent versions of the EUPL (the "Licence");
 You may not use this work except in compliance with the Licence.
    You may obtain a copy of the Licence at:
    https://joinup.ec.europa.eu/software/page/eupl
        Unless required by applicable law or agreed to in writing, software
 distributed under the Licence is distributed on an "AS IS" basis,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the Licence for the specific language governing permissions and
 limitations under the Licence.
 */

import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { NGXLogger } from 'ngx-logger';
import { lastValueFrom } from 'rxjs';
import { UploadProgress } from 'src/shared/shared-functions';
import { igsBatchFastqTestdata } from '../../app/components/igs-meldung/igs-batch-fastq.testdata';
import { IgsMeldung } from '../../app/components/igs-meldung/igs-meldung.types';
import { ConfigService } from '../../app/config.service';
import { fromSimulatedUploadProgess, toSimulatedUpload } from '../../test/utility/utility-functions';
import { MeldungsdatenCsvFileUploadService } from './meldungsdaten-csv-file-upload.service';

describe('MeldungsdatenCsvFileUploadService', () => {
  let service: MeldungsdatenCsvFileUploadService;
  let httpClient: HttpClient;

  beforeEach(() => MockBuilder(MeldungsdatenCsvFileUploadService).mock(HttpClient).mock(ConfigService).mock(NGXLogger).keep(HttpTestingController));

  it('should upload a CSV file and return the response', async () => {
    TestBed.overrideProvider(ConfigService, { useValue: { igsGatewayUrl: 'http://gateway.igs' } });
    service = TestBed.inject(MeldungsdatenCsvFileUploadService);
    httpClient = TestBed.inject(HttpClient);
    const file = new File(['dummy file content'], 'test.csv', { type: 'text/csv' });
    const mockResponse: UploadProgress<IgsMeldung.OverviewResponse> = {
      progress: 100,
      payload: igsBatchFastqTestdata,
    };
    const postSpy = spyOn(httpClient, 'request').and.returnValue(fromSimulatedUploadProgess(1, igsBatchFastqTestdata).pipe(toSimulatedUpload(0)));

    const response = await lastValueFrom(service.uploadMeldungsdatenCsvFile(file));
    expect(response).toEqual(mockResponse);
  });

  it('should handle file upload error', async () => {
    TestBed.overrideProvider(ConfigService, {
      useValue: {
        get igsGatewayUrl() {
          return undefined;
        },
      },
    });
    service = TestBed.inject(MeldungsdatenCsvFileUploadService);
    httpClient = TestBed.inject(HttpClient);
    const file = new File(['dummy file content'], 'test.csv', { type: 'text/csv' });

    // const response = await lastValueFrom(service.uploadMeldungsdatenCsvFile(file));
    // console.log(response);
    await expectAsync(lastValueFrom(service.uploadMeldungsdatenCsvFile(file))).toBeRejectedWith({
      progress: 100,
      error: 'URL des IGS Gateways ist nicht gesetzt',
    });
  });
});
