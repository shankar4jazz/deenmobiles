import {
  InventoryCategory,
  Unit,
  GSTRate,
  TaxType,
  StockMovementType,
} from '../types';

export const INVENTORY_CATEGORIES = [
  { value: InventoryCategory.ELECTRICAL, label: 'Electrical' },
  { value: InventoryCategory.MECHANICAL, label: 'Mechanical' },
  { value: InventoryCategory.DISPLAY, label: 'Display' },
  { value: InventoryCategory.BATTERY, label: 'Battery' },
  { value: InventoryCategory.ACCESSORY, label: 'Accessory' },
  { value: InventoryCategory.CHARGER, label: 'Charger' },
  { value: InventoryCategory.CABLE, label: 'Cable' },
  { value: InventoryCategory.CASE_COVER, label: 'Case/Cover' },
  { value: InventoryCategory.SCREEN_PROTECTOR, label: 'Screen Protector' },
  { value: InventoryCategory.AUDIO, label: 'Audio' },
  { value: InventoryCategory.CAMERA, label: 'Camera' },
  { value: InventoryCategory.OTHER, label: 'Other' },
];

export const UNITS = [
  { value: Unit.PIECE, label: 'Piece' },
  { value: Unit.METER, label: 'Meter' },
  { value: Unit.LITRE, label: 'Litre' },
  { value: Unit.KILOGRAM, label: 'Kilogram' },
  { value: Unit.BOX, label: 'Box' },
  { value: Unit.SET, label: 'Set' },
  { value: Unit.PAIR, label: 'Pair' },
  { value: Unit.ROLL, label: 'Roll' },
  { value: Unit.PACKET, label: 'Packet' },
];

export const GST_RATES = [
  { value: GSTRate.ZERO, label: '0%', percentage: 0 },
  { value: GSTRate.FIVE, label: '5%', percentage: 5 },
  { value: GSTRate.TWELVE, label: '12%', percentage: 12 },
  { value: GSTRate.EIGHTEEN, label: '18%', percentage: 18 },
  { value: GSTRate.TWENTY_EIGHT, label: '28%', percentage: 28 },
];

export const TAX_TYPES = [
  { value: TaxType.IGST, label: 'IGST (Interstate)' },
  { value: TaxType.CGST_SGST, label: 'CGST + SGST (Intrastate)' },
];

export const STOCK_MOVEMENT_TYPES = [
  { value: StockMovementType.PURCHASE, label: 'Purchase', color: 'green' },
  { value: StockMovementType.SALE, label: 'Sale', color: 'blue' },
  { value: StockMovementType.ADJUSTMENT, label: 'Adjustment', color: 'yellow' },
  { value: StockMovementType.TRANSFER, label: 'Transfer', color: 'purple' },
  { value: StockMovementType.SERVICE_USE, label: 'Service Use', color: 'cyan' },
  { value: StockMovementType.RETURN, label: 'Return', color: 'green' },
  { value: StockMovementType.DAMAGE, label: 'Damage', color: 'red' },
  { value: StockMovementType.OPENING_STOCK, label: 'Opening Stock', color: 'gray' },
];

export const STOCK_STATUS_OPTIONS = [
  { value: 'all', label: 'All Items' },
  { value: 'low', label: 'Low Stock' },
  { value: 'out', label: 'Out of Stock' },
];

/**
 * Get GST percentage from GSTRate enum
 */
export const getGSTPercentage = (gstRate: GSTRate): number => {
  const gstMap: Record<GSTRate, number> = {
    [GSTRate.ZERO]: 0,
    [GSTRate.FIVE]: 5,
    [GSTRate.TWELVE]: 12,
    [GSTRate.EIGHTEEN]: 18,
    [GSTRate.TWENTY_EIGHT]: 28,
  };
  return gstMap[gstRate] || 0;
};

/**
 * Calculate GST amount
 */
export const calculateGST = (
  price: number,
  gstRate: GSTRate
): {
  gstPercentage: number;
  gstAmount: number;
  totalWithGST: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
} => {
  const gstPercentage = getGSTPercentage(gstRate);
  const gstAmount = (price * gstPercentage) / 100;
  const totalWithGST = price + gstAmount;

  return {
    gstPercentage,
    gstAmount,
    totalWithGST,
    cgst: gstAmount / 2, // For CGST+SGST
    sgst: gstAmount / 2, // For CGST+SGST
    igst: gstAmount, // For IGST
  };
};

/**
 * Format currency to Indian Rupees
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Get category label from enum value
 */
export const getCategoryLabel = (category: InventoryCategory | undefined): string => {
  if (!category) return 'N/A';
  return INVENTORY_CATEGORIES.find((c) => c.value === category)?.label || category;
};

/**
 * Get unit label from enum value
 */
export const getUnitLabel = (unit: Unit): string => {
  return UNITS.find((u) => u.value === unit)?.label || unit;
};

/**
 * Get stock status color
 */
export const getStockStatusColor = (
  stockQuantity: number,
  minStockLevel?: number,
  reorderLevel?: number
): string => {
  if (stockQuantity <= 0) return 'red';
  if (minStockLevel && stockQuantity <= minStockLevel) return 'orange';
  if (reorderLevel && stockQuantity <= reorderLevel) return 'yellow';
  return 'green';
};

/**
 * Get stock status text
 */
export const getStockStatusText = (
  stockQuantity: number,
  minStockLevel?: number,
  reorderLevel?: number
): string => {
  if (stockQuantity <= 0) return 'Out of Stock';
  if (minStockLevel && stockQuantity <= minStockLevel) return 'Low Stock';
  if (reorderLevel && stockQuantity <= reorderLevel) return 'Reorder Level';
  return 'In Stock';
};

/**
 * Validate HSN code format (6 or 8 digits)
 */
export const validateHSNCode = (hsnCode: string): boolean => {
  const hsnRegex = /^[0-9]{6,8}$/;
  return hsnRegex.test(hsnCode);
};

/**
 * Validate GST number format
 */
export const validateGSTNumber = (gstNumber: string): boolean => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gstNumber);
};

/**
 * Validate PAN number format
 */
export const validatePANNumber = (panNumber: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(panNumber);
};

/**
 * Validate IFSC code format
 */
export const validateIFSCCode = (ifscCode: string): boolean => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifscCode);
};

/**
 * Validate 10-digit phone number
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate 6-digit pincode
 */
export const validatePincode = (pincode: string): boolean => {
  const pincodeRegex = /^[0-9]{6}$/;
  return pincodeRegex.test(pincode);
};
