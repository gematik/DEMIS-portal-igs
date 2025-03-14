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

import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MessageDialogService } from '@gematik/demis-portal-core-library';
import { MockBuilder, MockedComponentFixture, MockProvider, MockRender } from 'ng-mocks';
import { LoggerModule, NGXLogger } from 'ngx-logger';
import { BehaviorSubject } from 'rxjs';
import { AppModule } from 'src/app/app.module';
import { IgsLocalStorageKeys, IgsMeldungService, UploadError } from 'src/app/components/igs-meldung/igs-meldung.service';
import { IgsMeldung } from 'src/app/components/igs-meldung/igs-meldung.types';
import { ResultComponent } from './result.component';
import { ExportToFileService } from 'src/api/services/export-to-file.service';

describe('ResultComponent', () => {
  let component: ResultComponent;
  let fixture: MockedComponentFixture<ResultComponent, ResultComponent>;
  const downloadTimestamp = new Date();

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

  const results: IgsMeldung.NotificationUploadInfo[] = [
    {
      rowNumber: 1,
      demisNotificationId: '1234',
      labSequenceId: '5678',
      status: 'SUCCESS',
      demisSequenceId: '91011',
      uploadTimestamp: '2021-09-01T12:00:00Z',
    },
    {
      rowNumber: 2,
      demisNotificationId: '1235',
      labSequenceId: '6678',
      status: 'ERROR',
      uploadTimestamp: '2021-09-01T12:10:00Z',
    },
  ];

  beforeEach(() =>
    MockBuilder([ResultComponent, AppModule])
      .provide(
        MockProvider(IgsMeldungService, {
          rowErrorsSub$: new BehaviorSubject(mockErrors),
          lastBatchUploadFinishedAt: computed(() => downloadTimestamp),
        } as Partial<IgsMeldungService>)
      )
      .mock(LoggerModule)
      .mock(MessageDialogService)
      .mock(ExportToFileService)
  );

  beforeEach(() => {
    fixture = MockRender(ResultComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build a datasource', () => {
    const dataSource = component.toDataSource(results);

    expect(dataSource instanceof MatTableDataSource).toBeTrue();
    expect(dataSource.data).toEqual(results);
  });

  it('should open the upload error dialog with correct data', () => {
    const dialogService = TestBed.inject(MessageDialogService);
    const spy = spyOn(dialogService, 'errorWithSearch');
    component.onClickUploadError(2);
    const { rowNumber, ...expectedError } = mockErrors[1];
    expect(spy).toHaveBeenCalledWith(expectedError);
  });

  it('should show an error dialog, when no notification upload data are available in local storage', () => {
    localStorage.clear();
    const logger = TestBed.inject(NGXLogger);
    spyOn(logger, 'error');
    const messageDialog = TestBed.inject(MessageDialogService);
    spyOn(messageDialog, 'errorWithSearch');

    component.downloadReport();

    expect(logger.error).toHaveBeenCalled();
    expect(messageDialog.errorWithSearch).toHaveBeenCalled();
  });

  it('should have a download button with correct filename attibute', () => {
    const downloadButton = fixture.debugElement.nativeElement.querySelector('button#btn-report-download');
    expect(downloadButton).toBeTruthy();
    expect(downloadButton.getAttribute('demis-igs-filename')).toContain('igs-meldung-report__' + downloadTimestamp.toISOString().replace(/:/g, '-'));
  });

  it('should download report', () => {
    const notificationUploads =
      '[{"rowNumber":1,"uploadTimestamp":"2025-01-31T09:19:08.815Z","demisNotificationId":"cbd091f6-7f7c-40aa-8557-9006d03b072a","labSequenceId":"Sample12346","demisSequenceId":"IGS-10234-SPNP-42C852B5-A378-4989-90D8-D6654C083B2F","status":"SUCCESS"},' +
      '{"rowNumber":2,"uploadTimestamp":"","demisNotificationId":"00000000-0000-0000-0000-000000000000","labSequenceId":"Sample12346","status":"ERROR"},' +
      '{"rowNumber":3,"demisNotificationId":"00000000-0000-0000-0000-000000000000","labSequenceId":"Sample12346","status":"ERROR"}]';
    localStorage.setItem(IgsLocalStorageKeys.NOTIFICATION_UPLOADS, notificationUploads);
    const exportToFileService = TestBed.inject(ExportToFileService);
    spyOn(exportToFileService, 'exportToCsvFile');

    component.downloadReport();

    const expectedExportableNotificationUploadInfo: IgsMeldung.ExportableNotificationUploadInfo[] = [
      {
        rowNumber: 1,
        demisNotificationId: 'cbd091f6-7f7c-40aa-8557-9006d03b072a',
        labSequenceId: 'Sample12346',
        status: 'SUCCESS',
        uploadTimestamp: '2025-01-31T09:19:08.815Z',
        demisSequenceId: 'IGS-10234-SPNP-42C852B5-A378-4989-90D8-D6654C083B2F',
        errors: 'error1 -- error2',
      },
      {
        rowNumber: 2,
        demisNotificationId: '00000000-0000-0000-0000-000000000000',
        labSequenceId: 'Sample12346',
        status: 'ERROR',
        uploadTimestamp: 'n/a',
        demisSequenceId: 'n/a',
        errors: 'error3 -- error4',
      },
      {
        rowNumber: 3,
        demisNotificationId: '00000000-0000-0000-0000-000000000000',
        labSequenceId: 'Sample12346',
        status: 'ERROR',
        uploadTimestamp: 'n/a',
        demisSequenceId: 'n/a',
        errors: '',
      },
    ];
    const expectedReportFilename = 'igs-meldung-report__' + downloadTimestamp.toISOString().replace(/:/g, '-');
    expect(exportToFileService.exportToCsvFile).toHaveBeenCalledWith(expectedReportFilename, expectedExportableNotificationUploadInfo);
  });
});
