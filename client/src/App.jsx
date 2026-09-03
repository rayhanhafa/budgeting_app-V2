import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TransactionsHistory from './pages/TransactionsHistory';
import Budgets from './pages/Budgets';
import Savings from './pages/Savings';
import Categories from './pages/Categories';
import Subscriptions from './pages/Subscriptions';
import Settings from './pages/Settings';
import PwaBadge from './components/PwaBadge';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

import { PrivacyProvider } from './context/PrivacyContext';

function App() {
  return (
    <AuthProvider>
      <PrivacyProvider>
        <BrowserRouter>
          <PwaBadge />
          <Routes>
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            <Route 
              path="/transactions" 
              element={
                <ProtectedRoute>
                  <TransactionsHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/budgets" 
              element={
                <ProtectedRoute>
                  <Budgets />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/savings" 
              element={
                <ProtectedRoute>
                  <Savings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/categories" 
              element={
                <ProtectedRoute>
                  <Categories />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/subscriptions" 
              element={
                <ProtectedRoute>
                  <Subscriptions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </PrivacyProvider>
    </AuthProvider>
  );
}

export default App;
