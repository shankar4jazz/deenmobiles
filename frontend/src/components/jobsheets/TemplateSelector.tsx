import { useState, useEffect } from 'react';
import { jobSheetTemplateApi, JobSheetTemplate } from '../../services/jobSheetTemplateApi';

interface TemplateSelectorProps {
  value?: string;
  onChange: (templateId: string | undefined) => void;
  branchId?: string;
  className?: string;
}

export default function TemplateSelector({ value, onChange, branchId, className = '' }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<JobSheetTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultTemplate, setDefaultTemplate] = useState<JobSheetTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
    fetchDefaultTemplate();
  }, [branchId]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await jobSheetTemplateApi.getAll({
        isActive: true,
        branchId,
        limit: 100,
      });
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDefaultTemplate = async () => {
    try {
      const template = await jobSheetTemplateApi.getDefault(branchId);
      setDefaultTemplate(template);
      // If no value is set and we have a default, use it
      if (!value && template) {
        onChange(template.id);
      }
    } catch (error) {
      // No default template found, that's okay
      console.log('No default template found');
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium mb-1">Job Sheet Template</label>
        <select disabled className="w-full px-4 py-2 border rounded bg-gray-100">
          <option>Loading templates...</option>
        </select>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">
        Job Sheet Template
        {defaultTemplate && (
          <span className="ml-2 text-xs text-gray-500">(Default: {defaultTemplate.name})</span>
        )}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full px-4 py-2 border rounded"
      >
        <option value="">Select a template</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
            {template.isDefault && ' (Default)'}
            {template.category && ` - ${template.category.name}`}
          </option>
        ))}
      </select>
      {templates.length === 0 && (
        <p className="text-sm text-gray-500 mt-1">
          No templates available. Create one in settings.
        </p>
      )}
    </div>
  );
}
