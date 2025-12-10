const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface Sensor {
  id: string;
  sensorId: string;
  name: string;
  sensorType: string;
  latitude: number;
  longitude: number;
  ipAddress: string | null;
  rtspUrl: string | null; // ✅ NEW FIELD
  battery: string | null;
  status: string;
  sendDrone: string;
  activeShuruMode: string;
  areaId: string | null;
  alarmId: string | null;
  createdAt: string;
  updatedAt: string;
  area?: any;
  alarm?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  message?: string;
}

// Get all sensors
export async function getAllSensors(params?: {
  status?: string;
  areaId?: string;
  sensorType?: string;
  include?: boolean;
}): Promise<ApiResponse<Sensor[]>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.areaId) queryParams.append("areaId", params.areaId);
    if (params?.sensorType) queryParams.append("sensorType", params.sensorType);
    if (params?.include) queryParams.append("include", "true");

    const url = `${API_BASE_URL}/api/sensors${
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
      throw new Error(errorData.error || "Failed to fetch sensors");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching sensors:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch sensors",
    };
  }
}

// Get single sensor by ID
export async function getSensorById(
  id: string,
  includeRelations = false
): Promise<ApiResponse<Sensor>> {
  try {
    const url = `${API_BASE_URL}/api/sensors/${id}${
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
      throw new Error(errorData.error || "Failed to fetch sensor");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching sensor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch sensor",
    };
  }
}

// Get sensors by area ID
export async function getSensorsByArea(
  areaId: string
): Promise<ApiResponse<Sensor[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sensors/area/${areaId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch sensors");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching sensors:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch sensors",
    };
  }
}

// Create new sensor
export async function createSensor(sensorData: {
  sensorId: string;
  name: string;
  sensorType: string;
  latitude: number;
  longitude: number;
  ipAddress?: string;
  rtspUrl?: string; // ✅ allow sending RTSP URL
  battery?: string;
  status: string;
  sendDrone?: string;
  activeShuruMode: string;
  areaId?: string;
  alarmId?: string;
}): Promise<ApiResponse<Sensor>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sensors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sensorData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create sensor");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating sensor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create sensor",
    };
  }
}

// Update sensor
export async function updateSensor(
  id: string,
  sensorData: Partial<{
    sensorId: string;
    name: string;
    sensorType: string;
    latitude: number;
    longitude: number;
    ipAddress: string;
    rtspUrl: string; // ✅ allow updating RTSP URL
    battery: string;
    status: string;
    sendDrone: string;
    activeShuruMode: string;
    areaId: string;
    alarmId: string;
  }>
): Promise<ApiResponse<Sensor>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sensors/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sensorData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update sensor");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating sensor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update sensor",
    };
  }
}

// Delete sensor
export async function deleteSensor(id: string): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sensors/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete sensor");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting sensor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete sensor",
    };
  }
}
