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

import { Component, computed, inject } from '@angular/core';
import { createStepContent } from '@gematik/demis-portal-core-library';
import { CsvUploadComponent } from '../components/igs-meldung/csv-upload/csv-upload.component';
import { IgsMeldungService } from '../components/igs-meldung/igs-meldung.service';
import { ResultComponent } from '../components/igs-meldung/result/result.component';
import { SequenceSelectionComponent } from '../components/igs-meldung/sequence-selection/sequence-selection.component';
import { UploadStatusComponent } from '../components/igs-meldung/upload-status/upload-status.component';

/**
 * Container component for the IGS notification process using the new SideNavigationComponent.
 * This component manages the multi-step process for genomic surveillance notification.
 */
@Component({
  selector: 'np-mf-igs-notification',
  templateUrl: './igs-notification.component.html',
  standalone: false,
})
export class IgsNotificationComponent {
  protected readonly igsMeldungService = inject(IgsMeldungService);

  private readonly stepContents = computed(() => [
    createStepContent({ component: CsvUploadComponent }),
    createStepContent({ component: SequenceSelectionComponent }),
    createStepContent({ component: UploadStatusComponent }),
    createStepContent({ component: ResultComponent }),
  ]);

  /**
   * Maps process steps to their corresponding content components
   */
  protected readonly stepsMap = computed(() => {
    return new Map(this.igsMeldungService.processSteps.map((step, index) => [step, this.stepContents()[index]]));
  });
}
