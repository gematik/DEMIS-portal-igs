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

import { TestBed } from '@angular/core/testing';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  const envConfig = {
    mfIgs: {
      igsServiceUrl: 'https://service.igs.org',
      igsGatewayUrl: 'https://gateway.igs.org',
      maxRetry: 12,
    },
    featureFlags: {
      FEATURE_FLAG_PORTAL_HEADER_FOOTER: true,
      FEATURE_FLAG_NEW_API_ENDPOINTS: false,
    },
  };

  describe('with proper configuration', () => {
    let fetchSpy: jasmine.Spy;

    beforeEach(() => {
      // Check if fetch is already spied upon
      const isSpy = (window.fetch as any).and !== undefined;
      if (isSpy) {
        // Reset the spy with new return value
        fetchSpy = window.fetch as jasmine.Spy;
        fetchSpy.and.returnValue(
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(envConfig),
          } as Response)
        );
      } else {
        // Create new spy
        fetchSpy = spyOn(window, 'fetch').and.returnValue(
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(envConfig),
          } as Response)
        );
      }
      TestBed.configureTestingModule({
        providers: [ConfigService],
      });
      service = TestBed.inject(ConfigService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have proper config values', async () => {
      const response = await fetchSpy.calls.mostRecent().returnValue;
      await response.json();

      expect(fetchSpy).toHaveBeenCalled();

      expect(service.igsGatewayUrl).toBeTruthy();
      expect(service.igsServiceUrl).toBeTruthy();
      expect(service.igsGatewayUrl).toEqual(envConfig.mfIgs.igsGatewayUrl);
      expect(service.igsServiceUrl).toEqual(envConfig.mfIgs.igsServiceUrl);
    });

    it('should expose feature flags correctly', async () => {
      const response = await fetchSpy.calls.mostRecent().returnValue;
      await response.json();

      expect(service.isFeatureEnabled('FEATURE_FLAG_PORTAL_HEADER_FOOTER')).toBeTrue();
      expect(service.isFeatureEnabled('FEATURE_FLAG_NEW_API_ENDPOINTS')).toBeFalse();
    });

    it('should return false for unknown feature flags', async () => {
      const response = await fetchSpy.calls.mostRecent().returnValue;
      await response.json();

      expect(service.isFeatureEnabled('UNKNOWN_FLAG')).toBeFalse();
    });

    it('should return safe defaults before config is loaded', () => {
      expect(service.isFeatureEnabled('FEATURE_FLAG_PORTAL_HEADER_FOOTER')).toBeFalse();
      expect(service.maxAttempts).toEqual(60);
    });
  });
});
