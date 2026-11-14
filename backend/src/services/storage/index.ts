import { IStorageProvider } from './IStorageProvider.js';
import { LocalStorageProvider } from './LocalStorageProvider.js';
import { S3CompatibleStorageProvider } from './S3CompatibleStorageProvider.js';
import { ENV } from '../../config/env.js';

let activeProvider: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (activeProvider) return activeProvider;

  if (ENV.STORAGE_PROVIDER === 's3') {
    activeProvider = new S3CompatibleStorageProvider();
  } else {
    activeProvider = new LocalStorageProvider();
  }

  return activeProvider;
}

export * from './IStorageProvider.js';
export * from './LocalStorageProvider.js';
export * from './S3CompatibleStorageProvider.js';

