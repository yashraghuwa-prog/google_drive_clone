import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

// This assumes your Day 3 auth middleware attaches the user's id as req.userId.
// Open your middleware/auth.ts file and check what property it sets — if it's
// something else (e.g. req.user.id), replace every `req.userId` below to match.
interface AuthRequest extends Request {
  userId?: string;
}

const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().optional(),
});

const renameFolderSchema = z.object({
  name: z.string().min(1).max(255),
});

export const createFolder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = createFolderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { name, parentId } = parsed.data;

    if (parentId) {
      const parent = await prisma.folder.findUnique({ where: { id: parentId } });
      if (!parent) return res.status(404).json({ error: 'Parent folder not found' });
      if (parent.ownerId !== userId) return res.status(403).json({ error: 'You do not own the parent folder' });
    }

    const folder = await prisma.folder.create({
      data: { name, parentId: parentId ?? null, ownerId: userId },
    });

    return res.status(201).json(folder);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const getFolder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const id = req.params.id as string;
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: { children: true, files: true },
    });

    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    if (folder.ownerId !== userId) return res.status(403).json({ error: 'Forbidden' });

    return res.json(folder);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const getRootFolders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const folders = await prisma.folder.findMany({ where: { ownerId: userId, parentId: null } });
    const files = await prisma.file.findMany({ where: { ownerId: userId, folderId: null } });

    return res.json({ folders, files });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const renameFolder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const id = req.params.id as string;
    const parsed = renameFolderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    if (folder.ownerId !== userId) return res.status(403).json({ error: 'Forbidden' });

    const updated = await prisma.folder.update({ where: { id }, data: { name: parsed.data.name } });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const deleteFolder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const id = req.params.id as string;
    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    if (folder.ownerId !== userId) return res.status(403).json({ error: 'Forbidden' });

    await prisma.folder.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};