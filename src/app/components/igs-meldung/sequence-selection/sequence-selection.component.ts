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

import { Component, inject, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { StepContentComponent, StepNavigationService } from '@gematik/demis-portal-core-library';
import { IgsMeldungService } from '../igs-meldung.service';
import { IgsMeldung } from '../igs-meldung.types';
import { ConfigService } from '../../../config.service';

@Component({
  selector: 'np-mf-igs-sequence-selection',
  templateUrl: './sequence-selection.component.html',
  styleUrl: './sequence-selection.component.scss',
  standalone: false,
})
export class SequenceSelectionComponent extends StepContentComponent<void> implements OnInit {
  igsMeldungService = inject(IgsMeldungService);
  private readonly configService = inject(ConfigService);
  // remove optional when FEATURE_FLAG_PORTAL_IGS_SIDENAV is default enabled
  private readonly stepNavigationService = inject(StepNavigationService, { optional: true });

  get FEATURE_FLAG_PORTAL_IGS_SIDENAV(): boolean {
    return this.configService.isFeatureEnabled('FEATURE_FLAG_PORTAL_IGS_SIDENAV');
  }

  ngOnInit(): void {
    if (this.configService.isFeatureEnabled('FEATURE_FLAG_PORTAL_IGS_SIDENAV')) {
      this.igsMeldungService.processSteps[0].control.disable();
    }
  }

  toDataSource(overviewData: IgsMeldung.SequenzdateienSelectOverview[]): MatTableDataSource<IgsMeldung.SequenzdateienSelectOverview, MatPaginator> {
    return new MatTableDataSource(overviewData);
  }

  onFilesSelected(fileList: FileList | null) {
    if (!!fileList && fileList.length > 0) {
      this.igsMeldungService.attachFiles(fileList);
    }
  }

  proceed() {
    this.igsMeldungService.proceed();
    if (this.configService.isFeatureEnabled('FEATURE_FLAG_PORTAL_IGS_SIDENAV')) {
      this.stepNavigationService?.next();
    }
  }

  backToWelcome() {
    this.igsMeldungService.backToWelcome(() => this.stepNavigationService?.reset());
  }
}
