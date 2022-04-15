import { ExpoAppManifest } from '@expo/config';
import JsonFile from '@expo/json-file';
import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';

import * as Log from '../log';
import { copyAsync, ensureDirectoryAsync } from '../utils/dir';
import { CommandError } from '../utils/errors';

type SelfHostedIndex = ExpoAppManifest & {
  dependencies: string[];
};

function isSelfHostedIndex(obj: any): obj is SelfHostedIndex {
  return !!obj.sdkVersion;
}

// put index.jsons into memory
async function putJsonInMemory(indexPath: string) {
  const index = await JsonFile.readAsync(indexPath);

  if (!isSelfHostedIndex(index)) {
    throw new CommandError(
      'INVALID_MANIFEST',
      `Invalid index.json, must specify an sdkVersion at ${indexPath}`
    );
  }
  if (Array.isArray(index)) {
    // index.json could also be an array
    return index;
  } else {
    return [index];
  }
}

// Takes multiple exported apps in sourceDirs and coalesces them to one app in outputDir
export async function mergeAppDistributions(
  projectRoot: string,
  sourceDirs: string[],
  outputDir: string
): Promise<void> {
  const assetPathToWrite = path.resolve(projectRoot, outputDir, 'assets');
  await ensureDirectoryAsync(assetPathToWrite);

  const bundlesPathToWrite = path.resolve(projectRoot, outputDir, 'bundles');
  await ensureDirectoryAsync(bundlesPathToWrite);

  // merge files from bundles and assets
  const androidIndexes: SelfHostedIndex[] = [];
  const iosIndexes: SelfHostedIndex[] = [];

  for (const sourceDir of sourceDirs) {
    const promises = [];

    // copy over assets/bundles from other src dirs to the output dir
    if (sourceDir !== outputDir) {
      // copy file over to assetPath
      const sourceAssetDir = path.resolve(projectRoot, sourceDir, 'assets');
      const outputAssetDir = path.resolve(projectRoot, outputDir, 'assets');
      const assetPromise = copyAsync(sourceAssetDir, outputAssetDir);
      promises.push(assetPromise);

      // copy files over to bundlePath
      const sourceBundleDir = path.resolve(projectRoot, sourceDir, 'bundles');
      const outputBundleDir = path.resolve(projectRoot, outputDir, 'bundles');
      const bundlePromise = copyAsync(sourceBundleDir, outputBundleDir);
      promises.push(bundlePromise);

      await Promise.all(promises);
    }

    const androidIndexPath = path.resolve(projectRoot, sourceDir, 'android-index.json');
    androidIndexes.push(...(await putJsonInMemory(androidIndexPath)));

    const iosIndexPath = path.resolve(projectRoot, sourceDir, 'ios-index.json');
    iosIndexes.push(...(await putJsonInMemory(iosIndexPath)));
  }

  const sortedAndroidIndexes = getSortedIndex(androidIndexes);
  const sortedIosIndexes = getSortedIndex(iosIndexes);

  // Save the json arrays to disk
  await writeArtifactSafelyAsync(
    projectRoot,
    path.join(outputDir, 'android-index.json'),
    JSON.stringify(sortedAndroidIndexes)
  );

  await writeArtifactSafelyAsync(
    projectRoot,
    path.join(outputDir, 'ios-index.json'),
    JSON.stringify(sortedIosIndexes)
  );
}

// sort indexes by descending sdk value
function getSortedIndex(indexes: SelfHostedIndex[]): SelfHostedIndex[] {
  return indexes.sort((index1: SelfHostedIndex, index2: SelfHostedIndex) => {
    if (semver.eq(index1.sdkVersion, index2.sdkVersion)) {
      Log.error(
        `Encountered multiple index.json with the same SDK version ${index1.sdkVersion}. This could result in undefined behavior.`
      );
    }
    return semver.gte(index1.sdkVersion, index2.sdkVersion) ? -1 : 1;
  });
}

// TODO: Remove this unrelated stuff..
export async function writeArtifactSafelyAsync(
  projectRoot: string,
  artifactPath: string,
  artifact: string | Uint8Array
) {
  const pathToWrite = path.resolve(projectRoot, artifactPath);
  if (!fs.existsSync(path.dirname(pathToWrite))) {
    Log.warn(`app.json specifies: ${pathToWrite}, but that directory does not exist.`);
  } else {
    await fs.promises.writeFile(pathToWrite, artifact);
  }
}
