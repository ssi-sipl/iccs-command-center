// app/alarm/[id]/edit/page.tsx
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
import { Switch } from "@/components/ui/switch";
import { Loader2, Radio } from "lucide-react";

import { getAlarmById, updateAlarm, type Alarm } from "@/lib/api/alarms";
import { getAllAreas } from "@/lib/api/areas";
import { useToast } from "@/hooks/use-toast";

export default function EditAlarmPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    alarmId: "",
    name: "",
    areaId: "",
    status: true, // true = Active, false = Inactive
  });

  useEffect(() => {
    if (!params?.id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [alarmResponse, areasResponse] = await Promise.all([
          getAlarmById(params.id as string, true),
          getAllAreas(),
        ]);

        if (alarmResponse.success && alarmResponse.data) {
          const alarmData = alarmResponse.data;
          setAlarm(alarmData);

          setFormData({
            alarmId: alarmData.alarmId,
            name: alarmData.name,
            areaId: alarmData.areaId || "",
            status: alarmData.status.toLowerCase() === "active",
          });
        } else {
          const msg = alarmResponse.error || "Failed to fetch alarm details";
          setError(msg);
          toast({
            title: "Error",
            description: msg,
            variant: "destructive",
          });
        }

        if (areasResponse.success && areasResponse.data) {
          setAreas(areasResponse.data);
        } else if (!areasResponse.success) {
          toast({
            title: "Error",
            description: areasResponse.error || "Failed to load areas",
            variant: "destructive",
          });
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

    fetchData();
  }, [params?.id, toast]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.areaId) {
      toast({
        title: "Validation Error",
        description: "Name and Area are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await updateAlarm(params.id as string, {
        name: formData.name.trim(),
        status: formData.status ? "Active" : "Inactive",
        areaId: formData.areaId || undefined,
        // alarmId is not editable here; if you want to allow it:
        // alarmId: formData.alarmId.trim(),
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Alarm updated successfully",
        });
        router.push(`/alarm/${params.id}`);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update alarm",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update alarm",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen flex-col bg-[#1a1a1a]">
        <DashboardHeader activeItem="ALARM" />
        <div className="relative flex flex-1 overflow-hidden">
          <DashboardSidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className="flex flex-1 items-center justify-center p-4">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#2563EB]" />
              <p className="text-lg font-medium text-gray-400">
                Loading alarm details...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error / not found
  if (error || !alarm) {
    return (
      <div className="flex h-screen flex-col bg-[#1a1a1a]">
        <DashboardHeader activeItem="ALARM" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Radio className="mx-auto h-16 w-16 text-gray-500" />
            <h1 className="mt-4 text-2xl font-bold text-white">
              Alarm Not Found
            </h1>
            <p className="mt-2 text-gray-400">
              {error || "The alarm you're looking for doesn't exist."}
            </p>
            <Link href="/alarm">
              <Button className="mt-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                Back to Alarms
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader activeItem="ALARM" />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-4xl">
            {/* Header with Title and Back Button */}
            <div className="mb-8 flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-[#4A9FD4]">
                Edit Alarm
              </h1>
              <Link href={`/alarm/${params.id}`}>
                <Button
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  BACK
                </Button>
              </Link>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Form Grid - 2 columns */}
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Alarm ID - Locked */}
                <div className="space-y-2">
                  <Label htmlFor="alarm_id" className="text-gray-300">
                    Alarm ID:<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="alarm_id"
                    value={formData.alarmId}
                    disabled
                    className="border-[#444] bg-[#333] text-gray-400"
                  />
                  <p className="text-xs text-gray-500">
                    Alarm ID cannot be changed
                  </p>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">
                    Name:<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter alarm name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                  />
                </div>

                {/* Area */}
                <div className="space-y-2">
                  <Label className="text-gray-300">
                    Area:<span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.areaId || undefined}
                    onValueChange={(value) => handleChange("areaId", value)}
                  >
                    <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#4A9FD4]">
                      <SelectValue placeholder="Select an Area" />
                    </SelectTrigger>
                    <SelectContent className="border-[#333] bg-[#222]">
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

                {/* Status Toggle */}
                <div className="flex items-center space-x-3 pt-8">
                  <Switch
                    id="status"
                    checked={formData.status}
                    onCheckedChange={(checked) =>
                      handleChange("status", checked)
                    }
                    className="data-[state=checked]:bg-[#4A9FD4]"
                  />
                  <Label htmlFor="status" className="text-gray-300">
                    Status: {formData.status ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>

              {/* Submit Button - Centered */}
              <div className="mt-10 flex justify-center">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#2563EB] px-8 text-white hover:bg-[#1D4ED8] disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "UPDATE"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
