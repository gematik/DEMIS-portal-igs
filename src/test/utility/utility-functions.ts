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

import { HttpEvent, HttpEventType, HttpHeaders, HttpResponse } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { concatMap, delay, from, iif, Observable, of, take } from 'rxjs';

export function fromSimulatedUploadProgess(numberOfIntermediateSteps: number, responseBody?: any, headers?: HttpHeaders) {
  const progressUpdates: HttpEvent<any>[] = [];
  progressUpdates.push({ type: HttpEventType.UploadProgress, total: 100, loaded: 0 } as HttpEvent<any>);
  for (let i = 1; i <= numberOfIntermediateSteps; i++) {
    if (i === numberOfIntermediateSteps) {
      progressUpdates.push({
        type: HttpEventType.Response,
        body: responseBody,
        clone: () => ({}) as HttpResponse<any>,
        headers: headers ?? ({} as HttpHeaders),
        status: 200,
        statusText: 'OK',
        url: '',
        ok: true,
        total: 100,
        loaded: 100,
      } as HttpEvent<any>);
    } else {
      progressUpdates.push({ type: HttpEventType.UploadProgress, total: 100, loaded: (100 / numberOfIntermediateSteps) * i } as HttpEvent<any>);
    }
  }
  return from(progressUpdates).pipe(take(numberOfIntermediateSteps + 1));
}

export function toSimulatedUpload(delayMs: number) {
  return function (source: Observable<HttpEvent<any>>) {
    return source.pipe(concatMap(item => iif(() => item.type === HttpEventType.UploadProgress && item.loaded === 0, of(item), of(item).pipe(delay(delayMs)))));
  };
}

export function withDevDelay(delayMs: number) {
  return function (source: Observable<any>) {
    return source.pipe(delay(isDevMode() ? delayMs : 0));
  };
}
