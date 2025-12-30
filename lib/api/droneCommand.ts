// lib/api/droneCommand.ts
// API service functions for drone command (send drone)

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

export interface SendDroneResponse {
  success: boolean;
  message?: string;
  flightId?: string;
  error?: string;
}

// ============================================
// SEND DRONE
// ============================================
/**
 * Send a drone to a target location
 * Creates a DroneFlightHistory entry on success
 */
export async function sendDrone(
  payload: SendDronePayload
): Promise<SendDroneResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/drone-command`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Handle non-OK HTTP status
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      if (contentType && contentType.includes("application/json")) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // ignore JSON parse error
        }
      } else {
        const text = await response.text();
        console.error("Non-JSON error response:", text);
      }

      throw new Error(errorMessage);
    }

    // Validate JSON response
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Invalid response format:", text);
      throw new Error("Server returned non-JSON response");
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending drone command:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send drone command",
    };
  }
}
