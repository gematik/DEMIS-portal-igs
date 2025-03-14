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

import { Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MessageDialogService } from '@gematik/demis-portal-core-library';
import { NGXLogger } from 'ngx-logger';
import { IgsLocalStorageKeys, IgsMeldungService, UploadError } from '../igs-meldung.service';
import { IgsMeldung } from '../igs-meldung.types';
import { ExportToFileService } from 'src/api/services/export-to-file.service';

@Component({
  selector: 'np-mf-igs-result',
  templateUrl: './result.component.html',
  styleUrl: './result.component.scss',
})
export class ResultComponent {
  readonly igsMeldungService = inject(IgsMeldungService);
  private readonly logger = inject(NGXLogger);
  private readonly messageDialogService = inject(MessageDialogService);
  private readonly exportToFileService = inject(ExportToFileService);
  private readonly fallbackFilenameSuffix = new Date().toISOString().replace(/:/g, '-');

  private getRowErrors(): UploadError[] {
    return this.igsMeldungService.rowErrorsSub$.value;
  }

  get resultReportFilename(): string {
    if (this.igsMeldungService.lastBatchUploadFinishedAt()) {
      return 'igs-meldung-report__' + this.igsMeldungService.lastBatchUploadFinishedAt()?.toISOString().replace(/:/g, '-');
    }
    return 'igs-meldung-report__' + this.fallbackFilenameSuffix;
  }

  toDataSource(results: IgsMeldung.NotificationUploadInfo[]): MatTableDataSource<IgsMeldung.NotificationUploadInfo, MatPaginator> {
    return new MatTableDataSource(results);
  }

  onClickUploadError(rowNumber: number): void {
    const error = this.getRowErrors().find(uploadError => uploadError.rowNumber === rowNumber);
    this.messageDialogService.errorWithSearch({
      clipboardContent: error?.clipboardContent,
      errors: error?.errors || [],
    });
  }

  hasNotificationErrorData(): boolean {
    return this.getRowErrors().length > 0;
  }

  downloadReport() {
    const item = localStorage.getItem(IgsLocalStorageKeys.NOTIFICATION_UPLOADS);

    if (!item) {
      this.logger.error('No data to download');
      this.messageDialogService.errorWithSearch({
        errors: [{ text: 'Es sind keine Reportdaten zum Download vorhanden.' }],
      });
      return;
    }

    const notificationUploadInfo: IgsMeldung.ExportableNotificationUploadInfo[] = JSON.parse(item).map(
      (item: IgsMeldung.NotificationUploadInfo, index: number) => {
        const aggregatedErrorMessages = this.getRowErrors()
          [index]?.errors.map(e => e.text)
          .join(' -- ');

        return {
          rowNumber: item.rowNumber,
          demisNotificationId: item.demisNotificationId,
          labSequenceId: item.labSequenceId,
          status: item.status.toString(),
          uploadTimestamp: this.determineUploadTimestamp(item),
          demisSequenceId: item.demisSequenceId ?? 'n/a',
          errors: aggregatedErrorMessages ? aggregatedErrorMessages : '',
        } as IgsMeldung.ExportableNotificationUploadInfo;
      }
    );

    this.exportToFileService.exportToCsvFile(this.resultReportFilename, notificationUploadInfo);
  }

  private determineUploadTimestamp(item: IgsMeldung.NotificationUploadInfo): string {
    if (!item.uploadTimestamp || item.uploadTimestamp === '') {
      return 'n/a';
    } else {
      return item.uploadTimestamp;
    }
  }
}
