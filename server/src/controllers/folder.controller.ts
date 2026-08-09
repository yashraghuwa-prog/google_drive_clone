import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

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

const shareSchema = z.object({
  email: z.email(),
  permission: z.enum(['VIEW', 'EDIT']).optional(),
});

type AccessLevel = 'OWNER' | 'EDIT' | 'VIEW' | null;

async function getAccessLevel(folderId: string, userId: string): Promise<AccessLevel> {
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) return null;
  if (folder.ownerId === userId) return 'OWNER';

  const share = await prisma.share.findUnique({
    where: { folderId_sharedWithId: { folderId, sharedWithId: userId } },
  });
  if (!share) return null;
  return share.permission;
}

export const createFolder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = createFolderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { name, parentId } = parsed.data;

    if (parentId) {
      const access = await getAccessLevel(parentId, userId);
      if (!access) return res.status(404).json({ error: 'Parent folder not found' });
      if (access === 'VIEW') return res.status(403).json({ error: 'You only have view access to the parent folder' });
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
    const access = await getAccessLevel(id, userId);
    if (!access) return res.status(404).json({ error: 'Folder not found' });

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: { children: true, files: true, parent: true },
    });

    return res.json({ ...folder, accessLevel: access });
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

    const access = await getAccessLevel(id, userId);
    if (!access) return res.status(404).json({ error: 'Folder not found' });
    if (access === 'VIEW') return res.status(403).json({ error: 'You only have view access' });

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
    const access = await getAccessLevel(id, userId);
    if (!access) return res.status(404).json({ error: 'Folder not found' });
    if (access !== 'OWNER') return res.status(403).json({ error: 'Only the owner can delete this folder' });

    await prisma.folder.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const shareFolder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const id = req.params.id as string;
    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    if (folder.ownerId !== userId) return res.status(403).json({ error: 'Only the owner can share this folder' });

    const parsed = shareSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { email, permission } = parsed.data;

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) return res.status(404).json({ error: 'No user found with that email' });
    if (targetUser.id === userId) return res.status(400).json({ error: "You can't share a folder with yourself" });

    const share = await prisma.share.upsert({
      where: { folderId_sharedWithId: { folderId: id, sharedWithId: targetUser.id } },
      update: { permission: permission ?? 'VIEW' },
      create: {
        folderId: id,
        sharedWithId: targetUser.id,
        sharedById: userId,
        permission: permission ?? 'VIEW',
      },
    });

    return res.status(201).json(share);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const getSharedWithMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const shares = await prisma.share.findMany({
      where: { sharedWithId: userId },
      include: { folder: true, sharedBy: { select: { id: true, name: true, email: true } } },
    });

    return res.json(shares);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};