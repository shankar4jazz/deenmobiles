# DataTable Component Documentation

A fully-featured, reusable data table component built with TanStack Table v8 for React applications.

## Features

- ✅ **Column Sorting** - Click column headers to sort data (ascending/descending/none)
- ✅ **Column Visibility** - Show/hide columns with a dropdown menu
- ✅ **Column Resizing** - Drag column borders to adjust widths
- ✅ **Row Selection** - Multi-select rows with checkboxes
- ✅ **Bulk Actions** - Perform actions on multiple selected rows
- ✅ **Pagination** - Built-in pagination with customizable page size
- ✅ **Loading States** - Elegant loading spinner
- ✅ **Empty States** - Customizable empty state with icon and CTA
- ✅ **LocalStorage Persistence** - Column visibility preferences saved
- ✅ **Fully Typed** - Complete TypeScript support
- ✅ **Responsive** - Works on all screen sizes

## Installation

The following dependencies are required:

```bash
npm install @tanstack/react-table
```

## Basic Usage

### 1. Define Your Column Definitions

Create a file for your column definitions (e.g., `columns.tsx`):

```tsx
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency, formatDate, getStatusBadgeStyles } from '@/utils/tableUtils';

export interface Product {
  id: string;
  name: string;
  price: number;
  status: string;
  createdAt: string;
}

export const productColumns: ColumnDef<Product>[] = [
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
    id: 'date',
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => formatDate(row.original.createdAt),
    enableSorting: true,
    enableHiding: true, // Can be hidden
  },
];
```

### 2. Use DataTable in Your Component

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DataTable from '@/components/common/DataTable';
import { productColumns } from './columns';
import { BulkAction } from '@/types/table';

export default function ProductList() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['products', currentPage],
    queryFn: () => fetchProducts({ page: currentPage, limit: 20 }),
  });

  const handleRowClick = (product) => {
    console.log('Clicked:', product);
  };

  const bulkActions: BulkAction[] = [
    {
      id: 'delete',
      label: 'Delete',
      icon: <TrashIcon />,
      variant: 'danger',
      onClick: (selectedRows) => {
        console.log('Deleting:', selectedRows);
      },
    },
  ];

  return (
    <DataTable
      columns={productColumns}
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
      onRowClick={handleRowClick}
      emptyState={{
        icon: <BoxIcon />,
        title: 'No products found',
        description: 'Get started by adding your first product',
        action: {
          label: 'Add Product',
          onClick: () => navigate('/products/new'),
        },
      }}
    />
  );
}
```

## Props Reference

### DataTable Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `columns` | `ColumnDef<TData>[]` | ✅ | - | Column definitions for the table |
| `data` | `TData[]` | ✅ | - | Array of data to display |
| `isLoading` | `boolean` | ❌ | `false` | Show loading spinner |
| `pagination` | `PaginationState` | ❌ | - | Pagination configuration |
| `onPageChange` | `(page: number) => void` | ❌ | - | Callback when page changes |
| `emptyState` | `EmptyStateConfig` | ❌ | - | Empty state configuration |
| `enableRowSelection` | `boolean` | ❌ | `false` | Enable row selection checkboxes |
| `enableSorting` | `boolean` | ❌ | `true` | Enable column sorting |
| `enableColumnVisibility` | `boolean` | ❌ | `true` | Enable column visibility toggle |
| `enableColumnResizing` | `boolean` | ❌ | `true` | Enable column resizing |
| `bulkActions` | `BulkAction[]` | ❌ | `[]` | Actions to show when rows selected |
| `columnVisibilityKey` | `string` | ❌ | - | LocalStorage key for persistence |
| `onRowClick` | `(row: TData) => void` | ❌ | - | Callback when row is clicked |
| `initialSorting` | `SortingState` | ❌ | `[]` | Initial sort configuration |
| `onSortingChange` | `(sorting: SortingState) => void` | ❌ | - | Callback when sorting changes |
| `className` | `string` | ❌ | `''` | Additional CSS classes |

## Advanced Usage

### With Row Selection

```tsx
import { createSelectionColumn } from '@/utils/tableUtils';

export const columns = [
  createSelectionColumn<Product>(), // Adds checkbox column
  // ... other columns
];
```

### With Server-Side Sorting

```tsx
const [sorting, setSorting] = useState<SortingState>([]);

const { data } = useQuery({
  queryKey: ['products', currentPage, sorting],
  queryFn: () => fetchProducts({
    page: currentPage,
    sortBy: sorting[0]?.id,
    sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
  }),
});

<DataTable
  columns={columns}
  data={data?.data || []}
  initialSorting={sorting}
  onSortingChange={setSorting}
  // ... other props
/>
```

### Custom Cell Rendering

```tsx
{
  id: 'actions',
  header: 'Actions',
  cell: ({ row }) => (
    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => handleEdit(row.original)}>Edit</button>
      <button onClick={() => handleDelete(row.original)}>Delete</button>
    </div>
  ),
  enableSorting: false,
  enableHiding: false,
}
```

### Conditional Bulk Actions

```tsx
const bulkActions: BulkAction[] = [
  {
    id: 'export',
    label: 'Export',
    icon: <DownloadIcon />,
    onClick: (selectedRows) => exportData(selectedRows),
    isDisabled: (selectedRows) => selectedRows.length === 0,
  },
  {
    id: 'archive',
    label: 'Archive',
    onClick: (selectedRows) => archiveItems(selectedRows),
    isDisabled: (selectedRows) =>
      selectedRows.some(row => row.status === 'ARCHIVED'),
  },
];
```

## Utility Functions

### Available in `tableUtils.tsx`:

- `formatCurrency(amount: number)` - Format numbers as INR currency
- `formatDate(date: string, format?: string)` - Format dates with date-fns
- `getSortIcon(column)` - Get sort indicator icon
- `getStatusBadgeStyles(status)` - Get status badge CSS classes
- `truncateText(text, maxLength)` - Truncate long text
- `saveColumnVisibility(key, visibility)` - Save to localStorage
- `loadColumnVisibility(key)` - Load from localStorage
- `getRowClassName(isSelected, isClickable)` - Get row CSS classes
- `createSelectionColumn<T>()` - Create selection checkbox column

## Styling

The component uses Tailwind CSS classes. Key color scheme:

- **Primary**: `purple-600`, `purple-700` (buttons, accents)
- **Backgrounds**: `gray-50`, `white`
- **Borders**: `gray-200`, `gray-300`
- **Text**: `gray-900`, `gray-700`, `gray-500`
- **Selection**: `purple-100` (selected rows)

### Customizing Styles

You can override styles by passing a `className` prop or by customizing Tailwind theme.

## Accessibility

The component includes:

- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Proper focus states
- ✅ Semantic HTML structure

## Performance Tips

1. **Use `useMemo` for columns** - Prevent recreation on every render:
   ```tsx
   const columns = useMemo(() => createColumns(), []);
   ```

2. **Enable pagination** - Don't load all data at once

3. **Use column visibility** - Hide less important columns on mobile

4. **Debounce search inputs** - Reduce API calls during search

5. **Use virtual scrolling** - For very large datasets (requires additional setup)

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions

## Migration Guide

### From Native HTML Table

Before:
```tsx
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody>
    {data.map(item => (
      <tr key={item.id}>
        <td>{item.name}</td>
        <td>{item.email}</td>
      </tr>
    ))}
  </tbody>
</table>
```

After:
```tsx
const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
];

<DataTable columns={columns} data={data} />
```

## Examples

Check out these examples in the codebase:

- **Invoices List**: `src/pages/invoices/InvoiceList.tsx`
- **Invoice Columns**: `src/pages/invoices/columns.tsx`

## Troubleshooting

### Issue: Columns not sorting
- Ensure `enableSorting: true` in column definition
- Check that `enableSorting` prop is true on DataTable

### Issue: Column visibility not persisting
- Provide a unique `columnVisibilityKey` prop
- Check browser localStorage is enabled

### Issue: Bulk actions not working
- Ensure `enableRowSelection: true`
- Check that bulk action `onClick` handlers are defined

### Issue: Performance issues with large datasets
- Enable pagination
- Use server-side sorting
- Consider virtual scrolling

## License

MIT

## Contributing

Feel free to extend this component for your needs! Some ideas:

- Add export to CSV/Excel functionality
- Implement global filtering
- Add column groups
- Add expandable rows
- Implement virtual scrolling
