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

import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MessageDialogService } from '@gematik/demis-portal-core-library';
import { IgsMeldungService } from 'src/app/components/igs-meldung/igs-meldung.service';
import { IgsMeldung } from 'src/app/components/igs-meldung/igs-meldung.types';

@Component({
  selector: 'np-mf-igs-upload-status',
  templateUrl: './upload-status.component.html',
  styleUrl: './upload-status.component.scss',
  standalone: false,
})
export class UploadStatusComponent implements OnInit {
  igsMeldungService = inject(IgsMeldungService);
  private readonly messageDialogService = inject(MessageDialogService);

  private getRowErrors() {
    return this.igsMeldungService.rowErrorsSub$.value;
  }

  ngOnInit(): void {
    this.igsMeldungService.uploadNotifications();
  }

  toDataSource(overviewData: IgsMeldung.SequenzdateienSelectOverview[]): MatTableDataSource<IgsMeldung.SequenzdateienSelectOverview, MatPaginator> {
    return new MatTableDataSource(overviewData);
  }

  onClickUploadError(rowNumber: number): void {
    const rowError = this.getRowErrors().find(uploadError => uploadError.rowNumber === rowNumber);
    this.messageDialogService.showErrorDialog({
      clipboardContent: rowError?.clipboardContent,
      errors: rowError?.errors || [],
    });
  }

  hasErrorData(): boolean {
    return this.getRowErrors().length > 0;
  }
}
