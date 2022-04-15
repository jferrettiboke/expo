import { ExpoAppManifest, ExpoConfig, getConfig, PackageJSONConfig } from '@expo/config';

import { env } from '../../utils/env';
import { CommandError } from '../../utils/errors';
import { PublishOptions } from './createBundles';
import { getResolvedLocalesAsync } from './getResolvedLocales';

function assertUnversioned(sdkVersion?: string) {
  // Only allow projects to be published with UNVERSIONED if a correct token is set in env
  if (sdkVersion === 'UNVERSIONED' && !env.EXPO_SKIP_MANIFEST_VALIDATION_TOKEN) {
    throw new CommandError('INVALID_OPTIONS', 'Cannot publish with sdkVersion UNVERSIONED.');
  }
}

export async function getPublicExpoManifestAsync(
  projectRoot: string,
  options: Pick<PublishOptions, 'releaseChannel'> = {}
): Promise<{
  exp: ExpoAppManifest;
  pkg: PackageJSONConfig;
  hooks: ExpoConfig['hooks'];
}> {
  if (options.releaseChannel != null && typeof options.releaseChannel !== 'string') {
    throw new CommandError('INVALID_OPTIONS', 'releaseChannel must be a string');
  }
  options.releaseChannel = options.releaseChannel || 'default';

  // Verify that exp/app.json and package.json exist
  const {
    exp: { hooks, runtimeVersion },
  } = getConfig(projectRoot, { skipSDKVersionRequirement: true });

  // Read the config in public mode which strips the `hooks`.
  const { exp, pkg } = getConfig(projectRoot, {
    isPublicConfig: true,
    // enforce sdk validation if user is not using runtimeVersion
    skipSDKVersionRequirement: !!runtimeVersion,
  });

  assertUnversioned(exp.sdkVersion);

  exp.locales = await getResolvedLocalesAsync(projectRoot, exp);

  return {
    exp: {
      ...exp,
      sdkVersion: exp.sdkVersion!,
    },
    pkg,
    hooks,
  };
}
