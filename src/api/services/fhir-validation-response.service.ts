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

import { inject, Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { FhirValidationResponse } from './fhir-validation-response.types';

@Injectable({
  providedIn: 'root',
})
export class FhirValidationResponseService {
  private readonly logger = inject(NGXLogger);

  parseStringifiedFhirValidationResponse(response: string): FhirValidationResponse.OperationOutcome {
    return JSON.parse(response) as FhirValidationResponse.OperationOutcome;
  }

  getErrorDiagnostics(operationOutcome: FhirValidationResponse.OperationOutcome): string[] {
    try {
      return operationOutcome.issue.filter(issue => issue.severity === 'error').map(issue => issue.diagnostics);
    } catch (error) {
      this.logger.error('Error while getting error diagnostics', error);
      return ['Fehler beim Erstellen der Fehlermeldung'];
    }
  }
}
