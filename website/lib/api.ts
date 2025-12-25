import { API_BASE_URL } from "./constants";
import type { PublicServiceResponse, CompanyInfo, ApiResponse } from "./types";

export async function trackService(
  ticket?: string,
  phone?: string
): Promise<PublicServiceResponse | PublicServiceResponse[]> {
  const params = new URLSearchParams();
  if (ticket) params.append("ticket", ticket);
  if (phone) params.append("phone", phone);

  const response = await fetch(`${API_BASE_URL}/public/track?${params}`, {
    cache: "no-store", // Always fetch fresh data
  });

  const data: ApiResponse<PublicServiceResponse | PublicServiceResponse[]> =
    await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || "Failed to fetch service. Please check your details."
    );
  }

  return data.data;
}

export async function getCompanyInfo(): Promise<CompanyInfo> {
  try {
    const response = await fetch(`${API_BASE_URL}/public/company-info`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    const data: ApiResponse<CompanyInfo> = await response.json();
    return data.data;
  } catch {
    return {
      name: "Deen Mobiles",
      logo: null,
      supportPhone: "",
    };
  }
}
