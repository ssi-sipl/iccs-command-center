// app/sensors/add/page.tsx
// Updated Add Sensor Page with Backend Integration
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2 } from "lucide-react";
import { createSensor } from "@/lib/api/sensors";
import { getAllAreas } from "@/lib/api/areas";
import { getAllAlarms } from "@/lib/api/alarms";
import { useToast } from "@/hooks/use-toast";

// Sensor types
const sensorTypes = [
  "Motion Detector",
  "Camera",
  "Thermal Sensor",
  "Infrared Sensor",
  "PIR Sensor",
  "Other",
];
const statusOptions = ["Active", "Inactive"];
const sendDroneOptions = ["Yes", "No"];
const activeOptions = ["Active", "Inactive"];

export default function AddSensorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState<any[]>([]);
  const [alarms, setAlarms] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    areaId: "",
    sensorType: "",
    alarmId: "",
    name: "",
    sensorId: "",
    ipAddress: "",
    latitude: "",
    longitude: "",
    battery: "",
    status: "Active",
    sendDrone: "No",
    activeShuruMode: "Active",
  });

  const [validationErrors, setValidationErrors] = useState({
    sensorId: "",
    name: "",
    sensorType: "",
    latitude: "",
    longitude: "",
    status: "",
    activeShuruMode: "",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch areas and alarms
      const [areasResponse, alarmsResponse] = await Promise.all([
        getAllAreas(),
        getAllAlarms(),
      ]);

      if (areasResponse.success && areasResponse.data) {
        console.log("Fetched areas:", areasResponse.data);
        setAreas(areasResponse.data);
      }

      if (alarmsResponse.success && alarmsResponse.data) {
        console.log("Fetched alarms:", alarmsResponse.data);
        setAlarms(alarmsResponse.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load initial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {
      sensorId: "",
      name: "",
      sensorType: "",
      latitude: "",
      longitude: "",
      status: "",
      activeShuruMode: "",
    };

    let isValid = true;

    // Sensor ID validation
    if (!formData.sensorId.trim()) {
      errors.sensorId = "Sensor ID is required";
      isValid = false;
    }

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

    // Status validation
    if (!formData.status) {
      errors.status = "Status is required";
      isValid = false;
    }

    // Active/Shuru mode validation
    if (!formData.activeShuruMode) {
      errors.activeShuruMode = "Active/Shuru mode is required";
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
      const response = await createSensor({
        sensorId: formData.sensorId.trim(),
        name: formData.name.trim(),
        sensorType: formData.sensorType,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        ipAddress: formData.ipAddress.trim() || undefined,
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
          description: `Sensor "${formData.name}" created successfully`,
        });
        router.push("/sensors");
      } else {
        // Handle specific error cases
        if (response.error?.includes("already exists")) {
          setValidationErrors({
            ...validationErrors,
            sensorId: "This Sensor ID already exists",
          });
        }
        toast({
          title: "Error",
          description: response.error || "Failed to create sensor",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create sensor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col bg-[#1a1a1a]">
        <DashboardHeader activeItem="SENSORS" />
        <div className="relative flex flex-1 overflow-hidden">
          <DashboardSidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className="flex flex-1 items-center justify-center p-4">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#2563EB]" />
              <p className="text-lg font-medium text-gray-400">Loading...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader activeItem="SENSORS" />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {/* Header with Title and Back Button */}
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-[#4A9FD4]">
                Add Sensor
              </h1>
              <Link href="/sensors">
                <Button
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  BACK
                </Button>
              </Link>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Form Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Choose Area */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Choose Area:</Label>
                  <Select
                    value={formData.areaId || undefined}
                    onValueChange={(value) => handleChange("areaId", value)}
                  >
                    <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#4A9FD4]">
                      <SelectValue placeholder="Select Area (Optional)" />
                    </SelectTrigger>
                    <SelectContent className="border-[#333] bg-[#222]">
                      <SelectItem
                        value=""
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

                {/* Choose Sensor Type */}
                <div className="space-y-2">
                  <Label className="text-gray-300">
                    Choose Sensor Type:<span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.areaId || undefined}
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

                {/* Choose Alarm */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Choose Alarm:</Label>
                  <Select
                    value={formData.alarmId || ""}
                    onValueChange={(value) => handleChange("alarmId", value)}
                  >
                    <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#4A9FD4]">
                      <SelectValue placeholder="None (Optional)" />
                    </SelectTrigger>
                    <SelectContent className="border-[#333] bg-[#222]">
                      <SelectItem
                        value=""
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

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">
                    Name:<span className="text-red-500">*</span>
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

                {/* Sensor ID */}
                <div className="space-y-2">
                  <Label htmlFor="sensorId" className="text-gray-300">
                    Sensor ID:<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="sensorId"
                    placeholder="Enter unique sensor ID"
                    value={formData.sensorId}
                    onChange={(e) => handleChange("sensorId", e.target.value)}
                    required
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                  />
                  {validationErrors.sensorId && (
                    <p className="text-xs text-red-500">
                      {validationErrors.sensorId}
                    </p>
                  )}
                </div>

                {/* IP Address */}
                <div className="space-y-2">
                  <Label htmlFor="ipAddress" className="text-gray-300">
                    IP Address:
                  </Label>
                  <Input
                    id="ipAddress"
                    placeholder="e.g., 192.168.1.100"
                    value={formData.ipAddress}
                    onChange={(e) => handleChange("ipAddress", e.target.value)}
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                  />
                </div>

                {/* Latitude */}
                <div className="space-y-2">
                  <Label htmlFor="latitude" className="text-gray-300">
                    Latitude:<span className="text-red-500">*</span>
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
                    Longitude:<span className="text-red-500">*</span>
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
                    Battery:
                  </Label>
                  <Input
                    id="battery"
                    placeholder="e.g., 85%"
                    value={formData.battery}
                    onChange={(e) => handleChange("battery", e.target.value)}
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                  />
                </div>

                {/* Choose Status */}
                <div className="space-y-2">
                  <Label className="text-gray-300">
                    Choose Status:<span className="text-red-500">*</span>
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
                  {validationErrors.status && (
                    <p className="text-xs text-red-500">
                      {validationErrors.status}
                    </p>
                  )}
                </div>

                {/* Send Drone / Drone Bhejo */}
                <div className="space-y-2">
                  <Label className="text-gray-300">
                    Send Drone / Drone Bhejo:
                    <span className="text-red-500">*</span>
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

                {/* Active / Shuru */}
                <div className="space-y-2">
                  <Label className="text-gray-300">
                    Active / Shuru:<span className="text-red-500">*</span>
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
                  {validationErrors.activeShuruMode && (
                    <p className="text-xs text-red-500">
                      {validationErrors.activeShuruMode}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8 flex justify-center gap-3">
                <Link href="/sensors">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    className="border-[#444] bg-transparent text-white hover:bg-[#333]"
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#2563EB] px-8 text-white hover:bg-[#1D4ED8] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "SUBMIT"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
