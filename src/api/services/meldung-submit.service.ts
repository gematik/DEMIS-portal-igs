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

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConfigService } from 'src/app/config.service';
import { IgsMeldung } from '../../app/components/igs-meldung/igs-meldung.types';

export type MeldungSubmitResponse = {
  meldungId?: string;
  laborId?: string;
  igsId?: string;
};

export type MeldungSubmitResponseError = {
  detail: string;
  instance: string;
  status: number;
  timestamp: string;
  title: string;
  type: string;
};

export type MeldungSubmitParams = { metadata: IgsMeldung.OverviewData };

@Injectable({
  providedIn: 'root',
})
export class MeldungSubmitService {
  private readonly configService = inject(ConfigService);
  private readonly http = inject(HttpClient);
  private readonly logger = inject(NGXLogger);

  submitMeldung({ metadata }: MeldungSubmitParams): Observable<MeldungSubmitResponse> {
    this.logger.debug('submitMeldung for demisNotificationId: ', metadata.demisNotificationId);
    return this.http.post<any>(`${this.configService.igsGatewayUrl}/notification-sequence/$process-notification-sequence`, metadata).pipe(
      map(response => {
        this.logger.debug('submitMeldung response', response);
        const result: MeldungSubmitResponse = {};

        response?.parameter?.forEach((param: any) => {
          if (param.name === 'transactionID') {
            result.igsId = param.valueIdentifier.value;
          } else if (param.name === 'submitterGeneratedNotificationID') {
            result.meldungId = param.valueIdentifier.value;
          } else if (param.name === 'labSequenceID') {
            result.laborId = param.valueIdentifier.value;
          }
        });

        return result;
      }),
      catchError((error: HttpErrorResponse) => {
        this.logger.error('submitMeldung failed', error);
        return throwError(() => error);
      })
    );
  }
}
