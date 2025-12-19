"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  AlertTriangle,
  CheckCircle,
  Send,
  MapPin,
  Calendar,
  Filter,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Crosshair,
} from "lucide-react";
import { getAllAlerts, getAlertById, deleteAlert } from "@/lib/api/alerts";
import type { Alert, AlertStatus } from "@/lib/api/alerts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 10;

export default function ReportPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAlerts, setTotalAlerts] = useState(0);

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Delete confirmation state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<Alert | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { toast } = useToast();

  // Fetch alerts from API
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit: 1000,
        skip: 0,
        sortBy: "createdAt" as const,
        sortOrder: "desc" as const,
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      };

      const response = await getAllAlerts(params);

      if (response.success && response.data) {
        setAlerts(response.data);
        setTotalAlerts(response.pagination?.total || response.data.length);
      } else {
        setError(response.error || "Failed to fetch alerts");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Error fetching alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  // Handle view alert
  const handleViewAlert = async (alert: Alert) => {
    setViewLoading(true);
    setViewModalOpen(true);

    try {
      const response = await getAlertById(alert.id);
      if (response.success && response.data) {
        setSelectedAlert(response.data);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch alert details",
          variant: "destructive",
        });
        setViewModalOpen(false);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch alert details",
        variant: "destructive",
      });
      setViewModalOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  // Handle delete alert
  const handleDeleteAlert = async () => {
    if (!alertToDelete) return;

    setDeleteLoading(true);
    try {
      const response = await deleteAlert(alertToDelete.id);

      if (response.success) {
        toast({
          title: "Alert deleted",
          description: "The alert has been successfully deleted.",
        });

        // Remove from local state
        setAlerts((prev) => prev.filter((a) => a.id !== alertToDelete.id));
        setDeleteModalOpen(false);
        setAlertToDelete(null);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete alert",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete alert",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Open delete confirmation
  const openDeleteConfirmation = (alert: Alert) => {
    setAlertToDelete(alert);
    setDeleteModalOpen(true);
  };

  // Get unique alert types
  const alertTypes = useMemo(() => {
    const types = new Set(alerts.map((alert) => alert.type));
    return Array.from(types);
  }, [alerts]);

  // Filter alerts (client-side for search and type)
  const filteredAlerts = useMemo(() => {
    let filtered = alerts.filter((alert) => {
      const matchesSearch =
        alert.sensorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.sensor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.sensor?.area?.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "ALL" || alert.type === typeFilter;

      return matchesSearch && matchesType;
    });

    return filtered;
  }, [alerts, searchTerm, typeFilter]);

  // Paginate filtered alerts
  const paginatedAlerts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAlerts.slice(startIndex, endIndex);
  }, [filteredAlerts, currentPage]);

  const totalPages = Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: alerts.length,
      active: alerts.filter((a) => a.status === "ACTIVE").length,
      sent: alerts.filter((a) => a.status === "SENT").length,
      neutralised: alerts.filter((a) => a.status === "NEUTRALISED").length,
    };
  }, [alerts]);

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-red-600/20 text-red-400 hover:bg-red-600/30">
            Active
          </Badge>
        );
      case "SENT":
        return (
          <Badge className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30">
            Sent
          </Badge>
        );
      case "NEUTRALISED":
        return (
          <Badge className="bg-gray-600/20 text-gray-400 hover:bg-gray-600/30">
            Neutralised
          </Badge>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      INTRUSION: "bg-orange-600/20 text-orange-400",
      THERMAL: "bg-yellow-600/20 text-yellow-400",
      MOTION: "bg-purple-600/20 text-purple-400",
      ACOUSTIC: "bg-cyan-600/20 text-cyan-400",
      ObjectDetected: "bg-pink-600/20 text-pink-400",
    };
    return (
      <Badge
        className={`${
          colors[type] || "bg-gray-600/20 text-gray-400"
        } hover:opacity-80`}
      >
        {type}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader activeItem="REPORT" />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white md:text-3xl">
                  Alert History Report
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                  View and analyze all alert records
                </p>
              </div>
              <Button
                onClick={fetchAlerts}
                disabled={loading}
                className="bg-[#8B0000] text-white hover:bg-[#6B0000]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Refresh</span>
              </Button>
            </div>

            {/* Error State */}
            {error && (
              <Card className="mb-6 border-red-600/20 bg-red-600/10">
                <CardContent className="flex items-center gap-3 py-4">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="font-medium text-red-400">Error</p>
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                  <Button
                    onClick={fetchAlerts}
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#8B0000]" />
                <p className="text-gray-400">Loading alerts...</p>
              </div>
            )}

            {/* Content */}
            {!loading && !error && (
              <>
                {/* Stats Cards */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="border-[#333] bg-[#222]">
                    <CardHeader className="pb-3">
                      <CardDescription className="text-gray-400">
                        Total Alerts
                      </CardDescription>
                      <CardTitle className="text-3xl text-white">
                        {stats.total}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-[#333] bg-[#222]">
                    <CardHeader className="pb-3">
                      <CardDescription className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        Active
                      </CardDescription>
                      <CardTitle className="text-3xl text-white">
                        {stats.active}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-[#333] bg-[#222]">
                    <CardHeader className="pb-3">
                      <CardDescription className="flex items-center gap-2 text-blue-400">
                        <Send className="h-4 w-4" />
                        Drone Sent
                      </CardDescription>
                      <CardTitle className="text-3xl text-white">
                        {stats.sent}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-[#333] bg-[#222]">
                    <CardHeader className="pb-3">
                      <CardDescription className="flex items-center gap-2 text-gray-400">
                        <CheckCircle className="h-4 w-4" />
                        Neutralised
                      </CardDescription>
                      <CardTitle className="text-3xl text-white">
                        {stats.neutralised}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="relative flex-1 lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      placeholder="Search by sensor, area, or message..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border-[#333] bg-[#222] pl-10 text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Select
                      value={statusFilter}
                      onValueChange={(value) =>
                        setStatusFilter(value as AlertStatus | "ALL")
                      }
                    >
                      <SelectTrigger className="w-[150px] border-[#333] bg-[#222] text-white">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="border-[#333] bg-[#222]">
                        <SelectItem value="ALL" className="text-white">
                          All Status
                        </SelectItem>
                        <SelectItem value="ACTIVE" className="text-white">
                          Active
                        </SelectItem>
                        <SelectItem value="SENT" className="text-white">
                          Sent
                        </SelectItem>
                        <SelectItem value="NEUTRALISED" className="text-white">
                          Neutralised
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[150px] border-[#333] bg-[#222] text-white">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent className="border-[#333] bg-[#222]">
                        <SelectItem value="ALL" className="text-white">
                          All Types
                        </SelectItem>
                        {alertTypes.map((type) => (
                          <SelectItem
                            key={type}
                            value={type}
                            className="text-white"
                          >
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-gray-400 lg:ml-auto">
                    Showing {paginatedAlerts.length} of {filteredAlerts.length}{" "}
                    alerts
                  </p>
                </div>

                {/* Table - Desktop */}
                <div className="hidden rounded-lg border border-[#333] bg-[#222] lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#333] hover:bg-transparent">
                        <TableHead className="text-gray-400">
                          Alert ID
                        </TableHead>
                        <TableHead className="text-gray-400">Type</TableHead>
                        <TableHead className="text-gray-400">Sensor</TableHead>
                        <TableHead className="text-gray-400">Area</TableHead>
                        <TableHead className="text-gray-400">Message</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Created</TableHead>
                        <TableHead className="text-gray-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAlerts.map((alert) => (
                        <TableRow
                          key={alert.id}
                          className="border-[#333] hover:bg-[#2a2a2a]"
                        >
                          <TableCell className="font-mono text-xs text-white">
                            {alert.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>{getTypeBadge(alert.type)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-white">
                                {alert.sensor?.name || "Unknown"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {alert.sensorId}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {alert.sensor?.area?.name || "-"}
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-gray-300">
                            {alert.message}
                          </TableCell>
                          <TableCell>{getStatusBadge(alert.status)}</TableCell>
                          <TableCell className="text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(alert.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleViewAlert(alert)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => openDeleteConfirmation(alert)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-400 hover:bg-red-600/20 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Cards - Mobile & Tablet */}
                <div className="flex flex-col gap-4 lg:hidden">
                  {paginatedAlerts.map((alert) => (
                    <Card key={alert.id} className="border-[#333] bg-[#222]">
                      <CardHeader className="pb-3">
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex gap-2">
                            {getTypeBadge(alert.type)}
                            {getStatusBadge(alert.status)}
                          </div>
                        </div>
                        <CardTitle className="text-base text-white">
                          {alert.sensor?.name || "Unknown Sensor"}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-400">
                          {alert.message}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {alert.sensor?.area?.name || "Unknown Area"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(alert.createdAt)}</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleViewAlert(alert)}
                            size="sm"
                            className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <Button
                            onClick={() => openDeleteConfirmation(alert)}
                            size="sm"
                            variant="outline"
                            className="flex-1 border-red-600/20 text-red-400 hover:bg-red-600/20"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                        className="border-[#333] bg-[#222] text-white hover:bg-[#2a2a2a]"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                        className="border-[#333] bg-[#222] text-white hover:bg-[#2a2a2a]"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {filteredAlerts.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-[#333] bg-[#222] py-12">
                    <AlertTriangle className="mb-4 h-12 w-12 text-gray-600" />
                    <p className="text-lg font-medium text-gray-400">
                      No alerts found
                    </p>
                    <p className="text-sm text-gray-500">
                      Try adjusting your filters or search term
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* View Alert Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="border-[#333] bg-[#111] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-400" />
              Alert Details
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Complete information about this alert
            </DialogDescription>
          </DialogHeader>

          {viewLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : selectedAlert ? (
            <div className="space-y-4">
              {/* Alert Status & Type */}
              <div className="flex gap-2">
                {getTypeBadge(selectedAlert.type)}
                {getStatusBadge(selectedAlert.status)}
              </div>

              {/* Alert Message */}
              <div>
                <p className="text-sm font-semibold text-gray-400">Message</p>
                <p className="text-base text-white">{selectedAlert.message}</p>
              </div>

              {/* Sensor Details */}
              <div className="rounded-md border border-[#333] bg-[#181818] p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <Crosshair className="h-3 w-3" />
                  Sensor Details
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>{" "}
                    <span className="text-gray-200">
                      {selectedAlert.sensor?.name || "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Sensor ID:</span>{" "}
                    <span className="font-mono text-blue-400">
                      {selectedAlert.sensorId}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Area:</span>{" "}
                    <span className="text-gray-200">
                      {selectedAlert.sensor?.area?.name || "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Area ID:</span>{" "}
                    <span className="font-mono text-gray-400">
                      {selectedAlert.sensor?.area?.areaId || "N/A"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Location:</span>{" "}
                    <span className="font-mono text-gray-400">
                      {typeof selectedAlert.sensor?.latitude === "number" &&
                      typeof selectedAlert.sensor?.longitude === "number"
                        ? `${selectedAlert.sensor.latitude.toFixed(
                            6
                          )}, ${selectedAlert.sensor.longitude.toFixed(6)}`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>{" "}
                  <span className="text-gray-200">
                    {formatDate(selectedAlert.createdAt)}
                  </span>
                </div>
                {selectedAlert.decidedAt && (
                  <div>
                    <span className="text-gray-500">Decided:</span>{" "}
                    <span className="text-gray-200">
                      {formatDate(selectedAlert.decidedAt)}
                    </span>
                  </div>
                )}
              </div>

              {/* Decision */}
              {selectedAlert.decision && (
                <div>
                  <span className="text-sm text-gray-500">Decision:</span>{" "}
                  <span className="rounded bg-[#333] px-2 py-1 text-sm text-gray-300">
                    {selectedAlert.decision.replace(/_/g, " ")}
                  </span>
                </div>
              )}

              {/* Alert ID */}
              <div className="rounded bg-[#222] p-2 text-xs">
                <span className="text-gray-500">Alert ID:</span>{" "}
                <span className="font-mono text-gray-400">
                  {selectedAlert.id}
                </span>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              onClick={() => setViewModalOpen(false)}
              className="bg-[#333] text-white hover:bg-[#444]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="border-[#333] bg-[#111] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="h-5 w-5" />
              Delete Alert
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this alert? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {alertToDelete && (
            <div className="rounded-md border border-red-600/20 bg-red-600/10 p-3">
              <p className="text-sm text-gray-300">
                <span className="font-semibold">Sensor:</span>{" "}
                {alertToDelete.sensor?.name || alertToDelete.sensorId}
              </p>
              <p className="text-sm text-gray-300">
                <span className="font-semibold">Message:</span>{" "}
                {alertToDelete.message}
              </p>
              <p className="text-xs text-gray-400">
                {formatDate(alertToDelete.createdAt)}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteLoading}
              variant="outline"
              className="border-[#444] bg-transparent text-gray-300 hover:bg-[#333]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAlert}
              disabled={deleteLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Alert
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
