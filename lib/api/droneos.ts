// API service functions for drone OS

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface DroneOS {
  id: string;
  droneOSName: string;
  droneType: string;
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
export async function getAllDroneOS(): Promise<ApiResponse<DroneOS[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/droneos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
  id: string
): Promise<ApiResponse<DroneOS>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/droneos/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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

// Create new drone OS
export async function createDroneOS(droneData: {
  droneOSName: string;
  droneType: string;
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
}): Promise<ApiResponse<DroneOS>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/droneos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    droneOSName: string;
    droneType: string;
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
  }>
): Promise<ApiResponse<DroneOS>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/droneos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
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
