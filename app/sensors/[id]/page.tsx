// app/sensors/[id]/page.tsx
// Updated View Sensor Page with Backend Integration + RTSP URL
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Radio,
  MapPin,
  Battery,
  Wifi,
  Activity,
  Globe,
  Bell,
  Plane,
  Power,
  Loader2,
} from "lucide-react";
import { getSensorById, deleteSensor, type Sensor } from "@/lib/api/sensors";
import { useToast } from "@/hooks/use-toast";

export default function ViewSensorPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchSensorDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchSensorDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSensorById(params.id as string, true);
      if (response.success && response.data) {
        setSensor(response.data);
      } else {
        setError(response.error || "Failed to fetch sensor details");
        toast({
          title: "Error",
          description: response.error || "Failed to fetch sensor details",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("Failed to fetch sensor details");
      toast({
        title: "Error",
        description: "Failed to fetch sensor details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "active":
      case "online":
        return (
          <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
        );
      case "inactive":
      case "offline":
        return <Badge className="bg-red-600 hover:bg-red-700">Inactive</Badge>;
      case "warning":
        return (
          <Badge className="bg-yellow-600 hover:bg-yellow-700">Warning</Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleDelete = async () => {
    if (!sensor) return;

    setDeleting(true);
    try {
      const response = await deleteSensor(sensor.id);
      if (response.success) {
        toast({
          title: "Success",
          description: `Sensor "${sensor.name}" deleted successfully`,
        });
        router.push("/sensors");
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete sensor",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete sensor",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex h-screen flex-col bg-[#1a1a1a]">
        <DashboardHeader activeItem="SENSORS" />
        <div className="relative flex flex-1 overflow-hidden">
          <DashboardSidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className="flex flex-1 items-center justify-center p-4">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#2563EB]" />
              <p className="text-lg font-medium text-gray-400">
                Loading sensor details...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error State or Sensor Not Found
  if (error || !sensor) {
    return (
      <div className="flex h-screen flex-col bg-[#1a1a1a]">
        <DashboardHeader activeItem="SENSORS" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Radio className="mx-auto h-16 w-16 text-gray-500" />
            <h2 className="mt-4 text-xl text-white">Sensor not found</h2>
            <p className="mt-2 text-gray-400">
              {error || "The sensor you're looking for doesn't exist."}
            </p>
            <Link href="/sensors">
              <Button className="mt-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                Back to Sensors
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader activeItem="SENSORS" />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {/* Back Link */}
            <Link
              href="/sensors"
              className="mb-6 inline-flex items-center gap-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sensors
            </Link>

            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-[#4A9FD4]">
                    {sensor.name}
                  </h1>
                  {getStatusBadge(sensor.status)}
                </div>
                <p className="mt-1 font-mono text-sm text-gray-400">
                  {sensor.sensorId}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/sensors/${sensor.id}/edit`}>
                  <Button className="gap-2 bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="gap-2"
                      disabled={deleting}
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-[#333] bg-[#222]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">
                        Delete Sensor
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        Are you sure you want to delete "{sensor.name}"? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-[#333] bg-transparent text-white hover:bg-[#333]">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-[#333] bg-[#222]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-blue-500/20 p-3">
                    <Radio className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Type</p>
                    <p className="text-lg font-semibold text-white">
                      {sensor.sensorType}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#222]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-green-500/20 p-3">
                    <Battery className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Battery</p>
                    <p className="text-lg font-semibold text-white">
                      {sensor.battery || "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#222]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-purple-500/20 p-3">
                    <MapPin className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Area</p>
                    <p className="text-lg font-semibold text-white">
                      {sensor.area?.name || "Unassigned"}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#222]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-yellow-500/20 p-3">
                    <Activity className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Mode</p>
                    <p className="text-lg font-semibold text-white">
                      {sensor.activeShuruMode}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Details Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Sensor Information */}
              <Card className="border-[#333] bg-[#222]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Radio className="h-5 w-5 text-[#4A9FD4]" />
                    Sensor Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Sensor ID</span>
                    <span className="font-mono text-white">
                      {sensor.sensorId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Name</span>
                    <span className="text-white">{sensor.name}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Sensor Type</span>
                    <span className="text-white">{sensor.sensorType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Created</span>
                    <span className="text-white">
                      {formatDate(sensor.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Network & Status */}
              <Card className="border-[#333] bg-[#222]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Wifi className="h-5 w-5 text-[#4A9FD4]" />
                    Network & Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">IP Address</span>
                    <span className="font-mono text-white">
                      {sensor.ipAddress || "N/A"}
                    </span>
                  </div>

                  {/* 🔹 RTSP URL row */}
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">RTSP URL</span>
                    <span className="max-w-[260px] truncate font-mono text-white">
                      {sensor.rtspUrl || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Status</span>
                    {getStatusBadge(sensor.status)}
                  </div>
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Battery</span>
                    <span className="text-white">
                      {sensor.battery || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Active Mode</span>
                    <Badge
                      className={
                        sensor.activeShuruMode.toLowerCase() === "active"
                          ? "bg-green-600"
                          : "bg-gray-600"
                      }
                    >
                      {sensor.activeShuruMode}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card className="border-[#333] bg-[#222]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Globe className="h-5 w-5 text-[#4A9FD4]" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Area</span>
                    <span className="text-white">
                      {sensor.area?.name || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Latitude</span>
                    <span className="font-mono text-white">
                      {sensor.latitude.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Longitude</span>
                    <span className="font-mono text-white">
                      {sensor.longitude.toFixed(6)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Automation Settings */}
              <Card className="border-[#333] bg-[#222]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Power className="h-5 w-5 text-[#4A9FD4]" />
                    Automation Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="flex items-center gap-2 text-gray-400">
                      <Bell className="h-4 w-4" />
                      Alarm
                    </span>
                    <span className="text-white">
                      {sensor.alarm?.name || "None"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="flex items-center gap-2 text-gray-400">
                      <Plane className="h-4 w-4" />
                      Send Drone
                    </span>
                    <Badge
                      className={
                        sensor.sendDrone === "Yes"
                          ? "bg-green-600"
                          : "bg-gray-600"
                      }
                    >
                      {sensor.sendDrone}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Last Updated</span>
                    <span className="text-sm text-white">
                      {formatDate(sensor.updatedAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Map Preview */}
            <Card className="mt-6 border-[#333] bg-[#222]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MapPin className="h-5 w-5 text-[#4A9FD4]" />
                  Location Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-48 overflow-hidden rounded-lg bg-[#1a1a1a] sm:h-64">
                  {/* Placeholder preview - actual map is in main dashboard */}
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4A9FD4] shadow-lg">
                        <Radio className="h-5 w-5 text-white" />
                      </div>
                      <span className="rounded bg-black/50 px-3 py-1 text-sm font-mono text-white">
                        {sensor.latitude.toFixed(4)},{" "}
                        {sensor.longitude.toFixed(4)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {sensor.area?.name || "Unassigned Area"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
