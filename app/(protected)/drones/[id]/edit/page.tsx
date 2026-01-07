// app/drones/[id]/edit/page.tsx
// Updated Edit Drone Page with Backend Integration
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Plane, Loader2 } from "lucide-react";
import { getDroneOSById, updateDroneOS, type DroneOS } from "@/lib/api/droneos";
import { getAllAreas } from "@/lib/api/areas";
import { useToast } from "@/hooks/use-toast";

// Action options
const gpsLostActions = ["RTL", "Land", "Hover", "Continue"];
const telemetryLostActions = ["RTL", "Land", "Hover", "Continue"];
const batteryFailSafeActions = ["RTL", "Land"];
const droneTypes = ["quadcopter", "hexacopter", "fixed-wing", "VTOL"];

export default function EditDronePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drone, setDrone] = useState<DroneOS | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  const [formData, setFormData] = useState({
    droneId: "", // NEW
    droneOSName: "",
    droneType: "",
    videoLink: "", // NEW
    areaId: "", // NEW
    gpsFix: "",
    minHDOP: "",
    minSatCount: "",
    maxWindSpeed: "",
    droneSpeed: "",
    targetAltitude: "",
    gpsLost: "",
    telemetryLost: "",
    minBatteryLevel: "",
    usbAddress: "",
    batteryFailSafe: "",
    gpsName: "",
    maxAltitude: "",
    latitude: "", // NEW
    longitude: "", // NEW
  });

  const [validationErrors, setValidationErrors] = useState({
    droneId: "", // NEW
    droneOSName: "",
    droneType: "",
    minHDOP: "",
    minSatCount: "",
    minBatteryLevel: "",
    latitude: "", // NEW
    longitude: "", // NEW
  });

  useEffect(() => {
    if (params.id) {
      fetchDroneDetails();
      fetchAreas();
    }
  }, [params.id]);

  const fetchAreas = async () => {
    try {
      const response = await getAllAreas();
      if (response.success && response.data) {
        setAreas(response.data);
      }
    } catch (error) {
      console.error("Error fetching areas:", error);
    } finally {
      setLoadingAreas(false);
    }
  };

  const fetchDroneDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDroneOSById(params.id as string, true); // Include area
      if (response.success && response.data) {
        const droneData = response.data;
        setDrone(droneData);
        setFormData({
          droneId: droneData.droneId || "", // NEW
          droneOSName: droneData.droneOSName,
          droneType: droneData.droneType,
          videoLink: droneData.videoLink || "", // NEW
          areaId: droneData.areaId || "", // NEW
          gpsFix: droneData.gpsFix,
          minHDOP: droneData.minHDOP.toString(),
          minSatCount: droneData.minSatCount.toString(),
          maxWindSpeed: droneData.maxWindSpeed.toString(),
          droneSpeed: droneData.droneSpeed.toString(),
          targetAltitude: droneData.targetAltitude.toString(),
          gpsLost: droneData.gpsLost,
          telemetryLost: droneData.telemetryLost,
          minBatteryLevel: droneData.minBatteryLevel.toString(),
          usbAddress: droneData.usbAddress,
          batteryFailSafe: droneData.batteryFailSafe,
          gpsName: droneData.gpsName,
          maxAltitude: droneData.maxAltitude.toString(),
          latitude: droneData.latitude?.toString() || "", // NEW
          longitude: droneData.longitude?.toString() || "", // NEW
        });
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

  const validateForm = () => {
    const errors = {
      droneId: "",
      droneOSName: "",
      droneType: "",
      minHDOP: "",
      minSatCount: "",
      minBatteryLevel: "",
      latitude: "",
      longitude: "",
    };

    let isValid = true;

    // NEW: Drone ID validation
    if (!formData.droneId.trim()) {
      errors.droneId = "Drone ID is required";
      isValid = false;
    }

    if (!formData.droneOSName.trim()) {
      errors.droneOSName = "Drone OS Name is required";
      isValid = false;
    }

    if (!formData.droneType.trim()) {
      errors.droneType = "Drone Type is required";
      isValid = false;
    }

    const hdop = parseFloat(formData.minHDOP);
    if (isNaN(hdop) || hdop < 0 || hdop > 1) {
      errors.minHDOP = "Min HDOP must be between 0 and 1";
      isValid = false;
    }

    const satCount = parseInt(formData.minSatCount);
    if (isNaN(satCount) || satCount < 0 || satCount > 8) {
      errors.minSatCount = "Min Sat Count must be between 0 and 8";
      isValid = false;
    }

    const battery = parseFloat(formData.minBatteryLevel);
    if (isNaN(battery) || battery < 0 || battery > 100) {
      errors.minBatteryLevel = "Battery level must be between 0 and 100";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await updateDroneOS(params.id as string, {
        droneId: formData.droneId.trim(), // NEW
        droneOSName: formData.droneOSName,
        droneType: formData.droneType,
        videoLink: formData.videoLink.trim() || null, // NEW
        areaId: formData.areaId || null, // NEW
        gpsFix: formData.gpsFix,
        minHDOP: parseFloat(formData.minHDOP),
        minSatCount: parseInt(formData.minSatCount),
        maxWindSpeed: parseFloat(formData.maxWindSpeed),
        droneSpeed: parseFloat(formData.droneSpeed),
        targetAltitude: parseFloat(formData.targetAltitude),
        gpsLost: formData.gpsLost,
        telemetryLost: formData.telemetryLost,
        minBatteryLevel: parseFloat(formData.minBatteryLevel),
        usbAddress: formData.usbAddress,
        batteryFailSafe: formData.batteryFailSafe,
        gpsName: formData.gpsName,
        maxAltitude: parseFloat(formData.maxAltitude),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `Drone "${formData.droneId}" updated successfully`,
        });
        router.push(`/drones/${params.id}`);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update drone",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update drone",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
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
        {/* Title */}
        <h1 className="mb-4 text-2xl font-semibold text-[#4A9FD4]">
          Edit OS Settings
        </h1>

        {/* Back Button */}
        <Link
          href={`/drones/${params.id}`}
          className="mb-6 inline-flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <form onSubmit={handleSubmit}>
          <div className="rounded-lg border border-[#333] bg-[#222] p-4 md:p-6">
            {/* NEW: Basic Info Section */}
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-200">
                Basic Information
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Drone ID - NEW */}
                <div className="space-y-2">
                  <Label htmlFor="droneId" className="text-gray-300">
                    Drone ID<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="droneId"
                    placeholder="e.g., DRONE-001"
                    value={formData.droneId}
                    onChange={(e) => handleChange("droneId", e.target.value)}
                    required
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                  />
                  {validationErrors.droneId && (
                    <p className="text-xs text-red-500">
                      {validationErrors.droneId}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Unique identifier for this drone
                  </p>
                </div>

                {/* Drone OS Name */}
                <div className="space-y-2">
                  <Label htmlFor="droneOSName" className="text-gray-300">
                    Drone OS Name<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="droneOSName"
                    placeholder="Enter drone OS name"
                    value={formData.droneOSName}
                    onChange={(e) =>
                      handleChange("droneOSName", e.target.value)
                    }
                    required
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                  />
                  {validationErrors.droneOSName && (
                    <p className="text-xs text-red-500">
                      {validationErrors.droneOSName}
                    </p>
                  )}
                </div>

                {/* Drone Type */}
                {/* <div className="space-y-2">
                      <Label htmlFor="droneType" className="text-gray-300">
                        Drone Type<span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="droneType"
                        placeholder="e.g., quadcopter, hexacopter"
                        value={formData.droneType}
                        onChange={(e) =>
                          handleChange("droneType", e.target.value)
                        }
                        required
                        className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                      />
                      {validationErrors.droneType && (
                        <p className="text-xs text-red-500">
                          {validationErrors.droneType}
                        </p>
                      )}
                    </div> */}

                {/* Drone Type */}
                <div className="space-y-2">
                  <Label className="text-gray-300">
                    Drone Type<span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.droneType}
                    onValueChange={(value) => handleChange("droneType", value)}
                  >
                    <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#4A9FD4]">
                      <SelectValue placeholder="Select Sensor Type" />
                    </SelectTrigger>
                    <SelectContent className="border-[#333] bg-[#222]">
                      {droneTypes.map((type) => (
                        <SelectItem
                          key={type}
                          value={type}
                          className="text-white focus:bg-[#333] focus:text-white"
                        >
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.droneType && (
                    <p className="text-xs text-red-500">
                      {validationErrors.droneType}
                    </p>
                  )}
                </div>

                {/* Latitude */}
                <div className="space-y-2">
                  <Label htmlFor="latitude" className="text-gray-300">
                    Latitude<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="latitude"
                    placeholder="e.g., 12.9716"
                    value={formData.latitude}
                    onChange={(e) => handleChange("latitude", e.target.value)}
                    required
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                  />
                  {validationErrors.latitude && (
                    <p className="text-xs text-red-500">
                      {validationErrors.latitude}
                    </p>
                  )}
                </div>

                {/* Longitude */}
                <div className="space-y-2">
                  <Label htmlFor="longitude" className="text-gray-300">
                    Longitude<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="longitude"
                    placeholder="e.g., 77.5946"
                    value={formData.longitude}
                    onChange={(e) => handleChange("longitude", e.target.value)}
                    required
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                  />
                  {validationErrors.longitude && (
                    <p className="text-xs text-red-500">
                      {validationErrors.longitude}
                    </p>
                  )}
                </div>

                {/* Video Link - NEW */}
                <div className="space-y-2">
                  <Label htmlFor="videoLink" className="text-gray-300">
                    Video Stream URL
                  </Label>
                  <Input
                    id="videoLink"
                    placeholder="e.g., rtsp://192.168.1.100:554/stream"
                    value={formData.videoLink}
                    onChange={(e) => handleChange("videoLink", e.target.value)}
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                  />
                  <p className="text-xs text-gray-500">
                    Optional: RTSP or HTTP video stream URL
                  </p>
                </div>

                {/* Area Assignment - NEW */}
                <div className="space-y-2">
                  <Label htmlFor="areaId" className="text-gray-300">
                    Assigned Area
                  </Label>
                  <Select
                    value={formData.areaId}
                    onValueChange={(value) => handleChange("areaId", value)}
                    disabled={loadingAreas}
                  >
                    <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#8B0000]">
                      <SelectValue placeholder="Select an area (optional)" />
                    </SelectTrigger>
                    <SelectContent className="border-[#333] bg-[#222]">
                      <SelectItem
                        value="none"
                        className="text-white focus:bg-[#333]"
                      >
                        None (Unassigned)
                      </SelectItem>
                      {areas.map((area) => (
                        <SelectItem
                          key={area.id}
                          value={area.id}
                          className="text-white focus:bg-[#333]"
                        >
                          {area.name} ({area.areaId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Optional: Assign drone to a specific area
                  </p>
                </div>
              </div>
            </div>

            {/* GPS & Navigation Section */}
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-200">
                GPS & Navigation
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* GPS Fix */}
                <div className="space-y-2">
                  <Label htmlFor="gpsFix" className="text-gray-300">
                    GPS Fix<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="gpsFix"
                    placeholder="Enter GPS fix value"
                    value={formData.gpsFix}
                    onChange={(e) => handleChange("gpsFix", e.target.value)}
                    required
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                  />
                </div>

                {/* Min HDOP */}
                <div className="space-y-2">
                  <Label htmlFor="minHDOP" className="text-gray-300">
                    Min. HDOP (0-1)<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="minHDOP"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="0.0 to 1.0"
                    value={formData.minHDOP}
                    onChange={(e) => handleChange("minHDOP", e.target.value)}
                    required
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                  />
                  {validationErrors.minHDOP && (
                    <p className="text-xs text-red-500">
                      {validationErrors.minHDOP}
                    </p>
                  )}
                </div>

                {/* Min Sat Count */}
                <div className="space-y-2">
                  <Label htmlFor="minSatCount" className="text-gray-300">
                    Min Sat Count (0-8)
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="minSatCount"
                    type="number"
                    min="0"
                    max="8"
                    placeholder="0 to 8"
                    value={formData.minSatCount}
                    onChange={(e) =>
                      handleChange("minSatCount", e.target.value)
                    }
                    required
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                  />
                  {validationErrors.minSatCount && (
                    <p className="text-xs text-red-500">
                      {validationErrors.minSatCount}
                    </p>
                  )}
                </div>

                {/* GPS Name */}
                <div className="space-y-2">
                  <Label htmlFor="gpsName" className="text-gray-300">
                    GPS Name<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="gpsName"
                    placeholder="Enter GPS name"
                    value={formData.gpsName}
                    onChange={(e) => handleChange("gpsName", e.target.value)}
                    required
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                  />
                </div>

                {/* GPS Lost */}
                <div className="space-y-2">
                  <Label htmlFor="gpsLost" className="text-gray-300">
                    GPS Lost<span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.gpsLost}
                    onValueChange={(value) => handleChange("gpsLost", value)}
                  >
                    <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#8B0000]">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent className="border-[#333] bg-[#222]">
                      {gpsLostActions.map((action) => (
                        <SelectItem
                          key={action}
                          value={action}
                          className="text-white focus:bg-[#333]"
                        >
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Flight Parameters Section */}
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-200">
                Flight Parameters
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Max Wind Speed */}
                <div className="space-y-2">
                  <Label htmlFor="maxWindSpeed" className="text-gray-300">
                    Max Wind Speed (m/s)
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="maxWindSpeed"
                    type="number"
                    step="0.1"
                    placeholder="Enter max wind speed"
                    value={formData.maxWindSpeed}
                    onChange={(e) =>
                      handleChange("maxWindSpeed", e.target.value)
                    }
                    required
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                  />
                </div>

                {/* Drone Speed */}
                <div className="space-y-2">
                  <Label htmlFor="droneSpeed" className="text-gray-300">
                    Drone Speed (m/s)<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="droneSpeed"
                    type="number"
                    step="0.1"
                    placeholder="Enter drone speed"
                    value={formData.droneSpeed}
                    onChange={(e) => handleChange("droneSpeed", e.target.value)}
                    required
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                  />
                </div>

                {/* Target Altitude */}
                <div className="space-y-2">
                  <Label htmlFor="targetAltitude" className="text-gray-300">
                    Target Altitude (m)
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="targetAltitude"
                    type="number"
                    step="0.1"
                    placeholder="Enter target altitude"
                    value={formData.targetAltitude}
                    onChange={(e) =>
                      handleChange("targetAltitude", e.target.value)
                    }
                    required
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                  />
                </div>

                {/* Max Altitude */}
                <div className="space-y-2">
                  <Label htmlFor="maxAltitude" className="text-gray-300">
                    Max Altitude (m)<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="maxAltitude"
                    type="number"
                    step="0.1"
                    placeholder="Enter max altitude"
                    value={formData.maxAltitude}
                    onChange={(e) =>
                      handleChange("maxAltitude", e.target.value)
                    }
                    required
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                  />
                </div>
              </div>
            </div>

            {/* Safety & Failsafe Section */}
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-200">
                Safety & Failsafe
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Telemetry Lost */}
                <div className="space-y-2">
                  <Label htmlFor="telemetryLost" className="text-gray-300">
                    Telemetry Lost<span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.telemetryLost}
                    onValueChange={(value) =>
                      handleChange("telemetryLost", value)
                    }
                  >
                    <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#8B0000]">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent className="border-[#333] bg-[#222]">
                      {telemetryLostActions.map((action) => (
                        <SelectItem
                          key={action}
                          value={action}
                          className="text-white focus:bg-[#333]"
                        >
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Min Battery Level */}
                <div className="space-y-2">
                  <Label htmlFor="minBatteryLevel" className="text-gray-300">
                    Min Battery Level (%)
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="minBatteryLevel"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0 to 100"
                    value={formData.minBatteryLevel}
                    onChange={(e) =>
                      handleChange("minBatteryLevel", e.target.value)
                    }
                    required
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                  />
                  {validationErrors.minBatteryLevel && (
                    <p className="text-xs text-red-500">
                      {validationErrors.minBatteryLevel}
                    </p>
                  )}
                </div>

                {/* Battery Fail Safe */}
                <div className="space-y-2">
                  <Label htmlFor="batteryFailSafe" className="text-gray-300">
                    Battery Fail Safe<span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.batteryFailSafe}
                    onValueChange={(value) =>
                      handleChange("batteryFailSafe", value)
                    }
                  >
                    <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#8B0000]">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent className="border-[#333] bg-[#222]">
                      {batteryFailSafeActions.map((action) => (
                        <SelectItem
                          key={action}
                          value={action}
                          className="text-white focus:bg-[#333]"
                        >
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* USB Address */}
                <div className="space-y-2">
                  <Label htmlFor="usbAddress" className="text-gray-300">
                    USB Address<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="usbAddress"
                    placeholder="e.g., /dev/ttyUSB0"
                    value={formData.usbAddress}
                    onChange={(e) => handleChange("usbAddress", e.target.value)}
                    required
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link href={`/drones/${params.id}`}>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  className="w-full border-[#333] bg-transparent text-white hover:bg-[#333] sm:w-auto"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full gap-2 bg-[#2563EB] px-6 text-white hover:bg-[#1D4ED8] disabled:opacity-50 sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    SAVE & NEXT
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
