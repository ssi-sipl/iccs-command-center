"use client";

import { useEffect, useMemo, useState } from "react";
import type { Map as LeafletMap, DivIcon } from "leaflet";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getActiveAlerts,
  neutraliseAlert,
  sendDroneForAlert,
  type Alert,
} from "@/lib/api/alerts";
import { getAllSensors, type Sensor } from "@/lib/api/sensors";
import { getAllDroneOS, type DroneOS } from "@/lib/api/droneos";
import { useToast } from "@/hooks/use-toast";
import { getActiveMap, OfflineMap } from "@/lib/api/maps";
import { openRtspBySensor } from "@/lib/api/rtsp";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let reactLeaflet: typeof import("react-leaflet") | null = null;
let LeafletLib: typeof import("leaflet") | null = null;

// Only run in the browser
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  reactLeaflet = require("react-leaflet");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  LeafletLib = require("leaflet");
}

type ReactLeafletModule = typeof import("react-leaflet");

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function MapView() {
  const { toast } = useToast();

  const [reactLeaflet, setReactLeaflet] = useState<ReactLeafletModule | null>(
    null
  );
  const [mapConfig, setMapConfig] = useState<OfflineMap | null>(null);
  const [leafletMap, setLeafletMap] = useState<LeafletMap | null>(null);

  const [loadingLib, setLoadingLib] = useState(true);
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

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedDroneId, setSelectedDroneId] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  // Force re-render counter to update marker icons
  const [markerUpdateKey, setMarkerUpdateKey] = useState(0);

  // ============================================
  // Dynamic import react-leaflet (client only)
  // ============================================
  useEffect(() => {
    let cancelled = false;

    async function loadReactLeaflet() {
      try {
        const mod = await import("react-leaflet");
        if (!cancelled) setReactLeaflet(mod);
      } catch (err) {
        console.error("Failed to load react-leaflet:", err);
        if (!cancelled) setError("Failed to load map library");
      } finally {
        if (!cancelled) setLoadingLib(false);
      }
    }

    if (typeof window !== "undefined") {
      loadReactLeaflet();
    } else {
      setLoadingLib(false);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================
  // Fetch active map config
  // ============================================
  useEffect(() => {
    const fetchActiveMap = async () => {
      setLoadingMapConfig(true);
      try {
        const res = await getActiveMap();
        if (res.success && res.data) {
          setMapConfig(res.data);
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

  // ============================================
  // Fetch sensors
  // ============================================
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

  // ============================================
  // Fetch drones
  // ============================================
  useEffect(() => {
    const loadDrones = async () => {
      setLoadingDrones(true);
      try {
        const res = await getAllDroneOS();
        if (res.success && res.data) setDrones(res.data);
      } catch (err) {
        console.error("Error loading drones:", err);
      } finally {
        setLoadingDrones(false);
      }
    };

    loadDrones();
  }, [toast]);

  // ============================================
  // Fetch active alerts + WebSocket subscription
  // ============================================
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

    // Setup socket
    const s = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      console.log("[MapView] Socket connected", s.id);
      setSocketConnected(true);
    });

    s.on("disconnect", () => {
      console.log("[MapView] Socket disconnected");
      setSocketConnected(false);
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

    return () => {
      s.disconnect();
    };
  }, [toast]);

  // ============================================
  // Derived: map alert by sensorDbId
  // ============================================
  const alertBySensorDbId = useMemo(() => {
    const map: Record<string, Alert> = {};
    for (const alert of activeAlerts) {
      if (alert.status === "ACTIVE") {
        map[alert.sensorDbId] = alert;
      }
    }
    return map;
  }, [activeAlerts]);

  // ============================================
  // Sensor marker styling
  // ============================================
  function getSensorBaseColor(sensorType: string): string {
    const t = sensorType.toLowerCase();
    if (t.includes("camera")) return "#3b82f6"; // blue
    if (t.includes("thermal")) return "#f97316"; // orange
    if (t.includes("infrared") || t.includes("pir")) return "#a855f7"; // purple
    if (t.includes("motion")) return "#22c55e"; // green
    return "#9ca3af"; // gray
  }

  function getSensorIcon(sensor: Sensor, hasActiveAlert: boolean): DivIcon {
    if (!LeafletLib) {
      // @ts-ignore
      return {} as DivIcon;
    }

    const L = LeafletLib;

    const baseColor = getSensorBaseColor(sensor.sensorType);
    const bg = hasActiveAlert ? "#b91c1c" : baseColor; // 🔴 red if alert
    const border = hasActiveAlert ? "#fecaca" : "#0f172a";

    const t = sensor.sensorType.toLowerCase();
    let label = "S";
    if (t.includes("camera")) label = "C";
    else if (t.includes("thermal")) label = "T";
    else if (t.includes("infrared") || t.includes("pir")) label = "P";
    else if (t.includes("motion")) label = "M";

    const html = `
    <div
      style="
        width: 22px;
        height: 22px;
        border-radius: 9999px;
        background: ${bg};
        border: 2px solid ${border};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: 600;
        box-shadow: 0 0 6px rgba(0,0,0,0.6);
      "
    >
      ${label}
    </div>
  `;

    return L.divIcon({
      html,
      className: "",
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
  }

  // ============================================
  // Modal open/close from marker click
  // ============================================
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

  // ============================================
  // Modal actions: send drone / neutralise
  // ============================================
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

    if (selectedAlert && selectedAlert.status === "ACTIVE") {
      try {
        setActionLoading(true);
        const res = await sendDroneForAlert(selectedAlert.id, selectedDroneId);
        if (res.success) {
          toast({
            title: "Drone dispatched",
            description: `Drone mission started for ${selectedSensor.name}`,
          });
          closeModal();
        } else {
          toast({
            title: "Error",
            description: res.error || "Failed to send drone",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Error sending drone for alert:", err);
        toast({
          title: "Error",
          description: "Failed to send drone",
          variant: "destructive",
        });
      } finally {
        setActionLoading(false);
      }
    } else {
      toast({
        title: "Manual dispatch (stub)",
        description:
          "UI action is working, wire this to a manual mission endpoint on the backend.",
      });
      closeModal();
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

  // ============================================
  // RTSP handlers (calls lib/api/rtsp)
  // ============================================
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
        // friendly success with available info
        const extra = res.data
          ? ` ${res.data.pid ? `(pid ${res.data.pid})` : ""}`
          : "";
        toast({
          title: "Video Feed launched",
          description:
            res.message || `Launched video on server.${extra}`.trim(),
        });
      } else {
        // server responded but unsuccessful
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
      // network or unexpected error
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

  // ============================================
  // Center calculation from map bounds
  // ============================================
  const center: [number, number] | null =
    mapConfig != null
      ? [
          (mapConfig.north + mapConfig.south) / 2,
          (mapConfig.east + mapConfig.west) / 2,
        ]
      : null;

  const isLoading =
    loadingLib || loadingMapConfig || loadingSensors || loadingAlerts;

  // ============================================
  // Early states
  // ============================================
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

  if (!reactLeaflet || !mapConfig || !center) {
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

  const { MapContainer, TileLayer, Marker, Tooltip } = reactLeaflet;
  const L = LeafletLib;

  return (
    <>
      <div className="relative h-full w-full">
        {/* Socket status indicator */}
        <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2 rounded-md bg-black/70 px-3 py-1.5 text-xs backdrop-blur-sm">
          <div
            className={`h-2 w-2 rounded-full ${
              socketConnected ? "bg-green-500" : "bg-gray-500"
            }`}
          />
          <span className="text-white">
            {socketConnected ? "Live" : "Offline"}
          </span>
        </div>

        <MapContainer
          center={center}
          zoom={mapConfig.minZoom}
          minZoom={mapConfig.minZoom}
          maxZoom={mapConfig.maxZoom}
          className="h-full w-full bg-black"
          zoomControl={false}
          whenCreated={(mapInstance) => {
            setLeafletMap(mapInstance);
          }}
        >
          <TileLayer
            url={`${mapConfig.tileRoot}/{z}/{x}/{y}.jpg`}
            attribution=""
          />

          {/* Sensor markers - key prop forces re-render when alerts change */}
          {sensors.map((sensor) => {
            const alert = alertBySensorDbId[sensor.id];
            const hasActiveAlert = !!alert && alert.status === "ACTIVE";

            return (
              <Marker
                key={`${sensor.id}-${markerUpdateKey}`}
                position={[sensor.latitude, sensor.longitude]}
                icon={getSensorIcon(sensor, hasActiveAlert)}
                eventHandlers={{
                  click: () => openSensorModal(sensor),
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold text-black">
                      {sensor.name}
                    </div>
                    <div className="text-black-200">{sensor.sensorType}</div>
                    <div className="text-[10px] text-black-300">
                      Lat: {sensor.latitude.toFixed(5)}, Lon:{" "}
                      {sensor.longitude.toFixed(5)}
                    </div>
                    {hasActiveAlert && (
                      <div className="text-[10px] font-semibold text-red-500">
                        🚨 ACTIVE ALERT
                      </div>
                    )}
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Modal for sensor / alert actions */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="z-[100] max-w-lg border-[#333] bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {selectedSensor ? selectedSensor.name : "Sensor"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              {selectedSensor?.sensorId} ·{" "}
              {selectedSensor?.sensorType || "Unknown type"}
            </DialogDescription>
          </DialogHeader>

          {selectedSensor && (
            <div className="space-y-4 py-2 text-sm">
              {/* Sensor meta */}
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

              {/* Alert info */}
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

              {/* Drone selection */}
              <div className="space-y-2">
                <div className="text-xs text-gray-300">
                  Select Drone to Dispatch:
                </div>

                {loadingDrones ? (
                  <div className="flex items-center gap-2 rounded-md border border-[#333] bg-[#111] p-2 text-xs text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Loading drones...</span>
                  </div>
                ) : drones.length === 0 ? (
                  <div className="rounded-md border border-amber-700 bg-amber-950/40 p-3 text-xs text-amber-200">
                    No drones configured yet. Please add drones in the Drone OS
                    management section.
                  </div>
                ) : (
                  <>
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
                      {drones.map((drone) => (
                        <option
                          key={drone.id}
                          value={drone.id}
                          className="bg-[#111] text-gray-100"
                        >
                          {drone.droneOSName} · {drone.droneType}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
            {/* Neutralise only if alert present */}
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

            {/* Video Feed button (single action) */}
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
              title={
                !selectedSensor
                  ? "Select a sensor"
                  : !("rtspUrl" in (selectedSensor || {})) ||
                    !selectedSensor?.rtspUrl
                  ? "No RTSP URL configured for this sensor"
                  : "Open the video feed (server will launch the player)"
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
    </>
  );
}
