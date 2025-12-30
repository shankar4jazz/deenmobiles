export const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    bgColor: string;
    textColor: string;
    dotColor: string;
    iconBg: string;
  }
> = {
  PENDING: {
    label: "Pending",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
    dotColor: "bg-yellow-500",
    iconBg: "bg-yellow-100",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    dotColor: "bg-blue-500",
    iconBg: "bg-blue-100",
  },
  WAITING_PARTS: {
    label: "Waiting Parts",
    bgColor: "bg-orange-100",
    textColor: "text-orange-800",
    dotColor: "bg-orange-500",
    iconBg: "bg-orange-100",
  },
  COMPLETED: {
    label: "Completed",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    dotColor: "bg-green-500",
    iconBg: "bg-green-100",
  },
  DELIVERED: {
    label: "Delivered",
    bgColor: "bg-purple-100",
    textColor: "text-purple-800",
    dotColor: "bg-purple-500",
    iconBg: "bg-purple-100",
  },
  CANCELLED: {
    label: "Cancelled",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    dotColor: "bg-red-500",
    iconBg: "bg-red-100",
  },
};

// Professional API URL configuration
const getApiBaseUrl = () => {
  // Check for environment variable first
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Use different URLs for different environments
  if (process.env.NODE_ENV === 'production') {
    // In production, use the production API URL
    return 'https://api.deenmobiles.com/api/v1';
  }
  
  // Development default
  return 'http://localhost:3000/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

// Log configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Website API Configuration:', {
    API_BASE_URL,
    ENV: process.env.NODE_ENV,
  });
}
