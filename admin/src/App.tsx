import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';
import Login from './pages/auth/Login';
import DashboardRouter from './components/routing/DashboardRouter';
import DashboardLayout from './components/layout/DashboardLayout';
import BranchList from './pages/admin/branches/BranchList';
import CreateBranch from './pages/admin/branches/CreateBranch';
import EditBranch from './pages/admin/branches/EditBranch';
import BranchDashboard from './pages/admin/branches/BranchDashboard';
import RoleList from './pages/admin/roles/RoleList';
import CreateRole from './pages/admin/roles/CreateRole';
import EditRole from './pages/admin/roles/EditRole';
import EmployeeList from './pages/admin/employees/EmployeeList';
import CreateEmployee from './pages/admin/employees/CreateEmployee';
import EditEmployee from './pages/admin/employees/EditEmployee';
import ItemsList from './pages/admin/items/ItemsList';
import MastersPage from './pages/admin/masters/MastersPage';
import PettyCashTransfersPage from './pages/admin/PettyCashTransfersPage';
import PettyCashRequestsPage from './pages/admin/PettyCashRequestsPage';
import ThemeList from './pages/admin/themes/ThemeList';
import ThemeView from './pages/admin/themes/ThemeView';
import ThemeForm from './pages/admin/themes/ThemeForm';
import JobSheetTemplateList from './pages/admin/jobsheet-templates/JobSheetTemplateList';
import JobSheetTemplateForm from './pages/admin/jobsheet-templates/JobSheetTemplateForm';
import CategoryManager from './pages/admin/jobsheet-templates/CategoryManager';
import SettingsMainPage from './pages/admin/settings/SettingsMainPage';
import TechnicianManagement from './pages/admin/TechnicianManagement';
import TaskManagement from './pages/admin/TaskManagement';
import WarrantyManagement from './pages/admin/WarrantyManagement';
import ReportsPage from './pages/admin/reports/ReportsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const NotFound = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-xl text-gray-600 mt-4">Page not found</p>
    </div>
  </div>
);

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <Router>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />

          {isAuthenticated ? (
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<DashboardRouter />} />
              <Route path="masters" element={<MastersPage />} />
              <Route path="items" element={<ItemsList />} />
              <Route path="branches" element={<BranchList />} />
              <Route path="branches/create" element={<CreateBranch />} />
              <Route path="branches/edit/:id" element={<EditBranch />} />
              <Route path="branches/:id/dashboard" element={<BranchDashboard />} />
              <Route path="roles" element={<RoleList />} />
              <Route path="roles/create" element={<CreateRole />} />
              <Route path="roles/edit/:id" element={<EditRole />} />
              <Route path="employees" element={<EmployeeList />} />
              <Route path="employees/create" element={<CreateEmployee />} />
              <Route path="employees/edit/:id" element={<EditEmployee />} />
              <Route path="petty-cash/transfers" element={<PettyCashTransfersPage />} />
              <Route path="petty-cash/requests" element={<PettyCashRequestsPage />} />
              <Route path="technicians" element={<TechnicianManagement />} />
              <Route path="tasks" element={<TaskManagement />} />
              <Route path="warranties" element={<WarrantyManagement />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="themes" element={<ThemeList />} />
              <Route path="themes/create" element={<ThemeForm />} />
              <Route path="themes/edit/:id" element={<ThemeForm />} />
              <Route path="themes/:id" element={<ThemeView />} />
              <Route path="jobsheet-templates" element={<JobSheetTemplateList />} />
              <Route path="jobsheet-templates/create" element={<JobSheetTemplateForm />} />
              <Route path="jobsheet-templates/edit/:id" element={<JobSheetTemplateForm />} />
              <Route path="jobsheet-templates/categories" element={<CategoryManager />} />
              <Route path="settings" element={<SettingsMainPage />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
