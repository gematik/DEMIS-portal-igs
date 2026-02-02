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

import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MockBuilder, MockRender, NG_MOCKS_INTERCEPTORS } from 'ng-mocks';
import { LoggerModule } from 'ngx-logger';
import { AppModule } from './app.module';
import { AuthInterceptor } from './auth.interceptor';
import { ConfigService } from './config.service';

describe('AuthInterceptor', () => {
  let configServiceMock;

  beforeEach(async () => {
    configServiceMock = {};
    Object.defineProperty(configServiceMock, 'igsGatewayUrl', {
      get: jasmine.createSpy('igsGatewayUrl').and.returnValue(urls.igsGatewayUrl),
    });
    Object.defineProperty(configServiceMock, 'igsServiceUrl', {
      get: jasmine.createSpy('igsServiceUrl').and.returnValue(urls.igsServiceUrl),
    });
    await MockBuilder([AuthInterceptor, AppModule])
      .exclude(NG_MOCKS_INTERCEPTORS)
      .mock(LoggerModule)
      .keep(HTTP_INTERCEPTORS)
      .provide(provideHttpClient(withInterceptorsFromDi()))
      .provide(provideHttpClientTesting())
      .provide({
        provide: ConfigService,
        useValue: configServiceMock,
      });
  });

  afterEach(() => {
    delete (window as any)['token'];
    delete (window as any)['config'];
  });

  const token = 'my-token';
  // the following requests need a token
  const urls = {
    igsServiceUrl: 'https://service.igs.org',
    igsGatewayUrl: 'https://gateway.igs.org',
  };

  const urlTest = (url: string, tokenShouldBeThere: boolean = true) =>
    it(`should ${tokenShouldBeThere ? '' : 'NOT '}add an Authorization header to ${url}`, async () => {
      const client = TestBed.inject(HttpClient);
      const httpMock = TestBed.inject(HttpTestingController);

      client.get(url).subscribe();

      const req = httpMock.expectOne(url);
      req.flush('');
      httpMock.verify();

      if (tokenShouldBeThere) {
        expect(req.request.headers.get('Authorization')).toEqual(`Bearer ${token}`);
      } else {
        expect(req.request.headers.get('Authorization')).toBeNull();
      }
    });

  describe('Token is existing', () => {
    beforeEach(() => {
      (window as any)['token'] = token;
      (window as any)['config'] = { mfIgs: { ...urls } };
      MockRender();
    });

    describe('Token is needed', () => {
      for (const entry of Object.values(urls)) {
        urlTest(entry);
      }
    });

    describe('Token is NOT needed', () => {
      urlTest('https://some-other-url.com', false);
      urlTest('/some-other-relative-path', false);
    });
  });

  describe('Token is NOT existing', () => {
    beforeEach(() => {
      (window as any)['token'] = undefined;
      MockRender();
    });

    for (const entry of Object.values(urls)) {
      urlTest(entry, false);
    }

    urlTest('https://some-other-url.com', false);
    urlTest('/some-other-relative-path', false);
  });
});
