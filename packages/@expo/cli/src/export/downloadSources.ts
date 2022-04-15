import temporary from 'tempy';

import { downloadAndDecompressAsync } from '../utils/tar';

/** Download source URLs to a temporary directory and return a list of file paths pointing to sources to merge. */
export async function downloadSourcesAsync(sourceUrls: string[]): Promise<string[]> {
  return Promise.all(
    sourceUrls.map((url) => downloadAndDecompressAsync(url, temporary.directory()))
  );
}
