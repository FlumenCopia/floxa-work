import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { FileRecord } from '../models/File.model.js';
import { Contract } from '../models/Contract.model.js';
import { Milestone } from '../models/Milestone.model.js';
import { PaymentRecord } from '../models/PaymentRecord.model.js';
import { Task } from '../models/Task.model.js';
import { AuditLog } from '../models/AuditLog.model.js';

const UPLOAD_DIR = path.resolve(process.cwd(), 'media', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const sanitizedBase = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 30);
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    cb(null, `${sanitizedBase}_${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
  'text/markdown',
  'application/json',
]);

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: images, PDF, and ZIP.`));
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB maximum
  },
  fileFilter,
});

export async function uploadSingleFile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Missing authenticated session' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const category = (req.body.category || 'general') as any;
    const isPublic = req.body.isPublic === 'true' || req.body.isPublic === true;

    const accessUrl = `/api/files/${req.file.filename}/view`;

    const fileDoc = await FileRecord.create({
      ownerId: req.user.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      category,
      storagePath: req.file.path,
      accessUrl,
      isPublic,
    });

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await AuditLog.create({
      actorId: req.user.id,
      action: 'FILE_UPLOADED',
      targetType: 'FileRecord',
      targetId: fileDoc.id,
      ipAddress,
      userAgent,
      metadata: { originalName: fileDoc.originalName, mimeType: fileDoc.mimeType, sizeBytes: fileDoc.sizeBytes, isPublic },
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: fileDoc.id,
        filename: fileDoc.filename,
        originalName: fileDoc.originalName,
        mimeType: fileDoc.mimeType,
        sizeBytes: fileDoc.sizeBytes,
        category: fileDoc.category,
        accessUrl: `http://localhost:5001${fileDoc.accessUrl}`,
        downloadUrl: `http://localhost:5001/api/files/${fileDoc.id}/download`,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
}

export async function downloadFile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { fileId } = req.params;
    let fileDoc = null;

    if (fileId.match(/^[0-9a-fA-F]{24}$/)) {
      fileDoc = await FileRecord.findById(fileId);
    } else {
      fileDoc = await FileRecord.findOne({ filename: fileId });
    }

    if (!fileDoc) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // RESOURCE-LEVEL AUTHORIZATION CHECK
    if (!fileDoc.isPublic) {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required to download private resources.' });
        return;
      }

      const isOwner = fileDoc.ownerId && fileDoc.ownerId.toString() === req.user.id.toString();
      const isAdmin = req.user.role === 'admin';

      let isContractParticipant = false;
      if (!isOwner && !isAdmin) {
        // Check if file is part of a milestone submission or payment receipt in a contract where user participates
        const relevantMilestone = await Milestone.findOne({
          $or: [
            { 'submissions.fileUrls': fileDoc.filename },
            { 'submissions.fileUrls': fileDoc.accessUrl },
            { 'paymentDetails.receiptFileUrl': fileDoc.filename },
            { 'paymentDetails.receiptFileUrl': fileDoc.accessUrl },
          ],
        });

        if (relevantMilestone) {
          const contract = await Contract.findById(relevantMilestone.contractId);
          if (
            contract &&
            (contract.clientId.toString() === req.user.id.toString() ||
              contract.freelancerId.toString() === req.user.id.toString())
          ) {
            isContractParticipant = true;
          }
        }

        if (!isContractParticipant) {
          const relevantPayment = await PaymentRecord.findOne({
            $or: [
              { receiptFileUrl: fileDoc.filename },
              { receiptFileUrl: fileDoc.accessUrl },
            ],
          });
          if (
            relevantPayment &&
            (relevantPayment.payerId.toString() === req.user.id.toString() ||
              relevantPayment.payeeId.toString() === req.user.id.toString())
          ) {
            isContractParticipant = true;
          }
        }

        if (!isContractParticipant) {
          const relevantTask = await Task.findOne({
            attachments: { $in: [fileDoc.filename, fileDoc.accessUrl] },
          });
          if (relevantTask) {
            const contract = await Contract.findById(relevantTask.contractId);
            if (
              contract &&
              (contract.clientId.toString() === req.user.id.toString() ||
                contract.freelancerId.toString() === req.user.id.toString())
            ) {
              isContractParticipant = true;
            }
          }
        }
      }

      if (!isOwner && !isAdmin && !isContractParticipant) {
        await AuditLog.create({
          actorId: req.user.id,
          action: 'UNAUTHORIZED_FILE_ACCESS_ATTEMPT',
          targetType: 'FileRecord',
          targetId: fileDoc.id,
          ipAddress,
          userAgent,
          metadata: { filename: fileDoc.filename },
        });

        res.status(403).json({ error: 'Access denied: You do not have permission to download this file.' });
        return;
      }
    }

    const fullPath = path.resolve(fileDoc.storagePath);
    if (!fs.existsSync(fullPath)) {
      res.status(404).json({ error: 'File resource missing from storage disk' });
      return;
    }

    if (req.user) {
      await AuditLog.create({
        actorId: req.user.id,
        action: 'FILE_DOWNLOADED',
        targetType: 'FileRecord',
        targetId: fileDoc.id,
        ipAddress,
        userAgent,
        metadata: { filename: fileDoc.filename, originalName: fileDoc.originalName },
      });
    }

    res.download(fullPath, fileDoc.originalName);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Download failed' });
  }
}

export async function viewFile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { filename } = req.params;
    const fileDoc = await FileRecord.findOne({ filename });

    if (!fileDoc) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const fullPath = path.resolve(fileDoc.storagePath);
    if (!fs.existsSync(fullPath)) {
      res.status(404).json({ error: 'File missing on storage server' });
      return;
    }

    res.setHeader('Content-Type', fileDoc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileDoc.originalName}"`);
    fs.createReadStream(fullPath).pipe(res);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Stream failed' });
  }
}

