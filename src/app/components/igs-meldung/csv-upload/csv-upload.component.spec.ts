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

import { MessageDialogService } from '@gematik/demis-portal-core-library';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { LoggerModule } from 'ngx-logger';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { MeldungsdatenCsvFileUploadService } from 'src/api/services/meldungsdaten-csv-file-upload.service';
import { AppModule } from 'src/app/app.module';
import { toFileUploadInfo, UploadProgress } from 'src/shared/shared-functions';
import { mockFileList } from 'src/test/shared-behaviour/mock-file-list.function';
import { fromSimulatedUploadProgess, toSimulatedUpload } from 'src/test/utility/utility-functions';
import { igsBatchFastqTestdata } from '../igs-batch-fastq.testdata';
import { IgsMeldungService } from '../igs-meldung.service';
import { IgsMeldung } from '../igs-meldung.types';
import { CsvUploadStepComponent } from './csv-upload.component';
import { By } from '@angular/platform-browser';

describe('CsvUploadStepComponent', () => {
  let fixture: MockedComponentFixture<CsvUploadStepComponent, CsvUploadStepComponent>;
  let component: CsvUploadStepComponent;

  beforeEach(() =>
    MockBuilder([CsvUploadStepComponent, AppModule])
      .mock(IgsMeldungService)
      .mock(MeldungsdatenCsvFileUploadService)
      .mock(MessageDialogService)
      .mock(LoggerModule)
  );

  beforeEach(() => {
    fixture = MockRender(CsvUploadStepComponent);
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

  it('should set uploading$ to true while uploading the csv file', async () => {
    const uploadCsvFileSpy = spyOn(fixture.point.injector.get(MeldungsdatenCsvFileUploadService), 'uploadMeldungsdatenCsvFile').and.returnValue(
      of({ progress: 50 } as UploadProgress<IgsMeldung.OverviewResponse>)
    );
    const csvFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    await component.onUseFile(csvFile);
    expect(component.uploading$.value).toBeTrue();
  });

  it('should set uploading$ to false after successfully uploading the csv file', async () => {
    const uploadCsvFileSpy = spyOn(fixture.point.injector.get(MeldungsdatenCsvFileUploadService), 'uploadMeldungsdatenCsvFile').and.returnValue(
      of({ progress: 100, payload: igsBatchFastqTestdata } as UploadProgress<IgsMeldung.OverviewResponse>)
    );
    const csvFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    await component.onUseFile(csvFile);
    expect(component.uploading$.value).toBeFalse();
  });

  it('should set uploading$ to false if there is an error while uploading the csv file', async () => {
    const uploadCsvFileSpy = spyOn(fixture.point.injector.get(MeldungsdatenCsvFileUploadService), 'uploadMeldungsdatenCsvFile').and.returnValue(
      throwError(() => ({ progress: 100, error: 'something went wrong' }) as UploadProgress<IgsMeldung.OverviewResponse>)
    );
    const csvFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    await component.onUseFile(csvFile);
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
});
