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

import { inject, Injectable } from '@angular/core';
import { ConfigOptions } from 'export-to-csv';
import { IgsMeldung } from 'src/app/components/igs-meldung/igs-meldung.types';
import { CsvExporter } from '../csv-exporter.injection-token';

const EXPORT_TO_CSV_BASE_CONFIG: ConfigOptions = {
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

@Injectable({
  providedIn: 'root',
})
export class ExportToFileService {
  private readonly csvExporter = inject(CsvExporter);

  exportToCsvFile(filename: string, notificationUploadInfo: IgsMeldung.ExportableNotificationUploadInfo[]) {
    const csvConfig = { ...this.csvExporter.mkConfig(EXPORT_TO_CSV_BASE_CONFIG), filename };
    const dataToCsvOutputFn = this.csvExporter.generateCsv(csvConfig);
    const csv = dataToCsvOutputFn(notificationUploadInfo);
    const writeCsvOutputFn = this.csvExporter.download(csvConfig);
    writeCsvOutputFn(csv);
  }
}
