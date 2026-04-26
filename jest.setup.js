import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({ didCancel: true })),
}));

jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(async () => [
    {
      uri: 'file:///tmp/backup.json',
      name: 'backup.json',
    },
  ]),
  keepLocalCopy: jest.fn(async () => [
    {
      status: 'success',
      sourceUri: 'file:///tmp/backup.json',
      localUri: 'file:///tmp/backup.json',
    },
  ]),
  isErrorWithCode: jest.fn(() => false),
  errorCodes: {
    OPERATION_CANCELED: 'OPERATION_CANCELED',
  },
  types: {
    allFiles: '*/*',
  },
}));

jest.mock('react-native-fs', () => ({
  DownloadDirectoryPath: '/tmp',
  DocumentDirectoryPath: '/tmp',
  writeFile: jest.fn(async () => undefined),
  readFile: jest.fn(async () => '{}'),
  mkdir: jest.fn(async () => undefined),
  copyFile: jest.fn(async () => undefined),
}));

jest.mock('react-native-sqlite-storage', () => ({
  DEBUG: jest.fn(),
  enablePromise: jest.fn(),
  openDatabase: jest.fn(async () => ({
    executeSql: jest.fn(async () => [{ rows: { length: 0, item: () => ({}) } }]),
  })),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-id'),
}));
