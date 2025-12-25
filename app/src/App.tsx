import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';
import Login from './pages/auth/Login';
import DashboardRouter from './components/routing/DashboardRouter';
import BranchLayout from './components/layout/BranchLayout';
import ManagerBranchDashboard from './pages/branch/ManagerBranchDashboard';
import BranchEmployeesPage from './pages/branch/BranchEmployeesPage';
import CustomersPage from './pages/branch/CustomersPage';
import InventoryList from './pages/inventory/InventoryList';
import StockAdjustment from './pages/inventory/StockAdjustment';
import ItemsList from './pages/branch/ItemsList';
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
import RequestPettyCashPage from './pages/branch/RequestPettyCashPage';
import MyPettyCashRequestsPage from './pages/branch/MyPettyCashRequestsPage';
import PettyCashTransferHistoryPage from './pages/branch/PettyCashTransferHistoryPage';
import PettyCashMainPage from './pages/branch/PettyCashMainPage';
import ServiceList from './pages/services/ServiceList';
import CreateService from './pages/services/CreateService';
import ServiceDetail from './pages/services/ServiceDetail';
import TechnicianDashboard from './pages/services/TechnicianDashboard';
import TechnicianManagement from './pages/branch/TechnicianManagement';
import InvoiceList from './pages/invoices/InvoiceList';
import SalesReturnManagement from './pages/sales-returns/SalesReturnManagement';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import CreateInvoice from './pages/invoices/CreateInvoice';
import EstimateList from './pages/estimates/EstimateList';
import CreateEstimate from './pages/estimates/CreateEstimate';
import EstimateDetail from './pages/estimates/EstimateDetail';
import PointsHistoryPage from './pages/technician/PointsHistoryPage';
import MyTasks from './pages/tasks/MyTasks';
import ReportsPage from './pages/branch/ReportsPage';
import CashSettlementPage from './pages/branch/CashSettlementPage';
import SettingsPage from './pages/branch/SettingsPage';

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
            <Route path="/" element={<BranchLayout />}>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<DashboardRouter />} />
              <Route path="details" element={<ManagerBranchDashboard />} />
              <Route path="employees" element={<BranchEmployeesPage />} />
              <Route path="services" element={<ServiceList />} />
              <Route path="services/create" element={<CreateService />} />
              <Route path="services/:id" element={<ServiceDetail />} />
              <Route path="technician-dashboard" element={<TechnicianDashboard />} />
              <Route path="points-history" element={<PointsHistoryPage />} />
              <Route path="technicians" element={<TechnicianManagement />} />
              <Route path="my-tasks" element={<MyTasks />} />
              <Route path="invoices" element={<InvoiceList />} />
              <Route path="invoices/create" element={<CreateInvoice />} />
              <Route path="invoices/:id" element={<InvoiceDetail />} />
              <Route path="estimates" element={<EstimateList />} />
              <Route path="estimates/create" element={<CreateEstimate />} />
              <Route path="estimates/:id" element={<EstimateDetail />} />
              <Route path="sales-returns" element={<SalesReturnManagement />} />
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
              <Route path="expenses" element={<ExpensesMainPage />} />
              <Route path="petty-cash" element={<PettyCashMainPage />} />
              <Route path="expenses/dashboard" element={<ExpenseDashboardPage />} />
              <Route path="expenses/record" element={<RecordExpensePage />} />
              <Route path="expenses/history" element={<ExpenseHistoryPage />} />
              <Route path="expenses/analytics" element={<ExpenseAnalyticsPage />} />
              <Route path="petty-cash/request" element={<RequestPettyCashPage />} />
              <Route path="petty-cash/my-requests" element={<MyPettyCashRequestsPage />} />
              <Route path="petty-cash/history" element={<PettyCashTransferHistoryPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="cash-settlement" element={<CashSettlementPage />} />
              <Route path="settings" element={<SettingsPage />} />
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
