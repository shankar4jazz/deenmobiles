import { ArrowUp, ArrowDown } from 'lucide-react';
import { ActivityItem } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  date?: string;
}

export default function ActivityFeed({ activities, title = 'Today', date }: ActivityFeedProps) {
  const getIcon = (type: 'incoming' | 'outgoing' | 'neutral') => {
    if (type === 'incoming') {
      return <ArrowUp className="h-4 w-4 text-green-600" />;
    } else if (type === 'outgoing') {
      return <ArrowDown className="h-4 w-4 text-orange-600" />;
    }
    return <ArrowUp className="h-4 w-4 text-gray-600" />;
  };

  const getIconBg = (type: 'incoming' | 'outgoing' | 'neutral') => {
    if (type === 'incoming') return 'bg-green-50';
    if (type === 'outgoing') return 'bg-orange-50';
    return 'bg-gray-50';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {date && <span className="text-sm text-gray-500">{date}</span>}
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`${getIconBg(activity.type)} p-2 rounded-lg flex-shrink-0`}>
              {getIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{activity.title}</p>
              <p className="text-xs text-gray-500 truncate">{activity.subtitle}</p>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
        )}
      </div>
    </div>
  );
}
