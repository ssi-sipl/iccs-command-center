"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Eye,
  Pencil,
  Trash2,
  Search,
  Plane,
  Battery,
  Gauge,
  Loader2,
} from "lucide-react";
import { getAllDroneOS, deleteDroneOS, type DroneOS } from "@/lib/api/droneos";
import { useToast } from "@/hooks/use-toast";

export default function DronesListPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(1);
  const [pagination, setPagination] = useState<{
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drones, setDrones] = useState<DroneOS[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch drones on component mount
  useEffect(() => {
    fetchDrones();
  }, [page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const fetchDrones = async () => {
    setLoading(true);
    try {
      const response = await getAllDroneOS({
        include: true,
        page,
        limit,
        search: searchTerm || undefined,
      });

      if (response.success && response.data && response.pagination) {
        setDrones(response.data);
        setPagination(response.pagination);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch drones",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch drones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, droneName: string) => {
    setDeleting(id);
    try {
      const response = await deleteDroneOS(id);
      if (response.success) {
        setDrones(drones.filter((drone) => drone.id !== id));
        toast({
          title: "Success",
          description: `Drone "${droneName}" deleted successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete drone",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete drone",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  // Helper function to get battery status badge color
  const getBatteryBadge = (batteryLevel: number) => {
    if (batteryLevel >= 50) {
      return (
        <Badge className="bg-green-600/20 text-green-400 hover:bg-green-600/30">
          {batteryLevel}%
        </Badge>
      );
    } else if (batteryLevel >= 20) {
      return (
        <Badge className="bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30">
          {batteryLevel}%
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-600/20 text-red-400 hover:bg-red-600/30">
          {batteryLevel}%
        </Badge>
      );
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              Drone Management
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage and configure all surveillance drones
            </p>
          </div>
          <Link href="/drones/add">
            <Button className="gap-2 bg-[#8B0000] text-white hover:bg-[#6B0000]">
              <Plus className="h-4 w-4" />
              Add New Drone
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search drones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setPage(1);
                  fetchDrones();
                }
              }}
              className="border-[#333] bg-[#222] pl-10 text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
            />
          </div>
          <p className="text-sm text-gray-400">
            Showing {drones.length} of {pagination?.totalCount ?? 0} drones
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-[#333] bg-[#222] py-12">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#8B0000]" />
            <p className="text-lg font-medium text-gray-400">
              Loading drones...
            </p>
          </div>
        )}

        {/* Table - Desktop */}
        {!loading && (
          <div className="hidden rounded-lg border border-[#333] bg-[#222] lg:block">
            <Table>
              <TableHeader>
                <TableRow className="border-[#333] hover:bg-transparent">
                  <TableHead className="text-gray-400">Id</TableHead>
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Area</TableHead>
                  <TableHead className="text-gray-400">Type</TableHead>
                  <TableHead className="text-gray-400">Latitude</TableHead>
                  <TableHead className="text-gray-400">Longitude</TableHead>
                  <TableHead className="text-gray-400">Added By</TableHead>
                  {/* <TableHead className="text-gray-400">
                        Speed (m/s) 
                      </TableHead>
                      <TableHead className="text-gray-400">
                        Max Alt (m)
                      </TableHead>
                      <TableHead className="text-gray-400">
                        Battery Min
                      </TableHead>
                      <TableHead className="text-gray-400">GPS</TableHead> */}
                  <TableHead className="text-right text-gray-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drones.map((drone) => (
                  <TableRow
                    key={drone.id}
                    className="border-[#333] hover:bg-[#2a2a2a]"
                  >
                    <TableCell className="font-medium text-white">
                      {drone.droneId}
                    </TableCell>
                    <TableCell className="font-medium text-white">
                      {drone.droneOSName}
                    </TableCell>
                    <TableCell className="font-medium text-white">
                      {drone?.area?.name || "Unassigned"}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {drone.droneType}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {drone.latitude}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {drone.longitude}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          drone?.addedBy.toLowerCase()
                            ? "bg-yellow-400 text-black font-medium"
                            : "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                        }
                      >
                        {drone?.addedBy || "N/A"}
                      </Badge>
                    </TableCell>
                    {/* <TableCell className="font-mono text-sm text-gray-400">
                          {drone.droneSpeed}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-400">
                          {drone.maxAltitude}
                        </TableCell>
                        <TableCell>
                          {getBatteryBadge(drone.minBatteryLevel)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-400">
                          {drone.gpsName}
                        </TableCell> */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/drones/${drone.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:bg-[#333] hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/drones/${drone.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:bg-[#333] hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:bg-red-600/20 hover:text-red-400"
                              disabled={deleting === drone.id}
                            >
                              {deleting === drone.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-[#333] bg-[#222]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">
                                Delete Drone
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                Are you sure you want to delete "
                                {drone.droneOSName}"? This action cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-[#333] bg-transparent text-white hover:bg-[#333]">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDelete(drone.id, drone.droneOSName)
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

        {/* Cards - Mobile/Tablet */}
        {!loading && (
          <div className="flex flex-col gap-4 lg:hidden">
            {drones.map((drone) => (
              <div
                key={drone.id}
                className="rounded-lg border border-[#333] bg-[#222] p-4"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-white">
                      {drone.droneOSName}
                    </h3>
                    <p className="text-sm text-gray-400">{drone.droneType}</p>
                  </div>
                  {getBatteryBadge(drone.minBatteryLevel)}
                </div>
                <div className="mb-4 grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Gauge className="h-4 w-4" />
                    <span>{drone.droneSpeed} m/s</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Plane className="h-4 w-4" />
                    <span>{drone.maxAltitude}m</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Battery className="h-4 w-4" />
                    <span>{drone.gpsName}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/drones/${drone.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 border-[#333] bg-transparent text-white hover:bg-[#333]"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/drones/${drone.id}/edit`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 border-[#333] bg-transparent text-white hover:bg-[#333]"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-[#333] bg-transparent text-red-400 hover:bg-red-600/20"
                        disabled={deleting === drone.id}
                      >
                        {deleting === drone.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-[#333] bg-[#222]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">
                          Delete Drone
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          Are you sure you want to delete "{drone.droneOSName}"?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-[#333] bg-transparent text-white hover:bg-[#333]">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            handleDelete(drone.id, drone.droneOSName)
                          }
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && drones.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-[#333] bg-[#222] py-12">
            <Plane className="mb-4 h-12 w-12 text-gray-600" />
            <p className="text-lg font-medium text-gray-400">No drones found</p>
            <p className="text-sm text-gray-500">
              Try adjusting your search or add a new drone
            </p>
          </div>
        )}
      </div>
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
  );
}
