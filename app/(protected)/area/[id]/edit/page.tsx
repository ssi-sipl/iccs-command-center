// app/area/[id]/edit/page.tsx
// Updated Edit Area Page with Backend Integration
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Save, MapPin, Loader2 } from "lucide-react";
import { getAreaById, updateArea, type Area } from "@/lib/api/areas";
import { useToast } from "@/hooks/use-toast";

export default function EditAreaPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [area, setArea] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    areaId: "",
    name: "",
    latitude: "",
    longitude: "",
    addedBy: "",
    status: "Active",
  });

  const [validationErrors, setValidationErrors] = useState({
    name: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    if (params.id) {
      fetchAreaDetails();
    }
  }, [params.id]);

  const fetchAreaDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAreaById(params.id as string);
      if (response.success && response.data) {
        const areaData = response.data;
        setArea(areaData);
        setFormData({
          areaId: areaData.areaId,
          name: areaData.name,
          latitude: areaData.latitude.toString(),
          longitude: areaData.longitude.toString(),
          addedBy: areaData.addedBy || "",
          status: areaData.status,
        });
      } else {
        setError(response.error || "Failed to fetch area details");
        toast({
          title: "Error",
          description: response.error || "Failed to fetch area details",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("Failed to fetch area details");
      toast({
        title: "Error",
        description: "Failed to fetch area details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {
      name: "",
      latitude: "",
      longitude: "",
    };

    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = "Area name is required";
      isValid = false;
    }

    const lat = parseFloat(formData.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.latitude = "Latitude must be between -90 and 90";
      isValid = false;
    }

    const lng = parseFloat(formData.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
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
      const response = await updateArea(params.id as string, {
        name: formData.name,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        status: formData.status,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Area updated successfully",
        });
        router.push(`/area/${params.id}`);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update area",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update area",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#8B0000]" />
          <p className="text-lg font-medium text-gray-400">
            Loading area details...
          </p>
        </div>
      </div>
    );
  }

  // Error State or Area Not Found
  if (error || !area) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="text-center">
          <MapPin className="mx-auto mb-4 h-12 w-12 text-gray-600" />
          <h1 className="mb-2 text-xl font-bold text-white">Area Not Found</h1>
          <p className="mb-4 text-gray-400">
            {error || "The requested area does not exist."}
          </p>
          <Link href="/area">
            <Button className="bg-[#8B0000] text-white hover:bg-[#6B0000]">
              Back to Areas
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Back Button */}
        <Link
          href={`/area/${params.id}`}
          className="mb-6 inline-flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Area Details
        </Link>

        <Card className="border-[#333] bg-[#222]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8B0000]">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Edit Area</CardTitle>
                <CardDescription className="text-gray-400">
                  Update area details and coordinates
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="areaId" className="text-gray-300">
                    Area ID
                  </Label>
                  <Input
                    id="areaId"
                    value={formData.areaId}
                    disabled
                    className="border-[#333] bg-[#1a1a1a] text-gray-500"
                  />
                  <p className="text-xs text-gray-500">
                    Area ID cannot be changed
                  </p>
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
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setValidationErrors({ ...validationErrors, name: "" });
                  }}
                  required
                  className="border-[#333] bg-[#1a1a1a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                />
                {validationErrors.name && (
                  <p className="text-xs text-red-500">
                    {validationErrors.name}
                  </p>
                )}
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

              <div className="space-y-2">
                <Label htmlFor="areaId" className="text-gray-300">
                  Area ID
                </Label>
                <Input
                  id="areaId"
                  value={formData.areaId}
                  disabled
                  className="border-[#333] bg-[#1a1a1a] text-gray-500"
                />
                <p className="text-xs text-gray-500">
                  Area ID cannot be changed
                </p>
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
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        latitude: e.target.value,
                      });
                      setValidationErrors({
                        ...validationErrors,
                        latitude: "",
                      });
                    }}
                    required
                    className="border-[#333] bg-[#1a1a1a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                  />
                  {validationErrors.latitude ? (
                    <p className="text-xs text-red-500">
                      {validationErrors.latitude}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">Range: -90 to 90</p>
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
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        longitude: e.target.value,
                      });
                      setValidationErrors({
                        ...validationErrors,
                        longitude: "",
                      });
                    }}
                    required
                    className="border-[#333] bg-[#1a1a1a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                  />
                  {validationErrors.longitude ? (
                    <p className="text-xs text-red-500">
                      {validationErrors.longitude}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">Range: -180 to 180</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                <Link href={`/area/${params.id}`}>
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
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
