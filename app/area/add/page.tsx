// app/area/add/page.tsx
// Updated Add Area Page with Backend Integration
"use client";

import type React from "react";
import { useState } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Save, MapPin, Loader2 } from "lucide-react";
import { createArea } from "@/lib/api/areas";
import { useToast } from "@/hooks/use-toast";

export default function AddAreaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    areaId: "",
    name: "",
    latitude: "",
    longitude: "",
    status: "Active",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    areaId: "",
    name: "",
    latitude: "",
    longitude: "",
  });

  const validateForm = () => {
    const errors = {
      areaId: "",
      name: "",
      latitude: "",
      longitude: "",
    };

    let isValid = true;

    // Validate Area ID
    if (!formData.areaId.trim()) {
      errors.areaId = "Area ID is required";
      isValid = false;
    } else if (!/^[A-Z0-9-]+$/i.test(formData.areaId)) {
      errors.areaId = "Area ID can only contain letters, numbers, and hyphens";
      isValid = false;
    }

    // Validate Name
    if (!formData.name.trim()) {
      errors.name = "Area name is required";
      isValid = false;
    } else if (formData.name.trim().length < 3) {
      errors.name = "Area name must be at least 3 characters";
      isValid = false;
    }

    // Validate Latitude
    const lat = parseFloat(formData.latitude);
    if (!formData.latitude) {
      errors.latitude = "Latitude is required";
      isValid = false;
    } else if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.latitude = "Latitude must be between -90 and 90";
      isValid = false;
    }

    // Validate Longitude
    const lng = parseFloat(formData.longitude);
    if (!formData.longitude) {
      errors.longitude = "Longitude is required";
      isValid = false;
    } else if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.longitude = "Longitude must be between -180 and 180";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
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
      const response = await createArea({
        areaId: formData.areaId.trim(),
        name: formData.name.trim(),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        status: formData.status,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `Area "${formData.name}" created successfully`,
        });
        router.push("/area");
      } else {
        // Handle specific error cases
        if (response.error?.includes("already exists")) {
          setValidationErrors({
            ...validationErrors,
            areaId: "This Area ID already exists",
          });
        }
        toast({
          title: "Error",
          description: response.error || "Failed to create area",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create area. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear validation error when user starts typing
    setValidationErrors({ ...validationErrors, [field]: "" });
  };

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader activeItem="AREA" />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-2xl">
            {/* Back Button */}
            <Link
              href="/area"
              className="mb-6 inline-flex items-center gap-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Areas
            </Link>

            <Card className="border-[#333] bg-[#222]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8B0000]">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">
                      Add New Area
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Create a new surveillance area with coordinates
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="areaId" className="text-gray-300">
                        Area ID <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="areaId"
                        placeholder="e.g., AREA-006"
                        value={formData.areaId}
                        onChange={(e) =>
                          handleFieldChange("areaId", e.target.value)
                        }
                        required
                        className="border-[#333] bg-[#1a1a1a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                      />
                      {validationErrors.areaId ? (
                        <p className="text-xs text-red-500">
                          {validationErrors.areaId}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Unique identifier for the area
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-gray-300">
                        Status
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger className="border-[#333] bg-[#1a1a1a] text-white focus:ring-[#8B0000]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-[#333] bg-[#222]">
                          <SelectItem
                            value="Active"
                            className="text-white focus:bg-[#333] focus:text-white"
                          >
                            Active
                          </SelectItem>
                          <SelectItem
                            value="Inactive"
                            className="text-white focus:bg-[#333] focus:text-white"
                          >
                            Inactive
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">
                      Area Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., North Sector Zone B"
                      value={formData.name}
                      onChange={(e) =>
                        handleFieldChange("name", e.target.value)
                      }
                      required
                      className="border-[#333] bg-[#1a1a1a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                    />
                    {validationErrors.name && (
                      <p className="text-xs text-red-500">
                        {validationErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="latitude" className="text-gray-300">
                        Latitude <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        placeholder="e.g., 28.6139"
                        value={formData.latitude}
                        onChange={(e) =>
                          handleFieldChange("latitude", e.target.value)
                        }
                        required
                        className="border-[#333] bg-[#1a1a1a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                      />
                      {validationErrors.latitude ? (
                        <p className="text-xs text-red-500">
                          {validationErrors.latitude}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Range: -90 to 90
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude" className="text-gray-300">
                        Longitude <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        placeholder="e.g., 77.2090"
                        value={formData.longitude}
                        onChange={(e) =>
                          handleFieldChange("longitude", e.target.value)
                        }
                        required
                        className="border-[#333] bg-[#1a1a1a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                      />
                      {validationErrors.longitude ? (
                        <p className="text-xs text-red-500">
                          {validationErrors.longitude}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Range: -180 to 180
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                    <Link href="/area">
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
                      className="w-full gap-2 bg-[#8B0000] text-white hover:bg-[#6B0000] disabled:opacity-50 sm:w-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Create Area
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
