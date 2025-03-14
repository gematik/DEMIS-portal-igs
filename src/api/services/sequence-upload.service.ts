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

import { lastValueFrom, map, Observable, Subject, takeUntil } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { ConfigService } from 'src/app/config.service';
import { NGXLogger } from 'ngx-logger';
import { IgsMeldung } from 'src/app/components/igs-meldung/igs-meldung.types';

export type UploadSequenceFileParams = {
  sequenceUploadUrl: string;
  file: File;
  documentReferenceId: string | undefined;
};

export type UploadSequenceFileChunkParams = {
  presignedUrl: string;
  file: File;
  partSizeBytes: number;
  partNo: number;
};

export type UploadProcessInfo = {
  uploadId: string;
  presignedUrls: string[];
  partSizeBytes: number;
};

export type ChunkUploadResponse = {
  partNumber: number;
  eTag: string | null;
};

export type FinishUploadInfo = {
  documentReferenceId: string;
  uploadId: string;
  completedChunks: ChunkUploadResponse[];
};

export type SequenceValidationInfo = {
  documentReferenceId: string;
  status: IgsMeldung.SequenceValidationInfoStatus;
  message: string;
};

@Injectable({
  providedIn: 'root',
})
export class SequenceUploadService {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(ConfigService);
  private readonly logger = inject(NGXLogger);

  getFileUploadInfo(documentReferenceId: string, fileSize: number): Observable<UploadProcessInfo> {
    return this.http.get<UploadProcessInfo>(
      `${this.configService.igsServiceUrl}/S3Controller/upload/${documentReferenceId}/s3-upload-info?fileSize=${fileSize}`
    );
  }

  async uploadSequenceFileChunk({ presignedUrl, file, partNo, partSizeBytes }: UploadSequenceFileChunkParams): Promise<ChunkUploadResponse> {
    const start = (partNo - 1) * partSizeBytes;
    const end = Math.min(start + partSizeBytes, file.size);
    const chunk = file.slice(start, end);

    const httpReq = new HttpRequest('PUT', presignedUrl, chunk);
    const uploadObservable = this.http.request(httpReq).pipe(
      map(httpResponse => {
        if (httpResponse.type === HttpEventType.Response) {
          return { partNumber: partNo, eTag: httpResponse.headers.get('etag') } as ChunkUploadResponse;
        }

        return { partNumber: partNo, eTag: null } as ChunkUploadResponse;
      })
    );

    return lastValueFrom(uploadObservable);
  }

  finishSequenceFileUpload({ documentReferenceId, uploadId, completedChunks }: FinishUploadInfo) {
    return this.http.post(`${this.configService.igsServiceUrl}/S3Controller/upload/${documentReferenceId}/$finish-upload`, { uploadId, completedChunks });
  }

  async pollSequenceValidationResult(documentReferenceId: string, uploadCanceled: Subject<boolean>): Promise<SequenceValidationInfo> {
    for (let attempt = 0; attempt < this.configService.maxAttempts; attempt++) {
      const result = await this.getValidationStatus(documentReferenceId, uploadCanceled);
      if (result.status === 'VALID' || result.status === 'VALIDATION_FAILED') {
        return result;
      }
      await new Promise(resolve => setTimeout(resolve, this.configService.waitBetweenRetires));
    }
    throw new Error(`Validation failed after ${this.configService.maxAttempts} attempts`);
  }

  async initValidation(documentReferenceId: string): Promise<void> {
    const url = `${this.configService.igsServiceUrl}/S3Controller/upload/${documentReferenceId}/$validate`;
    const headers = { 'Content-Type': 'application/json' };

    const response = await lastValueFrom(this.http.post(url, {}, { headers, observe: 'response' }));
  }

  private async getValidationStatus(documentReferenceId: string, uploadCanceled: Subject<boolean>): Promise<SequenceValidationInfo> {
    const url = `${this.configService.igsServiceUrl}/S3Controller/upload/${documentReferenceId}/$validation-status`;
    const headers = { 'Content-Type': 'application/json' };

    const response = await lastValueFrom(this.http.get<SequenceValidationInfo>(url, { headers, observe: 'response' }).pipe(takeUntil(uploadCanceled)));
    if (response.status === 200) {
      return response.body!;
    } else {
      throw new Error(`Querying sequence validation status returned http status ${response.status}`);
    }
  }
}
