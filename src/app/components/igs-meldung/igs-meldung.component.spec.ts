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

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockBuilder, MockedComponentFixture, MockRender, ngMocks } from 'ng-mocks';
import { LoggerModule } from 'ngx-logger';
import { AppModule } from 'src/app/app.module';
import { IgsMeldungComponent } from './igs-meldung.component';
import { IgsMeldungService } from './igs-meldung.service';
import { ConfigService } from '../../config.service';

describe('IgsMeldungComponent', () => {
  let fixture: MockedComponentFixture<IgsMeldungComponent, IgsMeldungComponent>;
  let component: IgsMeldungComponent;
  let configService: ConfigService;

  beforeEach(() =>
    MockBuilder([IgsMeldungComponent, AppModule])
      .mock(LoggerModule)
      .mock(ConfigService)
      .provide(IgsMeldungService)
      .provide(provideHttpClient(withInterceptorsFromDi()))
      .provide(provideHttpClientTesting())
  );

  beforeEach(() => {
    fixture = MockRender(IgsMeldungComponent);
    component = fixture.point.componentInstance;
    configService = ngMocks.findInstance(ConfigService);
  });

  it('should create', () => {
    expect(fixture).toBeDefined();
    expect(component).toBeTruthy();
  });

  it('should show footer when FEATURE_FLAG_PORTAL_HEADER_FOOTER is enabled', () => {
    spyOn(configService, 'isFeatureEnabled').and.returnValue(true);
    fixture.detectChanges();
    const footer = ngMocks.findAll('gem-demis-forms-footer');
    expect(footer.length).toBe(1);
  });

  it('should NOT show footer when FEATURE_FLAG_PORTAL_HEADER_FOOTER is disabled', () => {
    spyOn(configService, 'isFeatureEnabled').and.returnValue(false);
    fixture.detectChanges();
    const footer = ngMocks.findAll('gem-demis-forms-footer');
    expect(footer.length).toBe(0);
  });
});
