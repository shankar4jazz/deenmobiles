import { STATUS_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-xs",
    lg: "px-4 py-2 text-sm",
  };

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        config.bgColor,
        config.textColor,
        sizeClasses[size]
      )}
    >
      <span
        className={cn(
          "rounded-full animate-pulse",
          config.dotColor,
          dotSizes[size]
        )}
      />
      {config.label}
    </span>
  );
}
