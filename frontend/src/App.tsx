import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';
import Login from './pages/auth/Login';
import DashboardRouter from './components/routing/DashboardRouter';
import DashboardLayout from './components/layout/DashboardLayout';
import BranchLayout from './components/layout/BranchLayout';
import BranchList from './pages/branches/BranchList';
import CreateBranch from './pages/branches/CreateBranch';
import EditBranch from './pages/branches/EditBranch';
import BranchDashboard from './pages/branches/BranchDashboard';
import ManagerBranchDashboard from './pages/branch/ManagerBranchDashboard';
import BranchEmployeesPage from './pages/branch/BranchEmployeesPage';
import CustomersPage from './pages/branch/CustomersPage';
import RoleList from './pages/roles/RoleList';
import CreateRole from './pages/roles/CreateRole';
import EditRole from './pages/roles/EditRole';
import EmployeeList from './pages/employees/EmployeeList';
import CreateEmployee from './pages/employees/CreateEmployee';
import EditEmployee from './pages/employees/EditEmployee';
import InventoryList from './pages/inventory/InventoryList';
import StockAdjustment from './pages/inventory/StockAdjustment';
import ItemsList from './pages/items/ItemsList';
import SupplierList from './pages/suppliers/SupplierList';
import PurchaseOrderList from './pages/purchases/PurchaseOrderList';
import CreatePurchaseOrder from './pages/purchases/CreatePurchaseOrder';
import PurchaseOrderDetails from './pages/purchases/PurchaseOrderDetails';
import ReceiveItems from './pages/purchases/ReceiveItems';
import MakePayment from './pages/purchases/MakePayment';
import ReturnItems from './pages/purchases/ReturnItems';
import PurchaseReturnsPage from './pages/purchases/PurchaseReturnsPage';
import PurchaseReturnManagement from './pages/purchases/PurchaseReturnManagement';
import MastersPage from './pages/branch/MastersPage';
import ExpenseDashboardPage from './pages/branch/ExpenseDashboardPage';
import RecordExpensePage from './pages/branch/RecordExpensePage';
import ExpenseHistoryPage from './pages/branch/ExpenseHistoryPage';
import ExpenseAnalyticsPage from './pages/branch/ExpenseAnalyticsPage';
import ExpensesMainPage from './pages/branch/ExpensesMainPage';
import PettyCashTransfersPage from './pages/admin/PettyCashTransfersPage';
import PettyCashRequestsPage from './pages/admin/PettyCashRequestsPage';
import RequestPettyCashPage from './pages/branch/RequestPettyCashPage';
import MyPettyCashRequestsPage from './pages/branch/MyPettyCashRequestsPage';
import PettyCashTransferHistoryPage from './pages/branch/PettyCashTransferHistoryPage';
import PettyCashMainPage from './pages/branch/PettyCashMainPage';
import ServiceList from './pages/services/ServiceList';
import CreateService from './pages/services/CreateService';
import ServiceDetail from './pages/services/ServiceDetail';
import TechnicianDashboard from './pages/services/TechnicianDashboard';
import InvoiceList from './pages/invoices/InvoiceList';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import CreateInvoice from './pages/invoices/CreateInvoice';
import TemplateList from './pages/invoices/templates/TemplateList';
import CreateEditTemplate from './pages/invoices/templates/CreateEditTemplate';
import EstimateList from './pages/estimates/EstimateList';
import CreateEstimate from './pages/estimates/CreateEstimate';
import EstimateDetail from './pages/estimates/EstimateDetail';
import ThemeList from './pages/themes/ThemeList';
import ThemeView from './pages/themes/ThemeView';
import ThemeForm from './pages/themes/ThemeForm';
import JobSheetTemplateList from './pages/jobsheet-templates/JobSheetTemplateList';
import JobSheetTemplateForm from './pages/jobsheet-templates/JobSheetTemplateForm';
import CategoryManager from './pages/jobsheet-templates/CategoryManager';
import SettingsMainPage from './pages/settings/SettingsMainPage';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const NotFound = () => <div className="flex items-center justify-center min-h-screen">
  <div className="text-center">
    <h1 className="text-6xl font-bold text-gray-300">404</h1>
    <p className="text-xl text-gray-600 mt-4">Page not found</p>
  </div>
</div>;

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <Router>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/admin/dashboard" /> : <Login />} />
          <Route path="/dashboard" element={isAuthenticated ? <DashboardRouter /> : <Navigate to="/login" />} />

          {/* Admin routes wrapped with DashboardLayout */}
          {isAuthenticated ? (
            <Route path="/admin" element={<DashboardLayout />}>
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
            </Route>
          ) : null}

          {/* Branch routes wrapped with BranchLayout */}
          {isAuthenticated ? (
            <Route path="/branch" element={<BranchLayout />}>
              <Route path="dashboard" element={<ManagerBranchDashboard />} />
              <Route path="details" element={<ManagerBranchDashboard />} />
              <Route path="employees" element={<BranchEmployeesPage />} />
              <Route path="services" element={<ServiceList />} />
              <Route path="services/create" element={<CreateService />} />
              <Route path="services/:id" element={<ServiceDetail />} />
              <Route path="technician-dashboard" element={<TechnicianDashboard />} />
              <Route path="invoices" element={<InvoiceList />} />
              <Route path="invoices/create" element={<CreateInvoice />} />
              <Route path="invoices/:id" element={<InvoiceDetail />} />
              <Route path="estimates" element={<EstimateList />} />
              <Route path="estimates/create" element={<CreateEstimate />} />
              <Route path="estimates/:id" element={<EstimateDetail />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="items" element={<ItemsList />} />
              <Route path="inventory" element={<InventoryList />} />
              <Route path="inventory/adjust" element={<StockAdjustment />} />
              <Route path="suppliers" element={<SupplierList />} />
              <Route path="masters" element={<MastersPage />} />
              <Route path="purchases" element={<PurchaseOrderList />} />
              <Route path="purchases/create" element={<CreatePurchaseOrder />} />
              <Route path="purchases/:id" element={<PurchaseOrderDetails />} />
              <Route path="purchases/:id/receive" element={<ReceiveItems />} />
              <Route path="purchases/:id/payment" element={<MakePayment />} />
              <Route path="purchases/:id/return" element={<ReturnItems />} />
              <Route path="purchase-returns" element={<PurchaseReturnsPage />} />
              <Route path="returns-management" element={<PurchaseReturnManagement />} />
              {/* New main pages with tabs */}
              <Route path="expenses" element={<ExpensesMainPage />} />
              <Route path="petty-cash" element={<PettyCashMainPage />} />
              {/* Keep old routes for backward compatibility */}
              <Route path="expenses/dashboard" element={<ExpenseDashboardPage />} />
              <Route path="expenses/record" element={<RecordExpensePage />} />
              <Route path="expenses/history" element={<ExpenseHistoryPage />} />
              <Route path="expenses/analytics" element={<ExpenseAnalyticsPage />} />
              <Route path="petty-cash/request" element={<RequestPettyCashPage />} />
              <Route path="petty-cash/my-requests" element={<MyPettyCashRequestsPage />} />
              <Route path="petty-cash/history" element={<PettyCashTransferHistoryPage />} />
              <Route path="reports" element={<ManagerBranchDashboard />} />
              <Route path="settings" element={<SettingsMainPage />} />
            </Route>
          ) : null}

          <Route path="/" element={<Navigate to={isAuthenticated ? "/admin/dashboard" : "/login"} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
