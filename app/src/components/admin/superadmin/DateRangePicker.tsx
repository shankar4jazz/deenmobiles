import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  value: {
    startDate?: string;
    endDate?: string;
    period?: string;
  };
  onChange: (value: { startDate?: string; endDate?: string; period?: string }) => void;
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const handlePeriodChange = (period: string) => {
    onChange({ period });
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2 shadow-sm">
        <Calendar className="w-4 h-4 text-gray-500" />
        <select
          value={value.period || 'month'}
          onChange={(e) => handlePeriodChange(e.target.value)}
          className="text-sm border-none outline-none bg-transparent text-gray-700 font-medium cursor-pointer"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>
    </div>
  );
}
