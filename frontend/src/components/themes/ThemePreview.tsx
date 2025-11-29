import { FileText, Maximize2, X } from 'lucide-react';

interface ThemePreviewProps {
  theme: {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    headerBackgroundColor: string;
    headerTextColor: string;
    fontFamily: string;
    fontSize: number;
    showBranchInfo: boolean;
    showTermsAndConditions: boolean;
    termsAndConditions?: string;
    footerText?: string;
  };
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export default function ThemePreview({ theme, isFullScreen, onToggleFullScreen }: ThemePreviewProps) {
  // Mock invoice data for preview
  const mockInvoice = {
    invoiceNumber: 'INV-2025-001',
    date: new Date().toLocaleDateString(),
    customerName: 'John Doe',
    customerPhone: '+91 98765 43210',
    items: [
      { name: 'iPhone 13 Screen Replacement', qty: 1, price: 8500, total: 8500 },
      { name: 'Battery Replacement', qty: 1, price: 2500, total: 2500 },
      { name: 'Back Cover', qty: 1, price: 1200, total: 1200 },
    ],
    subtotal: 12200,
    tax: 2196,
    total: 14396,
  };

  const fontFamilyMap: { [key: string]: string } = {
    'Helvetica': 'Arial, sans-serif',
    'Times-Roman': 'Times New Roman, serif',
    'Courier': 'Courier New, monospace',
  };

  const cssFont = fontFamilyMap[theme.fontFamily] || 'Arial, sans-serif';

  const previewContent = (
    <>
      <div className="p-4">

        {/* PDF Preview Container */}
        <div
          className="bg-white shadow-lg"
          style={{
            fontFamily: cssFont,
            fontSize: `${theme.fontSize}pt`,
            minHeight: '800px',
          }}
        >
          {/* Header */}
          <div
            className="px-8 py-6"
            style={{
              backgroundColor: theme.headerBackgroundColor,
              color: theme.headerTextColor,
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h1
                  className="text-3xl font-bold mb-2"
                  style={{ color: theme.headerTextColor }}
                >
                  INVOICE
                </h1>
                {theme.showBranchInfo && (
                  <div className="text-sm opacity-90">
                    <p className="font-semibold">DeenMobiles Service Center</p>
                    <p>123 Main Street, Chennai - 600001</p>
                    <p>Phone: +91 98765 43210</p>
                    <p>Email: info@deenmobiles.com</p>
                    <p>GST: 33XXXXX1234X1ZX</p>
                  </div>
                )}
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold">Invoice #: {mockInvoice.invoiceNumber}</p>
                <p>Date: {mockInvoice.date}</p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="px-8 py-6">
            <div
              className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3"
              style={{
                backgroundColor: `${theme.primaryColor}20`,
                color: theme.primaryColor,
              }}
            >
              Bill To
            </div>
            <div className="text-sm">
              <p className="font-semibold">{mockInvoice.customerName}</p>
              <p>Phone: {mockInvoice.customerPhone}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-8 pb-6">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    backgroundColor: `${theme.primaryColor}15`,
                    borderBottom: `2px solid ${theme.primaryColor}`,
                  }}
                >
                  <th className="text-left py-3 px-3 font-semibold">Item / Service</th>
                  <th className="text-center py-3 px-3 font-semibold">Qty</th>
                  <th className="text-right py-3 px-3 font-semibold">Price</th>
                  <th className="text-right py-3 px-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {mockInvoice.items.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200"
                  >
                    <td className="py-3 px-3">{item.name}</td>
                    <td className="text-center py-3 px-3">{item.qty}</td>
                    <td className="text-right py-3 px-3">₹{item.price.toLocaleString()}</td>
                    <td className="text-right py-3 px-3">₹{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span>Subtotal:</span>
                  <span>₹{mockInvoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span>Tax (18%):</span>
                  <span>₹{mockInvoice.tax.toLocaleString()}</span>
                </div>
                <div
                  className="flex justify-between py-3 font-bold text-lg"
                  style={{
                    backgroundColor: `${theme.secondaryColor}15`,
                    color: theme.primaryColor,
                    padding: '12px',
                    marginTop: '8px',
                    borderRadius: '4px',
                  }}
                >
                  <span>Total:</span>
                  <span>₹{mockInvoice.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          {theme.showTermsAndConditions && theme.termsAndConditions && (
            <div
              className="px-8 py-6 mt-6"
              style={{
                backgroundColor: '#f9fafb',
                borderTop: `2px solid ${theme.secondaryColor}`,
              }}
            >
              <h3
                className="font-semibold mb-2 text-sm"
                style={{ color: theme.primaryColor }}
              >
                Terms and Conditions
              </h3>
              <p className="text-xs leading-relaxed whitespace-pre-wrap">
                {theme.termsAndConditions}
              </p>
            </div>
          )}

          {/* Footer */}
          {theme.footerText && (
            <div
              className="px-8 py-4 text-center text-sm"
              style={{
                backgroundColor: `${theme.primaryColor}10`,
                color: theme.primaryColor,
              }}
            >
              <p>{theme.footerText}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Full-screen overlay
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-95 flex items-center justify-center">
        <div className="w-full h-full flex flex-col bg-gray-100">
          {/* Full-screen header */}
          <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <FileText className="w-5 h-5" />
              <span className="text-lg">Full Screen Preview</span>
            </div>
            <button
              onClick={onToggleFullScreen}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Exit full screen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Full-screen content */}
          <div className="flex-1 overflow-auto">
            {previewContent}
          </div>
        </div>
      </div>
    );
  }

  // Normal split-screen view
  return (
    <div className="w-full h-full bg-gray-100 overflow-auto">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between text-sm text-gray-700 font-medium shadow-sm z-10">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span>Live Preview</span>
        </div>
        <button
          onClick={onToggleFullScreen}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          aria-label="Full screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
      {previewContent}
    </div>
  );
}
