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
    For additional notes and disclaimer from gematik and in case of changes by gematik,
    find details in the "Readme" file.
 */

import { TestBed } from '@angular/core/testing';
import { MatTableDataSource } from '@angular/material/table';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { LoggerModule } from 'ngx-logger';
import { AppModule } from 'src/app/app.module';
import { mockFileList } from 'src/test/shared-behaviour/mock-file-list.function';
import { igsBatchFastqSequenzdateienSelectOverview } from '../igs-batch-fastq.testdata';
import { IgsMeldungService } from '../igs-meldung.service';
import { SequenceSelectionComponent } from './sequence-selection.component';

describe('SequenceSelectionComponent', () => {
  let fixture: MockedComponentFixture<SequenceSelectionComponent, SequenceSelectionComponent>;
  let component: SequenceSelectionComponent;
  let igsMeldungService: IgsMeldungService;

  beforeEach(() => MockBuilder([SequenceSelectionComponent, AppModule]).mock(LoggerModule));

  beforeEach(() => {
    fixture = MockRender(SequenceSelectionComponent);
    component = fixture.point.componentInstance;
    igsMeldungService = TestBed.inject(IgsMeldungService);
  });

  it('should create', () => {
    expect(fixture).toBeDefined();
    expect(component).toBeTruthy();
  });

  it('should return a MatTableDataSource object', () => {
    const dataSource = component.toDataSource(igsBatchFastqSequenzdateienSelectOverview);
    expect(dataSource instanceof MatTableDataSource).toBe(true);
  });

  it('should set the data property of the MatTableDataSource', () => {
    const dataSource = component.toDataSource(igsBatchFastqSequenzdateienSelectOverview);
    expect(dataSource.data).toEqual(igsBatchFastqSequenzdateienSelectOverview);
  });

  it('should handle null file list', () => {
    const fileList: FileList | null = null;
    const attachFilesSpy = spyOn(igsMeldungService, 'attachFiles');

    component.onFilesSelected(fileList);

    expect(attachFilesSpy).not.toHaveBeenCalled();
  });

  it('should handle empty file list', () => {
    const fileList = mockFileList([]);
    const attachFilesSpy = spyOn(igsMeldungService, 'attachFiles');

    component.onFilesSelected(fileList);

    expect(attachFilesSpy).not.toHaveBeenCalled();
  });

  it('should handle non-empty file list', () => {
    const fileList = mockFileList(['testfile.txt']);
    const attachFilesSpy = spyOn(igsMeldungService, 'attachFiles');

    component.onFilesSelected(fileList);

    expect(attachFilesSpy).toHaveBeenCalledWith(fileList);
  });
});
