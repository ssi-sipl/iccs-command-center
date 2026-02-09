"use client";

import React, { useEffect, useMemo, useRef } from "react";
import type { Map as LeafletMap, DivIcon } from "leaflet";
import dynamic from "next/dynamic";
import type { Alert, Sensor, DroneOS } from "@/lib/api";
import type { OfflineMap } from "@/lib/api/maps";
import { Badge } from "./ui/badge";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

export interface DroneTelemetry {
  droneDbId: string;
  droneId: string;
  lat: number;
  lng: number;
  alt: number | null;
  speed: number | null;
  battery: number | null;
  mode: string | null;
  gpsFix: string | null;
  satellites: number | null;
  windSpeed: number | null;
  targetLat: number | null; // ✅ NEW
  targetLng: number | null; // ✅ NEW
  targetDistance: number | null;
  status: "on_air" | "ground" | "reached" | null; // ✅ UPDATED
  command: string | null;
  ts: number;
}

interface MapRendererProps {
  mapConfig: OfflineMap;
  sensors: Sensor[];
  drones: DroneOS[];
  alertBySensorDbId: Record<string, Alert>;
  dronePositions: Record<string, DronePosition>;
  droneStatus: Record<string, DroneStatus>;
  currentZoom: number;
  socketConnected: boolean;
  markerUpdateKey: number;
  onZoomChange: (zoom: number) => void;
  onSensorClick: (sensor: Sensor) => void;
  onDroneMarkerClick?: (droneId: string, e?: MouseEvent) => void;
  droneTelemetryData: Record<string, DroneTelemetry>;
  focusedSensorId: string | null;
}

const REACH_RADIUS_METERS = 6;

const MapContainer = dynamic(
  async () => {
    const { MapContainer } = await import("react-leaflet");
    return MapContainer;
  },
  { ssr: false },
);

const TileLayer = dynamic(
  async () => {
    const { TileLayer } = await import("react-leaflet");
    return TileLayer;
  },
  { ssr: false },
);

const Marker = dynamic(
  async () => {
    const { Marker } = await import("react-leaflet");
    return Marker;
  },
  { ssr: false },
);

const Tooltip = dynamic(
  async () => {
    const { Tooltip } = await import("react-leaflet");
    return Tooltip;
  },
  { ssr: false },
);

const Polyline = dynamic(
  async () => {
    const { Polyline } = await import("react-leaflet");
    return Polyline;
  },
  { ssr: false },
);

function getSensorBaseColor(sensorType: string): string {
  const t = sensorType.toLowerCase();
  if (t.includes("command")) return "#ffffff";
  if (t.includes("camera")) return "#26f51b";
  // if (t.includes("thermal")) return "#f97316";
  if (t.includes("thermal")) return "#26f51b";

  // if (t.includes("infrared") || t.includes("pir")) return "#a855f7";
  if (t.includes("thermal")) return "#26f51b";

  // if (t.includes("motion")) return "#22c55e";
  if (t.includes("motion")) return "#26f51b";

  // if (t.includes("post")) return "#3b82f6";
  if (t.includes("post")) return "#26f51b";

  return "#9ca3af";
}

// function getDroneIcon(isOnline: boolean): DivIcon {
//   const leaflet = require("leaflet");
//   const size = 26;

//   const bgColor = isOnline ? "#6D28D9" : "#C4B5FD"; // deep purple / light purple
//   const borderColor = isOnline ? "#A78BFA" : "#6D28D9";
//   const glowColor = isOnline
//     ? "rgba(109,40,217,0.9)" // deep purple glow
//     : "rgba(196,181,253,0.4)"; // soft light purple glow

//   const animation = isOnline
//     ? `
//       animation: drone-pulse 1.5s infinite;
//     `
//     : "";

//   const html = `
//     <style>
//       @keyframes drone-pulse {
//         0% { box-shadow: 0 0 0 0 ${glowColor}; }
//         70% { box-shadow: 0 0 0 10px rgba(0,0,0,0); }
//         100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
//       }
//     </style>
//     <div style="
//       width:${size}px;
//       height:${size}px;
//       border-radius:9999px;
//       background:${bgColor};
//       border:2px solid ${borderColor};
//       display:flex;
//       align-items:center;
//       justify-content:center;
//       color:${isOnline ? "white" : borderColor};
//       font-size:14px;
//       font-weight:700;
//       ${animation}
//     ">
//       ✈
//     </div>
//   `;

//   return leaflet.divIcon({
//     html,
//     className: "",
//     iconSize: [size, size],
//     iconAnchor: [size / 2, size / 2],
//   });
// }

function getBaseIcon(): DivIcon {
  const leaflet = require("leaflet");

  const html = `
    <div style="
      width:18px;
      height:18px;
      border-radius:9999px;
      background:#111827;
      border:2px solid #22c55e;
      display:flex;
      align-items:center;
      justify-content:center;
      color:#22c55e;
      font-size:10px;
      font-weight:700;
    ">
      🏠
    </div>
  `;

  return leaflet.divIcon({
    html,
    className: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function calculateDroneSize(zoom: number): number {
  const { minSize, maxSize, minZoom, maxZoom } = ZOOM_SCALE_CONFIG;
  const z = Math.max(minZoom, Math.min(maxZoom, zoom));
  const progress = (z - minZoom) / (maxZoom - minZoom);
  return Math.round(minSize + (maxSize - minSize) * progress);
}

// map-renderer.tsx - Updated getDroneIcon function
function getDroneIcon(
  zoom: number,
  isOnline: boolean,
  isStale: boolean,
  hasAlert: boolean,
  status: "on_air" | "ground" | "reached" | null,
  staticIcon = false, // 👈 NEW
): DivIcon {
  const leaflet = require("leaflet");
  // const size = 26;
  const size = calculateDroneSize(zoom);

  // Determine colors and animation based on status
  let bgColor: string;
  let borderColor: string;
  let glowColor: string;
  let icon: string;
  let animation = "";

  if (hasAlert) {
    bgColor = "#DC2626"; // red
    borderColor = "#FCA5A5";
    glowColor = "rgba(220,38,38,0.9)";
    icon = "⚠️";
    animation = `animation: drone-pulse 1s infinite;`;
  } else if (isStale) {
    bgColor = "#F59E0B"; // amber
    borderColor = "#FCD34D";
    glowColor = "rgba(245,158,11,0.7)";
    icon = "❓";
  } else if (!isOnline) {
    // bgColor = "#374151"; // dark gray
    // borderColor = "#9CA3AF";
    // glowColor = "rgba(107,114,128,0.4)";
    // icon = "⛔";
    bgColor = "#C4B5FD";
    borderColor = "#6D28D9";
    glowColor = "rgba(196,181,253,0.4)";
    icon = "✈";
  } else {
    // NORMAL ONLINE STATE → fall back to telemetry.status
    switch (status) {
      case "on_air":
        bgColor = "#3B82F6";
        borderColor = "#60A5FA";
        glowColor = "rgba(59,130,246,0.9)";
        icon = "✈";
        animation = `animation: drone-pulse 1.5s infinite;`;
        break;

      case "reached":
        bgColor = "#10B981";
        borderColor = "#34D399";
        glowColor = "rgba(16,185,129,0.9)";
        icon = "🎯";
        animation = `animation: drone-reached 2s infinite;`;
        break;

      case "ground":
      default:
        bgColor = "#6B7280";
        borderColor = "#9CA3AF";
        glowColor = "rgba(107,116,128,0.6)";
        icon = "✈";
    }
  }

  if (staticIcon) {
    animation = ""; // ❌ no pulse, no scale
  }

  // if (!isOnline) {
  //   // Offline state
  //   bgColor = "#C4B5FD";
  //   borderColor = "#6D28D9";
  //   glowColor = "rgba(196,181,253,0.4)";
  //   icon = "✈";
  // } else {
  //   // Online states based on status
  //   switch (status) {
  //     case "on_air":
  //       bgColor = "#3B82F6"; // blue
  //       borderColor = "#60A5FA";
  //       glowColor = "rgba(59,130,246,0.9)";
  //       icon = "✈";
  //       animation = `animation: drone-pulse 1.5s infinite;`;
  //       break;
  //     case "ground":
  //       bgColor = "#6B7280"; // gray
  //       borderColor = "#9CA3AF";
  //       glowColor = "rgba(107,116,128,0.6)";
  //       icon = "🛬";
  //       break;
  //     case "reached":
  //       bgColor = "#10B981"; // green
  //       borderColor = "#34D399";
  //       glowColor = "rgba(16,185,129,0.9)";
  //       icon = "🎯";
  //       animation = `animation: drone-reached 2s infinite;`;
  //       break;
  //     default:
  //       // Default online state (purple)
  //       bgColor = "#6D28D9";
  //       borderColor = "#A78BFA";
  //       glowColor = "rgba(109,40,217,0.9)";
  //       icon = "✈";
  //       animation = `animation: drone-pulse 1.5s infinite;`;
  //   }
  // }

  const html = `
    <style>
      @keyframes drone-pulse {
        0% { box-shadow: 0 0 0 0 ${glowColor}; }
        70% { box-shadow: 0 0 0 10px rgba(0,0,0,0); }
        100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
      }
      @keyframes drone-reached {
        0%, 100% { 
          box-shadow: 0 0 0 0 ${glowColor};
          transform: scale(1);
        }
        50% { 
          box-shadow: 0 0 0 8px rgba(0,0,0,0);
          transform: scale(1.15);
        }
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
      font-size:${Math.round(size * 0.55)}px;
      font-weight:700;
      ${animation}
    ">
      ${icon}
    </div>
  `;

  return leaflet.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Zoom scale config
const ZOOM_SCALE_CONFIG = {
  minZoom: 10,
  maxZoom: 40,
  minSize: 28, // ✅ was 18
  maxSize: 64, // ✅ was 48
};

function calculateMarkerSize(zoom: number): number {
  const { minZoom, maxZoom, minSize, maxSize } = ZOOM_SCALE_CONFIG;
  const normalizedZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
  const progress = (normalizedZoom - minZoom) / (maxZoom - minZoom);
  return Math.round(minSize + (maxSize - minSize) * progress);
}

function offsetLatLng(
  lat: number,
  lng: number,
  metersNorth: number,
  metersEast: number,
): [number, number] {
  const dLat = metersNorth / 111111;
  const dLng = metersEast / (111111 * Math.cos((lat * Math.PI) / 180));
  return [lat + dLat, lng + dLng];
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
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
  dronePositions: Record<string, any>,
  droneTelemetryData: Record<string, DroneTelemetry>,
): string | null {
  for (const [droneId, pos] of Object.entries(dronePositions)) {
    if (!pos) continue;

    const telemetry = droneTelemetryData[droneId];
    if (!telemetry) continue;

    // ✅ Only count drones that have actually REACHED
    if (telemetry.status !== "reached") continue;

    // ✅ Optional but STRONGLY recommended:
    // Make sure this sensor is the intended target
    if (
      telemetry.targetLat == null ||
      telemetry.targetLng == null ||
      Math.abs(telemetry.targetLat - sensor.latitude) > 0.00001 ||
      Math.abs(telemetry.targetLng - sensor.longitude) > 0.00001
    ) {
      continue;
    }

    const distance = haversineMeters(
      sensor.latitude,
      sensor.longitude,
      pos.lat,
      pos.lng,
    );
    if (distance <= REACH_RADIUS_METERS) {
      return droneId;
    }
  }
  return null;
}

function getSensorIconPath(sensorType: string): string {
  const t = sensorType.toLowerCase();

  if (t.includes("camera")) return "/Icons/Dark/Camera.png";
  if (t.includes("thermal")) return "/Icons/Dark/thermol.png";
  if (t.includes("infrared") || t.includes("ir")) return "/Icons/Dark/IR.png";
  if (t.includes("pir")) return "/Icons/Dark/PIR.png";
  if (t.includes("motion")) return "/Icons/Dark/Motion.png";
  if (t.includes("post")) return "/Icons/Dark/Post.png";
  if (t.includes("command")) return "/Icons/Dark/Commond Center.png";

  return "/Icons/Dark/Other.png";
}

function getSensorIconPathWhite(sensorType: string): string {
  const t = sensorType.toLowerCase();

  if (t.includes("camera")) return "/Icons/White/Camera - W.png";
  if (t.includes("thermal")) return "/Icons/White/thermol - W.png";
  if (t.includes("infrared") || t.includes("ir"))
    return "/Icons/White/IR - W.png";
  if (t.includes("pir")) return "/Icons/White/PIR - W.png";
  if (t.includes("motion")) return "/Icons/White/Motion - W.png";
  if (t.includes("post")) return "/Icons/White/Post - W.png";
  if (t.includes("command")) return "/Icons/White/Commond Center - W.png";

  return "/Icons/White/Other - W.png";
}

function getSensorIcon(
  sensor: Sensor,
  hasActiveAlert: boolean,
  zoom: number,
  droneOnSensor: boolean,
  isFocused: boolean,
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
  else if (t.includes("post")) label = "PT";
  else if (t.includes("command")) label = "CC";

  const iconPath = hasActiveAlert
    ? getSensorIconPathWhite(sensor.sensorType)
    : getSensorIconPath(sensor.sensorType);

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

  const focusGlow = isFocused
    ? `
  @keyframes focus-pulse {
    0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.9); }
    70% { box-shadow: 0 0 0 16px rgba(59,130,246,0); }
    100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
  }
`
    : "";

  const html = `
    <style>
    ${pulseAnimation}
    ${focusGlow}
    </style>
    <div style="
      width: ${markerSize}px;
      height: ${markerSize}px;
      border-radius: 9999px;
      background: ${bg};
      border: ${borderWidth}px solid ${border};
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${hasActiveAlert ? "white" : border};
      font-size: ${fontSize}px;
      font-weight: 600;
      ${
        isFocused
          ? `
  border: 3px solid #3b82f6;
  animation: focus-pulse 1.5s infinite;
`
          : ""
      }

      ${
        droneOnSensor
          ? `box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7), 0 0 8px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.4);
      animation: pulse-ring 2s infinite, scale-pulse 2s infinite;`
          : `box-shadow: 0 0 8px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.4);`
      }
      transition: all 0.15s ease-out;
    ">
      
      <img
          src="${iconPath}"
          style="
            width:100%;
            height:100%;
            object-fit:contain;

          "
        />
    </div>
  `;

  return leaflet.divIcon({
    html,
    className: "",
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
  });
}

// function getSensorIcon(
//   sensor: Sensor,
//   hasActiveAlert: boolean,
//   zoom: number,
//   droneOnSensor: boolean,
//   isFocused: boolean,
// ): DivIcon {
//   const leaflet = require("leaflet");

//   const size = calculateMarkerSize(zoom);
//   const iconPath = getSensorIconPath(sensor.sensorType);
//   const baseColor = getSensorBaseColor(sensor.sensorType);
//   const color = hasActiveAlert ? "#b91c1c" : baseColor;

//   const alertRing = hasActiveAlert
//     ? `box-shadow: 0 0 0 4px rgba(220,38,38,0.8);`
//     : "";

//   const focusRing = isFocused
//     ? `box-shadow: 0 0 0 6px rgba(59,130,246,0.9);`
//     : "";

//   const dronePulse = droneOnSensor ? `animation: pulse 2s infinite;` : "";

//   const html = `
//     <style>
//       @keyframes pulse {
//         0% { transform: scale(1); }
//         50% { transform: scale(1.15); }
//         100% { transform: scale(1); }
//       }
//     </style>

//     <div style="
//       width:${size}px;
//       height:${size}px;
//       border-radius:9999px;
//       background:${color};
//       border:1px solid #000000;      /* ✅ BLACK BORDER */
//       box-sizing:border-box;         /* ✅ prevents shrinking */
//       display:flex;
//       align-items:center;
//       justify-content:center;
//       ${alertRing}
//       ${focusRing}
//       ${dronePulse}
//     ">
//       <img
//         src="${iconPath}"
//         style="
//           width:100%;
//           height:100%;
//           object-fit:contain;

//         "
//       />
//     </div>
//   `;

//   return leaflet.divIcon({
//     html,
//     className: "",
//     iconSize: [size, size],
//     iconAnchor: [size / 2, size / 2],
//   });
// }

function MapRenderer({
  mapConfig,
  sensors,
  drones,
  alertBySensorDbId,
  dronePositions,
  droneStatus,
  currentZoom,
  socketConnected,
  markerUpdateKey,
  onZoomChange,
  onSensorClick,
  onDroneMarkerClick,
  droneTelemetryData,
  focusedSensorId,
}: MapRendererProps) {
  const leafletMapRef = useRef<LeafletMap | null>(null);

  const center: [number, number] = [
    (mapConfig.north + mapConfig.south) / 2,
    (mapConfig.east + mapConfig.west) / 2,
  ];

  const sensorMarkerRefs = useRef<Record<string, L.Marker>>({});

  // Memoize icon generation to prevent unnecessary HTML string regeneration
  const droneIconCache = useRef<Map<string, DivIcon>>(new Map());
  const sensorIconCache = useRef<Map<string, DivIcon>>(new Map());

  useEffect(() => {
    droneIconCache.current.clear();
  }, [
    Object.values(droneStatus)
      .map((d) => `${d.isLive}-${d.isStale}-${d.hasAlert}`)
      .join("|"),
    Object.values(droneTelemetryData)
      .map((t) => t?.status)
      .join("|"),
  ]);

  useEffect(() => {
    // Close all tooltips first
    Object.values(sensorMarkerRefs.current).forEach((m) => m.closeTooltip());

    if (!focusedSensorId) return;

    const marker = sensorMarkerRefs.current[focusedSensorId];
    if (!marker) return;

    marker.openTooltip();
  }, [focusedSensorId]);

  const getMemoizedDroneIcon = (
    isOnline: boolean,
    isStale: boolean,
    hasAlert: boolean,
    status: "on_air" | "ground" | "reached" | null,
    staticIcon: boolean = false,
  ) => {
    const key = `${currentZoom}-${isOnline}-${isStale}-${hasAlert}-${status}`;

    if (!droneIconCache.current.has(key)) {
      droneIconCache.current.set(
        key,
        getDroneIcon(
          currentZoom,
          isOnline,
          isStale,
          hasAlert,
          status,
          staticIcon,
        ),
      );
    }
    return droneIconCache.current.get(key)!;
  };

  const getMemoizedSensorIcon = (
    sensor: Sensor,
    hasActiveAlert: boolean,
    droneOnSensor: boolean,
    isFocused: boolean,
  ) => {
    const key = `${sensor.id}-${hasActiveAlert}-${currentZoom}-${droneOnSensor}-${isFocused}`;
    if (!sensorIconCache.current.has(key)) {
      sensorIconCache.current.set(
        key,
        getSensorIcon(
          sensor,
          hasActiveAlert,
          currentZoom,
          droneOnSensor,
          isFocused,
        ),
      );
    }
    return sensorIconCache.current.get(key)!;
  };

  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    const onZoomEnd = () => {
      onZoomChange(map.getZoom());
    };

    map.on("zoomend", onZoomEnd);

    return () => {
      map.off("zoomend", onZoomEnd);
    };
  }, [onZoomChange]);

  const visibleSensors = useMemo(() => {
    return sensors.filter((sensor) => {
      // ❌ sensor inactive
      if (sensor.status !== "Active") return false;

      // ❌ area inactive
      if (sensor.area?.status !== "Active") return false;

      return true;
    });
  }, [sensors]);

  const visibleDrones = useMemo(() => {
    return drones.filter((drone) => {
      // ❌ area inactive
      if (drone.area?.status !== "Active") return false;

      return true;
    });
  }, [drones]);

  return (
    <div className="relative h-full w-full">
      {/* Socket status indicator */}
      {/* <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2 rounded-md bg-black/70 px-3 py-1.5 text-xs backdrop-blur-sm">
        <div
          className={`h-2 w-2 rounded-full ${
            socketConnected ? "bg-green-500" : "bg-gray-500"
          }`}
        />
        <span className="text-white">
          {socketConnected ? "Live" : "Offline"}
        </span>
      </div> */}

      {/* <div className="absolute top-4 left-4 z-[1000] rounded-md bg-black/70 px-3 py-1.5 text-xs text-gray-300 backdrop-blur-sm">
        Zoom Level: {currentZoom}
      </div> */}

      <MapContainer
        preferCanvas={true}
        center={center}
        attributionControl={false}
        zoom={mapConfig.minZoom} // only initial value
        minZoom={mapConfig.minZoom}
        maxZoom={Math.min(mapConfig.maxZoom, 19)}
        maxBounds={[
          [mapConfig.south, mapConfig.west],
          [mapConfig.north, mapConfig.east],
        ]}
        maxBoundsViscosity={1.0}
        className="h-full w-full bg-black"
        zoomControl={true}
        doubleClickZoom={false}
        whenCreated={(mapInstance) => {
          leafletMapRef.current = mapInstance;
          onZoomChange(mapInstance.getZoom()); // 🔑 initialize state once
          mapInstance.zoomControl.setPosition("bottomright");
        }}
      >
        <TileLayer
          url={`${API_BASE_URL}/maps/${mapConfig.id}/{z}/{x}/{y}.jpg`}
          minZoom={mapConfig.minZoom}
          maxZoom={Math.min(mapConfig.maxZoom, 19)}
          noWrap={true}
          bounds={[
            [mapConfig.south, mapConfig.west],
            [mapConfig.north, mapConfig.east],
          ]}
          attribution=""
        />
        {/* Sensor markers */}
        {visibleSensors.map((sensor) => {
          const alert = alertBySensorDbId[sensor.id];
          const hasActiveAlert = !!alert && alert.status === "ACTIVE";
          const droneOnSensor =
            getDroneOnSensor(sensor, dronePositions, droneTelemetryData) !==
            null;

          return (
            <Marker
              key={sensor.id}
              position={[sensor.latitude, sensor.longitude]}
              icon={getMemoizedSensorIcon(
                sensor,
                hasActiveAlert,
                droneOnSensor,
                sensor.id === focusedSensorId, // 👈 highlight flag
              )}
              ref={(ref) => {
                if (ref) {
                  sensorMarkerRefs.current[sensor.id] = ref;
                }
              }}
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
        {visibleDrones.map((drone) => {
          const pos = dronePositions[drone.id];
          const status = droneStatus[drone.id];
          const telemetry = droneTelemetryData[drone.id]; // Get telemetry for status

          if (!pos) return null;

          const markerPos: [number, number] = [pos.lat, pos.lng];

          const isOnline = status?.isLive === true;
          const isStale = status?.isStale === true;
          const hasAlert = status?.hasAlert === true;

          // Get status from telemetry (renamed to avoid conflict)
          const currentDroneStatus =
            status?.isLive === false ? null : (telemetry?.status ?? null);

          // Status display based on telemetry.status
          let statusDisplay = "Offline";
          let statusColor = "text-gray-500";
          let statusEmoji = "⚪";
          let statusBadge = "";

          if (isOnline) {
            switch (currentDroneStatus) {
              case "on_air":
                statusDisplay = "In Flight";
                statusColor = "text-blue-400";
                statusEmoji = "✈️";
                statusBadge = "🔵 Flying";
                break;
              case "ground":
                statusDisplay = "On Ground";
                statusColor = "text-gray-400";
                statusEmoji = "🛬";
                statusBadge = "⚪ Landed";
                break;
              case "reached":
                statusDisplay = "Target Reached";
                statusColor = "text-green-400";
                statusEmoji = "🎯";
                statusBadge = "🟢 Reached";
                break;
              default:
                statusDisplay = "Online";
                statusColor = "text-green-600";
                statusEmoji = "🟢";
                statusBadge = "🟢 Active";
            }
          }

          let tooltipStatusText = "● Ready";
          let tooltipStatusColor = "text-gray-400";

          if (status?.recovered) {
            tooltipStatusText = "⚠ Telemetry Recovering";
            tooltipStatusColor = "text-amber-500";
          } else if (status?.hasEverReceivedTelemetry && !isOnline) {
            tooltipStatusText = "○ Link Unavailable";
            tooltipStatusColor = "text-gray-500";
          } else if (hasAlert) {
            tooltipStatusText = "🚨 Telemetry Lost";
            tooltipStatusColor = "text-red-600";
          } else if (isOnline) {
            switch (currentDroneStatus) {
              case "on_air":
                tooltipStatusText = "✈ In Flight";
                tooltipStatusColor = "text-blue-500";
                break;
              case "reached":
                tooltipStatusText = "🎯 At Target";
                tooltipStatusColor = "text-green-500";
                break;
              case "ground":
                tooltipStatusText = "🛬 Idle";
                tooltipStatusColor = "text-gray-400";
                break;
              default:
                tooltipStatusText = "● Ready";
                tooltipStatusColor = "text-gray-400";
            }
          }

          return (
            <Marker
              key={`drone-${drone.id}`}
              position={markerPos}
              icon={getMemoizedDroneIcon(
                isOnline,
                isStale,
                hasAlert,
                currentDroneStatus,
              )}
              zIndexOffset={1000}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent?.stopPropagation();
                  onDroneMarkerClick?.(drone.id, e.originalEvent);
                },
                dblclick: (e) => {
                  e.originalEvent?.stopPropagation();
                },
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

                  <div
                    className={`text-[10px] font-bold ${tooltipStatusColor}`}
                  >
                    {tooltipStatusText}
                  </div>

                  {!isOnline && status?.connectionLossTime && (
                    <div className="text-[9px] text-gray-500">
                      Lost{" "}
                      {Math.floor(
                        (Date.now() - status.connectionLossTime) / 1000,
                      )}
                      s ago
                    </div>
                  )}

                  <div className="text-[10px] text-black-300">
                    Lat: {pos.lat.toFixed(5)}, Lon: {pos.lng.toFixed(5)}
                  </div>
                  {pos.alt != null && (
                    <div className="text-[10px] text-black-300">
                      Alt: {pos.alt} m
                    </div>
                  )}
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {visibleDrones.map((drone) => {
          const telemetry = droneTelemetryData[drone.id];
          const pos = dronePositions[drone.id];

          // Must have everything
          if (
            !telemetry ||
            !pos ||
            drone.latitude == null ||
            drone.longitude == null
          ) {
            return null;
          }

          // 🧠 Distance from base
          const distanceFromBase = haversineMeters(
            pos.lat,
            pos.lng,
            drone.latitude,
            drone.longitude,
          );

          // ✅ Hide base marker once drone is back home
          if (distanceFromBase <= REACH_RADIUS_METERS) {
            return null;
          }

          return (
            <Marker
              key={`base-${drone.id}`}
              position={[drone.latitude, drone.longitude]}
              icon={getMemoizedDroneIcon(
                true, // base is always "online"
                false,
                false,
                "ground",
                true, // static icon
              )}
              zIndexOffset={-1000}
              interactive={true}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-black">🏠 Base</div>
                  <div className="text-[10px] text-black-300">
                    Drone: {drone.droneId}
                  </div>
                  <div className="text-[10px] text-black-300">
                    Lat: {drone.latitude.toFixed(5)}
                  </div>
                  <div className="text-[10px] text-black-300">
                    Lon: {drone.longitude.toFixed(5)}
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* Drone path from telemetry */}
        {visibleDrones.map((drone) => {
          const telemetry = droneTelemetryData[drone.id];
          if (!telemetry) return null;

          // Only draw when drone is flying
          const status = droneStatus[drone.id];

          if (
            !status?.isLive ||
            status.isStale ||
            telemetry.status === "ground" ||
            telemetry.targetLat == null ||
            telemetry.targetLng == null
          ) {
            return null;
          }

          return (
            <Polyline
              key={`telemetry-path-${drone.id}`}
              positions={[
                [telemetry.lat, telemetry.lng],
                [telemetry.targetLat, telemetry.targetLng],
              ]}
              pathOptions={{
                color: "#f59e0b",
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

export default React.memo(MapRenderer);
