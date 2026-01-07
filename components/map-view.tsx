"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import "leaflet/dist/leaflet.css";
import io, { type Socket } from "socket.io-client";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getActiveAlerts, neutraliseAlert, type Alert } from "@/lib/api/alerts";
import { getAllSensors, type Sensor } from "@/lib/api/sensors";
import { getAllDroneOS, type DroneOS } from "@/lib/api/droneos";
import { useToast } from "@/hooks/use-toast";
import { getActiveMap, type OfflineMap } from "@/lib/api/maps";
import { openRtspBySensor } from "@/lib/api/rtsp";
import { sendDrone } from "@/lib/api/droneCommand";
import MapRenderer from "@/components/map-renderer";
import {
  TelemetryWindow,
  type DroneTelemetry,
} from "@/components/telemetry-window";
import { useRouter } from "next/navigation";
import { Badge } from "./ui/badge";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const REACH_RADIUS_METERS = 6;
const DRONE_LOCATION_TIMEOUT_MS = 30000;
const STALE_DATA_THRESHOLD_MS = 60000;
const CRITICAL_LOSS_THRESHOLD_MS = 120000;
const DRONE_STATUS_REFRESH_MS = 5000;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ZOOM_SCALE_CONFIG = {
  minZoom: 10,
  maxZoom: 40,
  minSize: 18,
  maxSize: 48,
};

function calculateMarkerSize(zoom: number): number {
  const { minZoom, maxZoom, minSize, maxSize } = ZOOM_SCALE_CONFIG;
  const normalizedZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
  const progress = (normalizedZoom - minZoom) / (maxZoom - minZoom);
  return Math.round(minSize + (maxSize - minSize) * progress);
}

type DronePosition = {
  id: string;
  droneId: string;
  lat: number;
  lng: number;
  alt?: number | null;
  ts: number;
};

type DroneStatus = {
  id: string;
  droneId: string;
  isLive: boolean;
  lastUpdateTime: number;
  connectionLossTime?: number;
  isStale: boolean;
  hasAlert: boolean;
};

type ActiveMission = {
  droneId: string;
  sensorId: string;
  targetLat: number;
  targetLng: number;
};

export function MapView() {
  const { toast } = useToast();
  const router = useRouter();
  const CLICK_DELAY_MS = 250;
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [mapConfig, setMapConfig] = useState<OfflineMap | null>(null);
  const [currentZoom, setCurrentZoom] = useState(18);
  const [dronePositions, setDronePositions] = useState<
    Record<string, DronePosition>
  >({});
  const [droneStatus, setDroneStatus] = useState<Record<string, DroneStatus>>(
    {}
  );
  const [activeMissions, setActiveMissions] = useState<
    Record<string, ActiveMission>
  >({});

  const [loadingMapConfig, setLoadingMapConfig] = useState(true);
  const [loadingSensors, setLoadingSensors] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [loadingDrones, setLoadingDrones] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [drones, setDrones] = useState<DroneOS[]>([]);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedDroneId, setSelectedDroneId] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  const [markerUpdateKey, setMarkerUpdateKey] = useState(0);

  const [telemetryWindowOpen, setTelemetryWindowOpen] = useState(false);
  const [selectedDroneIdForTelemetry, setSelectedDroneIdForTelemetry] =
    useState<string | null>(null);

  const [droneTelemetryData, setDroneTelemetryData] = useState<
    Record<string, DroneTelemetry>
  >({});

  const timeoutRefsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const statusUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const liveTelemetry = selectedDroneIdForTelemetry
    ? droneTelemetryData[selectedDroneIdForTelemetry] ?? null
    : null;

  useEffect(() => {
    const fetchActiveMap = async () => {
      setLoadingMapConfig(true);
      try {
        const res = await getActiveMap();
        if (res.success && res.data) {
          setMapConfig(res.data);
          setCurrentZoom(res.data.minZoom);
        } else {
          setError(res.error || "No active offline map configured");
        }
      } catch (err) {
        console.error("Error loading active map:", err);
        setError("Failed to load active map");
      } finally {
        setLoadingMapConfig(false);
      }
    };

    fetchActiveMap();
  }, []);

  useEffect(() => {
    const loadSensors = async () => {
      setLoadingSensors(true);
      try {
        const res = await getAllSensors({ include: true });
        if (res.success && res.data) {
          setSensors(res.data);
        } else {
          toast({
            title: "Error",
            description: res.error || "Failed to load sensors",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Error loading sensors:", err);
        toast({
          title: "Error",
          description: "Failed to load sensors",
          variant: "destructive",
        });
      } finally {
        setLoadingSensors(false);
      }
    };

    loadSensors();
  }, [toast]);

  useEffect(() => {
    const loadDrones = async () => {
      setLoadingDrones(true);
      try {
        const res = await getAllDroneOS({ include: true });
        if (res.success && res.data) {
          setDrones(res.data);
          const initialStatus: Record<string, DroneStatus> = {};
          const initialPositions: Record<string, DronePosition> = {};

          res.data.forEach((drone) => {
            initialStatus[drone.id] = {
              id: drone.id,
              droneId: drone.droneId,
              isLive: false,
              lastUpdateTime: 0,
              isStale: false,
              hasAlert: false,
            };

            if (drone.latitude != null && drone.longitude != null) {
              initialPositions[drone.id] = {
                id: drone.id,
                droneId: drone.droneId,
                lat: drone.latitude,
                lng: drone.longitude,
                alt: null,
                ts: Date.now(),
              };
            }
          });

          setDroneStatus(initialStatus);
          setDronePositions(initialPositions);
        }
      } catch (err) {
        console.error("[MapView] Error loading drones:", err);
        toast({
          title: "Error",
          description: "Failed to load drones",
          variant: "destructive",
        });
      } finally {
        setLoadingDrones(false);
      }
    };

    loadDrones();
  }, [toast]);

  const setDroneLocationTimeout = (droneId: string) => {
    if (timeoutRefsRef.current[droneId]) {
      clearTimeout(timeoutRefsRef.current[droneId]);
    }

    timeoutRefsRef.current[droneId] = setTimeout(() => {
      console.log(`[MapView] Drone ${droneId} location update timeout`);

      setDroneStatus((prev) => {
        const updated = { ...prev };
        const drone = updated[droneId];
        const connectionLossTime = drone.connectionLossTime || Date.now();

        return {
          ...prev,
          [droneId]: {
            ...prev[droneId],
            isLive: false,
            connectionLossTime,
          },
        };
      });
    }, DRONE_LOCATION_TIMEOUT_MS);
  };

  useEffect(() => {
    const loadAlerts = async () => {
      setLoadingAlerts(true);
      try {
        const res = await getActiveAlerts();
        if (res.success && res.data) {
          setActiveAlerts(res.data);
        } else {
          toast({
            title: "Error",
            description: res.error || "Failed to load active alerts",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Error loading active alerts:", err);
        toast({
          title: "Error",
          description: "Failed to load active alerts",
          variant: "destructive",
        });
      } finally {
        setLoadingAlerts(false);
      }
    };

    loadAlerts();

    const s = io(API_BASE_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    s.on(
      "mission_started",
      (payload: {
        droneId: string;
        sensorId: string | null;
        targetLat: number;
        targetLng: number;
      }) => {
        console.log("🎯 Mission started:", payload);

        setActiveMissions((prev) => ({
          ...prev,
          [payload.droneId]: {
            droneId: payload.droneId,
            sensorId: payload.sensorId ?? "",
            targetLat: payload.targetLat,
            targetLng: payload.targetLng,
          },
        }));

        setMarkerUpdateKey((k) => k + 1);
      }
    );

    s.on("drone_position", (pos: DronePosition) => {
      console.log("[MapView] Received drone position:", pos);

      setDronePositions((prev) => ({
        ...prev,
        [pos.id]: pos,
      }));

      setDroneStatus((prev) => ({
        ...prev,
        [pos.id]: {
          ...prev[pos.id],
          isLive: true,
          lastUpdateTime: Date.now(),
          connectionLossTime: undefined,
          isStale: false,
          hasAlert: false,
        },
      }));
    });

    s.on("drone_telemetry", (telemetry: DroneTelemetry) => {
      console.log("[MapView] Received drone telemetry:", telemetry);

      setDronePositions((prev) => ({
        ...prev,
        [telemetry.droneDbId]: {
          id: telemetry.droneDbId,
          droneId: telemetry.droneId,
          lat: telemetry.lat,
          lng: telemetry.lng,
          alt: telemetry.alt,
          ts: telemetry.ts,
        },
      }));

      setDroneStatus((prev) => ({
        ...prev,
        [telemetry.droneDbId]: {
          ...prev[telemetry.droneDbId],
          isLive: true,
          lastUpdateTime: telemetry.ts,
          connectionLossTime: undefined,
          isStale: false,
          hasAlert: false,
        },
      }));

      setDroneTelemetryData((prev) => ({
        ...prev,
        [telemetry.droneDbId]: telemetry,
      }));

      setDroneTelemetryData((prev) => ({
        ...prev,
        [telemetry.droneDbId]: telemetry,
      }));
    });

    s.on("connect", () => {
      console.log("[MapView] Socket connected", s.id);
      setSocketConnected(true);
    });

    s.on("disconnect", () => {
      console.log("[MapView] Socket disconnected");
      setSocketConnected(false);

      setDroneStatus((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((droneId) => {
          updated[droneId] = {
            ...updated[droneId],
            isLive: false,
            connectionLossTime: Date.now(),
            isStale: true,
            hasAlert: true,
          };
        });
        return updated;
      });
      Object.values(timeoutRefsRef.current).forEach(clearTimeout);
      timeoutRefsRef.current = {};
      setMarkerUpdateKey((k) => k + 1);
    });

    s.on("alert_active", (alert: Alert) => {
      setActiveAlerts((prev) => {
        if (prev.some((a) => a.id === alert.id)) return prev;
        return [alert, ...prev];
      });
      setMarkerUpdateKey((k) => k + 1);
    });

    s.on("alert_created", (alert: Alert) => {
      setActiveAlerts((prev) => {
        if (prev.some((a) => a.id === alert.id)) return prev;
        return [alert, ...prev];
      });
      setMarkerUpdateKey((k) => k + 1);
    });

    s.on("alert_resolved", (payload: { id: string; status: string }) => {
      setActiveAlerts((prev) => prev.filter((a) => a.id !== payload.id));
      setSelectedAlert((current) =>
        current && current.id === payload.id ? null : current
      );
      setModalOpen((open) =>
        selectedAlert && selectedAlert.id === payload.id ? false : open
      );
      setMarkerUpdateKey((k) => k + 1);
    });

    s.on("alert_updated", (alert: Alert) => {
      setActiveAlerts((prev) => {
        const filtered = prev.filter((a) => a.id !== alert.id);
        if (alert.status === "ACTIVE") return [alert, ...filtered];
        return filtered;
      });
      setSelectedAlert((prev) => {
        if (!prev) return prev;
        if (prev.id !== alert.id) return prev;
        return alert.status === "ACTIVE" ? alert : null;
      });
      setMarkerUpdateKey((k) => k + 1);
    });

    setSocket(s);

    statusUpdateIntervalRef.current = setInterval(
      updateAllDroneStatuses,
      DRONE_STATUS_REFRESH_MS
    );

    return () => {
      s.disconnect();
      if (statusUpdateIntervalRef.current) {
        clearInterval(statusUpdateIntervalRef.current);
      }
      Object.values(timeoutRefsRef.current).forEach(clearTimeout);
      timeoutRefsRef.current = {};
    };
  }, []);

  const updateAllDroneStatuses = () => {
    setDroneStatus((prev) => {
      const now = Date.now();
      let hasChanges = false;
      const updated = { ...prev };

      Object.keys(updated).forEach((droneId) => {
        const drone = updated[droneId];
        if (!drone.isLive && drone.connectionLossTime) {
          const timeLosses = now - drone.connectionLossTime;
          const wasStale = drone.isStale;
          const hadAlert = drone.hasAlert;

          const newIsStale = timeLosses > STALE_DATA_THRESHOLD_MS;
          const newHasAlert = timeLosses > CRITICAL_LOSS_THRESHOLD_MS;

          if (wasStale !== newIsStale || hadAlert !== newHasAlert) {
            updated[droneId] = {
              ...drone,
              isStale: newIsStale,
              hasAlert: newHasAlert,
            };
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        setMarkerUpdateKey((k) => k + 1);
      }

      return hasChanges ? updated : prev;
    });
  };

  useEffect(() => {
    console.log("🛰 Drone Positions:", dronePositions);
    console.log("📊 Drone Status:", droneStatus);
    console.log("🎯 Active Missions:", activeMissions);
  }, [dronePositions, droneStatus, activeMissions]);

  const dronesInSameArea = useMemo(() => {
    if (!selectedSensor) return [];

    return drones.filter((drone) => {
      // CASE 1: both use areaId directly
      if (drone.areaId && selectedSensor.areaId) {
        return drone.areaId === selectedSensor.areaId;
      }

      // CASE 2: nested area object
      // if (drone.area?.id && selectedSensor.area?.id) {
      //   return drone.area.id === selectedSensor.area.id;
      // }

      return false;
    });
  }, [drones, selectedSensor]);

  const alertBySensorDbId = useMemo(() => {
    const map: Record<string, Alert> = {};
    for (const alert of activeAlerts) {
      if (alert.status === "ACTIVE") {
        map[alert.sensorDbId] = alert;
      }
    }
    return map;
  }, [activeAlerts]);

  function openSensorModal(sensor: Sensor) {
    const alert = alertBySensorDbId[sensor.id];
    setSelectedSensor(sensor);
    setSelectedAlert(alert ?? null);
    setSelectedDroneId("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedSensor(null);
    setSelectedAlert(null);
    setSelectedDroneId("");
    setActionLoading(false);
  }

  function handleDroneMarkerClick(droneDbId: string, e?: MouseEvent) {
    // Ctrl / Cmd + click → open in new tab
    if (e?.ctrlKey || e?.metaKey) {
      window.open(`/drones/${droneDbId}`, "_blank");
      return;
    }

    // Double click → navigate
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      router.push(`/drones/${droneDbId}`);
      return;
    }

    // Single click → open telemetry (delay to detect double click)
    clickTimeoutRef.current = setTimeout(() => {
      setSelectedDroneIdForTelemetry(droneDbId);
      setTelemetryWindowOpen(true);
      clickTimeoutRef.current = null;
    }, CLICK_DELAY_MS);
  }

  function closeTelemetryWindow() {
    setTelemetryWindowOpen(false);
    setSelectedDroneIdForTelemetry(null);
  }

  async function handleDropPayload() {
    if (!selectedDroneIdForTelemetry) return;
    toast({
      title: "Payload dropped",
      description: `Payload dropped for drone ${selectedDroneIdForTelemetry}`,
    });
  }

  async function handleRecall() {
    if (!selectedDroneIdForTelemetry) return;
    toast({
      title: "Recall initiated",
      description: `Recall command sent to ${selectedDroneIdForTelemetry}`,
    });
  }

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

    const { latitude, longitude } = selectedSensor;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      toast({
        title: "Invalid target location",
        description: "Sensor coordinates are missing or invalid.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);

    try {
      const res = await sendDrone({
        droneDbId: selectedDroneId,
        sensorId: selectedSensor.sensorId,
        alertId: selectedAlert?.id,
        targetLatitude: latitude,
        targetLongitude: longitude,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to send drone");
      }

      toast({
        title: "Drone dispatched",
        description: selectedAlert
          ? `Drone sent for alert (Flight ID: ${res.flightId})`
          : `Drone sent for manual mission (Flight ID: ${res.flightId})`,
      });

      closeModal();
    } catch (err) {
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
  };

  const handleNeutralise = async () => {
    if (!selectedAlert) return;

    try {
      setActionLoading(true);
      const res = await neutraliseAlert(
        selectedAlert.id,
        "Neutralised from map"
      );
      if (res.success) {
        toast({
          title: "Alert neutralised",
          description: "Alert has been marked as neutralised.",
        });
        closeModal();
      } else {
        toast({
          title: "Error",
          description: res.error || "Failed to neutralise alert",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error neutralising alert:", err);
      toast({
        title: "Error",
        description: "Failed to neutralise alert",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenVideoFeed = async () => {
    if (!selectedSensor) return;

    if (!("rtspUrl" in selectedSensor) || !selectedSensor.rtspUrl) {
      toast({
        title: "No RTSP configured",
        description: "This sensor has no RTSP URL configured in the backend.",
        variant: "destructive",
      });
      return;
    }

    try {
      setActionLoading(true);
      const res = await openRtspBySensor(selectedSensor.id);

      if (res && res.success) {
        const extra = res.data
          ? ` ${res.data.pid ? `(pid ${res.data.pid})` : ""}`
          : "";
        toast({
          title: "Video Feed launched",
          description:
            res.message || `Launched video on server.${extra}`.trim(),
        });
      } else {
        const msg =
          (res && (res.error || (res.details && String(res.details)))) ||
          "Server could not launch the video feed.";
        toast({
          title: "Failed to launch video",
          description: msg,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error opening RTSP:", err);
      toast({
        title: "Network / Server error",
        description:
          err instanceof Error ? err.message : "Unable to reach backend.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const center: [number, number] | null =
    mapConfig != null
      ? [
          (mapConfig.north + mapConfig.south) / 2,
          (mapConfig.east + mapConfig.west) / 2,
        ]
      : null;

  const isLoading = loadingMapConfig || loadingSensors || loadingAlerts;

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#111]">
        <p className="text-sm text-gray-400">Loading map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#111] px-4 text-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!mapConfig || !center) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#111] px-4 text-center">
        <p className="text-sm text-gray-400">
          No active offline map configured. Go to{" "}
          <span className="font-mono">/maps/manage</span> and create / activate
          one.
        </p>
      </div>
    );
  }

  const goToSensor = (sensorId: string) => {
    router.push(`/sensors/${sensorId}`);
  };

  function goToDronePage(droneDbId: string) {
    router.push(`/drones/${droneDbId}`);
  }

  return (
    <>
      <MapRenderer
        mapConfig={mapConfig}
        sensors={sensors}
        drones={drones}
        alertBySensorDbId={alertBySensorDbId}
        dronePositions={dronePositions}
        droneStatus={droneStatus}
        activeMissions={activeMissions}
        currentZoom={currentZoom}
        socketConnected={socketConnected}
        markerUpdateKey={markerUpdateKey}
        onZoomChange={setCurrentZoom}
        onSensorClick={openSensorModal}
        onDroneMarkerClick={handleDroneMarkerClick}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-[#333] bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle
              onClick={() => goToSensor(selectedSensor?.id || "")}
              className="text-lg font-semibold hover:cursor-pointer hover:underline"
            >
              {selectedSensor ? selectedSensor.name : "Sensor"}
            </DialogTitle>
            <div className="flex items-center space-x-4">
              <DialogDescription className="text-xs text-gray-400">
                {selectedSensor?.sensorId} ·{" "}
                {selectedSensor?.sensorType || "Unknown type"}
              </DialogDescription>
              <Badge
                className={`w-fit px-2 rounded-xl ${
                  selectedSensor?.addedBy.toLowerCase()
                    ? "bg-yellow-400 text-black "
                    : "bg-red-600/20 text-red-400 hover:bg-red-600/30 "
                }`}
              >
                {selectedSensor?.addedBy || "N/A"}
              </Badge>
            </div>
          </DialogHeader>

          {selectedSensor && (
            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-md border border-[#333] bg-[#1a1a1a] p-3">
                <div className="flex justify-between text-xs text-gray-300">
                  <span>
                    Lat: {selectedSensor.latitude.toFixed(5)}, Lon:{" "}
                    {selectedSensor.longitude.toFixed(5)}
                  </span>
                  <span>Status: {selectedSensor.status}</span>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Area: {selectedSensor.area?.name || "Unassigned"}
                </div>
              </div>

              {selectedAlert ? (
                <div className="rounded-md border border-red-700 bg-red-950/40 p-3">
                  <div className="text-xs font-semibold text-red-300">
                    Active Alert
                  </div>
                  <div className="mt-1 text-sm text-red-100">
                    {selectedAlert.message}
                  </div>
                  <div className="mt-2 text-[11px] text-red-200">
                    Created at:{" "}
                    {new Date(selectedAlert.createdAt).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-[#333] bg-[#18181b] p-3 text-xs text-gray-300">
                  No active alert on this sensor.
                  <br />
                  You can still manually dispatch a drone from here.
                </div>
              )}

              <div className="space-y-2">
                <div className="text-xs text-gray-300">
                  Select Drone to Dispatch:
                </div>

                {loadingDrones ? (
                  <div className="flex items-center gap-2 rounded-md border border-[#333] bg-[#111] p-2 text-xs text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Loading drones...</span>
                  </div>
                ) : dronesInSameArea.length === 0 ? (
                  <div className="rounded-md border border-amber-700 bg-amber-950/40 p-3 text-xs text-amber-200">
                    No drones available in this sensor's area.
                  </div>
                ) : (
                  <select
                    value={selectedDroneId}
                    onChange={(e) => {
                      setSelectedDroneId(e.target.value);
                    }}
                    disabled={actionLoading}
                    className="h-9 w-full rounded-md border border-[#333] bg-[#111] px-3 text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="" className="bg-[#111] text-gray-400">
                      Select a drone
                    </option>
                    {dronesInSameArea.map((drone) => (
                      <option
                        key={drone.id}
                        value={drone.id}
                        className="bg-[#111] text-gray-100"
                      >
                        {drone.droneOSName} · {drone.droneType}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
            {selectedAlert && (
              <Button
                type="button"
                variant="outline"
                className="border-red-700 bg-transparent text-red-400 hover:bg-red-900/30 hover:text-red-200"
                disabled={actionLoading}
                onClick={handleNeutralise}
              >
                Neutralise Alert
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              className="border-[#333] bg-[#111] text-white hover:bg-[#222]"
              onClick={handleOpenVideoFeed}
              disabled={
                actionLoading ||
                !selectedSensor ||
                !("rtspUrl" in (selectedSensor || {})) ||
                !selectedSensor?.rtspUrl
              }
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Launching...
                </>
              ) : (
                "Video Feed"
              )}
            </Button>

            <Button
              type="button"
              className="bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-50"
              disabled={
                actionLoading ||
                !selectedSensor ||
                !selectedDroneId ||
                drones.length === 0
              }
              onClick={handleSendDrone}
            >
              {selectedAlert ? "Send Drone for Alert" : "Send Drone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TelemetryWindow
        telemetry={liveTelemetry}
        isOpen={telemetryWindowOpen}
        onClose={closeTelemetryWindow}
        onDropPayload={handleDropPayload}
        onRecall={handleRecall}
      />
    </>
  );
}
