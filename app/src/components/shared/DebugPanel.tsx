import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, Loader, XCircle } from 'lucide-react';

interface DebugPanelProps {
  title: string;
  user?: any;
  queryState?: {
    isLoading?: boolean;
    isError?: boolean;
    error?: any;
    isSuccess?: boolean;
    data?: any;
    dataCount?: number;
  };
  apiDetails?: {
    endpoint?: string;
    params?: any;
    branchId?: string | number | null;
  };
  additionalInfo?: Record<string, any>;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  title,
  user,
  queryState,
  apiDetails,
  additionalInfo,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusIcon = () => {
    if (queryState?.isLoading) {
      return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
    }
    if (queryState?.isError) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (queryState?.isSuccess) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <AlertCircle className="w-4 h-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (queryState?.isLoading) return 'Loading...';
    if (queryState?.isError) return 'Error';
    if (queryState?.isSuccess) return 'Success';
    return 'Idle';
  };

  const getStatusColor = () => {
    if (queryState?.isLoading) return 'bg-blue-50 border-blue-200';
    if (queryState?.isError) return 'bg-red-50 border-red-200';
    if (queryState?.isSuccess) return 'bg-green-50 border-green-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className={`border-2 rounded-lg mb-4 ${getStatusColor()}`}>
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-semibold text-sm">{title} - Debug Panel</span>
          <span className="text-xs px-2 py-0.5 bg-white rounded-full">
            {getStatusText()}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </div>

      {isExpanded && (
        <div className="p-3 pt-0 space-y-3 text-xs">
          {/* User & Branch Info */}
          <div className="bg-white p-2 rounded border">
            <div className="font-semibold mb-1">👤 User & Branch Info</div>
            <div className="space-y-1 text-gray-700">
              <div>
                <span className="font-medium">User ID:</span>{' '}
                {user?.id || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Username:</span>{' '}
                {user?.username || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Active Branch ID:</span>{' '}
                <span className="font-bold text-blue-600">
                  {user?.activeBranch?.id || 'NULL ⚠️'}
                </span>
              </div>
              <div>
                <span className="font-medium">Active Branch Name:</span>{' '}
                {user?.activeBranch?.name || 'N/A'}
              </div>
            </div>
          </div>

          {/* API Details */}
          {apiDetails && (
            <div className="bg-white p-2 rounded border">
              <div className="font-semibold mb-1">🌐 API Request Details</div>
              <div className="space-y-1 text-gray-700">
                {apiDetails.endpoint && (
                  <div>
                    <span className="font-medium">Endpoint:</span>{' '}
                    <code className="bg-gray-100 px-1 rounded">
                      {apiDetails.endpoint}
                    </code>
                  </div>
                )}
                {apiDetails.branchId !== undefined && (
                  <div>
                    <span className="font-medium">Branch ID Filter:</span>{' '}
                    <span className="font-bold text-blue-600">
                      {apiDetails.branchId || 'NULL ⚠️'}
                    </span>
                  </div>
                )}
                {apiDetails.params && (
                  <div>
                    <span className="font-medium">Params:</span>
                    <pre className="bg-gray-100 p-1 rounded mt-1 overflow-auto max-h-24">
                      {JSON.stringify(apiDetails.params, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Query State */}
          {queryState && (
            <div className="bg-white p-2 rounded border">
              <div className="font-semibold mb-1">📊 Query State</div>
              <div className="space-y-1 text-gray-700">
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  {getStatusText()}
                </div>
                {queryState.isSuccess && queryState.dataCount !== undefined && (
                  <div>
                    <span className="font-medium">Data Count:</span>{' '}
                    <span className="font-bold text-green-600">
                      {queryState.dataCount} items
                    </span>
                  </div>
                )}
                {queryState.isError && queryState.error && (
                  <div>
                    <span className="font-medium text-red-600">Error:</span>
                    <pre className="bg-red-50 p-1 rounded mt-1 overflow-auto max-h-24 text-red-700">
                      {JSON.stringify(queryState.error, null, 2)}
                    </pre>
                  </div>
                )}
                {queryState.data && (
                  <div>
                    <span className="font-medium">Raw Data:</span>
                    <pre className="bg-gray-100 p-1 rounded mt-1 overflow-auto max-h-32">
                      {JSON.stringify(queryState.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Info */}
          {additionalInfo && Object.keys(additionalInfo).length > 0 && (
            <div className="bg-white p-2 rounded border">
              <div className="font-semibold mb-1">ℹ️ Additional Info</div>
              <pre className="bg-gray-100 p-1 rounded overflow-auto max-h-32 text-gray-700">
                {JSON.stringify(additionalInfo, null, 2)}
              </pre>
            </div>
          )}

          {/* Helpful Tips */}
          <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
            <div className="font-semibold mb-1 text-yellow-800">💡 Debug Tips</div>
            <ul className="list-disc list-inside space-y-0.5 text-yellow-700">
              <li>Check browser console (F12) for detailed logs</li>
              <li>Check Network tab for API response details</li>
              <li>Verify backend is running on http://localhost:5000</li>
              {!user?.activeBranch?.id && (
                <li className="text-red-600 font-semibold">
                  ⚠️ Active Branch ID is NULL - This is likely the issue!
                </li>
              )}
              {queryState?.dataCount === 0 && (
                <li className="text-orange-600 font-semibold">
                  ⚠️ API returned 0 items - Database may be empty for this branch
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
