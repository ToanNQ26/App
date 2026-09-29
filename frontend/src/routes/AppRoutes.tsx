import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components';
import { AdminPage, BankAccountPage, DashboardPage, LoginPage, RequestDetailPage, RequestFormPage, RequestsPage } from '../pages';

function ProtectedLayout() {
  const { user } = useAuth();
  return user ? <Layout /> : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedLayout />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/requests" element={<RequestsPage />} />
      <Route path="/requests/tracked" element={<RequestsPage tracked />} />
      <Route path="/requests/new" element={<RequestFormPage />} />
      <Route path="/requests/:id" element={<RequestDetailPage />} />
      <Route path="/profile/bank-account" element={<BankAccountPage />} />
      <Route path="/approvals" element={<RequestsPage approval />} />
      <Route path="/payments" element={<RequestsPage payments />} />
      <Route path="/admin" element={<AdminPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" />} />
  </Routes>;
}
