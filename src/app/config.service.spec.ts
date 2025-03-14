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
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  const urls = {
    mfIgs: {
      igsServiceUrl: 'https://service.igs.org',
      igsGatewayUrl: 'https://gateway.igs.org',
    },
  };

  describe('with proper configuration', () => {
    let fetchSpy: jasmine.Spy;

    beforeEach(() => {
      fetchSpy = spyOn(window, 'fetch').and.returnValue(
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(urls),
        } as Response)
      );
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
      expect(service.igsGatewayUrl).toEqual(urls.mfIgs.igsGatewayUrl);
      expect(service.igsServiceUrl).toEqual(urls.mfIgs.igsServiceUrl);
    });
  });
});
