"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import { gpsLostActions, telemetryLostActions, batteryFailSafeActions } from "@/lib/data/drones"

export default function AddDronePage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [formData, setFormData] = useState({
    drone_id: "",
    drone_os_name: "",
    drone_type: "",
    gps_fix: "",
    min_hdop: "",
    min_sat_count: "",
    max_wind_speed: "",
    drone_speed: "",
    target_altitude: "",
    gps_lost_action: "",
    telemetry_lost_action: "",
    min_battery_level: "",
    usb_address: "",
    battery_fail_safe: "",
    gps_name: "",
    max_altitude: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // TODO: Replace with actual API call
    console.log("Creating drone:", formData)

    setIsSubmitting(false)
    router.push("/drones")
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader activeItem="DRONES" />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {/* Title */}
            <h1 className="mb-4 text-2xl font-semibold text-[#4A9FD4]">OS Settings</h1>

            {/* Back Button */}
            <Link href="/drones" className="mb-6 inline-flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>

            <form onSubmit={handleSubmit}>
              <div className="rounded-lg border border-[#333] bg-[#222] p-4 md:p-6">
                {/* Form Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Drone OS Name */}
                  <div className="space-y-2">
                    <Label htmlFor="drone_os_name" className="text-gray-300">
                      Drone OS Name<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="drone_os_name"
                      placeholder="Enter drone OS name"
                      value={formData.drone_os_name}
                      onChange={(e) => handleChange("drone_os_name", e.target.value)}
                      required
                      className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                    />
                  </div>

                  {/* Drone Type */}
                  <div className="space-y-2">
                    <Label htmlFor="drone_type" className="text-gray-300">
                      Drone Type<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="drone_type"
                      placeholder="Enter drone type (e.g., quadcopter, hexacopter)"
                      value={formData.drone_type}
                      onChange={(e) => handleChange("drone_type", e.target.value)}
                      required
                      className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                    />
                  </div>

                  {/* GPS Fix */}
                  <div className="space-y-2">
                    <Label htmlFor="gps_fix" className="text-gray-300">
                      GPS Fix<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="gps_fix"
                      placeholder="Enter GPS fix value"
                      value={formData.gps_fix}
                      onChange={(e) => handleChange("gps_fix", e.target.value)}
                      required
                      className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                    />
                  </div>

                  {/* Min HDOP */}
                  <div className="space-y-2">
                    <Label htmlFor="min_hdop" className="text-gray-300">
                      {"Min. HDOP(1<0)"}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="min_hdop"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      placeholder="Enter a value between 0 and 1"
                      value={formData.min_hdop}
                      onChange={(e) => handleChange("min_hdop", e.target.value)}
                      required
                      className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                    />
                  </div>

                  {/* Min Sat Count */}
                  <div className="space-y-2">
                    <Label htmlFor="min_sat_count" className="text-gray-300">
                      Min Sat Count (1-8)<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="min_sat_count"
                      type="number"
                      min="1"
                      max="8"
                      placeholder="Enter a number between 0 and 8"
                      value={formData.min_sat_count}
                      onChange={(e) => handleChange("min_sat_count", e.target.value)}
                      required
                      className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                    />
                  </div>

                  {/* Max Wind Speed */}
                  <div className="space-y-2">
                    <Label htmlFor="max_wind_speed" className="text-gray-300">
                      Max Wind Speed(m/s)<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="max_wind_speed"
                      type="number"
                      placeholder="Enter maximum wind speed in m/s"
                      value={formData.max_wind_speed}
                      onChange={(e) => handleChange("max_wind_speed", e.target.value)}
                      required
                      className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                    />
                  </div>

                  {/* Drone Speed */}
                  <div className="space-y-2">
                    <Label htmlFor="drone_speed" className="text-gray-300">
                      Drone Speed(m/s)<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="drone_speed"
                      type="number"
                      placeholder="Enter maximum drone speed in m/s"
                      value={formData.drone_speed}
                      onChange={(e) => handleChange("drone_speed", e.target.value)}
                      required
                      className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                    />
                  </div>

                  {/* Target Altitude */}
                  <div className="space-y-2">
                    <Label htmlFor="target_altitude" className="text-gray-300">
                      Target Altitude(m)<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="target_altitude"
                      type="number"
                      placeholder="Enter target altitude in meters"
                      value={formData.target_altitude}
                      onChange={(e) => handleChange("target_altitude", e.target.value)}
                      required
                      className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                    />
                  </div>

                  {/* GPS Lost */}
                  <div className="space-y-2">
                    <Label htmlFor="gps_lost_action" className="text-gray-300">
                      GPS Lost<span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.gps_lost_action}
                      onValueChange={(value) => handleChange("gps_lost_action", value)}
                    >
                      <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#8B0000]">
                        <SelectValue placeholder="Select action on GPS lost" />
                      </SelectTrigger>
                      <SelectContent className="border-[#333] bg-[#222]">
                        {gpsLostActions.map((action) => (
                          <SelectItem
                            key={action}
                            value={action}
                            className="text-white focus:bg-[#333] focus:text-white"
                          >
                            {action}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Telemetry Lost */}
                  <div className="space-y-2">
                    <Label htmlFor="telemetry_lost_action" className="text-gray-300">
                      Telemetry Lost<span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.telemetry_lost_action}
                      onValueChange={(value) => handleChange("telemetry_lost_action", value)}
                    >
                      <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#8B0000]">
                        <SelectValue placeholder="Select action on telemetry lost" />
                      </SelectTrigger>
                      <SelectContent className="border-[#333] bg-[#222]">
                        {telemetryLostActions.map((action) => (
                          <SelectItem
                            key={action}
                            value={action}
                            className="text-white focus:bg-[#333] focus:text-white"
                          >
                            {action}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Min Battery Level */}
                  <div className="space-y-2">
                    <Label htmlFor="min_battery_level" className="text-gray-300">
                      Min Battery Level(%)<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="min_battery_level"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Enter minimum battery level in percentage"
                      value={formData.min_battery_level}
                      onChange={(e) => handleChange("min_battery_level", e.target.value)}
                      required
                      className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                    />
                  </div>

                  {/* USB Address */}
                  <div className="space-y-2">
                    <Label htmlFor="usb_address" className="text-gray-300">
                      USB Address<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="usb_address"
                      placeholder="Enter USB address"
                      value={formData.usb_address}
                      onChange={(e) => handleChange("usb_address", e.target.value)}
                      required
                      className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                    />
                  </div>

                  {/* Battery Fail Safe */}
                  <div className="space-y-2">
                    <Label htmlFor="battery_fail_safe" className="text-gray-300">
                      Battery Fail Safe(RTL, Land)<span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.battery_fail_safe}
                      onValueChange={(value) => handleChange("battery_fail_safe", value)}
                    >
                      <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#8B0000]">
                        <SelectValue placeholder="Select action on battery fail safe" />
                      </SelectTrigger>
                      <SelectContent className="border-[#333] bg-[#222]">
                        {batteryFailSafeActions.map((action) => (
                          <SelectItem
                            key={action}
                            value={action}
                            className="text-white focus:bg-[#333] focus:text-white"
                          >
                            {action}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* GPS Name */}
                  <div className="space-y-2">
                    <Label htmlFor="gps_name" className="text-gray-300">
                      GPS Name<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="gps_name"
                      placeholder="Enter GPS name"
                      value={formData.gps_name}
                      onChange={(e) => handleChange("gps_name", e.target.value)}
                      required
                      className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                    />
                  </div>

                  {/* Max Altitude */}
                  <div className="space-y-2">
                    <Label htmlFor="max_altitude" className="text-gray-300">
                      Max Altitude(m)<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="max_altitude"
                      type="number"
                      placeholder="Enter maximum altitude in meters"
                      value={formData.max_altitude}
                      onChange={(e) => handleChange("max_altitude", e.target.value)}
                      required
                      className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-8 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2 bg-[#2563EB] px-6 text-white hover:bg-[#1D4ED8]"
                  >
                    <Save className="h-4 w-4" />
                    {isSubmitting ? "Saving..." : "SAVE & NEXT"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
