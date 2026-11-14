import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { IStorageProvider, StorageUploadResult, StorageProviderHealth } from './IStorageProvider.js';
import { ENV } from '../../config/env.js';

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor(customPath?: string) {
    this.baseDir = path.resolve(process.cwd(), customPath || ENV.STORAGE_LOCAL_PATH);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private sanitizeKey(rawName: string): string {
    const ext = path.extname(rawName);
    const base = path
      .basename(rawName, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 32);
    const unique = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    return `${base}_${unique}${ext}`;
  }

  private resolveSafePath(storageKey: string): string {
    const normalizedKey = path.normalize(storageKey).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.resolve(this.baseDir, normalizedKey);

    if (!fullPath.startsWith(this.baseDir)) {
      throw new Error('SECURITY VIOLATION: Path traversal attempt detected');
    }

    return fullPath;
  }

  async upload(
    file: {
      buffer?: Buffer;
      path?: string;
      originalname: string;
      mimetype: string;
      size: number;
    },
    options: { category?: string; isPublic?: boolean } = {}
  ): Promise<StorageUploadResult> {
    const category = options.category || 'deliverables';
    const filename = this.sanitizeKey(file.originalname);
    const targetDir = path.join(this.baseDir, category);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const storageKey = path.join(category, filename).replace(/\\/g, '/');
    const destinationPath = path.join(targetDir, filename);

    if (file.buffer) {
      fs.writeFileSync(destinationPath, file.buffer);
    } else if (file.path && fs.existsSync(file.path)) {
      fs.copyFileSync(file.path, destinationPath);
    } else {
      throw new Error('Upload failed: Neither buffer nor file path provided');
    }

    const isPublic = Boolean(options.isPublic);
    const accessUrl = `/api/files/${encodeURIComponent(storageKey)}/view`;

    return {
      storageKey,
      storagePath: destinationPath,
      accessUrl,
      sizeBytes: file.size,
      mimeType: file.mimetype,
      isPublic,
    };
  }

  async getReadStream(storageKey: string): Promise<Readable> {
    const fullPath = this.resolveSafePath(storageKey);
    if (!fs.existsSync(fullPath)) {
      // Fallback check in legacy upload dir for migration backward compatibility
      const legacyPath = path.resolve(process.cwd(), 'media', 'uploads', path.basename(storageKey));
      if (fs.existsSync(legacyPath)) {
        return fs.createReadStream(legacyPath);
      }
      throw new Error(`File not found in storage vault: ${storageKey}`);
    }
    return fs.createReadStream(fullPath);
  }

  async getSignedUrl(storageKey: string, _expiresInSeconds = 3600): Promise<string> {
    // In local disk adapter, return the authorized proxy endpoint URL
    return `/api/files/${encodeURIComponent(storageKey)}/view`;
  }

  async delete(storageKey: string): Promise<void> {
    try {
      const fullPath = this.resolveSafePath(storageKey);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (e) {
      console.warn(`[LocalStorageProvider] Warning deleting ${storageKey}:`, e);
    }
  }

  async getHealth(): Promise<StorageProviderHealth> {
    try {
      const testFile = path.join(this.baseDir, '.health_probe');
      fs.writeFileSync(testFile, 'probe');
      fs.unlinkSync(testFile);
      return {
        provider: 'local',
        status: 'online',
        storageRoot: this.baseDir,
      };
    } catch (err: any) {
      return {
        provider: 'local',
        status: 'degraded',
        storageRoot: this.baseDir,
        details: err.message,
      };
    }
  }
}
