// lib/api/droneCommand.ts
// API service functions for drone commands

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ============================================
// TYPES
// ============================================

export interface SendDronePayload {
  droneDbId: string;
  targetLatitude: number;
  targetLongitude: number;
  sensorId?: string;
  alertId?: string;
}

export interface SimpleDroneCommandPayload {
  droneDbId: string;
}

export interface DroneCommandResponse {
  success: boolean;
  message?: string;
  flightId?: any;
  error?: string;
}

// ============================================
// INTERNAL HELPER
// ============================================

async function postJson<T>(url: string, payload: any): Promise<T> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type");

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      if (contentType?.includes("application/json")) {
        const err = await response.json();
        errorMessage = err.error || err.message || errorMessage;
      }

      throw new Error(errorMessage);
    }

    if (!contentType?.includes("application/json")) {
      throw new Error("Server returned non-JSON response");
    }

    return await response.json();
  } catch (error) {
    console.error("[DroneCommand API]", error);
    throw error;
  }
}

// ============================================
// SEND DRONE
// ============================================

/**
 * Send a drone to a target location
 * Also creates DroneFlightHistory on backend
 */
export async function sendDrone(
  payload: SendDronePayload
): Promise<DroneCommandResponse> {
  try {
    return await postJson<DroneCommandResponse>(
      `${API_BASE_URL}/api/drone-command`,
      payload
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send drone",
    };
  }
}

// ============================================
// DROP PAYLOAD
// ============================================

export async function dropPayload(
  payload: SimpleDroneCommandPayload
): Promise<DroneCommandResponse> {
  try {
    return await postJson<DroneCommandResponse>(
      `${API_BASE_URL}/api/drone-command/dropPayload`,
      payload
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to drop payload",
    };
  }
}

// ============================================
// RECALL DRONE
// ============================================

export async function recallDrone(
  payload: SimpleDroneCommandPayload
): Promise<DroneCommandResponse> {
  try {
    return await postJson<DroneCommandResponse>(
      `${API_BASE_URL}/api/drone-command/recallDrone`,
      payload
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to recall drone",
    };
  }
}

// ============================================
// DRONE PATROL
// ============================================

export async function dronePatrol(
  payload: SimpleDroneCommandPayload
): Promise<DroneCommandResponse> {
  try {
    return await postJson<DroneCommandResponse>(
      `${API_BASE_URL}/api/drone-command/patrol`,
      payload
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start patrol",
    };
  }
}
