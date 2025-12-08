"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Bell,
  BellOff,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { getAllAlarms, deleteAlarm, type Alarm } from "@/lib/api/alarms";
import { useToast } from "@/hooks/use-toast";

export default function AlarmListPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAlarms();
  }, []);

  const fetchAlarms = async () => {
    setLoading(true);
    try {
      const response = await getAllAlarms({ include: true });
      if (response.success && response.data) {
        setAlarms(response.data);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch alarms",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch alarms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAlarms = alarms.filter(
    (alarm) =>
      alarm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alarm.alarmId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alarm.area?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = alarms.filter(
    (a) => a.status.toLowerCase() === "active"
  ).length;
  const inactiveCount = alarms.filter(
    (a) => a.status.toLowerCase() === "inactive"
  ).length;
  const totalSensors = alarms.reduce(
    (sum, a) => sum + (a.sensors?.length || 0),
    0
  );

  const handleDelete = async (id: string, alarmName: string) => {
    setDeleting(id);
    try {
      const response = await deleteAlarm(id);
      if (response.success) {
        setAlarms(alarms.filter((alarm) => alarm.id !== id));
        toast({
          title: "Success",
          description: `Alarm "${alarmName}" deleted successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete alarm",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete alarm",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader activeItem="ALARM" />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-semibold text-[#4A9FD4]">
                Alarm Management
              </h1>
              <Link href="/alarm/add">
                <Button className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Alarm
                </Button>
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-[#333] bg-[#252525]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Alarms</p>
                      <p className="text-2xl font-bold text-white">
                        {alarms.length}
                      </p>
                    </div>
                    <Bell className="h-8 w-8 text-[#4A9FD4]" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#252525]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Active</p>
                      <p className="text-2xl font-bold text-green-500">
                        {activeCount}
                      </p>
                    </div>
                    <Bell className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#252525]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Inactive</p>
                      <p className="text-2xl font-bold text-gray-500">
                        {inactiveCount}
                      </p>
                    </div>
                    <BellOff className="h-8 w-8 text-gray-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#252525]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Sensors</p>
                      <p className="text-2xl font-bold text-orange-500">
                        {totalSensors}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search alarms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-[#444] bg-[#2a2a2a] pl-10 text-white placeholder:text-gray-500 focus:border-[#4A9FD4]"
                />
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-[#333] bg-[#222] py-12">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#2563EB]" />
                <p className="text-lg font-medium text-gray-400">
                  Loading alarms...
                </p>
              </div>
            )}

            {/* Table for larger screens */}
            {!loading && (
              <div className="hidden overflow-hidden rounded-lg border border-[#333] md:block">
                <table className="w-full">
                  <thead className="bg-[#252525]">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                        Alarm ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                        Area
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                        Sensors
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333]">
                    {filteredAlarms.map((alarm) => (
                      <tr
                        key={alarm.id}
                        className="bg-[#1e1e1e] hover:bg-[#252525]"
                      >
                        <td className="px-4 py-3 font-mono text-sm text-[#4A9FD4]">
                          {alarm.alarmId}
                        </td>
                        <td className="px-4 py-3 text-white">{alarm.name}</td>
                        <td className="px-4 py-3 text-gray-300">
                          {alarm.area?.name || "Unassigned"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              alarm.status.toLowerCase() === "active"
                                ? "bg-green-600 text-white"
                                : "bg-gray-600 text-white"
                            }
                          >
                            {alarm.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {alarm.sensors?.length || 0}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Link href={`/alarm/${alarm.id}`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-gray-400 hover:text-white"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/alarm/${alarm.id}/edit`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-gray-400 hover:text-white"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:text-red-300"
                                  disabled={deleting === alarm.id}
                                >
                                  {deleting === alarm.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="border-[#333] bg-[#222]">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">
                                    Delete Alarm
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-400">
                                    Are you sure you want to delete "
                                    {alarm.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-[#333] bg-transparent text-white hover:bg-[#333]">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDelete(alarm.id, alarm.name)
                                    }
                                    className="bg-red-600 text-white hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Cards for mobile */}
            {!loading && (
              <div className="grid gap-4 md:hidden">
                {filteredAlarms.map((alarm) => (
                  <Card key={alarm.id} className="border-[#333] bg-[#252525]">
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <p className="font-mono text-sm text-[#4A9FD4]">
                            {alarm.alarmId}
                          </p>
                          <h3 className="text-lg font-medium text-white">
                            {alarm.name}
                          </h3>
                        </div>
                        <Badge
                          className={
                            alarm.status.toLowerCase() === "active"
                              ? "bg-green-600 text-white"
                              : "bg-gray-600 text-white"
                          }
                        >
                          {alarm.status}
                        </Badge>
                      </div>
                      <div className="mb-3 space-y-1 text-sm text-gray-400">
                        <p>Area: {alarm.area?.name || "Unassigned"}</p>
                        <p>Sensors: {alarm.sensors?.length || 0}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/alarm/${alarm.id}`} className="flex-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full border-[#444] bg-transparent text-gray-300"
                          >
                            <Eye className="mr-1 h-4 w-4" /> View
                          </Button>
                        </Link>
                        <Link
                          href={`/alarm/${alarm.id}/edit`}
                          className="flex-1"
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full border-[#444] bg-transparent text-gray-300"
                          >
                            <Edit className="mr-1 h-4 w-4" /> Edit
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 bg-transparent text-red-400"
                              disabled={deleting === alarm.id}
                            >
                              {deleting === alarm.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-[#333] bg-[#222]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">
                                Delete Alarm
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                Are you sure you want to delete "{alarm.name}"?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-[#333] bg-transparent text-white hover:bg-[#333]">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDelete(alarm.id, alarm.name)
                                }
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!loading && filteredAlarms.length === 0 && (
              <div className="py-12 text-center">
                <Bell className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                <p className="text-gray-400">No alarms found</p>
                <Link href="/alarm/add">
                  <Button className="mt-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Alarm
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
