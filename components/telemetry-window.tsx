"use client";

import { useEffect, useState } from "react";
import { X, ChevronDown, ChevronUp, Package, RotateCcw } from "lucide-react";
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
  status: string | null;
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

  if (!telemetry || !isOpen) return null;

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
    <div className="fixed bottom-4 right-4 w-[26rem] rounded-lg border border-[#333] bg-[#111] shadow-2xl z-[900]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#333] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-white">
            {telemetry.droneId}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-[#222] rounded transition-colors"
            aria-label={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-900/30 rounded transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="px-5 py-4 space-y-4">
          {/* Position & Altitude */}
          <div className="rounded-md bg-[#1a1a1a] p-3 space-y-2">
            <div className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Location
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Latitude:</span>
                <div className="text-gray-200 font-mono">
                  {toNumber(telemetry.lat)?.toFixed(6) ?? "N/A"}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Longitude:</span>
                <div className="text-gray-200 font-mono">
                  {toNumber(telemetry.lng)?.toFixed(6) ?? "N/A"}
                </div>
              </div>
            </div>
            {telemetry.alt !== null && (
              <div>
                <span className="text-gray-400">Altitude:</span>
                <div className="text-blue-400 font-semibold">
                  {toNumber(telemetry.alt) ?? "N/A"} m
                </div>
              </div>
            )}
          </div>

          {/* Battery & Speed */}
          <div className="rounded-md bg-[#1a1a1a] p-3 space-y-2">
            <div className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Status
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {telemetry.battery !== null && (
                <div>
                  <span className="text-gray-400">Battery:</span>
                  <div
                    className={`font-semibold ${getTelemetryColor(
                      toNumber(telemetry.battery),
                      {
                        good: 12,
                        warning: 10,
                      }
                    )}`}
                  >
                    {toNumber(telemetry.battery)?.toFixed(2) ?? "N/A"} V
                  </div>
                </div>
              )}
              {telemetry.speed !== null && (
                <div>
                  <span className="text-gray-400">Speed:</span>
                  <div className="text-gray-200 font-semibold">
                    {toNumber(telemetry.speed)?.toFixed(1) ?? "N/A"} m/s
                  </div>
                </div>
              )}
            </div>
            {telemetry.mode && (
              <div>
                <span className="text-gray-400">Mode:</span>
                <div className="text-purple-400 font-semibold">
                  {telemetry.mode}
                </div>
              </div>
            )}
          </div>

          {/* GPS & Satellite */}
          <div className="rounded-md bg-[#1a1a1a] p-3 space-y-2">
            <div className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              GPS
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {telemetry.gpsFix && (
                <div>
                  <span className="text-gray-400">Fix:</span>
                  <div className="text-green-400 font-semibold">
                    {telemetry.gpsFix}
                  </div>
                </div>
              )}
              {telemetry.satellites !== null && (
                <div>
                  <span className="text-gray-400">Satellites:</span>
                  <div className="text-gray-200 font-semibold">
                    {toNumber(telemetry.satellites) ?? "N/A"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Environmental */}
          {(telemetry.windSpeed !== null ||
            telemetry.targetDistance !== null) && (
            <div className="rounded-md bg-[#1a1a1a] p-3 space-y-2">
              <div className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Environment
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {telemetry.windSpeed !== null && (
                  <div>
                    <span className="text-gray-400">Wind:</span>
                    <div className="text-gray-200 font-semibold">
                      {toNumber(telemetry.windSpeed)?.toFixed(1) ?? "N/A"} m/s
                    </div>
                  </div>
                )}
                {telemetry.targetDistance !== null && (
                  <div>
                    <span className="text-gray-400">To Target:</span>
                    <div className="text-gray-200 font-semibold">
                      {toNumber(telemetry.targetDistance)?.toFixed(1) ?? "N/A"}{" "}
                      m
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-[10px] text-gray-500 text-center">
            Last update: {formatTime(telemetry.ts)}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isMinimized && (
        <div className="border-t border-[#333] px-4 py-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-amber-700 bg-transparent text-amber-400 hover:bg-amber-900/30 hover:text-amber-300 text-xs"
            onClick={handleDropPayload}
          >
            {dropDisabled
              ? `Cooldown ${Math.ceil(dropCooldownRemaining / 1000)}s`
              : "Drop Payload"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-blue-700 bg-transparent text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 text-xs"
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
