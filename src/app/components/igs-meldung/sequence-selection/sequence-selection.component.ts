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

import { Component, inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { IgsMeldungService } from '../igs-meldung.service';
import { MatPaginator } from '@angular/material/paginator';
import { IgsMeldung } from '../igs-meldung.types';

@Component({
  selector: 'np-mf-igs-sequence-selection',
  templateUrl: './sequence-selection.component.html',
  styleUrl: './sequence-selection.component.scss',
})
export class SequenceSelectionComponent {
  igsMeldungService = inject(IgsMeldungService);

  toDataSource(overviewData: IgsMeldung.SequenzdateienSelectOverview[]): MatTableDataSource<IgsMeldung.SequenzdateienSelectOverview, MatPaginator> {
    return new MatTableDataSource(overviewData);
  }

  onFilesSelected(fileList: FileList | null) {
    if (!!fileList && fileList.length > 0) {
      this.igsMeldungService.attachFiles(fileList);
    }
  }
}
