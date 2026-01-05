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
import { io, type Socket } from "socket.io-client";
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
import { getAllAlarms, type Alarm } from "@/lib/api/alarms";
import { openRtspBySensor } from "@/lib/api/rtsp";
import { sendDrone, dronePatrol } from "@/lib/api/droneCommand";

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
  const { toast } = useToast();

  const [alarmsList, setAlarmsList] = useState<Alarm[]>([]);
  const [alarmsLoading, setAlarmsLoading] = useState(false);
  const [alarmsError, setAlarmsError] = useState<string | null>(null);

  const [dronesList, setDronesList] = useState<DroneOS[]>([]);
  const [dronesLoading, setDronesLoading] = useState(false);
  const [dronesError, setDronesError] = useState<string | null>(null);

  // Existing code for alerts
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading2, setAlertsLoading2] = useState(false);
  const [alertsError2, setAlertsError2] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Modal state
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Drones for selected alert
  const [drones, setDrones] = useState<DroneOS[]>([]);
  const [dronesLoading2, setDronesLoading2] = useState(false);
  const [dronesError2, setDronesError2] = useState<string | null>(null);
  const [selectedDroneId, setSelectedDroneId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPatrolDroneId, setSelectedPatrolDroneId] =
    useState<string>("");
  const [patrolConfirmOpen, setPatrolConfirmOpen] = useState(false);
  const [patrolLoading, setPatrolLoading] = useState(false);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchAlarms = async () => {
      setAlarmsLoading(true);
      setAlarmsError(null);

      try {
        const res = await getAllAlarms();
        if (res.success && res.data) {
          setAlarmsList(res.data);
        } else {
          setAlarmsList([]);
          setAlarmsError(res.error || "Failed to fetch alarms");
        }
      } catch (err: any) {
        console.error("Error fetching alarms:", err);
        setAlarmsError(
          err instanceof Error ? err.message : "Failed to fetch alarms"
        );
        setAlarmsList([]);
      } finally {
        setAlarmsLoading(false);
      }
    };

    fetchAlarms();
  }, []);

  useEffect(() => {
    const fetchDrones = async () => {
      setDronesLoading(true);
      setDronesError(null);

      try {
        const res = await getAllDroneOS();
        if (res.success && res.data) {
          setDronesList(res.data);
        } else {
          setDronesList([]);
          setDronesError(res.error || "Failed to fetch drones");
        }
      } catch (err: any) {
        console.error("Error fetching drones:", err);
        setDronesError(
          err instanceof Error ? err.message : "Failed to fetch drones"
        );
        setDronesList([]);
      } finally {
        setDronesLoading(false);
      }
    };

    fetchDrones();
  }, []);

  // Initial fetch of active alerts
  useEffect(() => {
    const fetchActiveAlerts = async () => {
      setAlertsLoading2(true);
      setAlertsError2(null);

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
          if (json.error) setAlertsError2(json.error);
        }
      } catch (err: any) {
        console.error("Error fetching active alerts:", err);
        setAlertsError2(
          err instanceof Error ? err.message : "Failed to fetch active alerts"
        );
        setAlerts([]);
      } finally {
        setAlertsLoading2(false);
      }
    };

    fetchActiveAlerts();
  }, [API_BASE_URL]);

  // Socket.IO realtime updates
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
      setAlerts((prev) => {
        const exists = prev.some((a) => a.id === alert.id);
        if (exists) return prev;

        // ✅ add new alert at the TOP
        return [alert, ...prev];
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

  // When modal opens / selectedAlert changes, fetch drones for alert modal
  useEffect(() => {
    const fetchDronesForAlert = async () => {
      if (!selectedAlert) {
        setDrones([]);
        setSelectedDroneId("");
        return;
      }

      setDronesLoading2(true);
      setDronesError2(null);
      setSelectedDroneId("");

      try {
        const res = await getAllDroneOS();
        if (res.success && res.data) {
          setDrones(res.data);
        } else {
          setDrones([]);
          setDronesError2(res.error || "Failed to fetch drones");
        }
      } catch (err: any) {
        console.error("Error fetching drones:", err);
        setDrones([]);
        setDronesError2(
          err instanceof Error ? err.message : "Failed to fetch drones"
        );
      } finally {
        setDronesLoading2(false);
      }
    };

    if (isModalOpen && selectedAlert) {
      fetchDronesForAlert();
    } else {
      setDrones([]);
      setDronesError2(null);
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
    setDronesError2(null);
    setSelectedDroneId("");
  };

  const handleOpenVideoFeed = async () => {
    if (!selectedAlert || !selectedAlert.sensor) return;

    if (!("rtspUrl" in selectedAlert.sensor) || !selectedAlert.sensor.rtspUrl) {
      toast({
        title: "No RTSP configured",
        description: "This sensor has no RTSP URL configured in the backend.",
        variant: "destructive",
      });
      return;
    }

    try {
      setActionLoading(true);
      const res = await openRtspBySensor(selectedAlert?.sensor?.id);

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

    // Sensor location is REQUIRED for your backend
    const lat = selectedAlert.sensor?.latitude;
    const lng = selectedAlert.sensor?.longitude;

    if (typeof lat !== "number" || typeof lng !== "number") {
      toast({
        title: "Invalid sensor location",
        description: "Sensor coordinates are missing or invalid.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);

    try {
      const res = await sendDrone({
        droneDbId: selectedDroneId,
        alertId: selectedAlert.id,
        sensorId: selectedAlert.sensorId,
        targetLatitude: lat,
        targetLongitude: lng,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to send drone");
      }

      toast({
        title: "Drone dispatched",
        description: `Drone sent successfully (Flight ID: ${res.flightId})`,
      });

      // Remove alert from UI (server will also emit socket event)
      setAlerts((prev) => prev.filter((a) => a.id !== selectedAlert.id));

      closeAlertModal();
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
        {/* <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-white">
            ALARM
          </h2>

          {alarmsLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin text-[#4A9FD4]" />
              <span>Loading alarms...</span>
            </div>
          )}

          {!alarmsLoading && alarmsError && (
            <p className="text-xs text-red-500">{alarmsError}</p>
          )}

          {!alarmsLoading && !alarmsError && alarmsList.length === 0 && (
            <p className="text-xs text-gray-500">No alarms configured</p>
          )}

          {!alarmsLoading && !alarmsError && alarmsList.length > 0 && (
            <div className="space-y-2 max-h-[120px] overflow-y-auto">
              {alarmsList.slice(0, 3).map((alarm) => (
                <Badge
                  key={alarm.id}
                  className="block w-full justify-start truncate bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                  title={alarm.name}
                >
                  {alarm.name}
                </Badge>
              ))}
              {alarmsList.length > 3 && (
                <p className="text-[10px] text-gray-500 px-1">
                  +{alarmsList.length - 3} more
                </p>
              )}
            </div>
          )}

          <div className="mt-4 border-b border-[#333]" />
        </section> */}

        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-white">
            DRONE
          </h2>

          {dronesLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin text-[#4A9FD4]" />
              <span>Loading drones...</span>
            </div>
          )}

          {!dronesLoading && dronesError && (
            <p className="text-xs text-red-500">{dronesError}</p>
          )}

          {!dronesLoading && !dronesError && dronesList.length === 0 && (
            <p className="text-xs text-gray-500">No drones configured</p>
          )}

          {!dronesLoading && !dronesError && dronesList.length > 0 && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {dronesList.map((drone) => (
                // <div
                //   key={drone.id}
                //   className="rounded-lg border border-[#333] bg-[#222] p-3"
                // >
                <div
                  key={drone.id}
                  onClick={() => setSelectedPatrolDroneId(drone.id)}
                  className={`cursor-pointer rounded-lg border p-3 transition
    ${
      selectedPatrolDroneId === drone.id
        ? "border-blue-500 bg-blue-950/40"
        : "border-[#333] bg-[#222] hover:border-[#4A9FD4]"
    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#333]">
                        <Wifi className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">
                          {drone.droneOSName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {drone.droneType}
                        </p>
                      </div>
                    </div>
                    <Badge className="shrink-0 bg-green-600 hover:bg-green-700 text-xs text-white">
                      Active
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            className="mt-4 w-full border border-[#444] bg-transparent text-white hover:bg-[#333]"
            variant="outline"
            disabled={!selectedPatrolDroneId}
            onClick={() => setPatrolConfirmOpen(true)}
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

          {alertsLoading2 && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin text-[#4A9FD4]" />
              <span>Loading active alerts...</span>
            </div>
          )}

          {!alertsLoading2 && alertsError2 && (
            <p className="text-sm text-red-500">
              Failed to load alerts: {alertsError2}
            </p>
          )}

          {!alertsLoading2 && !alertsError2 && alerts.length === 0 && (
            <p className="text-sm text-gray-500">No Active Alerts Found...</p>
          )}

          {!alertsLoading2 && !alertsError2 && alerts.length > 0 && (
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

              {dronesLoading2 && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Loader2 className="h-3 w-3 animate-spin text-[#4A9FD4]" />
                  <span>Loading drones...</span>
                </div>
              )}

              {!dronesLoading2 && dronesError2 && (
                <p className="text-xs text-red-500">{dronesError2}</p>
              )}

              {!dronesLoading2 && !dronesError2 && drones.length === 0 && (
                <p className="text-xs text-gray-500">
                  No drones configured yet.
                </p>
              )}

              {!dronesLoading2 && !dronesError2 && drones.length > 0 && (
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
                className="border-[#444] bg-transparent text-xs text-gray-200 hover:bg-[#333]"
                onClick={handleOpenVideoFeed}
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
      {patrolConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-lg border border-[#333] bg-[#111] p-5">
            <h3 className="text-sm font-semibold text-white mb-2">
              Confirm Patrol
            </h3>

            <p className="text-xs text-gray-400 mb-4">
              Do you want to send{" "}
              <span className="font-semibold text-blue-400">
                {
                  dronesList.find((d) => d.id === selectedPatrolDroneId)
                    ?.droneOSName
                }
              </span>{" "}
              on patrol?
            </p>

            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPatrolConfirmOpen(false)}
                className="border-[#444] bg-transparent text-gray-300"
              >
                Cancel
              </Button>

              <Button
                size="sm"
                disabled={patrolLoading}
                onClick={async () => {
                  try {
                    setPatrolLoading(true);

                    const res = await dronePatrol({
                      droneDbId: selectedPatrolDroneId,
                    });

                    if (!res.success) {
                      throw new Error(res.error || "Failed to start patrol");
                    }

                    toast({
                      title: "Patrol started",
                      description: "Drone sent on patrol successfully",
                    });

                    setPatrolConfirmOpen(false);
                  } catch (err) {
                    toast({
                      title: "Error",
                      description:
                        err instanceof Error ? err.message : "Patrol failed",
                      variant: "destructive",
                    });
                  } finally {
                    setPatrolLoading(false);
                  }
                }}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {patrolLoading ? "Sending..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
