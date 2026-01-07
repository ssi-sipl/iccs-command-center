// app/area/[id]/page.tsx
// Updated View Area Page with Backend Integration
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
  ArrowLeft,
  Pencil,
  MapPin,
  Calendar,
  Hash,
  Navigation,
  Loader2,
  Antenna,
  AlertTriangle,
} from "lucide-react";
import { getAreaById, type Area } from "@/lib/api/areas";
import { useToast } from "@/hooks/use-toast";

export default function ViewAreaPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [area, setArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchAreaDetails();
    }
  }, [params.id]);

  const fetchAreaDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAreaById(params.id as string, true);
      if (response.success && response.data) {
        setArea(response.data);
      } else {
        setError(response.error || "Failed to fetch area details");
        toast({
          title: "Error",
          description: response.error || "Failed to fetch area details",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("Failed to fetch area details");
      toast({
        title: "Error",
        description: "Failed to fetch area details",
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
    });
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex h-screen flex-col bg-[#1a1a1a]">
        <DashboardHeader activeItem="AREA" />
        <div className="relative flex flex-1 overflow-hidden">
          <DashboardSidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className="flex flex-1 items-center justify-center p-4">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#8B0000]" />
              <p className="text-lg font-medium text-gray-400">
                Loading area details...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error State or Area Not Found
  if (error || !area) {
    return (
      <div className="flex h-screen flex-col bg-[#1a1a1a]">
        <DashboardHeader activeItem="AREA" />
        <div className="relative flex flex-1 overflow-hidden">
          <DashboardSidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className="flex flex-1 items-center justify-center p-4">
            <div className="text-center">
              <MapPin className="mx-auto mb-4 h-12 w-12 text-gray-600" />
              <h1 className="mb-2 text-xl font-bold text-white">
                Area Not Found
              </h1>
              <p className="mb-4 text-gray-400">
                {error || "The requested area does not exist."}
              </p>
              <Link href="/area">
                <Button className="bg-[#8B0000] text-white hover:bg-[#6B0000]">
                  Back to Areas
                </Button>
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Button */}
        <Link
          href="/area"
          className="mb-6 inline-flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Areas
        </Link>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                {area.name}
              </h1>
              <Badge
                className={
                  area.status.toLowerCase() === "active"
                    ? "bg-green-600/20 text-green-400"
                    : "bg-red-600/20 text-red-400"
                }
              >
                {area.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-400">{area.areaId}</p>
          </div>
          <Link href={`/area/${area.id}/edit`}>
            <Button className="gap-2 bg-[#8B0000] text-white hover:bg-[#6B0000]">
              <Pencil className="h-4 w-4" />
              Edit Area
            </Button>
          </Link>
        </div>

        {/* Details Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-[#333] bg-[#222]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-400">
                <Hash className="h-4 w-4" />
                Area ID
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-white">{area.areaId}</p>
            </CardContent>
          </Card>

          <Card className="border-[#333] bg-[#222]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-400">
                <Calendar className="h-4 w-4" />
                Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-white">
                {formatDate(area.createdAt)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#333] bg-[#222]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-400">
                <Navigation className="h-4 w-4" />
                Latitude
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-lg font-semibold text-white">
                {area.latitude.toFixed(4)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#333] bg-[#222]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-400">
                <Navigation className="h-4 w-4 rotate-90" />
                Longitude
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-lg font-semibold text-white">
                {area.longitude.toFixed(4)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="border-[#333] bg-[#222]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-400">
                <Antenna className="h-4 w-4" />
                Sensors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">
                {area.sensors?.length || 0}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {area.sensors?.filter(
                  (s) => s.status?.toLowerCase() === "active"
                ).length || 0}{" "}
                active
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#333] bg-[#222]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-400">
                <AlertTriangle className="h-4 w-4" />
                Alarms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">
                {area.alarms?.length || 0}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {area.alarms?.filter(
                  (a) => a.status?.toLowerCase() === "active"
                ).length || 0}{" "}
                active
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Map Preview */}
        {/* <Card className="mt-6 border-[#333] bg-[#222]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MapPin className="h-5 w-5" />
                  Location Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video overflow-hidden rounded-lg bg-[#1a1a1a]">
                  {/* Google Maps Static API or Mapbox Static Image */}
        {/* <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${area.latitude},${area.longitude}&zoom=15`}
              className="rounded-lg"
            ></iframe> */}

        {/* Fallback - Static image with coordinates */}
        {/* <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center">
                      <MapPin className="mx-auto mb-2 h-12 w-12 text-[#8B0000]" />
                      <p className="font-mono text-sm text-white">
                        {area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div> */}

        {/* <div className="absolute bottom-4 left-4 rounded-lg bg-black/70 px-3 py-2">
                    <p className="font-mono text-sm text-white">
                      {area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card> */}

        {/* Associated Sensors List */}
        {area.sensors && area.sensors.length > 0 && (
          <Card className="mt-6 border-[#333] bg-[#222]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Antenna className="h-5 w-5" />
                Associated Sensors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {area.sensors.map((sensor: any) => (
                  <div
                    key={sensor.id}
                    className="flex items-center justify-between rounded-lg border border-[#333] bg-[#1a1a1a] p-3"
                  >
                    <div>
                      <p className="font-medium text-white">{sensor.name}</p>
                      <p className="text-sm text-gray-400">{sensor.sensorId}</p>
                    </div>
                    <Badge
                      className={
                        sensor.status?.toLowerCase() === "active"
                          ? "bg-green-600/20 text-green-400"
                          : "bg-red-600/20 text-red-400"
                      }
                    >
                      {sensor.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Associated Alarms List */}
        {area.alarms && area.alarms.length > 0 && (
          <Card className="mt-6 border-[#333] bg-[#222]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-5 w-5" />
                Associated Alarms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {area.alarms.map((alarm: any) => (
                  <div
                    key={alarm.id}
                    className="flex items-center justify-between rounded-lg border border-[#333] bg-[#1a1a1a] p-3"
                  >
                    <div>
                      <p className="font-medium text-white">{alarm.name}</p>
                      <p className="text-sm text-gray-400">{alarm.alarmId}</p>
                    </div>
                    <Badge
                      className={
                        alarm.status?.toLowerCase() === "active"
                          ? "bg-green-600/20 text-green-400"
                          : "bg-red-600/20 text-red-400"
                      }
                    >
                      {alarm.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
