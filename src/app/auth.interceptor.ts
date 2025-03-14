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

import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private logger = inject(NGXLogger);
  private config = inject(ConfigService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.logger.debug('mfe igs - intercepting request', req);
    const token = (window as any)['token'];

    if (!!token && this.isTokenNeeded(req)) {
      this.logger.debug('mfe igs - request needs a token', req);
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      });
      return next.handle(cloned);
    }

    this.logger.debug('mfe igs - request does not need a token', req);
    return next.handle(req);
  }

  get needsToken() {
    return [this.config.igsGatewayUrl, this.config.igsServiceUrl];
  }

  private isTokenNeeded(req: HttpRequest<any>) {
    return this.needsToken.some(url => !!url && req.url.includes(url));
  }
}
