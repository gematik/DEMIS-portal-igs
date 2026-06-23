<img align="right" width="250" height="47" src="./media/Gematik_Logo_Flag.png"/> <br/>    

# Release portal-igs

## Release 1.4.3

- Fixed styling errors for different spacings and diversity problems
- Updated @gematik/demis-portal-core-library to 4.2.4

## Release 1.4.2

- Removed @angular/platform-browser-dynamic
- Migrated components to standalone
- Fixed form reset bug with new dedicated step navigation service architecture from portal-core
- Updated docker base image to 1.29.8-alpine3.23-slim
- Updated @gematik/demis-portal-core-library to 4.2.1
- Adapted logging to be configurable via environment

## Release 1.4.1

- Dependency updates because of GHSA-g93w-mfhg-p222

## Release 1.4.0

- Updated Angular to v21
- Updated @gematik/demis-portal-core-library to 2.4.4
- Added accessibility statement footer link (FEATURE_FLAG_PORTAL_ACCESSIBILITY)
- Removed feature flag NEW_API_ENPOINTS
- Removed CPU limit from helm chart
- Removed istio helm chart
- Change imprint link and add ids in footer (FEATURE_FLAG_FOOTER_LINKS_CORRECTION)

## Release 1.3.4

- Added new generic side navigation component from core library with FEATURE_FLAG_PORTAL_IGS_SIDENAV
- MaxRetries has been increased to 60 (15 mins) for upload and validation requests

## Release 1.3.3

- Maximum upload size has been increased to 2GB
- MaxRetries has been extraced to environment variable
- Disabled Sandbox for ChromeHeadless browser to run karma tests in CI
- Updated Base Image to 1.29.4-alpine3.23-slim
- Updated @gematik/demis-portal-core-library to 2.3.8
- Integrated form footer from core library

## Release 1.3.2

- Add configmap checksum as annotation to force pod restart on configmap change
- Update @angular-devkit/build-angular to 19.2.17
- Updated button naming from "Zurück zur Startseite" to “Prozess neu starten”
- Update NGINX-Base-Image to 1.29.3

## Release 1.3.1

- Dependencies updated
- Added test:coverage npm script to run a single test run with coverage report

## Release 1.3.0

- Add new api endpoint for igs-service url activated by feature flag FEATURE_FLAG_NEW_API_ENDPOINTS

## Release 1.2.4

- Update to Angular 19 and Material 19 version
- Update Portal-Core Library version

## Release 1.2.3

- Adjusted dynamic height behavior of IGS-Portal by using a dedicated component from Portal-Core

## Release 1.2.2

- Updated Portal-Core Library version
- Updated Nginx Version

## Release 1.2.1

- Updated ospo-resources for adding additional notes and disclaimer

## Release 1.2.0

- First official GitHub-Release
