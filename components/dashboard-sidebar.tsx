"use client";

import { useState, useEffect } from "react";
import {
  Wifi,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  MapPin,
  Crosshair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import {
  sendDroneForAlert,
  neutraliseAlert,
  type Alert as ApiAlert,
} from "@/lib/api/alerts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllDroneOS, type DroneOS } from "@/lib/api/droneos";

interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// reuse your Alert type from lib/api/alerts
type Alert = ApiAlert;

interface AlertResolvedPayload {
  id: string;
  status: string;
}

export function DashboardSidebar({ isOpen, onToggle }: DashboardSidebarProps) {
  const [droneStatus] = useState<"connected" | "disconnected">("connected");
  const { toast } = useToast();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // modal state
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // drones for selected alert
  const [drones, setDrones] = useState<DroneOS[]>([]);
  const [dronesLoading, setDronesLoading] = useState(false);
  const [dronesError, setDronesError] = useState<string | null>(null);
  const [selectedDroneId, setSelectedDroneId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // 1) Initial fetch of active alerts
  useEffect(() => {
    const fetchActiveAlerts = async () => {
      setAlertsLoading(true);
      setAlertsError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/api/alerts/active`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch active alerts");
        }

        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAlerts(json.data);
        } else {
          setAlerts([]);
          if (json.error) setAlertsError(json.error);
        }
      } catch (err: any) {
        console.error("Error fetching active alerts:", err);
        setAlertsError(
          err instanceof Error ? err.message : "Failed to fetch active alerts"
        );
        setAlerts([]);
      } finally {
        setAlertsLoading(false);
      }
    };

    fetchActiveAlerts();
  }, [API_BASE_URL]);

  // 2) Socket.IO realtime updates
  useEffect(() => {
    const socket: Socket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("✅ Connected to alerts socket:", socket.id);
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from alerts socket");
      setSocketConnected(false);
    });

    socket.on("alert_active", (alert: Alert) => {
      console.log("🔔 alert_active:", alert);
      setAlerts((prev) => {
        const exists = prev.some((a) => a.id === alert.id);
        if (exists) return prev;
        return [...prev, alert];
      });
    });

    socket.on("alert_resolved", (payload: AlertResolvedPayload) => {
      console.log("✅ alert_resolved:", payload);
      setAlerts((prev) => prev.filter((a) => a.id !== payload.id));

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

  // 3) When modal opens / selectedAlert changes, fetch drones
  useEffect(() => {
    const fetchDrones = async () => {
      if (!selectedAlert) {
        setDrones([]);
        setSelectedDroneId("");
        return;
      }

      // You *want* "drones in same area", but DroneOS currently has no area info.
      // For now: fetch ALL drones and show them.
      // Later: add areaId or mapping and filter here.

      setDronesLoading(true);
      setDronesError(null);
      setSelectedDroneId("");

      try {
        const res = await getAllDroneOS();
        if (res.success && res.data) {
          // TODO: once DroneOS has areaId, filter by selectedAlert.sensor?.area?.id
          // const areaId = selectedAlert.sensor?.area?.id;
          // const filtered = res.data.filter(d => d.areaId === areaId);
          // setDrones(filtered);
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

    if (isModalOpen && selectedAlert) {
      fetchDrones();
    } else {
      setDrones([]);
      setDronesError(null);
      setSelectedDroneId("");
    }
  }, [isModalOpen, selectedAlert]);

  const openAlertModal = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };

  const closeAlertModal = () => {
    if (actionLoading) return;
    setIsModalOpen(false);
    setSelectedAlert(null);
    setDrones([]);
    setDronesError(null);
    setSelectedDroneId("");
  };

  const handleSendDrone = async () => {
    if (!selectedAlert) return;

    if (!selectedDroneId) {
      toast({
        title: "Select a drone",
        description: "Please choose a drone to dispatch.",
        variant: "destructive",
      });
      return;
    }

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

      setAlerts((prev) => prev.filter((a) => a.id !== selectedAlert.id));
      closeAlertModal();
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
  };

  const handleNeutralise = async () => {
    if (!selectedAlert) return;

    setActionLoading(true);
    try {
      const res = await neutraliseAlert(
        selectedAlert.id,
        "Manual neutralisation"
      );

      if (!res.success) {
        throw new Error(res.error || "Failed to neutralise alert");
      }

      toast({
        title: "Alert neutralised",
        description: "Alert has been marked as neutralised.",
      });

      setAlerts((prev) => prev.filter((a) => a.id !== selectedAlert.id));
      closeAlertModal();
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

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed left-0 top-14 z-30 flex h-[calc(100vh-3.5rem)] flex-col border-r border-[#333] bg-[#1a1a1a] p-4 transition-transform duration-300 lg:static lg:z-0 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } w-72 md:w-80`}
      >
        {/* Alarm Section */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-white">
            ALARM
          </h2>
          <Badge className="bg-red-600 px-4 py-1 text-sm font-medium text-white hover:bg-red-700">
            Alarm-1
          </Badge>
          <div className="mt-4 border-b border-[#333]" />
        </section>

        {/* Drone Section */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-white">
            DRONE
          </h2>
          <div className="rounded-lg border border-[#333] bg-[#222] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#333]">
                  <Wifi className="h-5 w-5 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white">Drone-1</p>
                  <p className="text-xs text-gray-500">Tap for details</p>
                </div>
              </div>
              <Badge
                className={`shrink-0 ${
                  droneStatus === "connected"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } text-xs text-white`}
              >
                Connected
              </Badge>
            </div>
          </div>

          <Button
            className="mt-4 w-full border border-[#444] bg-transparent text-white hover:bg-[#333]"
            variant="outline"
          >
            PATROL
          </Button>
          <div className="mt-4 border-b border-[#333]" />
        </section>

        {/* Alert Section */}
        <section className="flex-1 overflow-y-auto">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-white">
              ALERT
            </h2>
            <span
              className={`text-[10px] ${
                socketConnected ? "text-green-500" : "text-gray-500"
              }`}
            >
              {socketConnected ? "live" : "offline"}
            </span>
          </div>

          {alertsLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin text-[#4A9FD4]" />
              <span>Loading active alerts...</span>
            </div>
          )}

          {!alertsLoading && alertsError && (
            <p className="text-sm text-red-500">
              Failed to load alerts: {alertsError}
            </p>
          )}

          {!alertsLoading && !alertsError && alerts.length === 0 && (
            <p className="text-sm text-gray-500">No Active Alerts Found...</p>
          )}

          {!alertsLoading && !alertsError && alerts.length > 0 && (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => openAlertModal(alert)}
                  className="w-full rounded-lg border border-[#333] bg-[#222] p-3 text-left text-sm hover:border-[#4A9FD4] hover:bg-[#252525]"
                >
                  <div className="mb-2 flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-orange-500" />
                    <div className="flex-1">
                      <p className="font-medium text-white line-clamp-2">
                        {alert.message || "Alert"}
                      </p>
                      <p className="text-xs text-gray-400">
                        Sensor:{" "}
                        <span className="font-mono text-[#4A9FD4]">
                          {alert.sensor?.name ||
                            alert.sensorId ||
                            "Unknown Sensor"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </aside>

      {/* Sidebar toggle */}
      <Button
        variant="secondary"
        size="icon"
        className={`fixed z-40 h-10 w-10 bg-[#333] text-white hover:bg-[#444] lg:hidden transition-all duration-300 ${
          isOpen ? "left-[17rem] md:left-[19rem]" : "left-2"
        } top-[4.5rem]`}
        onClick={onToggle}
      >
        {isOpen ? (
          <ChevronLeft className="h-5 w-5" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
      </Button>

      {/* Alert Modal */}
      {isModalOpen && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg border border-[#333] bg-[#111] p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-white">
                    Active Alert
                  </h2>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(selectedAlert.createdAt).toLocaleString()}
                </p>
              </div>
              <Badge className="bg-red-600 text-xs text-white">
                {selectedAlert.status}
              </Badge>
            </div>

            <div className="mb-4 space-y-2 text-sm">
              <p className="text-gray-200">{selectedAlert.message}</p>

              <div className="mt-3 rounded-md border border-[#333] bg-[#181818] p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <Crosshair className="h-3 w-3" />
                  Sensor Details
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Name:</span>{" "}
                    <span className="text-gray-200">
                      {selectedAlert.sensor?.name || "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Sensor ID:</span>{" "}
                    <span className="font-mono text-[#4A9FD4]">
                      {selectedAlert.sensorId}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Area:</span>{" "}
                    <span className="text-gray-200">
                      {selectedAlert.sensor?.area?.name || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-400">
                      {typeof selectedAlert.sensor?.latitude === "number" &&
                      typeof selectedAlert.sensor?.longitude === "number"
                        ? `${selectedAlert.sensor.latitude.toFixed(
                            5
                          )}, ${selectedAlert.sensor.longitude.toFixed(5)}`
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
              <Button
                type="button"
                variant="outline"
                disabled={actionLoading}
                onClick={handleNeutralise}
                className="border-[#444] bg-transparent text-xs text-gray-200 hover:bg-[#333]"
              >
                {actionLoading ? "Processing..." : "Neutralise"}
              </Button>
              <Button
                type="button"
                disabled={
                  actionLoading || !selectedDroneId || drones.length === 0
                }
                onClick={handleSendDrone}
                className="bg-[#2563EB] px-4 text-xs text-white hover:bg-[#1D4ED8] disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Drone"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={actionLoading}
                onClick={closeAlertModal}
                className="border-[#444] bg-transparent text-xs text-gray-300 hover:bg-[#333]"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
