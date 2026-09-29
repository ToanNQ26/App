import type { Response } from 'express';
import fs from 'node:fs/promises';
import type { AuthedRequest } from '../types/index.js';
import * as documentService from '../services/document.service.js';

export async function authorizeUpload(req: AuthedRequest, _res: Response) {
  await documentService.assertCanUploadDocument(req.user!, req.params.id!);
}
export async function upload(req: AuthedRequest, res: Response) {
  try {
    res.status(201).json({
      success: true,
      data: await documentService.uploadDocument(
        req.user!,
        req.params.id!,
        req.file,
        req.body.documentType,
      ),
    });
  } catch (error) {
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => undefined);
    throw error;
  }
}
export async function list(req: AuthedRequest, res: Response) { res.json({ success: true, data: await documentService.listDocuments(req.user!, req.params.id!) }); }
export async function viewFile(req: AuthedRequest, res: Response) {
  const { document, filePath } = await documentService.getDocumentFile(
    req.user!,
    req.params.id!,
    req.params.documentId!,
  );
  const filename = encodeURIComponent(document.originalName || "document").replace(/'/g, "%27");
  res.setHeader("Content-Type", document.mimeType || "application/octet-stream");
  res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${filename}`);
  res.sendFile(filePath);
}
