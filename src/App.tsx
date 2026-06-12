import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import AlertList from '@/pages/AlertList';
import CaseDetail from '@/pages/CaseDetail';
import Strategy from '@/pages/Strategy';
import Reports from '@/pages/Reports';
import AuditCenter from '@/pages/AuditCenter';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alerts" element={<AlertList />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/strategy" element={<Strategy />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/audit" element={<AuditCenter />} />
        </Route>
      </Routes>
    </Router>
  );
}
