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

import { describe, expect, it } from 'vitest';
import { of, throwError } from 'rxjs';
import { HttpEventType, HttpResponse, HttpUploadProgressEvent } from '@angular/common/http';
import { toFileUploadInfo, UploadProgress } from './shared-functions';

describe('toFileUploadInfo', () => {
  it('should return upload progress event', async () => {
    const uploadEvent: HttpUploadProgressEvent = {
      type: HttpEventType.UploadProgress,
      loaded: 50,
      total: 100,
    };

    of(uploadEvent)
      .pipe(toFileUploadInfo())
      .subscribe((result: UploadProgress<any>) => {
        expect(result.progress).toBe(50);
      });
  });

  it('should return upload progress event without total', async () => {
    const uploadEvent: HttpUploadProgressEvent = {
      type: HttpEventType.UploadProgress,
      loaded: 50,
    };

    of(uploadEvent)
      .pipe(toFileUploadInfo())
      .subscribe((result: UploadProgress<any>) => {
        expect(result.progress).toBe(0);
      });
  });

  it('should return response event with body', async () => {
    const responseEvent = new HttpResponse({ body: { data: 'test' } });

    of(responseEvent)
      .pipe(toFileUploadInfo())
      .subscribe((result: UploadProgress<any>) => {
        expect(result.progress).toBe(100);
        expect(result.payload).toEqual({ data: 'test' });
      });
  });

  it('should return response event with response', async () => {
    const responseEvent = new HttpResponse({ body: { data: 'test' } });

    of(responseEvent)
      .pipe(toFileUploadInfo('response'))
      .subscribe((result: UploadProgress<any>) => {
        expect(result.progress).toBe(100);
        expect(result.payload).toEqual(responseEvent);
      });
  });

  it('should handle error with detail', async () => {
    const errorResponse = {
      error: {
        detail: 'Detailed error message',
      },
      message: 'Error message',
    };

    throwError(() => errorResponse)
      .pipe(toFileUploadInfo())
      .subscribe({
        next: () => {
          throw new Error('Should not be called');
        },
        error: (result: UploadProgress<any>) => {
          expect(result.progress).toBe(100);
          expect(result.error).toBe('Detailed error message');
        },
      });
  });

  it('should handle error without detail', async () => {
    const errorResponse = {
      message: 'Error message',
    };

    throwError(() => errorResponse)
      .pipe(toFileUploadInfo())
      .subscribe({
        next: () => {
          throw new Error('Should not be called');
        },
        error: (result: UploadProgress<any>) => {
          expect(result.progress).toBe(100);
          expect(result.error).toBe('Error message');
        },
      });
  });
});
