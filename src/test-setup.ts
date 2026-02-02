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

import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

// Mock fetch globally for all tests
const mockEnvironmentConfig = {
  mfIgs: {
    igsGatewayUrl: 'http://localhost:8080/gateway',
    igsServiceUrl: 'http://localhost:8080/service',
    maxRetry: 40,
  },
  featureFlags: {
    FEATURE_FLAG_PORTAL_IGS_SIDENAV: false,
    FEATURE_FLAG_PORTAL_HEADER_FOOTER: false,
  },
};

// Store the original fetch to restore it after each test
const originalFetch = window.fetch;

beforeEach(() => {
  // Check if fetch is already spied upon, if not mock it
  const isSpy = (window.fetch as any).and !== undefined;
  if (!isSpy) {
    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockEnvironmentConfig),
        text: () => Promise.resolve(JSON.stringify(mockEnvironmentConfig)),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)
    );
  }
});

afterEach(() => {
  // Restore the original fetch after each test to ensure test isolation
  window.fetch = originalFetch;
});
