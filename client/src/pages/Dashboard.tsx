import { useEffect, useState, ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getRootContents,
  getFolderContents,
  createFolder,
  deleteFolder,
  shareFolder,
  Folder,
  FileItem,
} from '../api/folders';
import { uploadFile, getDownloadBlob, deleteFile } from '../api/files';

type AccessLevel = 'OWNER' | 'EDIT' | 'VIEW';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { folderId } = useParams<{ folderId?: string }>();
  const navigate = useNavigate();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentName, setCurrentName] = useState<string>('My Drive');
  const [parentId, setParentId] = useState<string | null>(null);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('OWNER');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canEdit = accessLevel === 'OWNER' || accessLevel === 'EDIT';
  const isOwner = accessLevel === 'OWNER';

  const loadContents = async () => {
    setLoading(true);
    setError('');
    try {
      if (folderId) {
        const data = await getFolderContents(folderId);
        setFolders(data.children);
        setFiles(data.files);
        setCurrentName(data.name);
        setParentId(data.parent ? data.parent.id : null);
        setAccessLevel(data.accessLevel);
      } else {
        const data = await getRootContents();
        setFolders(data.folders);
        setFiles(data.files);
        setCurrentName('My Drive');
        setParentId(null);
        setAccessLevel('OWNER');
      }
    } catch (err) {
      setError('Could not load this folder');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  const handleCreateFolder = async () => {
    const name = window.prompt('Folder name:');
    if (!name) return;
    try {
      await createFolder(name, folderId);
      loadContents();
    } catch (err) {
      alert('Could not create folder');
    }
  };

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadFile(file, folderId);
      loadContents();
    } catch (err) {
      alert('Upload failed');
    } finally {
      e.target.value = '';
    }
  };

  const handleOpenFolder = (id: string) => navigate(`/dashboard/${id}`);

  const handleBack = () => {
    if (parentId) navigate(`/dashboard/${parentId}`);
    else navigate('/dashboard');
  };

  const handleDeleteFolder = async (id: string) => {
    if (!window.confirm('Delete this folder and everything inside it?')) return;
    try {
      await deleteFolder(id);
      loadContents();
    } catch (err) {
      alert('Could not delete folder');
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (!window.confirm('Delete this file?')) return;
    try {
      await deleteFile(id);
      loadContents();
    } catch (err) {
      alert('Could not delete file');
    }
  };

  const handleDownload = async (id: string, name: string) => {
    try {
      const blob = await getDownloadBlob(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download failed');
    }
  };

  const handleShareCurrentFolder = async () => {
    if (!folderId) return;
    const email = window.prompt('Share with (email):');
    if (!email) return;
    const grantEdit = window.confirm('Click OK to grant EDIT access, Cancel for VIEW-only access.');
    try {
      await shareFolder(folderId, email, grantEdit ? 'EDIT' : 'VIEW');
      alert('Shared successfully');
    } catch (err) {
      alert('Could not share — check the email is correct and registered');
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Welcome, {user?.name}</h1>
        <button onClick={logout} style={{ padding: '6px 12px' }}>Log out</button>
      </div>

      <p><Link to="/shared">Shared with me</Link></p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '1rem 0' }}>
        {folderId && <button onClick={handleBack}>&larr; Back</button>}
        <h2 style={{ margin: 0 }}>{currentName}</h2>
        {folderId && !isOwner && <small style={{ color: '#888' }}>({accessLevel.toLowerCase()} access)</small>}
      </div>

      {canEdit && (
        <div style={{ display: 'flex', gap: 12, marginBottom: '1rem' }}>
          <button onClick={handleCreateFolder} style={{ padding: '8px 16px' }}>+ New folder</button>
          <label style={{ padding: '8px 16px', border: '1px solid #ccc', cursor: 'pointer' }}>
            Upload file
            <input type="file" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
          {folderId && isOwner && (
            <button onClick={handleShareCurrentFolder} style={{ padding: '8px 16px' }}>Share this folder</button>
          )}
        </div>
      )}

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && folders.length === 0 && files.length === 0 && <p>This folder is empty.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {folders.map((f) => (
          <li key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <span onClick={() => handleOpenFolder(f.id)} style={{ cursor: 'pointer' }}>📁 {f.name}</span>
            {isOwner && <button onClick={() => handleDeleteFolder(f.id)} style={{ padding: '2px 8px' }}>Delete</button>}
          </li>
        ))}
        {files.map((file) => (
          <li key={file.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <span>📄 {file.name} <small style={{ color: '#888' }}>({Math.round(file.size / 1024)} KB)</small></span>
            <span>
              <button onClick={() => handleDownload(file.id, file.name)} style={{ padding: '2px 8px', marginRight: 8 }}>Download</button>
              {isOwner && <button onClick={() => handleDeleteFile(file.id)} style={{ padding: '2px 8px' }}>Delete</button>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}