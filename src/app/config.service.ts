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

import { Injectable } from '@angular/core';
import { assetUrl } from 'src/single-spa/asset-url';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private envConfig?: EnvironmentConfig;

  constructor() {
    let pathToEnvironment = assetUrl('../environment.json');
    fetch(pathToEnvironment)
      .then(response => response.json())
      .then(config => {
        this.envConfig = config;
      });
  }

  get igsGatewayUrl() {
    return this.envConfig?.mfIgs.igsGatewayUrl;
  }

  get igsServiceUrl() {
    return this.envConfig?.mfIgs.igsServiceUrl;
  }

  get maxAttempts() {
    return this.envConfig?.mfIgs.maxRetry ?? 60;
  }

  get waitBetweenRetires() {
    return 1000;
  }

  isFeatureEnabled(flag: string): boolean {
    return this.envConfig?.featureFlags?.[flag] ?? false;
  }
}

export interface FeatureFlags {
  [key: string]: boolean;
}

export interface MfIgsConfig {
  igsGatewayUrl: string;
  igsServiceUrl: string;
  maxRetry: number;
}

export interface EnvironmentConfig {
  mfIgs: MfIgsConfig;
  featureFlags?: FeatureFlags;
}
