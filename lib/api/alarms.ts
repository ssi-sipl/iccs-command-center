const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface Alarm {
  id: string;
  alarmId: string;
  name: string;
  status: string;
  areaId: string | null;
  createdAt: string;
  updatedAt: string;
  area?: any;
  sensors?: any[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  message?: string;
}

// Get all alarms
export async function getAllAlarms(params?: {
  status?: string;
  areaId?: string;
  include?: boolean;
}): Promise<ApiResponse<Alarm[]>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.areaId) queryParams.append("areaId", params.areaId);
    if (params?.include) queryParams.append("include", "true");

    const url = `${API_BASE_URL}/api/alarms${
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
      throw new Error(errorData.error || "Failed to fetch alarms");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching alarms:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch alarms",
    };
  }
}

// Get single alarm by ID
export async function getAlarmById(
  id: string,
  includeRelations = false
): Promise<ApiResponse<Alarm>> {
  try {
    const url = `${API_BASE_URL}/api/alarms/${id}${
      includeRelations ? "?include=true" : ""
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
      throw new Error(errorData.error || "Failed to fetch alarm");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching alarm:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch alarm",
    };
  }
}

// Get alarms by area ID
export async function getAlarmsByArea(
  areaId: string
): Promise<ApiResponse<Alarm[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/alarms/area/${areaId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch alarms");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching alarms:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch alarms",
    };
  }
}

// Get sensors for an alarm
export async function getAlarmSensors(id: string): Promise<ApiResponse<any[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/alarms/${id}/sensors`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch alarm sensors");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching alarm sensors:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch alarm sensors",
    };
  }
}

// Create new alarm
export async function createAlarm(alarmData: {
  alarmId: string;
  name: string;
  status?: string;
  areaId?: string;
}): Promise<ApiResponse<Alarm>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/alarms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(alarmData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create alarm");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating alarm:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create alarm",
    };
  }
}

// Update alarm
export async function updateAlarm(
  id: string,
  alarmData: Partial<{
    alarmId: string;
    name: string;
    status: string;
    areaId: string;
  }>
): Promise<ApiResponse<Alarm>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/alarms/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(alarmData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update alarm");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating alarm:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update alarm",
    };
  }
}

// Delete alarm
export async function deleteAlarm(id: string): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/alarms/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete alarm");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting alarm:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete alarm",
    };
  }
}
