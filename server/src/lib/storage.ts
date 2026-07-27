import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export const ensureUploadDir = async (): Promise<void> => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
};

export const saveFile = async (key: string, buffer: Buffer): Promise<void> => {
  const filePath = path.join(UPLOAD_DIR, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
};

export const getFilePath = (key: string): string => {
  return path.join(UPLOAD_DIR, key);
};

export const deleteFile = async (key: string): Promise<void> => {
  const filePath = path.join(UPLOAD_DIR, key);
  await fs.unlink(filePath).catch(() => {}); // ignore if it's already gone
};