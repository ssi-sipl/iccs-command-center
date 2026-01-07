// app/drones/[id]/page.tsx
// Updated View Drone Page with Backend Integration
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Pencil,
  Plane,
  Battery,
  Gauge,
  Satellite,
  Wind,
  Navigation,
  Loader2,
  Calendar,
  MapPin,
  Video,
  ExternalLink,
} from "lucide-react";
import { getDroneOSById, type DroneOS } from "@/lib/api/droneos";
import { useToast } from "@/hooks/use-toast";

export default function ViewDronePage() {
  const params = useParams();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drone, setDrone] = useState<DroneOS | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchDroneDetails();
    }
  }, [params.id]);

  const fetchDroneDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDroneOSById(params.id as string, true); // Include area
      if (response.success && response.data) {
        setDrone(response.data);
      } else {
        setError(response.error || "Failed to fetch drone details");
        toast({
          title: "Error",
          description: response.error || "Failed to fetch drone details",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("Failed to fetch drone details");
      toast({
        title: "Error",
        description: "Failed to fetch drone details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get battery level badge color
  const getBatteryBadge = (batteryLevel: number) => {
    if (batteryLevel >= 50) {
      return (
        <Badge className="bg-green-600/20 text-green-400">
          {batteryLevel}%
        </Badge>
      );
    } else if (batteryLevel >= 20) {
      return (
        <Badge className="bg-yellow-600/20 text-yellow-400">
          {batteryLevel}%
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-600/20 text-red-400">{batteryLevel}%</Badge>
      );
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#8B0000]" />
          <p className="text-lg font-medium text-gray-400">
            Loading drone details...
          </p>
        </div>
      </div>
    );
  }

  // Error State or Drone Not Found
  if (error || !drone) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <Plane className="mx-auto mb-4 h-16 w-16 text-gray-600" />
          <h2 className="text-xl font-semibold text-white">Drone Not Found</h2>
          <p className="mt-2 text-gray-400">
            {error || "The drone you're looking for doesn't exist."}
          </p>
          <Link href="/drones">
            <Button className="mt-4 bg-[#8B0000] text-white hover:bg-[#6B0000]">
              Back to Drones
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Back Button */}
        <Link
          href="/drones"
          className="mb-6 inline-flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Drones
        </Link>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#8B0000]">
              <Plane className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">
                  {drone.droneOSName}
                </h1>
                {getBatteryBadge(drone.minBatteryLevel)}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{drone.droneType}</span>
                {/* NEW: Drone ID Badge */}
                {drone.droneId && (
                  <>
                    <span>•</span>
                    <Badge
                      variant="outline"
                      className="border-[#444] text-gray-300"
                    >
                      {drone.droneId}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {/* NEW: Video Stream Button */}
            {/* {drone.videoLink && (
                  <a
                    href={drone.videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      className="gap-2 border-[#444] bg-transparent text-white hover:bg-[#333]"
                    >
                      <Video className="h-4 w-4" />
                      View Stream
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                )} */}
            <Link href={`/drones/${drone.id}/edit`}>
              <Button className="gap-2 bg-[#8B0000] text-white hover:bg-[#6B0000]">
                <Pencil className="h-4 w-4" />
                Edit Drone
              </Button>
            </Link>
          </div>
        </div>

        {/* NEW: Area Badge (if assigned) */}
        {drone.area && (
          <div className="mb-6">
            <Card className="border-blue-600/30 bg-blue-600/10">
              <CardContent className="flex items-center gap-3 p-4">
                <MapPin className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Assigned Area</p>
                  <p className="font-semibold text-white">
                    {drone.area.name} ({drone.area.areaId})
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-[#333] bg-[#222]">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/20">
                <Gauge className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Max Speed</p>
                <p className="text-2xl font-bold text-white">
                  {drone.droneSpeed} m/s
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#333] bg-[#222]">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-600/20">
                <Navigation className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Max Altitude</p>
                <p className="text-2xl font-bold text-white">
                  {drone.maxAltitude}m
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#333] bg-[#222]">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-600/20">
                <Battery className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Min Battery</p>
                <p className="text-2xl font-bold text-white">
                  {drone.minBatteryLevel}%
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#333] bg-[#222]">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600/20">
                <Wind className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Max Wind</p>
                <p className="text-2xl font-bold text-white">
                  {drone.maxWindSpeed} m/s
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* General Settings */}
          <Card className="border-[#333] bg-[#222]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Plane className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* NEW: Drone ID */}
              <div className="flex justify-between border-b border-[#333] pb-3">
                <span className="text-gray-400">Drone ID</span>
                <span className="font-mono text-white">{drone.droneId}</span>
              </div>
              <div className="flex justify-between border-b border-[#333] pb-3">
                <span className="text-gray-400">OS Name</span>
                <span className="text-white">{drone.droneOSName}</span>
              </div>
              {/* <div className="flex justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Area</span>
                    <span className="text-white">
                      {drone?.area?.name || "None"}
                    </span>
                  </div> */}
              <div className="flex justify-between border-b border-[#333] pb-3">
                <span className="text-gray-400">Drone Type</span>
                <span className="text-white">{drone.droneType}</span>
              </div>
              {/* NEW: Video Link */}
              {drone.videoLink && (
                <div className="flex justify-between border-b border-[#333] pb-3">
                  <span className="text-gray-400">Video Stream</span>
                  <span className="max-w-[260px] truncate font-mono text-white">
                    {drone.videoLink || "N/A"}
                  </span>
                </div>
              )}
              {/* NEW: Assigned Area */}
              {drone.area && (
                <div className="flex justify-between border-b border-[#333] pb-3">
                  <span className="text-gray-400">Assigned Area</span>
                  <span className="text-white">
                    {drone.area.name} ({drone.area.areaId})
                  </span>
                </div>
              )}
              <div className="flex justify-between border-b border-[#333] pb-3">
                <span className="text-gray-400">Target Altitude</span>
                <span className="font-mono text-white">
                  {drone.targetAltitude}m
                </span>
              </div>
              <div className="flex justify-between border-b border-[#333] pb-3">
                <span className="text-gray-400">Max Altitude</span>
                <span className="font-mono text-white">
                  {drone.maxAltitude}m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">USB Address</span>
                <span className="font-mono text-white">{drone.usbAddress}</span>
              </div>
            </CardContent>
          </Card>

          {/* GPS Settings */}
          <Card className="border-[#333] bg-[#222]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Satellite className="h-5 w-5" />
                GPS Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between border-b border-[#333] pb-3">
                <span className="text-gray-400">GPS Name</span>
                <span className="text-white">{drone.gpsName}</span>
              </div>
              <div className="flex justify-between border-b border-[#333] pb-3">
                <span className="text-gray-400">GPS Fix</span>
                <span className="text-white">{drone.gpsFix}</span>
              </div>
              <div className="flex justify-between border-b border-[#333] pb-3">
                <span className="text-gray-400">Min HDOP</span>
                <span className="font-mono text-white">{drone.minHDOP}</span>
              </div>
              <div className="flex justify-between border-b border-[#333] pb-3">
                <span className="text-gray-400">Min Sat Count</span>
                <span className="font-mono text-white">
                  {drone.minSatCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">GPS Lost Action</span>
                <span className="text-white">{drone.gpsLost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Latitude</span>
                <span className="text-white">{drone.latitude}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Longitude</span>
                <span className="text-white">{drone.longitude}</span>
              </div>
            </CardContent>
          </Card>

          {/* Safety Settings */}
          <Card className="border-[#333] bg-[#222]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Battery className="h-5 w-5" />
                Safety Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between border-b border-[#333] pb-3">
                <span className="text-gray-400">Min Battery Level</span>
                <span className="font-mono text-white">
                  {drone.minBatteryLevel}%
                </span>
              </div>
              <div className="flex justify-between border-b border-[#333] pb-3">
                <span className="text-gray-400">Battery Fail Safe</span>
                <span className="text-white">{drone.batteryFailSafe}</span>
              </div>
              <div className="flex justify-between border-b border-[#333] pb-3">
                <span className="text-gray-400">Telemetry Lost Action</span>
                <span className="text-white">{drone.telemetryLost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max Wind Speed</span>
                <span className="font-mono text-white">
                  {drone.maxWindSpeed} m/s
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="border-[#333] bg-[#222]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Calendar className="h-5 w-5" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between border-b border-[#333] pb-3">
                <span className="text-gray-400">Created At</span>
                <span className="text-white">
                  {formatDate(drone.createdAt)}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#333] pb-3">
                <span className="text-gray-400">Last Updated</span>
                <span className="text-white">
                  {formatDate(drone.updatedAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Battery Status</span>
                {getBatteryBadge(drone.minBatteryLevel)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
