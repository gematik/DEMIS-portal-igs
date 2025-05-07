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
    For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */

import { TestBed } from '@angular/core/testing';
import { IgsMeldung } from 'src/app/components/igs-meldung/igs-meldung.types';
import { CsvExporter } from '../csv-exporter.injection-token';
import { ExportToFileService } from './export-to-file.service';

describe('ExportToFileService', () => {
  let service: ExportToFileService;
  let csvExporter: CsvExporter;
  const notificationUploadInfo: IgsMeldung.ExportableNotificationUploadInfo[] = [
    {
      status: 'SUCCESS',
      uploadTimestamp: 'timestamp1',
      demisNotificationId: 'id1',
      labSequenceId: 'labId1',
      demisSequenceId: 'demisId1',
      errors: 'error1',
      rowNumber: 1,
    },
  ];
  const csvBaseConfig = {
    columnHeaders: [
      { key: 'status', displayLabel: 'STATUS' },
      { key: 'uploadTimestamp', displayLabel: 'UPLOAD_TIMESTAMP' },
      { key: 'demisNotificationId', displayLabel: 'DEMIS_NOTIFICATION_ID' },
      { key: 'labSequenceId', displayLabel: 'LAB_SEQUENCE_ID' },
      { key: 'demisSequenceId', displayLabel: 'DEMIS_SEQUENCE_ID' },
      { key: 'errors', displayLabel: 'ERRORS' },
    ],
    quoteStrings: true,
    quoteCharacter: '"',
    decimalSeparator: '.',
    fieldSeparator: ';',
    filename: 'export__', // default filename
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExportToFileService);
    csvExporter = TestBed.inject(CsvExporter);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate a CSV file with correct parameters and download it', () => {
    const filename = 'test';
    const testCsvOutput = '"some";"csv";"data"';
    const expectedCsvConfig = { ...csvExporter.mkConfig(csvBaseConfig), filename };
    const dataToCsvOutputFnSpy = jasmine.createSpy('dataToCsvOutputFnSpy').and.returnValue(testCsvOutput);
    const generateCsvSpy = spyOn(TestBed.inject(CsvExporter), 'generateCsv').and.returnValue(dataToCsvOutputFnSpy);
    const writeCsvOutputFnSpy = jasmine.createSpy('dataToCsvOutputFnSpy');
    const downloadSpy = spyOn(TestBed.inject(CsvExporter), 'download').and.returnValue(writeCsvOutputFnSpy);

    service.exportToCsvFile(filename, notificationUploadInfo);

    expect(generateCsvSpy).toHaveBeenCalledWith(expectedCsvConfig);
    expect(dataToCsvOutputFnSpy).toHaveBeenCalledWith(notificationUploadInfo);
    expect(downloadSpy).toHaveBeenCalledWith(expectedCsvConfig);
    expect(writeCsvOutputFnSpy).toHaveBeenCalledWith(testCsvOutput);
  });
});
