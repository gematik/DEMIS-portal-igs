<img align="right" width="250" height="47" src="./media/Gematik_Logo_Flag.png"/> <br/>    

# Release portal-igs

## Release 1.3.3

- maximum upload size has been increased to 2GB
- maxRetries has been extraced to environment variable
- Disabled Sandbox for ChromeHeadless browser to run karma tests in CI
- Updated Base Image to 1.29.4-alpine3.23-slim
- Updated @gematik/demis-portal-core-library to 2.3.8
- Integrated form footer from core library

## Release 1.3.2

- add configmap checksum as annotation to force pod restart on configmap change
- Update @angular-devkit/build-angular to 19.2.17
- Updated button naming from "Zurück zur Startseite" to “Prozess neu starten”
- Update NGINX-Base-Image to 1.29.3

## Release 1.3.1

- dependencies updated
- Added test:coverage npm script to run a single test run with coverage report

## Release 1.3.0

- add new api endpoint for igs-service url activated by feature flag FEATURE_FLAG_NEW_API_ENDPOINTS

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
