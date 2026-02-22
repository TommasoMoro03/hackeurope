import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { Dashboard } from '@/pages/Dashboard';
import { LinkRepository } from '@/pages/LinkRepository';
import { ConnectGitHub } from '@/pages/ConnectGitHub';

function App() {
  return (
    <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/connect-github"
              element={
                <ProtectedRoute>
                  <ConnectGitHub />
                </ProtectedRoute>
              }
            />
            <Route
              path="/link-repository"
              element={
                <ProtectedRoute>
                  <LinkRepository />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
