import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { itemsApi } from '@/services/itemsApi';
import { categoryApi, unitApi, gstRateApi, brandApi, modelApi } from '@/services/masterDataApi';
import { X, Upload, Download, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ItemFormData, TaxType } from '@/types';
import * as XLSX from 'xlsx';

interface ImportItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedItem extends ItemFormData {
  row: number;
  errors: string[];
}

export default function ImportItemsModal({ isOpen, onClose }: ImportItemsModalProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch master data for validation
  const { data: categories } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoryApi.getAll({ limit: 1000, isActive: true }),
  });

  const { data: brands } = useQuery({
    queryKey: ['brands-all'],
    queryFn: () => brandApi.getAll({ limit: 1000, isActive: true }),
  });

  const { data: units } = useQuery({
    queryKey: ['units-all'],
    queryFn: () => unitApi.getAll({ limit: 1000, isActive: true }),
  });

  const { data: gstRates } = useQuery({
    queryKey: ['gst-rates-all'],
    queryFn: () => gstRateApi.getAll({ limit: 1000, isActive: true }),
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (items: ItemFormData[]) => {
      const results = await Promise.allSettled(
        items.map((item) => itemsApi.createItem(item))
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const downloadSampleCSV = () => {
    const headers = [
      'Item Name*',
      'Item Code',
      'Barcode',
      'Description',
      'Model Variant',
      'Brand',
      'Model',
      'Category',
      'Unit',
      'Purchase Price',
      'Sales Price',
      'HSN Code',
      'GST Rate (%)',
      'Tax Type'
    ];

    const sampleData = [
      [
        'iPhone 15 Pro',
        'IP15P',
        '1234567890123',
        'Latest iPhone model',
        '256GB',
        'Apple',
        'iPhone 15',
        'Mobile Phones',
        'Piece',
        '80000',
        '95000',
        '85171200',
        '18',
        'CGST_SGST'
      ],
      [
        'Samsung Galaxy S24',
        'SGS24',
        '9876543210123',
        'Flagship Samsung phone',
        '512GB',
        'Samsung',
        'Galaxy S24',
        'Mobile Phones',
        'Piece',
        '75000',
        '88000',
        '85171200',
        '18',
        'CGST_SGST'
      ],
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `items_import_sample_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const downloadSampleExcel = () => {
    const headers = [
      'Item Name*',
      'Item Code',
      'Barcode',
      'Description',
      'Model Variant',
      'Brand',
      'Model',
      'Category',
      'Unit',
      'Purchase Price',
      'Sales Price',
      'HSN Code',
      'GST Rate (%)',
      'Tax Type'
    ];

    const sampleData = [
      [
        'iPhone 15 Pro',
        'IP15P',
        '1234567890123',
        'Latest iPhone model',
        '256GB',
        'Apple',
        'iPhone 15',
        'Mobile Phones',
        'Piece',
        80000,
        95000,
        '85171200',
        18,
        'CGST_SGST'
      ],
      [
        'Samsung Galaxy S24',
        'SGS24',
        '9876543210123',
        'Flagship Samsung phone',
        '512GB',
        'Samsung',
        'Galaxy S24',
        'Mobile Phones',
        'Piece',
        75000,
        88000,
        '85171200',
        18,
        'CGST_SGST'
      ],
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Item Name
      { wch: 12 }, // Item Code
      { wch: 15 }, // Barcode
      { wch: 25 }, // Description
      { wch: 15 }, // Model Variant
      { wch: 15 }, // Brand
      { wch: 15 }, // Model
      { wch: 15 }, // Category
      { wch: 10 }, // Unit
      { wch: 15 }, // Purchase Price
      { wch: 15 }, // Sales Price
      { wch: 12 }, // HSN Code
      { wch: 12 }, // GST Rate
      { wch: 12 }, // Tax Type
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Items');
    XLSX.writeFile(wb, `items_import_sample_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const parseCSV = (content: string): ParsedItem[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const items: ParsedItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const errors: string[] = [];

      // Parse item data
      const itemName = values[0];
      if (!itemName) {
        errors.push('Item Name is required');
      }

      const brandName = values[5];
      const brandId = brands?.data.find(
        b => b.name.toLowerCase() === brandName?.toLowerCase()
      )?.id;

      const categoryName = values[7];
      const categoryId = categories?.data.find(
        c => c.name.toLowerCase() === categoryName?.toLowerCase()
      )?.id;

      const unitName = values[8];
      const unitId = units?.data.find(
        u => u.name.toLowerCase() === unitName?.toLowerCase()
      )?.id;

      const gstRateValue = values[12];
      const gstRateId = gstRates?.data.find(
        g => g.rate.toString() === gstRateValue
      )?.id;

      const item: ParsedItem = {
        row: i + 1,
        errors,
        itemName: itemName || '',
        itemCode: values[1] || undefined,
        barcode: values[2] || undefined,
        description: values[3] || undefined,
        modelVariant: values[4] || undefined,
        brandId: brandId || undefined,
        categoryId: categoryId || undefined,
        unitId: unitId || undefined,
        purchasePrice: values[9] ? parseFloat(values[9]) : undefined,
        salesPrice: values[10] ? parseFloat(values[10]) : undefined,
        hsnCode: values[11] || undefined,
        gstRateId: gstRateId || undefined,
        taxType: values[13] === 'IGST' ? TaxType.IGST : TaxType.CGST_SGST,
      };

      if (brandName && !brandId) {
        errors.push(`Brand "${brandName}" not found`);
      }
      if (categoryName && !categoryId) {
        errors.push(`Category "${categoryName}" not found`);
      }
      if (unitName && !unitId) {
        errors.push(`Unit "${unitName}" not found`);
      }

      items.push(item);
    }

    return items;
  };

  const parseExcel = (file: File): Promise<ParsedItem[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });

          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          if (jsonData.length < 2) {
            resolve([]);
            return;
          }

          const items: ParsedItem[] = [];

          // Skip header row (index 0)
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const errors: string[] = [];

            // Parse item data (same structure as CSV)
            const itemName = row[0]?.toString() || '';
            if (!itemName) {
              errors.push('Item Name is required');
            }

            const brandName = row[5]?.toString() || '';
            const brandId = brands?.data.find(
              b => b.name.toLowerCase() === brandName?.toLowerCase()
            )?.id;

            const categoryName = row[7]?.toString() || '';
            const categoryId = categories?.data.find(
              c => c.name.toLowerCase() === categoryName?.toLowerCase()
            )?.id;

            const unitName = row[8]?.toString() || '';
            const unitId = units?.data.find(
              u => u.name.toLowerCase() === unitName?.toLowerCase()
            )?.id;

            const gstRateValue = row[12]?.toString() || '';
            const gstRateId = gstRates?.data.find(
              g => g.rate.toString() === gstRateValue
            )?.id;

            const item: ParsedItem = {
              row: i + 1,
              errors,
              itemName: itemName || '',
              itemCode: row[1]?.toString() || undefined,
              barcode: row[2]?.toString() || undefined,
              description: row[3]?.toString() || undefined,
              modelVariant: row[4]?.toString() || undefined,
              brandId: brandId || undefined,
              categoryId: categoryId || undefined,
              unitId: unitId || undefined,
              purchasePrice: row[9] ? parseFloat(row[9].toString()) : undefined,
              salesPrice: row[10] ? parseFloat(row[10].toString()) : undefined,
              hsnCode: row[11]?.toString() || undefined,
              gstRateId: gstRateId || undefined,
              taxType: row[13]?.toString() === 'IGST' ? TaxType.IGST : TaxType.CGST_SGST,
            };

            if (brandName && !brandId) {
              errors.push(`Brand "${brandName}" not found`);
            }
            if (categoryName && !categoryId) {
              errors.push(`Category "${categoryName}" not found`);
            }
            if (unitName && !unitId) {
              errors.push(`Unit "${unitName}" not found`);
            }

            items.push(item);
          }

          resolve(items);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsBinaryString(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const isCSV = selectedFile.name.endsWith('.csv');
    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');

    if (!isCSV && !isExcel) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      if (isCSV) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          const parsed = parseCSV(content);
          setParsedItems(parsed);
          setIsProcessing(false);
        };
        reader.readAsText(selectedFile);
      } else if (isExcel) {
        const parsed = await parseExcel(selectedFile);
        setParsedItems(parsed);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Error parsing file. Please check the file format.');
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    const validItems = parsedItems.filter(item => item.errors.length === 0);

    if (validItems.length === 0) {
      toast.error('No valid items to import');
      return;
    }

    if (!window.confirm(`Import ${validItems.length} items?`)) {
      return;
    }

    setIsProcessing(true);
    const results = await importMutation.mutateAsync(validItems);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.filter(r => r.status === 'rejected').length;

    if (failedCount > 0) {
      toast.info(`Import completed with mixed results. Success: ${successCount}, Failed: ${failedCount}`);
    } else {
      toast.success(`Successfully imported ${successCount} items`);
    }

    if (successCount > 0) {
      onClose();
    }
    setIsProcessing(false);
  };

  const validItemsCount = parsedItems.filter(item => item.errors.length === 0).length;
  const invalidItemsCount = parsedItems.length - validItemsCount;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Import Items</h2>
            <p className="text-sm text-gray-600 mt-1">Upload a CSV or Excel file to bulk import items</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isProcessing}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Download Sample */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Need a template?</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Download our sample file to see the correct format
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={downloadSampleCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Download className="h-4 w-4" />
                    Download CSV
                  </button>
                  <button
                    onClick={downloadSampleExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Download className="h-4 w-4" />
                    Download Excel
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV or Excel File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={isProcessing}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-12 w-12 text-gray-400 mb-3" />
                <span className="text-sm font-medium text-gray-700">
                  Click to upload CSV or Excel file
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Supports .csv, .xlsx formats
                </span>
              </label>
            </div>
            {file && (
              <p className="text-sm text-gray-600 mt-2">
                Selected file: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </div>

          {/* Preview */}
          {parsedItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Preview</h3>
                <div className="flex gap-3 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {validItemsCount} Valid
                  </span>
                  {invalidItemsCount > 0 && (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {invalidItemsCount} Invalid
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Row</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Brand</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Sales Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {parsedItems.map((item, idx) => (
                        <tr key={idx} className={item.errors.length > 0 ? 'bg-red-50' : ''}>
                          <td className="px-4 py-2 text-sm">{item.row}</td>
                          <td className="px-4 py-2 text-sm font-medium">{item.itemName || '-'}</td>
                          <td className="px-4 py-2 text-sm">
                            {item.categoryId ? categories?.data.find(c => c.id === item.categoryId)?.name : '-'}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {item.brandId ? brands?.data.find(b => b.id === item.brandId)?.name : '-'}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {item.salesPrice ? `₹${item.salesPrice}` : '-'}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {item.errors.length === 0 ? (
                              <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Valid
                              </span>
                            ) : (
                              <div className="text-red-600">
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="h-4 w-4" />
                                  Invalid
                                </div>
                                <div className="text-xs mt-1">
                                  {item.errors.map((err, i) => (
                                    <div key={i}>• {err}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isProcessing || validItemsCount === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import {validItemsCount} Items
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
