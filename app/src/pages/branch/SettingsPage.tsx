import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Branch settings coming soon...</p>
      </div>
    </div>
  );
}
