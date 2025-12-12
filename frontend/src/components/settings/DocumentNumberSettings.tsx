import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Hash, Save, RotateCcw } from 'lucide-react';
import {
  documentNumberApi,
  DocumentType,
  SequenceResetFrequency,
  DocumentNumberFormat,
  UpdateFormatData,
} from '@/services/documentNumberApi';

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.JOB_SHEET]: 'Job Sheet',
  [DocumentType.INVOICE]: 'Invoice',
  [DocumentType.ESTIMATE]: 'Estimate',
  [DocumentType.SERVICE_TICKET]: 'Service Ticket',
};

const RESET_FREQUENCY_LABELS: Record<SequenceResetFrequency, string> = {
  [SequenceResetFrequency.NEVER]: 'Never (Continuous)',
  [SequenceResetFrequency.DAILY]: 'Daily',
  [SequenceResetFrequency.MONTHLY]: 'Monthly',
  [SequenceResetFrequency.YEARLY]: 'Yearly',
};

interface FormData {
  prefix: string;
  separator: string;
  sequenceResetFrequency: SequenceResetFrequency;
  sequenceLength: number;
  includeBranch: boolean;
  branchFormat: string;
  includeYear: boolean;
  yearFormat: string;
  includeMonth: boolean;
  includeDay: boolean;
}

const DEFAULT_FORM_DATA: FormData = {
  prefix: 'JS',
  separator: '-',
  sequenceResetFrequency: SequenceResetFrequency.YEARLY,
  sequenceLength: 3,
  includeBranch: true,
  branchFormat: 'CODE',
  includeYear: true,
  yearFormat: 'FULL',
  includeMonth: false,
  includeDay: false,
};

export default function DocumentNumberSettings() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<DocumentType>(DocumentType.JOB_SHEET);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [preview, setPreview] = useState<string>('');

  // Fetch formats
  const { data: formats, isLoading } = useQuery({
    queryKey: ['document-number-formats'],
    queryFn: documentNumberApi.getAllFormats,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateFormatData) =>
      documentNumberApi.updateFormat(selectedType, data),
    onSuccess: () => {
      toast.success('Format saved successfully');
      queryClient.invalidateQueries({ queryKey: ['document-number-formats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save format');
    },
  });

  // Load format when type changes
  useEffect(() => {
    const format = formats?.find((f) => f.documentType === selectedType);
    if (format) {
      setFormData({
        prefix: format.prefix,
        separator: format.separator,
        sequenceResetFrequency: format.sequenceResetFrequency,
        sequenceLength: format.sequenceLength,
        includeBranch: format.includeBranch,
        branchFormat: format.branchFormat,
        includeYear: format.includeYear,
        yearFormat: format.yearFormat,
        includeMonth: format.includeMonth,
        includeDay: format.includeDay,
      });
    } else {
      // Set defaults based on document type
      const defaultPrefix =
        selectedType === DocumentType.JOB_SHEET
          ? 'JS'
          : selectedType === DocumentType.INVOICE
          ? 'INV'
          : selectedType === DocumentType.ESTIMATE
          ? 'EST'
          : 'TKT';
      setFormData({ ...DEFAULT_FORM_DATA, prefix: defaultPrefix });
    }
  }, [selectedType, formats]);

  // Update preview when form changes
  useEffect(() => {
    const generatePreview = () => {
      const now = new Date();
      const year =
        formData.yearFormat === 'FULL'
          ? now.getFullYear().toString()
          : now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');

      const parts: string[] = [formData.prefix];

      if (formData.includeBranch) {
        parts.push('DS1'); // Sample branch code
      }

      if (formData.includeYear) {
        parts.push(year);
      }

      if (formData.includeMonth) {
        parts.push(month);
      }

      if (formData.includeDay) {
        parts.push(day);
      }

      parts.push('1'.padStart(formData.sequenceLength, '0'));

      setPreview(parts.join(formData.separator));
    };

    generatePreview();
  }, [formData]);

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleReset = () => {
    const defaultPrefix =
      selectedType === DocumentType.JOB_SHEET
        ? 'JS'
        : selectedType === DocumentType.INVOICE
        ? 'INV'
        : selectedType === DocumentType.ESTIMATE
        ? 'EST'
        : 'TKT';
    setFormData({ ...DEFAULT_FORM_DATA, prefix: defaultPrefix });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Type Selector */}
      <div className="flex flex-wrap gap-2">
        {Object.values(DocumentType).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedType === type
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {DOCUMENT_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Hash className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-purple-900">Preview</span>
        </div>
        <div className="text-3xl font-bold text-purple-900 font-mono">{preview}</div>
        <p className="text-sm text-purple-700 mt-2">
          This is how your {DOCUMENT_TYPE_LABELS[selectedType].toLowerCase()} numbers will look
        </p>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Prefix */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Prefix</label>
          <input
            type="text"
            value={formData.prefix}
            onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
            placeholder="JS"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">The prefix for document numbers</p>
        </div>

        {/* Separator */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Separator</label>
          <select
            value={formData.separator}
            onChange={(e) => setFormData({ ...formData, separator: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="-">Hyphen (-)</option>
            <option value="/">Slash (/)</option>
            <option value=".">Period (.)</option>
            <option value="">None</option>
          </select>
        </div>

        {/* Reset Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sequence Resets
          </label>
          <select
            value={formData.sequenceResetFrequency}
            onChange={(e) =>
              setFormData({
                ...formData,
                sequenceResetFrequency: e.target.value as SequenceResetFrequency,
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {Object.entries(RESET_FREQUENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">When does the sequence number reset to 1</p>
        </div>

        {/* Sequence Length */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sequence Digits
          </label>
          <select
            value={formData.sequenceLength}
            onChange={(e) =>
              setFormData({ ...formData, sequenceLength: parseInt(e.target.value) })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value={2}>2 digits (01-99)</option>
            <option value={3}>3 digits (001-999)</option>
            <option value={4}>4 digits (0001-9999)</option>
            <option value={5}>5 digits (00001-99999)</option>
          </select>
        </div>
      </div>

      {/* Include Options */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Include in Number</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Include Branch */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Branch Code</p>
              <p className="text-sm text-gray-500">Include branch identifier</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeBranch}
                onChange={(e) => setFormData({ ...formData, includeBranch: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Include Year */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Year</p>
              <p className="text-sm text-gray-500">Include year in number</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeYear}
                onChange={(e) => setFormData({ ...formData, includeYear: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Include Month */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Month</p>
              <p className="text-sm text-gray-500">Include month in number</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeMonth}
                onChange={(e) => setFormData({ ...formData, includeMonth: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Include Day */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Day</p>
              <p className="text-sm text-gray-500">Include day in number</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeDay}
                onChange={(e) => setFormData({ ...formData, includeDay: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Year Format (only shown if year is included) */}
      {formData.includeYear && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Year Format</h3>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="radio"
                name="yearFormat"
                value="FULL"
                checked={formData.yearFormat === 'FULL'}
                onChange={(e) => setFormData({ ...formData, yearFormat: e.target.value })}
                className="text-purple-600 focus:ring-purple-500"
              />
              <div>
                <p className="font-medium text-gray-900">Full Year (2025)</p>
                <p className="text-sm text-gray-500">4-digit year</p>
              </div>
            </label>
            <label className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="radio"
                name="yearFormat"
                value="SHORT"
                checked={formData.yearFormat === 'SHORT'}
                onChange={(e) => setFormData({ ...formData, yearFormat: e.target.value })}
                className="text-purple-600 focus:ring-purple-500"
              />
              <div>
                <p className="font-medium text-gray-900">Short Year (25)</p>
                <p className="text-sm text-gray-500">2-digit year</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4 border-t border-gray-200 pt-6">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Default
        </button>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-6 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
