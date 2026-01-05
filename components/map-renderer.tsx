"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, DivIcon } from "leaflet";
import dynamic from "next/dynamic";
import type { Alert, Sensor, DroneOS } from "@/lib/api";
import type { OfflineMap } from "@/lib/api/maps";

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

interface MapRendererProps {
  mapConfig: OfflineMap;
  sensors: Sensor[];
  drones: DroneOS[];
  alertBySensorDbId: Record<string, Alert>;
  dronePositions: Record<string, DronePosition>;
  droneStatus: Record<string, DroneStatus>;
  activeMissions: Record<string, ActiveMission>;
  currentZoom: number;
  socketConnected: boolean;
  markerUpdateKey: number;
  onZoomChange: (zoom: number) => void;
  onSensorClick: (sensor: Sensor) => void;
  onDroneMarkerClick?: (droneId: string) => void;
}

const REACH_RADIUS_METERS = 6;

const MapContainer = dynamic(
  async () => {
    const { MapContainer } = await import("react-leaflet");
    return MapContainer;
  },
  { ssr: false }
);

const TileLayer = dynamic(
  async () => {
    const { TileLayer } = await import("react-leaflet");
    return TileLayer;
  },
  { ssr: false }
);

const Marker = dynamic(
  async () => {
    const { Marker } = await import("react-leaflet");
    return Marker;
  },
  { ssr: false }
);

const Tooltip = dynamic(
  async () => {
    const { Tooltip } = await import("react-leaflet");
    return Tooltip;
  },
  { ssr: false }
);

const Polyline = dynamic(
  async () => {
    const { Polyline } = await import("react-leaflet");
    return Polyline;
  },
  { ssr: false }
);

function getSensorBaseColor(sensorType: string): string {
  const t = sensorType.toLowerCase();
  if (t.includes("camera")) return "#26f51b";
  if (t.includes("thermal")) return "#f97316";
  if (t.includes("infrared") || t.includes("pir")) return "#a855f7";
  if (t.includes("motion")) return "#22c55e";
  return "#9ca3af";
}

function getDroneIcon(isOnline: boolean): DivIcon {
  const leaflet = require("leaflet");
  const size = 26;

  const bgColor = isOnline ? "#6D28D9" : "#C4B5FD"; // deep purple / light purple
  const borderColor = isOnline ? "#A78BFA" : "#DDD6FE";
  const glowColor = isOnline
    ? "rgba(109,40,217,0.9)" // deep purple glow
    : "rgba(196,181,253,0.4)"; // soft light purple glow

  const animation = isOnline
    ? `
      animation: drone-pulse 1.5s infinite;
    `
    : "";

  const html = `
    <style>
      @keyframes drone-pulse {
        0% { box-shadow: 0 0 0 0 ${glowColor}; }
        70% { box-shadow: 0 0 0 10px rgba(0,0,0,0); }
        100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
      }
    </style>
    <div style="
      width:${size}px;
      height:${size}px;
      border-radius:9999px;
      background:${bgColor};
      border:2px solid ${borderColor};
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-size:14px;
      font-weight:700;
      ${animation}
    ">
      ✈
    </div>
  `;

  return leaflet.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function calculateMarkerSize(zoom: number): number {
  const { minZoom, maxZoom, minSize, maxSize } = {
    minZoom: 10,
    maxZoom: 40,
    minSize: 18,
    maxSize: 48,
  };
  const normalizedZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
  const progress = (normalizedZoom - minZoom) / (maxZoom - minZoom);
  return Math.round(minSize + (maxSize - minSize) * progress);
}

function offsetLatLng(
  lat: number,
  lng: number,
  metersNorth: number,
  metersEast: number
): [number, number] {
  const dLat = metersNorth / 111111;
  const dLng = metersEast / (111111 * Math.cos((lat * Math.PI) / 180));
  return [lat + dLat, lng + dLng];
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Function to detect if any drone is on a sensor
function getDroneOnSensor(
  sensor: Sensor,
  dronePositions: Record<string, any>
): string | null {
  for (const [droneId, pos] of Object.entries(dronePositions)) {
    if (!pos) continue;
    const distance = haversineMeters(
      sensor.latitude,
      sensor.longitude,
      pos.lat,
      pos.lng
    );
    if (distance <= REACH_RADIUS_METERS) {
      return droneId;
    }
  }
  return null;
}

function getSensorIcon(
  sensor: Sensor,
  hasActiveAlert: boolean,
  zoom: number,
  droneOnSensor: boolean
): DivIcon {
  const leaflet = require("leaflet");

  const markerSize = calculateMarkerSize(zoom);
  const fontSize = Math.max(9, Math.round(markerSize * 0.45));
  const borderWidth = markerSize > 30 ? 2 : 1;

  const baseColor = getSensorBaseColor(sensor.sensorType);
  const bg = hasActiveAlert ? "#b91c1c" : baseColor;
  const border = hasActiveAlert ? "#fecaca" : "#0f172a";

  const t = sensor.sensorType.toLowerCase();
  let label = "S";
  if (t.includes("camera")) label = "C";
  else if (t.includes("thermal")) label = "T";
  else if (t.includes("infrared") || t.includes("pir")) label = "P";
  else if (t.includes("motion")) label = "M";

  const pulseAnimation = droneOnSensor
    ? `
    @keyframes pulse-ring {
      0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7), 0 0 8px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.4); }
      50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0), 0 0 8px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.4); }
      100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0), 0 0 8px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.4); }
    }
    @keyframes scale-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  `
    : "";

  const html = `
    <style>${pulseAnimation}</style>
    <div style="
      width: ${markerSize}px;
      height: ${markerSize}px;
      border-radius: 9999px;
      background: ${bg};
      border: ${borderWidth}px solid ${border};
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: ${fontSize}px;
      font-weight: 600;
      ${
        droneOnSensor
          ? `box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7), 0 0 8px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.4);
      animation: pulse-ring 2s infinite, scale-pulse 2s infinite;`
          : `box-shadow: 0 0 8px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.4);`
      }
      transition: all 0.15s ease-out;
    ">
      ${label}
    </div>
  `;

  return leaflet.divIcon({
    html,
    className: "",
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
  });
}

function MapRenderer({
  mapConfig,
  sensors,
  drones,
  alertBySensorDbId,
  dronePositions,
  droneStatus,
  activeMissions,
  currentZoom,
  socketConnected,
  markerUpdateKey,
  onZoomChange,
  onSensorClick,
  onDroneMarkerClick,
}: MapRendererProps) {
  const leafletMapRef = useRef<LeafletMap | null>(null);

  const center: [number, number] = [
    (mapConfig.north + mapConfig.south) / 2,
    (mapConfig.east + mapConfig.west) / 2,
  ];

  useEffect(() => {
    if (!leafletMapRef.current) return;

    const handleZoom = () => {
      const newZoom = leafletMapRef.current?.getZoom();
      if (newZoom) onZoomChange(newZoom);
    };

    leafletMapRef.current.on("zoom", handleZoom);

    return () => {
      leafletMapRef.current?.off("zoom", handleZoom);
    };
  }, [onZoomChange]);

  return (
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

      <div className="absolute top-4 left-4 z-[1000] rounded-md bg-black/70 px-3 py-1.5 text-xs text-gray-300 backdrop-blur-sm">
        Zoom: {currentZoom.toFixed(1)}x
      </div>

      <MapContainer
        center={center}
        zoom={mapConfig.minZoom}
        minZoom={mapConfig.minZoom}
        maxZoom={mapConfig.maxZoom}
        className="h-full w-full bg-black"
        zoomControl={false}
        whenCreated={(mapInstance) => {
          leafletMapRef.current = mapInstance;
        }}
      >
        <TileLayer
          url={`${mapConfig.tileRoot}/{z}/{x}/{y}.jpg`}
          attribution=""
        />

        {/* Sensor markers */}
        {sensors.map((sensor) => {
          const alert = alertBySensorDbId[sensor.id];
          const hasActiveAlert = !!alert && alert.status === "ACTIVE";
          const droneOnSensor =
            getDroneOnSensor(sensor, dronePositions) !== null;

          return (
            <Marker
              key={`${sensor.id}-${markerUpdateKey}`}
              position={[sensor.latitude, sensor.longitude]}
              icon={getSensorIcon(
                sensor,
                hasActiveAlert,
                currentZoom,
                droneOnSensor
              )}
              eventHandlers={{
                click: () => onSensorClick(sensor),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-black">{sensor.name}</div>
                  <div className="text-black-200">{sensor.sensorType}</div>
                  <div className="text-[10px] text-black-300">
                    Lat: {sensor.latitude.toFixed(5)}, Lon:{" "}
                    {sensor.longitude.toFixed(5)}
                  </div>
                  {droneOnSensor && (
                    <div className="text-[10px] font-semibold text-blue-600">
                      ✈ Drone on sensor
                    </div>
                  )}
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

        {/* Drone markers */}
        {drones.map((drone) => {
          const pos = dronePositions[drone.id];
          const status = droneStatus[drone.id];

          if (!pos) return null;

          const markerPos: [number, number] = [pos.lat, pos.lng];

          const telemetryAge = status
            ? Math.round((Date.now() - status.lastUpdateTime) / 1000)
            : null;
          const isOnline = telemetryAge !== null && telemetryAge < 10;
          const statusDisplay = isOnline ? "Online" : "Offline";
          const statusColor = isOnline ? "text-green-600" : "text-gray-500";
          const statusEmoji = isOnline ? "🟢" : "⚪";

          return (
            <Marker
              key={`drone-${drone.id}-${markerUpdateKey}`}
              position={markerPos}
              icon={getDroneIcon(isOnline)}
              eventHandlers={{
                click: () => onDroneMarkerClick?.(drone.id),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-black">
                    ✈ {drone.droneId}
                  </div>
                  <div className="text-[10px] text-black-300">
                    {drone.droneOSName}
                  </div>
                  <div className="text-[10px] text-black-300">
                    Lat: {pos.lat.toFixed(5)}, Lon: {pos.lng.toFixed(5)}
                  </div>
                  {pos.alt != null && (
                    <div className="text-[10px] text-black-300">
                      Alt: {pos.alt} m
                    </div>
                  )}

                  <div className={`text-[10px] font-semibold ${statusColor}`}>
                    {statusEmoji} {statusDisplay}
                  </div>

                  {/* {!isOnline && status?.lastUpdateTime && (
                    <div className="text-[10px] text-black-300">
                      Last:{" "}
                      {new Date(status.lastUpdateTime).toLocaleTimeString()}
                    </div>
                  )} */}
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* Active missions path lines */}
        {Object.values(activeMissions).map((mission) => {
          const drone = drones.find((d) => d.droneId === mission.droneId);
          if (!drone) return null;

          const pos = dronePositions[drone.id];
          if (!pos) return null;

          return (
            <Polyline
              key={`mission-${mission.droneId}`}
              positions={[
                [pos.lat, pos.lng],
                [mission.targetLat, mission.targetLng],
              ]}
              pathOptions={{
                color: "red",
                weight: 3,
                dashArray: "6 8",
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}

export { MapRenderer };
export default MapRenderer;
