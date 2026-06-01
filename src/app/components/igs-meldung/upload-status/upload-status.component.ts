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

import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  MatTableDataSource,
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow,
} from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import {
  MessageDialogService,
  StepContentComponent,
  StepNavigation,
  SectionHeaderComponent,
  SecondaryButtonDirective,
  ActionsBarComponent,
} from '@gematik/demis-portal-core-library';
import { IgsMeldungService } from 'src/app/components/igs-meldung/igs-meldung.service';
import { IgsMeldung } from 'src/app/components/igs-meldung/igs-meldung.types';
import { ConfigService } from '../../../config.service';
import { Subject, takeUntil } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import { NgTemplateOutlet, AsyncPipe, DatePipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'np-mf-igs-upload-status',
  templateUrl: './upload-status.component.html',
  styleUrl: './upload-status.component.scss',
  imports: [
    SectionHeaderComponent,
    MatIcon,
    MatIconButton,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    NgTemplateOutlet,
    MatProgressSpinner,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatButton,
    SecondaryButtonDirective,
    ActionsBarComponent,
    AsyncPipe,
    DatePipe,
  ],
})
export class UploadStatusComponent extends StepContentComponent<void> implements OnInit, OnDestroy {
  igsMeldungService = inject(IgsMeldungService);
  private readonly messageDialogService = inject(MessageDialogService);
  private readonly configService = inject(ConfigService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly stepNavigationService = inject(StepNavigation);
  private readonly destroy$ = new Subject<void>();

  get FEATURE_FLAG_PORTAL_IGS_SIDENAV(): boolean {
    return this.configService.isFeatureEnabled('FEATURE_FLAG_PORTAL_IGS_SIDENAV');
  }

  private getRowErrors() {
    return this.igsMeldungService.rowErrorsSub$.value;
  }

  ngOnInit(): void {
    if (this.FEATURE_FLAG_PORTAL_IGS_SIDENAV) {
      this.igsMeldungService.processSteps[0].control.disable();
      this.igsMeldungService.processSteps[1].control.disable();
    }

    // Subscribe to rowErrorsSub$ to trigger change detection when errors change
    // This prevents NG0100 errors when hasErrorData() is called in templates
    this.igsMeldungService.rowErrorsSub$.pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.markForCheck());

    // Subscribe to upload observables to trigger change detection when upload status changes
    this.igsMeldungService.notificationUploads$.pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.markForCheck());
    this.igsMeldungService.fileUploads$.pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.markForCheck());

    // Start upload and mark for check after async operations complete
    this.igsMeldungService.uploadNotifications()?.then(() => {
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  cancel() {
    this.igsMeldungService.cancel();
    if (this.configService.isFeatureEnabled('FEATURE_FLAG_PORTAL_IGS_SIDENAV')) {
      // mark the upload-status step as not completed
      this.igsMeldungService.processSteps[2].control.setValue(null);
      this.igsMeldungService.processSteps[2].control.markAsTouched();
      this.igsMeldungService.processSteps[2].control.updateValueAndValidity();
      // enable the result step
      this.igsMeldungService.processSteps[3].control.enable();
      // navigate to the result step
      this.stepNavigationService.next();
    }
  }

  proceed() {
    this.igsMeldungService.proceed();
    if (this.configService.isFeatureEnabled('FEATURE_FLAG_PORTAL_IGS_SIDENAV')) {
      this.stepNavigationService.next();
    }
  }
}
