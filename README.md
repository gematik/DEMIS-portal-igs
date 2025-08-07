<img align="right" width="250" height="47" src="./media/Gematik_Logo_Flag.png"/> <br/>


# Portal-IGS

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
       <ul>
        <li><a href="#quality-gate">Quality Gate</a></li>
        <li><a href="#release-notes">Release Notes</a></li>
      </ul>
	</li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#angular-cli">Angular CLI</a></li>
        <li><a href="#how-to-build">How to build</a></li>
        <li><a href="#tests">Tests</a></li>
        <li><a href="#creating-docker-image">Creating Docker Image</a></li>
    </li>
    <li>
      <a href="#usage">Usage</a>
      <ul>
        <li><a href="#configuration">Configuration</a></li>
      </ul>
    </li>
    <li><a href="#security-policy">Security Policy</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

## About The Project

The web-based microfrontend Portal-IGS is part of the DEMIS Notification-Portal micro frontends. It enables sequencing laboratories to interact with the IGS-Service via a dedicated gateway in a structured and guided manor.

### Quality Gate
[![Quality Gate Status](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=demis-portal-igs&metric=alert_status&token=sqb_5f7802533ac51dd57b54909538df545ed0235ec7)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=demis-portal-igs)
[![Vulnerabilities](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=demis-portal-igs&metric=vulnerabilities&token=sqb_5f7802533ac51dd57b54909538df545ed0235ec7)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=demis-portal-igs)
[![Bugs](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=demis-portal-igs&metric=bugs&token=sqb_5f7802533ac51dd57b54909538df545ed0235ec7)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=demis-portal-igs)
[![Code Smells](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=demis-portal-igs&metric=code_smells&token=sqb_5f7802533ac51dd57b54909538df545ed0235ec7)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=demis-portal-igs)
[![Lines of Code](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=demis-portal-igs&metric=ncloc&token=sqb_5f7802533ac51dd57b54909538df545ed0235ec7)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=demis-portal-igs)
[![Coverage](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=demis-portal-igs&metric=coverage&token=sqb_5f7802533ac51dd57b54909538df545ed0235ec7)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=demis-portal-igs)

### Release Notes
See [ReleaseNotes](ReleaseNotes.md) for all information regarding the (newest) releases.

## Getting Started

### Prerequisites

Before you can build and run the application, you need to install the following software products:

* [NodeJS](https://nodejs.org) >= 20.0.0
* [npm](https://docs.npmjs.com/try-the-latest-stable-version-of-npm)
* A browser for Tests 
  * Google Chrome
  * Firefox
* An IDE
  * [WebStorm](https://www.jetbrains.com/webstorm)
  * [IntelliJ](https://www.jetbrains.com/de-de/idea)
  * [Visual Studio Code](https://code.visualstudio.com)

Alternatively, you can use the available development environment defined as `Dockerfile` in the subfolder `.dev/`.

#### Additional libraries

Additionally, the gematik library must be built and integrated.

To do this, please clone the following repo: https://github.com/gematik/DEMIS-portal-core. 
Then, build the downloaded project according to the instructions, switch to this project, and integrate it with the command 
```
npm install <path_to_this_project>/dist/gematik/demis-portal-core-library
```

#### Angular CLI

To use the project, you need the Angular CLI tool and it can be installed and configured as follows:

```sh
npm add -g @angular/cli
```

### How to build

The Application can be built using the following commands, if they are installed natively:

```sh
npm install
npm run build
```

Alternatively, a Docker-based development environment is available in the repository under the folder `.dev`. All you need is to build the Docker Image and then run the `npm` commands:

```sh
docker build -t portal-igs -f .dev/Dockerfile .dev/
docker run --rm -it -v .://project  portal-igs
npm install
npm run build
```

### Tests

From the IDE, if you are using JetBrains ones, you can run the tests by downloading the [Karma Plugin](https://plugins.jetbrains.com/plugin/7287-karma).

You can run all unit tests once with the following command:

```sh
npm test
```

Tests can be run in headless mode as well. They can even be run in the Docker Development environment. All you need is to run the tests as follows:

```sh
ng test --browsers ChromeHeadless
```

### Creating Docker Image

The Docker Image for the target environment can be built using the following command (requires `docker`): 

```sh
docker build -t portal-igs:latest .
```

Alternativey, a convenient npm target is also available:

```sh
npm run docker
```

## Usage

### Configuration

The Application runs behind a Nginx Server, which requires some environment variables to be correctly started. The following environment variables are required:

- PORTAL_CSP_HOSTNAME, the list of hostnames, separated by a white space, that should be used with the Content Security Policy

## Security Policy
If you want to see the security policy, please check our [SECURITY.md](.github/SECURITY.md).

## Contributing
If you want to contribute, please check our [CONTRIBUTING.md](.github/CONTRIBUTING.md).

## License
Copyright 2024-2025 gematik GmbH

EUROPEAN UNION PUBLIC LICENCE v. 1.2

EUPL © the European Union 2007, 2016

See the [LICENSE](./LICENSE.md) for the specific language governing permissions and limitations under the License

## Additional Notes and Disclaimer from gematik GmbH

1. Copyright notice: Each published work result is accompanied by an explicit statement of the license conditions for use. These are regularly typical conditions in connection with open source or free software. Programs described/provided/linked here are free software, unless otherwise stated.
2. Permission notice: Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  1. The copyright notice (Item 1) and the permission notice (Item 2) shall be included in all copies or substantial portions of the Software.
  2. The software is provided "as is" without warranty of any kind, either express or implied, including, but not limited to, the warranties of fitness for a particular purpose, merchantability, and/or non-infringement. The authors or copyright holders shall not be liable in any manner whatsoever for any damages or other claims arising from, out of or in connection with the software or the use or other dealings with the software, whether in an action of contract, tort, or otherwise.
  3. We take open source license compliance very seriously. We are always striving to achieve compliance at all times and to improve our processes. If you find any issues or have any suggestions or comments, or if you see any other ways in which we can improve, please reach out to: ospo@gematik.de
3. Please note: Parts of this code may have been generated using AI-supported technology. Please take this into account, especially when troubleshooting, for security analyses and possible adjustments.

See [LICENSE](LICENSE.md).

## Contact
E-Mail to [DEMIS Entwicklung](mailto:demis-entwicklung@gematik.de?subject=[GitHub]%20Portal-igs)
