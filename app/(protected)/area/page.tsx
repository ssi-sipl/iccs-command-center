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
  MapPin,
  Loader2,
} from "lucide-react";
import { getAllAreas, deleteArea, type Area } from "@/lib/api/areas";
import { useToast } from "@/hooks/use-toast";

export default function AreaListPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch areas on component mount
  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const response = await getAllAreas({ include: true });
      if (response.success && response.data) {
        setAreas(response.data);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch areas",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch areas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAreas = areas.filter(
    (area) =>
      area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.areaId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, areaName: string) => {
    setDeleting(id);
    try {
      const response = await deleteArea(id);
      if (response.success) {
        setAreas(areas.filter((area) => area.id !== id));
        toast({
          title: "Success",
          description: `Area "${areaName}" deleted successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete area",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete area",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              Area Management
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage and monitor all surveillance areas
            </p>
          </div>
          <Link href="/area/add">
            <Button className="gap-2 bg-[#8B0000] text-white hover:bg-[#6B0000]">
              <Plus className="h-4 w-4" />
              Add New Area
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search areas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-[#333] bg-[#222] pl-10 text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
            />
          </div>
          <p className="text-sm text-gray-400">
            Showing {filteredAreas.length} of {areas.length} areas
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-[#333] bg-[#222] py-12">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#8B0000]" />
            <p className="text-lg font-medium text-gray-400">
              Loading areas...
            </p>
          </div>
        )}

        {/* Table - Desktop */}
        {!loading && (
          <div className="hidden rounded-lg border border-[#333] bg-[#222] md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-[#333] hover:bg-transparent">
                  <TableHead className="text-gray-400">Area ID</TableHead>
                  <TableHead className="text-gray-400">Area Name</TableHead>
                  <TableHead className="text-gray-400">Latitude</TableHead>
                  <TableHead className="text-gray-400">Longitude</TableHead>
                  <TableHead className="text-gray-400">Added By</TableHead>

                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-right text-gray-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAreas.map((area) => (
                  <TableRow
                    key={area.id}
                    className="border-[#333] hover:bg-[#2a2a2a]"
                  >
                    <TableCell className="font-medium text-white">
                      {area.areaId}
                    </TableCell>
                    <TableCell className="text-gray-300">{area.name}</TableCell>
                    <TableCell className="text-sm text-gray-400">
                      {area.latitude.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-400">
                      {area.longitude.toFixed(4)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          area.addedBy.toLowerCase()
                            ? "bg-yellow-400 text-black font-medium"
                            : "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                        }
                      >
                        {area.addedBy || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          area.status.toLowerCase() === "active"
                            ? "bg-green-600/20 text-green-400 hover:bg-green-600/30"
                            : "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                        }
                      >
                        {area.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/area/${area.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:bg-[#333] hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/area/${area.id}/edit`}>
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
                              disabled={deleting === area.id}
                            >
                              {deleting === area.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-[#333] bg-[#222]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">
                                Delete Area
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                Are you sure you want to delete "{area.name}
                                "? This action cannot be undone and will also
                                delete all associated sensors and alarms.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-[#333] bg-transparent text-white hover:bg-[#333]">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(area.id, area.name)}
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

        {/* Cards - Mobile */}
        {!loading && (
          <div className="flex flex-col gap-4 md:hidden">
            {filteredAreas.map((area) => (
              <div
                key={area.id}
                className="rounded-lg border border-[#333] bg-[#222] p-4"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{area.areaId}</p>
                    <h3 className="font-medium text-white">{area.name}</h3>
                  </div>
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
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span className="font-mono">
                    {area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/area/${area.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 border-[#333] bg-transparent text-white hover:bg-[#333]"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/area/${area.id}/edit`} className="flex-1">
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
                        disabled={deleting === area.id}
                      >
                        {deleting === area.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-[#333] bg-[#222]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">
                          Delete Area
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          Are you sure you want to delete "{area.name}"? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-[#333] bg-transparent text-white hover:bg-[#333]">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(area.id, area.name)}
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

        {!loading && filteredAreas.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-[#333] bg-[#222] py-12">
            <MapPin className="mb-4 h-12 w-12 text-gray-600" />
            <p className="text-lg font-medium text-gray-400">No areas found</p>
            <p className="text-sm text-gray-500">
              Try adjusting your search or add a new area
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
