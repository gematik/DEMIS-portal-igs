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

import { map, Observable } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../app/config.service';
import { validate as isValidUuid } from 'uuid';

export type CreateDocumentReferenceRequestProps = { fileHash: string };
export type CreateDocumentReferenceApiResponse = { sequenceUploadUrl: string };

export type CreateDocumentReferenceResponse = CreateDocumentReferenceApiResponse & { documentReferenceId: string | undefined };

@Injectable({
  providedIn: 'root',
})
export class DocumentReferenceService {
  private http = inject(HttpClient);
  private configService = inject(ConfigService);

  createDocumentReference(props: CreateDocumentReferenceRequestProps): Observable<CreateDocumentReferenceResponse> {
    const url = `${this.configService.igsGatewayUrl}/document-reference?hash=${props.fileHash}`;
    return this.http.post<CreateDocumentReferenceApiResponse>(url, {}).pipe(
      map(apiResponse => ({
        ...apiResponse,
        documentReferenceId: new URL(apiResponse.sequenceUploadUrl).pathname.split('/').find(pathSegment => isValidUuid(pathSegment)),
      }))
    );
  }
}
