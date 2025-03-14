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

import { TestBed } from '@angular/core/testing';
import { FhirValidationResponseService } from './fhir-validation-response.service';
import { FhirValidationResponse } from './fhir-validation-response.types';
import { NGXLogger } from 'ngx-logger';

describe('FhirValidationResponseService', () => {
  let service: FhirValidationResponseService;
  let loggerSpy: jasmine.SpyObj<NGXLogger>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('Logger', ['error']);

    TestBed.configureTestingModule({
      providers: [FhirValidationResponseService, { provide: NGXLogger, useValue: spy }],
    });

    service = TestBed.inject(FhirValidationResponseService);
    loggerSpy = TestBed.inject(NGXLogger) as jasmine.SpyObj<NGXLogger>;
  });

  it('should parse stringified FHIR validation response', () => {
    const response = JSON.stringify({
      resourceType: 'OperationOutcome',
      meta: { profile: ['profile-url'] },
      text: { status: 'generated', div: '<div>Some text</div>' },
      issue: [],
    } as FhirValidationResponse.OperationOutcome);

    const result = service.parseStringifiedFhirValidationResponse(response);
    expect(result.resourceType).toBe('OperationOutcome');
    expect(result.meta.profile[0]).toBe('profile-url');
    expect(result.text.status).toBe('generated');
  });

  it('should get error diagnostics from operation outcome', () => {
    const operationOutcome: FhirValidationResponse.OperationOutcome = {
      resourceType: 'OperationOutcome',
      meta: { profile: ['profile-url'] },
      text: { status: 'generated', div: '<div>Some text</div>' },
      issue: [
        { severity: 'error', code: 'code1', diagnostics: 'Error 1' },
        { severity: 'warning', code: 'code2', diagnostics: 'Warning 1' },
        { severity: 'error', code: 'code3', diagnostics: 'Error 2' },
      ],
    };

    const result = service.getErrorDiagnostics(operationOutcome);
    expect(result).toEqual(['Error 1', 'Error 2']);
  });

  it('should log an error and return a default message if getting error diagnostics fails', () => {
    const operationOutcome: any = {
      resourceType: 'OperationOutcome',
      meta: { profile: ['profile-url'] },
      text: { status: 'generated', div: '<div>Some text</div>' },
      issue: null, // This will cause an error
    };

    const result = service.getErrorDiagnostics(operationOutcome);
    expect(loggerSpy.error).toHaveBeenCalled();
    expect(result).toEqual(['Fehler beim Erstellen der Fehlermeldung']);
  });
});
