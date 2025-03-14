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

import { NgZone } from '@angular/core';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Router, NavigationStart } from '@angular/router';
import { AppModule } from './app/app.module';
import { singleSpaAngular, getSingleSpaExtraProviders } from 'single-spa-angular';
import { singleSpaPropsSubject } from './single-spa/single-spa-props';
import { AppProps } from 'single-spa';
import { setPublicPath } from 'systemjs-webpack-interop';

const appId = 'notification-portal-mf-igs';

const lifecycles = singleSpaAngular({
  bootstrapFunction: singleSpaProps => {
    singleSpaPropsSubject.next(singleSpaProps);
    return platformBrowserDynamic(getSingleSpaExtraProviders()).bootstrapModule(AppModule);
  },
  template: '<app-surveillance-root />',
  Router,
  NgZone,
  NavigationStart,
});

function init() {
  setPublicPath(appId);
  return Promise.resolve();
}

function bootstrapFn(props: AppProps) {
  return init().then(() => {
    if (typeof lifecycles.bootstrap == 'function') {
      return lifecycles.bootstrap(props);
    } else {
      return lifecycles.bootstrap;
    }
  });
}

export const bootstrap = bootstrapFn;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
