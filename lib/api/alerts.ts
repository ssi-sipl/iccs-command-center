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

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch alerts");
    }

    return await response.json();
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
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch active alerts");
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
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch sensor alerts");
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
        body: JSON.stringify({ droneId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to send drone");
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
        body: JSON.stringify({ reason }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to neutralise alert");
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
