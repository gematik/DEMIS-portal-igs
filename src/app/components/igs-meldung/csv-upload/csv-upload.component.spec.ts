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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageDialogService, StepNavigation } from '@gematik/demis-portal-core-library';
import { MockBuilder, MockRender } from 'ng-mocks';
import { LoggerModule, NGXLogger } from 'ngx-logger';
import { of, throwError } from 'rxjs';
import { MeldungsdatenCsvFileUploadService } from 'src/api/services/meldungsdaten-csv-file-upload.service';
import { toFileUploadInfo, UploadProgress } from 'src/shared/shared-functions';
import { mockFileList } from 'src/test/shared-behaviour/mock-file-list.function';
import { fromSimulatedUploadProgess, toSimulatedUpload } from 'src/test/utility/utility-functions';
import { igsBatchFastqTestdata } from '../igs-batch-fastq.testdata';
import { IgsMeldungService } from '../igs-meldung.service';
import { IgsMeldung } from '../igs-meldung.types';
import { CsvUploadComponent } from './csv-upload.component';

describe('CsvUploadComponent', () => {
  let fixture: any;
  let component: any;

  beforeEach(() =>
    MockBuilder([CsvUploadComponent])
      .mock(IgsMeldungService)
      .mock(MeldungsdatenCsvFileUploadService)
      .mock(MessageDialogService)
      .mock(LoggerModule)
      .mock(NGXLogger)
      .mock(StepNavigation, {
        next: vi.fn(),
        previous: vi.fn(),
        reset: vi.fn(),
        goToStep: vi.fn(),
        goToStepByKey: vi.fn(),
      })
  );

  beforeEach(() => {
    const rendered = MockRender(CsvUploadComponent);
    fixture = rendered;
    component = rendered.point.componentInstance;
  });

  afterEach(() => {
    // Clean up localStorage to ensure test isolation
    localStorage.clear();
  });

  it('should create', () => {
    expect(fixture).toBeDefined();
    expect(component).toBeTruthy();
  });

  it('should initialize uploading$ as false', () => {
    expect(component.uploading$.value).toBe(false);
  });

  it('should call IgsMeldungService onFileDeleted', () => {
    const clearCsvFileSpy = vi.spyOn(fixture.point.injector.get(IgsMeldungService), 'clearCsvFile');
    component.onFileDeleted();
    expect(clearCsvFileSpy).toHaveBeenCalled();
  });

  // useCsvFile
  it('should call IgsMeldungService useCsvFile for the first file in the FileList', () => {
    const useCsvFileSpy = vi.spyOn(fixture.point.injector.get(IgsMeldungService), 'useCsvFile');
    const fileList = mockFileList(['test1.csv', 'test2.csv']);
    component.onFilesSelected(fileList);
    expect(useCsvFileSpy).toHaveBeenCalledTimes(1);
    expect(useCsvFileSpy).toHaveBeenCalledWith(fileList[0]);
  });

  it('should not call IgsMeldungService useCsvFile if FileList is null', () => {
    const useCsvFileSpy = vi.spyOn(fixture.point.injector.get(IgsMeldungService), 'useCsvFile');
    component.onFilesSelected(null);
    expect(useCsvFileSpy).not.toHaveBeenCalled();
  });

  it('should not call IgsMeldungService useCsvFile if FileList is empty', () => {
    const useCsvFileSpy = vi.spyOn(fixture.point.injector.get(IgsMeldungService), 'useCsvFile');
    const fileList = mockFileList([]);
    component.onFilesSelected(fileList);
    expect(useCsvFileSpy).not.toHaveBeenCalled();
  });

  // onUseFile
  it('should call MeldungsdatenCsvFileUploadService uploadCsvFile with the provided csvFile', () => {
    const uploadCsvFileSpy = vi
      .spyOn(fixture.point.injector.get(MeldungsdatenCsvFileUploadService), 'uploadMeldungsdatenCsvFile')
      .mockReturnValue(fromSimulatedUploadProgess(1, igsBatchFastqTestdata).pipe(toSimulatedUpload(0), toFileUploadInfo()));
    const csvFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    component.onUseFile(csvFile);
    expect(uploadCsvFileSpy).toHaveBeenCalledWith(csvFile);
  });

  it('should set uploading$ to true while uploading the csv file', () => {
    vi.spyOn(fixture.point.injector.get(MeldungsdatenCsvFileUploadService), 'uploadMeldungsdatenCsvFile').mockReturnValue(
      of({ progress: 50 } as UploadProgress<IgsMeldung.OverviewResponse>)
    );
    const csvFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    component.onUseFile(csvFile);
    expect(component.uploading$.value).toBe(true);
  });

  it('should set uploading$ to false after successfully uploading the csv file', () => {
    vi.spyOn(fixture.point.injector.get(MeldungsdatenCsvFileUploadService), 'uploadMeldungsdatenCsvFile').mockReturnValue(
      of({ progress: 100, payload: igsBatchFastqTestdata } as UploadProgress<IgsMeldung.OverviewResponse>)
    );
    const csvFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    component.onUseFile(csvFile);
    expect(component.uploading$.value).toBe(false);
  });

  it('should set uploading$ to false if there is an error while uploading the csv file', () => {
    vi.spyOn(fixture.point.injector.get(MeldungsdatenCsvFileUploadService), 'uploadMeldungsdatenCsvFile').mockReturnValue(
      throwError(
        () =>
          ({
            progress: 100,
            error: 'something went wrong',
          }) as UploadProgress<IgsMeldung.OverviewResponse>
      )
    );
    const csvFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    component.onUseFile(csvFile);
    expect(component.uploading$.value).toBe(false);
  });

  it('should not display button last-results before uploading a CSV file when there are no last results in local storage', () => {
    vi.spyOn(fixture.point.injector.get(IgsMeldungService), 'lastResultsAvailable').mockReturnValue(false);
    // Test the method directly without triggering change detection
    const result = component.showProceedToLastResults();
    expect(result).toBe(false);
  });

  it('should display button last-results before selecting a CSV file when there are last results in local storage', () => {
    vi.spyOn(fixture.point.injector.get(IgsMeldungService), 'lastResultsAvailable').mockReturnValue(true);
    // Test the method directly without triggering change detection
    const result = component.showProceedToLastResults();
    expect(result).toBe(true);
  });

  it('should return false when no last results are available', () => {
    vi.spyOn(fixture.point.injector.get(IgsMeldungService), 'lastResultsAvailable').mockReturnValue(false);
    let showResults = component.showProceedToLastResults();
    expect(showResults).toBe(false);
  });

  it('should return true when last results are available', () => {
    vi.spyOn(fixture.point.injector.get(IgsMeldungService), 'lastResultsAvailable').mockReturnValue(true);
    let showResults = component.showProceedToLastResults();
    expect(showResults).toBe(true);
  });

  it('should call proceedToResultStep', () => {
    const igsMeldungServiceSpy = vi.spyOn(fixture.point.injector.get(IgsMeldungService), 'proceedToResultStep');
    (fixture.point.injector.get(IgsMeldungService) as any).processSteps = [
      { key: 'csv-upload', control: { enable: vi.fn(), disable: vi.fn() } },
      { key: 'sequence-selection', control: { enable: vi.fn(), disable: vi.fn() } },
      { key: 'upload-status', control: { enable: vi.fn(), disable: vi.fn() } },
      { key: 'result', control: { enable: vi.fn(), disable: vi.fn() } },
    ];
    component.navigateToLastResults();
    expect(igsMeldungServiceSpy).toHaveBeenCalledTimes(1);
  });

  it('should enable all process steps before disabling non-result steps when navigating to last results', () => {
    const stepNavigationService = { goToStepByKey: vi.fn() };
    (component as any).stepNavigationService = stepNavigationService;

    const mockSteps = [
      { key: 'csv-upload', control: { enable: vi.fn(), disable: vi.fn() } },
      { key: 'sequence-selection', control: { enable: vi.fn(), disable: vi.fn() } },
      { key: 'upload-status', control: { enable: vi.fn(), disable: vi.fn() } },
      { key: 'result', control: { enable: vi.fn(), disable: vi.fn() } },
    ];

    (fixture.point.injector.get(IgsMeldungService) as any).processSteps = mockSteps;

    component.navigateToLastResults();

    mockSteps.forEach(step => {
      expect(step.control.enable).toHaveBeenCalledTimes(1);
    });
    expect(stepNavigationService.goToStepByKey).toHaveBeenCalledWith('result');

    mockSteps.forEach(step => {
      if (step.key === 'result') {
        expect(step.control.disable).not.toHaveBeenCalled();
      } else {
        expect(step.control.disable).toHaveBeenCalledTimes(1);
      }
    });
  });

  it('should call stepNavigationService.next() after successful upload', () => {
    const stepNavigationService = { next: vi.fn() };
    (component as any).stepNavigationService = stepNavigationService;

    vi.spyOn(fixture.point.injector.get(MeldungsdatenCsvFileUploadService), 'uploadMeldungsdatenCsvFile').mockReturnValue(
      of({ progress: 100, payload: igsBatchFastqTestdata } as UploadProgress<IgsMeldung.OverviewResponse>)
    );

    const csvFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    component.onUseFile(csvFile);

    expect(stepNavigationService.next).toHaveBeenCalled();
  });

  it('should not call stepNavigationService.next() when upload is not complete', () => {
    const stepNavigationService = { next: vi.fn() };
    (component as any).stepNavigationService = stepNavigationService;

    vi.spyOn(fixture.point.injector.get(MeldungsdatenCsvFileUploadService), 'uploadMeldungsdatenCsvFile').mockReturnValue(
      of({ progress: 50 } as UploadProgress<IgsMeldung.OverviewResponse>)
    );

    const csvFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    component.onUseFile(csvFile);

    expect(stepNavigationService.next).not.toHaveBeenCalled();
  });

  it('should call stepNavigationService.goToStepByKey() when navigating to last results', () => {
    const stepNavigationService = { goToStepByKey: vi.fn() };
    (component as any).stepNavigationService = stepNavigationService;

    (fixture.point.injector.get(IgsMeldungService) as any).processSteps = [
      { key: 'csv-upload', control: { enable: vi.fn(), disable: vi.fn() } },
      { key: 'sequence-selection', control: { enable: vi.fn(), disable: vi.fn() } },
      { key: 'upload-status', control: { enable: vi.fn(), disable: vi.fn() } },
      { key: 'result', control: { enable: vi.fn(), disable: vi.fn() } },
    ];

    component.navigateToLastResults();

    expect(stepNavigationService.goToStepByKey).toHaveBeenCalledWith('result');
  });

  it('should enable and then selectively disable processSteps when navigating to last results', () => {
    const stepNavigationService = { goToStepByKey: vi.fn() };
    (component as any).stepNavigationService = stepNavigationService;

    (fixture.point.injector.get(IgsMeldungService) as any).processSteps = [
      { key: 'csv-upload', control: { enable: vi.fn(), disable: vi.fn() } },
      { key: 'sequence-selection', control: { enable: vi.fn(), disable: vi.fn() } },
      { key: 'upload-status', control: { enable: vi.fn(), disable: vi.fn() } },
      { key: 'result', control: { enable: vi.fn(), disable: vi.fn() } },
    ];

    component.navigateToLastResults();

    expect(stepNavigationService.goToStepByKey).toHaveBeenCalledWith('result');

    // All steps should be enabled first
    (fixture.point.injector.get(IgsMeldungService) as any).processSteps.forEach((step: any) => {
      expect(step.control.enable).toHaveBeenCalled();
    });

    // All steps except 'result' should be disabled
    (fixture.point.injector.get(IgsMeldungService) as any).processSteps.forEach((step: any) => {
      if (step.key !== 'result') {
        expect(step.control.disable).toHaveBeenCalled();
      }
    });
  });

  it('should not disable the result step when navigating to last results', () => {
    const stepNavigationService = { goToStepByKey: vi.fn() };
    (component as any).stepNavigationService = stepNavigationService;

    // Mock processSteps
    const resultStep = {
      key: 'result',
      control: { enable: vi.fn(), disable: vi.fn() },
    };

    // Mock processSteps
    const mockSteps = [
      { key: 'csv-upload', control: { enable: vi.fn(), disable: vi.fn() } },
      { key: 'sequence-selection', control: { enable: vi.fn(), disable: vi.fn() } },
      { key: 'upload-status', control: { enable: vi.fn(), disable: vi.fn() } },
      resultStep,
    ];
    (fixture.point.injector.get(IgsMeldungService) as any).processSteps = mockSteps;

    component.navigateToLastResults();

    // Result step should be enabled but not disabled
    expect(stepNavigationService.goToStepByKey).toHaveBeenCalledWith('result');
    expect(resultStep.control.enable).toHaveBeenCalled();
    expect(resultStep.control.disable).not.toHaveBeenCalled();
  });
});
