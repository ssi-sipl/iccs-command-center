// app/alarm/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Bell,
  MapPin,
  Calendar,
  AlertTriangle,
  Clock,
  Loader2,
  Radio,
} from "lucide-react";

import { getAlarmById, type Alarm } from "@/lib/api/alarms";
import { useToast } from "@/hooks/use-toast";

export default function ViewAlarmPage() {
  const params = useParams();
  const { toast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;

    const fetchAlarm = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAlarmById(params.id as string, true);

        if (response.success && response.data) {
          setAlarm(response.data);
        } else {
          const msg = response.error || "Failed to fetch alarm details";
          setError(msg);
          toast({
            title: "Error",
            description: msg,
            variant: "destructive",
          });
        }
      } catch (err) {
        setError("Failed to fetch alarm details");
        toast({
          title: "Error",
          description: "Failed to fetch alarm details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAlarm();
  }, [params?.id, toast]);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen flex-col bg-[#1a1a1a]">
        <DashboardHeader activeItem="ALARM" />
        <div className="relative flex flex-1 overflow-hidden">
          <DashboardSidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className="flex flex-1 items-center justify-center p-4">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#2563EB]" />
              <p className="text-lg font-medium text-gray-400">
                Loading alarm...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error / not found state
  if (error || !alarm) {
    return (
      <div className="flex h-screen flex-col bg-[#1a1a1a]">
        <DashboardHeader activeItem="ALARM" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Radio className="mx-auto h-16 w-16 text-gray-500" />
            <h1 className="mb-4 text-2xl font-bold text-white">
              Alarm Not Found
            </h1>
            <p className="mb-4 text-gray-400">
              {error || "The alarm you're looking for doesn't exist."}
            </p>
            <Link href="/alarm">
              <Button className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                Back to Alarms
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Map backend fields to UI
  const isActive = alarm.status.toLowerCase() === "active";
  const areaName = alarm.area?.name || "Unassigned";
  const areaId = alarm.areaId || "N/A";
  const createdAt = alarm.createdAt || "N/A";

  // Optional fields if your backend has them (fallbacks otherwise)
  const triggeredCount =
    (alarm as any).triggered_count ?? (alarm as any).triggeredCount ?? 0;
  const lastTriggered =
    (alarm as any).last_triggered ?? (alarm as any).lastTriggered ?? null;

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader activeItem="ALARM" />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Link href="/alarm">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-semibold text-[#4A9FD4]">
                    {alarm.name}
                  </h1>
                  <p className="font-mono text-sm text-gray-400">
                    {alarm.alarmId}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge
                  className={`${
                    isActive ? "bg-green-600" : "bg-gray-600"
                  } px-3 py-1 text-white`}
                >
                  {isActive ? "Active" : "Inactive"}
                </Badge>
                <Link href={`/alarm/${alarm.id}/edit`}>
                  <Button className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-[#333] bg-[#252525]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-8 w-8 text-[#4A9FD4]" />
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <p className="text-lg font-semibold text-white">
                        {isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#252525]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-400">Triggered</p>
                      <p className="text-lg font-semibold text-white">
                        {triggeredCount} times
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#252525]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="text-sm text-gray-400">Last Triggered</p>
                      <p className="text-lg font-semibold text-white">
                        {lastTriggered || "Never"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#252525]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-400">Created</p>
                      <p className="text-lg font-semibold text-white">
                        {createdAt}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Details Cards */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-[#333] bg-[#252525]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Bell className="h-5 w-5 text-[#4A9FD4]" />
                    Alarm Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between border-b border-[#333] pb-2">
                    <span className="text-gray-400">Alarm ID</span>
                    <span className="font-mono text-[#4A9FD4]">
                      {alarm.alarmId}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#333] pb-2">
                    <span className="text-gray-400">Name</span>
                    <span className="text-white">{alarm.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#333] pb-2">
                    <span className="text-gray-400">Status</span>
                    <Badge
                      className={`${
                        isActive ? "bg-green-600" : "bg-gray-600"
                      } text-white`}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created Date</span>
                    <span className="text-white">{createdAt}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#333] bg-[#252525]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <MapPin className="h-5 w-5 text-[#4A9FD4]" />
                    Area Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between border-b border-[#333] pb-2">
                    <span className="text-gray-400">Area ID</span>
                    <span className="font-mono text-[#4A9FD4]">{areaId}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#333] pb-2">
                    <span className="text-gray-400">Area Name</span>
                    <span className="text-white">{areaName}</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex h-32 items-center justify-center rounded-lg bg-[#1a1a1a]">
                      <div className="text-center">
                        <MapPin className="mx-auto mb-2 h-8 w-8 text-gray-600" />
                        <p className="text-sm text-gray-500">
                          Area location preview
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#333] bg-[#252525] lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Trigger History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-[#1a1a1a] p-4 text-center">
                      <p className="text-3xl font-bold text-orange-500">
                        {triggeredCount}
                      </p>
                      <p className="text-sm text-gray-400">Total Triggers</p>
                    </div>
                    <div className="rounded-lg bg-[#1a1a1a] p-4 text-center">
                      <p className="text-3xl font-bold text-yellow-500">
                        {lastTriggered || "N/A"}
                      </p>
                      <p className="text-sm text-gray-400">Last Triggered</p>
                    </div>
                    <div className="rounded-lg bg-[#1a1a1a] p-4 text-center">
                      <p className="text-3xl font-bold text-green-500">
                        {isActive ? "Monitoring" : "Paused"}
                      </p>
                      <p className="text-sm text-gray-400">Current State</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
