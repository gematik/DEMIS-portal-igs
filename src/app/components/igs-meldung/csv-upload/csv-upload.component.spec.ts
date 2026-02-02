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

import { By } from '@angular/platform-browser';
import { MessageDialogService } from '@gematik/demis-portal-core-library';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { LoggerModule } from 'ngx-logger';
import { of, throwError } from 'rxjs';
import { MeldungsdatenCsvFileUploadService } from 'src/api/services/meldungsdaten-csv-file-upload.service';
import { AppModule } from 'src/app/app.module';
import { toFileUploadInfo, UploadProgress } from 'src/shared/shared-functions';
import { mockFileList } from 'src/test/shared-behaviour/mock-file-list.function';
import { fromSimulatedUploadProgess, toSimulatedUpload } from 'src/test/utility/utility-functions';
import { igsBatchFastqTestdata } from '../igs-batch-fastq.testdata';
import { IgsMeldungService } from '../igs-meldung.service';
import { IgsMeldung } from '../igs-meldung.types';
import { CsvUploadComponent } from './csv-upload.component';
import { ConfigService } from 'src/app/config.service';

describe('CsvUploadComponent', () => {
  let fixture: MockedComponentFixture<CsvUploadComponent, CsvUploadComponent>;
  let component: CsvUploadComponent;

  beforeEach(() =>
    MockBuilder([CsvUploadComponent, AppModule]).mock(IgsMeldungService).mock(MeldungsdatenCsvFileUploadService).mock(MessageDialogService).mock(LoggerModule)
  );

  beforeEach(() => {
    fixture = MockRender(CsvUploadComponent);
    component = fixture.point.componentInstance;
  });

  it('should create', () => {
    expect(fixture).toBeDefined();
    expect(component).toBeTruthy();
  });

  it('should initialize uploading$ as false', () => {
    expect(component.uploading$.value).toBeFalse();
  });

  it('should call IgsMeldungService onFileDeleted', () => {
    const clearCsvFileSpy = spyOn(fixture.point.injector.get(IgsMeldungService), 'clearCsvFile');
    component.onFileDeleted();
    expect(clearCsvFileSpy).toHaveBeenCalled();
  });

  // useCsvFile
  it('should call IgsMeldungService useCsvFile for the first file in the FileList', () => {
    const useCsvFileSpy = spyOn(fixture.point.injector.get(IgsMeldungService), 'useCsvFile');
    const fileList = mockFileList(['test1.csv', 'test2.csv']);
    component.onFilesSelected(fileList);
    expect(useCsvFileSpy).toHaveBeenCalledTimes(1);
    expect(useCsvFileSpy).toHaveBeenCalledWith(fileList[0]);
  });

  it('should not call IgsMeldungService useCsvFile if FileList is null', () => {
    const useCsvFileSpy = spyOn(fixture.point.injector.get(IgsMeldungService), 'useCsvFile');
    component.onFilesSelected(null);
    expect(useCsvFileSpy).not.toHaveBeenCalled();
  });

  it('should not call IgsMeldungService useCsvFile if FileList is empty', () => {
    const useCsvFileSpy = spyOn(fixture.point.injector.get(IgsMeldungService), 'useCsvFile');
    const fileList = mockFileList([]);
    component.onFilesSelected(fileList);
    expect(useCsvFileSpy).not.toHaveBeenCalled();
  });

  // onUseFile
  it('should call MeldungsdatenCsvFileUploadService uploadCsvFile with the provided csvFile', () => {
    const uploadCsvFileSpy = spyOn(fixture.point.injector.get(MeldungsdatenCsvFileUploadService), 'uploadMeldungsdatenCsvFile').and.returnValue(
      fromSimulatedUploadProgess(1, igsBatchFastqTestdata).pipe(toSimulatedUpload(0), toFileUploadInfo())
    );
    const csvFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    component.onUseFile(csvFile);
    expect(uploadCsvFileSpy).toHaveBeenCalledWith(csvFile);
  });

  it('should set uploading$ to true while uploading the csv file', () => {
    const uploadCsvFileSpy = spyOn(fixture.point.injector.get(MeldungsdatenCsvFileUploadService), 'uploadMeldungsdatenCsvFile').and.returnValue(
      of({ progress: 50 } as UploadProgress<IgsMeldung.OverviewResponse>)
    );
    const csvFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    component.onUseFile(csvFile);
    expect(component.uploading$.value).toBeTrue();
  });

  it('should set uploading$ to false after successfully uploading the csv file', () => {
    const uploadCsvFileSpy = spyOn(fixture.point.injector.get(MeldungsdatenCsvFileUploadService), 'uploadMeldungsdatenCsvFile').and.returnValue(
      of({ progress: 100, payload: igsBatchFastqTestdata } as UploadProgress<IgsMeldung.OverviewResponse>)
    );
    const csvFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    component.onUseFile(csvFile);
    expect(component.uploading$.value).toBeFalse();
  });

  it('should set uploading$ to false if there is an error while uploading the csv file', () => {
    const uploadCsvFileSpy = spyOn(fixture.point.injector.get(MeldungsdatenCsvFileUploadService), 'uploadMeldungsdatenCsvFile').and.returnValue(
      throwError(() => ({ progress: 100, error: 'something went wrong' }) as UploadProgress<IgsMeldung.OverviewResponse>)
    );
    const csvFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    component.onUseFile(csvFile);
    expect(component.uploading$.value).toBeFalse();
  });

  it('should not display button last-results before uploading a CSV file when there are no last results in local storage', () => {
    spyOn(fixture.point.injector.get(IgsMeldungService), 'lastResultsAvailable').and.returnValue(false);
    fixture.detectChanges();
    const buttonLastResults = fixture.debugElement.query(By.css('#last-results'));
    expect(buttonLastResults).toBeNull();
  });

  it('should display button last-results before selecting a CSV file when there are last results in local storage', () => {
    spyOn(fixture.point.injector.get(IgsMeldungService), 'lastResultsAvailable').and.returnValue(true);
    fixture.detectChanges();
    const buttonLastResults = fixture.debugElement.query(By.css('#last-results'));
    expect(buttonLastResults).toBeTruthy();
  });

  it('should return false when no last results are available', () => {
    spyOn(fixture.point.injector.get(IgsMeldungService), 'lastResultsAvailable').and.returnValue(false);
    let showResults = component.showProceedToLastResults();
    expect(showResults).toBeFalse();
  });

  it('should return true when last results are available', () => {
    spyOn(fixture.point.injector.get(IgsMeldungService), 'lastResultsAvailable').and.returnValue(true);
    let showResults = component.showProceedToLastResults();
    expect(showResults).toBeTrue();
  });

  it('should call proceedToResultStep', () => {
    const igsMeldungServiceSpy = spyOn(fixture.point.injector.get(IgsMeldungService), 'proceedToResultStep');
    component.navigateToLastResults();
    expect(igsMeldungServiceSpy).toHaveBeenCalledTimes(1);
  });

  describe('with FEATURE_FLAG_PORTAL_IGS_SIDENAV enabled', () => {
    let configService: ConfigService;
    let igsMeldungService: IgsMeldungService;

    beforeEach(() => {
      configService = fixture.point.injector.get(ConfigService);
      igsMeldungService = fixture.point.injector.get(IgsMeldungService);
      spyOn(configService, 'isFeatureEnabled').and.returnValue(true);
    });

    it('should call stepNavigationService.next() after successful upload', () => {
      const stepNavigationService = { next: jasmine.createSpy('next') };
      (component as any).stepNavigationService = stepNavigationService;

      spyOn(fixture.point.injector.get(MeldungsdatenCsvFileUploadService), 'uploadMeldungsdatenCsvFile').and.returnValue(
        of({ progress: 100, payload: igsBatchFastqTestdata } as UploadProgress<IgsMeldung.OverviewResponse>)
      );

      const csvFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      component.onUseFile(csvFile);

      expect(stepNavigationService.next).toHaveBeenCalled();
    });

    it('should not call stepNavigationService.next() when upload is not complete', () => {
      const stepNavigationService = { next: jasmine.createSpy('next') };
      (component as any).stepNavigationService = stepNavigationService;

      spyOn(fixture.point.injector.get(MeldungsdatenCsvFileUploadService), 'uploadMeldungsdatenCsvFile').and.returnValue(
        of({ progress: 50 } as UploadProgress<IgsMeldung.OverviewResponse>)
      );

      const csvFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      component.onUseFile(csvFile);

      expect(stepNavigationService.next).not.toHaveBeenCalled();
    });

    it('should call stepNavigationService.next() three times when navigating to last results', () => {
      const stepNavigationService = { next: jasmine.createSpy('next') };
      (component as any).stepNavigationService = stepNavigationService;

      // Mock processSteps since IgsMeldungService is mocked
      (igsMeldungService as any).processSteps = [
        { key: 'csv-upload', control: { enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } },
        { key: 'sequence-selection', control: { enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } },
        { key: 'upload-status', control: { enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } },
        { key: 'result', control: { enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } },
      ];

      component.navigateToLastResults();

      expect(stepNavigationService.next).toHaveBeenCalledTimes(3);
    });

    it('should enable and then selectively disable processSteps when navigating to last results', () => {
      const stepNavigationService = { next: jasmine.createSpy('next') };
      (component as any).stepNavigationService = stepNavigationService;

      // Mock processSteps
      const mockSteps = [
        { key: 'csv-upload', control: { enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } },
        { key: 'sequence-selection', control: { enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } },
        { key: 'upload-status', control: { enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } },
        { key: 'result', control: { enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } },
      ];
      (igsMeldungService as any).processSteps = mockSteps;

      component.navigateToLastResults();

      // All steps should be enabled first
      mockSteps.forEach(step => {
        expect(step.control.enable).toHaveBeenCalled();
      });

      // All steps except 'result' should be disabled
      mockSteps.forEach(step => {
        if (step.key !== 'result') {
          expect(step.control.disable).toHaveBeenCalled();
        }
      });
    });

    it('should not disable the result step when navigating to last results', () => {
      const stepNavigationService = { next: jasmine.createSpy('next') };
      (component as any).stepNavigationService = stepNavigationService;

      // Mock processSteps
      const resultStep = { key: 'result', control: { enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } };
      const mockSteps = [
        { key: 'csv-upload', control: { enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } },
        { key: 'sequence-selection', control: { enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } },
        { key: 'upload-status', control: { enable: jasmine.createSpy('enable'), disable: jasmine.createSpy('disable') } },
        resultStep,
      ];
      (igsMeldungService as any).processSteps = mockSteps;

      component.navigateToLastResults();

      // Result step should be enabled but not disabled
      expect(resultStep.control.enable).toHaveBeenCalled();
      expect(resultStep.control.disable).not.toHaveBeenCalled();
    });
  });
});
