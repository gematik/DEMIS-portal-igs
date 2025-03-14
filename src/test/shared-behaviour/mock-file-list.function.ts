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

export function mockFileList(fileNames: string[]): FileList {
  return mockFileListWithBytes(fileNames, Math.random());
}

export function mockFileListWithBytes(fileNames: string[], byteSize: number): FileList {
  const mockedFiles = new DataTransfer();
  for (const fileName of fileNames) {
    mockedFiles.items.add(new File([new Uint8Array(byteSize)], fileName, { type: 'text/html' }));
  }
  return mockedFiles.files;
}
