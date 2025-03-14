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

// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('karma-sonarqube-unit-reporter'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    customLaunchers: {
      Chrome_silenced: {
        base: 'Chrome',
        flags: ['--disable-search-engine-choice-screen'],
      },
    },
    client: {
      jasmine: {
        // you can add configuration options for Jasmine here
        // the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
        // for example, you can disable the random execution with `random: false`
        // or set a specific seed with `seed: 4321`
        random: false,
      },
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true, // removes the duplicated traces
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'lcovonly' }, { type: 'text-summary' }],
    },
    sonarQubeUnitReporter: {
      sonarQubeVersion: 'LATEST',
      outputFile: 'coverage/ut_report.xml',
      overrideTestDescription: true,
      testPaths: ['./src'],
      testFilePattern: '.spec.ts',
      useBrowserName: false,
    },
    reporters: ['progress', 'kjhtml', 'coverage', 'sonarqubeUnit'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome_silenced'],
    browserNoActivityTimeout: 3600000,
    singleRun: false,
    restartOnFileChange: true,
  });
};
