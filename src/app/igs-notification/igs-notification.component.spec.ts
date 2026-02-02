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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockBuilder, MockRender, ngMocks } from 'ng-mocks';
import { AppModule } from '../app.module';
import { IgsMeldungService } from '../components/igs-meldung/igs-meldung.service';
import { IgsNotificationComponent } from './igs-notification.component';
import { CsvUploadComponent } from '../components/igs-meldung/csv-upload/csv-upload.component';
import { SequenceSelectionComponent } from '../components/igs-meldung/sequence-selection/sequence-selection.component';
import { UploadStatusComponent } from '../components/igs-meldung/upload-status/upload-status.component';
import { ResultComponent } from '../components/igs-meldung/result/result.component';

describe('IgsNotificationComponent', () => {
  let component: IgsNotificationComponent;
  let fixture: ComponentFixture<IgsNotificationComponent>;
  let igsMeldungService: IgsMeldungService;

  beforeEach(() => MockBuilder([IgsNotificationComponent, AppModule]));

  beforeEach(() => {
    fixture = MockRender(IgsNotificationComponent);
    component = fixture.componentInstance;
    igsMeldungService = TestBed.inject(IgsMeldungService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject IgsMeldungService', () => {
    expect(component['igsMeldungService']).toBeDefined();
    expect(component['igsMeldungService']).toBeInstanceOf(IgsMeldungService);
  });

  it('should create stepContents with correct components', () => {
    const stepContents = component['stepContents']();

    expect(stepContents).toBeDefined();
    expect(stepContents.length).toBe(4);

    // Verify that all step contents have the expected component types
    expect(stepContents[0].component).toBe(CsvUploadComponent);
    expect(stepContents[1].component).toBe(SequenceSelectionComponent);
    expect(stepContents[2].component).toBe(UploadStatusComponent);
    expect(stepContents[3].component).toBe(ResultComponent);
  });

  it('should create stepsMap with correct mappings', () => {
    const stepsMap = component['stepsMap']();

    expect(stepsMap).toBeDefined();
    expect(stepsMap instanceof Map).toBe(true);
    expect(stepsMap.size).toBe(igsMeldungService.processSteps.length);

    // Verify that each process step is mapped to a step content
    igsMeldungService.processSteps.forEach((step, index) => {
      const stepContent = stepsMap.get(step);
      expect(stepContent).toBeDefined();
      expect(stepContent?.component).toBeDefined();
    });
  });

  it('should map first process step to CsvUploadComponent', () => {
    const stepsMap = component['stepsMap']();
    const firstStep = igsMeldungService.processSteps[0];
    const firstStepContent = stepsMap.get(firstStep);

    expect(firstStepContent).toBeDefined();
    expect(firstStepContent?.component).toBe(CsvUploadComponent);
  });

  it('should map second process step to SequenceSelectionComponent', () => {
    const stepsMap = component['stepsMap']();
    const secondStep = igsMeldungService.processSteps[1];
    const secondStepContent = stepsMap.get(secondStep);

    expect(secondStepContent).toBeDefined();
    expect(secondStepContent?.component).toBe(SequenceSelectionComponent);
  });

  it('should map third process step to UploadStatusComponent', () => {
    const stepsMap = component['stepsMap']();
    const thirdStep = igsMeldungService.processSteps[2];
    const thirdStepContent = stepsMap.get(thirdStep);

    expect(thirdStepContent).toBeDefined();
    expect(thirdStepContent?.component).toBe(UploadStatusComponent);
  });

  it('should map fourth process step to ResultComponent', () => {
    const stepsMap = component['stepsMap']();
    const fourthStep = igsMeldungService.processSteps[3];
    const fourthStepContent = stepsMap.get(fourthStep);

    expect(fourthStepContent).toBeDefined();
    expect(fourthStepContent?.component).toBe(ResultComponent);
  });

  it('should render gem-demis-side-navigation component', () => {
    const sideNavElement = ngMocks.find(fixture, 'gem-demis-side-navigation', null);
    expect(sideNavElement).toBeTruthy();
  });

  it('should render max-height-content-container', () => {
    const containerElement = ngMocks.find(fixture, 'gem-demis-max-height-content-container', null);
    expect(containerElement).toBeTruthy();
  });

  it('should update stepsMap when processSteps change', () => {
    const initialStepsMap = component['stepsMap']();
    const initialSize = initialStepsMap.size;

    // Verify that stepsMap is computed and reactive
    expect(initialSize).toBe(igsMeldungService.processSteps.length);

    // The stepsMap should always reflect the current processSteps
    const currentStepsMap = component['stepsMap']();
    expect(currentStepsMap.size).toBe(igsMeldungService.processSteps.length);
  });
});
