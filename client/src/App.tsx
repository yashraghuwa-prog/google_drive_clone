import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import SharedWithMe from './pages/SharedWithMe';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard/:folderId?"
            element={
            <ProtectedRoute>
            <Dashboard />
              <Route
               path="/shared"
       element={
        <ProtectedRoute>
         <SharedWithMe />
    </ProtectedRoute>
  }
/>
          </ProtectedRoute>
  }
/>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;