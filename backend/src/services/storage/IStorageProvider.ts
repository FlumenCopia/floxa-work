import { Readable } from 'stream';

export interface StorageUploadResult {
  storageKey: string;
  storagePath: string;
  accessUrl: string;
  sizeBytes: number;
  mimeType: string;
  isPublic: boolean;
}

export interface StorageProviderHealth {
  provider: 'local' | 's3';
  status: 'online' | 'degraded' | 'unverified';
  storageRoot?: string;
  bucket?: string;
  details?: string;
}

export interface IStorageProvider {
  /**
   * Uploads a file stream or buffer into the private storage vault.
   */
  upload(
    file: {
      buffer?: Buffer;
      path?: string;
      originalname: string;
      mimetype: string;
      size: number;
    },
    options?: {
      category?: string;
      isPublic?: boolean;
    }
  ): Promise<StorageUploadResult>;

  /**
   * Retrieves a readable stream for a private stored object.
   */
  getReadStream(storageKey: string): Promise<Readable>;

  /**
   * Generates a short-lived signed URL or authorized view URL.
   */
  getSignedUrl(storageKey: string, expiresInSeconds?: number): Promise<string>;

  /**
   * Deletes an object from storage.
   */
  delete(storageKey: string): Promise<void>;

  /**
   * Checks health and availability of the storage backend.
   */
  getHealth(): Promise<StorageProviderHealth>;
}

