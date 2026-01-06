// API service functions for drone OS

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface DroneOS {
  id: string;
  droneId: string; // NEW: Unique drone identifier
  droneOSName: string;
  droneType: string;
  videoLink?: string | null; // NEW: Video feed link
  gpsFix: string;
  minHDOP: number;
  minSatCount: number;
  maxWindSpeed: number;
  droneSpeed: number;
  targetAltitude: number;
  gpsLost: string;
  telemetryLost: string;
  minBatteryLevel: number;
  usbAddress: string;
  batteryFailSafe: string;
  gpsName: string;
  maxAltitude: number;
  latitude?: number | null; // NEW: Home Latitude
  longitude?: number | null; // NEW: Home Longitude
  areaId?: string | null; // NEW: Area relation
  area?: {
    // NEW: Area details when included
    id: string;
    areaId: string;
    name: string;
    latitude: number;
    longitude: number;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  message?: string;
}

// Get all drone OS settings
export async function getAllDroneOS(params?: {
  areaId?: string;
  include?: boolean;
}): Promise<ApiResponse<DroneOS[]>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.areaId) queryParams.append("areaId", params.areaId);
    if (params?.include) queryParams.append("include", "true");

    const url = `${API_BASE_URL}/api/droneos${
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
      throw new Error(errorData.error || "Failed to fetch drone OS settings");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching drone OS:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch drone OS settings",
    };
  }
}

// Get single drone OS by ID
export async function getDroneOSById(
  id: string,
  includeArea = false
): Promise<ApiResponse<DroneOS>> {
  try {
    const url = `${API_BASE_URL}/api/droneos/${id}${
      includeArea ? "?include=true" : ""
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
      throw new Error(errorData.error || "Failed to fetch drone OS");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching drone OS:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch drone OS",
    };
  }
}

// Get drones by area ID
export async function getDronesByArea(
  areaId: string,
  includeArea = false
): Promise<ApiResponse<DroneOS[]>> {
  try {
    const url = `${API_BASE_URL}/api/droneos/area/${areaId}${
      includeArea ? "?include=true" : ""
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
      throw new Error(errorData.error || "Failed to fetch drones by area");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching drones by area:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch drones by area",
    };
  }
}

// Create new drone OS
export async function createDroneOS(droneData: {
  droneId: string; // REQUIRED: Unique drone identifier
  droneOSName: string;
  droneType: string;
  videoLink?: string; // OPTIONAL: Video feed link
  gpsFix: string;
  minHDOP: number;
  minSatCount: number;
  maxWindSpeed: number;
  droneSpeed: number;
  targetAltitude: number;
  gpsLost: string;
  telemetryLost: string;
  minBatteryLevel: number;
  usbAddress: string;
  batteryFailSafe: string;
  gpsName: string;
  maxAltitude: number;
  latitude: number; // OPTIONAL: Home Latitude
  longitude: number; // OPTIONAL: Home Longitude
  areaId?: string; // OPTIONAL: Area ID
}): Promise<ApiResponse<DroneOS>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/droneos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(droneData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create drone OS");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating drone OS:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create drone OS",
    };
  }
}

// Update drone OS
export async function updateDroneOS(
  id: string,
  droneData: Partial<{
    droneId: string;
    droneOSName: string;
    droneType: string;
    videoLink: string | null;
    gpsFix: string;
    minHDOP: number;
    minSatCount: number;
    maxWindSpeed: number;
    droneSpeed: number;
    targetAltitude: number;
    gpsLost: string;
    telemetryLost: string;
    minBatteryLevel: number;
    usbAddress: string;
    batteryFailSafe: string;
    gpsName: string;
    maxAltitude: number;
    latitude: number | null;
    longitude: number | null;
    areaId: string | null;
  }>
): Promise<ApiResponse<DroneOS>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/droneos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(droneData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update drone OS");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating drone OS:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update drone OS",
    };
  }
}

// Delete drone OS
export async function deleteDroneOS(id: string): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/droneos/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete drone OS");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting drone OS:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete drone OS",
    };
  }
}
