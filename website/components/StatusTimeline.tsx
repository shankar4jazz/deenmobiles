import {
  Check,
  Circle,
  Clock,
  Package,
  Truck,
  XCircle,
  LucideIcon,
} from "lucide-react";
import { StatusHistoryItem } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface StatusTimelineProps {
  history: StatusHistoryItem[];
}

const STATUS_ICONS: Record<string, LucideIcon> = {
  PENDING: Circle,
  IN_PROGRESS: Clock,
  WAITING_PARTS: Package,
  COMPLETED: Check,
  DELIVERED: Truck,
  CANCELLED: XCircle,
};

export default function StatusTimeline({ history }: StatusTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        No status history available
      </p>
    );
  }

  return (
    <div className="relative pl-2">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200" />

      <div className="space-y-1">
        {history.map((item, index) => {
          const Icon = STATUS_ICONS[item.status] || Circle;
          const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
          const isLatest = index === history.length - 1;

          return (
            <div key={index} className="relative flex gap-4">
              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  isLatest ? config.iconBg : "bg-gray-100"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isLatest ? config.textColor : "text-gray-400"
                  )}
                />
              </div>

              {/* Content */}
              <div className="flex-1 pb-4 min-w-0">
                <p
                  className={cn(
                    "font-medium text-sm",
                    isLatest ? "text-gray-900" : "text-gray-600"
                  )}
                >
                  {item.statusLabel}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDateTime(item.timestamp)}
                </p>
                {item.notes && (
                  <p className="text-sm text-gray-600 mt-1.5 italic bg-gray-50 rounded-lg px-3 py-2">
                    &ldquo;{item.notes}&rdquo;
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
