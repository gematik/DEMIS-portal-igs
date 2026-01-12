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

import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { firstValueFrom, of } from 'rxjs';
import { ConfigService } from '../../app/config.service';
import {
  CreateDocumentReferenceApiResponse,
  CreateDocumentReferenceRequestProps,
  CreateDocumentReferenceResponse,
  DocumentReferenceService,
} from './document-reference.service';

describe('DocumentReferenceService', () => {
  let service: DocumentReferenceService;
  let configService: ConfigService;
  let httpClient: HttpClient;

  beforeEach(() =>
    MockBuilder(DocumentReferenceService)
      .mock(HttpClient)
      .mock(ConfigService, { igsGatewayUrl: 'https://gateway.igs.org' } as Partial<ConfigService>)
  );

  beforeEach(() => {
    service = TestBed.inject(DocumentReferenceService);
    configService = TestBed.inject(ConfigService);
    httpClient = TestBed.inject(HttpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a document reference', async () => {
    const props: CreateDocumentReferenceRequestProps = { fileHash: '9770fded7efdfba62961d078158441089aa98fd3b42ad49766a72d479c58996f' };
    const documentReferenceId = '22591739-d7f4-4775-9c27-e336b3507127';
    const mockedApiResponse: CreateDocumentReferenceApiResponse = {
      sequenceUploadUrl: 'https://storage.igs.org/files/' + documentReferenceId,
    } as CreateDocumentReferenceApiResponse;
    const expectedResponse: CreateDocumentReferenceResponse = { ...mockedApiResponse, documentReferenceId };

    spyOn(httpClient, 'post').and.returnValue(of(mockedApiResponse));

    await expectAsync(firstValueFrom(service.createDocumentReference(props))).toBeResolvedTo(expectedResponse);
  });
});
