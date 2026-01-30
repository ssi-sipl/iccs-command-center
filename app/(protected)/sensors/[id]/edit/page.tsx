// app/sensors/[id]/edit/page.tsx
// Updated Edit Sensor Page with Backend Integration + RTSP URL
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
import { ArrowLeft, Save, Radio, Loader2 } from "lucide-react";
import { getSensorById, updateSensor, type Sensor } from "@/lib/api/sensors";
import { getAllAreas } from "@/lib/api/areas";
import { getAllAlarms } from "@/lib/api/alarms";
import { useToast } from "@/hooks/use-toast";

// Options
const sensorTypes = [
  "Command Center",
  "Camera",
  "Post",
  "Motion Detector",
  "Thermal Sensor",
  "Infrared Sensor",
  "PIR Sensor",
  "Other",
];
const statusOptions = ["Active", "Inactive"];
const sendDroneOptions = ["Yes", "No"];
const activeOptions = ["Active", "Inactive"];

export default function EditSensorPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [alarms, setAlarms] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    sensorId: "",
    name: "",
    areaId: "",
    sensorType: "",
    alarmId: "",
    ipAddress: "",
    rtspUrl: "", // 🔹 new
    latitude: "",
    longitude: "",
    battery: "",
    status: "",
    sendDrone: "",
    activeShuruMode: "",
    addedBy: "",
  });

  const [validationErrors, setValidationErrors] = useState({
    name: "",
    sensorType: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch sensor, areas, and alarms
      const [sensorResponse, areasResponse, alarmsResponse] = await Promise.all(
        [
          getSensorById(params.id as string, true),
          getAllAreas(),
          getAllAlarms(),
        ],
      );

      if (sensorResponse.success && sensorResponse.data) {
        const sensorData = sensorResponse.data;
        setSensor(sensorData);
        setFormData({
          sensorId: sensorData.sensorId,
          name: sensorData.name,
          areaId: sensorData.areaId || "",
          sensorType: sensorData.sensorType,
          alarmId: sensorData.alarmId || "",
          ipAddress: sensorData.ipAddress || "",
          rtspUrl: sensorData.rtspUrl || "", // 🔹 new
          latitude: sensorData.latitude.toString(),
          longitude: sensorData.longitude.toString(),
          battery: sensorData.battery || "",
          status: sensorData.status,
          sendDrone: sensorData.sendDrone,
          activeShuruMode: sensorData.activeShuruMode,
          addedBy: sensorData.addedBy || "",
        });
      } else {
        setError(sensorResponse.error || "Failed to fetch sensor details");
        toast({
          title: "Error",
          description: sensorResponse.error || "Failed to fetch sensor details",
          variant: "destructive",
        });
      }

      if (areasResponse.success && areasResponse.data) {
        setAreas(areasResponse.data);
      }

      if (alarmsResponse.success && alarmsResponse.data) {
        setAlarms(alarmsResponse.data);
      }
    } catch (err) {
      setError("Failed to fetch data");
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {
      name: "",
      sensorType: "",
      latitude: "",
      longitude: "",
    };

    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Sensor name is required";
      isValid = false;
    } else if (formData.name.trim().length < 3) {
      errors.name = "Sensor name must be at least 3 characters";
      isValid = false;
    }

    // Sensor Type validation
    if (!formData.sensorType) {
      errors.sensorType = "Sensor type is required";
      isValid = false;
    }

    // Latitude validation
    const lat = parseFloat(formData.latitude);
    if (!formData.latitude || isNaN(lat) || lat < -90 || lat > 90) {
      errors.latitude = "Latitude must be between -90 and 90";
      isValid = false;
    }

    // Longitude validation
    const lng = parseFloat(formData.longitude);
    if (!formData.longitude || isNaN(lng) || lng < -180 || lng > 180) {
      errors.longitude = "Longitude must be between -180 and 180";
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
      const response = await updateSensor(params.id as string, {
        name: formData.name.trim(),
        sensorType: formData.sensorType,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        ipAddress: formData.ipAddress.trim() || undefined,
        rtspUrl: formData.rtspUrl.trim() || undefined, // 🔹 new
        battery: formData.battery.trim() || undefined,
        status: formData.status,
        sendDrone: formData.sendDrone,
        activeShuruMode: formData.activeShuruMode,
        areaId: formData.areaId || undefined,
        alarmId: formData.alarmId || undefined,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Sensor updated successfully",
        });
        router.push(`/sensors/${params.id}`);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update sensor",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update sensor",
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
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#2563EB]" />
          <p className="text-lg font-medium text-gray-400">
            Loading sensor details...
          </p>
        </div>
      </div>
    );
  }

  // Error State or Sensor Not Found
  if (error || !sensor) {
    return (
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
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Title */}
        <h1 className="mb-4 text-2xl font-semibold text-[#4A9FD4]">
          Edit Sensor
        </h1>

        {/* Back Button */}
        <Link
          href={`/sensors/${params.id}`}
          className="mb-6 inline-flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <form onSubmit={handleSubmit}>
          <div className="rounded-lg border border-[#333] bg-[#222] p-4 md:p-6">
            {/* Form Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Sensor ID (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="sensorId" className="text-gray-300">
                  Sensor ID
                </Label>
                <Input
                  id="sensorId"
                  value={formData.sensorId}
                  disabled
                  className="border-[#444] bg-[#1a1a1a] text-gray-500"
                />
                <p className="text-xs text-gray-500">
                  Sensor ID cannot be changed
                </p>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">
                  Name<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter sensor name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                />
                {validationErrors.name && (
                  <p className="text-xs text-red-500">
                    {validationErrors.name}
                  </p>
                )}
              </div>

              {/* Choose Area */}
              <div className="space-y-2">
                <Label className="text-gray-300">Choose Area</Label>
                <Select
                  value={formData.areaId || "none"}
                  onValueChange={(value) =>
                    handleChange("areaId", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#4A9FD4]">
                    <SelectValue placeholder="Select Area (Optional)" />
                  </SelectTrigger>
                  <SelectContent className="border-[#333] bg-[#222]">
                    <SelectItem
                      value="none"
                      className="text-white focus:bg-[#333] focus:text-white"
                    >
                      None
                    </SelectItem>
                    {areas.map((area) => (
                      <SelectItem
                        key={area.id}
                        value={area.id}
                        className="text-white focus:bg-[#333] focus:text-white"
                      >
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sensor Type */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Sensor Type<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.sensorType}
                  onValueChange={(value) => handleChange("sensorType", value)}
                >
                  <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#4A9FD4]">
                    <SelectValue placeholder="Select Sensor Type" />
                  </SelectTrigger>
                  <SelectContent className="border-[#333] bg-[#222]">
                    {sensorTypes.map((type) => (
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
                {validationErrors.sensorType && (
                  <p className="text-xs text-red-500">
                    {validationErrors.sensorType}
                  </p>
                )}
              </div>

              {/* Alarm */}
              <div className="space-y-2">
                <Label className="text-gray-300">Choose Alarm</Label>
                <Select
                  value={formData.alarmId || "none"}
                  onValueChange={(value) =>
                    handleChange("alarmId", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#4A9FD4]">
                    <SelectValue placeholder="None (Optional)" />
                  </SelectTrigger>
                  <SelectContent className="border-[#333] bg-[#222]">
                    <SelectItem
                      value="none"
                      className="text-white focus:bg-[#333] focus:text-white"
                    >
                      None
                    </SelectItem>
                    {alarms.map((alarm) => (
                      <SelectItem
                        key={alarm.id}
                        value={alarm.id}
                        className="text-white focus:bg-[#333] focus:text-white"
                      >
                        {alarm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* IP Address */}
              <div className="space-y-2">
                <Label htmlFor="ipAddress" className="text-gray-300">
                  IP Address
                </Label>
                <Input
                  id="ipAddress"
                  placeholder="e.g., 192.168.1.100"
                  value={formData.ipAddress}
                  onChange={(e) => handleChange("ipAddress", e.target.value)}
                  className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                />
              </div>

              {/* 🔹 RTSP URL */}
              <div className="space-y-2">
                <Label htmlFor="rtspUrl" className="text-gray-300">
                  RTSP URL
                </Label>
                <Input
                  id="rtspUrl"
                  placeholder="rtsp://user:pass@ip:554/stream"
                  value={formData.rtspUrl}
                  onChange={(e) => handleChange("rtspUrl", e.target.value)}
                  className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                />
                <p className="text-xs text-gray-500">
                  Optional – used for live video streaming.
                </p>
              </div>

              {/* Latitude */}
              <div className="space-y-2">
                <Label htmlFor="latitude" className="text-gray-300">
                  Latitude<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g., 28.6139"
                  value={formData.latitude}
                  onChange={(e) => handleChange("latitude", e.target.value)}
                  required
                  className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
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
                  type="number"
                  step="any"
                  placeholder="e.g., 77.2090"
                  value={formData.longitude}
                  onChange={(e) => handleChange("longitude", e.target.value)}
                  required
                  className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                />
                {validationErrors.longitude && (
                  <p className="text-xs text-red-500">
                    {validationErrors.longitude}
                  </p>
                )}
              </div>

              {/* Battery */}
              <div className="space-y-2">
                <Label htmlFor="battery" className="text-gray-300">
                  Battery
                </Label>
                <Input
                  id="battery"
                  placeholder="e.g., 85%"
                  value={formData.battery}
                  onChange={(e) => handleChange("battery", e.target.value)}
                  className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Status<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange("status", value)}
                >
                  <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#4A9FD4]">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="border-[#333] bg-[#222]">
                    {statusOptions.map((status) => (
                      <SelectItem
                        key={status}
                        value={status}
                        className="text-white focus:bg-[#333] focus:text-white"
                      >
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Send Drone */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Send Drone<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.sendDrone}
                  onValueChange={(value) => handleChange("sendDrone", value)}
                >
                  <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#4A9FD4]">
                    <SelectValue placeholder="Auto-launch drone?" />
                  </SelectTrigger>
                  <SelectContent className="border-[#333] bg-[#222]">
                    {sendDroneOptions.map((option) => (
                      <SelectItem
                        key={option}
                        value={option}
                        className="text-white focus:bg-[#333] focus:text-white"
                      >
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Active / Shuru Mode */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Active / Shuru<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.activeShuruMode}
                  onValueChange={(value) =>
                    handleChange("activeShuruMode", value)
                  }
                >
                  <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#4A9FD4]">
                    <SelectValue placeholder="Select Sensor State" />
                  </SelectTrigger>
                  <SelectContent className="border-[#333] bg-[#222]">
                    {activeOptions.map((option) => (
                      <SelectItem
                        key={option}
                        value={option}
                        className="text-white focus:bg-[#333] focus:text-white"
                      >
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addedBy" className="text-gray-300">
                  Added By <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="addedBy"
                  placeholder="Operator Name"
                  value={formData.addedBy}
                  disabled
                  className="border-[#333] bg-[#1a1a1a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                />
                <p className="text-xs text-gray-500">
                  Added By cannot be changed
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link href={`/sensors/${params.id}`}>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  className="w-full border-[#444] bg-transparent text-white hover:bg-[#333] sm:w-auto"
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
                    Save Changes
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
