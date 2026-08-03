import api from './client';

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  storageKey: string;
  folderId: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export const getRootContents = async () => {
  const res = await api.get('/folders/root');
  return res.data as { folders: Folder[]; files: FileItem[] };
};

export const getFolderContents = async (id: string) => {
  const res = await api.get(`/folders/${id}`);
  return res.data as Folder & { children: Folder[]; files: FileItem[]; parent: Folder | null };
};

export const createFolder = async (name: string, parentId?: string) => {
  const res = await api.post('/folders', { name, parentId });
  return res.data as Folder;
};

export const deleteFolder = async (id: string) => {
  await api.delete(`/folders/${id}`);
};