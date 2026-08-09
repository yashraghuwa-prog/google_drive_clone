import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getSharedWithMe, Share } from '../api/folders';
import { useAuth } from '../context/AuthContext';

export default function SharedWithMe() {
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    getSharedWithMe()
      .then(setShares)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Shared with me</h1>
        <button onClick={logout} style={{ padding: '6px 12px' }}>Log out</button>
      </div>
      <p><Link to="/dashboard">&larr; My Drive</Link></p>

      {loading && <p>Loading...</p>}
      {!loading && shares.length === 0 && <p>Nothing has been shared with you yet.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {shares.map((s) => (
          <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <span onClick={() => navigate(`/dashboard/${s.folderId}`)} style={{ cursor: 'pointer' }}>
              📁 {s.folder.name} <small style={{ color: '#888' }}>({s.permission.toLowerCase()}, shared by {s.sharedBy.name})</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}