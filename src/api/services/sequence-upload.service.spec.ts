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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpClient, HttpHeaders, HttpResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { NGXLogger } from 'ngx-logger';
import { of, Subject, throwError } from 'rxjs';
import { fromSimulatedUploadProgess } from 'src/test/utility/utility-functions';
import { ConfigService } from '../../app/config.service';
import { ChunkUploadResponse, SequenceUploadService } from './sequence-upload.service';

describe('SequenceUploadService', () => {
  let service: SequenceUploadService;
  let configService: ConfigService;

  beforeEach(() =>
    MockBuilder([SequenceUploadService]).mock(NGXLogger).provide(provideHttpClient(withInterceptorsFromDi())).provide(provideHttpClientTesting())
  );

  beforeEach(() => {
    service = TestBed.inject(SequenceUploadService);
    configService = TestBed.inject(ConfigService);
    vi.spyOn(configService, 'igsServiceUrl', 'get').mockReturnValue('http://mocked-url.com');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should upload sequence file chunk successfully', async () => {
    const presignedUrl = 'http://example.com/upload';
    const file = new File(['test file content'], 'test.txt');
    const partNumber = 1;
    const partSizeBytes = file.size;
    const etag = 'etag-value';
    const expectedResponse: HttpResponse<any> = new HttpResponse<any>({
      body: { partNumber: partNumber },
      headers: new HttpHeaders({ etag }),
      url: presignedUrl,
    });
    const expectedChunkUploadResponse: ChunkUploadResponse = { partNumber, eTag: etag };

    vi.spyOn(TestBed.inject(HttpClient), 'request').mockReturnValue(of(expectedResponse));

    const response = await service.uploadSequenceFileChunk({ presignedUrl, file, partNo: partNumber, partSizeBytes });
    expect(response).toEqual(expectedChunkUploadResponse);
  });

  it('should upload sequence file chunk successfully, even with intermediate HttpEventTypes', async () => {
    const presignedUrl = 'http://example.com/upload';
    const file = new File(['test file content'], 'test.txt');
    const partNumber = 1;
    const partSizeBytes = file.size;
    const etag = 'etag-value';
    const expectedResponse: HttpResponse<any> = new HttpResponse<any>({
      body: { partNumber: partNumber },
      headers: new HttpHeaders({ etag }),
      url: presignedUrl,
    });
    const expectedChunkUploadResponse: ChunkUploadResponse = { partNumber, eTag: etag };

    vi.spyOn(TestBed.inject(HttpClient), 'request').mockReturnValue(fromSimulatedUploadProgess(2, expectedResponse, new HttpHeaders({ etag })));

    const response = await service.uploadSequenceFileChunk({ presignedUrl, file, partNo: partNumber, partSizeBytes });
    expect(response).toEqual(expectedChunkUploadResponse);
  });

  it('should handle upload error', async () => {
    const presignedUrl = 'http://example.com/upload';
    const file = new File(['test file content'], 'test.txt');
    const partNo = 1;
    const partSizeBytes = file.size;
    const errorMessage = 'Upload failed';

    vi.spyOn(TestBed.inject(HttpClient), 'request').mockReturnValue(throwError(() => new Error(errorMessage)));

    await expect(service.uploadSequenceFileChunk({ presignedUrl, file, partNo, partSizeBytes })).rejects.toThrowError(errorMessage);
  });

  it('should return validation result when status is VALID', async () => {
    vi.spyOn(service as any, 'initValidation').mockReturnValue(Promise.resolve());
    vi.spyOn(service as any, 'getValidationStatus').mockReturnValue(Promise.resolve({ status: 'VALID' }));

    let uploadCanceled = new Subject<boolean>();
    const result = await service.pollSequenceValidationResult('documentReference', uploadCanceled);
    expect(result.status).toBe('VALID');
  });

  it('should return validation result when status is VALIDATION_FAILED', async () => {
    vi.spyOn(service as any, 'initValidation').mockReturnValue(Promise.resolve());
    vi.spyOn(service as any, 'getValidationStatus').mockReturnValue(Promise.resolve({ status: 'VALIDATION_FAILED' }));

    let uploadCanceled = new Subject<boolean>();
    const result = await service.pollSequenceValidationResult('documentReference', uploadCanceled);
    expect(result.status).toBe('VALIDATION_FAILED');
  });

  it('should retry and eventually return validation result', async () => {
    vi.spyOn(configService, 'maxAttempts', 'get').mockReturnValue(3);
    vi.spyOn(configService, 'waitBetweenRetires', 'get').mockReturnValue(1);
    vi.spyOn(service as any, 'initValidation').mockReturnValue(Promise.resolve());
    vi.spyOn(service as any, 'getValidationStatus')
      .mockReturnValueOnce(Promise.resolve({ status: 'VALIDATING' }))
      .mockReturnValueOnce(Promise.resolve({ status: 'VALIDATING' }))
      .mockReturnValueOnce(Promise.resolve({ status: 'VALID' }));

    let uploadCanceled = new Subject<boolean>();
    const result = await service.pollSequenceValidationResult('documentReference', uploadCanceled);
    expect(result.status).toBe('VALID');
  });

  it('should throw an error after max retries', async () => {
    vi.spyOn(configService, 'maxAttempts', 'get').mockReturnValue(3);
    vi.spyOn(configService, 'waitBetweenRetires', 'get').mockReturnValue(1);
    vi.spyOn(service as any, 'initValidation').mockReturnValue(Promise.resolve());
    vi.spyOn(service as any, 'getValidationStatus').mockReturnValue(Promise.resolve({ status: 'VALIDATING' }));

    let uploadCanceled = new Subject<boolean>();
    await expect(service.pollSequenceValidationResult('documentReference', uploadCanceled)).rejects.toThrowError('Validation failed after 3 attempts');
  });

  it('should throw an error if initValidation fails', async () => {
    vi.spyOn(service as any, 'initValidation').mockReturnValue(Promise.reject(new Error('Init validation failed')));

    await expect(service.initValidation('documentReference')).rejects.toThrowError('Init validation failed');
  });
});
