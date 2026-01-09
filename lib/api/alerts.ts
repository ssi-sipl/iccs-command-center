// lib/api/alerts.ts
// API service functions for alerts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type AlertStatus = "ACTIVE" | "SENT" | "NEUTRALISED";

export interface Alert {
  id: string;
  sensorDbId: string;
  sensorId: string;
  type: string;
  message: string;
  status: AlertStatus;
  createdAt: string;
  decidedAt: string | null;
  decision: string | null;
  time: string | null;
  metadata?: any;
  sensor?: {
    id: string;
    sensorId: string;
    name: string;
    latitude: number;
    longitude: number;
    area?: {
      id: string;
      areaId: string;
      name: string;
    };
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  message?: string;
  skipped?: boolean;
  pagination?: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

export interface GetAllAlertsParams {
  status?: AlertStatus;
  limit?: number;
  skip?: number;
  sortBy?: "createdAt" | "decidedAt";
  sortOrder?: "asc" | "desc";
}

// ============================================
// GET ALL ALERTS
// ============================================
/**
 * Get all alerts with optional filtering and pagination
 * @param params - Query parameters for filtering, sorting, and pagination
 */
export async function getAllAlerts(
  params?: GetAllAlertsParams
): Promise<ApiResponse<Alert[]>> {
  try {
    // Build query string
    const queryParams = new URLSearchParams();

    if (params?.status) {
      queryParams.append("status", params.status);
    }
    if (params?.limit) {
      queryParams.append("limit", params.limit.toString());
    }
    if (params?.skip) {
      queryParams.append("skip", params.skip.toString());
    }
    if (params?.sortBy) {
      queryParams.append("sortBy", params.sortBy);
    }
    if (params?.sortOrder) {
      queryParams.append("sortOrder", params.sortOrder);
    }

    const url = `${API_BASE_URL}/api/alerts/alerts${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    console.log("Fetching alerts from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers.get("content-type"));

    // Check if response is OK
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      // Try to parse error response
      if (contentType && contentType.includes("application/json")) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
        }
      } else {
        // If not JSON, get text response
        const textResponse = await response.text();
        console.error("Non-JSON error response:", textResponse);
        errorMessage = `Server returned ${response.status}. Check if the API endpoint exists.`;
      }

      throw new Error(errorMessage);
    }

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await response.text();
      console.error("Non-JSON response received:", textResponse);
      throw new Error(
        "Server returned invalid response format. Expected JSON but got: " +
          (contentType || "unknown")
      );
    }

    // Parse JSON response
    const data = await response.json();
    console.log("Successfully fetched alerts:", data);

    return data;
  } catch (error) {
    console.error("Error fetching all alerts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch alerts",
    };
  }
}

// ============================================
// GET ACTIVE ALERTS
// ============================================
/**
 * Get all ACTIVE alerts
 * Used for dashboard initial state and real-time sync
 */
export async function getActiveAlerts(): Promise<ApiResponse<Alert[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/alerts/active`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch active alerts");
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching active alerts:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch active alerts",
    };
  }
}

// ============================================
// GET ALERTS BY SENSOR
// ============================================
/**
 * Get alert history for a specific sensor
 * @param sensorDbId - MongoDB ObjectId of the sensor
 */
export async function getAlertsBySensor(
  sensorDbId: string
): Promise<ApiResponse<Alert[]>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/alerts/by-sensor/${sensorDbId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch sensor alerts");
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching sensor alerts:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch sensor alerts",
    };
  }
}

// ============================================
// SEND DRONE FOR ALERT
// ============================================
/**
 * Dispatch a drone for a specific alert
 * Changes alert status from ACTIVE → SENT
 * @param alertId - MongoDB ObjectId of the alert
 * @param droneId - MongoDB ObjectId of the drone to dispatch
 */
export async function sendDroneForAlert(
  alertId: string,
  droneId: string
): Promise<
  ApiResponse<{
    alert: Alert;
    drone: {
      id: string;
      name: string;
      type: string;
    };
  }>
> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/alerts/${alertId}/send-drone`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ droneId }),
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send drone");
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response");
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending drone:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send drone",
    };
  }
}

// ============================================
// NEUTRALISE ALERT
// ============================================
/**
 * Neutralise/dismiss an alert manually
 * Changes alert status from ACTIVE → NEUTRALISED
 * @param alertId - MongoDB ObjectId of the alert
 * @param reason - Optional reason for neutralisation
 */
export async function neutraliseAlert(
  alertId: string,
  reason?: string
): Promise<ApiResponse<Alert>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/alerts/${alertId}/neutralise`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ reason }),
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to neutralise alert");
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response");
    }

    return await response.json();
  } catch (error) {
    console.error("Error neutralising alert:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to neutralise alert",
    };
  }
}

// ============================================
// GET ALERT BY ID
// ============================================
/**
 * Get a single alert by ID with full details
 * @param alertId - MongoDB ObjectId of the alert
 */
export async function getAlertById(
  alertId: string
): Promise<ApiResponse<Alert>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/alerts/${alertId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch alert");
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching alert:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch alert",
    };
  }
}

// ============================================
// DELETE ALERT
// ============================================
/**
 * Delete an alert by ID
 * @param alertId - MongoDB ObjectId of the alert
 */
export async function deleteAlert(
  alertId: string
): Promise<ApiResponse<{ id: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/alerts/${alertId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete alert");
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting alert:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete alert",
    };
  }
}

// ============================================
// NEUTRALISE ALL ACTIVE ALERTS
// ============================================
/**
 * Neutralise ALL active alerts at once
 * Changes status from ACTIVE → NEUTRALISED
 * @param reason - Optional reason (manual_clear | system_clear | maintenance)
 */
export async function neutraliseAllActiveAlerts(
  reason?: string
): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/alerts/neutralise-all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || errorData.message || "Failed to neutralise alerts"
        );
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response");
    }

    return await response.json();
  } catch (error) {
    console.error("Error neutralising all alerts:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to neutralise all alerts",
    };
  }
}
