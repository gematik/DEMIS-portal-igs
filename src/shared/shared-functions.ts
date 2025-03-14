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

import { HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, catchError, filter, map, throwError } from 'rxjs';

declare type PayloadType = 'body' | 'response';

export declare type UploadProgress<T> = {
  progress: number;
  payload?: T;
  error?: string;
};

export function toFileUploadInfo<T>(observe: PayloadType = 'body', onlyDetailOnError: Boolean = true) {
  return function (source: Observable<HttpEvent<T>>): Observable<UploadProgress<T | HttpEvent<T>>> {
    return source.pipe(
      filter((event: HttpEvent<T>) => event.type === HttpEventType.UploadProgress || event.type === HttpEventType.Response),
      map((event: HttpEvent<T>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            return { progress: event.total ? Math.round((100 * event.loaded) / event.total) : 0 } as UploadProgress<T>;
          case HttpEventType.Response:
            if (observe === 'response') {
              return { progress: 100, payload: event } as UploadProgress<HttpEvent<T>>;
            } else {
              return { progress: 100, payload: event.body } as UploadProgress<T>;
            }
          default:
            return { progress: 100, error: 'Unknown error occurred' } as UploadProgress<T>;
        }
      }),
      catchError(error => {
        if (error.error?.detail) {
          return throwError(() => ({ progress: 100, error: onlyDetailOnError ? error.error.detail : error.error }) as UploadProgress<T>);
        }
        return throwError(() => ({ progress: 100, error: error.message }) as UploadProgress<T>);
      })
    );
  };
}
