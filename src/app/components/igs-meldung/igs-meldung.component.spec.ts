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

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { LoggerModule } from 'ngx-logger';
import { AppModule } from 'src/app/app.module';
import { IgsMeldungComponent } from './igs-meldung.component';
import { IgsMeldungService } from './igs-meldung.service';

describe('IgsMeldungComponent', () => {
  let fixture: MockedComponentFixture<IgsMeldungComponent, IgsMeldungComponent>;
  let component: IgsMeldungComponent;

  beforeEach(() =>
    MockBuilder([IgsMeldungComponent, AppModule])
      .mock(LoggerModule)
      .provide(IgsMeldungService)
      .provide(provideHttpClient(withInterceptorsFromDi()))
      .provide(provideHttpClientTesting())
  );

  beforeEach(() => {
    fixture = MockRender(IgsMeldungComponent);
    component = fixture.point.componentInstance;
  });

  it('should create', () => {
    expect(fixture).toBeDefined();
    expect(component).toBeTruthy();
  });
});
