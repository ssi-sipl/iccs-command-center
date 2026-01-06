// API service functions for areas

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface Area {
  id: string;
  areaId: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  sensors?: any[];
  alarms?: any[];
  drones?: any[]; // NEW: Drones relation
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  message?: string;
}

// Get all areas
// NOW INCLUDES: drones array when include=true
export async function getAllAreas(params?: {
  status?: string;
  include?: boolean;
}): Promise<ApiResponse<Area[]>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.include) queryParams.append("include", "true");

    const url = `${API_BASE_URL}/api/areas${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store", // Disable caching for real-time data
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch areas");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching areas:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch areas",
    };
  }
}

// Get single area by ID
// NOW INCLUDES: drones array when includeRelations=true
export async function getAreaById(
  id: string,
  includeRelations = false
): Promise<ApiResponse<Area>> {
  try {
    const url = `${API_BASE_URL}/api/areas/${id}${
      includeRelations ? "?include=true" : ""
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
      throw new Error(errorData.error || "Failed to fetch area");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching area:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch area",
    };
  }
}

// Create new area
export async function createArea(areaData: {
  areaId: string;
  name: string;
  latitude: number;
  longitude: number;
  status?: string;
}): Promise<ApiResponse<Area>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/areas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(areaData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create area");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating area:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create area",
    };
  }
}

// Update area
export async function updateArea(
  id: string,
  areaData: Partial<{
    areaId: string;
    name: string;
    latitude: number;
    longitude: number;
    status: string;
  }>
): Promise<ApiResponse<Area>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/areas/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(areaData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update area");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating area:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update area",
    };
  }
}

// Delete area
export async function deleteArea(id: string): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/areas/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete area");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting area:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete area",
    };
  }
}
