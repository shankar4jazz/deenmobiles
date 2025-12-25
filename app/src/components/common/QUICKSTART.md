# DataTable Quick Start Guide

Get your data table up and running in 5 minutes!

## Step 1: Create Column Definitions (2 minutes)

Create a `columns.tsx` file next to your list component:

```tsx
// src/pages/products/columns.tsx
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Product } from '@/services/productApi';
import { formatCurrency, formatDate, getStatusBadgeStyles, createSelectionColumn } from '@/utils/tableUtils';

export const createProductColumns = (
  onView: (product: Product) => void,
  onEdit: (product: Product) => void,
  onDelete: (product: Product) => void
): ColumnDef<Product>[] => [
  // 1. Add selection column (checkboxes)
  createSelectionColumn<Product>(),

  // 2. Add your data columns
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Product Name',
    cell: ({ row }) => (
      <div className="font-medium text-gray-900">{row.original.name}</div>
    ),
    enableSorting: true,
    enableHiding: false, // Cannot be hidden
  },
  {
    id: 'price',
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => formatCurrency(row.original.price),
    enableSorting: true,
  },
  {
    id: 'stock',
    accessorKey: 'stock',
    header: 'Stock',
    cell: ({ row }) => (
      <div className="text-sm text-gray-900">{row.original.stock} units</div>
    ),
    enableSorting: true,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <span className={getStatusBadgeStyles(row.original.status)}>
        {row.original.status}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => formatDate(row.original.createdAt),
    enableSorting: true,
    enableHiding: true, // Can be hidden
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onView(row.original)}
          className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
          title="View"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={() => onEdit(row.original)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(row.original)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
```

## Step 2: Use DataTable in Your Component (3 minutes)

```tsx
// src/pages/products/ProductList.tsx
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { productApi } from '@/services/productApi';
import { FileText, Plus, Download, Trash2 } from 'lucide-react';
import DataTable from '@/components/common/DataTable';
import { createProductColumns } from './columns';
import { BulkAction } from '@/types/table';

export default function ProductList() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch data
  const { data, isLoading } = useQuery({
    queryKey: ['products', currentPage],
    queryFn: () => productApi.getAll({ page: currentPage, limit: 20 }),
  });

  // Action handlers
  const handleView = (product) => {
    navigate(`/products/${product.id}`);
  };

  const handleEdit = (product) => {
    navigate(`/products/${product.id}/edit`);
  };

  const handleDelete = (product) => {
    if (confirm('Delete this product?')) {
      // Call delete API
    }
  };

  // Column definitions
  const columns = useMemo(
    () => createProductColumns(handleView, handleEdit, handleDelete),
    []
  );

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      id: 'export',
      label: 'Export',
      icon: <Download className="h-4 w-4" />,
      onClick: (selectedRows) => {
        console.log('Exporting:', selectedRows);
        // Implement export logic
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'danger',
      onClick: (selectedRows) => {
        if (confirm(`Delete ${selectedRows.length} products?`)) {
          // Implement bulk delete
        }
      },
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7" />
            Products
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your products</p>
        </div>
        <button
          onClick={() => navigate('/products/new')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPageChange={setCurrentPage}
        enableRowSelection={true}
        enableSorting={true}
        enableColumnVisibility={true}
        enableColumnResizing={true}
        bulkActions={bulkActions}
        columnVisibilityKey="product-columns"
        onRowClick={handleView}
        emptyState={{
          icon: <FileText className="w-12 h-12 text-gray-300" />,
          title: 'No products found',
          description: 'Get started by adding your first product',
          action: {
            label: 'Add Product',
            onClick: () => navigate('/products/new'),
          },
        }}
      />
    </div>
  );
}
```

## Done! 🎉

Your table now has:
- ✅ Sorting
- ✅ Column visibility
- ✅ Column resizing
- ✅ Row selection
- ✅ Bulk actions
- ✅ Pagination
- ✅ Empty states

## Common Customizations

### Disable Features

```tsx
<DataTable
  enableRowSelection={false}  // No checkboxes
  enableSorting={false}        // No sorting
  enableColumnVisibility={false} // No column menu
  enableColumnResizing={false}   // No resizing
/>
```

### Custom Empty State

```tsx
emptyState={{
  icon: <SearchIcon />,
  title: 'No results found',
  description: 'Try adjusting your search terms',
  // No action button
}}
```

### Different Page Size

Just change the `limit` in your API call - the component adapts automatically.

## Tips

1. **Use `useMemo`** for columns to prevent recreation
2. **Stop propagation** in action buttons: `onClick={(e) => e.stopPropagation()}`
3. **Unique column IDs** - Use descriptive IDs for each column
4. **Enable hiding** only for less important columns
5. **Disable sorting** on action columns

## Need Help?

- See [README.md](./README.md) for detailed docs
- Check [invoices example](../../pages/invoices/) for reference
- Use TypeScript autocomplete for prop suggestions
