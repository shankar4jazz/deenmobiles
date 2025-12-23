import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X, Check, Database, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { masterDataApi, accessoryApi } from '../../services/masterDataApi';
import {
  ItemCategory,
  ItemUnit,
  ItemGSTRate,
  ItemBrand,
  ItemModel,
  Fault,
  PaymentMethod,
  ExpenseCategory,
  ServiceIssue,
  Accessory,
  CreateItemCategoryDto,
  CreateItemUnitDto,
  CreateItemGSTRateDto,
  CreateItemBrandDto,
  CreateItemModelDto,
  CreateFaultDto,
  CreatePaymentMethodDto,
  CreateExpenseCategoryDto,
  CreateServiceIssueDto,
  CreateAccessoryDto,
} from '../../types/masters';

type MasterType = 'category' | 'unit' | 'gst-rate' | 'brand' | 'model' | 'fault' | 'payment-method' | 'expense-category' | 'service-issue' | 'accessory';

export default function MastersPage() {
  const [activeTab, setActiveTab] = useState<MasterType>('category');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();

  // Queries for all three types
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => masterDataApi.categories.getAll({ limit: 100, isActive: true }),
  });

  const unitsQuery = useQuery({
    queryKey: ['units'],
    queryFn: () => masterDataApi.units.getAll({ limit: 100, isActive: true }),
  });

  const gstRatesQuery = useQuery({
    queryKey: ['gstRates'],
    queryFn: () => masterDataApi.gstRates.getAll({ limit: 100, isActive: true }),
  });

  const brandsQuery = useQuery({
    queryKey: ['brands'],
    queryFn: () => masterDataApi.brands.getAll({ limit: 100, isActive: true }),
  });

  const modelsQuery = useQuery({
    queryKey: ['models'],
    queryFn: () => masterDataApi.models.getAll({ limit: 100, isActive: true }),
  });

  const faultsQuery = useQuery({
    queryKey: ['faults'],
    queryFn: () => masterDataApi.faults.getAll({ limit: 100, isActive: true }),
  });

  const paymentMethodsQuery = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: () => masterDataApi.paymentMethods.getAll({ limit: 100, isActive: true }),
  });

  const expenseCategoriesQuery = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: () => masterDataApi.expenseCategories.getAll({ limit: 100, isActive: true }),
  });

  const serviceIssuesQuery = useQuery({
    queryKey: ['serviceIssues'],
    queryFn: () => masterDataApi.serviceIssues.getAll({ limit: 200, isActive: true }),
  });

  const accessoriesQuery = useQuery({
    queryKey: ['accessories'],
    queryFn: () => accessoryApi.getAll({ limit: 100, isActive: true }),
  });

  const handleOpenModal = (item?: any) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Master Data Sidebar */}
      <div className="w-56 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-5 w-5 text-purple-600" />
              <h2 className="text-sm font-bold text-gray-900">Master Data</h2>
            </div>
            <p className="text-xs text-gray-500">
              Manage inventory master data
            </p>
          </div>

          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('category')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'category'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>Item Categories</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'category'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {categoriesQuery.data?.data.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('unit')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'unit'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>Item Units</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'unit'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {unitsQuery.data?.data.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('gst-rate')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'gst-rate'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>GST Rates</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'gst-rate'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {gstRatesQuery.data?.data.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('brand')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'brand'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>Item Brands</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'brand'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {brandsQuery.data?.data.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('model')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'model'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>Item Models</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'model'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {modelsQuery.data?.data.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('fault')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'fault'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>Faults</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'fault'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {faultsQuery.data?.data.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('payment-method')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'payment-method'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>Payment Methods</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'payment-method'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {paymentMethodsQuery.data?.data.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('expense-category')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'expense-category'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>Expense Categories</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'expense-category'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {expenseCategoriesQuery.data?.data.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('service-issue')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'service-issue'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>Damage Conditions</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'service-issue'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {serviceIssuesQuery.data?.data.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('accessory')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'accessory'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>Accessories</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'accessory'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {accessoriesQuery.data?.data.length || 0}
              </span>
            </button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            {/* Content Sections */}
            {activeTab === 'category' && (
              <CategorySection
                data={categoriesQuery.data?.data || []}
                isLoading={categoriesQuery.isLoading}
                onAdd={() => handleOpenModal()}
                onEdit={handleOpenModal}
                onImport={() => setIsImportModalOpen(true)}
              />
            )}
            {activeTab === 'unit' && (
              <UnitSection
                data={unitsQuery.data?.data || []}
                isLoading={unitsQuery.isLoading}
                onAdd={() => handleOpenModal()}
                onEdit={handleOpenModal}
                onImport={() => setIsImportModalOpen(true)}
              />
            )}
            {activeTab === 'gst-rate' && (
              <GSTRateSection
                data={gstRatesQuery.data?.data || []}
                isLoading={gstRatesQuery.isLoading}
                onAdd={() => handleOpenModal()}
                onEdit={handleOpenModal}
                onImport={() => setIsImportModalOpen(true)}
              />
            )}
            {activeTab === 'brand' && (
              <BrandSection
                data={brandsQuery.data?.data || []}
                isLoading={brandsQuery.isLoading}
                onAdd={() => handleOpenModal()}
                onEdit={handleOpenModal}
                onImport={() => setIsImportModalOpen(true)}
              />
            )}
            {activeTab === 'model' && (
              <ModelSection
                data={modelsQuery.data?.data || []}
                isLoading={modelsQuery.isLoading}
                onAdd={() => handleOpenModal()}
                onEdit={handleOpenModal}
                onImport={() => setIsImportModalOpen(true)}
                brands={brandsQuery.data?.data || []}
              />
            )}
            {activeTab === 'fault' && (
              <FaultSection
                data={faultsQuery.data?.data || []}
                isLoading={faultsQuery.isLoading}
                onAdd={() => handleOpenModal()}
                onEdit={handleOpenModal}
                onImport={() => setIsImportModalOpen(true)}
              />
            )}
            {activeTab === 'payment-method' && (
              <PaymentMethodSection
                data={paymentMethodsQuery.data?.data || []}
                isLoading={paymentMethodsQuery.isLoading}
                onAdd={() => handleOpenModal()}
                onEdit={handleOpenModal}
                onImport={() => setIsImportModalOpen(true)}
              />
            )}
            {activeTab === 'expense-category' && (
              <ExpenseCategorySection
                data={expenseCategoriesQuery.data?.data || []}
                isLoading={expenseCategoriesQuery.isLoading}
                onAdd={() => handleOpenModal()}
                onEdit={handleOpenModal}
                onImport={() => setIsImportModalOpen(true)}
              />
            )}
            {activeTab === 'service-issue' && (
              <ServiceIssueSection
                data={serviceIssuesQuery.data?.data || []}
                isLoading={serviceIssuesQuery.isLoading}
                onAdd={() => handleOpenModal()}
                onEdit={handleOpenModal}
                onImport={() => setIsImportModalOpen(true)}
              />
            )}
            {activeTab === 'accessory' && (
              <AccessorySection
                data={accessoriesQuery.data?.data || []}
                isLoading={accessoriesQuery.isLoading}
                onAdd={() => handleOpenModal()}
                onEdit={handleOpenModal}
                onImport={() => setIsImportModalOpen(true)}
              />
            )}
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <MasterDataModal
            type={activeTab}
            item={editingItem}
            onClose={handleCloseModal}
          />
        )}

        {/* Import Modal */}
        {isImportModalOpen && (
          <ImportModal
            type={activeTab}
            onClose={() => setIsImportModalOpen(false)}
            onSuccess={() => {
              setIsImportModalOpen(false);
              // Invalidate the appropriate query
              const queryKey = activeTab === 'category' ? 'categories' :
                activeTab === 'unit' ? 'units' :
                activeTab === 'gst-rate' ? 'gstRates' :
                activeTab === 'brand' ? 'brands' :
                activeTab === 'model' ? 'models' :
                activeTab === 'fault' ? 'faults' :
                activeTab === 'payment-method' ? 'paymentMethods' :
                activeTab === 'expense-category' ? 'expenseCategories' :
                activeTab === 'service-issue' ? 'serviceIssues' :
                'accessories';
              queryClient.invalidateQueries({ queryKey: [queryKey] });
            }}
          />
        )}
      </div>
  );
}

// Category Section Component
function CategorySection({
  data,
  isLoading,
  onAdd,
  onEdit,
  onImport,
}: {
  data: ItemCategory[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: ItemCategory) => void;
  onImport: () => void;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterDataApi.categories.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deactivated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-900">Item Categories</h2>
        <div className="flex gap-2">
          <button
            onClick={onImport}
            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-xs"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-xs"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                  {category.name}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {category.description || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      category.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                  <button
                    onClick={() => onEdit(category)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to deactivate this category?')) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No categories found. Click "Add Category" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

// Unit Section Component
function UnitSection({
  data,
  isLoading,
  onAdd,
  onEdit,
}: {
  data: ItemUnit[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: ItemUnit) => void;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterDataApi.units.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success('Unit deactivated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete unit');
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-900">Item Units</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-xs"
        >
          <Plus className="h-4 w-4" />
          Add Unit
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Symbol
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((unit) => (
              <tr key={unit.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                  {unit.name}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {unit.symbol || '-'}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {unit.description || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      unit.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {unit.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                  <button
                    onClick={() => onEdit(unit)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to deactivate this unit?')) {
                        deleteMutation.mutate(unit.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No units found. Click "Add Unit" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

// GST Rate Section Component
function GSTRateSection({
  data,
  isLoading,
  onAdd,
  onEdit,
}: {
  data: ItemGSTRate[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: ItemGSTRate) => void;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterDataApi.gstRates.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gstRates'] });
      toast.success('GST rate deactivated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete GST rate');
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-900">GST Rates</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-xs"
        >
          <Plus className="h-4 w-4" />
          Add GST Rate
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Rate (%)
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((rate) => (
              <tr key={rate.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                  {rate.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                  {rate.rate}%
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {rate.description || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rate.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {rate.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                  <button
                    onClick={() => onEdit(rate)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to deactivate this GST rate?')) {
                        deleteMutation.mutate(rate.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No GST rates found. Click "Add GST Rate" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

// Brand Section Component
function BrandSection({
  data,
  isLoading,
  onAdd,
  onEdit,
}: {
  data: ItemBrand[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: ItemBrand) => void;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterDataApi.brands.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand deactivated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete brand');
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-900">Item Brands</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-xs"
        >
          <Plus className="h-4 w-4" />
          Add Brand
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Code
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((brand) => (
              <tr key={brand.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                  {brand.name}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {brand.code || '-'}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {brand.description || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      brand.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {brand.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                  <button
                    onClick={() => onEdit(brand)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to deactivate this brand?')) {
                        deleteMutation.mutate(brand.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No brands found. Click "Add Brand" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

// Model Section Component
function ModelSection({
  data,
  isLoading,
  onAdd,
  onEdit,
  brands,
}: {
  data: ItemModel[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: ItemModel) => void;
  brands: ItemBrand[];
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterDataApi.models.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      toast.success('Model deactivated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete model');
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-900">Item Models</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-xs"
        >
          <Plus className="h-4 w-4" />
          Add Model
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Code
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Brand
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((model) => (
              <tr key={model.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                  {model.name}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {model.code || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {model.brand?.name || '-'}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {model.description || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      model.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {model.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                  <button
                    onClick={() => onEdit(model)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to deactivate this model?')) {
                        deleteMutation.mutate(model.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No models found. Click "Add Model" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

// Fault Section Component
function FaultSection({
  data,
  isLoading,
  onAdd,
  onEdit,
}: {
  data: Fault[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: Fault) => void;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterDataApi.faults.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faults'] });
      toast.success('Fault deactivated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete fault');
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-900">Faults</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-xs"
        >
          <Plus className="h-4 w-4" />
          Add Fault
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Code
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Default Price
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Level
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Technician Points
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Tags
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                  {category.name}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {category.code || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                  ₹{Number(category.defaultPrice).toFixed(2)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    category.level === 1 ? 'bg-green-100 text-green-800' :
                    category.level === 2 ? 'bg-blue-100 text-blue-800' :
                    category.level === 3 ? 'bg-yellow-100 text-yellow-800' :
                    category.level === 4 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    L{category.level || 1}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {category.technicianPoints} pts
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {category.description || '-'}
                </td>
                <td className="px-3 py-2 text-xs">
                  {category.tags ? (
                    <div className="flex flex-wrap gap-1">
                      {category.tags.split(',').map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      category.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                  <button
                    onClick={() => onEdit(category)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to deactivate this fault?')) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No faults found. Click "Add Fault" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

// Payment Method Section Component
function PaymentMethodSection({
  data,
  isLoading,
  onAdd,
  onEdit,
  onImport,
}: {
  data: PaymentMethod[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: PaymentMethod) => void;
  onImport: () => void;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterDataApi.paymentMethods.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      toast.success('Payment method deactivated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete payment method');
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-900">Payment Methods</h2>
        <div className="flex gap-2">
          <button
            onClick={onImport}
            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-xs"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-xs"
          >
            <Plus className="h-4 w-4" />
            Add Payment Method
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Code
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((method) => (
              <tr key={method.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                  {method.name}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {method.code}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {method.description || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      method.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {method.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                  <button
                    onClick={() => onEdit(method)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to deactivate this payment method?')) {
                        deleteMutation.mutate(method.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No payment methods found. Click "Add Payment Method" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

// Expense Category Section Component
function ExpenseCategorySection({
  data,
  isLoading,
  onAdd,
  onEdit,
  onImport,
}: {
  data: ExpenseCategory[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: ExpenseCategory) => void;
  onImport: () => void;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterDataApi.expenseCategories.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
      toast.success('Expense category deactivated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete expense category');
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-900">Expense Categories</h2>
        <div className="flex gap-2">
          <button
            onClick={onImport}
            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-xs"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-xs"
        >
          <Plus className="h-4 w-4" />
          Add Expense Category
        </button>
      </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Code
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                  {category.name}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {category.code || '-'}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {category.description || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      category.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                  <button
                    onClick={() => onEdit(category)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to deactivate this expense category?')) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No expense categories found. Click "Add Expense Category" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

// Damage Condition Section Component
function ServiceIssueSection({
  data,
  isLoading,
  onAdd,
  onEdit,
  onImport,
}: {
  data: ServiceIssue[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: ServiceIssue) => void;
  onImport: () => void;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterDataApi.serviceIssues.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceIssues'] });
      toast.success('Service issue deactivated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete service issue');
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-900">Damage Conditions</h2>
        <div className="flex gap-2">
          <button
            onClick={onImport}
            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-xs"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-xs"
          >
            <Plus className="h-4 w-4" />
            Add Issue
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((issue) => (
              <tr key={issue.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                  {issue.name}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {issue.description || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      issue.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {issue.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                  <button
                    onClick={() => onEdit(issue)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to deactivate this service issue?')) {
                        deleteMutation.mutate(issue.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No service issues found. Click "Add Issue" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

// Accessory Section Component
function AccessorySection({
  data,
  isLoading,
  onAdd,
  onEdit,
  onImport,
}: {
  data: Accessory[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: Accessory) => void;
  onImport: () => void;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accessoryApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessories'] });
      toast.success('Accessory deactivated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete accessory');
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-900">Accessories</h2>
        <div className="flex gap-2">
          <button
            onClick={onImport}
            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-xs"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-xs"
          >
            <Plus className="h-4 w-4" />
            Add Accessory
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Code
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((accessory) => (
              <tr key={accessory.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                  {accessory.name}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {accessory.code || '-'}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {accessory.description || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      accessory.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {accessory.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                  <button
                    onClick={() => onEdit(accessory)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to deactivate this accessory?')) {
                        deleteMutation.mutate(accessory.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No accessories found. Click "Add Accessory" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

// Modal Component
function MasterDataModal({
  type,
  item,
  onClose,
}: {
  type: MasterType;
  item: any;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<any>(
    item || {
      name: '',
      code: '',
      description: '',
      symbol: '',
      rate: 0,
      brandId: '',
      defaultPrice: 0,
      level: 1,
      technicianPoints: 0,
      tags: ''
    }
  );
  const queryClient = useQueryClient();

  const brandsQuery = useQuery({
    queryKey: ['brands'],
    queryFn: () => masterDataApi.brands.getAll({ limit: 100, isActive: true }),
    enabled: type === 'model',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      if (type === 'category') return masterDataApi.categories.create(data);
      if (type === 'unit') return masterDataApi.units.create(data);
      if (type === 'gst-rate') return masterDataApi.gstRates.create(data);
      if (type === 'brand') return masterDataApi.brands.create(data);
      if (type === 'model') return masterDataApi.models.create(data);
      if (type === 'fault') return masterDataApi.faults.create(data);
      if (type === 'payment-method') return masterDataApi.paymentMethods.create(data);
      if (type === 'expense-category') return masterDataApi.expenseCategories.create(data);
      if (type === 'service-issue') return masterDataApi.serviceIssues.create(data);
      if (type === 'accessory') return accessoryApi.create(data);
      throw new Error('Invalid type');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          type === 'category' ? 'categories' :
          type === 'unit' ? 'units' :
          type === 'gst-rate' ? 'gstRates' :
          type === 'brand' ? 'brands' :
          type === 'model' ? 'models' :
          type === 'fault' ? 'faults' :
          type === 'payment-method' ? 'paymentMethods' :
          type === 'expense-category' ? 'expenseCategories' :
          type === 'service-issue' ? 'serviceIssues' :
          'accessories'
        ],
      });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      if (type === 'category') return masterDataApi.categories.update(item.id, data);
      if (type === 'unit') return masterDataApi.units.update(item.id, data);
      if (type === 'gst-rate') return masterDataApi.gstRates.update(item.id, data);
      if (type === 'brand') return masterDataApi.brands.update(item.id, data);
      if (type === 'model') return masterDataApi.models.update(item.id, data);
      if (type === 'fault') return masterDataApi.faults.update(item.id, data);
      if (type === 'payment-method') return masterDataApi.paymentMethods.update(item.id, data);
      if (type === 'expense-category') return masterDataApi.expenseCategories.update(item.id, data);
      if (type === 'service-issue') return masterDataApi.serviceIssues.update(item.id, data);
      if (type === 'accessory') return accessoryApi.update(item.id, data);
      throw new Error('Invalid type');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          type === 'category' ? 'categories' :
          type === 'unit' ? 'units' :
          type === 'gst-rate' ? 'gstRates' :
          type === 'brand' ? 'brands' :
          type === 'model' ? 'models' :
          type === 'fault' ? 'faults' :
          type === 'payment-method' ? 'paymentMethods' :
          type === 'expense-category' ? 'expenseCategories' :
          type === 'service-issue' ? 'serviceIssues' :
          'accessories'
        ],
      });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {item ? 'Edit' : 'Add'}{' '}
            {type === 'category' ? 'Category' :
             type === 'unit' ? 'Unit' :
             type === 'gst-rate' ? 'GST Rate' :
             type === 'brand' ? 'Brand' :
             type === 'model' ? 'Model' :
             type === 'fault' ? 'Fault' :
             type === 'payment-method' ? 'Payment Method' :
             type === 'expense-category' ? 'Expense Category' :
             type === 'service-issue' ? 'Damage Condition' :
             'Accessory'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          {(type === 'category' || type === 'unit' || type === 'brand' || type === 'model' || type === 'fault' || type === 'payment-method' || type === 'expense-category' || type === 'accessory') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code {type === 'payment-method' || type === 'unit' ? '*' : ''}
              </label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required={type === 'payment-method' || type === 'unit'}
              />
            </div>
          )}
          {type === 'unit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symbol
              </label>
              <input
                type="text"
                value={formData.symbol || ''}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}
          {type === 'model' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand (Optional)
              </label>
              <select
                value={formData.brandId || ''}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Brand</option>
                {brandsQuery.data?.data.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {type === 'gst-rate' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rate (%) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          )}
          {type === 'fault' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.defaultPrice}
                  onChange={(e) => setFormData({ ...formData, defaultPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level *
                </label>
                <select
                  value={formData.level || 1}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value={1}>Level 1 - Easy</option>
                  <option value={2}>Level 2 - Simple</option>
                  <option value={3}>Level 3 - Medium</option>
                  <option value={4}>Level 4 - Complex</option>
                  <option value={5}>Level 5 - Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Technician Points *
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.technicianPoints}
                  onChange={(e) => setFormData({ ...formData, technicianPoints: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags || ''}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., mic, speaker, board (comma separated)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">Enter comma-separated tags for parts categorization</p>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                'Saving...'
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  {item ? 'Update' : 'Create'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Import Modal Component
function ImportModal({
  type,
  onClose,
  onSuccess,
}: {
  type: MasterType;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        setError('Please select a CSV or Excel file');
        return;
      }
      setFile(selectedFile);
      setError('');

      if (fileName.endsWith('.csv')) {
        parseCSV(selectedFile);
      } else {
        parseExcel(selectedFile);
      }
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        setError('CSV file is empty or invalid');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });

      setPreview(data);
    };
    reader.readAsText(file);
  };

  const parseExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (jsonData.length < 2) {
          setError('Excel file is empty or invalid');
          return;
        }

        const headers = (jsonData[0] as any[]).map(h => String(h || '').trim());
        const rows = jsonData.slice(1, 6).map((row: any) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = String(row[index] || '').trim();
          });
          return obj;
        });

        setPreview(rows);
      } catch (err) {
        setError('Failed to parse Excel file');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError('');

    try {
      let data: any[] = [];
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.csv')) {
        // Parse CSV
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        });
      } else {
        // Parse Excel
        const arrayBuffer = await file.arrayBuffer();
        const workbookData = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(workbookData, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        const headers = (jsonData[0] as any[]).map(h => String(h || '').trim());
        data = jsonData.slice(1).map((row: any) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = String(row[index] || '').trim();
          });
          return obj;
        }).filter(row => Object.values(row).some(v => v)); // Filter empty rows
      }

        // Import each row
        let successCount = 0;
        let failCount = 0;

        for (const row of data) {
          try {
            if (type === 'category') {
              await masterDataApi.categories.create(row);
            } else if (type === 'unit') {
              await masterDataApi.units.create(row);
            } else if (type === 'gst-rate') {
              await masterDataApi.gstRates.create({ ...row, rate: parseFloat(row.rate) });
            } else if (type === 'brand') {
              await masterDataApi.brands.create(row);
            } else if (type === 'model') {
              await masterDataApi.models.create(row);
            } else if (type === 'fault') {
              await masterDataApi.faults.create({
                ...row,
                defaultPrice: parseFloat(row.defaultPrice || 0),
                level: parseInt(row.level || 1),
                technicianPoints: parseInt(row.technicianPoints || 0),
              });
            } else if (type === 'payment-method') {
              await masterDataApi.paymentMethods.create(row);
            } else if (type === 'expense-category') {
              await masterDataApi.expenseCategories.create(row);
            } else if (type === 'service-issue') {
              await masterDataApi.serviceIssues.create(row);
            }
            successCount++;
          } catch (err) {
            failCount++;
            console.error(`Failed to import row:`, row, err);
          }
        }

      alert(`Import completed!\nSuccessful: ${successCount}\nFailed: ${failCount}`);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to import data');
    } finally {
      setIsProcessing(false);
    }
  };

  const getCSVTemplate = () => {
    const templates: Record<MasterType, string> = {
      'category': 'name,code,description\nElectronics,ELEC,Electronic items\nMobile Accessories,MOB_ACC,Mobile accessories',
      'unit': 'name,code,symbol,description\nPiece,PC,Pcs,Individual pieces\nBox,BOX,Box,Packed in boxes',
      'gst-rate': 'name,rate,description\nGST 5%,5,5% GST rate\nGST 18%,18,18% GST rate',
      'brand': 'name,code,description\nSamsung,SAM,Samsung Electronics\nApple,APP,Apple Inc.',
      'model': 'name,code,brandId,description\niPhone 15,IP15,,Latest iPhone model\nGalaxy S24,GS24,,Latest Samsung Galaxy',
      'fault': 'name,code,defaultPrice,level,technicianPoints,description\nScreen Replacement,SCR_REP,1500,3,10,Screen replacement service\nBattery Replacement,BAT_REP,800,2,5,Battery replacement service',
      'payment-method': 'name,code,description\nCash,CASH,Cash payment\nUPI,UPI,UPI payment\nCard,CARD,Card payment',
      'expense-category': 'name,code,description\nRent,RENT,Office rent\nUtilities,UTIL,Electricity and water\nSalaries,SAL,Employee salaries',
      'service-issue': 'name,description\nScreen Cracked,Display glass or screen is cracked\nBattery Draining Fast,Battery discharges quickly\nNot Charging,Device not charging when connected',
    };
    return templates[type];
  };

  const downloadTemplate = () => {
    const template = getCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadExcelTemplate = () => {
    const templates: Record<MasterType, { headers: string[], samples: any[][] }> = {
      'category': {
        headers: ['name', 'code', 'description'],
        samples: [
          ['Electronics', 'ELEC', 'Electronic items'],
          ['Mobile Accessories', 'MOB_ACC', 'Mobile accessories'],
          ['Spare Parts', 'SPARE', 'Spare parts for repair'],
        ],
      },
      'unit': {
        headers: ['name', 'code', 'symbol', 'description'],
        samples: [
          ['Piece', 'PC', 'Pcs', 'Individual pieces'],
          ['Box', 'BOX', 'Box', 'Packed in boxes'],
          ['Pack', 'PACK', 'Pk', 'Packaged items'],
        ],
      },
      'gst-rate': {
        headers: ['name', 'rate', 'description'],
        samples: [
          ['GST 5%', '5', '5% GST rate'],
          ['GST 12%', '12', '12% GST rate'],
          ['GST 18%', '18', '18% GST rate'],
        ],
      },
      'brand': {
        headers: ['name', 'code', 'description'],
        samples: [
          ['Samsung', 'SAM', 'Samsung Electronics'],
          ['Apple', 'APP', 'Apple Inc.'],
          ['OnePlus', 'OPL', 'OnePlus Technology'],
        ],
      },
      'model': {
        headers: ['name', 'code', 'brandId', 'description'],
        samples: [
          ['iPhone 15', 'IP15', '', 'Latest iPhone model'],
          ['Galaxy S24', 'GS24', '', 'Latest Samsung Galaxy'],
          ['OnePlus 12', 'OP12', '', 'Latest OnePlus flagship'],
        ],
      },
      'fault': {
        headers: ['name', 'code', 'defaultPrice', 'level', 'technicianPoints', 'description'],
        samples: [
          ['Screen Replacement', 'SCR_REP', '1500', '3', '10', 'Screen replacement service'],
          ['Battery Replacement', 'BAT_REP', '800', '2', '5', 'Battery replacement service'],
          ['Software Update', 'SW_UPD', '300', '1', '2', 'Software update service'],
        ],
      },
      'payment-method': {
        headers: ['name', 'code', 'description'],
        samples: [
          ['Cash', 'CASH', 'Cash payment'],
          ['UPI', 'UPI', 'UPI payment'],
          ['Card', 'CARD', 'Card payment'],
        ],
      },
      'expense-category': {
        headers: ['name', 'code', 'description'],
        samples: [
          ['Rent', 'RENT', 'Office rent expense'],
          ['Utilities', 'UTIL', 'Electricity and water bills'],
          ['Salaries', 'SAL', 'Employee salary payments'],
        ],
      },
      'service-issue': {
        headers: ['name', 'description'],
        samples: [
          ['Screen Cracked', 'Display glass or screen is cracked or shattered'],
          ['Battery Draining Fast', 'Battery discharges quickly, poor battery life'],
          ['Not Charging', 'Device not charging when connected to charger'],
        ],
      },
    };

    const template = templates[type];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([template.headers, ...template.samples]);

    // Set column widths
    const colWidths = template.headers.map((h, i) => {
      if (h === 'description') return { wch: 40 };
      if (h === 'name') return { wch: 25 };
      return { wch: 15 };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${type}-template-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            Import {type === 'category' ? 'Categories' :
             type === 'unit' ? 'Units' :
             type === 'gst-rate' ? 'GST Rates' :
             type === 'brand' ? 'Brands' :
             type === 'model' ? 'Models' :
             type === 'fault' ? 'Faults' :
             type === 'payment-method' ? 'Payment Methods' :
             type === 'expense-category' ? 'Expense Categories' :
             type === 'service-issue' ? 'Damage Conditions' :
             'Accessories'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Download Template */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">Download Template</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Download the template file with the correct format and fill it with your data
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={downloadExcelTemplate}
                    className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Excel
                  </button>
                  <button
                    onClick={downloadTemplate}
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File (CSV or Excel)
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name}
              </p>
            )}
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Preview (first 5 rows)</h4>
              <div className="border border-gray-200 rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(preview[0]).map((key) => (
                        <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {preview.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value: any, i) => (
                          <td key={i} className="px-4 py-2 whitespace-nowrap text-gray-900">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || isProcessing}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
