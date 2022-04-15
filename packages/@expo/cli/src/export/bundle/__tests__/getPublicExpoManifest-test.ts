import { vol } from 'memfs';

import { getPublicExpoManifestAsync } from '../getPublicExpoManifest';

jest.mock('fs');

describe(getPublicExpoManifestAsync, () => {
  afterAll(() => {
    vol.reset();
  });

  const runtimeVersion = 'one';
  const sdkVersion = '40.0.0';
  it('Passes if sdkVersion is not specified', async () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({}),
        'app.json': JSON.stringify({
          name: 'hello',
          slug: 'hello',
          version: '1.0.0',
          runtimeVersion,
          platforms: [],
        }),
      },
      'runtimeVersion'
    );
    const config = await getPublicExpoManifestAsync('runtimeVersion', {
      releaseChannel: 'default',
    });
    expect(config.exp).toMatchObject({ sdkVersion: undefined, runtimeVersion });
  });
  it('reads sdkVersion from node module', async () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({}),
        'app.json': JSON.stringify({
          name: 'hello',
          slug: 'hello',
          version: '1.0.0',
          platforms: [],
        }),
        'node_modules/expo/package.json': JSON.stringify({
          version: sdkVersion,
        }),
      },
      'sdkVersion'
    );
    const config = await getPublicExpoManifestAsync('sdkVersion', { releaseChannel: 'default' });
    expect(config.exp).toMatchObject({ sdkVersion });
  });
  it('reads sdkVersion from app.json', async () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({}),
        'app.json': JSON.stringify({
          name: 'hello',
          slug: 'hello',
          version: '1.0.0',
          sdkVersion,
          platforms: [],
        }),
      },
      'sdkVersionInAppDotJson'
    );
    const config = await getPublicExpoManifestAsync('sdkVersionInAppDotJson', {
      releaseChannel: 'default',
    });
    expect(config.exp).toMatchObject({ sdkVersion });
  });
});
