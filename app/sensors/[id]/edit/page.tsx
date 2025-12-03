"use client"

import type React from "react"
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Radio } from "lucide-react"
import {
  sensorsData,
  sensorTypes,
  alarmOptions,
  statusOptions,
  sendDroneOptions,
  activeOptions,
} from "@/lib/data/sensors"
import { areasData } from "@/lib/data/areas"

export default function EditSensorPage() {
  const params = useParams()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const sensor = sensorsData.find((s) => s.sensor_id === params.id)

  const [formData, setFormData] = useState({
    sensor_id: sensor?.sensor_id || "",
    name: sensor?.name || "",
    area_id: sensor?.area_id || "",
    sensor_type: sensor?.sensor_type || "",
    alarm: sensor?.alarm || "",
    ip_address: sensor?.ip_address || "",
    latitude: sensor?.latitude.toString() || "",
    longitude: sensor?.longitude.toString() || "",
    battery: sensor?.battery || "",
    status: sensor?.status || "",
    send_drone: sensor?.send_drone || "",
    active: sensor?.active || "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!sensor) {
    return (
      <div className="flex h-screen flex-col bg-[#1a1a1a]">
        <DashboardHeader activeItem="SENSORS" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Radio className="mx-auto h-16 w-16 text-gray-500" />
            <h2 className="mt-4 text-xl text-white">Sensor not found</h2>
            <Link href="/sensors">
              <Button className="mt-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8]">Back to Sensors</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // TODO: Replace with actual API call
    console.log("Updating sensor:", formData)

    setIsSubmitting(false)
    router.push(`/sensors/${sensor.sensor_id}`)
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader activeItem="SENSORS" />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {/* Title */}
            <h1 className="mb-4 text-2xl font-semibold text-[#4A9FD4]">Edit Sensor</h1>

            {/* Back Button */}
            <Link
              href={`/sensors/${sensor.sensor_id}`}
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
                    <Label htmlFor="sensor_id" className="text-gray-300">
                      Sensor ID
                    </Label>
                    <Input
                      id="sensor_id"
                      value={formData.sensor_id}
                      disabled
                      className="border-[#444] bg-[#1a1a1a] text-gray-500"
                    />
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
                  </div>

                  {/* Choose Area */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">
                      Choose Area<span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.area_id} onValueChange={(value) => handleChange("area_id", value)}>
                      <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#4A9FD4]">
                        <SelectValue placeholder="Select Area" />
                      </SelectTrigger>
                      <SelectContent className="border-[#333] bg-[#222]">
                        {areasData.map((area) => (
                          <SelectItem
                            key={area.area_id}
                            value={area.area_id}
                            className="text-white focus:bg-[#333] focus:text-white"
                          >
                            {area.area_name}
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
                    <Select value={formData.sensor_type} onValueChange={(value) => handleChange("sensor_type", value)}>
                      <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#4A9FD4]">
                        <SelectValue placeholder="Select Sensor Type" />
                      </SelectTrigger>
                      <SelectContent className="border-[#333] bg-[#222]">
                        {sensorTypes.map((type) => (
                          <SelectItem key={type} value={type} className="text-white focus:bg-[#333] focus:text-white">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Alarm */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Choose Alarm</Label>
                    <Select value={formData.alarm} onValueChange={(value) => handleChange("alarm", value)}>
                      <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#4A9FD4]">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent className="border-[#333] bg-[#222]">
                        {alarmOptions.map((alarm) => (
                          <SelectItem key={alarm} value={alarm} className="text-white focus:bg-[#333] focus:text-white">
                            {alarm}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* IP Address */}
                  <div className="space-y-2">
                    <Label htmlFor="ip_address" className="text-gray-300">
                      IP Address
                    </Label>
                    <Input
                      id="ip_address"
                      placeholder="Enter IP address"
                      value={formData.ip_address}
                      onChange={(e) => handleChange("ip_address", e.target.value)}
                      className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                    />
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
                      placeholder="Enter latitude"
                      value={formData.latitude}
                      onChange={(e) => handleChange("latitude", e.target.value)}
                      required
                      className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                    />
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
                      placeholder="Enter longitude"
                      value={formData.longitude}
                      onChange={(e) => handleChange("longitude", e.target.value)}
                      required
                      className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                    />
                  </div>

                  {/* Battery */}
                  <div className="space-y-2">
                    <Label htmlFor="battery" className="text-gray-300">
                      Battery
                    </Label>
                    <Input
                      id="battery"
                      placeholder="Enter battery status"
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
                    <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                      <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#4A9FD4]">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent className="border-[#333] bg-[#222]">
                        {statusOptions.map((status) => (
                          <SelectItem
                            key={status}
                            value={status}
                            className="text-white capitalize focus:bg-[#333] focus:text-white"
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
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
                    <Select value={formData.send_drone} onValueChange={(value) => handleChange("send_drone", value)}>
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

                  {/* Active */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">
                      Active<span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.active} onValueChange={(value) => handleChange("active", value)}>
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
                </div>

                {/* Submit Button */}
                <div className="mt-8 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2 bg-[#2563EB] px-6 text-white hover:bg-[#1D4ED8]"
                  >
                    <Save className="h-4 w-4" />
                    {isSubmitting ? "Saving..." : "Save Changes"}
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
