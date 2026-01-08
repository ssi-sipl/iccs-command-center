"use client";

import { useEffect, useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { dropPayload, recallDrone } from "@/lib/api/droneCommand";
import { Button } from "@/components/ui/button";

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
  targetDistance: number | null;
  status: "on_air" | "ground" | "reached" | null; // ✅ UPDATED
  command: string | null;
  ts: number;
}

interface TelemetryWindowProps {
  telemetry: DroneTelemetry | null;
  isOpen: boolean;
  onClose: () => void;
  onDropPayload?: () => void;
  onRecall?: () => void;
}

const DROP_PAYLOAD_COOLDOWN_MS = 10_000; // 10 sec
const RECALL_COOLDOWN_MS = 10_000; // 10 sec

// Helper function to get status display info
export function getDroneStatusInfo(status: DroneTelemetry["status"]) {
  switch (status) {
    case "on_air":
      return {
        label: "In Flight",
        emoji: "✈️",
        color: "text-blue-400",
        bgColor: "bg-blue-500/20",
        borderColor: "border-blue-500",
      };
    case "ground":
      return {
        label: "On Ground",
        emoji: "🛬",
        color: "text-gray-400",
        bgColor: "bg-gray-500/20",
        borderColor: "border-gray-500",
      };
    case "reached":
      return {
        label: "Target Reached",
        emoji: "🎯",
        color: "text-green-400",
        bgColor: "bg-green-500/20",
        borderColor: "border-green-500",
      };
    default:
      return {
        label: "Unknown",
        emoji: "❓",
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
        borderColor: "border-yellow-500",
      };
  }
}

export function TelemetryWindow({
  telemetry,
  isOpen,
  onClose,
  onDropPayload,
  onRecall,
}: TelemetryWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastDropAt, setLastDropAt] = useState<number | null>(null);
  const [lastRecallAt, setLastRecallAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const dropCooldownRemaining =
    lastDropAt === null
      ? 0
      : Math.max(0, DROP_PAYLOAD_COOLDOWN_MS - (now - lastDropAt));

  const recallCooldownRemaining =
    lastRecallAt === null
      ? 0
      : Math.max(0, RECALL_COOLDOWN_MS - (now - lastRecallAt));

  const dropDisabled = dropCooldownRemaining > 0;
  const recallDisabled = recallCooldownRemaining > 0;

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  if (!isOpen) return null;

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString();
  };

  const getTelemetryColor = (
    value: number | null,
    thresholds?: { good: number; warning: number }
  ) => {
    if (value === null) return "text-gray-400";
    if (!thresholds) return "text-gray-300";
    if (value >= thresholds.good) return "text-green-400";
    if (value >= thresholds.warning) return "text-yellow-400";
    return "text-red-400";
  };

  const toNumber = (value: any): number | null => {
    if (value === null || value === undefined) return null;
    const num = typeof value === "string" ? Number.parseFloat(value) : value;
    return isNaN(num) ? null : num;
  };

  const handleDropPayload = async () => {
    if (!telemetry?.droneDbId || dropDisabled) return;

    await dropPayload({ droneDbId: telemetry.droneDbId });
    setLastDropAt(Date.now());
  };

  const handleRecallDrone = async () => {
    if (!telemetry?.droneDbId || recallDisabled) return;

    await recallDrone({ droneDbId: telemetry.droneDbId });
    setLastRecallAt(Date.now());
  };

  return (
    <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 w-[calc(100vw-1rem)] sm:w-[380px] md:w-[420px] lg:w-[26rem] rounded-lg border border-[#333] bg-[#111] shadow-2xl z-[900]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#333] px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {telemetry?.status ? (
            <div
              className={`h-2 w-2 rounded-full animate-pulse flex-shrink-0 ${
                telemetry.status === "on_air"
                  ? "bg-blue-500"
                  : telemetry.status === "ground"
                  ? "bg-gray-500"
                  : telemetry.status === "reached"
                  ? "bg-green-500"
                  : "bg-yellow-500"
              }`}
            />
          ) : (
            <div className="h-2 w-2 rounded-full bg-gray-500 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold text-white truncate">
              {telemetry?.droneId ?? `Drone (Offline)`}
            </h3>
            {telemetry?.status && (
              <div
                className={`text-[9px] sm:text-[10px] font-medium ${
                  getDroneStatusInfo(telemetry.status).color
                }`}
              >
                {getDroneStatusInfo(telemetry.status).emoji}{" "}
                {getDroneStatusInfo(telemetry.status).label}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-[#222] rounded transition-colors"
            aria-label={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-900/30 rounded transition-colors"
            aria-label="Close"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Content - optimized grid layout to prevent scrolling with tighter spacing */}
      {!isMinimized && (
        <div className="px-3 sm:px-5 py-3 sm:py-4 space-y-2 sm:space-y-3 max-h-[calc(100vh-280px)] sm:max-h-none overflow-y-auto sm:overflow-visible">
          {/* Position & Altitude */}
          <div className="rounded-md bg-[#1a1a1a] p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
            <div className="text-[10px] sm:text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Location
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
              <div className="min-w-0">
                <span className="text-gray-400 block">Latitude:</span>
                <div className="text-gray-200 font-mono text-[9px] sm:text-[10px] truncate">
                  {toNumber(telemetry?.lat)?.toFixed(6) ?? "N/A"}
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-gray-400 block">Longitude:</span>
                <div className="text-gray-200 font-mono text-[9px] sm:text-[10px] truncate">
                  {toNumber(telemetry?.lng)?.toFixed(6) ?? "N/A"}
                </div>
              </div>
            </div>
            {telemetry?.alt !== null && (
              <div>
                <span className="text-gray-400 text-[10px] sm:text-xs">
                  Altitude:
                </span>
                <div className="text-blue-400 font-semibold text-[10px] sm:text-xs">
                  {toNumber(telemetry?.alt) ?? "N/A"} m
                </div>
              </div>
            )}
          </div>

          {/* Drone Status */}
          {telemetry?.status && (
            <div
              className={`rounded-md p-2.5 sm:p-3 space-y-1.5 sm:space-y-2 border ${
                getDroneStatusInfo(telemetry.status).borderColor
              } ${getDroneStatusInfo(telemetry.status).bgColor}`}
            >
              <div className="text-[10px] sm:text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Drone Status
              </div>
              <div className="flex items-start gap-2 sm:gap-2">
                <span className="text-lg sm:text-2xl flex-shrink-0">
                  {getDroneStatusInfo(telemetry.status).emoji}
                </span>
                <div className="min-w-0">
                  <div
                    className={`text-xs sm:text-sm font-bold ${
                      getDroneStatusInfo(telemetry.status).color
                    }`}
                  >
                    {getDroneStatusInfo(telemetry.status).label}
                  </div>
                  {telemetry.status === "reached" &&
                    telemetry.targetDistance !== null && (
                      <div className="text-[8px] sm:text-[10px] text-gray-400">
                        Distance: {telemetry.targetDistance.toFixed(1)}m
                      </div>
                    )}
                  {telemetry.status === "on_air" && telemetry.alt !== null && (
                    <div className="text-[8px] sm:text-[10px] text-gray-400">
                      Alt: {telemetry.alt}m
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Battery & Speed */}
          <div className="rounded-md bg-[#1a1a1a] p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
            <div className="text-[10px] sm:text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Status
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
              {telemetry?.battery !== null && (
                <div>
                  <span className="text-gray-400">Battery:</span>
                  <div
                    className={`font-semibold text-[9px] sm:text-[10px] ${getTelemetryColor(
                      toNumber(telemetry?.battery),
                      {
                        good: 12,
                        warning: 10,
                      }
                    )}`}
                  >
                    {toNumber(telemetry?.battery)?.toFixed(2) ?? "N/A"} V
                  </div>
                </div>
              )}
              {telemetry?.speed !== null && (
                <div>
                  <span className="text-gray-400">Speed:</span>
                  <div className="text-gray-200 font-semibold text-[9px] sm:text-[10px]">
                    {toNumber(telemetry?.speed)?.toFixed(1) ?? "N/A"} m/s
                  </div>
                </div>
              )}
            </div>
            {telemetry?.mode && (
              <div>
                <span className="text-gray-400 text-[10px] sm:text-xs">
                  Mode:
                </span>
                <div className="text-purple-400 font-semibold text-[10px] sm:text-xs truncate">
                  {telemetry?.mode}
                </div>
              </div>
            )}
          </div>

          {/* GPS & Satellite */}
          <div className="rounded-md bg-[#1a1a1a] p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
            <div className="text-[10px] sm:text-xs font-semibold text-gray-300 uppercase tracking-wide">
              GPS
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
              {telemetry?.gpsFix && (
                <div>
                  <span className="text-gray-400">Fix:</span>
                  <div className="text-green-400 font-semibold text-[9px] sm:text-[10px]">
                    {telemetry?.gpsFix}
                  </div>
                </div>
              )}
              {telemetry?.satellites !== null && (
                <div>
                  <span className="text-gray-400">Satellites:</span>
                  <div className="text-gray-200 font-semibold text-[9px] sm:text-[10px]">
                    {toNumber(telemetry?.satellites) ?? "N/A"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Environmental */}
          {(telemetry?.windSpeed !== null ||
            telemetry?.targetDistance !== null) && (
            <div className="rounded-md bg-[#1a1a1a] p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
              <div className="text-[10px] sm:text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Environment
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                {telemetry?.windSpeed !== null && (
                  <div>
                    <span className="text-gray-400">Wind:</span>
                    <div className="text-gray-200 font-semibold text-[9px] sm:text-[10px]">
                      {toNumber(telemetry?.windSpeed)?.toFixed(1) ?? "N/A"} m/s
                    </div>
                  </div>
                )}
                {telemetry?.targetDistance !== null && (
                  <div>
                    <span className="text-gray-400">To Target:</span>
                    <div className="text-gray-200 font-semibold text-[9px] sm:text-[10px]">
                      {toNumber(telemetry?.targetDistance)?.toFixed(1) ?? "N/A"}{" "}
                      m
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-[8px] sm:text-[10px] text-gray-500 text-center pt-1">
            Last update: {formatTime(telemetry?.ts)}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isMinimized && (
        <div className="border-t border-[#333] px-3 sm:px-4 py-2 sm:py-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!telemetry?.droneDbId || dropDisabled}
            className="flex-1 border-amber-700 bg-transparent text-amber-400 hover:bg-amber-900/30 hover:text-amber-300 text-[11px] sm:text-xs py-1.5 sm:py-2 h-auto"
            onClick={handleDropPayload}
          >
            {dropDisabled
              ? `Cooldown ${Math.ceil(dropCooldownRemaining / 1000)}s`
              : "Drop Payload"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={!telemetry?.droneDbId || recallDisabled}
            className="flex-1 border-blue-700 bg-transparent text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 text-[11px] sm:text-xs py-1.5 sm:py-2 h-auto"
            onClick={handleRecallDrone}
          >
            {recallDisabled
              ? `Cooldown ${Math.ceil(recallCooldownRemaining / 1000)}s`
              : "Recall"}
          </Button>
        </div>
      )}
    </div>
  );
}
