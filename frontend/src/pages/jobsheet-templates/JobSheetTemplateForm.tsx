import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobSheetTemplateApi, CreateJobSheetTemplateData } from '../../services/jobSheetTemplateApi';
import { jobSheetTemplateCategoryApi, JobSheetTemplateCategory } from '../../services/jobSheetTemplateCategoryApi';
import { toast } from 'sonner';

export default function JobSheetTemplateForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [categories, setCategories] = useState<JobSheetTemplateCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateJobSheetTemplateData>({
    name: '',
    description: '',
    categoryId: '',
    termsAndConditions: '',
    showCustomerSignature: true,
    showAuthorizedSignature: true,
    showCompanyLogo: true,
    showContactDetails: true,
    footerText: '',
    isDefault: false,
    isActive: true,
    branchId: '',
  });

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchTemplate();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await jobSheetTemplateCategoryApi.getAll({ limit: 100 });
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchTemplate = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const template = await jobSheetTemplateApi.getById(id);
      setFormData({
        name: template.name,
        description: template.description || '',
        categoryId: template.categoryId || '',
        termsAndConditions: template.termsAndConditions || '',
        showCustomerSignature: template.showCustomerSignature,
        showAuthorizedSignature: template.showAuthorizedSignature,
        showCompanyLogo: template.showCompanyLogo,
        showContactDetails: template.showContactDetails,
        footerText: template.footerText || '',
        isDefault: template.isDefault,
        isActive: template.isActive,
        branchId: template.branchId || '',
      });
    } catch (error: any) {
      toast.error('Failed to fetch theme');
      navigate('/branch/settings?tab=job-sheet');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Theme name is required');
      return;
    }

    try {
      setLoading(true);
      const data = {
        ...formData,
        categoryId: formData.categoryId || undefined,
        branchId: formData.branchId || undefined,
      };

      if (isEditing && id) {
        await jobSheetTemplateApi.update(id, data);
        toast.success('Theme updated successfully');
      } else {
        await jobSheetTemplateApi.create(data);
        toast.success('Theme created successfully');
      }
      navigate('/branch/settings?tab=job-sheet');
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} theme`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (loading && isEditing) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit' : 'Create'} Job Sheet Theme</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium mb-1">
              Theme Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded"
              placeholder="e.g., Standard Service Theme"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border rounded"
              placeholder="Brief description of this theme"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded"
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Display Options */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Display Options</h2>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="showCustomerSignature"
                checked={formData.showCustomerSignature}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-sm">Show Customer Signature</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="showAuthorizedSignature"
                checked={formData.showAuthorizedSignature}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-sm">Show Authorized Signature</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="showCompanyLogo"
                checked={formData.showCompanyLogo}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-sm">Show Company Logo</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="showContactDetails"
                checked={formData.showContactDetails}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-sm">Show Contact Details</span>
            </label>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Content</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Terms and Conditions</label>
            <textarea
              name="termsAndConditions"
              value={formData.termsAndConditions}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-2 border rounded font-mono text-sm"
              placeholder="Enter terms and conditions that will appear on job sheets..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Footer Text</label>
            <input
              type="text"
              name="footerText"
              value={formData.footerText}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded"
              placeholder="e.g., Thank you for your business!"
            />
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Settings</h2>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-sm">Set as Default Template</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-sm">Active</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/branch/job-sheet-templates')}
            className="px-6 py-2 border rounded hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : isEditing ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </form>
    </div>
  );
}
