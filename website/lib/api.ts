import { API_BASE_URL } from "./constants";
import type { PublicServiceResponse, CompanyInfo, ApiResponse } from "./types";

// Add error handling wrapper
async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    throw error;
  }
}

export async function trackService(
  ticket?: string,
  phone?: string
): Promise<PublicServiceResponse | PublicServiceResponse[]> {
  const params = new URLSearchParams();
  if (ticket) params.append("ticket", ticket);
  if (phone) params.append("phone", phone);

  const data = await apiRequest<ApiResponse<PublicServiceResponse | PublicServiceResponse[]>>(
    `${API_BASE_URL}/public/track?${params}`,
    { cache: "no-store" }
  );

  if (!data.success) {
    throw new Error(data.message || "Failed to fetch service");
  }

  return data.data;
}

export async function getCompanyInfo(): Promise<CompanyInfo> {
  try {
    const data = await apiRequest<ApiResponse<CompanyInfo>>(
      `${API_BASE_URL}/public/company-info`,
      { next: { revalidate: 3600 } }
    );
    return data.data;
  } catch {
    return {
      name: "Deen Mobiles",
      logo: null,
      supportPhone: "",
    };
  }
}
