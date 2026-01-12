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

import { TestBed } from '@angular/core/testing';
import { MatTableDataSource } from '@angular/material/table';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { LoggerModule } from 'ngx-logger';
import { AppModule } from 'src/app/app.module';
import { igsBatchFastqSequenzdateienSelectOverview } from '../igs-batch-fastq.testdata';
import { UploadStatusComponent } from './upload-status.component';
import { MessageDialogService } from '@gematik/demis-portal-core-library';
import { UploadError } from '../igs-meldung.service';

describe('UploadStatus', () => {
  let fixture: MockedComponentFixture<UploadStatusComponent, UploadStatusComponent>;
  let component: UploadStatusComponent;

  beforeEach(() => MockBuilder([UploadStatusComponent, AppModule]).mock(LoggerModule));

  beforeEach(() => {
    fixture = MockRender(UploadStatusComponent);
    component = fixture.point.componentInstance;
  });

  it('should create', () => {
    expect(fixture).toBeDefined();
    expect(component).toBeTruthy();
  });

  it('should return a MatTableDataSource object', () => {
    const dataSource = component.toDataSource(igsBatchFastqSequenzdateienSelectOverview);
    expect(dataSource instanceof MatTableDataSource).toBe(true);
  });

  it('should set the data property of the MatTableDataSource', () => {
    const dataSource = component.toDataSource(igsBatchFastqSequenzdateienSelectOverview);
    expect(dataSource.data).toEqual(igsBatchFastqSequenzdateienSelectOverview);
  });

  it('should open the upload error dialog with correct data', () => {
    const mockErrors = [
      {
        rowNumber: 1,
        errors: [{ text: 'error1' }, { text: 'error2' }],
        clipboardContent: 'Something',
      } as UploadError,
      {
        rowNumber: 2,
        errors: [{ text: 'error3' }, { text: 'error4' }],
        clipboardContent: undefined,
      } as UploadError,
    ];
    spyOn(component as any, 'getRowErrors').and.returnValue(mockErrors);
    const dialogService = TestBed.inject(MessageDialogService);
    const spy = spyOn(dialogService, 'showErrorDialog');
    component.onClickUploadError(1);
    const { rowNumber, ...expectedError } = mockErrors[0];
    expect(spy).toHaveBeenCalledWith(expectedError);
  });
});
