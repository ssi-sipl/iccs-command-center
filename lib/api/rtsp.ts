// lib/api/rtsp.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RtspOpenResult {
  pid?: number; // process id on server (if server provides)
  sensorDbId?: string; // sensor id that was launched (if server provides)
}

/**
 * internal helper to fetch with timeout and safe json parsing
 */
async function fetchJsonWithTimeout(
  input: RequestInfo,
  init?: RequestInit,
  timeoutMs = 8000
): Promise<{ ok: boolean; status: number; body: any | null }> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, {
      ...(init || {}),
      signal: controller.signal,
    });
    const text = await res.text().catch(() => "");
    let body = null;
    try {
      if (text) body = JSON.parse(text);
    } catch {
      // not JSON, return text as body
      body = text;
    }
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    // Re-throw so callers can handle; include a normalized object below
    throw err;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Ask backend to open the RTSP stream of a sensor in VLC (or configured player)
 * Body: { sensorDbId: string }  // DB id of sensor
 *
 * Returns ApiResponse<RtspOpenResult>
 */
export async function openRtspBySensor(
  sensorDbId: string,
  timeoutMs = 10000
): Promise<ApiResponse<RtspOpenResult>> {
  if (!sensorDbId) {
    return { success: false, error: "sensorDbId is required" };
  }

  try {
    const url = `${API_BASE_URL}/api/rtsp/open`;
    const { ok, status, body } = await fetchJsonWithTimeout(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sensorDbId }),
      },
      timeoutMs
    );

    if (!ok) {
      const errMsg =
        (body &&
          (body.error || (typeof body === "string" ? body : undefined))) ||
        `Server returned ${status}`;
      return { success: false, error: errMsg, message: body?.message };
    }

    // body might contain { success:true, pid:..., message:..., data: {...} } depending on backend
    // Normalize possible shapes
    let result: RtspOpenResult = {};
    if (body) {
      // server may return data inside `data` or root fields
      if (body.data && typeof body.data === "object") {
        result = {
          pid:
            typeof body.data.pid === "number"
              ? body.data.pid
              : body.pid || undefined,
          sensorDbId:
            typeof body.data.sensorDbId === "string"
              ? body.data.sensorDbId
              : body.sensorDbId || undefined,
        };
      } else {
        result = {
          pid: typeof body.pid === "number" ? body.pid : undefined,
          sensorDbId:
            typeof body.sensorDbId === "string" ? body.sensorDbId : undefined,
        };
      }
    }

    return {
      success: true,
      data: result,
      message:
        (body &&
          (body.message || (typeof body === "string" ? body : undefined))) ||
        "RTSP opened",
    };
  } catch (err) {
    // distinguish abort vs network
    const errMsg =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Request timed out"
          : err.message
        : "Network error";
    console.error("openRtspBySensor error:", err);
    return { success: false, error: errMsg };
  }
}

/**
 * stopRtsp(payload: { sensorDbId?: string; pid?: number })
 * Calls server endpoint to stop a previously launched player.
 * Keep this in case you re-enable stop from the UI.
 */
export async function stopRtsp(payload: {
  sensorDbId?: string;
  pid?: number;
}): Promise<ApiResponse> {
  if (!payload || (!payload.sensorDbId && !payload.pid)) {
    return { success: false, error: "Provide sensorDbId or pid in payload" };
  }

  try {
    const url = `${API_BASE_URL}/api/rtsp/stop`;
    const { ok, status, body } = await fetchJsonWithTimeout(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      8000
    );

    if (!ok) {
      const errMsg =
        (body &&
          (body.error || (typeof body === "string" ? body : undefined))) ||
        `Server returned ${status}`;
      return { success: false, error: errMsg, message: body?.message };
    }

    return { success: true, message: (body && body.message) || "Stopped" };
  } catch (err) {
    const errMsg =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Request timed out"
          : err.message
        : "Network error";
    console.error("stopRtsp error:", err);
    return { success: false, error: errMsg };
  }
}
