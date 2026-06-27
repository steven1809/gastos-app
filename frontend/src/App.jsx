import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/layout/PrivateRoute';
import AdminRoute from './components/layout/AdminRoute';
import FloatingChatbot from './components/FloatingChatbot';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Reports from './pages/Reports';
import AdminPanel from './pages/AdminPanel';

const AppRoutes = () => {
  const { token } = useAuth();
  
  return (
    <>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/" /> : <Register />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout><Dashboard /></Layout>
          </PrivateRoute>
        } />
        <Route path="/transactions" element={
          <PrivateRoute>
            <Layout><Transactions /></Layout>
          </PrivateRoute>
        } />
        <Route path="/budgets" element={
          <PrivateRoute>
            <Layout><Budgets /></Layout>
          </PrivateRoute>
        } />
        <Route path="/goals" element={
          <PrivateRoute>
            <Layout><Goals /></Layout>
          </PrivateRoute>
        } />
        <Route path="/reports" element={
          <PrivateRoute>
            <Layout><Reports /></Layout>
          </PrivateRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <Layout><AdminPanel /></Layout>
          </AdminRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      {token && <FloatingChatbot />}
    </>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
