"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Pencil, Plane, Battery, Gauge, Satellite, Wind, Navigation } from "lucide-react"
import { dronesData } from "@/lib/data/drones"

export default function ViewDronePage() {
  const params = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const drone = dronesData.find((d) => d.drone_id === params.id)

  if (!drone) {
    return (
      <div className="flex h-screen flex-col bg-[#1a1a1a]">
        <DashboardHeader activeItem="DRONES" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Plane className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <h2 className="text-xl font-semibold text-white">Drone Not Found</h2>
            <p className="mt-2 text-gray-400">The drone you're looking for doesn't exist.</p>
            <Link href="/drones">
              <Button className="mt-4 bg-[#8B0000] text-white hover:bg-[#6B0000]">Back to Drones</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: typeof drone.status) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-600/20 text-green-400">Connected</Badge>
      case "disconnected":
        return <Badge className="bg-red-600/20 text-red-400">Disconnected</Badge>
      case "maintenance":
        return <Badge className="bg-yellow-600/20 text-yellow-400">Maintenance</Badge>
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader activeItem="DRONES" />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {/* Back Button */}
            <Link href="/drones" className="mb-6 inline-flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Drones
            </Link>

            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#8B0000]">
                  <Plane className="h-7 w-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white">{drone.drone_os_name}</h1>
                    {getStatusBadge(drone.status)}
                  </div>
                  <p className="text-sm text-gray-400">
                    {drone.drone_id} | {drone.drone_type}
                  </p>
                </div>
              </div>
              <Link href={`/drones/${drone.drone_id}/edit`}>
                <Button className="gap-2 bg-[#8B0000] text-white hover:bg-[#6B0000]">
                  <Pencil className="h-4 w-4" />
                  Edit Drone
                </Button>
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-[#333] bg-[#222]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/20">
                    <Gauge className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Max Speed</p>
                    <p className="text-2xl font-bold text-white">{drone.drone_speed} m/s</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#222]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-600/20">
                    <Navigation className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Max Altitude</p>
                    <p className="text-2xl font-bold text-white">{drone.max_altitude}m</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#222]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-600/20">
                    <Battery className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Min Battery</p>
                    <p className="text-2xl font-bold text-white">{drone.min_battery_level}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#222]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600/20">
                    <Wind className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Max Wind</p>
                    <p className="text-2xl font-bold text-white">{drone.max_wind_speed} m/s</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Details Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* General Settings */}
              <Card className="border-[#333] bg-[#222]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Plane className="h-5 w-5" />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Drone ID</span>
                    <span className="font-mono text-white">{drone.drone_id}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">OS Name</span>
                    <span className="text-white">{drone.drone_os_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Drone Type</span>
                    <span className="text-white">{drone.drone_type}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Target Altitude</span>
                    <span className="font-mono text-white">{drone.target_altitude}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">USB Address</span>
                    <span className="font-mono text-white">{drone.usb_address}</span>
                  </div>
                </CardContent>
              </Card>

              {/* GPS Settings */}
              <Card className="border-[#333] bg-[#222]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Satellite className="h-5 w-5" />
                    GPS Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">GPS Name</span>
                    <span className="text-white">{drone.gps_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">GPS Fix</span>
                    <span className="text-white">{drone.gps_fix}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Min HDOP</span>
                    <span className="font-mono text-white">{drone.min_hdop}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Min Sat Count</span>
                    <span className="font-mono text-white">{drone.min_sat_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">GPS Lost Action</span>
                    <span className="text-white">{drone.gps_lost_action}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Safety Settings */}
              <Card className="border-[#333] bg-[#222]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Battery className="h-5 w-5" />
                    Safety Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Min Battery Level</span>
                    <span className="font-mono text-white">{drone.min_battery_level}%</span>
                  </div>
                  <div className="flex justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Battery Fail Safe</span>
                    <span className="text-white">{drone.battery_fail_safe}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Telemetry Lost Action</span>
                    <span className="text-white">{drone.telemetry_lost_action}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Wind Speed</span>
                    <span className="font-mono text-white">{drone.max_wind_speed} m/s</span>
                  </div>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card className="border-[#333] bg-[#222]">
                <CardHeader>
                  <CardTitle className="text-white">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Created At</span>
                    <span className="text-white">{drone.created_at}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    {getStatusBadge(drone.status)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
