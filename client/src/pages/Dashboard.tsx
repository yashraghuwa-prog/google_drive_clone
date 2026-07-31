import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Welcome, {user?.name}</h1>
      <p>Your drive is empty for now — folder and file browsing lands next.</p>
      <button onClick={logout} style={{ padding: '8px 16px' }}>Log out</button>
    </div>
  );
}