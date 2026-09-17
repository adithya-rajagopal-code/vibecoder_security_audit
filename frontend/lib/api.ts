import { ScanResponse, ApiError } from "./types";
import { MOCK_VIBESHOP_REPORT } from "./mockData";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://172.16.39.215:8000";

/**
 * Checks whether the backend FastAPI server is healthy and responding.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Uploads a ZIP file to POST /api/v1/scan and receives the security report.
 * If fallbackToDemo is true and backend is unreachable, resolves with MOCK_VIBESHOP_REPORT.
 */
export async function scanProjectZip(
  file: File,
  forceDemoMode: boolean = false
): Promise<ScanResponse> {
  if (forceDemoMode) {
    // Simulate short network delay for realistic scanning visualization
    await new Promise((resolve) => setTimeout(resolve, 2400));
    return MOCK_VIBESHOP_REPORT;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/scan`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      let errorData: ApiError | null = null;
      try {
        errorData = await res.json();
      } catch {
        // Not a JSON error
      }

      const errorMessage =
        errorData?.error?.message ||
        `Backend scan request failed with HTTP ${res.status}: ${res.statusText}`;

      const error = new Error(errorMessage) as Error & { code?: string };
      error.code = errorData?.error?.code || "SCAN_FAILED";
      throw error;
    }

    const data: ScanResponse = await res.json();
    return data;
  } catch (err: unknown) {
    const errorObj = err as Error & { code?: string };
    // If backend connection fails (e.g. ECONNREFUSED or fetch failed), provide clear error
    if (
      errorObj.message?.includes("Failed to fetch") ||
      errorObj.message?.includes("NetworkError") ||
      errorObj.message?.includes("ECONNREFUSED")
    ) {
      const connError = new Error(
        `Unable to reach FastAPI backend at ${API_BASE_URL}. Ensure the backend server is running and accessible or enable Demo Mode.`
      ) as Error & { code?: string };
      connError.code = "BACKEND_UNREACHABLE";
      throw connError;
    }
    throw errorObj;
  }
}
