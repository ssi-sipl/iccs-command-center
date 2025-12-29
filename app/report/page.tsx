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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  AlertTriangle,
  CheckCircle,
  Send,
  Plane,
  Calendar,
  Filter,
  Loader2,
  RefreshCw,
  Eye,
  Trash2,
  Clock,
  Zap,
  Wind,
} from "lucide-react";
import { getAllAlerts, getAlertById, deleteAlert } from "@/lib/api/alerts";
import type { Alert, AlertStatus } from "@/lib/api/alerts";
import { getAllFlightHistory } from "@/lib/api/flightHistory";
import type { FlightHistory } from "@/lib/api/flightHistory";
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
  const [activeTab, setActiveTab] = useState("alerts");

  // Alert states
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [alertCurrentPage, setAlertCurrentPage] = useState(1);

  // Flight history states
  const [flights, setFlights] = useState<FlightHistory[]>([]);
  const [flightsLoading, setFlightsLoading] = useState(true);
  const [flightsError, setFlightsError] = useState<string | null>(null);
  const [flightSearchTerm, setFlightSearchTerm] = useState("");
  const [flightStatusFilter, setFlightStatusFilter] = useState<string>("ALL");
  const [flightCurrentPage, setFlightCurrentPage] = useState(1);

  // View modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<FlightHistory | null>(
    null
  );
  const [viewLoading, setViewLoading] = useState(false);

  // Delete confirmation states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<Alert | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { toast } = useToast();

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      setAlertsLoading(true);
      setAlertsError(null);

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
      } else {
        setAlertsError(response.error || "Failed to fetch alerts");
      }
    } catch (err) {
      setAlertsError("An unexpected error occurred");
      console.error("Error fetching alerts:", err);
    } finally {
      setAlertsLoading(false);
    }
  };

  // Fetch flight history
  const fetchFlightHistory = async () => {
    try {
      setFlightsLoading(true);
      setFlightsError(null);

      const params = {
        limit: 1000,
        skip: 0,
        sortBy: "dispatchedAt" as const,
        sortOrder: "desc" as const,
        ...(flightStatusFilter !== "ALL" && { status: flightStatusFilter }),
      };

      const response = await getAllFlightHistory(params);

      if (response.success && response.data) {
        setFlights(response.data);
      } else {
        setFlightsError(response.error || "Failed to fetch flight history");
      }
    } catch (err) {
      setFlightsError("An unexpected error occurred");
      console.error("Error fetching flight history:", err);
    } finally {
      setFlightsLoading(false);
    }
  };

  // Initial load for both
  useEffect(() => {
    fetchAlerts();
    fetchFlightHistory();
  }, [statusFilter, flightStatusFilter]);

  const handleViewAlert = async (alert: Alert) => {
    setViewLoading(true);
    setViewModalOpen(true);

    try {
      const response = await getAlertById(alert.id);
      if (response.success && response.data) {
        setSelectedAlert(response.data);
        setSelectedFlight(null);
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

  const handleViewFlight = (flight: FlightHistory) => {
    setSelectedFlight(flight);
    setSelectedAlert(null);
    setViewModalOpen(true);
    setViewLoading(false);
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

  const openDeleteConfirmation = (alert: Alert) => {
    setAlertToDelete(alert);
    setDeleteModalOpen(true);
  };

  // Get unique alert types
  const alertTypes = useMemo(() => {
    const types = new Set(alerts.map((alert) => alert.type));
    return Array.from(types);
  }, [alerts]);

  // Get unique flight statuses
  const flightStatuses = useMemo(() => {
    const statuses = new Set(flights.map((f) => f.status));
    return Array.from(statuses);
  }, [flights]);

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
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
  }, [alerts, searchTerm, typeFilter]);

  // Filter flights
  const filteredFlights = useMemo(() => {
    return flights.filter((flight) => {
      const matchesSearch =
        flight.droneId.toLowerCase().includes(flightSearchTerm.toLowerCase()) ||
        flight.sensorId
          .toLowerCase()
          .includes(flightSearchTerm.toLowerCase()) ||
        flight.drone?.droneOSName
          .toLowerCase()
          .includes(flightSearchTerm.toLowerCase());

      const matchesStatus =
        flightStatusFilter === "ALL" || flight.status === flightStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [flights, flightSearchTerm, flightStatusFilter]);

  // Paginate alerts
  const paginatedAlerts = useMemo(() => {
    const startIndex = (alertCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAlerts.slice(startIndex, endIndex);
  }, [filteredAlerts, alertCurrentPage]);

  // Paginate flights
  const paginatedFlights = useMemo(() => {
    const startIndex = (flightCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredFlights.slice(startIndex, endIndex);
  }, [filteredFlights, flightCurrentPage]);

  // Calculate alert stats
  const alertStats = useMemo(() => {
    return {
      total: alerts.length,
      active: alerts.filter((a) => a.status === "ACTIVE").length,
      sent: alerts.filter((a) => a.status === "SENT").length,
      neutralised: alerts.filter((a) => a.status === "NEUTRALISED").length,
    };
  }, [alerts]);

  // Calculate flight stats
  const flightStats = useMemo(() => {
    return {
      total: flights.length,
      completed: flights.filter((f) => f.status === "Completed").length,
      inFlight: flights.filter((f) => f.status === "In Flight").length,
      dispatched: flights.filter((f) => f.status === "Dispatched").length,
      aborted: flights.filter((f) => f.status === "Aborted").length,
    };
  }, [flights]);

  const getAlertStatusBadge = (status: AlertStatus) => {
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

  const getFlightStatusBadge = (status: string) => {
    const statusConfig: Record<string, string> = {
      Dispatched: "bg-yellow-600/20 text-yellow-400",
      "In Flight": "bg-blue-600/20 text-blue-400",
      Completed: "bg-green-600/20 text-green-400",
      Aborted: "bg-red-600/20 text-red-400",
    };
    return (
      <Badge className={statusConfig[status] || "bg-gray-600/20 text-gray-400"}>
        {status}
      </Badge>
    );
  };

  const getAlertTypeBadge = (type: string) => {
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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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
                  Report Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                  View and analyze alert and drone flight records
                </p>
              </div>
              <Button
                onClick={() => {
                  if (activeTab === "alerts") {
                    fetchAlerts();
                  } else {
                    fetchFlightHistory();
                  }
                }}
                disabled={
                  activeTab === "alerts" ? alertsLoading : flightsLoading
                }
                className="bg-[#8B0000] text-white hover:bg-[#6B0000]"
              >
                {activeTab === "alerts" && alertsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : activeTab === "flights" && flightsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Refresh</span>
              </Button>
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-6 grid w-full grid-cols-2 bg-[#222] p-1">
                <TabsTrigger
                  value="alerts"
                  className="data-[state=active]:bg-[#8B0000] data-[state=active]:text-white"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Alert History
                </TabsTrigger>
                <TabsTrigger
                  value="flights"
                  className="data-[state=active]:bg-[#8B0000] data-[state=active]:text-white"
                >
                  <Plane className="mr-2 h-4 w-4" />
                  Flight History
                </TabsTrigger>
              </TabsList>

              {/* ALERTS TAB */}
              <TabsContent value="alerts" className="space-y-6">
                {/* Error State */}
                {alertsError && (
                  <Card className="border-red-600/20 bg-red-600/10">
                    <CardContent className="flex items-center gap-3 py-4">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <div>
                        <p className="font-medium text-red-400">Error</p>
                        <p className="text-sm text-red-300">{alertsError}</p>
                      </div>
                      <Button
                        onClick={fetchAlerts}
                        variant="outline"
                        size="sm"
                        className="ml-auto bg-transparent"
                      >
                        Retry
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Loading State */}
                {alertsLoading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#8B0000]" />
                    <p className="text-gray-400">Loading alerts...</p>
                  </div>
                )}

                {!alertsLoading && !alertsError && (
                  <>
                    {/* Stats Cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Card className="border-[#333] bg-[#222]">
                        <CardHeader className="pb-3">
                          <CardDescription className="text-gray-400">
                            Total Alerts
                          </CardDescription>
                          <CardTitle className="text-3xl text-white">
                            {alertStats.total}
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
                            {alertStats.active}
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
                            {alertStats.sent}
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
                            {alertStats.neutralised}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
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
                            <SelectItem
                              value="NEUTRALISED"
                              className="text-white"
                            >
                              Neutralised
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={typeFilter}
                          onValueChange={setTypeFilter}
                        >
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
                        Showing {paginatedAlerts.length} of{" "}
                        {filteredAlerts.length} alerts
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
                            <TableHead className="text-gray-400">
                              Type
                            </TableHead>
                            <TableHead className="text-gray-400">
                              Sensor
                            </TableHead>
                            <TableHead className="text-gray-400">
                              Area
                            </TableHead>
                            <TableHead className="text-gray-400">
                              Message
                            </TableHead>
                            <TableHead className="text-gray-400">
                              Status
                            </TableHead>
                            <TableHead className="text-gray-400">
                              Created
                            </TableHead>
                            <TableHead className="text-gray-400">
                              Actions
                            </TableHead>
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
                              <TableCell>
                                {getAlertTypeBadge(alert.type)}
                              </TableCell>
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
                              <TableCell>
                                {getAlertStatusBadge(alert.status)}
                              </TableCell>
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
                                    onClick={() =>
                                      openDeleteConfirmation(alert)
                                    }
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

                    {/* Pagination */}
                    {Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE) > 1 && (
                      <div className="flex items-center justify-between">
                        <Button
                          onClick={() =>
                            setAlertCurrentPage(
                              Math.max(alertCurrentPage - 1, 1)
                            )
                          }
                          disabled={alertCurrentPage === 1}
                          variant="outline"
                          size="sm"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-400">
                          Page {alertCurrentPage} of{" "}
                          {Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE)}
                        </span>
                        <Button
                          onClick={() =>
                            setAlertCurrentPage(
                              Math.min(
                                alertCurrentPage + 1,
                                Math.ceil(
                                  filteredAlerts.length / ITEMS_PER_PAGE
                                )
                              )
                            )
                          }
                          disabled={
                            alertCurrentPage ===
                            Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE)
                          }
                          variant="outline"
                          size="sm"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* FLIGHTS TAB */}
              <TabsContent value="flights" className="space-y-6">
                {/* Error State */}
                {flightsError && (
                  <Card className="border-red-600/20 bg-red-600/10">
                    <CardContent className="flex items-center gap-3 py-4">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <div>
                        <p className="font-medium text-red-400">Error</p>
                        <p className="text-sm text-red-300">{flightsError}</p>
                      </div>
                      <Button
                        onClick={fetchFlightHistory}
                        variant="outline"
                        size="sm"
                        className="ml-auto bg-transparent"
                      >
                        Retry
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Loading State */}
                {flightsLoading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#8B0000]" />
                    <p className="text-gray-400">Loading flight history...</p>
                  </div>
                )}

                {!flightsLoading && !flightsError && (
                  <>
                    {/* Stats Cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                      <Card className="border-[#333] bg-[#222]">
                        <CardHeader className="pb-3">
                          <CardDescription className="text-gray-400">
                            Total Flights
                          </CardDescription>
                          <CardTitle className="text-3xl text-white">
                            {flightStats.total}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card className="border-[#333] bg-[#222]">
                        <CardHeader className="pb-3">
                          <CardDescription className="flex items-center gap-2 text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            Completed
                          </CardDescription>
                          <CardTitle className="text-3xl text-white">
                            {flightStats.completed}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card className="border-[#333] bg-[#222]">
                        <CardHeader className="pb-3">
                          <CardDescription className="flex items-center gap-2 text-blue-400">
                            <Plane className="h-4 w-4" />
                            In Flight
                          </CardDescription>
                          <CardTitle className="text-3xl text-white">
                            {flightStats.inFlight}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card className="border-[#333] bg-[#222]">
                        <CardHeader className="pb-3">
                          <CardDescription className="flex items-center gap-2 text-yellow-400">
                            <Send className="h-4 w-4" />
                            Dispatched
                          </CardDescription>
                          <CardTitle className="text-3xl text-white">
                            {flightStats.dispatched}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card className="border-[#333] bg-[#222]">
                        <CardHeader className="pb-3">
                          <CardDescription className="flex items-center gap-2 text-red-400">
                            <AlertTriangle className="h-4 w-4" />
                            Aborted
                          </CardDescription>
                          <CardTitle className="text-3xl text-white">
                            {flightStats.aborted}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="relative flex-1 lg:max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <Input
                          placeholder="Search by drone, sensor..."
                          value={flightSearchTerm}
                          onChange={(e) => setFlightSearchTerm(e.target.value)}
                          className="border-[#333] bg-[#222] pl-10 text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                        />
                      </div>
                      <Select
                        value={flightStatusFilter}
                        onValueChange={setFlightStatusFilter}
                      >
                        <SelectTrigger className="w-[150px] border-[#333] bg-[#222] text-white">
                          <Filter className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="border-[#333] bg-[#222]">
                          <SelectItem value="ALL" className="text-white">
                            All Status
                          </SelectItem>
                          {flightStatuses.map((status) => (
                            <SelectItem
                              key={status}
                              value={status}
                              className="text-white"
                            >
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-400 lg:ml-auto">
                        Showing {paginatedFlights.length} of{" "}
                        {filteredFlights.length} flights
                      </p>
                    </div>

                    {/* Table - Desktop */}
                    <div className="hidden rounded-lg border border-[#333] bg-[#222] lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#333] hover:bg-transparent">
                            <TableHead className="text-gray-400">
                              Drone ID
                            </TableHead>
                            <TableHead className="text-gray-400">
                              Sensor
                            </TableHead>
                            <TableHead className="text-gray-400">
                              Status
                            </TableHead>
                            <TableHead className="text-gray-400">
                              Duration
                            </TableHead>
                            <TableHead className="text-gray-400">
                              Battery
                            </TableHead>
                            <TableHead className="text-gray-400">
                              Distance
                            </TableHead>
                            <TableHead className="text-gray-400">
                              Dispatched
                            </TableHead>
                            <TableHead className="text-gray-400">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedFlights.map((flight) => (
                            <TableRow
                              key={flight.id}
                              className="border-[#333] hover:bg-[#2a2a2a]"
                            >
                              <TableCell>
                                <div>
                                  <p className="font-medium text-white">
                                    {flight.droneId}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {flight.drone?.droneOSName || "Unknown"}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-300">
                                {flight.sensorId}
                              </TableCell>
                              <TableCell>
                                {getFlightStatusBadge(flight.status)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-gray-300">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(flight.flightDuration)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-gray-300">
                                  <Zap className="h-3 w-3" />
                                  {flight.batteryUsed
                                    ? `${flight.batteryUsed}%`
                                    : "-"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-gray-300">
                                  <Wind className="h-3 w-3" />
                                  {flight.distanceCovered
                                    ? `${(
                                        flight.distanceCovered / 1000
                                      ).toFixed(2)}km`
                                    : "-"}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(flight.dispatchedAt)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  onClick={() => handleViewFlight(flight)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {Math.ceil(filteredFlights.length / ITEMS_PER_PAGE) > 1 && (
                      <div className="flex items-center justify-between">
                        <Button
                          onClick={() =>
                            setFlightCurrentPage(
                              Math.max(flightCurrentPage - 1, 1)
                            )
                          }
                          disabled={flightCurrentPage === 1}
                          variant="outline"
                          size="sm"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-400">
                          Page {flightCurrentPage} of{" "}
                          {Math.ceil(filteredFlights.length / ITEMS_PER_PAGE)}
                        </span>
                        <Button
                          onClick={() =>
                            setFlightCurrentPage(
                              Math.min(
                                flightCurrentPage + 1,
                                Math.ceil(
                                  filteredFlights.length / ITEMS_PER_PAGE
                                )
                              )
                            )
                          }
                          disabled={
                            flightCurrentPage ===
                            Math.ceil(filteredFlights.length / ITEMS_PER_PAGE)
                          }
                          variant="outline"
                          size="sm"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* View Modal - Alerts */}
      {selectedAlert && (
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="border-[#333] bg-[#222] text-white">
            <DialogHeader>
              <DialogTitle>Alert Details</DialogTitle>
              <DialogDescription className="text-gray-400">
                {selectedAlert.id}
              </DialogDescription>
            </DialogHeader>
            {viewLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#8B0000]" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Type</p>
                    <p className="text-white">
                      {getAlertTypeBadge(selectedAlert.type)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <p className="text-white">
                      {getAlertStatusBadge(selectedAlert.status)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Sensor</p>
                  <p className="text-white">
                    {selectedAlert.sensor?.name || "Unknown"}{" "}
                    <span className="text-gray-500">
                      ({selectedAlert.sensorId})
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Area</p>
                  <p className="text-white">
                    {selectedAlert.sensor?.area?.name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Message</p>
                  <p className="text-white">{selectedAlert.message}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Created</p>
                  <p className="text-white">
                    {formatDate(selectedAlert.createdAt)}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* View Modal - Flights */}
      {selectedFlight && (
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="border-[#333] bg-[#222] text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Flight Details</DialogTitle>
              <DialogDescription className="text-gray-400">
                {selectedFlight.droneId}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Drone</p>
                  <p className="text-white">{selectedFlight.droneId}</p>
                  <p className="text-xs text-gray-500">
                    {selectedFlight.drone?.droneOSName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className="text-white">
                    {getFlightStatusBadge(selectedFlight.status)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Sensor</p>
                  <p className="text-white">{selectedFlight.sensorId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Flight Duration</p>
                  <p className="text-white">
                    {formatDuration(selectedFlight.flightDuration)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Battery Used</p>
                  <p className="text-white">
                    {selectedFlight.batteryUsed
                      ? `${selectedFlight.batteryUsed}%`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Distance Covered</p>
                  <p className="text-white">
                    {selectedFlight.distanceCovered
                      ? `${(selectedFlight.distanceCovered / 1000).toFixed(
                          2
                        )}km`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Max Altitude</p>
                  <p className="text-white">
                    {selectedFlight.maxAltitude
                      ? `${selectedFlight.maxAltitude}m`
                      : "-"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400">Dispatched At</p>
                <p className="text-white">
                  {formatDate(selectedFlight.dispatchedAt)}
                </p>
              </div>
              {selectedFlight.completedAt && (
                <div>
                  <p className="text-sm text-gray-400">Completed At</p>
                  <p className="text-white">
                    {formatDate(selectedFlight.completedAt)}
                  </p>
                </div>
              )}
              {selectedFlight.notes && (
                <div>
                  <p className="text-sm text-gray-400">Notes</p>
                  <p className="text-white">{selectedFlight.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="border-[#333] bg-[#222] text-white">
          <DialogHeader>
            <DialogTitle>Delete Alert</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this alert? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              onClick={() => setDeleteModalOpen(false)}
              variant="outline"
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAlert}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
