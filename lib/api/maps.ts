// lib/api/maps.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface OfflineMap {
  id: string;
  name: string;
  description?: string | null;
  tileRoot: string; // e.g. "/maps/manekshaw"
  minZoom: number;
  maxZoom: number;
  north: number;
  south: number;
  east: number;
  west: number;
  isActive: boolean;
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

// Get all maps
export async function getAllMaps(): Promise<ApiResponse<OfflineMap[]>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/maps`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to fetch maps");
    }

    return await res.json();
  } catch (err) {
    console.error("Error fetching maps:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch maps",
    };
  }
}

// Get active map
export async function getActiveMap(): Promise<ApiResponse<OfflineMap | null>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/maps/active`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to fetch active map");
    }

    return await res.json();
  } catch (err) {
    console.error("Error fetching active map:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch active map",
    };
  }
}

// Create map
export async function createMap(
  payload: Omit<OfflineMap, "id" | "isActive" | "createdAt" | "updatedAt">
): Promise<ApiResponse<OfflineMap>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/maps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to create map");
    }

    return await res.json();
  } catch (err) {
    console.error("Error creating map:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create map",
    };
  }
}

// Set active map
export async function setMapActive(
  id: string
): Promise<ApiResponse<OfflineMap>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/maps/${id}/active`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to set map active");
    }

    return await res.json();
  } catch (err) {
    console.error("Error setting map active:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to set map active",
    };
  }
}

// Delete map
export async function deleteMap(id: string): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/maps/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to delete map");
    }

    return await res.json();
  } catch (err) {
    console.error("Error deleting map:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete map",
    };
  }
}
