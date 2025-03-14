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

import { of, throwError } from 'rxjs';
import {
  HttpErrorResponse,
  HttpEventType,
  HttpResponse,
  HttpUploadProgressEvent,
  HttpSentEvent,
  HttpDownloadProgressEvent,
  HttpHeaders,
  HttpEvent,
} from '@angular/common/http';
import { toFileUploadInfo, UploadProgress } from './shared-functions';

describe('toFileUploadInfo', () => {
  it('should return upload progress event', done => {
    const uploadEvent: HttpUploadProgressEvent = {
      type: HttpEventType.UploadProgress,
      loaded: 50,
      total: 100,
    };

    of(uploadEvent)
      .pipe(toFileUploadInfo())
      .subscribe((result: UploadProgress<any>) => {
        expect(result.progress).toBe(50);
        done();
      });
  });

  it('should return upload progress event without total', done => {
    const uploadEvent: HttpUploadProgressEvent = {
      type: HttpEventType.UploadProgress,
      loaded: 50,
    };

    of(uploadEvent)
      .pipe(toFileUploadInfo())
      .subscribe((result: UploadProgress<any>) => {
        expect(result.progress).toBe(0);
        done();
      });
  });

  it('should return response event with body', done => {
    const responseEvent = new HttpResponse({ body: { data: 'test' } });

    of(responseEvent)
      .pipe(toFileUploadInfo())
      .subscribe((result: UploadProgress<any>) => {
        expect(result.progress).toBe(100);
        expect(result.payload).toEqual({ data: 'test' });
        done();
      });
  });

  it('should return response event with response', done => {
    const responseEvent = new HttpResponse({ body: { data: 'test' } });

    of(responseEvent)
      .pipe(toFileUploadInfo('response'))
      .subscribe((result: UploadProgress<any>) => {
        expect(result.progress).toBe(100);
        expect(result.payload).toEqual(responseEvent);
        done();
      });
  });

  it('should handle error with detail', done => {
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
          done();
        },
      });
  });

  it('should handle error without detail', done => {
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
          done();
        },
      });
  });
});
