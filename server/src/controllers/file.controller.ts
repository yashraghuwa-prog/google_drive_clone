import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { saveFile, getFilePath, deleteFile } from '../lib/storage';

interface AuthRequest extends Request {
  userId?: string;
  file?: Express.Multer.File;
}

export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const folderId = req.body.folderId as string | undefined;

    if (folderId) {
      const folder = await prisma.folder.findUnique({ where: { id: folderId } });
      if (!folder) return res.status(404).json({ error: 'Folder not found' });
      if (folder.ownerId !== userId) return res.status(403).json({ error: 'Forbidden' });
    }

    const storageKey = `${userId}/${randomUUID()}-${req.file.originalname}`;
    await saveFile(storageKey, req.file.buffer);

    const file = await prisma.file.create({
      data: {
        name: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        storageKey,
        folderId: folderId ?? null,
        ownerId: userId,
      },
    });

    return res.status(201).json(file);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const downloadFile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const id = req.params.id as string;
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.ownerId !== userId) return res.status(403).json({ error: 'Forbidden' });

    const filePath = getFilePath(file.storageKey);
    return res.download(filePath, file.name);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const removeFile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const id = req.params.id as string;
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.ownerId !== userId) return res.status(403).json({ error: 'Forbidden' });

    await deleteFile(file.storageKey);
    await prisma.file.delete({ where: { id } });

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};