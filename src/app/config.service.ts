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

import { Injectable } from '@angular/core';
import { assetUrl } from 'src/single-spa/asset-url';

export interface SharedConfig {
  igsGatewayUrl: string;
  igsServiceUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private sharedConfig: SharedConfig | undefined = undefined;

  constructor() {
    let pathToEnvironment = assetUrl('../environment.json');
    fetch(pathToEnvironment)
      .then(response => response.json())
      .then(config => {
        this.sharedConfig = config['mfIgs'];
      });
  }

  get igsGatewayUrl() {
    return this.sharedConfig?.igsGatewayUrl;
  }

  get igsServiceUrl() {
    const igsServiceUrl = this.sharedConfig?.igsServiceUrl;
    return igsServiceUrl;
  }

  get maxAttempts() {
    return 40;
  }

  get waitBetweenRetires() {
    return 1000;
  }
}
