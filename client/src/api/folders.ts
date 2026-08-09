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

export interface Share {
  id: string;
  folderId: string;
  permission: 'VIEW' | 'EDIT';
  folder: Folder;
  sharedBy: { id: string; name: string; email: string };
}

export const getRootContents = async () => {
  const res = await api.get('/folders/root');
  return res.data as { folders: Folder[]; files: FileItem[] };
};

export const getFolderContents = async (id: string) => {
  const res = await api.get(`/folders/${id}`);
  return res.data as Folder & {
    children: Folder[];
    files: FileItem[];
    parent: Folder | null;
    accessLevel: 'OWNER' | 'EDIT' | 'VIEW';
  };
};

export const createFolder = async (name: string, parentId?: string) => {
  const res = await api.post('/folders', { name, parentId });
  return res.data as Folder;
};

export const deleteFolder = async (id: string) => {
  await api.delete(`/folders/${id}`);
};

export const shareFolder = async (id: string, email: string, permission: 'VIEW' | 'EDIT') => {
  const res = await api.post(`/folders/${id}/share`, { email, permission });
  return res.data;
};

export const getSharedWithMe = async () => {
  const res = await api.get('/folders/shared-with-me');
  return res.data as Share[];
};