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
import { sensorTypes, alarmOptions, statusOptions, sendDroneOptions, activeOptions } from "@/lib/data/sensors"
import { areasData } from "@/lib/data/areas"

export default function AddSensorPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [formData, setFormData] = useState({
    area_id: "",
    sensor_type: "",
    alarm: "",
    name: "",
    sensor_id: "",
    ip_address: "",
    latitude: "",
    longitude: "",
    battery: "",
    status: "",
    send_drone: "",
    active: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // TODO: Replace with actual API call
    console.log("Creating sensor:", formData)

    setIsSubmitting(false)
    router.push("/sensors")
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
            {/* Header with Title and Back Button */}
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-[#4A9FD4]">Add Sensor</h1>
              <Link href="/sensors">
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                  BACK
                </Button>
              </Link>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Form Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Choose Area */}
                <div className="space-y-2">
                  <Label className="text-gray-300">
                    Choose Area:<span className="text-red-500">*</span>
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

                {/* Choose Sensor Type */}
                <div className="space-y-2">
                  <Label className="text-gray-300">
                    Choose Sensor Type:<span className="text-red-500">*</span>
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

                {/* Choose Alarm */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Choose Alarm:</Label>
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
                </div>

                {/* Sensor ID */}
                <div className="space-y-2">
                  <Label htmlFor="sensor_id" className="text-gray-300">
                    Sensor ID:<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="sensor_id"
                    placeholder="Enter unique sensor ID"
                    value={formData.sensor_id}
                    onChange={(e) => handleChange("sensor_id", e.target.value)}
                    required
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                  />
                </div>

                {/* IP Address */}
                <div className="space-y-2">
                  <Label htmlFor="ip_address" className="text-gray-300">
                    IP Address:
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
                    Latitude:<span className="text-red-500">*</span>
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
                    Longitude:<span className="text-red-500">*</span>
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
                    Battery:
                  </Label>
                  <Input
                    id="battery"
                    placeholder="Enter battery status"
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

                {/* Send Drone / Drone Bhejo */}
                <div className="space-y-2">
                  <Label className="text-gray-300">
                    Send Drone / Drone Bhejo:<span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.send_drone} onValueChange={(value) => handleChange("send_drone", value)}>
                    <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#4A9FD4]">
                      <SelectValue placeholder="Auto-launch drone?" />
                    </SelectTrigger>
                    <SelectContent className="border-[#333] bg-[#222]">
                      {sendDroneOptions.map((option) => (
                        <SelectItem key={option} value={option} className="text-white focus:bg-[#333] focus:text-white">
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
                  <Select value={formData.active} onValueChange={(value) => handleChange("active", value)}>
                    <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#4A9FD4]">
                      <SelectValue placeholder="Select Sensor State" />
                    </SelectTrigger>
                    <SelectContent className="border-[#333] bg-[#222]">
                      {activeOptions.map((option) => (
                        <SelectItem key={option} value={option} className="text-white focus:bg-[#333] focus:text-white">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8 flex justify-center">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#2563EB] px-8 text-white hover:bg-[#1D4ED8]"
                >
                  {isSubmitting ? "Submitting..." : "SUBMIT"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
