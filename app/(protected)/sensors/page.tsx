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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Pencil,
  Trash2,
  Radio,
  MapPin,
  Battery,
  Wifi,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  getAllSensors,
  deleteSensor,
  type Sensor,
  getSensorStats,
} from "@/lib/api/sensors";
import { useToast } from "@/hooks/use-toast";

export default function SensorsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState<{
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    warning: number;
  } | null>(null);

  useEffect(() => {
    fetchSensorStats();
  }, []);

  const fetchSensorStats = async () => {
    const response = await getSensorStats();
    if (response.success && response.data) {
      setStats(response.data);
    }
  };

  useEffect(() => {
    fetchSensors();
  }, [page]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const fetchSensors = async () => {
    setLoading(true);
    try {
      const response = await getAllSensors({
        include: true,
        page,
        limit,
        search: searchQuery || undefined,
      });

      if (response.success && response.data && response.pagination) {
        setSensors(response.data);
        setPagination(response.pagination);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch sensors",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch sensors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  const handleDelete = async (id: string, sensorName: string) => {
    setDeleting(id);
    try {
      const response = await deleteSensor(id);
      if (response.success) {
        setSensors(sensors.filter((sensor) => sensor.id !== id));
        toast({
          title: "Success",
          description: `Sensor "${sensorName}" deleted successfully`,
        });
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
      setDeleting(null);
    }
  };

  // Stats calculations
  const totalSensors = sensors.length;
  const onlineSensors = sensors.filter(
    (s) => s.status.toLowerCase() === "active",
  ).length;
  const warningSensors = sensors.filter(
    (s) => s.status.toLowerCase() === "warning",
  ).length;
  const offlineSensors = sensors.filter(
    (s) => s.status.toLowerCase() === "inactive",
  ).length;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#4A9FD4]">Sensors</h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage and monitor all sensors
            </p>
          </div>
          <Link href="/sensors/add">
            <Button className="gap-2 bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
              <Plus className="h-4 w-4" />
              Add Sensor
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search sensors by name, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setPage(1);
                fetchSensors();
              }
            }}
            className="border-[#333] bg-[#222] pl-10 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
          <Card className="border-[#333] bg-[#222]">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-blue-500/20 p-3">
                <Radio className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Sensors</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.total ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#333] bg-[#222]">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-green-500/20 p-3">
                <Wifi className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.active ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
          {/* <Card className="border-[#333] bg-[#222]">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-yellow-500/20 p-3">
                <Battery className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Warning</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.warning ?? 0}
                </p>
              </div>
            </CardContent>
          </Card> */}
          <Card className="border-[#333] bg-[#222]">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-red-500/20 p-3">
                <MapPin className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Inactive</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.inactive ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-[#333] bg-[#222] py-12">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#2563EB]" />
            <p className="text-lg font-medium text-gray-400">
              Loading sensors...
            </p>
          </div>
        )}

        {/* Desktop Table */}
        {!loading && (
          <div className="hidden rounded-lg border border-[#333] bg-[#222] lg:block">
            <Table>
              <TableHeader>
                <TableRow className="border-[#333] hover:bg-[#2a2a2a]">
                  <TableHead className="text-gray-400">Sensor ID</TableHead>
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Area</TableHead>
                  <TableHead className="text-gray-400">Type</TableHead>
                  <TableHead className="text-gray-400">Latitude</TableHead>
                  <TableHead className="text-gray-400">Longitude</TableHead>
                  <TableHead className="text-gray-400">IP</TableHead>
                  {/* <TableHead className="text-gray-400">Battery</TableHead>
                      <TableHead className="text-gray-400">RTSP</TableHead> */}
                  <TableHead className="text-gray-400">Added By</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-right text-gray-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sensors.map((sensor) => (
                  <TableRow
                    key={sensor.id}
                    className="border-[#333] hover:bg-[#2a2a2a]"
                  >
                    <TableCell className=" text-sm text-white">
                      {sensor.sensorId}
                    </TableCell>
                    <TableCell className="text-white">{sensor.name}</TableCell>
                    <TableCell className="text-gray-300">
                      {sensor.area?.name || "Unassigned"}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {sensor.sensorType}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {sensor.latitude || "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {sensor.longitude || "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {sensor.ipAddress || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          sensor?.addedBy
                            ? "bg-yellow-400 text-black font-medium"
                            : "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                        }
                      >
                        {sensor.addedBy || "N/A"}
                      </Badge>
                    </TableCell>
                    {/* <TableCell className="text-gray-300">
                          {sensor.battery || "N/A"}
                        </TableCell> */}

                    {/* RTSP column */}
                    {/* <TableCell className="text-gray-300">
                          {sensor.rtspUrl ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={sensor.rtspUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm hover:underline"
                                title="Open RTSP (if supported) or copy to external player"
                              >
                                <ExternalLink className="h-4 w-4" />
                                <span className="truncate max-w-[140px]">
                                  {sensor.rtspUrl}
                                </span>
                              </a>
                            </div>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </TableCell> */}

                    <TableCell>{getStatusBadge(sensor.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/sensors/${sensor.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/sensors/${sensor.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-500"
                              disabled={deleting === sensor.id}
                            >
                              {deleting === sensor.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-[#333] bg-[#222]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">
                                Delete Sensor
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                Are you sure you want to delete "{sensor.name}"?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-[#333] bg-transparent text-white hover:bg-[#333]">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDelete(sensor.id, sensor.name)
                                }
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Mobile Cards */}
        {!loading && (
          <div className="grid gap-4 lg:hidden">
            {sensors.map((sensor) => (
              <Card key={sensor.id} className="border-[#333] bg-[#222]">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className=" text-sm text-gray-400">
                        {sensor.sensorId}
                      </p>
                      <h3 className="text-lg font-medium text-white">
                        {sensor.name}
                      </h3>
                    </div>
                    {getStatusBadge(sensor.status)}
                  </div>
                  <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Area: </span>
                      <span className="text-gray-300">
                        {sensor.area?.name || "Unassigned"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Type: </span>
                      <span className="text-gray-300">{sensor.sensorType}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Battery: </span>
                      <span className="text-gray-300">
                        {sensor.battery || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">IP: </span>
                      <span className="text-gray-300">
                        {sensor.ipAddress || "N/A"}
                      </span>
                    </div>

                    {/* RTSP on mobile */}
                    <div>
                      <span className="text-gray-400">RTSP: </span>
                      <span className="text-gray-300 break-all">
                        {sensor.rtspUrl || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      {sensor.rtspUrl ? (
                        <a
                          href={sensor.rtspUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block"
                        >
                          <Button
                            variant="outline"
                            className="w-full border-[#444] bg-transparent text-gray-300 hover:bg-[#333]"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" /> Open
                          </Button>
                        </a>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full border-[#444] bg-transparent text-gray-300"
                          disabled
                        >
                          No Stream
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/sensors/${sensor.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full border-[#444] bg-transparent text-gray-300 hover:bg-[#333]"
                      >
                        <Eye className="mr-2 h-4 w-4" /> View
                      </Button>
                    </Link>
                    <Link
                      href={`/sensors/${sensor.id}/edit`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        className="w-full border-[#444] bg-transparent text-gray-300 hover:bg-[#333]"
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-[#444] bg-transparent text-red-500 hover:bg-red-500/10"
                          disabled={deleting === sensor.id}
                        >
                          {deleting === sensor.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-[#333] bg-[#222]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">
                            Delete Sensor
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            Are you sure you want to delete "{sensor.name}"?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-[#333] bg-transparent text-white hover:bg-[#333]">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(sensor.id, sensor.name)}
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

        {!loading && sensors.length === 0 && (
          <div className="py-12 text-center">
            <Radio className="mx-auto h-12 w-12 text-gray-500" />
            <p className="mt-4 text-gray-400">No sensors found</p>
            <Link href="/sensors/add">
              <Button className="mt-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                <Plus className="mr-2 h-4 w-4" /> Add First Sensor
              </Button>
            </Link>
          </div>
        )}
        {!loading && pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border-[#333] bg-transparent text-white hover:bg-[#333]"
            >
              Previous
            </Button>

            <p className="text-sm text-gray-400">
              Page {page} of {pagination.totalPages}
            </p>

            <Button
              variant="outline"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              className="border-[#333] bg-transparent text-white hover:bg-[#333]"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
