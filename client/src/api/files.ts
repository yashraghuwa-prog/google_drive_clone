import api from './client';

export const uploadFile = async (file: File, folderId?: string) => {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) formData.append('folderId', folderId);
  const res = await api.post('/files', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getDownloadBlob = async (id: string) => {
  const res = await api.get(`/files/${id}/download`, { responseType: 'blob' });
  return res.data as Blob;
};

export const deleteFile = async (id: string) => {
  await api.delete(`/files/${id}`);
};
