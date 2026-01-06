// API service functions for drone flight history

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface FlightHistory {
  id: string;
  droneDbId: string;
  alertDbId: string;
  sensorDbId: string;
  areaDbId: string | null;
  droneId: string; // Business ID like "DRONE-001"
  sensorId: string; // Business ID like "SENSOR-001"
  alertId: string; // Alert MongoDB ID
  dispatchedAt: string;
  completedAt: string | null;
  status: "Dispatched" | "In Flight" | "Completed" | "Aborted";
  flightDuration: number | null; // in seconds
  batteryUsed: number | null; // percentage
  maxAltitude: number | null; // in meters
  distanceCovered: number | null; // in meters
  notes: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  // Relations
  drone?: {
    id: string;
    droneId: string;
    droneOSName: string;
    droneType: string;
    videoLink: string | null;
  };
  alert?: any;
  sensor?: any;
  area?: any;
}

export interface FlightStatistics {
  totalFlights: number;
  completedFlights: number;
  inFlightFlights: number;
  abortedFlights: number;
  averages: {
    flightDuration: number;
    batteryUsed: number;
    distanceCovered: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

export interface GetFlightHistoryParams {
  status?: string;
  droneId?: string;
  sensorId?: string;
  alertId?: string;
  limit?: number;
  skip?: number;
  sortBy?: "dispatchedAt" | "completedAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// ============================================
// GET ALL FLIGHT HISTORY
// ============================================
/**
 * Get all flight history with optional filtering and pagination
 * @param params - Query parameters for filtering, sorting, and pagination
 */
export async function getAllFlightHistory(
  params?: GetFlightHistoryParams
): Promise<ApiResponse<FlightHistory[]>> {
  try {
    const queryParams = new URLSearchParams();

    if (params?.status) queryParams.append("status", params.status);
    if (params?.droneId) queryParams.append("droneId", params.droneId);
    if (params?.sensorId) queryParams.append("sensorId", params.sensorId);
    if (params?.alertId) queryParams.append("alertId", params.alertId);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.skip) queryParams.append("skip", params.skip.toString());
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const url = `${API_BASE_URL}/api/flight-history${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch flight history");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching flight history:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch flight history",
    };
  }
}

// ============================================
// GET FLIGHT HISTORY BY ID
// ============================================
/**
 * Get a single flight history record by ID
 * @param id - MongoDB ObjectId of the flight history
 */
export async function getFlightHistoryById(
  id: string
): Promise<ApiResponse<FlightHistory>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/flight-history/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch flight history");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching flight history:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch flight history",
    };
  }
}

// ============================================
// GET FLIGHT HISTORY BY DRONE
// ============================================
/**
 * Get all flights for a specific drone
 * @param droneId - Business drone ID (e.g., "DRONE-001")
 * @param params - Optional pagination parameters
 */
export async function getFlightHistoryByDrone(
  droneId: string,
  params?: { limit?: number; skip?: number }
): Promise<ApiResponse<FlightHistory[]>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.skip) queryParams.append("skip", params.skip.toString());

    const url = `${API_BASE_URL}/api/flight-history/drone/${droneId}${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to fetch flight history by drone"
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching flight history by drone:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch flight history by drone",
    };
  }
}

// ============================================
// GET FLIGHT HISTORY BY SENSOR
// ============================================
/**
 * Get all flights for a specific sensor
 * @param sensorId - Business sensor ID (e.g., "SENSOR-001")
 * @param params - Optional pagination parameters
 */
export async function getFlightHistoryBySensor(
  sensorId: string,
  params?: { limit?: number; skip?: number }
): Promise<ApiResponse<FlightHistory[]>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.skip) queryParams.append("skip", params.skip.toString());

    const url = `${API_BASE_URL}/api/flight-history/sensor/${sensorId}${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to fetch flight history by sensor"
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching flight history by sensor:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch flight history by sensor",
    };
  }
}

// ============================================
// GET FLIGHT HISTORY BY ALERT
// ============================================
/**
 * Get all flights for a specific alert
 * @param alertId - MongoDB ObjectId of the alert
 */
export async function getFlightHistoryByAlert(
  alertId: string
): Promise<ApiResponse<FlightHistory[]>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/flight-history/alert/${alertId}`,
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
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to fetch flight history by alert"
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching flight history by alert:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch flight history by alert",
    };
  }
}

// ============================================
// UPDATE FLIGHT HISTORY
// ============================================
/**
 * Update a flight history record (e.g., mark as completed, add metrics)
 * @param id - MongoDB ObjectId of the flight history
 * @param updateData - Fields to update
 */
export async function updateFlightHistory(
  id: string,
  updateData: Partial<{
    status: "Dispatched" | "In Flight" | "Completed" | "Aborted";
    completedAt: string | null;
    flightDuration: number;
    batteryUsed: number;
    maxAltitude: number;
    distanceCovered: number;
    notes: string;
    metadata: any;
  }>
): Promise<ApiResponse<FlightHistory>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/flight-history/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update flight history");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating flight history:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update flight history",
    };
  }
}

// ============================================
// DELETE FLIGHT HISTORY
// ============================================
/**
 * Delete a flight history record
 * @param id - MongoDB ObjectId of the flight history
 */
export async function deleteFlightHistory(
  id: string
): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/flight-history/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete flight history");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting flight history:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete flight history",
    };
  }
}

// ============================================
// GET FLIGHT STATISTICS
// ============================================
/**
 * Get flight statistics for reports
 * @param params - Optional filters (droneId, sensorId, date range)
 */
export async function getFlightStatistics(params?: {
  droneId?: string;
  sensorId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<FlightStatistics>> {
  try {
    const queryParams = new URLSearchParams();

    if (params?.droneId) queryParams.append("droneId", params.droneId);
    if (params?.sensorId) queryParams.append("sensorId", params.sensorId);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const url = `${API_BASE_URL}/api/flight-history/stats${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch flight statistics");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching flight statistics:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch flight statistics",
    };
  }
}
