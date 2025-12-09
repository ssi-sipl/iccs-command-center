"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  Camera,
  AlertTriangle,
  MapPin,
  Crosshair,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";

import { getAllSensors, type Sensor } from "@/lib/api/sensors";
import {
  getActiveAlerts,
  sendDroneForAlert,
  neutraliseAlert,
  type Alert as ApiAlert,
} from "@/lib/api/alerts";
import { getAllDroneOS, type DroneOS } from "@/lib/api/droneos";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// reuse Alert type from API
type Alert = ApiAlert;

// === CONFIG: adjust these bounds to match your offline map image ===
const MAP_BOUNDS = {
  north: 28.456969, // max latitude (top of image)
  south: 28.438951, // min latitude (bottom of image)
  west: 77.033995, // min longitude (left of image)
  east: 77.048835, // max longitude (right of image)
};

// Map sensorType → short label
const typeLabel: Record<string, string> = {
  "Motion Detector": "MOT",
  Camera: "CAM",
  "Thermal Sensor": "TH",
  "Infrared Sensor": "IR",
  "PIR Sensor": "PIR",
  Other: "OTH",
};

export function MapView() {
  const [zoom, setZoom] = useState(15);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorsLoading, setSensorsLoading] = useState(true);
  const [sensorsError, setSensorsError] = useState<string | null>(null);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Modal state
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Drones
  const [drones, setDrones] = useState<DroneOS[]>([]);
  const [dronesLoading, setDronesLoading] = useState(false);
  const [dronesError, setDronesError] = useState<string | null>(null);
  const [selectedDroneId, setSelectedDroneId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const { toast } = useToast();
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // =============================
  // Zoom handlers (still simple)
  // =============================
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 1, 20));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 1, 1));

  // =============================
  // Fetch sensors
  // =============================
  useEffect(() => {
    const fetchSensors = async () => {
      setSensorsLoading(true);
      setSensorsError(null);
      try {
        const res = await getAllSensors({ include: true });
        if (res.success && res.data) {
          setSensors(res.data);
        } else {
          setSensors([]);
          setSensorsError(res.error || "Failed to fetch sensors");
        }
      } catch (err: any) {
        console.error("Error fetching sensors:", err);
        setSensors([]);
        setSensorsError(
          err instanceof Error ? err.message : "Failed to fetch sensors"
        );
      } finally {
        setSensorsLoading(false);
      }
    };

    fetchSensors();
  }, []);

  // =============================
  // Fetch initial active alerts
  // =============================
  useEffect(() => {
    const fetchAlerts = async () => {
      setAlertsLoading(true);
      setAlertsError(null);
      try {
        const res = await getActiveAlerts();
        if (res.success && res.data) {
          setAlerts(res.data);
        } else {
          setAlerts([]);
          setAlertsError(res.error || "Failed to fetch active alerts");
        }
      } catch (err: any) {
        console.error("Error fetching alerts:", err);
        setAlerts([]);
        setAlertsError(
          err instanceof Error ? err.message : "Failed to fetch active alerts"
        );
      } finally {
        setAlertsLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  // =============================
  // Socket.IO for realtime alerts
  // =============================
  useEffect(() => {
    const socket: Socket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("✅ MapView socket connected:", socket.id);
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("❌ MapView socket disconnected");
      setSocketConnected(false);
    });

    socket.on("alert_active", (alert: Alert) => {
      console.log("📡 MapView alert_active:", alert);
      setAlerts((prev) => {
        const exists = prev.some((a) => a.id === alert.id);
        return exists ? prev : [...prev, alert];
      });
    });

    socket.on("alert_resolved", (payload: { id: string; status: string }) => {
      console.log("📡 MapView alert_resolved:", payload);
      setAlerts((prev) => prev.filter((a) => a.id !== payload.id));

      // If modal is open on that alert, close it
      setSelectedAlert((current) =>
        current && current.id === payload.id ? null : current
      );
      setIsModalOpen((open) =>
        selectedAlert && selectedAlert.id === payload.id ? false : open
      );
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL]);

  // =============================
  // When modal opens, fetch drones
  // (for now: ALL drones; later we can filter by area)
  // =============================
  useEffect(() => {
    const fetchDrones = async () => {
      if (!isModalOpen || !selectedSensor) {
        setDrones([]);
        setSelectedDroneId("");
        setDronesError(null);
        return;
      }

      setDronesLoading(true);
      setDronesError(null);
      setSelectedDroneId("");

      try {
        const res = await getAllDroneOS();
        if (res.success && res.data) {
          // TODO: once DroneOS has areaId, filter by selectedSensor.areaId
          setDrones(res.data);
        } else {
          setDrones([]);
          setDronesError(res.error || "Failed to fetch drones");
        }
      } catch (err: any) {
        console.error("Error fetching drones:", err);
        setDrones([]);
        setDronesError(
          err instanceof Error ? err.message : "Failed to fetch drones"
        );
      } finally {
        setDronesLoading(false);
      }
    };

    fetchDrones();
  }, [isModalOpen, selectedSensor]);

  // =============================
  // Derived: active alerts per sensor
  // =============================
  const activeAlertBySensorDbId = new Map<string, Alert>();
  for (const alert of alerts) {
    if (alert.sensorDbId) {
      activeAlertBySensorDbId.set(alert.sensorDbId, alert);
    }
  }

  // =============================
  // Helpers: project lat/lng to %
  // =============================
  function projectSensor(sensor: Sensor) {
    if (
      !MAP_BOUNDS ||
      MAP_BOUNDS.east === MAP_BOUNDS.west ||
      MAP_BOUNDS.north === MAP_BOUNDS.south
    ) {
      return { left: "50%", top: "50%" };
    }

    const lat = sensor.latitude;
    const lng = sensor.longitude;

    const x =
      ((lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * 100;
    const y =
      (1 - (lat - MAP_BOUNDS.south) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) *
      100;

    return {
      left: `${Math.min(100, Math.max(0, x))}%`,
      top: `${Math.min(100, Math.max(0, y))}%`,
    };
  }

  // =============================
  // Click handlers
  // =============================
  const handleSensorClick = (sensor: Sensor) => {
    const activeAlert = activeAlertBySensorDbId.get(sensor.id) || null;
    setSelectedSensor(sensor);
    setSelectedAlert(activeAlert);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (actionLoading) return;
    setIsModalOpen(false);
    setSelectedSensor(null);
    setSelectedAlert(null);
    setDrones([]);
    setDronesError(null);
    setSelectedDroneId("");
  };

  const handleSendDrone = async () => {
    if (!selectedSensor) return;

    if (!selectedDroneId) {
      toast({
        title: "Select a drone",
        description: "Please choose a drone to dispatch.",
        variant: "destructive",
      });
      return;
    }

    // CASE 1: There is an ACTIVE alert for this sensor → use sendDroneForAlert
    if (selectedAlert) {
      setActionLoading(true);
      try {
        const res = await sendDroneForAlert(selectedAlert.id, selectedDroneId);

        if (!res.success || !res.data) {
          throw new Error(res.error || "Failed to send drone");
        }

        toast({
          title: "Drone dispatched",
          description: `Drone "${res.data.drone.name}" sent for alert.`,
        });

        // Remove alert from local list
        setAlerts((prev) => prev.filter((a) => a.id !== selectedAlert.id));
        closeModal();
      } catch (err: any) {
        console.error("Error sending drone:", err);
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to send drone",
          variant: "destructive",
        });
      } finally {
        setActionLoading(false);
      }
      return;
    }

    // CASE 2: No active alert → manual drone dispatch (UI only, TODO backend)
    setActionLoading(true);
    try {
      console.log(
        "Manual drone dispatch (TODO backend):",
        selectedSensor.id,
        selectedDroneId
      );
      toast({
        title: "Manual drone dispatch",
        description:
          "This is a UI-only action for now. Wire it to your mission planner backend when ready.",
      });
      closeModal();
    } catch (err: any) {
      console.error("Error in manual send drone:", err);
      toast({
        title: "Error",
        description: "Failed to send drone",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleNeutralise = async () => {
    if (!selectedAlert) return;

    setActionLoading(true);
    try {
      const res = await neutraliseAlert(
        selectedAlert.id,
        "Manual neutralisation from map"
      );

      if (!res.success) {
        throw new Error(res.error || "Failed to neutralise alert");
      }

      toast({
        title: "Alert neutralised",
        description: "Alert has been marked as neutralised.",
      });

      setAlerts((prev) => prev.filter((a) => a.id !== selectedAlert.id));
      closeModal();
    } catch (err: any) {
      console.error("Error neutralising alert:", err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to neutralise alert",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // =============================
  // Render
  // =============================
  return (
    <div className="relative h-full w-full">
      {/* Satellite Map Background (offline image) */}
      <div
        className="h-full w-full bg-cover bg-center"
        style={{
          backgroundImage: `url('/satellite-aerial-view-of-city-urban-area-from-abov.jpg')`,
          // You can add scale/transform based on zoom if you want
        }}
      />

      {/* Zoom Controls */}
      <div className="absolute left-2 top-2 flex flex-col gap-1 md:left-4 md:top-4">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-white text-black hover:bg-gray-200"
          onClick={handleZoomIn}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-white text-black hover:bg-gray-200"
          onClick={handleZoomOut}
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      {/* Optional center "camera" marker (e.g. base station) */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-teal-500 shadow-lg md:h-10 md:w-10">
          <Camera className="h-4 w-4 text-white md:h-5 md:w-5" />
        </div>
      </div>

      {/* Sensor markers */}
      {!sensorsLoading && sensorsError && (
        <div className="absolute bottom-2 left-2 rounded bg-red-900/70 px-3 py-1 text-xs text-red-100">
          Failed to load sensors: {sensorsError}
        </div>
      )}

      {!sensorsLoading &&
        !sensorsError &&
        sensors.map((sensor) => {
          const pos = projectSensor(sensor);
          const activeAlert = activeAlertBySensorDbId.get(sensor.id) || null;
          const hasAlert = !!activeAlert;
          const isActive =
            sensor.status && sensor.status.toLowerCase() === "active";

          const label =
            typeLabel[sensor.sensorType] || typeLabel["Other"] || "SEN";

          const bgClass = hasAlert
            ? "bg-red-600"
            : isActive
            ? "bg-green-600"
            : "bg-gray-500";

          return (
            <button
              key={sensor.id}
              type="button"
              onClick={() => handleSensorClick(sensor)}
              style={{ left: pos.left, top: pos.top }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white ${bgClass} shadow-lg hover:scale-110 transition-transform`}
              >
                <span className="text-[9px] font-bold text-white">{label}</span>
              </div>
            </button>
          );
        })}

      {/* Alerts status indicator (optional) */}
      <div className="absolute right-2 top-2 flex items-center gap-2 rounded bg-black/60 px-2 py-1 text-[10px] text-gray-300 md:right-4 md:top-4">
        <span
          className={`h-2 w-2 rounded-full ${
            socketConnected ? "bg-green-500" : "bg-gray-500"
          }`}
        />
        <span>
          Alerts: {alertsLoading ? "…" : alertsError ? "Error" : alerts.length}
        </span>
      </div>

      {/* Modal for sensor/alert actions */}
      {isModalOpen && selectedSensor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg border border-[#333] bg-[#111] p-5 shadow-xl">
            {/* Header */}
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  {selectedAlert ? (
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                  ) : (
                    <Crosshair className="h-5 w-5 text-[#4A9FD4]" />
                  )}
                  <h2 className="text-lg font-semibold text-white">
                    {selectedAlert ? "Active Alert" : "Sensor Details"}
                  </h2>
                </div>
                <p className="text-xs text-gray-400">
                  Sensor:{" "}
                  <span className="font-mono text-[#4A9FD4]">
                    {selectedSensor.sensorId}
                  </span>{" "}
                  • {selectedSensor.name}
                </p>
                {selectedAlert && (
                  <p className="text-[11px] text-gray-500">
                    {new Date(selectedAlert.createdAt).toLocaleString()}
                  </p>
                )}
              </div>

              <Badge
                className={`text-xs ${
                  selectedAlert
                    ? "bg-red-600"
                    : selectedSensor.status.toLowerCase() === "active"
                    ? "bg-green-600"
                    : "bg-gray-600"
                } text-white`}
              >
                {selectedAlert
                  ? selectedAlert.status
                  : selectedSensor.status || "Unknown"}
              </Badge>
            </div>

            {/* Body: Info */}
            <div className="mb-4 space-y-2 text-sm">
              {selectedAlert && (
                <p className="text-gray-200">{selectedAlert.message}</p>
              )}

              <div className="mt-3 rounded-md border border-[#333] bg-[#181818] p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <Crosshair className="h-3 w-3" />
                  Sensor Info
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Name:</span>{" "}
                    <span className="text-gray-200">{selectedSensor.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>{" "}
                    <span className="text-gray-200">
                      {selectedSensor.sensorType}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>{" "}
                    <span className="text-gray-200">
                      {selectedSensor.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Area:</span>{" "}
                    <span className="text-gray-200">
                      {/* @ts-ignore – if your Sensor type has area optional */}
                      {selectedSensor.area?.name || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-400">
                      {typeof selectedSensor.latitude === "number" &&
                      typeof selectedSensor.longitude === "number"
                        ? `${selectedSensor.latitude.toFixed(
                            5
                          )}, ${selectedSensor.longitude.toFixed(5)}`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drone selection */}
            <div className="mb-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Select Drone
              </p>

              {dronesLoading && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Loader2 className="h-3 w-3 animate-spin text-[#4A9FD4]" />
                  <span>Loading drones...</span>
                </div>
              )}

              {!dronesLoading && dronesError && (
                <p className="text-xs text-red-500">{dronesError}</p>
              )}

              {!dronesLoading && !dronesError && drones.length === 0 && (
                <p className="text-xs text-gray-500">
                  No drones configured yet.
                </p>
              )}

              {!dronesLoading && !dronesError && drones.length > 0 && (
                <Select
                  value={selectedDroneId}
                  onValueChange={setSelectedDroneId}
                >
                  <SelectTrigger className="h-9 border-[#444] bg-[#181818] text-xs text-white focus:ring-[#4A9FD4]">
                    <SelectValue placeholder="Select a drone to send" />
                  </SelectTrigger>
                  <SelectContent className="border-[#333] bg-[#181818] text-xs text-white">
                    {drones.map((drone) => (
                      <SelectItem
                        key={drone.id}
                        value={drone.id}
                        className="text-xs text-white focus:bg-[#333] focus:text-white"
                      >
                        {drone.droneOSName} ({drone.droneType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              {/* Neutralise only if there is an active alert */}
              {selectedAlert && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={handleNeutralise}
                  className="border-[#444] bg-transparent text-xs text-gray-200 hover:bg-[#333]"
                >
                  {actionLoading ? "Processing..." : "Neutralise"}
                </Button>
              )}
              <Button
                type="button"
                disabled={actionLoading || drones.length === 0}
                onClick={handleSendDrone}
                className="bg-[#2563EB] px-4 text-xs text-white hover:bg-[#1D4ED8] disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Sending...
                  </>
                ) : selectedAlert ? (
                  "Send Drone for Alert"
                ) : (
                  "Send Drone (Manual)"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={actionLoading}
                onClick={closeModal}
                className="border-[#444] bg-transparent text-xs text-gray-300 hover:bg-[#333]"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
