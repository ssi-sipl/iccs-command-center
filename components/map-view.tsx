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
const DRONE_LOCATION_TIMEOUT_MS = 5000;
const STALE_DATA_THRESHOLD_MS = 10000;
const CRITICAL_LOSS_THRESHOLD_MS = 12000;
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

  recovered?: boolean;

  hasEverReceivedTelemetry: boolean;
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
    {},
  );

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

  const droneTelemetryRef = useRef<Record<string, DroneTelemetry>>({});

  const [droneTelemetryData, setDroneTelemetryData] = useState<
    Record<string, DroneTelemetry>
  >({});

  const timeoutRefsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const statusUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [autoDispatchCountdown, setAutoDispatchCountdown] = useState<
    number | null
  >(null);
  const autoDispatchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [autoDispatchBlocked, setAutoDispatchBlocked] = useState<{
    sensor: Sensor;
    alert: Alert;
    reason: string;
  } | null>(null);

  const sensorsRef = useRef<Sensor[]>([]);
  const dronesRef = useRef<DroneOS[]>([]);

  const liveTelemetry = selectedDroneIdForTelemetry
    ? (droneTelemetryData[selectedDroneIdForTelemetry] ?? null)
    : null;

  useEffect(() => {
    droneTelemetryRef.current = droneTelemetryData;
  }, [droneTelemetryData]);

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
        const res = await getAllSensors({
          include: true,
          page: 1,
          limit: 10000, // or higher than max sensors you’ll ever have
        });

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
    sensorsRef.current = sensors;
  }, [sensors]);

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
              hasEverReceivedTelemetry: false, // 👈
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

  useEffect(() => {
    if (autoDispatchBlocked) {
      setModalOpen(false);
    }
  }, [autoDispatchBlocked]);

  useEffect(() => {
    dronesRef.current = drones;
  }, [drones]);

  const handleAlertDispatch = (alert: Alert) => {
    const sensor = sensorsRef.current.find((s) => s.id === alert.sensorDbId);
    if (!sensor || sensor.sendDrone !== "Yes") {
      return;
    }

    const dronesInArea = dronesRef.current.filter(
      (d) => d.areaId === sensor.areaId,
    );

    const flyingDrone = dronesInArea.find((d) => {
      const telemetry = droneTelemetryRef.current[d.id];

      return telemetry?.status === "on_air";
    });

    if (flyingDrone) {
      showAutoDispatchBlockedModal(
        sensor,
        alert,
        `Auto-dispatch is disabled because ${flyingDrone.droneOSName} is currently in the air. Please wait for the drone to land.`,
      );
      // neutraliseAlert(alert.id, "auto_skipped:drone_flying");
      return;
    }

    const availableDrone = dronesInArea.find((d) => {
      const telemetry = droneTelemetryRef.current[d.id];
      return telemetry?.status !== "on_air";
    });

    if (!availableDrone) {
      showAutoDispatchBlockedModal(
        sensor,
        alert,
        "No drones are currently available in this area. All drones are assigned to other missions.",
      );
      neutraliseAlert(alert.id, "auto_skipped:no_available_drone");
      return;
    }

    if (isDroneBusy(availableDrone.id)) {
      showAutoDispatchBlockedModal(
        sensor,
        alert,
        "Auto-dispatch blocked because the drone is currently flying or executing another mission.",
      );
      return;
    }

    startAutoDispatchCountdown(sensor, alert, availableDrone.id);
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

    s.on("drone_position", (pos: DronePosition) => {
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
      setDroneStatus((prev) => {
        const prevStatus = prev[telemetry.droneDbId];

        // 🔑 First-ever telemetry?
        const firstTelemetry = !prevStatus?.hasEverReceivedTelemetry;

        // 🔑 Arm timeout ONLY when telemetry exists
        if (firstTelemetry) {
          if (timeoutRefsRef.current[telemetry.droneDbId]) {
            clearTimeout(timeoutRefsRef.current[telemetry.droneDbId]);
          }

          timeoutRefsRef.current[telemetry.droneDbId] = setTimeout(() => {
            setDroneStatus((inner) => ({
              ...inner,
              [telemetry.droneDbId]: {
                ...inner[telemetry.droneDbId],
                isLive: false,
                connectionLossTime:
                  inner[telemetry.droneDbId].connectionLossTime ?? Date.now(),
              },
            }));
          }, DRONE_LOCATION_TIMEOUT_MS);
        }

        const wasLost =
          prevStatus?.connectionLossTime &&
          Date.now() - prevStatus.connectionLossTime > STALE_DATA_THRESHOLD_MS;

        return {
          ...prev,
          [telemetry.droneDbId]: {
            ...prevStatus,
            hasEverReceivedTelemetry: true,
            isLive: true,
            lastUpdateTime: telemetry.ts,
            connectionLossTime: undefined,
            isStale: false,
            hasAlert: false,
            recovered: Boolean(wasLost),
          },
        };
      });

      // Positions
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

      // Telemetry payload
      setDroneTelemetryData((prev) => ({
        ...prev,
        [telemetry.droneDbId]: telemetry,
      }));
    });

    s.on("connect", () => {
      setSocketConnected(true);
    });

    s.on("disconnect", () => {
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
      handleAlertDispatch(alert);
      setMarkerUpdateKey((k) => k + 1);
    });

    s.on("alert_created", (alert: Alert) => {
      setActiveAlerts((prev) => {
        if (prev.some((a) => a.id === alert.id)) return prev;
        return [alert, ...prev];
      });
      handleAlertDispatch(alert);
      setMarkerUpdateKey((k) => k + 1);
    });

    s.on("alert_resolved", (payload: { id: string; status: string }) => {
      setActiveAlerts((prev) => prev.filter((a) => a.id !== payload.id));
      setSelectedAlert((current) =>
        current && current.id === payload.id ? null : current,
      );
      setModalOpen((open) =>
        selectedAlert && selectedAlert.id === payload.id ? false : open,
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
      DRONE_STATUS_REFRESH_MS,
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

  function acknowledgeRecovery(droneId: string) {
    setDroneStatus((prev) => ({
      ...prev,
      [droneId]: {
        ...prev[droneId],
        recovered: false,
      },
    }));
  }

  const updateAllDroneStatuses = () => {
    setDroneStatus((prev) => {
      const now = Date.now();
      let hasChanges = false;
      const updated = { ...prev };

      Object.keys(updated).forEach((droneId) => {
        const drone = updated[droneId];

        // ⏱️ Telemetry timeout detection
        if (
          drone.hasEverReceivedTelemetry &&
          drone.isLive &&
          now - drone.lastUpdateTime > DRONE_LOCATION_TIMEOUT_MS
        ) {
          updated[droneId] = {
            ...drone,
            isLive: false,
            connectionLossTime: drone.connectionLossTime ?? now,
          };
          hasChanges = true;
        }
      });

      Object.keys(updated).forEach((droneId) => {
        const drone = updated[droneId];
        if (
          drone.hasEverReceivedTelemetry &&
          !drone.isLive &&
          drone.connectionLossTime
        ) {
          const timeLosses = now - drone.connectionLossTime;
          const wasStale = drone.isStale;
          const hadAlert = drone.hasAlert;

          const newIsStale = timeLosses > STALE_DATA_THRESHOLD_MS;
          const newHasAlert = timeLosses > CRITICAL_LOSS_THRESHOLD_MS;

          if (newHasAlert) {
            // Hard telemetry loss → invalidate mission visually
            setDroneTelemetryData((prev) => {
              const copy = { ...prev };
              if (copy[droneId]) {
                copy[droneId] = {
                  ...copy[droneId],
                  targetLat: null,
                  targetLng: null,
                  status: "ground", // or "unknown"
                };
              }
              return copy;
            });
          }

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
    if (autoDispatchBlocked) {
      // System state active → no user modal
      return;
    }
    const alert = alertBySensorDbId[sensor.id];
    setSelectedSensor(sensor);
    setSelectedAlert(alert ?? null);
    setSelectedDroneId("");
    setModalOpen(true);
  }

  function closeModal() {
    cancelAutoDispatch();
    setAutoDispatchBlocked(null);
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
    if (!selectedDroneId) {
      toast({
        title: "Select a drone",
        description: "Please choose a drone to dispatch.",
        variant: "destructive",
      });
      return;
    }

    if (isDroneBusy(selectedDroneId)) {
      toast({
        title: "Drone unavailable",
        description:
          "Drone is currently in the air. Wait until it reaches the target.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSensor) return;

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

  function isDroneBusy(droneId: string): boolean {
    // const telemetry = droneTelemetryData[droneId];
    // return telemetry?.status === "on_air";

    const telemetry = droneTelemetryData[droneId];
    const status = droneStatus[droneId];

    if (status?.recovered) return true;

    // 🚫 If telemetry explicitly says flying → block
    if (telemetry?.status === "on_air") return true;

    if (status?.hasEverReceivedTelemetry && !status?.isLive) return true;

    // ✅ Otherwise ALWAYS allow command
    return false;
  }

  function showAutoDispatchBlockedModal(
    sensor: Sensor,
    alert: Alert,
    reason: string,
  ) {
    setAutoDispatchBlocked({ sensor, alert, reason });
  }

  function startAutoDispatchCountdown(
    sensor: Sensor,
    alert: Alert,
    droneId: string,
  ) {
    const telemetry = droneTelemetryRef.current[droneId];
    if (telemetry?.status === "on_air") {
      showAutoDispatchBlockedModal(
        sensor,
        alert,
        "Drone is currently flying. Auto-dispatch aborted.",
      );
      return;
    }
    // Open modal with everything pre-filled
    setSelectedSensor(sensor);
    setSelectedAlert(alert);
    setSelectedDroneId(droneId);
    setModalOpen(true);

    // Clear any existing timer
    if (autoDispatchTimerRef.current) {
      clearInterval(autoDispatchTimerRef.current);
    }

    let remaining = 5; // seconds
    setAutoDispatchCountdown(remaining);

    autoDispatchTimerRef.current = setInterval(async () => {
      remaining -= 1;
      setAutoDispatchCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(autoDispatchTimerRef.current!);
        autoDispatchTimerRef.current = null;
        setAutoDispatchCountdown(null);

        // Safety check: verify drone is not flying before dispatch
        const droneStatus = droneTelemetryData[droneId];
        if (droneStatus?.status === "on_air") {
          closeModal();
          return;
        }

        try {
          setActionLoading(true);

          await sendDrone({
            droneDbId: droneId,
            sensorId: sensor.sensorId,
            alertId: alert.id,
            targetLatitude: sensor.latitude,
            targetLongitude: sensor.longitude,
          });

          toast({
            title: "Drone auto-dispatched",
            description: `Drone sent automatically for alert ${alert.id}`,
          });

          closeModal();
        } catch (err) {
          toast({
            title: "Auto-dispatch failed",
            description:
              err instanceof Error ? err.message : "Failed to auto-send drone",
            variant: "destructive",
          });
        } finally {
          setActionLoading(false);
        }
      }
    }, 1000);
  }

  function cancelAutoDispatch() {
    if (autoDispatchTimerRef.current) {
      clearInterval(autoDispatchTimerRef.current);
      autoDispatchTimerRef.current = null;
    }
    setAutoDispatchCountdown(null);

    toast({
      title: "Auto-dispatch cancelled",
      description: "Drone was not sent automatically.",
    });
  }

  const handleNeutralise = async () => {
    if (!selectedAlert) return;

    try {
      setActionLoading(true);
      const res = await neutraliseAlert(
        selectedAlert.id,
        "Neutralised from map",
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
      {autoDispatchBlocked && (
        <div className="fixed top-4 left-1/2 z-50 w-[90%] max-w-2xl -translate-x-1/2 rounded-lg border border-red-700 bg-red-950/90 p-4 shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-red-300">
                🚫 Auto-dispatch blocked
              </div>

              <div className="mt-1 text-xs text-red-200">
                {autoDispatchBlocked.reason}
              </div>

              <div className="mt-2 text-[11px] text-red-300">
                Sensor: {autoDispatchBlocked.sensor.name} (
                {autoDispatchBlocked.sensor.sensorId})
              </div>

              <div className="text-[11px] text-red-300">
                Alert ID: {autoDispatchBlocked.alert.id}
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="border-red-500 text-red-300 hover:bg-red-900/40"
              onClick={() => setAutoDispatchBlocked(null)}
            >
              Acknowledge
            </Button>
          </div>
        </div>
      )}

      <MapRenderer
        mapConfig={mapConfig}
        sensors={sensors}
        drones={drones}
        alertBySensorDbId={alertBySensorDbId}
        dronePositions={dronePositions}
        droneStatus={droneStatus}
        droneTelemetryData={droneTelemetryData}
        currentZoom={currentZoom}
        socketConnected={socketConnected}
        markerUpdateKey={markerUpdateKey}
        onZoomChange={setCurrentZoom}
        onSensorClick={openSensorModal}
        onDroneMarkerClick={handleDroneMarkerClick}
      />

      <Dialog
        open={modalOpen && autoDispatchBlocked === null}
        onOpenChange={(open) => {
          if (!open && !autoDispatchBlocked) {
            closeModal();
          }
        }}
      >
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

          {autoDispatchBlocked && (
            <div className="rounded-md border border-red-700 bg-red-950/40 p-4">
              <div className="text-sm font-semibold text-red-300">
                🚫 Auto-dispatch blocked
              </div>

              <div className="mt-2 text-xs text-red-200">
                {autoDispatchBlocked.reason}
              </div>

              <div className="mt-3 text-[11px] text-red-300">
                Sensor: {autoDispatchBlocked.sensor.name} (
                {autoDispatchBlocked.sensor.sensorId})
              </div>

              <div className="mt-1 text-[11px] text-red-300">
                Alert ID: {autoDispatchBlocked.alert.id}
              </div>
            </div>
          )}

          {autoDispatchCountdown !== null && (
            <div className="rounded-md border border-amber-500 bg-amber-950/40 p-3 text-xs text-amber-200">
              🚨 Auto-dispatching drone in{" "}
              <span className="font-bold">{autoDispatchCountdown}s</span>
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-500 text-amber-300 hover:bg-amber-900/40 bg-transparent"
                  onClick={cancelAutoDispatch}
                >
                  Cancel Auto Send
                </Button>
              </div>
            </div>
          )}

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
                  <div className="space-y-2">
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
                      {dronesInSameArea.map((drone) => {
                        const telemetry = droneTelemetryData[drone.id];
                        const status = droneStatus[drone.id];

                        let availabilityLabel = "● Ready";

                        if (telemetry?.status === "on_air") {
                          availabilityLabel = "✈ In Flight";
                        } else if (status?.recovered) {
                          availabilityLabel = "⚠ Telemetry Recovering";
                        } else if (!status?.hasEverReceivedTelemetry) {
                          availabilityLabel = "● Ready";
                        } else if (!status?.isLive) {
                          availabilityLabel = "○ Link Unavailable";
                        } else if (telemetry?.status === "reached") {
                          availabilityLabel = "🎯 At Target";
                        }

                        return (
                          <option
                            key={drone.id}
                            value={drone.id}
                            disabled={isDroneBusy(drone.id)}
                            className="bg-[#111] text-gray-100"
                          >
                            {drone.droneOSName} · {drone.droneType} —{" "}
                            {availabilityLabel}
                          </option>
                        );
                      })}
                    </select>

                    {selectedDroneId && isDroneBusy(selectedDroneId) && (
                      <div className="rounded-md border border-amber-700 bg-amber-950/30 p-2 text-xs text-amber-200 flex items-center gap-2">
                        <span>⚠️</span>
                        <span>
                          {droneTelemetryData[selectedDroneId]?.status ===
                          "on_air"
                            ? "This drone is currently in the air. Please wait for it to land."
                            : "This drone is executing another mission."}
                        </span>
                      </div>
                    )}
                  </div>
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
                drones.length === 0 ||
                (selectedDroneId && isDroneBusy(selectedDroneId))
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
