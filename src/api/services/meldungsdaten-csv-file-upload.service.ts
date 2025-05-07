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

import { throwError } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpRequest } from '@angular/common/http';
import { ConfigService } from 'src/app/config.service';
import { IgsMeldung } from 'src/app/components/igs-meldung/igs-meldung.types';
import { toFileUploadInfo, UploadProgress } from 'src/shared/shared-functions';

@Injectable({
  providedIn: 'root',
})
export class MeldungsdatenCsvFileUploadService {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(ConfigService);

  uploadMeldungsdatenCsvFile(file: File) {
    const formData = new FormData();
    formData.append('csvFile', file);

    const igsGatewayUrl = this.configService.igsGatewayUrl;

    if (!igsGatewayUrl) {
      return throwError(() => ({ progress: 100, error: 'URL des IGS Gateways ist nicht gesetzt' }) as UploadProgress<IgsMeldung.OverviewResponse>);
    }

    const req = new HttpRequest('POST', `${igsGatewayUrl}/csv/upload`, formData, {
      reportProgress: true,
    });

    return this.http.request<IgsMeldung.OverviewResponse>(req).pipe(toFileUploadInfo('body', false));
  }
}
