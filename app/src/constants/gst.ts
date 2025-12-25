// Indian State Codes for Place of Supply
export const STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

// State code options for dropdowns
export const STATE_CODE_OPTIONS = Object.entries(STATE_CODES).map(([code, name]) => ({
  value: code,
  label: `${code} - ${name}`,
}));

// Unit Quantity Codes for HSN Summary
export const UQC_CODES: Record<string, string> = {
  'BAG': 'BAGS',
  'BAL': 'BALE',
  'BDL': 'BUNDLES',
  'BKL': 'BUCKLES',
  'BOU': 'BILLION OF UNITS',
  'BOX': 'BOX',
  'BTL': 'BOTTLES',
  'BUN': 'BUNCHES',
  'CAN': 'CANS',
  'CBM': 'CUBIC METERS',
  'CCM': 'CUBIC CENTIMETERS',
  'CMS': 'CENTIMETERS',
  'CTN': 'CARTONS',
  'DOZ': 'DOZENS',
  'DRM': 'DRUMS',
  'GGK': 'GREAT GROSS',
  'GMS': 'GRAMMES',
  'GRS': 'GROSS',
  'GYD': 'GROSS YARDS',
  'KGS': 'KILOGRAMS',
  'KLR': 'KILOLITRE',
  'KME': 'KILOMETRE',
  'LTR': 'LITRES',
  'MLT': 'MILILITRE',
  'MTR': 'METERS',
  'MTS': 'METRIC TON',
  'NOS': 'NUMBERS',
  'OTH': 'OTHERS',
  'PAC': 'PACKS',
  'PCS': 'PIECES',
  'PRS': 'PAIRS',
  'QTL': 'QUINTAL',
  'ROL': 'ROLLS',
  'SET': 'SETS',
  'SQF': 'SQUARE FEET',
  'SQM': 'SQUARE METERS',
  'SQY': 'SQUARE YARDS',
  'TBS': 'TABLETS',
  'TGM': 'TEN GROSS',
  'THD': 'THOUSANDS',
  'TON': 'TONNES',
  'TUB': 'TUBES',
  'UGS': 'US GALLONS',
  'UNT': 'UNITS',
  'YDS': 'YARDS',
};

// GST Rate options
export const GST_RATES = [0, 5, 12, 18, 28];

export const GST_RATE_OPTIONS = GST_RATES.map((rate) => ({
  value: rate,
  label: `${rate}%`,
}));

// Helper to get place of supply display
export const getPlaceOfSupplyDisplay = (stateCode: string): string => {
  const stateName = STATE_CODES[stateCode] || stateCode;
  return `${stateCode}-${stateName}`;
};

// GSTIN validation regex
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Validate GSTIN format
export const isValidGSTIN = (gstin: string): boolean => {
  return GSTIN_REGEX.test(gstin);
};

// Month names for GSTR1 filing period
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Get financial year
export const getFinancialYear = (month: number, year: number): string => {
  if (month >= 4) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }
  return `${year - 1}-${year.toString().slice(-2)}`;
};

// Get filing period display
export const getFilingPeriod = (month: number, year: number): string => {
  return `${MONTH_NAMES[month - 1]} ${year}`;
};
